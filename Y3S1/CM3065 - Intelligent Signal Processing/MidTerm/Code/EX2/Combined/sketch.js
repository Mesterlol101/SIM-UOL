// Combined EX2.1, EX2.2, EX2.3 - Single Canvas with X-offsets

// X-offsets for each exercise
const EX1_X = 0;
const EX2_X = 750;
const EX3_X = 1600;

// ========== EX2.1 - Audio CAPTCHA Variables ==========
let ex1_playButton, ex1_submitButton, ex1_refreshButton, ex1_inputBox;
let ex1_playing = false;
let ex1_statusMessage = "";
let ex1_captchaAnswer = "";
let ex1_fft, ex1_synth, ex1_currentUtterance;
let ex1_oscillators = [];
let ex1_spectrum = [];
let ex1_currentFilterType = 'none';

// ========== EX2.2 - Meyda Visualization Variables ==========
let ex2_sounds = [];
let ex2_currentSound = 0;
let ex2_soundNames = ['Sound 1', 'Sound 2', 'Sound 3'];
let ex2_isPlaying = false;
let ex2_analyzer, ex2_features = null;
let ex2_playButton, ex2_stopButton;
let ex2_soundButtons = [];

// ========== EX2.3 - Voice Controller Variables ==========
let ex3_song, ex3_fft, ex3_speechRec, ex3_mic;
let ex3_bgColor = [0, 0, 0];
let ex3_currentShape = 'circle';
let ex3_playButton, ex3_stopButton;
let ex3_statusText = 'Click START VOICE to begin';
let ex3_lastCommand = '';
let ex3_isListening = false;
let ex3_micLevel = 0;

function preload() {
  // Load EX2.2 sounds
  for (let i = 1; i <= 3; i++) {
    ex2_sounds.push(loadSound(`EX2.2/Ex2_sound${i}.wav`));
  }
  // Load EX2.3 song
  ex3_song = loadSound('EX2.3/Kalte_Ohren_(_Remix_).mp3');
}

function setup() {
  createCanvas(2400, 700);
  
  // EX1 Setup
  if ('speechSynthesis' in window) {
    ex1_synth = window.speechSynthesis;
  }
  ex1_generateCaptcha();
  
  ex1_playButton = createButton('▶');
  ex1_playButton.position(EX1_X + 60, 35);
  ex1_playButton.size(70, 75);
  ex1_playButton.style('font-size', '30px');
  ex1_playButton.mousePressed(ex1_togglePlay);
  
  ex1_refreshButton = createButton('↻');
  ex1_refreshButton.position(EX1_X + 610, 35);
  ex1_refreshButton.size(70, 75);
  ex1_refreshButton.style('font-size', '30px');
  ex1_refreshButton.mousePressed(ex1_generateCaptcha);
  
  ex1_inputBox = createInput('');
  ex1_inputBox.position(EX1_X + 60, 475);
  ex1_inputBox.size(500, 30);
  ex1_inputBox.attribute('placeholder', 'Type Your Answer');
  
  ex1_submitButton = createButton('Submit');
  ex1_submitButton.position(EX1_X + 585, 475);
  ex1_submitButton.size(95, 36);
  ex1_submitButton.style('font-size', '14px');
  ex1_submitButton.mousePressed(ex1_handleSubmit);
  
  ex1_statusMessage = "CAPTCHA ready. Click play to hear it.";
  
  // EX2 Setup
  ex2_playButton = createButton('PLAY');
  ex2_playButton.position(EX2_X + 20, 620);
  ex2_playButton.mousePressed(ex2_playSound);
  ex2_playButton.style('padding', '10px 20px');
  
  ex2_stopButton = createButton('STOP');
  ex2_stopButton.position(EX2_X + 100, 620);
  ex2_stopButton.mousePressed(ex2_stopSound);
  ex2_stopButton.style('padding', '10px 20px');
  
  for (let i = 0; i < 3; i++) {
    let btn = createButton(`Sound ${i + 1}`);
    btn.position(EX2_X + 200 + i * 100, 620);
    btn.mousePressed(() => ex2_switchSound(i));
    btn.style('padding', '10px 20px');
    ex2_soundButtons.push(btn);
  }
  ex2_updateButtonStyles();
  
  // EX3 Setup
  ex3_fft = new p5.FFT(0.8, 256);
  ex3_song.amp(0.5);
  ex3_mic = new p5.AudioIn();
  
  if (typeof p5.SpeechRec !== 'undefined') {
    ex3_speechRec = new p5.SpeechRec('en-US', ex3_gotSpeech);
    ex3_speechRec.continuous = true;
    ex3_speechRec.interimResults = true;
  }
  
  let voiceButton = createButton('START VOICE');
  voiceButton.position(EX3_X + 20, 620);
  voiceButton.mousePressed(ex3_startVoice);
  voiceButton.style('padding', '10px 20px');
  
  let stopVoiceButton = createButton('STOP VOICE');
  stopVoiceButton.position(EX3_X + 150, 620);
  stopVoiceButton.mousePressed(ex3_stopVoice);
  stopVoiceButton.style('padding', '10px 20px');
  
  ex3_playButton = createButton('PLAY MUSIC');
  ex3_playButton.position(EX3_X + 280, 620);
  ex3_playButton.mousePressed(ex3_playMusic);
  ex3_playButton.style('padding', '10px 20px');
  
  ex3_stopButton = createButton('STOP MUSIC');
  ex3_stopButton.position(EX3_X + 410, 620);
  ex3_stopButton.mousePressed(ex3_stopMusic);
  ex3_stopButton.style('padding', '10px 20px');
}

