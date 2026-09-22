# cw-envt-updated.py
# Headless version of cw-envt-gui.py — runs the GA without visualisation.
# Faster than the GUI version; useful for long training runs.

import pybullet as p
import numpy as np
import random
import math
import os
import datetime
import creature
import genome
import population


# ── Environment builders ──────────────────────────────────────────────────────

def make_arena(pid, arena_size=50, wall_height=2):
    wall_thickness = 0.5
    floor_shape = p.createCollisionShape(
        p.GEOM_BOX, halfExtents=[arena_size / 2, arena_size / 2, wall_thickness],
        physicsClientId=pid)
    p.createMultiBody(baseMass=0, baseCollisionShapeIndex=floor_shape,
                      basePosition=[0, 0, -wall_thickness], physicsClientId=pid)

    wall_ns = p.createCollisionShape(
        p.GEOM_BOX, halfExtents=[arena_size / 2, wall_thickness / 2, wall_height / 2],
        physicsClientId=pid)
    p.createMultiBody(baseMass=0, baseCollisionShapeIndex=wall_ns,
                      basePosition=[0,  arena_size / 2, wall_height / 2], physicsClientId=pid)
    p.createMultiBody(baseMass=0, baseCollisionShapeIndex=wall_ns,
                      basePosition=[0, -arena_size / 2, wall_height / 2], physicsClientId=pid)

    wall_ew = p.createCollisionShape(
        p.GEOM_BOX, halfExtents=[wall_thickness / 2, arena_size / 2, wall_height / 2],
        physicsClientId=pid)
    p.createMultiBody(baseMass=0, baseCollisionShapeIndex=wall_ew,
                      basePosition=[ arena_size / 2, 0, wall_height / 2], physicsClientId=pid)
    p.createMultiBody(baseMass=0, baseCollisionShapeIndex=wall_ew,
                      basePosition=[-arena_size / 2, 0, wall_height / 2], physicsClientId=pid)


def load_mountain_urdf(pid):
    p.loadURDF("shapes/gaussian_pyramid.urdf", [0, 0, -2],
               p.getQuaternionFromEuler([0, 0, 0]),
               useFixedBase=1, physicsClientId=pid)


# ── Creature simulation ───────────────────────────────────────────────────────

# Mountain peak world position: gaussian height=5, URDF loaded at z=-2 => peak at (0,0,3)
MOUNTAIN_PEAK = np.array([0.0, 0.0, 3.0])


def build_base_template_dna(gene_count):
    """Create a structured starter body DNA to avoid fully random generation-0 morphologies."""
    spec = genome.Genome.get_gene_spec()
    dna = np.array(genome.Genome.get_random_genome(len(spec), gene_count), dtype=float)

    idx = {k: spec[k]["ind"] for k in spec}
    for gi in range(gene_count):
        g = dna[gi]
        is_root = (gi == 0)

        # Conservative, stable body defaults.
        g[idx["link-length"]] = 0.30 if is_root else 0.22
        g[idx["link-radius"]] = 0.20 if is_root else 0.14
        g[idx["link-mass"]] = 0.55 if is_root else 0.35
        g[idx["link-recurrence"]] = 0.0

        # Encourage a simple tree/chain-like structure.
        g[idx["joint-parent"]] = 0.0 if is_root else 0.75
        g[idx["joint-axis-xyz"]] = (gi % 3) / 2.0
        g[idx["joint-origin-xyz-1"]] = 0.2
        g[idx["joint-origin-xyz-2"]] = 0.2
        g[idx["joint-origin-xyz-3"]] = 0.2

        # Prefer smoother motor behavior for initial locomotion.
        g[idx["control-waveform"]] = 0.62
        g[idx["control-amp"]] = 0.45
        g[idx["control-freq"]] = 0.38

    return np.clip(dna, 0.0, 0.9999)


