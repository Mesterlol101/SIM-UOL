// ============================================
// Web Audio Application with p5.js and p5.sound
// Effects Chain: Low-Pass Filter -> Waveshaper -> Compressor -> Reverb -> Master Volume
// ============================================

// Sound and playback variables
let soundLibrary = [];
let currentSound = null;
let currentSoundIndex = -1;
let isPlaying = false;
let isLooping = false;
let isRecording = false;

// Audio effects chain
let lowPassFilter;
let waveShaperDistortion;
let dynamicCompressor;
let reverb;
let masterVolume;

// FFT analyzers for spectrum display
let fftInput;
let fftOutput;

// Recorder
let recorder;
let soundFile;

// UI Elements
let playBtn, stopBtn, loopBtn, skipBtn;
let recordBtn, clearFiltersBtn, saveBtn;
let masterVolumeSlider;

// Low-pass filter controls
let lpfFreqSlider, lpfResSlider, lpfDryWetSlider, lpfOutputSlider;

// Reverb controls
let reverbDurationSlider, reverbDecaySlider, reverbDryWetSlider, reverbOutputSlider, reverbReverseCheckbox;

// Compressor controls
let compAttackSlider, compKneeSlider, compReleaseSlider, compThresholdSlider;
let compDryWetSlider, compOutputSlider;

// Waveshaper controls
let wsAmountSlider, wsOversampleSelect, wsDryWetSlider, wsOutputSlider;

// Sound library UI
let libraryPanel;
let editBtn, deleteBtn, recordNewBtn;

// Layout constants
const PANEL_MARGIN = 10;
const SLIDER_WIDTH = 100;
const SLIDER_HEIGHT = 20;

// Pre-loaded sounds storage (using localStorage)
let savedSounds = [];

function preload() {
  // Load saved sounds from localStorage
  loadSavedSoundsFromStorage();
}

function setup() {
  createCanvas(1200, 700);
  userStartAudio();
  
  // Initialize audio effects chain
  initializeEffectsChain();
  
  // Initialize FFT analyzers
  fftInput = new p5.FFT(0.8, 256);
  fftOutput = new p5.FFT(0.8, 256);
  
  // Initialize recorder
  recorder = new p5.SoundRecorder();
  soundFile = new p5.SoundFile();
  
  // Create UI
  createUI();
  
  // Load default sample sounds if available
  loadDefaultSounds();
}

function initializeEffectsChain() {
  // Create effects in chain order
  // Sound -> Low-Pass Filter -> Waveshaper -> Compressor -> Reverb -> Master Volume -> Output
  
  masterVolume = new p5.Gain();
  masterVolume.connect();
  
  reverb = new p5.Reverb();
  reverb.disconnect();
  reverb.connect(masterVolume);
  
  dynamicCompressor = new p5.Compressor();
  dynamicCompressor.disconnect();
  dynamicCompressor.connect(reverb);
  
  // Waveshaper using p5.Distortion
  waveShaperDistortion = new p5.Distortion(0.1, '2x');
  waveShaperDistortion.disconnect();
  waveShaperDistortion.connect(dynamicCompressor);
  
  lowPassFilter = new p5.LowPass();
  lowPassFilter.disconnect();
  lowPassFilter.connect(waveShaperDistortion);
  
  // Set default values
  lowPassFilter.freq(22050);
  lowPassFilter.res(1);
  
  dynamicCompressor.attack(0.003);
  dynamicCompressor.knee(30);
  dynamicCompressor.release(0.25);
  dynamicCompressor.threshold(-24);
  
  masterVolume.amp(0.8);
}

function createUI() {
  // === Sound Library Panel ===
  createSoundLibraryPanel();
  
  // === Playback Controls ===
  createPlaybackControls();
  
  // === Effects Panel ===
  createEffectsPanel();
  
  // === Master Volume ===
  createMasterVolumeControl();
}