function draw() {
  background(255);
  
  // Draw each exercise (they will draw their own backgrounds)
  ex1_draw();
  ex2_draw();
  ex3_draw();
  
  // Draw dividers on top
  stroke(0);
  strokeWeight(2);
  line(740, 0, 740, height);
  line(1590, 0, 1590, height);
}

// ========== EX2.1 FUNCTIONS ==========
function ex1_draw() {
  push();
  translate(EX1_X, 0);
  
  // Information box
  fill(255);
  stroke(0);
  strokeWeight(2);
  rect(60, 35, 620, 75);
  fill(0);
  noStroke();
  textSize(14);
  textAlign(LEFT, TOP);
  text('[Information] Play the audio file and', 75, 50);
  text('submit your answer.', 75, 70);
  
  // Visualization box
  fill(255);
  stroke(0);
  strokeWeight(2);
  rect(60, 160, 620, 280);
  fill(0);
  noStroke();
  textSize(12);
  textAlign(LEFT, TOP);
  text('Audio Visualisation', 75, 175);
  ex1_drawWaveform();
  
  // Labels
  fill(0);
  textSize(12);
  textAlign(LEFT);
  text('Type Your Answer', 60, 460);
  text('Submit', 585, 460);
  
  // Result box
  fill(255);
  stroke(0);
  strokeWeight(2);
  rect(60, 510, 620, 80);
  fill(0);
  noStroke();
  textSize(12);
  textAlign(LEFT, TOP);
  text('[Result] Status message', 75, 525);
  textSize(14);
  text(ex1_statusMessage, 75, 550);
  
  pop();
}

function ex1_drawWaveform() {
  let centerY = 300;
  stroke(150);
  strokeWeight(1);
  line(75, centerY, 665, centerY);
  
  // Show current filter type
  push();
  fill(150);
  noStroke();
  textSize(11);
  textAlign(CENTER);
  text('Current effect: ' + ex1_currentFilterType, 370, 325);
  pop();
  
  if (ex1_playing && ex1_fft) {
    ex1_spectrum = ex1_fft.analyze();
    fill(50, 150, 255, 150);
    noStroke();
    let numBars = 64;
    let barWidth = 590 / numBars;
    for (let i = 0; i < numBars; i++) {
      let barHeight = map(ex1_spectrum[i], 0, 255, 0, 100);
      let x = 75 + i * barWidth;
      rect(x, centerY, barWidth - 2, -barHeight);
      rect(x, centerY, barWidth - 2, barHeight);
    }
    push();
    fill(0, 100, 200);
    noStroke();
    textSize(16);
    textAlign(CENTER, CENTER);
    text('Playing: ' + ex1_captchaAnswer, 370, centerY - 90);
    pop();
  }
}