def run_creature_mountain(cr, pid, iterations=2400):
    """
    Simulate cr in the mountain environment (headless).
        Fitness combines progress + robustness terms:
            base_progress = dist_gain + 2 * z_gain
            upright_score = fraction of steps spent upright
            fall_score    = 1 / (1 + number_of_falls)
            stability     = average tilt stability (roll/pitch proxy for CoM stability)
    """
    p.resetSimulation(physicsClientId=pid)
    p.setPhysicsEngineParameter(enableFileCaching=0, physicsClientId=pid)
    p.setGravity(0, 0, -10, physicsClientId=pid)

    make_arena(pid)
    load_mountain_urdf(pid)

    xml_file = 'temp_mountain.urdf'
    with open(xml_file, 'w') as f:
        f.write(cr.to_xml())

    try:
        cid = p.loadURDF(xml_file, physicsClientId=pid)
    except Exception:
        return 0.0, 0.0, 0.0

    spawn = random.choice([[20, 20, 1], [20, -20, 1], [-20, 20, 1], [-20, -20, 1]])
    p.resetBasePositionAndOrientation(cid, spawn, [0, 0, 0, 1], physicsClientId=pid)

    # Settle for 120 steps then record starting distance to peak
    for _ in range(120):
        p.stepSimulation(physicsClientId=pid)
    try:
        start_pos, _ = p.getBasePositionAndOrientation(cid, physicsClientId=pid)
    except Exception:
        return 0.0, 0.0, 0.0
    start_dist = np.linalg.norm(np.array(start_pos) - MOUNTAIN_PEAK)
    start_z = start_pos[2]

    motors = cr.get_motors()
    final_dists = []
    final_zs = []
    upright_steps = 0
    fall_count = 0
    was_fallen = False
    tilt_stability_sum = 0.0

    for step in range(iterations):
        p.stepSimulation(physicsClientId=pid)
        if step % 24 == 0:
            for jid in range(p.getNumJoints(cid, physicsClientId=pid)):
                p.setJointMotorControl2(
                    cid, jid,
                    controlMode=p.VELOCITY_CONTROL,
                    targetVelocity=motors[jid].get_output(),
                    force=5,
                    physicsClientId=pid)
        try:
            pos, orn = p.getBasePositionAndOrientation(cid, physicsClientId=pid)
        except Exception:
            return 0.0, 0.0, 0.0

        roll, pitch, _ = p.getEulerFromQuaternion(orn)
        upright_now = (abs(roll) < 0.8 and abs(pitch) < 0.8 and pos[2] > 0.35)
        if upright_now:
            upright_steps += 1

        # Roll/pitch as a practical CoM stability proxy.
        tilt_mag = min(1.0, (abs(roll) + abs(pitch)) / math.pi)
        tilt_stability_sum += (1.0 - tilt_mag)

        fallen_now = pos[2] < 0.2
        if fallen_now and not was_fallen:
            fall_count += 1
        was_fallen = fallen_now

        if step >= iterations - 240:
            final_dists.append(np.linalg.norm(np.array(pos) - MOUNTAIN_PEAK))
            final_zs.append(pos[2])

    avg_final_dist = np.mean(final_dists)
    avg_final_z = np.mean(final_zs)
    dist_gain = max(0.0, start_dist - avg_final_dist)
    z_gain = max(0.0, min(avg_final_z, MOUNTAIN_PEAK[2]) - start_z)
    base_progress = dist_gain + 2.0 * z_gain

    upright_score = upright_steps / iterations
    fall_score = 1.0 / (1.0 + fall_count)
    tilt_score = tilt_stability_sum / iterations
    stability_score = (2.0 * upright_score) + fall_score + tilt_score
    overall_fitness = base_progress + stability_score

    return overall_fitness, dist_gain, stability_score


# ── GA loop ───────────────────────────────────────────────────────────────────

