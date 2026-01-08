// Task 2.3: Voice Controller for Music Visualization
// Voice commands: Colors (Black, White, Red, Blue, Green) and Shapes (Square, Triangle, Circle, Pentagon)

let song;
let fft;
let speechRec;
let mic; // Microphone for visual feedback

// Visualization settings
let bgColor = [0, 0, 0]; // Default black background
let currentShape = 'circle'; // Default shape

// UI elements
let playButton, stopButton;
let statusText = 'Click START VOICE to begin';
let lastCommand = '';
let isListening = false;
let micLevel = 0;
let rawText = ''; // Show what speech recognition actually hears

function preload() {
  song = loadSound('Kalte_Ohren_(_Remix_).mp3');
}

function setup() {
  createCanvas(800, 600);
  
  // Setup FFT for frequency analysis
  fft = new p5.FFT(0.8, 256);
  song.amp(0.5);
  
  // Setup microphone for visual feedback
  mic = new p5.AudioIn();
  
  // Setup speech recognition
  speechRec = new p5.SpeechRec('en-US', gotSpeech);
  speechRec.continuous = true;
  speechRec.interimResults = true; // Show interim results for debugging
  
  // Create UI
  createUI();
}

function draw() {
  // Set background color based on voice command
  background(bgColor[0], bgColor[1], bgColor[2]);
  
  // Draw microphone indicator if listening
  if (isListening) {
    drawMicIndicator();
  }
  
  // Display title and status
  displayInfo();
  
  // If music is playing, draw visualization
  if (song.isPlaying()) {
    drawVisualization();
  } else {
    displayInstructions();
  }
}

function drawVisualization() {
  // Get frequency spectrum
  let spectrum = fft.analyze();
  
  // Draw shapes based on frequency data
  push();
  translate(width / 2, height / 2);
  
  // Calculate average amplitude for scaling
  let bass = fft.getEnergy(20, 140);
  let mid = fft.getEnergy(140, 400);
  let treble = fft.getEnergy(400, 6000);
  
  // Draw multiple layers of shapes
  drawShapeLayer(bass, 0.8, 200, [255, 100, 100, 150]);
  drawShapeLayer(mid, 0.6, 150, [100, 255, 100, 150]);
  drawShapeLayer(treble, 0.4, 100, [100, 100, 255, 150]);
  
  // Draw waveform around the edge
  drawWaveform(spectrum);
  
  pop();
}

function drawShapeLayer(energy, scaleFactor, baseSize, color) {
  push();
  
  // Map energy to size
  let size = map(energy, 0, 255, baseSize * 0.5, baseSize * 1.5);
  
  // Set color with transparency
  fill(color[0], color[1], color[2], color[3]);
  noStroke();
  
  // Rotation for visual interest
  rotate(frameCount * 0.01 * scaleFactor);
  
  // Draw the shape based on voice command
  drawShape(0, 0, size);
  
  pop();
}

function drawShape(x, y, size) {
  switch(currentShape) {
    case 'square':
      rectMode(CENTER);
      rect(x, y, size, size);
      break;
      
    case 'triangle':
      let h = size * 0.866; // Height of equilateral triangle
      triangle(
        x, y - h/2,
        x - size/2, y + h/2,
        x + size/2, y + h/2
      );
      break;
      
    case 'circle':
      circle(x, y, size);
      break;
      
    case 'pentagon':
      drawPolygon(x, y, size/2, 5);
      break;
  }
}

function drawPolygon(x, y, radius, sides) {
  let angle = TWO_PI / sides;
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a - HALF_PI) * radius;
    let sy = y + sin(a - HALF_PI) * radius;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

function drawWaveform(spectrum) {
  noFill();
  stroke(255, 255, 255, 100);
  strokeWeight(2);
  
  beginShape();
  for (let i = 0; i < spectrum.length; i++) {
    let angle = map(i, 0, spectrum.length, 0, TWO_PI);
    let amp = spectrum[i];
    let r = map(amp, 0, 256, 250, 350);
    let x = r * cos(angle);
    let y = r * sin(angle);
    vertex(x, y);
  }
  endShape(CLOSE);
}