function ex1_togglePlay() {
  if (!ex1_fft) {
    userStartAudio();
    ex1_fft = new p5.FFT(0.8, 256);
  }
  if (!ex1_playing && ex1_synth) {
    ex1_playCaptchaAudio();
    ex1_playing = true;
    ex1_playButton.html('⏸');
    ex1_statusMessage = "Playing audio CAPTCHA...";
  } else {
    if (ex1_synth) ex1_synth.cancel();
    ex1_stopOscillators();
    ex1_playing = false;
    ex1_playButton.html('▶');
    ex1_statusMessage = "Audio stopped.";
  }
}

function ex1_playCaptchaAudio() {
  if (ex1_synth) {
    ex1_synth.cancel();
    let spokenText = ex1_captchaAnswer.split('').join(', ');
    ex1_currentUtterance = new SpeechSynthesisUtterance(spokenText);
    ex1_currentUtterance.rate = 0.8;
    ex1_currentUtterance.pitch = 1.0;
    ex1_currentUtterance.volume = 0.8;
    ex1_currentUtterance.onstart = function() {
      ex1_createVisualizationTones();
    };
    ex1_currentUtterance.onend = function() {
      ex1_playing = false;
      ex1_playButton.html('▶');
      ex1_statusMessage = "Audio finished. Please enter what you heard.";
      ex1_stopOscillators();
    };
    ex1_synth.speak(ex1_currentUtterance);
  }
}

function ex1_createVisualizationTones() {
  let charDuration = 800;
  for (let i = 0; i < ex1_captchaAnswer.length; i++) {
    let char = ex1_captchaAnswer[i];
    setTimeout(() => {
      if (ex1_playing) {
        ex1_playTone(char, charDuration * 0.8);
      }
    }, i * charDuration);
  }
}

function ex1_playTone(char, duration) {
  let freq = ex1_charToFreq(char);
  let osc = new p5.Oscillator('sine');
  osc.freq(freq);
  osc.amp(0);
  osc.start();
  osc.amp(0.1, 0.05);
  ex1_oscillators.push(osc);
  
  setTimeout(() => {
    osc.amp(0, 0.1);
    setTimeout(() => {
      osc.stop();
      let idx = ex1_oscillators.indexOf(osc);
      if (idx > -1) ex1_oscillators.splice(idx, 1);
    }, 150);
  }, duration - 150);
}

function ex1_charToFreq(char) {
  if (char >= '0' && char <= '9') {
    return 300 + (parseInt(char) * 50);
  } else {
    let code = char.toUpperCase().charCodeAt(0) - 65;
    return 400 + (code * 25);
  }
}

function ex1_stopOscillators() {
  for (let osc of ex1_oscillators) {
    osc.stop();
  }
  ex1_oscillators = [];
}

function ex1_generateCaptcha() {
  if (ex1_synth) ex1_synth.cancel();
  ex1_stopOscillators();
  ex1_playing = false;
  let letters = 'ABCDEFGHIJKLMNPQRSTUVWXYZ';
  let numbers = '123456789';
  ex1_captchaAnswer = "";
  let length = floor(random(5, 7));
  let numCount = floor(random(1, length - 1));
  for (let i = 0; i < length; i++) {
    if (i < numCount) {
      ex1_captchaAnswer += numbers.charAt(floor(random(numbers.length)));
    } else {
      ex1_captchaAnswer += letters.charAt(floor(random(letters.length)));
    }
  }
  ex1_captchaAnswer = ex1_captchaAnswer.split('').sort(() => random() - 0.5).join('');
  let filters = ['lowpass', 'highpass', 'bandpass', 'reverb', 'delay', 'none'];
  ex1_currentFilterType = random(filters);
  ex1_statusMessage = "New CAPTCHA generated with " + ex1_currentFilterType + " effect. Click play to hear it.";
  if (ex1_inputBox) ex1_inputBox.value('');
  if (ex1_playButton) ex1_playButton.html('▶');
  console.log("EX1 CAPTCHA:", ex1_captchaAnswer);
}

function ex1_handleSubmit() {
  let answer = ex1_inputBox.value().trim().toLowerCase();
  let correctAnswer = ex1_captchaAnswer.toLowerCase();
  if (answer === '') {
    ex1_statusMessage = "Please enter an answer before submitting.";
  } else if (answer === correctAnswer) {
    ex1_statusMessage = "Correct! CAPTCHA verified successfully.";
  } else {
    ex1_statusMessage = "Incorrect. Expected: " + ex1_captchaAnswer + ". Try again.";
  }
}