def run_ga(iterations=10000, pop_size=30, gene_count=5,
           seed_csv=None, seed_fraction=0.4, seed_mutation_rate=0.03,
           freeze_gene_count=0, use_template_seed=True):
    run_id = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    csv_dir = os.path.join("cw-envt-results", run_id)
    os.makedirs(csv_dir, exist_ok=True)
    print(f"Saving elites to: {csv_dir}")

    pid = p.connect(p.DIRECT)
    pop = population.Population(pop_size=pop_size, gene_count=gene_count)

    # Optional seed genome for guided evolution.
    # seed_csv: path to a CSV genome to initialize part of generation 0.
    # seed_fraction: fraction of population initialized from seed variants.
    # seed_mutation_rate: small perturbation rate for seed variants.
    # freeze_gene_count: first N genes locked to seed during offspring creation.
    seed_dna = None
    if seed_csv and os.path.exists(seed_csv):
        seed_dna = np.array(genome.Genome.from_csv(seed_csv), dtype=float)
        seed_n = max(1, int(pop_size * seed_fraction))
        seed_n = min(seed_n, pop_size)
        for i in range(seed_n):
            dna = genome.Genome.point_mutate(seed_dna, rate=seed_mutation_rate, amount=0.1)
            pop.creatures[i].update_dna(dna)
        print(f"Seeded {seed_n}/{pop_size} creatures from base genome: {seed_csv}")
    elif seed_csv:
        print(f"Seed CSV not found, using fully random init: {seed_csv}")
    elif use_template_seed:
        seed_dna = build_base_template_dna(gene_count)
        seed_n = max(1, int(pop_size * seed_fraction))
        seed_n = min(seed_n, pop_size)
        for i in range(seed_n):
            dna = genome.Genome.point_mutate(seed_dna, rate=seed_mutation_rate, amount=0.1)
            pop.creatures[i].update_dna(dna)
        print(f"Seeded {seed_n}/{pop_size} creatures from built-in base template")

    for iteration in range(iterations):
        fits = []
        dist_gains = []
        stability_scores = []
        for idx, cr in enumerate(pop.creatures):
            cr.update_dna(cr.dna)
            label = f"Iteration {iteration}  Creature {idx + 1}/{pop_size}"
            print(label)
            overall_fit, dist_gain, stability_score = run_creature_mountain(cr, pid)
            fits.append(overall_fit)
            dist_gains.append(dist_gain)
            stability_scores.append(stability_score)

        fits = np.array(fits)
        dist_gains = np.array(dist_gains)
        stability_scores = np.array(stability_scores)
        elite_idx = int(np.argmax(fits))
        elite_links = len(pop.creatures[elite_idx].get_expanded_links())
        print(f"{iteration}  elite_fitness: {np.round(fits[elite_idx], 3)}"
              f"  elite_dist_to_peak_gained: {np.round(dist_gains[elite_idx], 3)}"
              f"  elite_stability: {np.round(stability_scores[elite_idx], 3)}"
              f"  elite_links: {elite_links}")

        fit_map = population.Population.get_fitness_map(fits)
        new_creatures = []
        for _ in range(pop_size):
            p1 = pop.creatures[population.Population.select_parent(fit_map)]
            p2 = pop.creatures[population.Population.select_parent(fit_map)]
            dna = genome.Genome.crossover(p1.dna, p2.dna)
            dna = genome.Genome.point_mutate(dna, rate=0.1, amount=0.25)
            dna = genome.Genome.shrink_mutate(dna, rate=0.1)
            dna = genome.Genome.grow_mutate(dna, rate=0.1)

            # Optionally freeze the first N genes to keep a stable base chassis.
            if seed_dna is not None and freeze_gene_count > 0:
                lock_n = min(freeze_gene_count, len(dna), len(seed_dna))
                for gi in range(lock_n):
                    dna[gi] = np.array(seed_dna[gi], copy=True)

            new_cr = creature.Creature(1)
            new_cr.update_dna(dna)
            new_creatures.append(new_cr)

        # Elitism — carry the top pop_size/5 creatures forward and save their genomes
        elite_count = max(1, pop_size // 5)
        elite_indices = np.argsort(fits)[-elite_count:][::-1]
        for slot, idx in enumerate(elite_indices):
            cr = pop.creatures[int(idx)]
            elite = creature.Creature(1)
            elite.update_dna(cr.dna)
            new_creatures[slot] = elite
            filename = os.path.join(csv_dir, f"elite_{iteration}_{slot}.csv")
            genome.Genome.to_csv(cr.dna, filename)

        pop.creatures = new_creatures

    p.disconnect(pid)
    print("Evolution complete.")


if __name__ == "__main__":
    run_ga()
