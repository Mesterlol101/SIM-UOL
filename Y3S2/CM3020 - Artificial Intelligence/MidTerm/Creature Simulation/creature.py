import genome 
from xml.dom.minidom import getDOMImplementation
from enum import Enum
import numpy as np

class MotorType(Enum):
    PULSE = 1
    SINE = 2
    TRIANGLE = 3
    SAW = 4
    RANDOM_WALK = 5
    BURST = 6

class Motor:
    def __init__(self, control_waveform, control_amp, control_freq):
        self.control_waveform = float(np.clip(control_waveform, 0.0, 1.0))

        # Keep outputs near legacy scale while letting amp/freq adapt over time.
        self.base_amp = 0.5 + float(np.clip(control_amp, 0.5, 1.0))
        self.base_freq = 0.05 + 0.75 * float(np.clip(control_freq, 0.0, 1.0))

        self.phase = 0
        self.random_state = 0.0
        self.fatigue = 0.0

        self.waveforms = [
            MotorType.PULSE,
            MotorType.SINE,
            MotorType.TRIANGLE,
            MotorType.SAW,
            MotorType.RANDOM_WALK,
            MotorType.BURST,
        ]

    def _weights(self):
        # Keep legacy-like behavior in lower range, then open richer waveform blends.
        w = self.control_waveform

        if w <= 0.45:
            return [(MotorType.PULSE, 1.0)]

        if w < 0.55:
            t = (w - 0.45) / 0.10
            return [(MotorType.PULSE, 1.0 - t), (MotorType.SINE, t)]

        if w <= 0.70:
            return [(MotorType.SINE, 1.0)]

        if w < 0.80:
            t = (w - 0.70) / 0.10
            return [(MotorType.SINE, 1.0 - t), (MotorType.TRIANGLE, t)]

        if w <= 0.88:
            return [(MotorType.TRIANGLE, 1.0)]

        if w < 0.94:
            t = (w - 0.88) / 0.06
            return [(MotorType.TRIANGLE, 1.0 - t), (MotorType.SAW, t)]

        if w <= 0.97:
            return [(MotorType.SAW, 1.0)]

        if w < 0.99:
            t = (w - 0.97) / 0.02
            return [(MotorType.SAW, 1.0 - t), (MotorType.RANDOM_WALK, t)]

        t = (w - 0.99) / 0.01
        return [(MotorType.RANDOM_WALK, 1.0 - t), (MotorType.BURST, t)]

    def _wave_output(self, wave_type):
        if wave_type == MotorType.PULSE:
            return 1.0 if self.phase < np.pi else -1.0

        if wave_type == MotorType.SINE:
            return float(np.sin(self.phase))

        if wave_type == MotorType.TRIANGLE:
            # Triangle in [-1, 1].
            return float((2.0 / np.pi) * np.arcsin(np.sin(self.phase)))

        if wave_type == MotorType.SAW:
            # Sawtooth ramp in [-1, 1).
            return float((self.phase / np.pi) - 1.0)

        if wave_type == MotorType.RANDOM_WALK:
            self.random_state = 0.95 * self.random_state + 0.05 * np.random.uniform(-1.0, 1.0)
            self.random_state = float(np.clip(self.random_state, -1.0, 1.0))
            return self.random_state

        # BURST pattern: short pulse sequence then quiet phase.
        phi = self.phase / (2.0 * np.pi)
        if phi < 0.12:
            return 1.0
        if phi < 0.24:
            return -1.0
        if phi < 0.36:
            return 0.6
        return 0.0

    def get_output(self):
        # Adaptive control: fatigue lowers amplitude/frequency, then slowly recovers.
        energy = 1.0 - self.fatigue
        adaptive_amp = self.base_amp * (0.5 + 1.0 * energy)
        adaptive_freq = self.base_freq * (0.7 + 0.6 * energy)
        adaptive_freq = max(0.02, adaptive_freq)

        self.phase = (self.phase + adaptive_freq) % (np.pi * 2)

        output = 0.0
        for wave_type, weight in self._weights():
            output += weight * self._wave_output(wave_type)

        # Small exploratory perturbation tied to motor-internal random state.
        output += 0.05 * self.random_state
        output *= adaptive_amp
        output = float(np.clip(output, -5.0, 5.0))

        # Fatigue accumulates with effort and recovers gradually.
        self.fatigue = float(np.clip(self.fatigue + 0.015 * abs(output) - 0.005, 0.0, 1.0))

        return output 

class Creature:
    def __init__(self, gene_count, max_links=None):
        self.spec = genome.Genome.get_gene_spec()
        self.dna = genome.Genome.get_random_genome(len(self.spec), gene_count)
        self.max_links = max_links
        self.flat_links = None
        self.exp_links = None
        self.motors = None
        self.start_position = None
        self.last_position = None

    def get_flat_links(self):
        if self.flat_links == None:
            gdicts = genome.Genome.get_genome_dicts(self.dna, self.spec)
            self.flat_links = genome.Genome.genome_to_links(gdicts)
        return self.flat_links
    
    def get_expanded_links(self):
        self.get_flat_links()
        if self.exp_links is not None:
            return self.exp_links
        
        exp_links = [self.flat_links[0]]
        genome.Genome.expandLinks(self.flat_links[0], 
                                self.flat_links[0].name, 
                                self.flat_links, 
                                exp_links,
                                max_links=self.max_links)
        self.exp_links = exp_links
        return self.exp_links

    def to_xml(self):
        self.get_expanded_links()
        domimpl = getDOMImplementation()
        adom = domimpl.createDocument(None, "start", None)
        robot_tag = adom.createElement("robot")
        for link in self.exp_links:
            robot_tag.appendChild(link.to_link_element(adom))
        first = True
        for link in self.exp_links:
            if first:# skip the root node! 
                first = False
                continue
            robot_tag.appendChild(link.to_joint_element(adom))
        robot_tag.setAttribute("name", "pepe") #  choose a name!
        return '<?xml version="1.0"?>' + robot_tag.toprettyxml()

    def get_motors(self):
        self.get_expanded_links()
        if self.motors == None:
            motors = []
            for i in range(1, len(self.exp_links)):
                l = self.exp_links[i]
                m = Motor(l.control_waveform, l.control_amp,  l.control_freq)
                motors.append(m)
            self.motors = motors 
        return self.motors 
    
    def update_position(self, pos):
        if self.start_position == None:
            self.start_position = pos
        else:
            self.last_position = pos

    def get_distance_travelled(self):
        if self.start_position is None or self.last_position is None:
            return 0
        p1 = np.asarray(self.start_position)
        p2 = np.asarray(self.last_position)
        dist = np.linalg.norm(p1-p2)
        return dist 

    def update_dna(self, dna):
        self.dna = dna
        self.flat_links = None
        self.exp_links = None
        self.motors = None
        self.start_position = None
        self.last_position = None