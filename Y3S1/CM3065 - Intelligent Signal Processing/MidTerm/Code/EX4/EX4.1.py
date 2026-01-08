
import os
import json
import wave
import numpy as np
from scipy.io import wavfile
from scipy import signal
import difflib

# Import Vosk for offline ASR
try:
    from vosk import Model, KaldiRecognizer
except ImportError:
    print("ERROR: Vosk library not installed.")
    print("Please install it using: pip install vosk")
    print("Also download models from: https://alphacephei.com/vosk/models")
    exit(1)


class ASRSystem:
    
    def __init__(self):
        self.models = {}
        self.model_paths = {
            'en': 'models/vosk-model-small-en-us-0.15',
            'es': 'models/vosk-model-small-es-0.42',
            'it': 'models/vosk-model-small-it-0.22'
        }
        
        # Expected transcriptions for evaluation
        self.transcriptions = {
            'en': {
                'suitcase.wav': 'where is my suitcase',
                'checkin.wav': 'where is the check in',
                'parents.wav': 'my parents are waiting for me outside',
                'what_time.wav': 'what time does the flight leave',
                'where.wav': 'where is the boarding gate'
            },
            'es': {
                'suitcase_es.wav': 'donde esta mi maleta',
                'checkin_es.wav': 'donde esta el mostrador de facturacion',
                'parents_es.wav': 'mis padres me estan esperando fuera',
                'what_time_es.wav': 'a que hora sale el vuelo',
                'where_es.wav': 'donde esta la puerta de embarque'
            },
            'it': {
                'suitcase_it.wav': 'dove e la mia valigia',
                'checkin_it.wav': 'dove e il banco del check in',
                'parents_it.wav': 'i miei genitori mi stanno aspettando fuori',
                'what_time_it.wav': 'a che ora parte il volo',
                'where_it.wav': 'dove e il gate di imbarco'
            }
        }
    
    def load_model(self, language):
        """Load Vosk model for specified language"""
        if language in self.models:
            return self.models[language]
        
        model_path = self.model_paths.get(language)
        if not model_path or not os.path.exists(model_path):
            print(f"WARNING: Model for '{language}' not found at {model_path}")
            print(f"Please download from: https://alphacephei.com/vosk/models")
            return None
        
        print(f"Loading {language} model from {model_path}...")
        self.models[language] = Model(model_path)
        return self.models[language]
    
    def preprocess_audio(self, audio_path, apply_filtering=True):
        # Read the audio file
        sample_rate, audio_data = wavfile.read(audio_path)
        
        # Convert to float for processing
        if audio_data.dtype == np.int16:
            audio_float = audio_data.astype(np.float32) / 32768.0
        else:
            audio_float = audio_data.astype(np.float32)
        
        if not apply_filtering:
            return sample_rate, audio_float
        
        # 1. Apply gain/amplification (normalize to use full dynamic range)
        max_val = np.max(np.abs(audio_float))
        if max_val > 0:
            audio_float = audio_float / max_val * 0.9
        
        # 2. Low-pass filter to remove high-frequency noise
        # Design a Butterworth low-pass filter
        nyquist = sample_rate / 2
        cutoff = 3000
        normalized_cutoff = cutoff / nyquist
        
        # Design filter
        b, a = signal.butter(4, normalized_cutoff, btype='low')
        audio_filtered = signal.filtfilt(b, a, audio_float)
        
        # 3. Simple noise reduction using spectral subtraction (basic version)
        # Estimate noise from first 0.1 seconds (assuming initial silence)
        noise_duration = int(0.1 * sample_rate)
        if len(audio_filtered) > noise_duration:
            noise_profile = np.mean(np.abs(audio_filtered[:noise_duration]))
            # Subtract noise floor
            audio_filtered = np.where(np.abs(audio_filtered) > noise_profile * 1.5, 
                                     audio_filtered, 
                                     audio_filtered * 0.3)
        
        return sample_rate, audio_filtered
    
    def recognize_speech(self, audio_path, language='en', apply_filtering=True):
        # Load appropriate model
        model = self.load_model(language)
        if model is None:
            return "[MODEL NOT AVAILABLE]"
        
        # Preprocess audio
        sample_rate, audio_data = self.preprocess_audio(audio_path, apply_filtering)
        
        # Convert back to int16 for Vosk
        audio_int16 = (audio_data * 32768.0).astype(np.int16)
        
        # Create recognizer
        recognizer = KaldiRecognizer(model, sample_rate)
        recognizer.SetWords(True)
        
        # Process audio
        recognizer.AcceptWaveform(audio_int16.tobytes())
        result = json.loads(recognizer.FinalResult())
        
        recognized_text = result.get('text', '').lower().strip()
        return recognized_text
    
    # Calculate Word Error Rate (WER)
    def calculate_wer(self, reference, hypothesis):

        ref_words = reference.lower().split()
        hyp_words = hypothesis.lower().split()
        
        # Use difflib to find the edit operations
        matcher = difflib.SequenceMatcher(None, ref_words, hyp_words)
        
        substitutions = 0
        deletions = 0
        insertions = 0
        
        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == 'replace':
                # Substitutions (min of the two ranges)
                substitutions += max(i2 - i1, j2 - j1)
            elif tag == 'delete':
                deletions += i2 - i1
            elif tag == 'insert':
                insertions += j2 - j1
        
        # Number of words in reference
        N = len(ref_words)
        
        if N == 0:
            return 0.0 if len(hyp_words) == 0 else 100.0
        
        wer = ((substitutions + deletions + insertions) / N) * 100
        return wer
    
    def evaluate_audio_files(self, base_path='Ex4_files/Ex4_audio_files'):
        results = []
        
        languages = {
            'en': 'English',
            'es': 'Spanish',
            'it': 'Italian'
        }
        
        language_dirs = {
            'en': 'EN',
            'es': 'ES',
            'it': 'IT'
        }
        
        print("AUTOMATIC SPEECH RECOGNITION SYSTEM - EVALUATION")
        
        for lang_code, lang_name in languages.items():
            print(f"\n{'='*80}")
            print(f"Processing {lang_name} ({lang_code.upper()}) files...")
            print(f"{'='*80}")
            
            lang_dir = os.path.join(base_path, language_dirs[lang_code])
            
            if not os.path.exists(lang_dir):
                print(f"WARNING: Directory not found: {lang_dir}")
                continue
            
            # Get all wav files
            audio_files = [f for f in os.listdir(lang_dir) if f.endswith('.wav')]
            
            for audio_file in sorted(audio_files):
                audio_path = os.path.join(lang_dir, audio_file)
                
                # Get expected transcription
                expected = self.transcriptions[lang_code].get(audio_file, '')
                
                # Recognize speech
                print(f"\nProcessing: {audio_file}")
                recognized = self.recognize_speech(audio_path, lang_code, apply_filtering=True)
                
                print(f"  Expected:   '{expected}'")
                print(f"  Recognized: '{recognized}'")
                
                # Calculate WER
                wer = self.calculate_wer(expected, recognized)
                print(f"  WER: {wer:.1f}%")
                
                results.append({
                    'Language': lang_name,
                    'File': audio_file,
                    'Expected': expected,
                    'Recognized': recognized,
                    'WER': wer
                })
        
        return results
    
    def record_custom_sentences(self):
        print("CUSTOM SENTENCE RECORDING")
        print("\nNOTE: Custom recording requires microphone access.")
        print("For this prototype, you can:")
        print("1. Record your own sentences using any audio software")
        print("2. Save them as 'your_sentence1.wav' and 'your_sentence2.wav'")
        print("3. Place them in the appropriate language directory")
        print("4. Add expected transcriptions to self.transcriptions")
        print("\nExample code for recording (requires pyaudio):")
        print("""
        import pyaudio
        import wave
        
        # Recording settings
        CHUNK = 1024
        FORMAT = pyaudio.paInt16
        CHANNELS = 1
        RATE = 16000
        RECORD_SECONDS = 5
        
        p = pyaudio.PyAudio()
        stream = p.open(format=FORMAT, channels=CHANNELS, rate=RATE,
                       input=True, frames_per_buffer=CHUNK)
        
        print("Recording...")
        frames = []
        for i in range(0, int(RATE / CHUNK * RECORD_SECONDS)):
            data = stream.read(CHUNK)
            frames.append(data)
        
        print("Finished recording")
        stream.stop_stream()
        stream.close()
        p.terminate()
        
        # Save to file
        wf = wave.open('your_sentence1.wav', 'wb')
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(p.get_sample_size(FORMAT))
        wf.setframerate(RATE)
        wf.writeframes(b''.join(frames))
        wf.close()
        """)
    
    def print_results_table(self, results):
        print("EVALUATION RESULTS SUMMARY")
        print("="*80)
        print()
        print(f"{'Language':<15} {'File':<25} {'WER':<10}")
        print("-" * 80)
        
        for result in results:
            print(f"{result['Language']:<15} {result['File']:<25} {result['WER']:>6.1f}%")
        
        print("-" * 80)
        
        # Calculate average WER per language
        languages = {}
        for result in results:
            lang = result['Language']
            if lang not in languages:
                languages[lang] = []
            languages[lang].append(result['WER'])
        
        print("\nAverage WER per Language:")
        for lang, wers in languages.items():
            avg_wer = sum(wers) / len(wers) if wers else 0
            print(f"  {lang}: {avg_wer:.1f}%")
        
        overall_avg = sum(r['WER'] for r in results) / len(results) if results else 0
        print(f"\nOverall Average WER: {overall_avg:.1f}%")
        print()