// ========== EX2.2 FUNCTIONS ==========
function ex2_draw() {
  push();
  translate(EX2_X, 0);
  
  // Title
  fill(0);
  textAlign(CENTER);
  textSize(24);
  text('Audio Visualization with Meyda', 400, 30);
  textSize(16);
  text(`Currently Playing: ${ex2_soundNames[ex2_currentSound]}`, 400, 60);
  
  if (ex2_isPlaying && ex2_features) {
    ex2_drawFirstFeature();
    ex2_drawSecondFeature();
    ex2_drawThirdFeature();
  } else {
    fill(100);
    textSize(14);
    textAlign(CENTER);
    text('Click PLAY to start visualization', 400, 300);
  }
  
  pop();
}

function ex2_drawFirstFeature() {
  push();
  translate(400, 150);
  if (ex2_features) {
    if (ex2_currentSound === 0) {
      let flatness = ex2_features.spectralFlatness || 0;
      let normalizedValue = constrain(flatness, 0, 1);
      let sides = Math.floor(map(normalizedValue, 0, 1, 50, 6));
      fill(150, 150, 255, 150);
      noStroke();
      beginShape();
      for (let i = 0; i < sides; i++) {
        let angle = TWO_PI / sides * i;
        let r = 100 + random(-normalizedValue * 40, normalizedValue * 40);
        vertex(cos(angle) * r, sin(angle) * r);
      }
      endShape(CLOSE);
      fill(0);
      textAlign(CENTER);
      textSize(12);
      text(`Spectral Flatness: ${flatness.toFixed(4)}`, 0, 0);
    } else if (ex2_currentSound === 1) {
      let kurtosis = ex2_features.spectralKurtosis || 0;
      let normalizedValue = constrain(kurtosis / 10, 0, 1);
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
      fill(0);
      textAlign(CENTER);
      textSize(12);
      text(`Spectral Kurtosis: ${kurtosis.toFixed(4)}`, 0, 0);
    } else {
      let energy = ex2_features.energy || 0;
      let circleSize = map(energy, 0, 1, 50, 300);
      fill(100, 255, 150, 150);
      noStroke();
      circle(0, 0, circleSize);
      fill(150, 255, 200, 100);
      circle(0, 0, circleSize * 0.7);
      fill(0);
      textAlign(CENTER);
      textSize(12);
      text(`Energy: ${energy.toFixed(4)}`, 0, 0);
    }
  }
  pop();
}

function ex2_drawSecondFeature() {
  push();
  translate(150, 380);
  if (ex2_features) {
    if (ex2_currentSound === 0) {
      let kurtosis = ex2_features.spectralKurtosis || 0;
      let normalizedValue = constrain(kurtosis / 10, 0, 1);
      for (let i = 0; i < 15; i++) {
        let barHeight = map(normalizedValue, 0, 1, 30, 180) * random(0.8, 1.2);
        fill(255, 200, 100, 200);
        noStroke();
        rect(i * 16, 0, 12, -barHeight);
      }
      fill(0);
      textAlign(CENTER);
      textSize(12);
      text(`Spectral Kurtosis: ${kurtosis.toFixed(4)}`, 120, 30);
    } else if (ex2_currentSound === 1) {
      let energy = ex2_features.energy || 0;
      let circleSize = map(energy, 0, 1, 40, 200);
      fill(255, 150, 100, 150);
      noStroke();
      circle(120, -80, circleSize);
      fill(255, 200, 150, 100);
      circle(120, -80, circleSize * 0.7);
      fill(0);
      textAlign(CENTER);
      textSize(12);
      text(`Energy: ${energy.toFixed(4)}`, 120, 30);
    } else {
      let skewness = ex2_features.spectralSkewness || 0;
      let normalizedValue = constrain((skewness + 5) / 10, 0, 1);
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
      fill(0);
      noStroke();
      textAlign(CENTER);
      textSize(12);
      text(`Spectral Skewness: ${skewness.toFixed(4)}`, 120, 120);
    }
  }
  pop();
}

