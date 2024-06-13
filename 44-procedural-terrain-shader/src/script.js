import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import GUI from 'lil-gui';
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';
import terrainVertex from './shaders/terrain/vertex.glsl';
import terrainFragment from './shaders/terrain/fragment.glsl';

/**
 * Base
 */

// Debug
const gui = new GUI({ width: 325 });
const debugObject = {};

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

// Loaders
const rgbeLoader = new RGBELoader();

/**
 * Environment map
 */
rgbeLoader.load('/spruit_sunrise.hdr', (environmentMap) => {
  environmentMap.mapping = THREE.EquirectangularReflectionMapping;

  scene.background = environmentMap;
  scene.backgroundBlurriness = 0.5;
  scene.environment = environmentMap;
});

/**
 * Terrain
 */
// geometry
const geometry = new THREE.PlaneGeometry(10, 10, 500, 500);
geometry.deleteAttribute('uv');
geometry.deleteAttribute('normal');

geometry.rotateX(-Math.PI / 2);

const uniforms = {
  uPositionFrequency: new THREE.Uniform(0.2),
};

// Material
const material = new CustomShaderMaterial({
  // csm
  baseMaterial: THREE.MeshStandardMaterial,
  silent: true,
  vertexShader: terrainVertex,
  fragmentShader: terrainFragment,
  uniforms: uniforms,

  // msm
  metalness: 0,
  roughness: 0.5,
  color: '#85d534',
});
// mesh
const terrain = new THREE.Mesh(geometry, material);
scene.add(terrain);

// Brushes

const boardFill = new Brush(new THREE.BoxGeometry(11, 2, 11));
const boardHole = new Brush(new THREE.BoxGeometry(10, 2.1, 10));
// boardHole.position.y = 0.2;
// boardHole.updateMatrixWorld();

const evaluator = new Evaluator();
const board = evaluator.evaluate(boardFill, boardHole, SUBTRACTION);

board.geometry.clearGroups();
board.material = new THREE.MeshStandardMaterial({
  color: '#ffffff',
  metalness: 0,
  roughness: 3,
});

board.castShadow = true;
board.receiveShadow = true;

scene.add(board);

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight('#ffffff', 2);
directionalLight.position.set(6.25, 3, 4);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 30;
directionalLight.shadow.camera.top = 8;
directionalLight.shadow.camera.right = 8;
directionalLight.shadow.camera.bottom = -8;
directionalLight.shadow.camera.left = -8;
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight + 1,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
};

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight + 1;
  sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(sizes.pixelRatio);
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(-10, 6, -2);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(sizes.pixelRatio);

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();