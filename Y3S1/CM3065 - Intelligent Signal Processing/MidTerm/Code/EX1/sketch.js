let soundButtons = [];
let deleteBtn, recordBtn;
let selectedSound = -1;
let showWarning = false;
let playPauseBtn, stopBtn, loopBtn, skipBtn;
let volumeSlider;
let masterVolume = 0.5;
let isPlaying = false;
let isRecording = false;
let mic, recorder, recordedSound;
let isStopped = false;
let isLooping = false;

// Effects panel
let lowPassFilter;
// Dry/Wet mix
let filterDW = 1;  
// Output Level
let filterOL = 1;  
let clearFiltersBtn, saveEffectsBtn;

// Low-pass filter toggles
let lowPassEnabled = false;
let cutoffEnabled = false;
let resonanceEnabled = false;

// Reverb effect
let reverb;
// Dry/Wet mix
let reverbDW = 0.5;  
// Output Level
let reverbOL = 1;  

// Reverb toggles
let reverbEnabled = false;
let reverbDurationEnabled = false;
let reverbDecayEnabled = false;
let reverbReverseEnabled = false;

// Dynamic Compressor effect
let compressor;
// Dry/Wet mix
let compDW = 0.5;  
// Output Level
let compOL = 1;  

// Compressor toggles
let compressorEnabled = false;
let compAttackEnabled = false;
let compKneeEnabled = false;

// Waveshaper effect
let waveshaper;
// Dry/Wet mix
let waveshaperDW = 0.5;  
// Output Level
let waveshaperOL = 1;  

// Waveshaper toggles
let waveshaperEnabled = false;
let distortionEnabled = false;
let oversampleEnabled = false;
let compRatioEnabled = false;

// Spectrum analyzers
// Analyzes original sound (before effects)
let fftIn;  
// Analyzes processed sound (after effects)
let fftOut; 

function setup() {
  createCanvas(1000, 1000);
  
  // Create sound buttons (2 columns x 3 rows)
  let startX = 70;
  let startY = 100;
  let btnWidth = 120;
  let btnHeight = 50;
  let spacing = 20;
  
  for (let i = 0; i < 6; i++) {
    let col = i % 2;
    let row = floor(i / 2);
    let x = startX + col * (btnWidth + spacing);
    let y = startY + row * (btnHeight + spacing);
    soundButtons.push({
      x: x,
      y: y,
      w: btnWidth,
      h: btnHeight,
      label: `Sound ${i + 1}`,
      originalLabel: `Sound ${i + 1}`,
      fileName: null,
      sound: null,
      // Saved effects settings
      savedEffects: {
        lowPassEnabled: false,
        cutoffEnabled: false,
        resonanceEnabled: false,
        filterDW: 1,
        filterOL: 1,
        reverbEnabled: false,
        reverbDurationEnabled: false,
        reverbReverseEnabled: false,
        reverbDW: 0.5,
        reverbOL: 1,
        compressorEnabled: false,
        compAttackEnabled: false,
        compKneeEnabled: false,
        compDW: 0.5,
        compOL: 1,
        waveshaperEnabled: false,
        distortionEnabled: false,
        oversampleEnabled: false,
        waveshaperDW: 0.5,
        waveshaperOL: 1
      }
    });
  }
  
  // Create ellipsis button
  soundButtons.push({
    x: startX,
    y: startY + 3 * (btnHeight + spacing),
    w: btnWidth * 2 + spacing,
    h: btnHeight,
    label: '...'
  });
  
  // Bottom control buttons
  let bottomY = 410;
  deleteBtn = { x: 70, y: bottomY, w: 100, h: 40, label: 'Delete', color: [255, 200, 180] };
  recordBtn = { x: 200, y: bottomY, w: 120, h: 40, label: 'Record New', color: [255, 200, 180] };
  
  // Playback control buttons (right side, below spectrum boxes)
  let controlsY = 180;
  playPauseBtn = { x: 450, y: controlsY, w: 70, h: 40, label: 'Play \n Pause', color: [25, 60, 90] };
  stopBtn = { x: 530, y: controlsY, w: 60, h: 40, label: 'Stop', color: [25, 60, 90] };
  loopBtn = { x: 600, y: controlsY, w: 60, h: 40, label: 'Loop', color: [25, 60, 90] };
  skipBtn = { x: 670, y: controlsY, w: 70, h: 40, label: 'Skip to\nstart', color: [25, 60, 90] };
  
  // Initialize microphone and recorder
  mic = new p5.AudioIn();
  recorder = new p5.SoundRecorder();
  recorder.setInput(mic);
  
  // Initialize low-pass filter (bypassed by default)
  lowPassFilter = new p5.LowPass();
  lowPassFilter.freq(22050);
  lowPassFilter.res(0.001); 
  
  // Initialize reverb (bypassed by default)
  reverb = new p5.Reverb();
  reverb.set(0.01, 0.01, 0); 
  reverb.drywet(reverbDW);
  reverb.amp(reverbOL);
  
  // Initialize compressor (bypassed by default)
  compressor = new p5.Compressor();
  compressor.set(0.003, 0, 1, 0, 0.25); 
  compressor.drywet(compDW);
  compressor.amp(compOL);
  
  // Initialize waveshaper (bypassed by default)
  waveshaper = new p5.Distortion();
  waveshaper.set(0, 'none');  
  waveshaper.drywet(waveshaperDW);
  waveshaper.amp(waveshaperOL);
  
  // Initialize FFT analyzers
  fftIn = new p5.FFT(0.8, 256);  
  fftOut = new p5.FFT(0.8, 256);
  
  // Effects panel buttons (will be positioned relative to panel in drawEffectsPanel)
  clearFiltersBtn = { x: 0, y: 0, w: 100, h: 30, label: 'Clear filters', color: [240, 200, 200] };
  saveEffectsBtn = { x: 0, y: 0, w: 70, h: 30, label: 'Save', color: [240, 200, 200] };
}