function ex2_drawThirdFeature() {
  push();
  translate(450, 380);
  if (ex2_features) {
    if (ex2_currentSound === 0) {
      let energy = ex2_features.energy || 0;
      let circleSize = map(energy, 0, 1, 40, 200);
      fill(100, 255, 150, 150);
      noStroke();
      circle(125, -80, circleSize);
      fill(150, 255, 200, 100);
      circle(125, -80, circleSize * 0.7);
      fill(0);
      textAlign(CENTER);
      textSize(12);
      text(`Energy: ${energy.toFixed(4)}`, 125, 30);
    } else if (ex2_currentSound === 1) {
      let zcr = ex2_features.zcr || 0;
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
      fill(0);
      noStroke();
      textAlign(CENTER);
      textSize(12);
      text(`ZCR: ${zcr.toFixed(4)}`, 125, 180);
    } else {
      let rms = ex2_features.rms || 0;
      let circleSize = map(rms, 0, 1, 40, 200);
      fill(255, 100, 150, 150);
      noStroke();
      circle(125, -80, circleSize);
      fill(255, 150, 200, 100);
      circle(125, -80, circleSize * 0.7);
      fill(0);
      textAlign(CENTER);
      textSize(12);
      text(`RMS: ${rms.toFixed(4)}`, 125, 30);
    }
  }
  pop();
}

function ex2_playSound() {
  if (!ex2_isPlaying && ex2_sounds[ex2_currentSound]) {
    ex2_sounds[ex2_currentSound].loop();
    if (typeof Meyda !== 'undefined') {
      if (ex2_analyzer) ex2_analyzer.stop();
      ex2_analyzer = Meyda.createMeydaAnalyzer({
        audioContext: getAudioContext(),
        source: ex2_sounds[ex2_currentSound],
        bufferSize: 512,
        featureExtractors: ['rms', 'zcr', 'energy', 'spectralFlatness', 'spectralKurtosis', 'spectralSkewness'],
        callback: (feats) => { ex2_features = feats; }
      });
      ex2_analyzer.start();
    }
    ex2_isPlaying = true;
  }
}

function ex2_stopSound() {
  if (ex2_isPlaying) {
    ex2_sounds[ex2_currentSound].stop();
    if (ex2_analyzer) ex2_analyzer.stop();
    ex2_isPlaying = false;
    ex2_features = null;
  }
}

function ex2_switchSound(index) {
  ex2_stopSound();
  ex2_currentSound = index;
  ex2_updateButtonStyles();
}

function ex2_updateButtonStyles() {
  for (let i = 0; i < ex2_soundButtons.length; i++) {
    if (i === ex2_currentSound) {
      ex2_soundButtons[i].style('background-color', '#4CAF50');
      ex2_soundButtons[i].style('color', 'white');
    } else {
      ex2_soundButtons[i].style('background-color', '#f0f0f0');
      ex2_soundButtons[i].style('color', 'black');
    }
  }
}

// ========== EX2.3 FUNCTIONS ==========
function ex3_draw() {
  push();
  translate(EX3_X, 0);
  
  // Draw background color (controlled by voice)
  fill(ex3_bgColor[0], ex3_bgColor[1], ex3_bgColor[2]);
  noStroke();
  rect(0, 0, 800, 700);
  
  if (ex3_isListening) {
    ex3_drawMicIndicator();
  }
  
  ex3_displayInfo();
  
  if (ex3_song && ex3_song.isPlaying()) {
    ex3_drawVisualization();
  } else {
    ex3_displayInstructions();
  }
  
  pop();
}

function ex3_drawVisualization() {
  if (!ex3_fft) return;
  let spectrum = ex3_fft.analyze();
  push();
  translate(400, 300);
  let bass = ex3_fft.getEnergy(20, 140);
  let mid = ex3_fft.getEnergy(140, 400);
  let treble = ex3_fft.getEnergy(400, 6000);
  ex3_drawShapeLayer(bass, 0.8, 200, [255, 100, 100, 150]);
  ex3_drawShapeLayer(mid, 0.6, 150, [100, 255, 100, 150]);
  ex3_drawShapeLayer(treble, 0.4, 100, [100, 100, 255, 150]);
  pop();
}

