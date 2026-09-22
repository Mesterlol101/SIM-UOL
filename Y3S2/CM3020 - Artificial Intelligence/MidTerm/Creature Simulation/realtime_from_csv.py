import os 
import genome
import sys
import creature
import pybullet as p
import time 
import random
import numpy as np

## ... usual starter code to create a sim and floor
def main(csv_file):
    assert os.path.exists(csv_file), "Tried to load " + csv_file + " but it does not exists"

    p.connect(p.GUI)
    p.setPhysicsEngineParameter(enableFileCaching=0)
    p.configureDebugVisualizer(p.COV_ENABLE_GUI, 0)
    p.setGravity(0, 0, -10)
    # Arena
    arena_size = 50
    wall_height = 2
    wall_thickness = 0.5
    floor_shape = p.createCollisionShape(p.GEOM_BOX, halfExtents=[arena_size/2, arena_size/2, wall_thickness])
    p.createMultiBody(baseMass=0, baseCollisionShapeIndex=floor_shape, basePosition=[0, 0, -wall_thickness])
    wall_ns = p.createCollisionShape(p.GEOM_BOX, halfExtents=[arena_size/2, wall_thickness/2, wall_height/2])
    p.createMultiBody(baseMass=0, baseCollisionShapeIndex=wall_ns, basePosition=[0,  arena_size/2, wall_height/2])
    p.createMultiBody(baseMass=0, baseCollisionShapeIndex=wall_ns, basePosition=[0, -arena_size/2, wall_height/2])
    wall_ew = p.createCollisionShape(p.GEOM_BOX, halfExtents=[wall_thickness/2, arena_size/2, wall_height/2])
    p.createMultiBody(baseMass=0, baseCollisionShapeIndex=wall_ew, basePosition=[ arena_size/2, 0, wall_height/2])
    p.createMultiBody(baseMass=0, baseCollisionShapeIndex=wall_ew, basePosition=[-arena_size/2, 0, wall_height/2])
    # Mountain (same placement as cw-envt files)
    p.loadURDF("shapes/gaussian_pyramid.urdf", [0, 0, -2], p.getQuaternionFromEuler([0, 0, 0]), useFixedBase=1)
    # Camera: looking at the arena from a raised angle
    p.resetDebugVisualizerCamera(cameraDistance=40, cameraYaw=45, cameraPitch=-30, cameraTargetPosition=[0, 0, 0])
#   p.setRealTimeSimulation(1)


    # generate a random creature
    cr = creature.Creature(gene_count=1)
    dna = genome.Genome.from_csv(csv_file)
    cr.update_dna(dna)
    # save it to XML
    with open('test.urdf', 'w') as f:
        f.write(cr.to_xml())
    # load it into the sim
    rob1 = p.loadURDF('test.urdf')
    # air drop it
    spawn = random.choice([[20, 20, 1]])
    p.resetBasePositionAndOrientation(rob1, spawn, [0, 0, 0, 3])
    # Settle for 120 steps then record starting distance to peak
    for _ in range(120):
        p.stepSimulation()
    start_pos, orn = p.getBasePositionAndOrientation(rob1)
    mountain_peak = np.array([0.0, 0.0, 3.0])
    start_dist = np.linalg.norm(np.array(start_pos) - mountain_peak)

    # iterate — 2400 steps to match GA evaluation length (10s at 240fps)
    wait_time = 1.0/240 # seconds
    total_steps = 2400
    step = 0
    recent_dists = []
    while step < total_steps:
        p.stepSimulation()
        step += 1
        new_pos, orn = p.getBasePositionAndOrientation(rob1)
        cur_dist = np.linalg.norm(np.array(new_pos) - mountain_peak)
        # Collect last 240 steps for rolling average (matches GA fitness window)
        recent_dists.append(cur_dist)
        if len(recent_dists) > 240:
            recent_dists.pop(0)
        if step % 24 == 0:
            motors = cr.get_motors()
            assert len(motors) == p.getNumJoints(rob1), "Something went wrong"
            for jid in range(p.getNumJoints(rob1)):
                mode = p.VELOCITY_CONTROL
                vel = motors[jid].get_output()
                p.setJointMotorControl2(rob1, 
                            jid,  
                            controlMode=mode, 
                            targetVelocity=vel)
            avg_dist = np.mean(recent_dists)
            dist_to_peak_gained = max(0.0, start_dist - avg_dist)
            print(f"step {step}/{total_steps}  dist to peak gained (avg): {round(dist_to_peak_gained, 4)}")
        time.sleep(wait_time)

    final_score = max(0.0, start_dist - np.mean(recent_dists))
    print("FINAL DIST TO PEAK GAINED:", round(final_score, 4))



if __name__ == "__main__":
    assert len(sys.argv) == 2, "Usage: python playback_test.py csv_filename"
    main(sys.argv[1])