function draw() {
  background(220);
  
  // Draw rounded container
  fill(200);
  stroke(100);
  strokeWeight(3);
  rect(30, 30, 350, 460, 20);
  
  // Draw title
  fill(0);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(18);
  textStyle(BOLD);
  text('Pre-recorded', 200, 40);
  text('Sounds Library', 200, 60);
  
  // Draw sound buttons
  for (let i = 0; i < soundButtons.length; i++) {
    let btn = soundButtons[i];
    let btnColor = (i === selectedSound) ? [180, 220, 255] : 255;
    drawButton(btn, btnColor, 0);
  }
  
  // Draw warning message if needed
  if (showWarning) {
    fill(200, 0, 0);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(12);
    textStyle(NORMAL);
    text('Please select a sound slot first', 200, 380);
  }
  
  // Draw control buttons
  let deletePressed = mouseIsPressed && mouseX > deleteBtn.x && mouseX < deleteBtn.x + deleteBtn.w &&
                      mouseY > deleteBtn.y && mouseY < deleteBtn.y + deleteBtn.h;
  
  let deleteColor = deletePressed ? [200, 150, 120] : deleteBtn.color;
  let recordColor = isRecording ? [200, 150, 120] : recordBtn.color;
  drawButton(deleteBtn, deleteColor, 0);
  drawButton(recordBtn, recordColor, 0);
  
  // Draw spectrum displays
  drawSpectrumBox(450, 40, 200, 120, 'Spectrum In', fftIn);
  drawSpectrumBox(660, 40, 200, 120, 'Spectrum Out', fftOut);
  
  // Draw playback control buttons
  let playPauseColor = isPlaying ? [15, 40, 60] : playPauseBtn.color;
  let loopColor = isLooping ? [15, 40, 60] : loopBtn.color;
  drawButton(playPauseBtn, playPauseColor, 0);
  drawButton(stopBtn, stopBtn.color, 0);
  drawButton(loopBtn, loopColor, 0);
  drawButton(skipBtn, skipBtn.color, 0);
  
  // Draw playback status message below play/pause button
  if (selectedSound !== -1 && selectedSound < soundButtons.length - 1) {
    let btn = soundButtons[selectedSound];
    if (btn.sound) {
      fill(0);
      noStroke();
      textAlign(CENTER, TOP);
      textSize(11);
      textStyle(NORMAL);
      let statusText = isStopped ? 'Stopped' : (isPlaying ? 'Playing' : 'Paused');
      text(statusText, playPauseBtn.x + playPauseBtn.w / 2, playPauseBtn.y + playPauseBtn.h + 5);
    }
  }
  
  // Draw looping status message below loop button
  if (isLooping) {
    fill(0);
    noStroke();
    textAlign(CENTER, TOP);
    textSize(11);
    textStyle(NORMAL);
    text('Looping On', loopBtn.x + loopBtn.w / 2, loopBtn.y + loopBtn.h + 5);
  }
  
  // Draw master volume section
  drawVolumeControl();
  
  // Draw Recording Effects Panel
  drawEffectsPanel();
}

