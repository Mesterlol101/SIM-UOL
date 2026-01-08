let playButton;
let submitButton;
let refreshButton, reloadButton;
let inputBox;
let isPlaying = false;
let statusMessage = "";
let captchaText = "";
let captchaAnswer = "";

// p5.sound objects
let fft;
let amplitude;
let reverb, filter, delay;
let currentFilterType = 'none';

// Speech synthesis
let synth;
let currentUtterance;

// Oscillators for audio generation (for visualization)
let oscillators = [];
let playing = false;

// Visualization
let waveform = [];
let spectrum = [];

function setup() {
  createCanvas(720, 600);
  
  // Initialize speech synthesis
  if ('speechSynthesis' in window) {
    synth = window.speechSynthesis;
  }
  
  // Don't initialize audio objects until user interaction
  // This prevents the AudioContext error
  
  // Generate initial CAPTCHA
  generateCaptcha();
  
  // Create play button
  playButton = createButton('▶');
  playButton.position(50, 40);
  playButton.size(60, 60);
  playButton.style('font-size', '30px');
  playButton.mousePressed(togglePlay);
  
  // Create refresh button
  refreshButton = createButton('↻');
  refreshButton.position(620, 40);
  refreshButton.size(40, 40);
  refreshButton.style('font-size', '24px');
  refreshButton.mousePressed(generateCaptcha);
  
  // Create input textbox
  inputBox = createInput('');
  inputBox.position(50, 450);
  inputBox.size(400, 30);
  inputBox.attribute('placeholder', 'Type Your Answer');
  
  // Create submit button
  submitButton = createButton('Submit');
  submitButton.position(470, 450);
  submitButton.size(100, 35);
  submitButton.style('font-size', '16px');
  submitButton.mousePressed(handleSubmit);
  
  statusMessage = "CAPTCHA ready. Click play to hear it.";
}

function initAudio() {
  // Initialize audio on first user interaction
  if (!fft) {
    userStartAudio(); // Start audio context
    fft = new p5.FFT(0.8, 256);
    amplitude = new p5.Amplitude();
    
    // Create audio effects for filtering
    reverb = new p5.Reverb();
    delay = new p5.Delay();
    filter = new p5.BandPass();
    
    // Configure effects with safe values
    // Delay to help avoid feedback loops
    delay.process(delay, 0.12, 0.4, 2300); 
    filter.freq(1000);
    filter.res(5);
  }
}

function draw() {
  background(240);
  
  // Draw information box
  fill(255);
  stroke(0);
  strokeWeight(2);
  rect(130, 30, 470, 80);
  fill(0);
  noStroke();
  textSize(14);
  textAlign(LEFT, TOP);
  text('[Information] Play the audio file and', 145, 45);
  text('submit your answer.', 145, 65);
  
  // Draw visualization box
  fill(255);
  stroke(0);
  strokeWeight(2);
  rect(50, 130, 660, 280);
  
  // Draw visualization label
  fill(0);
  noStroke();
  textSize(12);
  textAlign(LEFT, TOP);
  text('Audio Visualisation', 70, 145);
  
  // Draw waveform visualization
  drawWaveform();
  
  // Draw input textbox label
  fill(0);
  noStroke();
  textSize(12);
  textAlign(LEFT, TOP);
  text('Type Your Answer', 50, 432);
  
  // Draw button label
  text('Submit', 470, 432);
  
  // Draw result box
  fill(255);
  stroke(0);
  strokeWeight(2);
  rect(50, 510, 660, 60);
  
  // Draw result label and status
  fill(0);
  noStroke();
  textSize(12);
  textAlign(LEFT, TOP);
  text('[Result] Status message', 70, 525);
  
  textSize(14);
  text(statusMessage, 70, 545);
}

