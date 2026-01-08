import numpy as np
import matplotlib.pyplot as plt
from scipy.io import wavfile
from scipy.signal import hilbert
import sounddevice as sd
import os

class SuspiciousDataDetector:
    
    def __init__(self, audio_folder='Ex3_files'):
        self.audio_folder = audio_folder
        # Frequencies above 18kHz considered ultrasonic
        self.ultrasonic_threshold = 18000  
        self.suspicious_file = None
        self.secret_code_audio = None
        self.sample_rate = None
        
    def load_audio_file(self, filename):
        filepath = os.path.join(self.audio_folder, filename)
        sample_rate, audio_data = wavfile.read(filepath)
        
        # Convert to mono if stereo
        if len(audio_data.shape) > 1:
            audio_data = np.mean(audio_data, axis=1)
            
        # Normalize to [-1, 1]
        audio_data = audio_data.astype(float) / np.max(np.abs(audio_data))
        
        return sample_rate, audio_data
    
    def analyze_frequency_spectrum(self, audio_data, sample_rate):
        # Compute FFT
        n = len(audio_data)
        fft_data = np.fft.fft(audio_data)
        frequencies = np.fft.fftfreq(n, 1/sample_rate)
        
        # Take only positive frequencies
        positive_freq_idx = frequencies >= 0
        frequencies = frequencies[positive_freq_idx]
        magnitude_spectrum = np.abs(fft_data[positive_freq_idx])
        
        return frequencies, magnitude_spectrum
    
    def detect_ultrasonic_content(self, magnitude_spectrum, frequencies):
        # Find ultrasonic frequency indices
        ultrasonic_idx = frequencies > self.ultrasonic_threshold
        
        # Calculate energy in ultrasonic range
        ultrasonic_energy = np.sum(magnitude_spectrum[ultrasonic_idx] ** 2)
        
        # Calculate total energy for normalization
        total_energy = np.sum(magnitude_spectrum ** 2)
        
        # Return ratio of ultrasonic to total energy
        return ultrasonic_energy / total_energy if total_energy > 0 else 0
    
    def scan_all_files(self, visualize=True):
        audio_files = [f for f in os.listdir(self.audio_folder) if f.endswith('.wav')]
        audio_files.sort()
        
        print("SUSPICIOUS DATA DETECTOR - Ultrasonic Analysis")
        print(f"\nScanning {len(audio_files)} audio files...\n")
        
        results = {}
        
        if visualize:
            fig, axes = plt.subplots(len(audio_files), 1, figsize=(12, 3*len(audio_files)))
            if len(audio_files) == 1:
                axes = [axes]
        
        for idx, filename in enumerate(audio_files):
            sample_rate, audio_data = self.load_audio_file(filename)
            frequencies, magnitude_spectrum = self.analyze_frequency_spectrum(audio_data, sample_rate)
            ultrasonic_ratio = self.detect_ultrasonic_content(magnitude_spectrum, frequencies)
            
            results[filename] = {
                'ratio': ultrasonic_ratio,
                'sample_rate': sample_rate,
                'audio_data': audio_data,
                'frequencies': frequencies,
                'spectrum': magnitude_spectrum
            }
            
            print(f"{filename:20s} - Ultrasonic energy ratio: {ultrasonic_ratio:.6f}")
            
            if visualize:
                ax = axes[idx]
                ax.plot(frequencies, magnitude_spectrum)
                ax.axvline(x=self.ultrasonic_threshold, color='r', linestyle='--', 
                          label=f'Ultrasonic threshold ({self.ultrasonic_threshold} Hz)')
                ax.set_xlabel('Frequency (Hz)')
                ax.set_ylabel('Magnitude')
                ax.set_title(f'{filename} - Spectrum (Ultrasonic ratio: {ultrasonic_ratio:.6f})')
                ax.legend()
                ax.grid(True, alpha=0.3)
        
        if visualize:
            plt.tight_layout()
            plt.show()
        
        # Find the file with highest ultrasonic content
        self.suspicious_file = max(results.items(), key=lambda x: x[1]['ratio'])[0]
        
        print("\n")
        print(f"SUSPICIOUS FILE DETECTED: {self.suspicious_file}")
        print(f"Ultrasonic energy ratio: {results[self.suspicious_file]['ratio']:.6f}")
        print("\n")
        
        return self.suspicious_file, results
    
    def demodulate_secret_code(self, audio_data, sample_rate, carrier_freq=None):
        # Extract ultrasonic component using high-pass filter
        from scipy.signal import butter, filtfilt
        
        # High-pass filter to isolate ultrasonic frequencies
        nyquist = sample_rate / 2
        high_cutoff = self.ultrasonic_threshold / nyquist
        
        if high_cutoff >= 1.0:
            high_cutoff = 0.99
        
        b, a = butter(4, high_cutoff, btype='high')
        ultrasonic_signal = filtfilt(b, a, audio_data)
        
        # Envelope detection using Hilbert transform
        analytic_signal = hilbert(ultrasonic_signal)
        envelope = np.abs(analytic_signal)
        
        # Low-pass filter the envelope to get the baseband signal
        low_cutoff = 5000 / nyquist 
        if low_cutoff >= 1.0:
            low_cutoff = 0.99
            
        b_low, a_low = butter(4, low_cutoff, btype='low')
        demodulated = filtfilt(b_low, a_low, envelope)
        
        # Normalize
        demodulated = demodulated / np.max(np.abs(demodulated))
        
        # Remove DC component
        demodulated = demodulated - np.mean(demodulated)
        
        return demodulated
    
    def extract_and_play_secret_code(self, visualize=True, play_audio=True):
        if self.suspicious_file is None:
            print("Error: No suspicious file detected. Run scan_all_files() first.")
            return
        
        print(f"\nExtracting secret code from {self.suspicious_file}...")
        
        sample_rate, audio_data = self.load_audio_file(self.suspicious_file)
        self.sample_rate = sample_rate
        
        # Demodulate the secret code
        self.secret_code_audio = self.demodulate_secret_code(audio_data, sample_rate)
        
        print(f"Secret code extracted successfully!")
        print(f"Duration: {len(self.secret_code_audio) / sample_rate:.2f} seconds")
        
        if visualize:
            self.visualize_extraction(audio_data, self.secret_code_audio, sample_rate)
        
        if play_audio:
            print("\nPlaying secret code...")
            # Amplify for better audibility
            playback_audio = self.secret_code_audio * 0.5
            sd.play(playback_audio, sample_rate)
            sd.wait()
            print("Playback complete!")
        
        return self.secret_code_audio
    
    def visualize_extraction(self, original_audio, demodulated_audio, sample_rate):
        fig, axes = plt.subplots(3, 2, figsize=(14, 10))
        
        # Time arrays
        time_original = np.arange(len(original_audio)) / sample_rate
        time_demod = np.arange(len(demodulated_audio)) / sample_rate
        
        # Original signal - time domain
        axes[0, 0].plot(time_original, original_audio)
        axes[0, 0].set_xlabel('Time (s)')
        axes[0, 0].set_ylabel('Amplitude')
        axes[0, 0].set_title('Original Signal - Time Domain')
        axes[0, 0].grid(True, alpha=0.3)
        
        # Original signal - frequency domain
        freqs_orig, spectrum_orig = self.analyze_frequency_spectrum(original_audio, sample_rate)
        axes[0, 1].plot(freqs_orig, spectrum_orig)
        axes[0, 1].axvline(x=self.ultrasonic_threshold, color='r', linestyle='--', 
                          label='Ultrasonic threshold')
        axes[0, 1].set_xlabel('Frequency (Hz)')
        axes[0, 1].set_ylabel('Magnitude')
        axes[0, 1].set_title('Original Signal - Frequency Spectrum')
        axes[0, 1].legend()
        axes[0, 1].grid(True, alpha=0.3)
        
        # Demodulated signal - time domain
        axes[1, 0].plot(time_demod, demodulated_audio)
        axes[1, 0].set_xlabel('Time (s)')
        axes[1, 0].set_ylabel('Amplitude')
        axes[1, 0].set_title('Demodulated Secret Code - Time Domain')
        axes[1, 0].grid(True, alpha=0.3)
        
        # Demodulated signal - frequency domain
        freqs_demod, spectrum_demod = self.analyze_frequency_spectrum(demodulated_audio, sample_rate)
        axes[1, 1].plot(freqs_demod, spectrum_demod)
        axes[1, 1].set_xlabel('Frequency (Hz)')
        axes[1, 1].set_ylabel('Magnitude')
        axes[1, 1].set_title('Demodulated Secret Code - Frequency Spectrum')
        axes[1, 1].grid(True, alpha=0.3)
        
        # Zoomed ultrasonic region of original
        ultrasonic_mask = freqs_orig > self.ultrasonic_threshold
        axes[2, 0].plot(freqs_orig[ultrasonic_mask], spectrum_orig[ultrasonic_mask])
        axes[2, 0].set_xlabel('Frequency (Hz)')
        axes[2, 0].set_ylabel('Magnitude')
        axes[2, 0].set_title('Original Signal - Ultrasonic Region (Zoomed)')
        axes[2, 0].grid(True, alpha=0.3)
        
        # Zoomed audible region of demodulated
        audible_mask = freqs_demod < 5000
        axes[2, 1].plot(freqs_demod[audible_mask], spectrum_demod[audible_mask])
        axes[2, 1].set_xlabel('Frequency (Hz)')
        axes[2, 1].set_ylabel('Magnitude')
        axes[2, 1].set_title('Demodulated Signal - Audible Region')
        axes[2, 1].grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.show()
    
    def save_secret_code(self, output_filename='secret_code.wav'):
        if self.secret_code_audio is None:
            print("Error: No secret code extracted. Run extract_and_play_secret_code() first.")
            return
        
        output_path = os.path.join(self.audio_folder, output_filename)
        
        # Convert to int16 for WAV file
        audio_int16 = (self.secret_code_audio * 32767).astype(np.int16)
        
        wavfile.write(output_path, self.sample_rate, audio_int16)
        print(f"\nSecret code saved to: {output_path}")


def main():
    print("EXERCISE 3.1: SUSPICIOUS AUDIO DATA DETECTOR")
    
    # Initialize detector
    detector = SuspiciousDataDetector()
    
    # Step 1: Scan all files for ultrasonic content
    suspicious_file, results = detector.scan_all_files(visualize=True)
    
    # Step 2: Extract and play the secret code
    detector.extract_and_play_secret_code(visualize=True, play_audio=True)
    
    # Step 3: Save the extracted secret code
    detector.save_secret_code('secret_code_extracted.wav')
    
    print("ANALYSIS COMPLETE")


if __name__ == "__main__":
    main()
