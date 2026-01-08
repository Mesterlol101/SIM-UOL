import numpy as np
import wave
import struct

def embed_message_lsb(audio_file, output_file, message):
    # Read the audio file
    with wave.open(audio_file, 'rb') as audio:
        params = audio.getparams()
        n_channels = params.nchannels
        sampwidth = params.sampwidth
        framerate = params.framerate
        n_frames = params.nframes
        
        # Read all frames
        frames = audio.readframes(n_frames)
    
    # Convert frames to numpy array
    if sampwidth == 1:
        dtype = np.uint8
        samples = np.frombuffer(frames, dtype=dtype)
    elif sampwidth == 2:
        dtype = np.int16
        samples = np.frombuffer(frames, dtype=dtype)
    else:
        raise ValueError(f"Unsupported sample width: {sampwidth}")
    
    # Convert message to binary
    # Add a delimiter to mark the end of the message
    message_with_delimiter = message + "###END###"
    binary_message = ''.join(format(ord(char), '08b') for char in message_with_delimiter)
    
    # Check if the audio file is large enough
    message_length = len(binary_message)
    if message_length > len(samples):
        raise ValueError(f"Audio file is too short to embed the message. Need {message_length} samples, have {len(samples)}")
    
    # Create a copy of samples to modify
    stego_samples = samples.copy()
    
    # Embed the message by modifying LSB
    for i, bit in enumerate(binary_message):
        # Clear the LSB and set it to the message bit
        stego_samples[i] = (stego_samples[i] & ~1) | int(bit)
    
    # Convert back to bytes
    stego_frames = stego_samples.tobytes()
    
    # Write the stego audio file
    with wave.open(output_file, 'wb') as stego_audio:
        stego_audio.setparams(params)
        stego_audio.writeframes(stego_frames)
    
    print(f"Message embedded successfully!")
    print(f"Message length: {len(message)} characters")
    print(f"Binary length: {message_length} bits")
    print(f"Output file: {output_file}")


def extract_message_lsb(stego_file):
    # Read the stego audio file
    with wave.open(stego_file, 'rb') as audio:
        params = audio.getparams()
        sampwidth = params.sampwidth
        n_frames = params.nframes
        
        # Read all frames
        frames = audio.readframes(n_frames)
    
    # Convert frames to numpy array
    if sampwidth == 1:
        dtype = np.uint8
        samples = np.frombuffer(frames, dtype=dtype)
    elif sampwidth == 2:
        dtype = np.int16
        samples = np.frombuffer(frames, dtype=dtype)
    else:
        raise ValueError(f"Unsupported sample width: {sampwidth}")
    
    # Extract LSBs
    binary_message = ''
    for sample in samples:
        binary_message += str(sample & 1)
    
    # Convert binary to text
    message = ''
    delimiter = "###END###"
    
    # Process 8 bits at a time to get characters
    for i in range(0, len(binary_message), 8):
        if i + 8 <= len(binary_message):
            byte = binary_message[i:i+8]
            char = chr(int(byte, 2))
            message += char
            
            # Check if we've reached the delimiter
            if message.endswith(delimiter):
                message = message[:-len(delimiter)]
                break
    
    return message


def main():
    # Configuration
    input_audio = "Ex3_files/Ex3_sound5.wav"
    output_audio = "Ex3_files/Ex3_sound5_stego.wav"
    secret_message = "it always seems impossible until it's done"
    
    print("LSB Audio Steganography - Message Embedding")
    print("=" * 60)
    print(f"Input file: {input_audio}")
    print(f"Secret message: '{secret_message}'")
    print()
    
    # Embed the message
    try:
        embed_message_lsb(input_audio, output_audio, secret_message)
        print()
        
        # Verify by extracting
        print("Verification - Extracting Message")
        print("=" * 60)
        extracted_message = extract_message_lsb(output_audio)
        print(f"Extracted message: '{extracted_message}'")
        print()
        
        if extracted_message == secret_message:
            print("SUCCESS: Message embedded and extracted correctly!")
        else:
            print("WARNING: Extracted message doesn't match original!")
            
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    main()