function drawWaveform(){
  let centerY = 260;
  
  // Draw center line
  stroke(200);
  strokeWeight(1);
  line(70, centerY, width - 70, centerY);
  
  if (playing && fft) {
    // Get frequency spectrum to show audio activity
    spectrum = fft.analyze();
    
    // Draw frequency spectrum bars
    fill(50, 150, 255, 150);
    noStroke();
    
    let numBars = 64;
    let barWidth = (width - 140) / numBars;
    
    for (let i = 0; i < numBars; i++) {
      let barHeight = map(spectrum[i], 0, 255, 0, 120);
      let x = 70 + i * barWidth;
      
      // Bars above and below center line for symmetry
      rect(x, centerY, barWidth - 2, -barHeight);
      rect(x, centerY, barWidth - 2, barHeight);
    }
    
    // Add text showing what character is being spoken
    fill(0, 100, 200);
    noStroke();
    textSize(16);
    textAlign(CENTER, CENTER);
    text('Playing: ' + captchaAnswer, width / 2, centerY - 110);
  } else {
    // Draw static line when not playing
    stroke(150);
    strokeWeight(1);
    noFill();
    line(70, centerY, width - 70, centerY);
    
    // Show filter info
    fill(100);
    noStroke();
    textSize(11);
    textAlign(CENTER, CENTER);
    text('Current effect: ' + currentFilterType, width / 2, centerY);
  }
}

function togglePlay() {
  // Initialize audio on first play
  initAudio();
  
  if (!playing && synth) {
    playCaptchaAudio();
    playing = true;
    isPlaying = true;
    playButton.html('⏸');
    statusMessage = "Playing audio CAPTCHA with " + currentFilterType + " effect...";
  } else {
    if (synth) synth.cancel();
    stopAllOscillators();
    playing = false;
    isPlaying = false;
    playButton.html('▶');
    statusMessage = "Audio stopped.";
  }
}

function playCaptchaAudio() {
  // Use speech synthesis to speak the CAPTCHA characters
  if (synth) {
    // Cancel any ongoing speech
    synth.cancel();
    
    // Create utterance with the CAPTCHA text
    // Add spaces between characters for clarity
    let spokenText = captchaAnswer.split('').join(', ');
    
    currentUtterance = new SpeechSynthesisUtterance(spokenText);
    
    // Apply speech modifications based on filter type
    switch(currentFilterType) {
      case 'lowpass':
      case 'highpass':
        currentUtterance.rate = random(0.6, 0.8);
        currentUtterance.pitch = random(0.7, 0.9);
        break;
      case 'bandpass':
        currentUtterance.rate = random(0.7, 0.9);
        currentUtterance.pitch = random(1.1, 1.4);
        break;
      case 'reverb':
        currentUtterance.rate = random(0.5, 0.7);
        currentUtterance.pitch = random(0.8, 1.2);
        currentUtterance.volume = random(0.6, 0.8);
        break;
      case 'delay':
        currentUtterance.rate = random(0.6, 0.8);
        currentUtterance.pitch = random(0.9, 1.1);
        break;
      default:
        currentUtterance.rate = 0.8;
        currentUtterance.pitch = 1.0;
    }
    
    currentUtterance.volume = random(0.7, 0.9);
    
    currentUtterance.onstart = function() {
      // Start visualization with oscillators
      initAudio();
      createSyncedVisualization();
    };
    
    currentUtterance.onend = function() {
      playing = false;
      isPlaying = false;
      playButton.html('▶');
      statusMessage = "Audio finished. Please enter what you heard.";
      stopAllOscillators();
    };
    
    synth.speak(currentUtterance);
  }
}

function createSyncedVisualization() {
  // Create oscillators to generate audio for visualization
  // These play alongside the speech to create the spectrum display
  
  let charDuration = 800 / (currentUtterance.rate || 0.8);
  let totalChars = captchaAnswer.length;
  
  // Play tones for each character
  for (let i = 0; i < totalChars; i++) {
    let char = captchaAnswer[i];
    let delay = i * charDuration;
    
    setTimeout(() => {
      if (playing) {
        playVisualizationTone(char, charDuration * 0.8);
      }
    }, delay);
  }
}

function playVisualizationTone(char, duration) {
  // Create multiple oscillators for rich spectrum
  let baseFreq = charToFrequency(char);
  
  // Fundamental frequency
  let osc1 = new p5.Oscillator('sine');
  osc1.freq(baseFreq);
  osc1.amp(0);
  osc1.start();
  osc1.amp(0.08, 0.02);
  osc1.amp(0, 0.1, duration / 1000 - 0.12);
  oscillators.push(osc1);
  
  // Harmonic
  let osc2 = new p5.Oscillator('sine');
  osc2.freq(baseFreq * 2);
  osc2.amp(0);
  osc2.start();
  osc2.amp(0.04, 0.02);
  osc2.amp(0, 0.1, duration / 1000 - 0.12);
  oscillators.push(osc2);
  
  // Third harmonic
  let osc3 = new p5.Oscillator('triangle');
  osc3.freq(baseFreq * 1.5);
  osc3.amp(0);
  osc3.start();
  osc3.amp(0.03, 0.02);
  osc3.amp(0, 0.1, duration / 1000 - 0.12);
  oscillators.push(osc3);
  
  // Clean up after duration
  setTimeout(() => {
    [osc1, osc2, osc3].forEach(osc => {
      if (osc) {
        osc.stop();
        let index = oscillators.indexOf(osc);
        if (index > -1) oscillators.splice(index, 1);
      }
    });
  }, duration);
}