def main():    
    # Create ASR system
    asr = ASRSystem()
    
    # Check if models exist
    print("Checking for Vosk models...")
    models_found = True
    for lang, path in asr.model_paths.items():
        if os.path.exists(path):
            print(f"✓ {lang.upper()}: {path}")
        else:
            print(f"✗ {lang.upper()}: {path} - NOT FOUND")
            models_found = False
    
    if not models_found:

        print("SETUP INSTRUCTIONS")
        print("="*80)
        print("\n1. Install Vosk:")
        print("   pip install vosk")
        print("\n2. Download models from: https://alphacephei.com/vosk/models")
        print("   - vosk-model-small-en-us-0.15 (English)")
        print("   - vosk-model-small-es-0.42 (Spanish)")
        print("   - vosk-model-small-it-0.22 (Italian)")
        print("\n3. Extract models to 'models/' directory")
        print("   Structure should be:")
        print("   models/")
        print("   ├── vosk-model-small-en-us-0.15/")
        print("   ├── vosk-model-small-es-0.42/")
        print("   └── vosk-model-small-it-0.22/")
        print("\nAlternatively, update model_paths in the code to match your setup.")
        print("="*80)
        return
    
    print("\n✓ All models found!")
    
    # Evaluate audio files
    results = asr.evaluate_audio_files()
    
    # Print results table
    asr.print_results_table(results)
    
    # Information about custom recording
    asr.record_custom_sentences()
    
    print("ASR SYSTEM FEATURES")
    print("="*80)
    print("""
    Offline speech recognition (no internet required)
    Multi-language support (English, Italian, Spanish)
    Noise handling:
      - Automatic gain control (normalization)
      - Low-pass filtering (removes high-frequency noise)
      - Basic spectral noise reduction
    Word Error Rate (WER) calculation
    Evaluation on provided audio files
    
    Justification for using Vosk:
    - Fully offline (meets requirement #2)
    - Supports multiple languages including EN, IT, ES
    - Open-source and actively maintained
    - Good accuracy for small models
    - Easy to integrate with Python
    - Low resource requirements suitable for airport kiosks
    - No API costs or rate limits
    """)

if __name__ == "__main__":
    main()