function createSoundLibraryPanel() {
  let panelX = 20;
  let panelY = 50;
  
  // Library buttons
  editBtn = createButton('Edit');
  editBtn.position(panelX, panelY + 280);
  editBtn.mousePressed(editSelectedSound);
  editBtn.style('font-size', '12px');
  editBtn.style('padding', '5px 10px');
  
  deleteBtn = createButton('Delete');
  deleteBtn.position(panelX + 45, panelY + 280);
  deleteBtn.mousePressed(deleteSelectedSound);
  deleteBtn.style('font-size', '12px');
  deleteBtn.style('padding', '5px 10px');
  
  recordNewBtn = createButton('Record New');
  recordNewBtn.position(panelX + 100, panelY + 280);
  recordNewBtn.mousePressed(recordNewSound);
  recordNewBtn.style('font-size', '12px');
  recordNewBtn.style('padding', '5px 10px');
}

function createPlaybackControls() {
  let controlX = 220;
  let controlY = 50;
  
  playBtn = createButton('Play/Pause');
  playBtn.position(controlX, controlY);
  playBtn.mousePressed(togglePlay);
  playBtn.style('background-color', '#4a90d9');
  playBtn.style('color', 'white');
  playBtn.style('padding', '10px 15px');
  
  stopBtn = createButton('Stop');
  stopBtn.position(controlX + 95, controlY);
  stopBtn.mousePressed(stopSound);
  stopBtn.style('padding', '10px 15px');
  
  loopBtn = createButton('Loop');
  loopBtn.position(controlX + 150, controlY);
  loopBtn.mousePressed(toggleLoop);
  loopBtn.style('padding', '10px 15px');
  
  skipBtn = createButton('Skip to Start');
  skipBtn.position(controlX + 205, controlY);
  skipBtn.mousePressed(skipToStart);
  skipBtn.style('padding', '10px 15px');
}

