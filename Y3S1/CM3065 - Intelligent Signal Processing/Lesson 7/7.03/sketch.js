let width_canvas = 400;
let height_canvas = 300;
let video;
let imageData2;
let anchorX = 200;
let anchorY = 150;
let zoomX = 1.0;
let zoomY = 1.0;
let offsetX = 0;
let offsetY = 0;
let theta = 0;  // Current rotation angle

function setup() {
  createCanvas(width_canvas * 2, height_canvas);
  
  // Create video capture
  video = createCapture(VIDEO);
  video.size(width_canvas, height_canvas);
  video.hide();
  
  // Initialize pixel arrays
  pixelDensity(1);
  imageData2 = createImage(width_canvas, height_canvas);
}

function draw() {
  // Display original unmodified video feed on the right
  image(video, width_canvas, 0);
  
  // Only update rotation when mouse is pressed and dragged
  if (mouseIsPressed && mouseButton === LEFT) {
    // Rotate based on drag direction (deltaX)
    theta += (mouseX - pmouseX) * 0.01;  // Adjust 0.01 to change rotation speed
  }
  
  // Load pixels from video
  video.loadPixels();
  imageData2.loadPixels();
  
  // Center coordinates for rotation
  let centerX = width_canvas / 2;
  let centerY = height_canvas / 2;
  
  // Iterate over all pixels
  for(let i = 0; i < height_canvas; i++) {
    // Loop through each row
    for(let j = 0; j < width_canvas; j++) {
      
      // Translate to center, apply rotation, then translate back
      let jCentered = j - centerX;
      let iCentered = i - centerY;
      
      let x = Math.floor((Math.cos(theta) * jCentered) - (Math.sin(theta) * iCentered) + centerX);
      let y = Math.floor((Math.sin(theta) * jCentered) + (Math.cos(theta) * iCentered) + centerY);
      
      // Flip on both axes (horizontal and vertical)
      x = width_canvas - 1 - x;
      y = height_canvas - 1 - y;
      
      // Calculate pixel indices
      let sourceIndex = ((width_canvas * y) + x) * 4;
      let destIndex = ((width_canvas * i) + j) * 4;
      
      // Copy pixel data (with bounds checking)
      if (x >= 0 && x < width_canvas && y >= 0 && y < height_canvas) {
        imageData2.pixels[destIndex] = video.pixels[sourceIndex];
        imageData2.pixels[destIndex + 1] = video.pixels[sourceIndex + 1];
        imageData2.pixels[destIndex + 2] = video.pixels[sourceIndex + 2];
        imageData2.pixels[destIndex + 3] = video.pixels[sourceIndex + 3];
      }
    }
  }
  
  // Update pixels and display the rotated image on the left
  imageData2.updatePixels();
  image(imageData2, 0, 0);
}
