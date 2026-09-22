# cw-envt-gui.py
# GUI version of cw-envt-updated.py — runs the GA with live visualisation.
# Each creature is evaluated in real time so you can watch it move.
# Runs slower than the headless version; close the window to stop early.

import pybullet as p
import numpy as np
import random
import math
import os
import time
import datetime
import argparse
import csv
import json
import creature
import genome
import population

# Spacebar cycles speed: 0 = REAL-TIME  1 = FAST  2 = TURBO (multi-step)
TOGGLE_KEY = ord(' ')
speed_mode = 2  # start in real-time


# ── Environment builders ──────────────────────────────────────────────────────

def make_arena(pid, arena_size=50, wall_height=3):
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


def run_creature_mountain_gui(cr, pid, iterations=4800, label=""):
    """
    Simulate cr in the mountain environment with live GUI.
        Fitness combines progress + robustness terms:
            base_progress = dist_gain + 2 * z_gain
            step_progress = per-step progress shaping (reward toward peak, penalize drift away)
            anti_stall    = penalty for minimal XY movement
            upright_score = fraction of steps spent upright
            fall_score    = 1 / (1 + number_of_falls)
            stability     = average tilt stability (roll/pitch proxy for CoM stability)
    """
    p.resetSimulation(physicsClientId=pid)
    p.setPhysicsEngineParameter(enableFileCaching=0, physicsClientId=pid)
    p.configureDebugVisualizer(p.COV_ENABLE_GUI, 0, physicsClientId=pid)
    p.setGravity(0, 0, -10, physicsClientId=pid)

    make_arena(pid)
    load_mountain_urdf(pid)

    p.resetDebugVisualizerCamera(
        cameraDistance=40, cameraYaw=35, cameraPitch=-30,
        cameraTargetPosition=[0, 0, 0], physicsClientId=pid)

    # Show iteration/creature label in the viewport
    p.addUserDebugText(label, [0, 0, 6], textColorRGB=[1, 1, 1],
                       textSize=2, physicsClientId=pid)

    xml_file = f'temp_mountain_gui_{os.getpid()}.urdf'
    with open(xml_file, 'w') as f:
        f.write(cr.to_xml())

    try:
        cid = p.loadURDF(xml_file, physicsClientId=pid)
    except Exception:
        return 0.0, 0.0, 0.0

    spawn = [20, -20, 2.5]
    p.resetBasePositionAndOrientation(cid, spawn, [0, 0, 0, 1], physicsClientId=pid)

    # Settle for 120 steps (always fast — no need to watch this)
    for _ in range(120):
        p.stepSimulation(physicsClientId=pid)
    try:
        start_pos, _ = p.getBasePositionAndOrientation(cid, physicsClientId=pid)
    except Exception:
        return 0.0, 0.0, 0.0
    start_dist = np.linalg.norm(np.array(start_pos) - MOUNTAIN_PEAK)
    start_z = start_pos[2]
    prev_dist = start_dist

    motors = cr.get_motors()
    final_dists = []
    final_zs = []
    progress_gain_sum = 0.0
    progress_loss_sum = 0.0
    upright_steps = 0
    fall_count = 0
    was_fallen = False
    tilt_stability_sum = 0.0
    global speed_mode

    sim_step = 0
    while sim_step < iterations:
        # Spacebar cycles through REAL-TIME → FAST → TURBO.
        # Turbo keeps rendering enabled so keyboard events remain responsive.
        keys = p.getKeyboardEvents(physicsClientId=pid)
        if TOGGLE_KEY in keys and keys[TOGGLE_KEY] & p.KEY_WAS_TRIGGERED:
            speed_mode = (speed_mode + 1) % 3
            labels = ["REAL-TIME", "FAST", "TURBO (x8 steps)"]
            print("Speed:", labels[speed_mode])

        if speed_mode == 0:
            time.sleep(1.0 / 240)

        substeps = 1 if speed_mode < 2 else 8
        substeps = min(substeps, iterations - sim_step)
        for _ in range(substeps):
            p.stepSimulation(physicsClientId=pid)
            sim_step += 1

            if sim_step % 24 == 0:
                for jid in range(p.getNumJoints(cid, physicsClientId=pid)):
                    p.setJointMotorControl2(
                        cid, jid,
                        controlMode=p.VELOCITY_CONTROL,
                        targetVelocity=motors[jid].get_output(),
                        force=20,
                        physicsClientId=pid)
            try:
                pos, orn = p.getBasePositionAndOrientation(cid, physicsClientId=pid)
            except Exception:
                return 0.0, 0.0, 0.0

            cur_dist = np.linalg.norm(np.array(pos) - MOUNTAIN_PEAK)
            delta_progress = prev_dist - cur_dist
            if delta_progress > 0:
                progress_gain_sum += delta_progress
            else:
                progress_loss_sum += -delta_progress
            prev_dist = cur_dist

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

            if sim_step >= iterations - 240:
                final_dists.append(np.linalg.norm(np.array(pos) - MOUNTAIN_PEAK))
                final_zs.append(pos[2])

    avg_final_dist = np.mean(final_dists)
    avg_final_z = np.mean(final_zs)
    dist_gain = max(0.0, start_dist - avg_final_dist)
    z_gain = max(0.0, min(avg_final_z, MOUNTAIN_PEAK[2]) - start_z)
    base_progress = dist_gain + 2.0 * z_gain
    step_progress = max(0.0, progress_gain_sum - 0.5 * progress_loss_sum)

    # Anti-stall pressure: creatures that barely move in XY receive a penalty.
    xy_disp = np.linalg.norm(np.array(start_pos[:2]) - np.array(pos[:2]))
    anti_stall_penalty = max(0.0, 1.0 - xy_disp)

    upright_score = upright_steps / iterations
    fall_score = 1.0 / (1.0 + fall_count)
    tilt_score = tilt_stability_sum / iterations
    stability_score = upright_score + fall_score + tilt_score
    overall_fitness = (base_progress * 3.0) + (step_progress * 0.6) + stability_score - anti_stall_penalty

    return overall_fitness, dist_gain, stability_score