function createEffectsPanel() {
  let panelX = 220;
  let panelY = 150;
  let colWidth = 240;
  
  // === Low-Pass Filter ===
  createElement('h4', 'Low-Pass Filter').position(panelX, panelY - 20);
  
  createElement('span', 'Cutoff Freq').position(panelX, panelY + 20);
  lpfFreqSlider = createSlider(100, 22050, 22050, 1);
  lpfFreqSlider.position(panelX + 80, panelY + 20);
  lpfFreqSlider.style('width', SLIDER_WIDTH + 'px');
  
  createElement('span', 'Resonance').position(panelX, panelY + 50);
  lpfResSlider = createSlider(0.01, 30, 1, 0.01);
  lpfResSlider.position(panelX + 80, panelY + 50);
  lpfResSlider.style('width', SLIDER_WIDTH + 'px');
  
  createElement('span', 'D/W').position(panelX, panelY + 80);
  lpfDryWetSlider = createSlider(0, 1, 1, 0.01);
  lpfDryWetSlider.position(panelX + 80, panelY + 80);
  lpfDryWetSlider.style('width', SLIDER_WIDTH + 'px');
  
  createElement('span', 'Output').position(panelX, panelY + 110);
  lpfOutputSlider = createSlider(0, 1, 1, 0.01);
  lpfOutputSlider.position(panelX + 80, panelY + 110);
  lpfOutputSlider.style('width', SLIDER_WIDTH + 'px');
  
  // === Reverb ===
  let reverbX = panelX + colWidth;
  createElement('h4', 'Reverb Filter').position(reverbX, panelY - 20);
  
  createElement('span', 'Duration').position(reverbX, panelY + 20);
  reverbDurationSlider = createSlider(0.1, 10, 3, 0.1);
  reverbDurationSlider.position(reverbX + 80, panelY + 20);
  reverbDurationSlider.style('width', SLIDER_WIDTH + 'px');
  
  createElement('span', 'Decay').position(reverbX, panelY + 50);
  reverbDecaySlider = createSlider(0, 100, 2, 1);
  reverbDecaySlider.position(reverbX + 80, panelY + 50);
  reverbDecaySlider.style('width', SLIDER_WIDTH + 'px');
  
  createElement('span', 'D/W').position(reverbX, panelY + 80);
  reverbDryWetSlider = createSlider(0, 1, 0.5, 0.01);
  reverbDryWetSlider.position(reverbX + 80, panelY + 80);
  reverbDryWetSlider.style('width', SLIDER_WIDTH + 'px');
  
  createElement('span', 'Output').position(reverbX, panelY + 110);
  reverbOutputSlider = createSlider(0, 1, 1, 0.01);
  reverbOutputSlider.position(reverbX + 80, panelY + 110);
  reverbOutputSlider.style('width', SLIDER_WIDTH + 'px');
  
  createElement('span', 'Reverse').position(reverbX, panelY + 140);
  reverbReverseCheckbox = createCheckbox('', false);
  reverbReverseCheckbox.position(reverbX + 80, panelY + 140);
  
  // === Dynamic Compressor ===
  let compX = panelX;
  let compY = panelY + 200;
  createElement('h4', 'Dynamic Compressor').position(compX, compY - 20);
  
  createElement('span', 'Attack').position(compX, compY + 20);
  compAttackSlider = createSlider(0, 1, 0.003, 0.001);
  compAttackSlider.position(compX + 80, compY + 20);
  compAttackSlider.style('width', SLIDER_WIDTH + 'px');
  
  createElement('span', 'Knee').position(compX, compY + 50);
  compKneeSlider = createSlider(0, 40, 30, 1);
  compKneeSlider.position(compX + 80, compY + 50);
  compKneeSlider.style('width', SLIDER_WIDTH + 'px');
  
  createElement('span', 'Release').position(compX, compY + 80);
  compReleaseSlider = createSlider(0, 1, 0.25, 0.01);
  compReleaseSlider.position(compX + 80, compY + 80);
  compReleaseSlider.style('width', SLIDER_WIDTH + 'px');
  
  createElement('span', 'Ratio').position(compX, compY + 110);
  let compRatioSlider = createSlider(1, 20, 12, 1);
  compRatioSlider.position(compX + 80, compY + 110);
  compRatioSlider.style('width', SLIDER_WIDTH + 'px');
  
  createElement('span', 'Threshold').position(compX, compY + 140);
  compThresholdSlider = createSlider(-100, 0, -24, 1);
  compThresholdSlider.position(compX + 80, compY + 140);
  compThresholdSlider.style('width', SLIDER_WIDTH + 'px');
  
  createElement('span', 'D/W').position(compX, compY + 170);
  compDryWetSlider = createSlider(0, 1, 1, 0.01);
  compDryWetSlider.position(compX + 80, compY + 170);
  compDryWetSlider.style('width', SLIDER_WIDTH + 'px');
  
  createElement('span', 'Output').position(compX, compY + 200);
  compOutputSlider = createSlider(0, 1, 1, 0.01);
  compOutputSlider.position(compX + 80, compY + 200);
  compOutputSlider.style('width', SLIDER_WIDTH + 'px');
  
  // === Waveshaper Distortion ===
  let wsX = panelX + colWidth;
  let wsY = compY;
  createElement('h4', 'Waveshaper Distortion').position(wsX, wsY - 20);
  
  createElement('span', 'Amount').position(wsX, wsY + 20);
  wsAmountSlider = createSlider(0, 1, 0.1, 0.01);
  wsAmountSlider.position(wsX + 80, wsY + 20);
  wsAmountSlider.style('width', SLIDER_WIDTH + 'px');
  
  createElement('span', 'Oversample').position(wsX, wsY + 50);
  wsOversampleSelect = createSelect();
  wsOversampleSelect.position(wsX + 80, wsY + 50);
  wsOversampleSelect.option('none');
  wsOversampleSelect.option('2x');
  wsOversampleSelect.option('4x');
  wsOversampleSelect.selected('2x');
  
  createElement('span', 'D/W').position(wsX, wsY + 80);
  wsDryWetSlider = createSlider(0, 1, 1, 0.01);
  wsDryWetSlider.position(wsX + 80, wsY + 80);
  wsDryWetSlider.style('width', SLIDER_WIDTH + 'px');
  
  createElement('span', 'Output').position(wsX, wsY + 110);
  wsOutputSlider = createSlider(0, 1, 1, 0.01);
  wsOutputSlider.position(wsX + 80, wsY + 110);
  wsOutputSlider.style('width', SLIDER_WIDTH + 'px');
  
  // === Control Buttons ===
  let btnY = wsY + 160;
  clearFiltersBtn = createButton('Clear Filters');
  clearFiltersBtn.position(panelX + colWidth - 60, btnY);
  clearFiltersBtn.mousePressed(clearAllFilters);
  clearFiltersBtn.style('background-color', '#e07b53');
  clearFiltersBtn.style('color', 'white');
  clearFiltersBtn.style('padding', '10px 15px');
  
  saveBtn = createButton('Save');
  saveBtn.position(panelX + colWidth + 60, btnY);
  saveBtn.mousePressed(saveCurrentSettings);
  saveBtn.style('background-color', '#5a5a5a');
  saveBtn.style('color', 'white');
  saveBtn.style('padding', '10px 15px');
  
  // Record button
  recordBtn = createButton('Record');
  recordBtn.position(panelX + colWidth + 120, btnY);
  recordBtn.mousePressed(toggleRecording);
  recordBtn.style('background-color', '#d9534f');
  recordBtn.style('color', 'white');
  recordBtn.style('padding', '10px 15px');
}