function displayInfo() {
  push();
  fill(255, 255, 0);
  noStroke();
  textAlign(CENTER);
  textSize(24);
  text('Voice-Controlled Music Visualizer', width / 2, 30);
  
  textSize(14);
  fill(200);
  text(`Status: ${statusText}`, width / 2, 55);
  
  // Show raw speech input for debugging
  if (rawText && isListening) {
    fill(150, 150, 255);
    textSize(14);
    text(`Hearing: "${rawText}"`, width / 2, 80);
  }
  
  if (lastCommand) {
    fill(100, 255, 100);
    textSize(16);
    text(`Recognized: "${lastCommand}"`, width / 2, 105);
  }
  
  // Display current settings
  textSize(12);
  fill(255);
  text(`Current Shape: ${currentShape.toUpperCase()} | Background: ${getColorName()}`, width / 2, height - 20);
  
  pop();
}

function drawMicIndicator() {
  // Visual indicator that microphone is active
  push();
  
  // Get microphone level
  if (mic.enabled) {
    micLevel = mic.getLevel();
  }
  
  // Pulsing circle in top right
  let x = width - 50;
  let y = 50;
  let size = 30 + micLevel * 500;
  
  // Outer pulse
  fill(255, 0, 0, 100);
  noStroke();
  circle(x, y, size);
  
  // Inner circle
  fill(255, 0, 0, 200);
  circle(x, y, 25);
  
  // Mic icon
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(14);
  text('🎤', x, y);
  
  // Level bar
  fill(255);
  textAlign(RIGHT);
  textSize(10);
  text('MIC ACTIVE', x - 35, y);
  
  // Level indicator
  let barHeight = micLevel * 100;
  fill(0, 255, 0);
  rect(x - 30, y + 15, 60, 5);
  fill(255, 0, 0);
  rect(x - 30, y + 15, barHeight * 0.6, 5);
  
  pop();
}

function displayInstructions() {
  push();
  fill(255, 200);
  textAlign(CENTER);
  textSize(16);
  text('Click PLAY MUSIC to start', width / 2, height / 2 - 80);
  
  textSize(14);
  fill(255, 255, 100);
  text('📢 VOICE COMMANDS (speak clearly):', width / 2, height / 2 - 40);
  
  textAlign(LEFT);
  textSize(13);
  fill(255, 150, 150);
  text('Background Colors:', width / 2 - 150, height / 2 - 10);
  fill(255);
  text('• Say "Black" for black background', width / 2 - 150, height / 2 + 10);
  text('• Say "White" for white background', width / 2 - 150, height / 2 + 30);
  text('• Say "Red" for red background', width / 2 - 150, height / 2 + 50);
  text('• Say "Blue" for blue background', width / 2 - 150, height / 2 + 70);
  text('• Say "Green" for green background', width / 2 - 150, height / 2 + 90);
  
  fill(150, 255, 150);
  text('Shapes:', width / 2 - 150, height / 2 + 120);
  fill(255);
  text('• Say "Square", "Triangle", "Circle", or "Pentagon"', width / 2 - 150, height / 2 + 140);
  
  fill(200, 200, 255);
  textAlign(CENTER);
  textSize(12);
  text('💡 TIP: Watch the top-right corner for microphone activity!', width / 2, height / 2 + 180);
  
  pop();
}

function getColorName() {
  if (bgColor[0] === 0 && bgColor[1] === 0 && bgColor[2] === 0) return 'Black';
  if (bgColor[0] === 255 && bgColor[1] === 255 && bgColor[2] === 255) return 'White';
  if (bgColor[0] === 255 && bgColor[1] === 0 && bgColor[2] === 0) return 'Red';
  if (bgColor[0] === 0 && bgColor[1] === 0 && bgColor[2] === 255) return 'Blue';
  if (bgColor[0] === 0 && bgColor[1] === 255 && bgColor[2] === 0) return 'Green';
  return 'Custom';
}