# ── GA loop ───────────────────────────────────────────────────────────────────

def run_ga(iterations=100, pop_size=50, gene_count=15,
           seed_csv=None, seed_fraction=0.4, seed_mutation_rate=0.03,
           freeze_gene_count=0, use_template_seed=True, max_links=50,
           elite_count=None, point_mutate_rate=0.1, point_mutate_amount=0.25,
           shrink_mutate_rate=0.1, grow_mutate_rate=0.1, label=None):
    run_id = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    col_name = label if label else run_id
    csv_dir = os.path.join("cw-envt-results", run_id)
    os.makedirs(csv_dir, exist_ok=True)
    print(f"Saving elites to: {csv_dir}")

    pid = p.connect(p.GUI)
    pop = population.Population(pop_size=pop_size, gene_count=gene_count)
    for cr in pop.creatures:
        cr.max_links = max_links

    # Save run parameters so the notebook can identify what each run used.
    params = dict(
        iterations=iterations, pop_size=pop_size, gene_count=gene_count,
        seed_csv=seed_csv, seed_fraction=seed_fraction,
        seed_mutation_rate=seed_mutation_rate, freeze_gene_count=freeze_gene_count,
        use_template_seed=use_template_seed, max_links=max_links,
        elite_count=elite_count, point_mutate_rate=point_mutate_rate,
        point_mutate_amount=point_mutate_amount, shrink_mutate_rate=shrink_mutate_rate,
        grow_mutate_rate=grow_mutate_rate,
    )
    with open(os.path.join(csv_dir, "params.json"), "w") as f:
        json.dump(params, f, indent=2)

    fitness_log_path = os.path.join(csv_dir, "fitness_log.csv")
    with open(fitness_log_path, "w", newline="") as f:
        csv.writer(f).writerow([col_name])

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
            overall_fit, dist_gain, stability_score = run_creature_mountain_gui(cr, pid, label=label)
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

        with open(fitness_log_path, "a", newline="") as f:
            csv.writer(f).writerow([round(float(fits[elite_idx]), 6)])

        fit_map = population.Population.get_fitness_map(fits)
        new_creatures = []
        for _ in range(pop_size):
            p1 = pop.creatures[population.Population.select_parent(fit_map)]
            p2 = pop.creatures[population.Population.select_parent(fit_map)]
            dna = genome.Genome.crossover(p1.dna, p2.dna)
            dna = genome.Genome.point_mutate(dna, rate=point_mutate_rate, amount=point_mutate_amount)
            dna = genome.Genome.shrink_mutate(dna, rate=shrink_mutate_rate)
            dna = genome.Genome.grow_mutate(dna, rate=grow_mutate_rate)

            # Optionally freeze the first N genes to keep a stable base chassis.
            if seed_dna is not None and freeze_gene_count > 0:
                lock_n = min(freeze_gene_count, len(dna), len(seed_dna))
                for gi in range(lock_n):
                    dna[gi] = np.array(seed_dna[gi], copy=True)

            new_cr = creature.Creature(gene_count, max_links=max_links)
            new_cr.update_dna(dna)
            new_creatures.append(new_cr)

        # Elitism — carry the top elite_count creatures forward and save their genomes
        _elite_count = elite_count if elite_count is not None else max(1, pop_size // 10)
        elite_indices = np.argsort(fits)[-_elite_count:][::-1]
        for slot, idx in enumerate(elite_indices):
            cr = pop.creatures[int(idx)]
            elite = creature.Creature(gene_count, max_links=max_links)
            elite.update_dna(cr.dna)
            new_creatures[slot] = elite
            filename = os.path.join(csv_dir, f"elite_{iteration}_{slot}.csv")
            genome.Genome.to_csv(cr.dna, filename)

        pop.creatures = new_creatures

    p.disconnect(pid)
    print("Evolution complete. Number of generations:", iterations, "Population size:", pop_size, "Gene count:", gene_count, "Max links:", max_links)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run the creature GA simulation (GUI mode).")
    parser.add_argument("--iterations",         type=int,   default=50,    help="Number of GA generations")
    parser.add_argument("--pop-size",           type=int,   default=10,    help="Population size")
    parser.add_argument("--gene-count",         type=int,   default=10,    help="Genes per creature")
    parser.add_argument("--seed-csv",           type=str,   default=None,  help="Path to a seed genome CSV")
    parser.add_argument("--seed-fraction",      type=float, default=0.4,   help="Fraction of pop seeded from CSV")
    parser.add_argument("--seed-mutation-rate", type=float, default=0.03,  help="Mutation rate applied to seed")
    parser.add_argument("--freeze-gene-count",  type=int,   default=0,     help="Number of leading genes to freeze")
    parser.add_argument("--no-template-seed",   action="store_false", dest="use_template_seed",
                        help="Disable the built-in template seed")
    parser.add_argument("--max-links",          type=int,   default=50,    help="Max links per creature")
    parser.add_argument("--elite-count",           type=int,   default=None,  help="Elites kept per iteration (default: pop_size // 10)")
    parser.add_argument("--point-mutate-rate",     type=float, default=0.1,   help="Point mutation rate during offspring creation")
    parser.add_argument("--point-mutate-amount",   type=float, default=0.25,  help="Point mutation amount during offspring creation")
    parser.add_argument("--shrink-mutate-rate",    type=float, default=0.1,   help="Shrink mutation rate during offspring creation")
    parser.add_argument("--grow-mutate-rate",      type=float, default=0.1,   help="Grow mutation rate during offspring creation")
    parser.add_argument("--label",                 type=str,   default=None,  help="Column name for fitness_log.csv (defaults to run timestamp)")
    args = parser.parse_args()

    run_ga(
        iterations=args.iterations,
        pop_size=args.pop_size,
        gene_count=args.gene_count,
        seed_csv=args.seed_csv,
        seed_fraction=args.seed_fraction,
        seed_mutation_rate=args.seed_mutation_rate,
        freeze_gene_count=args.freeze_gene_count,
        use_template_seed=args.use_template_seed,
        max_links=args.max_links,
        elite_count=args.elite_count,
        point_mutate_rate=args.point_mutate_rate,
        point_mutate_amount=args.point_mutate_amount,
        shrink_mutate_rate=args.shrink_mutate_rate,
        grow_mutate_rate=args.grow_mutate_rate,
        label=args.label,
    )