function createMasterVolumeControl() {
  let volX = 950;
  let volY = 50;
  
  createElement('h4', 'Master Volume').position(volX, volY - 20);
  masterVolumeSlider = createSlider(0, 1, 0.8, 0.01);
  masterVolumeSlider.position(volX, volY + 20);
  masterVolumeSlider.style('width', '150px');
  masterVolumeSlider.style('transform', 'rotate(-90deg)');
  masterVolumeSlider.style('transform-origin', 'left center');
}

function draw() {
  background(240);
  
  // Update effects parameters
  updateEffectsParameters();
  
  // Draw UI sections
  drawSoundLibraryPanel();
  drawSpectrumDisplays();
  drawRecordingEffectsPanel();
  drawPlaybackStatus();
}

function updateEffectsParameters() {
  // Low-pass filter
  if (lowPassFilter) {
    lowPassFilter.freq(lpfFreqSlider.value());
    lowPassFilter.res(lpfResSlider.value());
    lowPassFilter.drywet(lpfDryWetSlider.value());
    lowPassFilter.amp(lpfOutputSlider.value());
  }
  
  // Reverb
  if (reverb && reverbDurationSlider && reverbDecaySlider) {
    reverb.drywet(reverbDryWetSlider.value());
    reverb.amp(reverbOutputSlider.value());
  }
  
  // Compressor
  if (dynamicCompressor) {
    dynamicCompressor.attack(compAttackSlider.value());
    dynamicCompressor.knee(compKneeSlider.value());
    dynamicCompressor.release(compReleaseSlider.value());
    dynamicCompressor.threshold(compThresholdSlider.value());
    dynamicCompressor.drywet(compDryWetSlider.value());
  }
  
  // Waveshaper
  if (waveShaperDistortion) {
    waveShaperDistortion.set(wsAmountSlider.value(), wsOversampleSelect.value());
    waveShaperDistortion.drywet(wsDryWetSlider.value());
    waveShaperDistortion.amp(wsOutputSlider.value());
  }
  
  // Master volume
  if (masterVolume && masterVolumeSlider) {
    masterVolume.amp(masterVolumeSlider.value());
  }
}

