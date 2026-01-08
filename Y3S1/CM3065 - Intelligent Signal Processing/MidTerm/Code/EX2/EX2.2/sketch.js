// Audio Visualization with Meyda - Task 2.2
// Three sounds with three Meyda features each

let sounds = [];
let currentSound = 0;
let soundNames = ['Sound 1', 'Sound 2', 'Sound 3'];
let isPlaying = false;

// Meyda analyzer
let analyzer;
let features = null;

// UI buttons
let playButton, stopButton;
let soundButtons = [];

// Selected Meyda features for visualization (customized per sound based on analysis):
// Sound 1: Spectral Flatness, Spectral Kurtosis, Energy
// Sound 2: Spectral Kurtosis, Energy, ZCR  
// Sound 3: Energy, Spectral Skewness, RMS

function preload() {
  // Load the three sound files
  for (let i = 1; i <= 3; i++) {
    sounds.push(loadSound(`sounds/Ex2_sound${i}.wav`));
  }
}

function setup() {
  createCanvas(800, 600);
  
  // Create UI controls
  createUI();
  
  // Initialize Meyda analyzer
  if (typeof Meyda !== 'undefined') {
    analyzer = Meyda.createMeydaAnalyzer({
      audioContext: getAudioContext(),
      source: sounds[currentSound],
      bufferSize: 512,
      featureExtractors: ['rms', 'zcr', 'energy', 'spectralFlatness', 'spectralKurtosis', 'spectralSkewness'],
      callback: (feats) => {
        features = feats;
      }
    });
  }
}

function draw() {
  background(20, 20, 40);
  
  // Display title
  fill(255);
  textAlign(CENTER);
  textSize(24);
  text('Audio Visualization with Meyda', width / 2, 30);
  
  textSize(16);
  text(`Currently Playing: ${soundNames[currentSound]}`, width / 2, 60);
  
  // Draw visualizations if sound is playing and features are available
  if (isPlaying && features) {
    drawFirstFeature();
    drawSecondFeature();
    drawThirdFeature();
    drawFeatureLabels();
  } else {
    // Instructions when not playing
    fill(200);
    textSize(14);
    textAlign(CENTER);
    text('Click PLAY to start visualization', width / 2, height / 2);
    text('Select different sounds to compare their features', width / 2, height / 2 + 25);
  }
}

function drawFirstFeature() {
  // First feature varies by sound
  // Sound 1: Spectral Flatness, Sound 2: Spectral Kurtosis, Sound 3: Energy
  push();
  translate(width / 2, 150);
  
  if (currentSound === 0) {
    // Sound 1: Spectral Flatness (0-1, tonal to noisy)
    let flatness = features.spectralFlatness || 0;
    let normalizedValue = constrain(flatness, 0, 1);
    
    // Morphing shape: smooth circle (tonal) to jagged polygon (noisy)
    let sides = Math.floor(map(normalizedValue, 0, 1, 50, 6));
    let radius = 100;
    let irregularity = normalizedValue * 40;
    
    fill(150, 150, 255, 150);
    noStroke();
    
    beginShape();
    for (let i = 0; i < sides; i++) {
      let angle = TWO_PI / sides * i;
      let r = radius + random(-irregularity, irregularity);
      let x = cos(angle) * r;
      let y = sin(angle) * r;
      vertex(x, y);
    }
    endShape(CLOSE);
    
    fill(255);
    textAlign(CENTER);
    textSize(12);
    text(`Spectral Flatness: ${flatness.toFixed(4)}`, 0, 0);
    textSize(10);
    text('(0=Tonal, 1=Noisy)', 0, 15);
    
  } else if (currentSound === 1) {
    // Sound 2: Spectral Kurtosis (peakedness)
    let kurtosis = features.spectralKurtosis || 0;
    let normalizedValue = constrain(kurtosis / 10, 0, 1);
    
    // Vertical spikes visualization
    let numSpikes = 20;
    for (let i = 0; i < numSpikes; i++) {
      let angle = TWO_PI / numSpikes * i;
      let spikeLength = map(normalizedValue, 0, 1, 40, 150);
      let variation = random(0.7, 1.3);
      let len = spikeLength * variation;
      
      stroke(255, 200, 100, 200);
      strokeWeight(3);
      line(0, 0, cos(angle) * len, sin(angle) * len);
    }
    
    noStroke();
    fill(255);
    textAlign(CENTER);
    textSize(12);
    text(`Spectral Kurtosis: ${kurtosis.toFixed(4)}`, 0, 0);
    textSize(10);
    text('(Peakedness)', 0, 15);
    
  } else {
    // Sound 3: Energy
    let energy = features.energy || 0;
    let circleSize = map(energy, 0, 1, 50, 300);
    
    fill(100, 255, 150, 150);
    noStroke();
    circle(0, 0, circleSize);
    
    fill(150, 255, 200, 100);
    circle(0, 0, circleSize * 0.7);
    
    fill(255);
    textAlign(CENTER);
    textSize(12);
    text(`Energy: ${energy.toFixed(4)}`, 0, 0);
  }
  
  pop();
}

