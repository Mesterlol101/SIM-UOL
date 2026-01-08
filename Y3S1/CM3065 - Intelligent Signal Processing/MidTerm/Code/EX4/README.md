# ASR System Setup Guide

## Automatic Speech Recognition System - Task 4.1

This ASR system uses **Vosk** for offline speech recognition, supporting English, Italian, and Spanish.

## Installation Steps

### 1. Install Required Packages
```bash
pip install vosk numpy scipy
```

Or use the requirements file:
```bash
pip install -r requirements.txt
```

### 2. Download Vosk Models

Download the following models from https://alphacephei.com/vosk/models:

- **English**: vosk-model-small-en-us-0.15 (40 MB)
- **Spanish**: vosk-model-small-es-0.42 (39 MB)  
- **Italian**: vosk-model-small-it-0.22 (48 MB)

### 3. Extract Models

Create a `models/` directory in the same folder as EX4.1.py and extract the models:

```
EX4/
├── EX4.1.py
├── requirements.txt
├── models/
│   ├── vosk-model-small-en-us-0.15/
│   │   ├── am/
│   │   ├── conf/
│   │   ├── graph/
│   │   └── ...
│   ├── vosk-model-small-es-0.42/
│   │   └── ...
│   └── vosk-model-small-it-0.22/
│       └── ...
└── Ex4_files/
    └── Ex4_audio_files/
        ├── EN/
        ├── ES/
        └── IT/
```

### 4. Run the System

```bash
python EX4.1.py
```

## System Features

### ✓ Offline Operation
- No internet connection required
- All processing done locally
- Fast and reliable

### ✓ Multi-Language Support
- English (EN)
- Spanish (ES)
- Italian (IT)

### ✓ Noise Handling (Airport Environment)
The system includes several noise reduction techniques:

1. **Automatic Gain Control**: Normalizes audio levels
2. **Low-Pass Filtering**: Removes high-frequency noise (Butterworth filter, 3kHz cutoff)
3. **Spectral Noise Reduction**: Basic noise floor subtraction

### ✓ Word Error Rate (WER) Calculation
Calculates WER using the formula:
```
WER = (S + D + I) / N × 100
```
Where:
- S = Substitutions
- D = Deletions
- I = Insertions
- N = Number of words in reference

## Expected Output

The system will:
1. Load models for all three languages
2. Process all audio files in Ex4_audio_files/
3. Display recognition results with WER for each file
4. Show a summary table with results
5. Calculate average WER per language

Example output:
```
Language         File                      WER
--------------------------------------------------------------------------------
English          checkin.wav                0.0%
English          parents.wav                0.0%
English          suitcase.wav               0.0%
Spanish          checkin_es.wav            25.0%
Spanish          maleta_es.wav             25.0%
...
```

## Recording Custom Sentences

To test with your own voice:

### Option 1: Using External Software
1. Use Audacity, Windows Voice Recorder, or similar
2. Record at 16000 Hz sample rate (mono)
3. Save as WAV format
4. Place in appropriate language folder
5. Update transcriptions in the code

### Option 2: Using Python (requires pyaudio)
```bash
pip install pyaudio
```

Then use the recording code provided in the script's comments.

## Justification for Vosk

**Why Vosk was chosen:**

1. **Fully Offline**: Meets requirement for local hosting
2. **Multi-language**: Supports EN, IT, ES and many more
3. **Accuracy**: Good recognition accuracy with small models
4. **Open Source**: MIT license, free to use
5. **Lightweight**: Small models (40-50 MB) suitable for embedded systems
6. **Python Support**: Easy integration with numpy/scipy
7. **Active Development**: Regular updates and improvements
8. **No API Limits**: No rate limiting or costs
9. **Privacy**: All processing local, no data sent to cloud
10. **Airport Suitable**: Robust enough for kiosk deployment

## Troubleshooting

### Models not found
- Ensure models are extracted in the `models/` directory
- Check folder names match exactly
- Verify the directory structure

### Import errors
- Install all requirements: `pip install -r requirements.txt`
- For Windows, pyaudio may need: `pip install pipwin && pipwin install pyaudio`

### Audio format issues
- Ensure audio files are WAV format
- Supported: 8000, 16000, 22050, 44100 Hz sample rates
- Mono or stereo both supported

### Poor recognition accuracy
- Check audio quality (clear speech, minimal background noise)
- Verify correct language selected
- Try enabling/disabling filtering
- Consider using larger Vosk models for better accuracy

## Alternative ASR Systems Considered

1. **SpeechRecognition library** - Requires internet for most engines
2. **CMU Sphinx** - Older, less accurate than Vosk
3. **Mozilla DeepSpeech** - Discontinued project
4. **Whisper** - Requires PyTorch, much larger models
5. **Kaldi** - Too complex, requires compilation

**Vosk was selected as the best balance of accuracy, ease of use, and offline capability.**