function drawSoundLibraryPanel() {
  // Panel background
  fill(200);
  stroke(100);
  strokeWeight(2);
  rect(15, 30, 190, 300, 5);
  
  // Title
  fill(0);
  noStroke();
  textSize(14);
  textStyle(BOLD);
  text('Pre-recorded Sounds Library', 25, 50);
  textStyle(NORMAL);
  
  // Draw sound items
  let startY = 70;
  let itemHeight = 35;
  
  for (let i = 0; i < min(soundLibrary.length, 6); i++) {
    let y = startY + i * itemHeight;
    
    // Highlight selected
    if (i === currentSoundIndex) {
      fill(100, 150, 200);
    } else {
      fill(220);
    }
    stroke(150);
    strokeWeight(1);
    rect(25, y, 170, itemHeight - 5, 3);
    
    // Sound name
    fill(0);
    noStroke();
    textSize(12);
    text(soundLibrary[i].name || `Sound ${i + 1}`, 35, y + 20);
  }
  
  // Show ellipsis if more sounds
  if (soundLibrary.length > 6) {
    fill(100);
    textSize(12);
    text('...', 100, startY + 6 * itemHeight + 10);
  }
  
  // Empty state
  if (soundLibrary.length === 0) {
    fill(100);
    textSize(11);
    text('No sounds loaded.', 50, 120);
    text('Click "Record New" to add.', 40, 140);
  }
}

function drawSpectrumDisplays() {
  let spectrumY = 100;
  
  // Spectrum In (original signal)
  fill(50);
  stroke(100);
  strokeWeight(2);
  rect(700, spectrumY, 220, 150, 5);
  
  fill(255);
  noStroke();
  textSize(12);
  textStyle(BOLD);
  text('Spectrum In', 770, spectrumY - 5);
  textStyle(NORMAL);
  
  // Draw input spectrum
  if (fftInput && currentSound && currentSound.isPlaying()) {
    let spectrum = fftInput.analyze();
    noFill();
    stroke(0, 255, 0);
    strokeWeight(1);
    beginShape();
    for (let i = 0; i < spectrum.length; i++) {
      let x = map(i, 0, spectrum.length, 705, 915);
      let y = map(spectrum[i], 0, 255, spectrumY + 145, spectrumY + 5);
      vertex(x, y);
    }
    endShape();
  }
  
  // Spectrum Out (processed signal)
  fill(50);
  stroke(100);
  strokeWeight(2);
  rect(950, spectrumY, 220, 150, 5);
  
  fill(255);
  noStroke();
  textSize(12);
  textStyle(BOLD);
  text('Spectrum Out', 1020, spectrumY - 5);
  textStyle(NORMAL);
  
  // Draw output spectrum
  if (fftOutput && currentSound && currentSound.isPlaying()) {
    let spectrum = fftOutput.analyze();
    noFill();
    stroke(0, 200, 255);
    strokeWeight(1);
    beginShape();
    for (let i = 0; i < spectrum.length; i++) {
      let x = map(i, 0, spectrum.length, 955, 1165);
      let y = map(spectrum[i], 0, 255, spectrumY + 145, spectrumY + 5);
      vertex(x, y);
    }
    endShape();
  }
}

function drawRecordingEffectsPanel() {
  // Panel title
  fill(0);
  noStroke();
  textSize(14);
  textStyle(BOLD);
  text('Recording Effects Panel', 220, 130);
  textStyle(NORMAL);
  
  // Panel border
  noFill();
  stroke(180);
  strokeWeight(2);
  rect(215, 140, 480, 430, 5);
}