function drawSecondFeature() {
  // Second feature varies by sound
  // Sound 1: Spectral Kurtosis, Sound 2: Energy, Sound 3: Spectral Skewness
  push();
  translate(150, 380);
  
  if (currentSound === 0) {
    // Sound 1: Spectral Kurtosis
    let kurtosis = features.spectralKurtosis || 0;
    let normalizedValue = constrain(kurtosis / 10, 0, 1);
    
    // Vertical bars with varying heights
    let numBars = 15;
    for (let i = 0; i < numBars; i++) {
      let barHeight = map(normalizedValue, 0, 1, 30, 180);
      let variation = random(0.8, 1.2);
      let h = barHeight * variation;
      
      fill(255, 200, 100, 200);
      noStroke();
      rect(i * 16, 0, 12, -h);
    }
    
    fill(255);
    textAlign(CENTER);
    textSize(12);
    text(`Spectral Kurtosis: ${kurtosis.toFixed(4)}`, 120, 30);
    text('(Peakedness)', 120, 45);
    
  } else if (currentSound === 1) {
    // Sound 2: Energy
    let energy = features.energy || 0;
    let circleSize = map(energy, 0, 1, 40, 200);
    
    fill(255, 150, 100, 150);
    noStroke();
    circle(120, -80, circleSize);
    
    fill(255, 200, 150, 100);
    circle(120, -80, circleSize * 0.7);
    
    fill(255);
    textAlign(CENTER);
    textSize(12);
    text(`Energy: ${energy.toFixed(4)}`, 120, 30);
    
  } else {
    // Sound 3: Spectral Skewness
    let skewness = features.spectralSkewness || 0;
    // Normalize (can be negative or positive)
    let normalizedValue = constrain((skewness + 5) / 10, 0, 1);
    
    // Asymmetric wave visualization
    noFill();
    stroke(200, 150, 255);
    strokeWeight(3);
    
    beginShape();
    for (let i = 0; i < 100; i++) {
      let x = map(i, 0, 100, 0, 240);
      let skew = map(normalizedValue, 0, 1, -1, 1);
      let y = sin(i * 0.1 + frameCount * 0.05) * 80 * (1 + skew * sin(i * 0.05));
      vertex(x, y);
    }
    endShape();
    
    fill(255);
    noStroke();
    textAlign(CENTER);
    textSize(12);
    text(`Spectral Skewness: ${skewness.toFixed(4)}`, 120, 120);
    text('(Asymmetry)', 120, 135);
  }
  
  pop();
}

function drawThirdFeature() {
  // Third feature varies by sound
  // Sound 1: Energy, Sound 2: ZCR, Sound 3: RMS
  push();
  translate(450, 380);
  
  if (currentSound === 0) {
    // Sound 1: Energy
    let energy = features.energy || 0;
    let circleSize = map(energy, 0, 1, 40, 200);
    
    fill(100, 255, 150, 150);
    noStroke();
    circle(125, -80, circleSize);
    
    fill(150, 255, 200, 100);
    circle(125, -80, circleSize * 0.7);
    
    fill(255);
    textAlign(CENTER);
    textSize(12);
    text(`Energy: ${energy.toFixed(4)}`, 125, 30);
    
  } else if (currentSound === 1) {
    // Sound 2: ZCR
    let zcr = features.zcr || 0;
    let amplitude = map(zcr, 0, 1, 20, 150);
    
    noFill();
    stroke(100, 255, 200);
    strokeWeight(2);
    
    beginShape();
    for (let i = 0; i < 100; i++) {
      let x = map(i, 0, 100, 0, 250);
      let y = sin(i * 0.5 + frameCount * 0.1) * amplitude * (1 + zcr * 2);
      vertex(x, y);
    }
    endShape();
    
    stroke(100, 255, 200, 100);
    beginShape();
    for (let i = 0; i < 100; i++) {
      let x = map(i, 0, 100, 0, 250);
      let y = cos(i * 0.3 + frameCount * 0.15) * amplitude * (1 + zcr * 2);
      vertex(x, y);
    }
    endShape();
    
    fill(255);
    noStroke();
    textAlign(CENTER);
    textSize(12);
    text(`ZCR: ${zcr.toFixed(4)}`, 125, 180);
    text('(Percussiveness)', 125, 195);
    
  } else {
    // Sound 3: RMS
    let rms = features.rms || 0;
    let circleSize = map(rms, 0, 1, 40, 200);
    
    fill(255, 100, 150, 150);
    noStroke();
    circle(125, -80, circleSize);
    
    fill(255, 150, 200, 100);
    circle(125, -80, circleSize * 0.7);
    
    fill(255);
    textAlign(CENTER);
    textSize(12);
    text(`RMS: ${rms.toFixed(4)}`, 125, 30);
    text('(Loudness)', 125, 45);
  }
  
  pop();
}