function drawButton(btn, fillColor, strokeCol) {
  // Check if mouse is over button
  let isHover = mouseX > btn.x && mouseX < btn.x + btn.w &&
                mouseY > btn.y && mouseY < btn.y + btn.h;
  
  // Draw button
  stroke(strokeCol || 0);
  strokeWeight(2);
  if (Array.isArray(fillColor)) {
    if (isHover) {
      fill(fillColor[0] - 40, fillColor[1] - 40, fillColor[2] - 40);
    } else {
      fill(fillColor[0], fillColor[1], fillColor[2]);
    }
  } else {
    if (isHover) {
      fill(240);
    } else {
      fill(fillColor);
    }
  }
  rect(btn.x, btn.y, btn.w, btn.h, 10);
  
  // Draw label - use black for sound buttons, white for control buttons
  let isControlButton = Array.isArray(fillColor);
  fill(isControlButton ? 255 : 0);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(12);
  textStyle(NORMAL);
  // Handle multi-line labels
  let lines = btn.label.split('\n');
  if (lines.length > 1) {
    text(lines[0], btn.x + btn.w / 2, btn.y + btn.h / 2 - 6);
    text(lines[1], btn.x + btn.w / 2, btn.y + btn.h / 2 + 6);
  } else {
    text(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
  }
}

function drawSpectrumBox(x, y, w, h, title, fft) {
  // Draw box
  fill(230);
  stroke(100);
  strokeWeight(2);
  rect(x, y, w, h, 5);
  
  // Draw title
  fill(0);
  noStroke();
  textAlign(CENTER, TOP);
  textSize(14);
  textStyle(BOLD);
  text(title, x + w / 2, y + 10);
  
  // Draw spectrum if FFT is available and there's audio playing
  if (fft && isPlaying && selectedSound !== -1 && selectedSound < soundButtons.length - 1) {
    let btn = soundButtons[selectedSound];
    // Only draw spectrum if sound exists and is actually playing
    if (btn.sound && btn.sound.isPlaying()) {
      let spectrum = fft.analyze();
      let graphX = x + 10;
      let graphY = y + 35;
      let graphW = w - 20;
      let graphH = h - 45;
      
      // Draw spectrum bars
      noStroke();
      fill(50, 100, 200, 180);
      
      let barWidth = graphW / spectrum.length;
      for (let i = 0; i < spectrum.length; i++) {
        let barHeight = map(spectrum[i], 0, 255, 0, graphH);
        let barX = graphX + i * barWidth;
        let barY = graphY + graphH - barHeight;
        rect(barX, barY, barWidth - 1, barHeight);
      }
    }
  }
}

function drawVolumeControl() {
  let x = 750;
  let y = 180;
  let w = 160;
  let h = 80;
  
  // Draw container
  fill(240);
  stroke(100);
  strokeWeight(2);
  rect(x, y, w, h, 10);
  
  // Draw title
  fill(0);
  noStroke();
  textAlign(CENTER, TOP);
  textSize(14);
  textStyle(BOLD);
  text('Master Volume', x + w / 2, y + 10);
  
  // Draw slider track
  let sliderX = x + 20;
  let sliderY = y + 45;
  let sliderW = w - 40;
  let sliderH = 10;
  
  fill(60, 100, 140);
  noStroke();
  rect(sliderX, sliderY, sliderW, sliderH, 5);
  
  // Draw slider thumb
  let thumbX = sliderX + masterVolume * sliderW;
  fill(200);
  stroke(100);
  strokeWeight(2);
  rect(thumbX - 8, sliderY - 5, 16, 20, 3);
  
  // Store slider bounds for interaction
  volumeSlider = {
    x: sliderX,
    y: sliderY - 5,
    w: sliderW,
    h: 20
  };
}

function drawEffectsPanel() {
  let panelX = 450;
  let panelY = 280;
  let panelW = 460;
  let panelH = 300;
  
  // Main panel container
  fill(200);
  stroke(100);
  strokeWeight(2);
  rect(panelX, panelY, panelW, panelH, 15);
  
  // Panel title
  fill(0);
  noStroke();
  textAlign(CENTER, TOP);
  textSize(14);
  textStyle(BOLD);
  text('Recording Effects Panel', panelX + panelW / 2, panelY + 10);
  
  // Draw effect sections
  let sectionY = panelY + 35;
  let sectionW = 210;
  let sectionH = 100;
  let spacing = 15;
  
  // Low-pass filter section
  drawEffectSection(panelX + 10, sectionY, sectionW, sectionH, 'Low-pass filter effect');
  drawToggleButton(panelX + 25, sectionY + 30, 'Low-pass', lowPassEnabled, 'lowPass');
  drawToggleButton(panelX + 25, sectionY + 55, 'Cutoff', cutoffEnabled, 'cutoff');
  drawToggleButton(panelX + 25, sectionY + 80, 'Resonance', resonanceEnabled, 'resonance');
  drawMiniSlider(panelX + 130, sectionY + 35, 70, 'DW', filterDW, 'filterDW');
  drawMiniSlider(panelX + 130, sectionY + 60, 70, 'OL', filterOL, 'filterOL');
  
  // Reverb section
  drawEffectSection(panelX + sectionW + spacing + 10, sectionY, sectionW, sectionH, 'Reverb filter effect');
  drawToggleButton(panelX + sectionW + spacing + 25, sectionY + 30, 'Reverb', reverbEnabled, 'reverb');
  drawToggleButton(panelX + sectionW + spacing + 25, sectionY + 55, 'Duration', reverbDurationEnabled, 'reverbDuration');
  drawToggleButton(panelX + sectionW + spacing + 25, sectionY + 80, 'Reverse', reverbReverseEnabled, 'reverbReverse');
  drawMiniSlider(panelX + sectionW + spacing + 130, sectionY + 35, 70, 'DW', reverbDW, 'reverbDW');
  drawMiniSlider(panelX + sectionW + spacing + 130, sectionY + 60, 70, 'OL', reverbOL, 'reverbOL');
  
  // Dynamic compressor section
  sectionY += sectionH + 10;
  sectionH = 100;
  drawEffectSection(panelX + 10, sectionY, sectionW, sectionH, 'Dynamic compressor');
  drawToggleButton(panelX + 25, sectionY + 30, 'Compressor', compressorEnabled, 'compressor');
  drawToggleButton(panelX + 25, sectionY + 55, 'Attack', compAttackEnabled, 'compAttack');
  drawToggleButton(panelX + 25, sectionY + 80, 'Knee', compKneeEnabled, 'compKnee');
  drawMiniSlider(panelX + 130, sectionY + 35, 70, 'DW', compDW, 'compDW');
  drawMiniSlider(panelX + 130, sectionY + 60, 70, 'OL', compOL, 'compOL');
  
  // Waveshaper section
  drawEffectSection(panelX + sectionW + spacing + 10, sectionY, sectionW, sectionH, 'Waveshaper distortion');
  drawToggleButton(panelX + sectionW + spacing + 25, sectionY + 30, 'Waveshaper', waveshaperEnabled, 'waveshaper');
  drawToggleButton(panelX + sectionW + spacing + 25, sectionY + 55, 'Distortion', distortionEnabled, 'distortion');
  drawToggleButton(panelX + sectionW + spacing + 25, sectionY + 80, 'Oversample', oversampleEnabled, 'oversample');
  drawMiniSlider(panelX + sectionW + spacing + 130, sectionY + 35, 70, 'DW', waveshaperDW, 'waveshaperDW');
  drawMiniSlider(panelX + sectionW + spacing + 130, sectionY + 60, 70, 'OL', waveshaperOL, 'waveshaperOL');
  
  // Buttons at bottom of panel
  let btnY = panelY + panelH - 45;
  clearFiltersBtn.x = panelX + panelW - 200;
  clearFiltersBtn.y = btnY;
  saveEffectsBtn.x = panelX + panelW - 85;
  saveEffectsBtn.y = btnY;
  drawButton(clearFiltersBtn, clearFiltersBtn.color, 0);
  drawButton(saveEffectsBtn, saveEffectsBtn.color, 0);
}

function drawEffectSection(x, y, w, h, title, inactive = false) {
  fill(inactive ? 220 : 230);
  stroke(100);
  strokeWeight(1);
  rect(x, y, w, h, 8);
  
  fill(inactive ? 150 : 0);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(11);
  textStyle(BOLD);
  text(title, x + 5, y + 5);
}

function drawToggleButton(x, y, label, enabled, id = '') {
  push();
  
  // Store button position for interaction
  if (id) {
    if (!window.effectToggles) window.effectToggles = {};
    window.effectToggles[id] = {x: x, y: y, w: 80, h: 18, enabled: enabled};
  }
  
  // Draw button background
  if (enabled) {
    fill(80, 150, 80);  // Green when enabled
  } else {
    fill(60);
  }
  stroke(100);
  strokeWeight(1);
  rect(x, y, 80, 18, 3);
  
  // Draw label
  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(9);
  textStyle(NORMAL);
  text(label + (enabled ? ' ON' : ' OFF'), x + 40, y + 9);
  pop();
}

function drawKnob(x, y, label, inactive = false, value = 0.5, id = '') {
  // Draw knob circle
  fill(inactive ? 180 : [50, 100, 140]);
  stroke(100);
  strokeWeight(1);
  circle(x + 10, y + 6, 18);
  
  // Draw rotation indicator line
  if (!inactive) {
    let angle = map(value, 0, 1, -135, 135);
    let radAngle = radians(angle);
    let x2 = x + 10 + cos(radAngle) * 7;
    let y2 = y + 6 + sin(radAngle) * 7;
    stroke(255);
    strokeWeight(2);
    line(x + 10, y + 6, x2, y2);
  }
  
  // Draw label
  fill(inactive ? 150 : 0);
  noStroke();
  textAlign(LEFT, CENTER);
  textSize(9);
  textStyle(NORMAL);
  text(label, x + 24, y + 6);
  
  // Store bounds for interaction (only for active knobs)
  if (!inactive && id) {
    if (!window.effectKnobs) window.effectKnobs = {};
    window.effectKnobs[id] = {
      x: x + 10,
      y: y + 6,
      radius: 9,
      value: value
    };
  }
}

function drawMiniSlider(x, y, w, label, value, id = '', inactive = false) {
  // Draw label
  fill(inactive ? 150 : 0);
  noStroke();
  textAlign(LEFT, CENTER);
  textSize(9);
  textStyle(NORMAL);
  text(label, x, y);
  
  // Draw slider track
  let trackX = x + 20;
  let trackW = w - 20;
  fill(inactive ? 180 : [60, 100, 140]);
  noStroke();
  rect(trackX, y - 2, trackW, 4, 2);
  
  // Draw slider thumb
  let thumbX = trackX + value * trackW;
  fill(inactive ? 200 : 220);
  stroke(100);
  strokeWeight(1);
  rect(thumbX - 3, y - 6, 6, 12, 2);
  
  // Store bounds for interaction (only for active sliders)
  if (!inactive && id) {
    if (!window.effectSliders) window.effectSliders = {};
    window.effectSliders[id] = {
      x: trackX,
      y: y - 6,
      w: trackW,
      h: 12,
      value: value
    };
  }
}

function mousePressed() {
  // Check sound buttons (including ellipsis/load button)
  for (let i = 0; i < soundButtons.length; i++) {
    let btn = soundButtons[i];
    if (mouseX > btn.x && mouseX < btn.x + btn.w &&
        mouseY > btn.y && mouseY < btn.y + btn.h) {
      // If it's the ellipsis button (last button), trigger file load
      if (i === soundButtons.length - 1) {
        if (selectedSound !== -1 && selectedSound < soundButtons.length - 1) {
          // Create a temporary file input
          let input = createFileInput(handleFile);
          input.style('display', 'none');
          input.elt.click();
          showWarning = false;
          console.log(`Loading audio file into ${soundButtons[selectedSound].label}`);
        } else {
          showWarning = true;
          console.log('Please select a sound slot first');
        }
      } else {
        // Toggle selection - deselect if clicking the same button
        if (selectedSound === i) {
          selectedSound = -1;
          console.log(`${btn.label} deselected`);
        } else {
          selectedSound = i;
          showWarning = false;
          console.log(`${btn.label} clicked`);
          
          // Load saved effects for this sound
          if (btn.savedEffects) {
            lowPassEnabled = btn.savedEffects.lowPassEnabled;
            cutoffEnabled = btn.savedEffects.cutoffEnabled;
            resonanceEnabled = btn.savedEffects.resonanceEnabled;
            filterDW = btn.savedEffects.filterDW;
            filterOL = btn.savedEffects.filterOL;
            reverbEnabled = btn.savedEffects.reverbEnabled;
            reverbDurationEnabled = btn.savedEffects.reverbDurationEnabled;
            reverbReverseEnabled = btn.savedEffects.reverbReverseEnabled;
            reverbDW = btn.savedEffects.reverbDW;
            reverbOL = btn.savedEffects.reverbOL;
            compressorEnabled = btn.savedEffects.compressorEnabled;
            compAttackEnabled = btn.savedEffects.compAttackEnabled;
            compKneeEnabled = btn.savedEffects.compKneeEnabled;
            compDW = btn.savedEffects.compDW;
            compOL = btn.savedEffects.compOL;
            waveshaperEnabled = btn.savedEffects.waveshaperEnabled;
            distortionEnabled = btn.savedEffects.distortionEnabled;
            oversampleEnabled = btn.savedEffects.oversampleEnabled;
            waveshaperDW = btn.savedEffects.waveshaperDW;
            waveshaperOL = btn.savedEffects.waveshaperOL;
            
            // Apply loaded effects to audio processors
            applyEffectsSettings();
            console.log('Loaded saved effects for ' + btn.label);
          }
        }
      }
      return;
    }
  }
  
  // Check control buttons
  // Check delete button
  if (mouseX > deleteBtn.x && mouseX < deleteBtn.x + deleteBtn.w &&
      mouseY > deleteBtn.y && mouseY < deleteBtn.y + deleteBtn.h) {
    // Delete the loaded audio from selected sound slot
    if (selectedSound !== -1 && selectedSound < soundButtons.length - 1) {
      // Stop sound if playing
      if (soundButtons[selectedSound].sound) {
        soundButtons[selectedSound].sound.stop();
        isPlaying = false;
      }
      soundButtons[selectedSound].label = soundButtons[selectedSound].originalLabel;
      soundButtons[selectedSound].fileName = null;
      soundButtons[selectedSound].sound = null;
      console.log(`Deleted audio from ${soundButtons[selectedSound].originalLabel}`);
    }
    return;
  }
  if (mouseX > recordBtn.x && mouseX < recordBtn.x + recordBtn.w &&
      mouseY > recordBtn.y && mouseY < recordBtn.y + recordBtn.h) {
    if (selectedSound !== -1 && selectedSound < soundButtons.length - 1) {
      if (!isRecording) {
        // Start recording - this will prompt for microphone permission
        userStartAudio().then(() => {
          recordedSound = new p5.SoundFile();
          mic.start(() => {
            console.log('Microphone started, recording...');
            recorder.record(recordedSound);
            isRecording = true;
          }, (err) => {
            console.log('Microphone access denied:', err);
          });
        });
      } else {
        // Stop recording and save to selected slot
        recorder.stop();
        isRecording = false;
        
        // Save to selected sound button after a short delay
        let targetSlot = selectedSound;
        setTimeout(() => {
          soundButtons[targetSlot].sound = recordedSound;
          soundButtons[targetSlot].fileName = 'Recorded Audio';
          soundButtons[targetSlot].label = 'Recorded Audio';
          console.log('Recording saved to ' + soundButtons[targetSlot].originalLabel);
          console.log('Duration: ' + recordedSound.duration() + ' seconds');
        }, 200);
      }
    } else {
      console.log('Please select a sound slot first');
    }
    return;
  }
  
  // Check effects panel buttons
  if (mouseX > clearFiltersBtn.x && mouseX < clearFiltersBtn.x + clearFiltersBtn.w &&
      mouseY > clearFiltersBtn.y && mouseY < clearFiltersBtn.y + clearFiltersBtn.h) {
    // Reset all toggles to off
    lowPassEnabled = false;
    cutoffEnabled = false;
    resonanceEnabled = false;
    reverbEnabled = false;
    reverbDurationEnabled = false;
    reverbDecayEnabled = false;
    reverbReverseEnabled = false;
    compressorEnabled = false;
    compAttackEnabled = false;
    compKneeEnabled = false;
    compRatioEnabled = false;
    waveshaperEnabled = false;
    distortionEnabled = false;
    oversampleEnabled = false;
    
    // Reset sliders
    filterDW = 1;
    filterOL = 1;
    reverbDW = 0.5;
    reverbOL = 1;
    compDW = 0.5;
    compOL = 1;
    waveshaperDW = 0.5;
    waveshaperOL = 1;
    
    // Update filters with default values (all bypassed)
    if (lowPassFilter) {
      lowPassFilter.freq(22050);
      lowPassFilter.res(0.001);
      lowPassFilter.drywet(filterDW);
      lowPassFilter.amp(filterOL);
    }
    
    if (reverb) {
      reverb.set(0.01, 0.01, 0);
      reverb.drywet(reverbDW);
      reverb.amp(reverbOL);
    }
    
    if (compressor) {
      compressor.set(0.003, 0, 1, 0, 0.25);
      compressor.drywet(compDW);
      compressor.amp(compOL);
    }
    
    if (waveshaper) {
      waveshaper.set(0, 'none');
      waveshaper.drywet(waveshaperDW);
      waveshaper.amp(waveshaperOL);
    }
    
    console.log('Filters cleared to default');
    return;
  }
  
  if (mouseX > saveEffectsBtn.x && mouseX < saveEffectsBtn.x + saveEffectsBtn.w &&
      mouseY > saveEffectsBtn.y && mouseY < saveEffectsBtn.y + saveEffectsBtn.h) {
    // Save current effects settings to the selected sound
    if (selectedSound !== -1 && selectedSound < soundButtons.length - 1) {
      let btn = soundButtons[selectedSound];
      btn.savedEffects = {
        lowPassEnabled: lowPassEnabled,
        cutoffEnabled: cutoffEnabled,
        resonanceEnabled: resonanceEnabled,
        filterDW: filterDW,
        filterOL: filterOL,
        reverbEnabled: reverbEnabled,
        reverbDurationEnabled: reverbDurationEnabled,
        reverbReverseEnabled: reverbReverseEnabled,
        reverbDW: reverbDW,
        reverbOL: reverbOL,
        compressorEnabled: compressorEnabled,
        compAttackEnabled: compAttackEnabled,
        compKneeEnabled: compKneeEnabled,
        compDW: compDW,
        compOL: compOL,
        waveshaperEnabled: waveshaperEnabled,
        distortionEnabled: distortionEnabled,
        oversampleEnabled: oversampleEnabled,
        waveshaperDW: waveshaperDW,
        waveshaperOL: waveshaperOL
      };
      console.log('Effects saved for ' + btn.label);
    } else {
      console.log('Please select a sound slot first');
    }
    return;
  }
  
  // Handle toggle buttons
  if (window.effectToggles) {
    for (let key in window.effectToggles) {
      let toggle = window.effectToggles[key];
      if (mouseX > toggle.x && mouseX < toggle.x + toggle.w &&
          mouseY > toggle.y && mouseY < toggle.y + toggle.h) {
        // Toggle the state
        switch(key) {
          case 'lowPass':
            lowPassEnabled = !lowPassEnabled;
            if (lowPassEnabled) {
              lowPassFilter.freq(5000);
              lowPassFilter.res(1);
            } else {
              lowPassFilter.freq(22050); 
              lowPassFilter.res(0.001);  
            }
            break;
          case 'cutoff':
            cutoffEnabled = !cutoffEnabled;
            if (cutoffEnabled) {
              lowPassFilter.freq(2000);
            }
            break;
          case 'resonance':
            resonanceEnabled = !resonanceEnabled;
            if (resonanceEnabled) {
              lowPassFilter.res(10);
            } else {
              lowPassFilter.res(1);
            }
            break;
          case 'reverb':
            reverbEnabled = !reverbEnabled;
            if (reverbEnabled) {
              reverb.set(3, 2, 0);
            } else {
              reverb.set(0.01, 0.01, 0); 
            }
            break;
          case 'reverbDuration':
            reverbDurationEnabled = !reverbDurationEnabled;
            if (reverbDurationEnabled) {
              reverb.set(5, 2, 0);
            }
            break;
          case 'reverbReverse':
            reverbReverseEnabled = !reverbReverseEnabled;
            reverb.set(3, 2, reverbReverseEnabled ? 1 : 0);
            break;
          case 'compressor':
            compressorEnabled = !compressorEnabled;
            if (compressorEnabled) {
              compressor.set(0.003, 30, 12, -24, 0.25);
            } else {
              compressor.set(0.003, 0, 1, 0, 0.25); 
            }
            break;
          case 'compAttack':
            compAttackEnabled = !compAttackEnabled;
            if (compAttackEnabled) {
              compressor.attack(0.05);
            } else {
              compressor.attack(0.003);
            }
            break;
          case 'compKnee':
            compKneeEnabled = !compKneeEnabled;
            if (compKneeEnabled) {
              compressor.knee(20);
            } else {
              compressor.knee(0);
            }
            break;
          case 'waveshaper':
            waveshaperEnabled = !waveshaperEnabled;
            if (waveshaperEnabled) {
              waveshaper.set(0.5, 'none');
            } else {
              waveshaper.set(0, 'none'); 
            }
            break;
          case 'distortion':
            distortionEnabled = !distortionEnabled;
            if (distortionEnabled) {
              waveshaper.set(0.8, oversampleEnabled ? '4x' : 'none');
            } else {
              waveshaper.set(0.5, oversampleEnabled ? '4x' : 'none');
            }
            break;
          case 'oversample':
            oversampleEnabled = !oversampleEnabled;
            let currentAmount = distortionEnabled ? 0.8 : (waveshaperEnabled ? 0.5 : 0);
            waveshaper.set(currentAmount, oversampleEnabled ? '4x' : 'none');
            break;
        }
        return;
      }
    }
  }
  
  // Check playback control buttons
  if (mouseX > playPauseBtn.x && mouseX < playPauseBtn.x + playPauseBtn.w &&
      mouseY > playPauseBtn.y && mouseY < playPauseBtn.y + playPauseBtn.h) {
    // Play or pause the selected sound
    if (selectedSound !== -1 && selectedSound < soundButtons.length - 1) {
      let btn = soundButtons[selectedSound];
      if (btn.sound) {
        if (isPlaying && btn.sound.isPlaying()) {
          btn.sound.pause();
          isPlaying = false;
          console.log('Paused');
        } else {
          // Connect audio through filters before playing
          btn.sound.disconnect();
          
          // Connect input FFT to analyze original sound
          fftIn.setInput(btn.sound);
          
          // Connect audio through effects chain
          btn.sound.connect(lowPassFilter);
          lowPassFilter.connect(reverb);
          reverb.connect(compressor);
          compressor.connect(waveshaper);
          
          // Connect output FFT to analyze processed sound
          fftOut.setInput(waveshaper);
          
          btn.sound.play();
          btn.sound.setVolume(masterVolume);
          btn.sound.setLoop(isLooping);
          isPlaying = true;
          isStopped = false;
          console.log('Playing with filters');
        }
      } else {
        console.log('No audio loaded in selected slot');
      }
    } else {
      console.log('Please select a sound slot first');
    }
    return;
  }
  if (mouseX > stopBtn.x && mouseX < stopBtn.x + stopBtn.w &&
      mouseY > stopBtn.y && mouseY < stopBtn.y + stopBtn.h) {
    // Stop the selected sound
    if (selectedSound !== -1 && selectedSound < soundButtons.length - 1) {
      let btn = soundButtons[selectedSound];
      if (btn.sound && btn.sound.isPlaying()) {
        btn.sound.stop();
        isPlaying = false;
        isStopped = true;
        console.log('Stopped');
      }
    }
    return;
  }
  if (mouseX > loopBtn.x && mouseX < loopBtn.x + loopBtn.w &&
      mouseY > loopBtn.y && mouseY < loopBtn.y + loopBtn.h) {
    // Toggle looping
    isLooping = !isLooping;
    console.log('Looping ' + (isLooping ? 'enabled' : 'disabled'));
    
    // Apply loop setting to currently playing sound
    if (selectedSound !== -1 && selectedSound < soundButtons.length - 1) {
      let btn = soundButtons[selectedSound];
      if (btn.sound) {
        btn.sound.setLoop(isLooping);
      }
    }
    return;
  }
  if (mouseX > skipBtn.x && mouseX < skipBtn.x + skipBtn.w &&
      mouseY > skipBtn.y && mouseY < skipBtn.y + skipBtn.h) {
    // Skip to start of the selected sound
    if (selectedSound !== -1 && selectedSound < soundButtons.length - 1) {
      let btn = soundButtons[selectedSound];
      if (btn.sound) {
        btn.sound.jump(0);
        console.log('Skipped to start');
      }
    }
    return;
  }
}

function mouseDragged() {
  // Handle volume slider dragging
  if (volumeSlider && mouseX >= volumeSlider.x && mouseX <= volumeSlider.x + volumeSlider.w &&
      mouseY >= volumeSlider.y && mouseY <= volumeSlider.y + volumeSlider.h) {
    masterVolume = constrain((mouseX - volumeSlider.x) / volumeSlider.w, 0, 1);
    
    // Update volume of currently playing sound in real-time
    if (selectedSound !== -1 && selectedSound < soundButtons.length - 1) {
      let btn = soundButtons[selectedSound];
      if (btn.sound && btn.sound.isPlaying()) {
        btn.sound.setVolume(masterVolume);
      }
    }
  }
  
  // Handle effects knobs - using vertical drag
  if (window.effectKnobs) {
    let knob = window.effectKnobs.cutoffFreq;
    if (knob) {
      let d = dist(mouseX, mouseY, knob.x, knob.y);
      if (d < 20) {  
        // Larger hit area for easier interaction
        // Use vertical mouse movement to adjust (drag down = increase, drag up = decrease)
        let sensitivity = 0.005;
        cutoffKnobAngle = constrain(cutoffKnobAngle + (mouseY - pmouseY) * sensitivity, 0, 1);
        // Update filter cutoff (20Hz to 20000Hz)
        filterCutoff = map(cutoffKnobAngle, 0, 1, 20, 20000);
        if (lowPassFilter) {
          lowPassFilter.freq(filterCutoff);
        }
      }
    }
    
    knob = window.effectKnobs.resonance;
    if (knob) {
      let d = dist(mouseX, mouseY, knob.x, knob.y);
      if (d < 20) {  
        // Larger hit area for easier interaction
        // Use vertical mouse movement to adjust
        let sensitivity = 0.005;
        resonanceKnobAngle = constrain(resonanceKnobAngle + (mouseY - pmouseY) * sensitivity, 0, 1);
        // Update filter resonance (0.001 to 50)
        filterResonance = map(resonanceKnobAngle, 0, 1, 0.001, 50);
        if (lowPassFilter) {
          lowPassFilter.res(filterResonance);
        }
      }
    }
    
    // Reverb Duration knob
    knob = window.effectKnobs.reverbDuration;
    if (knob) {
      let d = dist(mouseX, mouseY, knob.x, knob.y);
      if (d < 20) {
        let sensitivity = 0.005;
        reverbDurationAngle = constrain(reverbDurationAngle + (mouseY - pmouseY) * sensitivity, 0, 1);
        // Update reverb duration (0.01 to 10 seconds)
        reverbDuration = map(reverbDurationAngle, 0, 1, 0.01, 10);
        if (reverb) {
          reverb.set(reverbDuration, reverbDecay, reverbReverse);
        }
      }
    }
    
    // Reverb Decay knob
    knob = window.effectKnobs.reverbDecay;
    if (knob) {
      let d = dist(mouseX, mouseY, knob.x, knob.y);
      if (d < 20) {
        let sensitivity = 0.005;
        reverbDecayAngle = constrain(reverbDecayAngle + (mouseY - pmouseY) * sensitivity, 0, 1);
        // Update reverb decay (0.01 to 10 seconds)
        reverbDecay = map(reverbDecayAngle, 0, 1, 0.01, 10);
        if (reverb) {
          reverb.set(reverbDuration, reverbDecay, reverbReverse);
        }
      }
    }
    
    // Reverb Reverse knob
    knob = window.effectKnobs.reverbReverse;
    if (knob) {
      let d = dist(mouseX, mouseY, knob.x, knob.y);
      if (d < 20) {
        let sensitivity = 0.005;
        reverbReverseAngle = constrain(reverbReverseAngle + (mouseY - pmouseY) * sensitivity, 0, 1);
        // Reverse is binary (0 or 1), use threshold at 0.5
        reverbReverse = reverbReverseAngle > 0.5 ? 1 : 0;
        if (reverb) {
          reverb.set(reverbDuration, reverbDecay, reverbReverse);
        }
      }
    }
    
    // Compressor Attack knob
    knob = window.effectKnobs.compAttack;
    if (knob) {
      let d = dist(mouseX, mouseY, knob.x, knob.y);
      if (d < 20) {
        let sensitivity = 0.005;
        compAttackAngle = constrain(compAttackAngle + (mouseY - pmouseY) * sensitivity, 0, 1);
        // Update compressor attack (0.003 to 1 seconds)
        compAttack = map(compAttackAngle, 0, 1, 0.003, 1);
        if (compressor) {
          compressor.set(compAttack, compKnee, compRatio, compThreshold, compRelease);
        }
      }
    }
    
    // Compressor Knee knob
    knob = window.effectKnobs.compKnee;
    if (knob) {
      let d = dist(mouseX, mouseY, knob.x, knob.y);
      if (d < 20) {
        let sensitivity = 0.005;
        compKneeAngle = constrain(compKneeAngle + (mouseY - pmouseY) * sensitivity, 0, 1);
        // Update compressor knee (0 to 40 dB)
        compKnee = map(compKneeAngle, 0, 1, 0, 40);
        if (compressor) {
          compressor.set(compAttack, compKnee, compRatio, compThreshold, compRelease);
        }
      }
    }
    
    // Compressor Ratio knob
    knob = window.effectKnobs.compRatio;
    if (knob) {
      let d = dist(mouseX, mouseY, knob.x, knob.y);
      if (d < 20) {
        let sensitivity = 0.005;
        compRatioAngle = constrain(compRatioAngle + (mouseY - pmouseY) * sensitivity, 0, 1);
        // Update compressor ratio (1 to 20)
        compRatio = map(compRatioAngle, 0, 1, 1, 20);
        if (compressor) {
          compressor.set(compAttack, compKnee, compRatio, compThreshold, compRelease);
        }
      }
    }
  }
  
  // Handle effects sliders
  if (window.effectSliders) {
    let slider = window.effectSliders.filterDW;
    if (slider && mouseX >= slider.x && mouseX <= slider.x + slider.w &&
        mouseY >= slider.y && mouseY <= slider.y + slider.h) {
      filterDW = constrain((mouseX - slider.x) / slider.w, 0, 1);
      if (lowPassFilter) lowPassFilter.drywet(filterDW);
    }
    
    slider = window.effectSliders.filterOL;
    if (slider && mouseX >= slider.x && mouseX <= slider.x + slider.w &&
        mouseY >= slider.y && mouseY <= slider.y + slider.h) {
      filterOL = constrain((mouseX - slider.x) / slider.w, 0, 1);
      if (lowPassFilter) lowPassFilter.amp(filterOL);
    }
    
    // Reverb sliders
    slider = window.effectSliders.reverbDW;
    if (slider && mouseX >= slider.x && mouseX <= slider.x + slider.w &&
        mouseY >= slider.y && mouseY <= slider.y + slider.h) {
      reverbDW = constrain((mouseX - slider.x) / slider.w, 0, 1);
      if (reverb) reverb.drywet(reverbDW);
    }
    
    slider = window.effectSliders.reverbOL;
    if (slider && mouseX >= slider.x && mouseX <= slider.x + slider.w &&
        mouseY >= slider.y && mouseY <= slider.y + slider.h) {
      reverbOL = constrain((mouseX - slider.x) / slider.w, 0, 1);
      if (reverb) reverb.amp(reverbOL);
    }
    
    // Compressor sliders
    slider = window.effectSliders.compDW;
    if (slider && mouseX >= slider.x && mouseX <= slider.x + slider.w &&
        mouseY >= slider.y && mouseY <= slider.y + slider.h) {
      compDW = constrain((mouseX - slider.x) / slider.w, 0, 1);
      if (compressor) compressor.drywet(compDW);
    }
    
    slider = window.effectSliders.compOL;
    if (slider && mouseX >= slider.x && mouseX <= slider.x + slider.w &&
        mouseY >= slider.y && mouseY <= slider.y + slider.h) {
      compOL = constrain((mouseX - slider.x) / slider.w, 0, 1);
      if (compressor) compressor.amp(compOL);
    }
    
    // Waveshaper sliders
    slider = window.effectSliders.waveshaperDW;
    if (slider && mouseX >= slider.x && mouseX <= slider.x + slider.w &&
        mouseY >= slider.y && mouseY <= slider.y + slider.h) {
      waveshaperDW = constrain((mouseX - slider.x) / slider.w, 0, 1);
      if (waveshaper) waveshaper.drywet(waveshaperDW);
    }
    
    slider = window.effectSliders.waveshaperOL;
    if (slider && mouseX >= slider.x && mouseX <= slider.x + slider.w &&
        mouseY >= slider.y && mouseY <= slider.y + slider.h) {
      waveshaperOL = constrain((mouseX - slider.x) / slider.w, 0, 1);
      if (waveshaper) waveshaper.amp(waveshaperOL);
    }
  }
}

function handleFile(file) {
  if (file.type === 'audio') {
    console.log(`Audio file loaded: ${file.name} into slot ${selectedSound + 1}`);
    // Update the button label to the file name
    soundButtons[selectedSound].fileName = file.name;
    soundButtons[selectedSound].label = file.name;
    // Load the file as a p5.SoundFile
    soundButtons[selectedSound].sound = loadSound(file.data, () => {
      console.log('Audio ready to play');
    });
  } else {
    console.log('Please select an audio file');
  }
}

function applyEffectsSettings() {
  // Apply low-pass filter
  if (lowPassEnabled) {
    lowPassFilter.freq(cutoffEnabled ? 2000 : 5000);
    lowPassFilter.res(resonanceEnabled ? 10 : 1);
  } else {
    lowPassFilter.freq(22050);
    lowPassFilter.res(0.001);
  }
  lowPassFilter.drywet(filterDW);
  lowPassFilter.amp(filterOL);
  
  // Apply reverb
  if (reverbEnabled) {
    let duration = reverbDurationEnabled ? 5 : 3;
    reverb.set(duration, 2, reverbReverseEnabled ? 1 : 0);
  } else {
    reverb.set(0.01, 0.01, 0);
  }
  reverb.drywet(reverbDW);
  reverb.amp(reverbOL);
  
  // Apply compressor
  if (compressorEnabled) {
    let attack = compAttackEnabled ? 0.05 : 0.003;
    let knee = compKneeEnabled ? 20 : 30;
    compressor.set(attack, knee, 12, -24, 0.25);
  } else {
    compressor.set(0.003, 0, 1, 0, 0.25);
  }
  compressor.drywet(compDW);
  compressor.amp(compOL);
  
  // Apply waveshaper
  let distAmount = 0;
  if (waveshaperEnabled) distAmount = 0.5;
  if (distortionEnabled) distAmount = 0.8;
  let oversample = oversampleEnabled ? '4x' : 'none';
  waveshaper.set(distAmount, oversample);
  waveshaper.drywet(waveshaperDW);
  waveshaper.amp(waveshaperOL);
}