function drawPlaybackStatus() {
  // Status display
  fill(0);
  textSize(12);
  
  let statusY = 650;
  text('Status: ' + (isPlaying ? 'Playing' : 'Stopped'), 220, statusY);
  text('Loop: ' + (isLooping ? 'ON' : 'OFF'), 350, statusY);
  text('Recording: ' + (isRecording ? 'ON' : 'OFF'), 450, statusY);
  
  if (currentSound && currentSound.isLoaded()) {
    let duration = currentSound.duration().toFixed(1);
    let currentTime = currentSound.currentTime().toFixed(1);
    text(`Time: ${currentTime}s / ${duration}s`, 580, statusY);
  }
  
  // Update loop button color
  if (loopBtn) {
    if (isLooping) {
      loopBtn.style('background-color', '#5cb85c');
      loopBtn.style('color', 'white');
    } else {
      loopBtn.style('background-color', '');
      loopBtn.style('color', '');
    }
  }
  
  // Update record button color
  if (recordBtn) {
    if (isRecording) {
      recordBtn.style('background-color', '#ff0000');
      recordBtn.html('Stop Rec');
    } else {
      recordBtn.style('background-color', '#d9534f');
      recordBtn.html('Record');
    }
  }
}

// ============================================
// Sound Playback Functions
// ============================================

function togglePlay() {
  if (!currentSound || !currentSound.isLoaded()) {
    console.log('No sound loaded');
    return;
  }
  
  if (currentSound.isPlaying()) {
    currentSound.pause();
    isPlaying = false;
  } else {
    currentSound.play();
    isPlaying = true;
  }
}

function stopSound() {
  if (currentSound && currentSound.isLoaded()) {
    currentSound.stop();
    isPlaying = false;
  }
}

function toggleLoop() {
  isLooping = !isLooping;
  if (currentSound && currentSound.isLoaded()) {
    currentSound.setLoop(isLooping);
  }
}

function skipToStart() {
  if (currentSound && currentSound.isLoaded()) {
    currentSound.jump(0);
  }
}

// ============================================
// Sound Library Functions
// ============================================

function loadDefaultSounds() {
  // Create empty sound entries for demonstration
  // Users can load their own sounds or record new ones
  console.log('Sound library initialized. Use "Record New" to add sounds.');
}

function selectSound(index) {
  if (index >= 0 && index < soundLibrary.length) {
    // Stop current sound
    if (currentSound && currentSound.isPlaying()) {
      currentSound.stop();
    }
    
    currentSoundIndex = index;
    currentSound = soundLibrary[index].sound;
    
    // Connect to effects chain
    connectSoundToEffects(currentSound);
    
    // Load saved effects settings if available
    loadSoundSettings(index);
    
    console.log('Selected: ' + soundLibrary[index].name);
  }
}

function connectSoundToEffects(sound) {
  if (!sound) return;
  
  // Disconnect from default output
  sound.disconnect();
  
  // Connect to effects chain: Sound -> LPF -> Waveshaper -> Compressor -> Reverb -> Master
  sound.connect(lowPassFilter);
  
  // Set up FFT input (before effects)
  fftInput.setInput(sound);
  
  // Set up FFT output (after effects)
  fftOutput.setInput(masterVolume);
  
  // Set loop state
  sound.setLoop(isLooping);
}

function editSelectedSound() {
  if (currentSoundIndex < 0 || currentSoundIndex >= soundLibrary.length) {
    alert('Please select a sound first');
    return;
  }
  
  let newName = prompt('Enter new name for the sound:', soundLibrary[currentSoundIndex].name);
  if (newName) {
    soundLibrary[currentSoundIndex].name = newName;
    saveSoundsToStorage();
  }
}

function deleteSelectedSound() {
  if (currentSoundIndex < 0 || currentSoundIndex >= soundLibrary.length) {
    alert('Please select a sound first');
    return;
  }
  
  if (confirm('Delete this sound?')) {
    // Stop if playing
    if (currentSound && currentSound.isPlaying()) {
      currentSound.stop();
    }
    
    soundLibrary.splice(currentSoundIndex, 1);
    currentSoundIndex = -1;
    currentSound = null;
    saveSoundsToStorage();
  }
}