function ex3_drawShapeLayer(energy, scaleFactor, baseSize, color) {
  push();
  let size = map(energy, 0, 255, baseSize * 0.5, baseSize * 1.5);
  fill(color[0], color[1], color[2], color[3]);
  noStroke();
  rotate(frameCount * 0.01 * scaleFactor);
  ex3_drawShape(0, 0, size);
  pop();
}

function ex3_drawShape(x, y, size) {
  switch(ex3_currentShape) {
    case 'square':
      rectMode(CENTER);
      rect(x, y, size, size);
      break;
    case 'triangle':
      let h = size * 0.866;
      triangle(x, y - h/2, x - size/2, y + h/2, x + size/2, y + h/2);
      break;
    case 'circle':
      circle(x, y, size);
      break;
    case 'pentagon':
      ex3_drawPolygon(x, y, size/2, 5);
      break;
  }
}

function ex3_drawPolygon(x, y, radius, sides) {
  let angle = TWO_PI / sides;
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a - HALF_PI) * radius;
    let sy = y + sin(a - HALF_PI) * radius;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

function ex3_displayInfo() {
  push();
  fill(255, 255, 0);
  noStroke();
  textAlign(CENTER);
  textSize(24);
  text('Voice-Controlled Visualizer', 400, 30);
  textSize(14);
  fill(200);
  text(`Status: ${ex3_statusText}`, 400, 55);
  if (ex3_lastCommand) {
    fill(100, 255, 100);
    textSize(16);
    text(`Recognized: "${ex3_lastCommand}"`, 400, 80);
  }
  pop();
}

function ex3_drawMicIndicator() {
  push();
  if (ex3_mic.enabled) {
    ex3_micLevel = ex3_mic.getLevel();
  }
  let x = 750;
  let y = 50;
  let size = 30 + ex3_micLevel * 500;
  fill(255, 0, 0, 100);
  noStroke();
  circle(x, y, size);
  fill(255, 0, 0, 200);
  circle(x, y, 25);
  pop();
}

function ex3_displayInstructions() {
  push();
  fill(255, 200);
  textAlign(CENTER);
  textSize(16);
  text('Click PLAY MUSIC to start', 400, 260);
  textSize(14);
  fill(255, 255, 100);
  text('Voice Commands: Black, White, Red, Blue, Green', 400, 300);
  text('Shapes: Square, Triangle, Circle, Pentagon', 400, 320);
  pop();
}

function ex3_gotSpeech() {
  if (!ex3_speechRec) return;
  
  if (ex3_speechRec.resultString) {
    ex3_lastCommand = ex3_speechRec.resultString;
  }
  if (ex3_speechRec.resultValue) {
    let command = ex3_speechRec.resultString.toLowerCase();
    
    if (command.includes('black')) ex3_bgColor = [0, 0, 0];
    else if (command.includes('white')) ex3_bgColor = [255, 255, 255];
    else if (command.includes('red')) ex3_bgColor = [255, 0, 0];
    else if (command.includes('blue')) ex3_bgColor = [0, 0, 255];
    else if (command.includes('green')) ex3_bgColor = [0, 255, 0];
    
    if (command.includes('square')) ex3_currentShape = 'square';
    else if (command.includes('triangle')) ex3_currentShape = 'triangle';
    else if (command.includes('circle')) ex3_currentShape = 'circle';
    else if (command.includes('pentagon')) ex3_currentShape = 'pentagon';
  }
}

function ex3_startVoice() {
  ex3_mic.start();
  if (ex3_speechRec) {
    ex3_speechRec.start();
    ex3_isListening = true;
    ex3_statusText = '🎤 Listening...';
  } else {
    ex3_statusText = 'Voice recognition not available';
  }
}

function ex3_stopVoice() {
  ex3_mic.stop();
  if (ex3_speechRec) {
    ex3_speechRec.stop();
  }
  ex3_isListening = false;
  ex3_statusText = 'Voice stopped';
}

function ex3_playMusic() {
  if (ex3_song && !ex3_song.isPlaying()) {
    ex3_song.loop();
    ex3_statusText = 'Music playing';
  }
}

function ex3_stopMusic() {
  if (ex3_song) {
    ex3_song.stop();
    ex3_statusText = 'Music stopped';
  }
}