function drawFeatureLabels() {
  // Draw labels based on current sound
  textAlign(CENTER);
  textSize(16);
  
  if (currentSound === 0) {
    // Sound 1: Spectral Flatness, Spectral Kurtosis, Energy
    fill(255, 200, 200);
    text('Spectral Flatness', width / 2, 100);
    fill(255, 255, 200);
    text('Spectral Kurtosis', 150 + 120, 320);
    fill(200, 255, 200);
    text('Energy', 450 + 125, 320);
  } else if (currentSound === 1) {
    // Sound 2: Spectral Kurtosis, Energy, ZCR
    fill(255, 200, 200);
    text('Spectral Kurtosis', width / 2, 100);
    fill(255, 255, 200);
    text('Energy', 150 + 120, 320);
    fill(200, 255, 200);
    text('ZCR', 450 + 125, 320);
  } else {
    // Sound 3: Energy, Spectral Skewness, RMS
    fill(255, 200, 200);
    text('Energy', width / 2, 100);
    fill(255, 255, 200);
    text('Spectral Skewness', 150 + 120, 320);
    fill(200, 255, 200);
    text('RMS', 450 + 125, 320);
  }
}

function createUI() {
  // Play button
  playButton = createButton('PLAY');
  playButton.position(20, height + 20);
  playButton.mousePressed(playSound);
  playButton.style('padding', '10px 20px');
  playButton.style('font-size', '16px');
  
  // Stop button
  stopButton = createButton('STOP');
  stopButton.position(100, height + 20);
  stopButton.mousePressed(stopSound);
  stopButton.style('padding', '10px 20px');
  stopButton.style('font-size', '16px');
  
  // Sound selection buttons
  for (let i = 0; i < 3; i++) {
    let btn = createButton(`Sound ${i + 1}`);
    btn.position(200 + i * 100, height + 20);
    btn.mousePressed(() => switchSound(i));
    btn.style('padding', '10px 20px');
    btn.style('font-size', '14px');
    soundButtons.push(btn);
  }
  
  updateButtonStyles();
}

function playSound() {
  if (!isPlaying) {
    sounds[currentSound].loop();
    
    // Restart analyzer with current sound
    if (analyzer) {
      analyzer.stop();
    }
    analyzer = Meyda.createMeydaAnalyzer({
      audioContext: getAudioContext(),
      source: sounds[currentSound],
      bufferSize: 512,
      featureExtractors: ['rms', 'zcr', 'energy', 'spectralFlatness', 'spectralKurtosis', 'spectralSkewness'],
      callback: (feats) => {
        features = feats;
      }
    });
    analyzer.start();
    
    isPlaying = true;
  }
}

function stopSound() {
  if (isPlaying) {
    sounds[currentSound].stop();
    if (analyzer) {
      analyzer.stop();
    }
    isPlaying = false;
    features = null;
  }
}

function switchSound(index) {
  // Stop current sound
  stopSound();
  
  // Switch to new sound
  currentSound = index;
  
  // Update button styles
  updateButtonStyles();
}

function updateButtonStyles() {
  for (let i = 0; i < soundButtons.length; i++) {
    if (i === currentSound) {
      soundButtons[i].style('background-color', '#4CAF50');
      soundButtons[i].style('color', 'white');
    } else {
      soundButtons[i].style('background-color', '#f0f0f0');
      soundButtons[i].style('color', 'black');
    }
  }
}
