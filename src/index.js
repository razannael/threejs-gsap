
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/Addons.js";
import { RenderPass } from "three/examples/jsm/Addons.js";
import { UnrealBloomPass } from "three/examples/jsm/Addons.js";
import { gsap } from "gsap";
import textureImage from "../assets/texture.jpeg";
import heightImage from "../assets/height.jpeg";
import alphaImage from "../assets/alpha.jpeg";

// Initialize Three.js components
let scene;
let bloomScene;
let camera;
let renderer;
const canvas = document.getElementsByTagName("canvas")[0];
scene = new THREE.Scene();
scene.background = new THREE.Color('#022F54');

bloomScene = new THREE.Scene();

let fov;
// Adjust position of elements
if (window.innerWidth < 768) { // For smaller screens
  fov = 130 ; // Convert degrees to radians
} else { // For larger screens
  fov = 75 ; // Convert degrees to radians
}
const aspect = window.innerWidth / window.innerHeight;
const near = 0.1;
const far = 100;
camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 8;
camera.position.y = 0;
camera.position.x = 0;
scene.add(camera);

renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.autoClear = false;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
renderer.setClearColor(0x000000, 0.0);

// Create render passes for bloom effect
const renderScene = new RenderPass(scene, camera);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5,
  0.4,
  0.85
);
bloomPass.threshold = 0;
bloomPass.strength = 1;
bloomPass.radius = 0;
const bloomComposer = new EffectComposer(renderer);
bloomComposer.setSize(window.innerWidth, window.innerHeight);
bloomComposer.renderToScreen = true;
bloomComposer.addPass(renderScene);
bloomComposer.addPass(bloomPass);

// Add ambient light to the scene
const ambientlight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientlight);

// Create a sun object
const color = new THREE.Color("#FDB813");
const geometry = new THREE.IcosahedronGeometry(1, 15);
const material = new THREE.MeshBasicMaterial({ color: color });
const sphere = new THREE.Mesh(geometry, material);
sphere.position.set(22, 9, -10);
scene.add(sphere);

// Load textures for terrain
const loadTextures = () => {
  const loader = new THREE.TextureLoader();
  const texture = loader.load(textureImage);
  const height = loader.load(heightImage);
  const alpha = loader.load(alphaImage);
  return { texture, height, alpha };
};

const { texture, height, alpha } = loadTextures();

// Create terrain geometry
const terrainGeometry = new THREE.PlaneGeometry(3, 2, 64, 64);

// Create terrain material
const terrainMaterial = new THREE.MeshStandardMaterial({
  map: texture,
  displacementMap: height,
  displacementScale: 1.5,
  opacity: 0.4,
  transparent: true,
  alphaMap: height,
});

// Create terrain mesh
const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
terrain.rotation.x = 1;
terrain.position.x = -7.5;
terrain.position.y = 4.5;
scene.add(terrain);

// Define the center of the flower
const centerVertex = new THREE.Vector3(0, 0, 0);

// Define the vertices for a single petal
const petalVertices = [
  new THREE.Vector3(0.7, 0, 0), 
  new THREE.Vector3(0.5, 0.3, 0), 
  new THREE.Vector3(0.4, 0.5, 0), 
  new THREE.Vector3(0.3, 0, 0), 
  new THREE.Vector3(-0.3, 0.5, 0), 
  new THREE.Vector3(0, 0.3, 0),
];

// Create the geometry for the flower
const flowerGeometry = new THREE.BufferGeometry();

// Define vertices array
const vertices = [];

// Add the center vertex
vertices.push(centerVertex);

// Add the petal vertices
for (let i = 0; i < 5; i++) { // Create 5 petals
  const angle = (i / 5) * Math.PI * 2;
  const petalGeometry = petalVertices.map(v => v.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), angle));
  
  vertices.push(...petalGeometry);
}

// Convert vertices array to Float32Array
const positions = new Float32Array(vertices.length * 3);
vertices.forEach((vertex, index) => {
  vertex.toArray(positions, index * 3);
});

// Set positions attribute
flowerGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

// Create faces for the petals
const indices = [];
for (let i = 1; i <= 5 * 6; i += 3) {
  indices.push(0, i, i + 1);
  indices.push(0, i + 1, i + 2);
}
// Convert indices array to Uint32Array
flowerGeometry.setIndex(indices);

// Compute normals for the faces
flowerGeometry.computeVertexNormals();

// Create the material for the flower
const flowerMaterial = new THREE.MeshLambertMaterial({
  color: 0x990000, // Pink color for the flower
  side: THREE.DoubleSide // Render both sides of each petal
});

// Create the mesh with the flower geometry and material
const flowerMesh = new THREE.Mesh(flowerGeometry, flowerMaterial);
flowerMesh.scale.set(2, 2, 2); // Set scale to double the size

// Add the flower mesh to the scene
scene.add(flowerMesh);

// Create the circle geometry
const circleGeometry = new THREE.CircleGeometry(0.4, 32); // radius, segments

// Create the material for the circle
const circleMaterial = new THREE.MeshBasicMaterial({ color: '#E89304', side: THREE.DoubleSide, opacity:0.5, transparent: true });

// Create the circle mesh
const circle = new THREE.Mesh(circleGeometry, circleMaterial);
circle.position.set(0, 0, 0); // Position the circle at the center
scene.add(circle);