function charToFrequency(char) {
  // Map characters to distinct frequencies
  if (char >= '0' && char <= '9') {
    // Numbers: 250-700 Hz
    return 250 + (parseInt(char) * 50);
  } else {
    // Letters: 300-1000 Hz
    let code = char.toUpperCase().charCodeAt(0) - 65;
    return 300 + (code * 30);
  }
}

function stopAllOscillators() {
  for (let osc of oscillators) {
    osc.stop();
  }
  oscillators = [];
}

function generateCaptcha() {
  // Stop any playing audio
  if (synth) synth.cancel();
  stopAllOscillators();
  playing = false;
  isPlaying = false;
  
  // Generate random CAPTCHA answer - always mix of letters and numbers
  let letters = 'ABCDEFGHIJKLMNPQRSTUVWXYZ';
  let numbers = '123456789';
  
  captchaAnswer = "";
  let length = floor(random(5, 7));
  
  // Ensure at least one letter and one number
  let positions = [];
  for (let i = 0; i < length; i++) {
    positions.push(i);
  }
  shuffle(positions, true);
  
  // Put at least one number and one letter
  let numCount = floor(random(1, length - 1)); // At least 1 number, at least 1 letter
  
  for (let i = 0; i < length; i++) {
    if (i < numCount) {
      // Add number
      captchaAnswer += numbers.charAt(floor(random(numbers.length)));
    } else {
      // Add letter
      captchaAnswer += letters.charAt(floor(random(letters.length)));
    }
  }
  
  // Shuffle the characters
  captchaAnswer = captchaAnswer.split('').sort(() => random() - 0.5).join('');
  
  captchaText = captchaAnswer;
  
  // Apply random filter
  applyRandomFilter();
  
  statusMessage = "New CAPTCHA generated with " + currentFilterType + " effect. Click play to hear it.";
  if (inputBox) inputBox.value('');
  if (playButton) playButton.html('▶');
  
  // For debugging and easier looking instead of in the console
  console.log("Debug - CAPTCHA answer:", captchaAnswer);
}

function applyRandomFilter() {
  let filters = ['lowpass', 'highpass', 'bandpass', 'reverb', 'delay', 'none'];
  currentFilterType = random(filters);
  
  console.log("Applied filter:", currentFilterType);
}

function applyFilterToOsc(osc) {
  // Apply the selected filter to the oscillator
  switch (currentFilterType) {
    case 'lowpass':
      let lpf = new p5.LowPass();
      lpf.freq(random(500, 1500));
      lpf.res(random(1, 5));
      osc.disconnect();
      osc.connect(lpf);
      break;
    case 'highpass':
      let hpf = new p5.HighPass();
      hpf.freq(random(800, 2000));
      hpf.res(random(1, 5));
      osc.disconnect();
      osc.connect(hpf);
      break;
    case 'bandpass':
      let bpf = new p5.BandPass();
      bpf.freq(random(800, 2500));
      bpf.res(random(5, 15));
      osc.disconnect();
      osc.connect(bpf);
      break;
    case 'reverb':
      if (!reverb) {
        reverb = new p5.Reverb();
      }
      reverb.process(osc, random(2, 4), random(1, 2));
      break;
    case 'delay':
      if (!delay) {
        delay = new p5.Delay();
      }
      // Safe delay parameters to avoid feedback loop
      delay.process(osc, random(0.08, 0.12), random(0.3, 0.5), 2300);
      break;
    default:
      // No filter
      break;
  }
}

function handleSubmit() {
  let answer = inputBox.value().trim().toLowerCase();
  let correctAnswer = captchaAnswer.toLowerCase();
  
  if (answer === '') {
    statusMessage = "Please enter an answer before submitting.";
  } else if (answer === correctAnswer) {
    statusMessage = "Correct! CAPTCHA verified successfully.";
  } else {
    statusMessage = "Incorrect. Expected: " + captchaAnswer + ". Try again.";
  }
}
