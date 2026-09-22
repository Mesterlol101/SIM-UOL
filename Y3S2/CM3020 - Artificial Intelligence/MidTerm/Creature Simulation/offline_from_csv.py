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

    p.connect(p.DIRECT)
    p.setPhysicsEngineParameter(enableFileCaching=0)
    p.setGravity(0, 0, -10)
    # Arena
    arena_size = 30
    wall_height = 1
    wall_thickness = 0.5
    floor_shape = p.createCollisionShape(p.GEOM_BOX, halfExtents=[arena_size/2, arena_size/2, wall_thickness])
    p.createMultiBody(baseMass=0, baseCollisionShapeIndex=floor_shape, basePosition=[0, 0, -wall_thickness])
    wall_ns = p.createCollisionShape(p.GEOM_BOX, halfExtents=[arena_size/2, wall_thickness/2, wall_height/2])
    p.createMultiBody(baseMass=0, baseCollisionShapeIndex=wall_ns, basePosition=[0,  arena_size/2, wall_height/2])
    p.createMultiBody(baseMass=0, baseCollisionShapeIndex=wall_ns, basePosition=[0, -arena_size/2, wall_height/2])
    wall_ew = p.createCollisionShape(p.GEOM_BOX, halfExtents=[wall_thickness/2, arena_size/2, wall_height/2])
    p.createMultiBody(baseMass=0, baseCollisionShapeIndex=wall_ew, basePosition=[ arena_size/2, 0, wall_height/2])
    p.createMultiBody(baseMass=0, baseCollisionShapeIndex=wall_ew, basePosition=[-arena_size/2, 0, wall_height/2])
    # Mountain
    p.loadURDF("shapes/gaussian_pyramid.urdf", [0, 0, -1], p.getQuaternionFromEuler([0, 0, 0]), useFixedBase=1)
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
    p.resetBasePositionAndOrientation(rob1, [12, 0, 1], [0, 0, 0, 1])

    start_pos, orn = p.getBasePositionAndOrientation(rob1)

    # iterate 
    elapsed_time = 0
    wait_time = 1.0/240 # seconds
    total_time = 30 # seconds
    step = 0
    while True:
        p.stepSimulation()
        step += 1
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
            new_pos, orn = p.getBasePositionAndOrientation(rob1)
            #print(new_pos)
            dist_moved = np.linalg.norm(np.asarray(start_pos) - np.asarray(new_pos))
            print(dist_moved)
        #time.sleep(wait_time)
        elapsed_time += wait_time
        if elapsed_time > total_time:
            break

    print("TOTAL DISTANCE MOVED:", dist_moved)



if __name__ == "__main__":
    assert len(sys.argv) == 2, "Usage: python playback_test.py csv_filename"
    main(sys.argv[1])