function gotSpeech() {
  // Always show what we're hearing (even interim results)
  if (speechRec.resultString) {
    rawText = speechRec.resultString;
    console.log('Hearing: ' + rawText);
  }
  
  // Only process final results
  if (speechRec.resultValue) {
    let command = speechRec.resultString.toLowerCase();
    lastCommand = speechRec.resultString;
    console.log('✓ Final result: ' + command);
    
    let commandRecognized = false;
    
    // Check for color commands
    if (command.includes('black')) {
      bgColor = [0, 0, 0];
      statusText = '✓ Background → Black';
      commandRecognized = true;
    } else if (command.includes('white')) {
      bgColor = [255, 255, 255];
      statusText = '✓ Background → White';
      commandRecognized = true;
    } else if (command.includes('red')) {
      bgColor = [255, 0, 0];
      statusText = '✓ Background → Red';
      commandRecognized = true;
    } else if (command.includes('blue')) {
      bgColor = [0, 0, 255];
      statusText = '✓ Background → Blue';
      commandRecognized = true;
    } else if (command.includes('green')) {
      bgColor = [0, 255, 0];
      statusText = '✓ Background → Green';
      commandRecognized = true;
    }
    
    // Check for shape commands
    if (command.includes('square')) {
      currentShape = 'square';
      statusText = '✓ Shape → Square';
      commandRecognized = true;
    } else if (command.includes('triangle')) {
      currentShape = 'triangle';
      statusText = '✓ Shape → Triangle';
      commandRecognized = true;
    } else if (command.includes('circle')) {
      currentShape = 'circle';
      statusText = '✓ Shape → Circle';
      commandRecognized = true;
    } else if (command.includes('pentagon')) {
      currentShape = 'pentagon';
      statusText = '✓ Shape → Pentagon';
      commandRecognized = true;
    }
    
    if (!commandRecognized) {
      statusText = '❌ Command not recognized. Try: Black, Red, Square, Circle, etc.';
      console.log('❌ Command not recognized: ' + command);
    }
  }
}

function createUI() {
  // Start voice recognition button
  let voiceButton = createButton('START VOICE');
  voiceButton.position(20, height + 20);
  voiceButton.mousePressed(() => {
    // Start microphone for visual feedback
    mic.start();
    // Start speech recognition
    speechRec.start();
    isListening = true;
    statusText = '🎤 Listening... (watch top-right for mic level)';
    console.log('Voice recognition started');
  });
  voiceButton.style('padding', '10px 20px');
  voiceButton.style('font-size', '16px');
  voiceButton.style('background-color', '#4CAF50');
  voiceButton.style('color', 'white');
  voiceButton.style('border', 'none');
  voiceButton.style('cursor', 'pointer');
  
  // Stop voice recognition button
  let stopVoiceButton = createButton('STOP VOICE');
  stopVoiceButton.position(150, height + 20);
  stopVoiceButton.mousePressed(() => {
    mic.stop();
    speechRec.stop();
    isListening = false;
    statusText = 'Voice recognition stopped';
    rawText = '';
    console.log('Voice recognition stopped');
  });
  stopVoiceButton.style('padding', '10px 20px');
  stopVoiceButton.style('font-size', '16px');
  
  // Play music button
  playButton = createButton('PLAY MUSIC');
  playButton.position(280, height + 20);
  playButton.mousePressed(() => {
    if (!song.isPlaying()) {
      song.loop();
      statusText = 'Music playing - try voice commands!';
    }
  });
  playButton.style('padding', '10px 20px');
  playButton.style('font-size', '16px');
  
  // Stop music button
  stopButton = createButton('STOP MUSIC');
  stopButton.position(410, height + 20);
  stopButton.mousePressed(() => {
    song.stop();
    statusText = 'Music stopped';
  });
  stopButton.style('padding', '10px 20px');
  stopButton.style('font-size', '16px');
}


