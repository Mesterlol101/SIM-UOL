// The simplest possible script to say which pixel is brightest using pixels from a live webcam.
let width_canvas = 640;
let height_canvas = 480;
let video;

function setup() {
  createCanvas(width_canvas, height_canvas);
  
  // Create video capture
  video = createCapture(VIDEO);
  video.size(width_canvas, height_canvas);
  video.hide();
  
  pixelDensity(1);
  frameRate(25); // Equivalent to setInterval(draw, 40)
}

function draw() {
  // Draw video to canvas
  image(video, 0, 0, width, height);
  
  // Load pixels from canvas
  loadPixels();
  
  let brightestPix = 0;
  let x = 0;
  let y = 0;
  
  // Iterate over all pixels
  for (let i = 0; i < height_canvas; i++) {
    // Loop through each row
    for (let j = 0; j < width_canvas; j++) {
      
      let index = ((width_canvas * i) + j) * 4;
      let r = pixels[index];
      let g = pixels[index + 1];
      let b = pixels[index + 2];
      
      if (r + g + b > brightestPix) {
        brightestPix = r + g + b;
        x = j;
        y = i;
      }
    }
  }
  
  // Draw red square at brightest pixel
  fill(255, 0, 0);
  noStroke();
  rect(x, y, 10, 10);
}