function recordNewSound() {
  // Create file input for loading audio files
  let input = createFileInput(handleFile);
  input.position(0, 0);
  input.style('display', 'none');
  input.elt.click();
  
  // Remove input after selection
  setTimeout(() => input.remove(), 60000);
}

function handleFile(file) {
  if (file.type === 'audio') {
    loadSound(file.data, (loadedSound) => {
      let soundName = file.name || `Sound ${soundLibrary.length + 1}`;
      
      soundLibrary.push({
        name: soundName,
        sound: loadedSound,
        settings: getDefaultSettings()
      });
      
      // Auto-select the new sound
      selectSound(soundLibrary.length - 1);
      saveSoundsToStorage();
      
      console.log('Loaded: ' + soundName);
    }, (err) => {
      console.error('Error loading sound:', err);
      alert('Error loading audio file');
    });
  } else {
    alert('Please select an audio file');
  }
}

// ============================================
// Recording Functions
// ============================================

function toggleRecording() {
  if (!isRecording) {
    // Start recording
    soundFile = new p5.SoundFile();
    recorder.setInput(masterVolume);
    recorder.record(soundFile);
    isRecording = true;
    console.log('Recording started...');
  } else {
    // Stop recording
    recorder.stop();
    isRecording = false;
    console.log('Recording stopped');
    
    // Save the recorded file
    setTimeout(() => {
      saveRecording();
    }, 100);
  }
}

function saveRecording() {
  if (soundFile && soundFile.duration() > 0) {
    // Save as WAV file
    save(soundFile, 'recorded_sound.wav');
    
    // Also add to library
    let recordedName = `Recording ${soundLibrary.length + 1}`;
    soundLibrary.push({
      name: recordedName,
      sound: soundFile,
      settings: getCurrentSettings()
    });
    
    selectSound(soundLibrary.length - 1);
    console.log('Recording saved: ' + recordedName);
  }
}

// ============================================
// Effects Settings Functions
// ============================================

function getDefaultSettings() {
  return {
    lpfFreq: 22050,
    lpfRes: 1,
    lpfDryWet: 1,
    lpfOutput: 1,
    reverbDuration: 3,
    reverbDecay: 2,
    reverbDryWet: 0.5,
    reverbOutput: 1,
    reverbReverse: false,
    compAttack: 0.003,
    compKnee: 30,
    compRelease: 0.25,
    compThreshold: -24,
    compDryWet: 1,
    compOutput: 1,
    wsAmount: 0.1,
    wsOversample: '2x',
    wsDryWet: 1,
    wsOutput: 1,
    masterVolume: 0.8
  };
}

function getCurrentSettings() {
  return {
    lpfFreq: lpfFreqSlider.value(),
    lpfRes: lpfResSlider.value(),
    lpfDryWet: lpfDryWetSlider.value(),
    lpfOutput: lpfOutputSlider.value(),
    reverbDuration: reverbDurationSlider.value(),
    reverbDecay: reverbDecaySlider.value(),
    reverbDryWet: reverbDryWetSlider.value(),
    reverbOutput: reverbOutputSlider.value(),
    reverbReverse: reverbReverseCheckbox.checked(),
    compAttack: compAttackSlider.value(),
    compKnee: compKneeSlider.value(),
    compRelease: compReleaseSlider.value(),
    compThreshold: compThresholdSlider.value(),
    compDryWet: compDryWetSlider.value(),
    wsAmount: wsAmountSlider.value(),
    wsOversample: wsOversampleSelect.value(),
    wsDryWet: wsDryWetSlider.value(),
    wsOutput: wsOutputSlider.value(),
    masterVolume: masterVolumeSlider.value()
  };
}

