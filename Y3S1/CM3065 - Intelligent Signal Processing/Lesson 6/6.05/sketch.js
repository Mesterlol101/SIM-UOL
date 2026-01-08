var canvas;
var context;
var imageData;

function setup() {
  canvas = createCanvas(640, 480);
  context = canvas.drawingContext;
  imageData = context.getImageData(0, 0, width, height);
}

function draw() {
  for (var y = 0; y < imageData.height; y++) {
    for (var x = 0; x < imageData.width; x++) {
      // Calculate position in the pixel array
      let position = (x + y * imageData.width) * 4;
      
      // Normalize x and y to 0-1 range
      let nx = x / imageData.width;
      let ny = y / imageData.height;
      
      // Red increases from left to right (0 to 255)
      let red = nx * 255;
      
      // Green has two components:
      // 1. Diagonal stripe (brightest where nx == ny, fading in upper region)
      // Use normalized coordinates for proper diagonal on non-square canvas
      let distFromDiagonal = Math.abs(nx - ny);
      let diagonalGreen = Math.max(0, 255 * (1 - distFromDiagonal * 3)) * (1 - ny);
      
      // 2. Corner gradient (increases toward bottom-right for white)
      let cornerGreen = nx * ny * 255;
      
      // Combine both: take the maximum of diagonal and corner effects
      let green = Math.max(diagonalGreen, cornerGreen);
      
      // Blue increases from top to bottom (0 to 255)
      let blue = ny * 255;
      
      // Set red, green, blue, and alpha
      imageData.data[position] = red;
      imageData.data[position + 1] = green;
      imageData.data[position + 2] = blue;
      imageData.data[position + 3] = 255; // opaque alpha
    }
  }
  
  context.putImageData(imageData, 0, 0); // at coords 0,0
}
