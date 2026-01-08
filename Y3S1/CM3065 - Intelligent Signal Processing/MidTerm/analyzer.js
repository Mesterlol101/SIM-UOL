// Feature Analyzer - Analyze all Meyda features for each sound
// Use this to determine which features vary the most for each sound

let sounds = [];
let currentSound = 0;
let soundNames = ['Sound 1', 'Sound 2', 'Sound 3'];
let isPlaying = false;

let analyzer;
let features = null;

// Track feature statistics
let featureStats = {
  rms: { min: Infinity, max: -Infinity, values: [] },
  energy: { min: Infinity, max: -Infinity, values: [] },
  zcr: { min: Infinity, max: -Infinity, values: [] },
  spectralCentroid: { min: Infinity, max: -Infinity, values: [] },
  spectralFlatness: { min: Infinity, max: -Infinity, values: [] },
  spectralSlope: { min: Infinity, max: -Infinity, values: [] },
  spectralRolloff: { min: Infinity, max: -Infinity, values: [] },
  spectralSpread: { min: Infinity, max: -Infinity, values: [] },
  spectralSkewness: { min: Infinity, max: -Infinity, values: [] },
  spectralKurtosis: { min: Infinitly, max: -Infinity, values: [] }
};

let playButton, stopButton, soundButtons = [];
let resetButton;

function preload() {
  for (let i = 1; i <= 3; i++) {
    sounds.push(loadSound(`sounds/Ex2_sound${i}.wav`));
  }
}

function setup() {
  createCanvas(900, 700);
  createUI();
}

function draw() {
  background(20, 20, 40);
  
  // Title
  fill(255);
  textAlign(CENTER);
  textSize(20);
  text('Meyda Feature Analyzer', width / 2, 25);
  textSize(14);
  text(`Analyzing: ${soundNames[currentSound]}`, width / 2, 50);
  
  if (isPlaying && features) {
    updateStats();
    displayFeatureValues();
    displayVariationRanking();
  } else {
    fill(200);
    textAlign(CENTER);
    textSize(14);
    text('Click PLAY to analyze features', width / 2, height / 2);
    text('Features with high variation are better for visualization', width / 2, height / 2 + 25);
  }
}

function updateStats() {
  // Update min/max for each feature
  const featureNames = Object.keys(featureStats);
  
  for (let fname of featureNames) {
    if (features[fname] !== undefined && !isNaN(features[fname])) {
      let val = features[fname];
      
      // Update min/max
      if (val < featureStats[fname].min) featureStats[fname].min = val;
      if (val > featureStats[fname].max) featureStats[fname].max = val;
      
      // Store recent values (keep last 100)
      featureStats[fname].values.push(val);
      if (featureStats[fname].values.length > 100) {
        featureStats[fname].values.shift();
      }
    }
  }
}

function displayFeatureValues() {
  fill(255);
  textAlign(LEFT);
  textSize(12);
  
  let x = 20;
  let y = 80;
  
  text('Current Feature Values:', x, y);
  y += 20;
  
  const featureNames = Object.keys(featureStats);
  
  for (let i = 0; i < featureNames.length; i++) {
    let fname = featureNames[i];
    let val = features[fname] || 0;
    let range = featureStats[fname].max - featureStats[fname].min;
    let variation = calculateVariation(fname);
    
    // Color code by variation (high variation = more useful for visualization)
    if (variation > 0.3) {
      fill(100, 255, 100); // Green - high variation
    } else if (variation > 0.15) {
      fill(255, 255, 100); // Yellow - medium variation
    } else {
      fill(255, 100, 100); // Red - low variation
    }
    
    text(`${fname}: ${val.toFixed(4)}`, x, y);
    text(`Range: ${range.toFixed(4)}`, x + 250, y);
    text(`Variation: ${(variation * 100).toFixed(1)}%`, x + 400, y);
    
    // Draw bar showing current value relative to range
    let barX = x + 550;
    let barWidth = 200;
    let barHeight = 10;
    
    // Background bar
    fill(60);
    rect(barX, y - 8, barWidth, barHeight);
    
    // Value bar
    if (range > 0) {
      let normalized = (val - featureStats[fname].min) / range;
      if (variation > 0.3) {
        fill(100, 255, 100);
      } else if (variation > 0.15) {
        fill(255, 255, 100);
      } else {
        fill(255, 100, 100);
      }
      rect(barX, y - 8, normalized * barWidth, barHeight);
    }
    
    y += 20;
  }
}