function loadSoundSettings(index) {
  if (index < 0 || !soundLibrary[index].settings) return;
  
  let s = soundLibrary[index].settings;
  
  lpfFreqSlider.value(s.lpfFreq);
  lpfResSlider.value(s.lpfRes);
  lpfDryWetSlider.value(s.lpfDryWet);
  lpfOutputSlider.value(s.lpfOutput);
  
  reverbDurationSlider.value(s.reverbDuration);
  reverbDecaySlider.value(s.reverbDecay);
  reverbDryWetSlider.value(s.reverbDryWet);
  reverbOutputSlider.value(s.reverbOutput);
  reverbReverseCheckbox.checked(s.reverbReverse);
  
  compAttackSlider.value(s.compAttack);
  compKneeSlider.value(s.compKnee);
  compReleaseSlider.value(s.compRelease);
  compThresholdSlider.value(s.compThreshold);
  compDryWetSlider.value(s.compDryWet);
  
  wsAmountSlider.value(s.wsAmount);
  wsOversampleSelect.selected(s.wsOversample);
  wsDryWetSlider.value(s.wsDryWet);
  wsOutputSlider.value(s.wsOutput);
  
  masterVolumeSlider.value(s.masterVolume);
}

function clearAllFilters() {
  let defaults = getDefaultSettings();
  
  lpfFreqSlider.value(defaults.lpfFreq);
  lpfResSlider.value(defaults.lpfRes);
  lpfDryWetSlider.value(defaults.lpfDryWet);
  lpfOutputSlider.value(defaults.lpfOutput);
  
  reverbDurationSlider.value(defaults.reverbDuration);
  reverbDecaySlider.value(defaults.reverbDecay);
  reverbDryWetSlider.value(defaults.reverbDryWet);
  reverbOutputSlider.value(defaults.reverbOutput);
  reverbReverseCheckbox.checked(defaults.reverbReverse);
  
  compAttackSlider.value(defaults.compAttack);
  compKneeSlider.value(defaults.compKnee);
  compReleaseSlider.value(defaults.compRelease);
  compThresholdSlider.value(defaults.compThreshold);
  compDryWetSlider.value(defaults.compDryWet);
  
  wsAmountSlider.value(defaults.wsAmount);
  wsOversampleSelect.selected(defaults.wsOversample);
  wsDryWetSlider.value(defaults.wsDryWet);
  wsOutputSlider.value(defaults.wsOutput);
  
  console.log('Filters cleared to defaults');
}

function saveCurrentSettings() {
  if (currentSoundIndex >= 0 && currentSoundIndex < soundLibrary.length) {
    soundLibrary[currentSoundIndex].settings = getCurrentSettings();
    saveSoundsToStorage();
    console.log('Settings saved for: ' + soundLibrary[currentSoundIndex].name);
    alert('Settings saved!');
  } else {
    alert('Please select a sound first');
  }
}

// ============================================
// Local Storage Functions
// ============================================

function saveSoundsToStorage() {
  // Save metadata (not actual audio data due to size limitations)
  let metadata = soundLibrary.map((item, index) => ({
    name: item.name,
    settings: item.settings
  }));
  
  try {
    localStorage.setItem('soundLibraryMetadata', JSON.stringify(metadata));
  } catch (e) {
    console.log('Could not save to localStorage:', e);
  }
}

function loadSavedSoundsFromStorage() {
  try {
    let metadata = localStorage.getItem('soundLibraryMetadata');
    if (metadata) {
      savedSounds = JSON.parse(metadata);
      console.log('Loaded saved sound metadata');
    }
  } catch (e) {
    console.log('Could not load from localStorage:', e);
  }
}

// ============================================
// Mouse Interaction for Sound Selection
// ============================================

function mousePressed() {
  // Check if click is in sound library area
  let panelX = 25;
  let panelY = 70;
  let itemWidth = 170;
  let itemHeight = 35;
  
  for (let i = 0; i < min(soundLibrary.length, 6); i++) {
    let y = panelY + i * itemHeight;
    
    if (mouseX >= panelX && mouseX <= panelX + itemWidth &&
        mouseY >= y && mouseY <= y + itemHeight - 5) {
      selectSound(i);
      return;
    }
  }
}
