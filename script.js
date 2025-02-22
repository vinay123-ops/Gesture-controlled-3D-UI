import * as THREE from './node_modules/three/build/three.module.js';
import "https://cdn.jsdelivr.net/npm/@mediapipe/hands";

// Get video element
const video = document.getElementById("webcam");

// Initialize MediaPipe Hands
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});

hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});

// Setup webcam
navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
  video.srcObject = stream;
});

// Setup Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("threejs-canvas") });

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create floating cube
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
camera.position.z = 2;

// Gesture control variables
let isPinching = false;

// Hand tracking results
hands.onResults((results) => {
  if (results.multiHandLandmarks.length > 0) {
    const hand = results.multiHandLandmarks[0];

    // Get index finger tip position
    let x = hand[8].x * 2 - 1; // Convert to Three.js coordinate system
    let y = -(hand[8].y * 2 - 1);

    // Move cube based on finger position
    cube.position.x = x;
    cube.position.y = y;

    // Get thumb tip position for pinch detection
    let indexTip = hand[8];
    let thumbTip = hand[4];

    // Calculate distance between index and thumb
    let distance = Math.sqrt(
      Math.pow(indexTip.x - thumbTip.x, 2) +
      Math.pow(indexTip.y - thumbTip.y, 2)
    );

    // Detect pinch gesture (index finger and thumb close together)
    if (distance < 0.05 && !isPinching) {
      isPinching = true;
      console.log("Pinch Detected! Changing Cube Color...");
      cube.material.color.set(Math.random() * 0xffffff); // Change to random color
    } else if (distance > 0.1) {
      isPinching = false;
    }
  }
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// Process video frames continuously
const sendToHands = async () => {
  await hands.send({ image: video });
  requestAnimationFrame(sendToHands);
};

video.addEventListener("loadeddata", sendToHands);