// Merge flowerMesh and circle into a single group
const flowerGroup = new THREE.Group();
flowerGroup.add(flowerMesh);
flowerGroup.add(circle);
scene.add(flowerGroup);

// Create pedicel geometry
const pedicelGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3, 30); // radiusTop, radiusBottom, height, radialSegments
const pedicelMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 }); // Green color
const pedicel = new THREE.Mesh(pedicelGeometry, pedicelMaterial);
pedicel.position.set(0.05, -2, 1); // Position the pedicel under the flower
flowerGroup.add(pedicel);

// Create the sepal geometry
const sepalGeometry = new THREE.ConeGeometry(0.6, 0.1, 5); // radius, height, radialSegments
const sepalMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 }); // Green color

// Create the first sepal mesh
const sepal1 = new THREE.Mesh(sepalGeometry, sepalMaterial);
sepal1.position.set(0.4, -1.7, 1); // Position the first sepal
sepal1.rotation.z = Math.PI / 4; // Rotate the sepal
sepal1.rotation.y = Math.PI;
sepal1.rotation.x = .5;
flowerGroup.add(sepal1); // Add the first sepal to the flower group

// Create the second sepal mesh
const sepal2 = new THREE.Mesh(sepalGeometry, sepalMaterial);
sepal2.position.set(-0.4, -1.7, 1); // Position the second sepal
sepal2.rotation.z = -Math.PI / 4; // Rotate the sepal
sepal2.rotation.y = Math.PI;
sepal2.rotation.x = .5;
flowerGroup.add(sepal2); // Add the second sepal to the flower group

// Ground geometry
const groundGeometry = new THREE.PlaneGeometry(50, 50);
// Ground material
const groundMaterial = new THREE.MeshLambertMaterial({ color: '#1E5B23' }); // Green color
// Ground mesh
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; // Rotate the ground to lay flat
ground.position.y = -3; // Position the ground at the bottom
scene.add(ground);

// Create the circle geometry
const circle2Geometry = new THREE.CircleGeometry(0.11, 32); // radius, segments

// Create the material for the circle
const circle2Material = new THREE.MeshBasicMaterial({ color: '#ffffff', opacity: 0.01, transparent: true });

// Create the circle mesh
const circle2 = new THREE.Mesh(circle2Geometry, circle2Material);
circle2.position.set(0, 0.5, -0.1); // Position the circle at the center
circle2.scale.set(300, 300, 1); // Start by covering the entire screen
scene.add(circle2);

// Create a mesh that covers the entire screen
const screenCoverGeometry = new THREE.PlaneGeometry(100, 100); // Adjust size as needed
const screenCoverMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.0 });
const screenCover = new THREE.Mesh(screenCoverGeometry, screenCoverMaterial);
scene.add(screenCover);
screenCover.position.z = 5; // Move it back so it doesn't interfere with other objects

// Resize listener
window.addEventListener(
  "resize",
  () => {
    // Update camera aspect ratio
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    // Update renderer size
    renderer.setSize(window.innerWidth, window.innerHeight);
    bloomComposer.setSize(window.innerWidth, window.innerHeight);

  },
  false
);

// Start the animation
const tl = gsap.timeline({ repeat: -1 });

// Move the sphere to the center
tl.to(sphere.position, { x: 8, y: 4, z: -2, duration: 3.4, ease: 'circ.inOut' });

// Move the terrain to the center
tl.to(terrain.position, { x: -6, y: 4, z: 0, duration: 3.3, ease: 'circ.inOut' }, "-=3.4");

// Move the ball
tl.fromTo(flowerGroup.position, { y: -7 }, { y: 1, duration: 3, ease: 'power2.inOut' }, "-=2");

// Circular animation for the flower petals
tl.to(flowerMesh.rotation, {
  z: Math.PI * 2, // Rotate 360 degrees
  duration: 4, // Animation duration
  ease: "power1.inOut", // Easing function
  repeat: 0, // Repeat the animation indefinitely
  delay: 0.3 // Delay the animation until the flower comes up
});

// Fade in the screen cover
tl.to(screenCoverMaterial, { opacity: 0.2, duration: 1 });

// Animate circle2
tl.fromTo(
  circle2.scale, // From covering the entire screen
  { x: 0, y: 0 }, // Initial scale
  { x: 30, y: 30, duration: 3, ease: 'circ.inOut' }, "-=1"
);

// Animate circle2 z position
tl.fromTo(
  circle2.position, // From near the eye
  { z: -2.5 }, // Initial position
  { z: -0.1, duration: 0.7, ease: 'circ.inOut' }, "-=2.3"
);
tl.to(flowerGroup.position, { z: 0, duration: 3, ease: 'power2.inOut' }, "-=2");

// Swap the positions of the terrain and the sun
tl.to(sphere.position, { x: -8, y: 3.7, z: -1, duration: 3.4, ease: 'circ.inOut' });
tl.to(terrain.position, { x: 8, y: 4.9, z: -2, duration: 3.3, ease: 'circ.inOut' }, "-=3.4");
// Animation function
const animate = () => {
  requestAnimationFrame(animate);

  // Render the scene with bloom effect and overlay
  bloomComposer.render();
  renderer.clearDepth(); // Clear depth buffer
  renderer.render(bloomScene, camera);
};

animate();