function displayVariationRanking() {
  // Calculate variation coefficient for all features and rank them
  const featureNames = Object.keys(featureStats);
  let rankings = [];
  
  for (let fname of featureNames) {
    let variation = calculateVariation(fname);
    rankings.push({ name: fname, variation: variation });
  }
  
  // Sort by variation (descending)
  rankings.sort((a, b) => b.variation - a.variation);
  
  // Display top 5 features with most variation
  fill(255, 200, 100);
  textAlign(LEFT);
  textSize(16);
  let x = 20;
  let y = 320;
  
  text('Best Features for Visualization (High Variation):', x, y);
  y += 25;
  
  textSize(14);
  for (let i = 0; i < Math.min(5, rankings.length); i++) {
    if (rankings[i].variation > 0.05) { // Only show if there's meaningful variation
      fill(100 + i * 30, 255 - i * 30, 100);
      text(`${i + 1}. ${rankings[i].name} - Variation: ${(rankings[i].variation * 100).toFixed(1)}%`, x, y);
      y += 20;
    }
  }
  
  // Recommendations
  y += 20;
  fill(150, 200, 255);
  textSize(13);
  text('Recommendations:', x, y);
  y += 20;
  
  fill(255);
  textSize(11);
  text('✓ GREEN (>30% variation) - Excellent for visualization', x, y);
  y += 15;
  text('✓ YELLOW (15-30% variation) - Good for visualization', x, y);
  y += 15;
  text('✓ RED (<15% variation) - Less suitable for visualization', x, y);
  y += 25;
  
  text('Features with high variation show more dynamic changes and create better visual impact!', x, y);
}

function calculateVariation(featureName) {
  let values = featureStats[featureName].values;
  if (values.length < 10) return 0;
  
  // Calculate coefficient of variation (std dev / mean)
  let mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 0;
  
  let variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  let stdDev = Math.sqrt(variance);
  
  return stdDev / Math.abs(mean);
}

function createUI() {
  playButton = createButton('PLAY');
  playButton.position(20, height + 20);
  playButton.mousePressed(playSound);
  playButton.style('padding', '10px 20px');
  playButton.style('font-size', '16px');
  
  stopButton = createButton('STOP');
  stopButton.position(100, height + 20);
  stopButton.mousePressed(stopSound);
  stopButton.style('padding', '10px 20px');
  stopButton.style('font-size', '16px');
  
  resetButton = createButton('RESET STATS');
  resetButton.position(180, height + 20);
  resetButton.mousePressed(resetStats);
  resetButton.style('padding', '10px 20px');
  resetButton.style('font-size', '16px');
  
  for (let i = 0; i < 3; i++) {
    let btn = createButton(`Sound ${i + 1}`);
    btn.position(320 + i * 100, height + 20);
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
    
    if (analyzer) {
      analyzer.stop();
    }
    
    analyzer = Meyda.createMeydaAnalyzer({
      audioContext: getAudioContext(),
      source: sounds[currentSound],
      bufferSize: 512,
      featureExtractors: [
        'rms', 'energy', 'zcr',
        'spectralCentroid', 'spectralFlatness', 'spectralSlope',
        'spectralRolloff', 'spectralSpread', 'spectralSkewness',
        'spectralKurtosis'
      ],
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
  }
}

function switchSound(index) {
  stopSound();
  currentSound = index;
  resetStats();
  updateButtonStyles();
}

function resetStats() {
  // Reset all statistics
  const featureNames = Object.keys(featureStats);
  for (let fname of featureNames) {
    featureStats[fname].min = Infinity;
    featureStats[fname].max = -Infinity;
    featureStats[fname].values = [];
  }
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
