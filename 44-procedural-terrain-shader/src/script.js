import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import GUI from 'lil-gui';
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';

import terrainVertex from './shaders/terrain/vertex.glsl';
import terrainFragment from './shaders/terrain/fragment.glsl';

import waterVertex from './shaders/water/vertex.glsl';
import waterFragment from './shaders/water/fragment.glsl';

import gsap from 'gsap';
/**
 * Base
 */

// Debug
let gui;
if (window.location.hash === '#debug') gui = new GUI({ width: 340 });

const debugObject = {};

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

// Loaders
const loadingManager = new THREE.LoadingManager();
const rgbeLoader = new RGBELoader(loadingManager);
const gltfLoader = new GLTFLoader(loadingManager);
const textureLoader = new THREE.TextureLoader(loadingManager);

const loadingBar = document.getElementsByClassName('loading-bar')[0];

loadingManager.onProgress = (url, loaded, total) => {
  const progressRatio = loaded / total;
  loadingBar.style.transform = `scaleX(${progressRatio})`;
  // smoothly animate somethign to represent the loading on screen
  // fase into the finished product
};
loadingManager.onLoad = () => {
  window.setTimeout(() => {
    // Animate overlay gradually in
    gsap.to(loadingMaterial.uniforms.uAlpha, {
      duration: 3,
      value: 0,
      delay: 1,
    });

    loadingBar.style.transform = ``;
    loadingBar.classList.add('end');
  }, 500);
};
loadingManager.onError = (error) => {
  console.error(new Error(error));
};
let animationMixer = null;
/**
 * Environment map
 */
rgbeLoader.load('/spruit_sunrise.hdr', (environmentMap) => {
  environmentMap.mapping = THREE.EquirectangularReflectionMapping;

  scene.background = environmentMap;
  scene.backgroundBlurriness = 0.5;
  scene.environment = environmentMap;
});
const armWood = textureLoader.load('textures/oak_veneer_01_arm_4k.jpg');
const diffWood = textureLoader.load('textures/oak_veneer_01_diff_4k.jpg');
/* 
  Loading Screen 
*/

const loadingMaterial = new THREE.ShaderMaterial({
  transparent: true,
  uniforms: {
    uAlpha: new THREE.Uniform(1),
  },
  vertexShader: `
      void main()
      {
          gl_Position = vec4(position, 1.0);
      }
  `,
  fragmentShader: `
      uniform float uAlpha;
      void main()
      {
          gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
      }
  `,
});
const loadingScreen = new THREE.Mesh(
  new THREE.PlaneGeometry(2, 2),
  loadingMaterial
);
scene.add(loadingScreen);
/**
 * Terrain
 */
// geometry
const geometry = new THREE.PlaneGeometry(10, 10, 500, 500);
geometry.deleteAttribute('uv');
geometry.deleteAttribute('normal');

geometry.rotateX(-Math.PI / 2);

debugObject.colorWaterDeep = '#002b3d';
debugObject.colorWaterSurface = '#66a8ff';
debugObject.colorSand = '#ffe894';
debugObject.colorGrass = '#85d534';
debugObject.colorSnow = '#ffffff';
debugObject.colorRock = '#bfbd8d';

const uniforms = {
  uPositionFrequency: new THREE.Uniform(0.2),
  uElevationCrush: new THREE.Uniform(2.0),
  uStrength: new THREE.Uniform(2.0),
  uWarpStrength: new THREE.Uniform(0.5),
  uWarpFrequency: new THREE.Uniform(5.0),
  uTime: new THREE.Uniform(0),

  uColorWaterDeep: new THREE.Uniform(
    new THREE.Color(debugObject.colorWaterDeep)
  ),
  uColorWaterSurface: new THREE.Uniform(
    new THREE.Color(debugObject.colorWaterSurface)
  ),
  uColorSand: new THREE.Uniform(new THREE.Color(debugObject.colorSand)),
  uColorGrass: new THREE.Uniform(new THREE.Color(debugObject.colorGrass)),
  uColorSnow: new THREE.Uniform(new THREE.Color(debugObject.colorSnow)),
  uColorRock: new THREE.Uniform(new THREE.Color(debugObject.colorRock)),
};

if (gui) {
  gui
    .add(uniforms.uPositionFrequency, 'value')
    .min(0)
    .max(1)
    .step(0.001)
    .name('uPositionFrequency');
  gui
    .add(uniforms.uElevationCrush, 'value')
    .min(0)
    .max(10)
    .step(0.001)
    .name('uElevationCrush');
  gui
    .add(uniforms.uStrength, 'value')
    .min(0)
    .max(10)
    .step(0.001)
    .name('uStrength');
  gui
    .add(uniforms.uWarpFrequency, 'value')
    .min(0)
    .max(10)
    .step(0.001)
    .name('uWarpFrequency');
  gui
    .add(uniforms.uWarpStrength, 'value')
    .min(0)
    .max(1)
    .step(0.001)
    .name('uWarpStrength');
  gui
    .addColor(debugObject, 'colorWaterDeep')
    .onChange(() =>
      uniforms.uColorWaterDeep.value.set(debugObject.colorWaterDeep)
    );
  gui
    .addColor(debugObject, 'colorWaterSurface')
    .onChange(() =>
      uniforms.uColorWaterSurface.value.set(debugObject.colorWaterSurface)
    );
  gui
    .addColor(debugObject, 'colorSand')
    .onChange(() => uniforms.uColorSand.value.set(debugObject.colorSand));
  gui
    .addColor(debugObject, 'colorGrass')
    .onChange(() => uniforms.uColorGrass.value.set(debugObject.colorGrass));
  gui
    .addColor(debugObject, 'colorSnow')
    .onChange(() => uniforms.uColorSnow.value.set(debugObject.colorSnow));
  gui
    .addColor(debugObject, 'colorRock')
    .onChange(() => uniforms.uColorRock.value.set(debugObject.colorRock));
}

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

const depthMaterial = new CustomShaderMaterial({
  // csm
  baseMaterial: THREE.MeshDepthMaterial,
  silent: true,
  vertexShader: terrainVertex,
  uniforms: uniforms,

  depthPacking: THREE.RGBADepthPacking,
});

// plane whee
let plane = null;
gltfLoader.load('./models/planeUV.glb', (gltf) => {
  plane = gltf.scene;
  // cast shadows
  plane.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
    }
  });

  animationMixer = new THREE.AnimationMixer(plane);
  const action = animationMixer.clipAction(gltf.animations[0]);
  action.play();
  plane.scale.setScalar(0.125);
  plane.position.y = 0.7;
  plane.position.x = 0;
  plane.position.z = 0;
  plane.rotation.y = Math.PI;
  scene.add(plane);
});

// mesh
const terrain = new THREE.Mesh(geometry, material);
terrain.castShadow = true;
terrain.receiveShadow = true;
terrain.customDepthMaterial = depthMaterial;

scene.add(terrain);

const waterUniforms = {
  uTime: new THREE.Uniform(0),
  uSmallWavesElevation: new THREE.Uniform(0.02),
  uSmallWavesFrequency: new THREE.Uniform(3.323),
  uSmallWavesSpeed: new THREE.Uniform(0.29),
  uSmallWavesIterations: new THREE.Uniform(4),
};
// water
const water = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10, 128, 128),
  new THREE.ShaderMaterial({
    transparent: true,
    vertexShader: waterVertex,
    fragmentShader: waterFragment,
    uniforms: waterUniforms,
  })
);
water.rotation.x = -Math.PI / 2;
water.position.y = -0.075;

scene.add(water);

if (gui) {
  gui
    .add(waterUniforms.uBigWavesElevation, 'value')
    .min(0)
    .max(1)
    .step(0.001)
    .name('uBigWavesElevation');
  gui
    .add(waterUniforms.uBigWavesFrequency.value, 'x')
    .min(0)
    .max(10)
    .step(0.001)
    .name('uBigWavesFrequencyX');
  gui
    .add(waterUniforms.uBigWavesFrequency.value, 'y')
    .min(0)
    .max(10)
    .step(0.001)
    .name('uBigWavesFrequencyY');
  gui
    .add(waterUniforms.uBigWavesSpeed, 'value')
    .min(0)
    .max(10)
    .step(0.001)
    .name('uBigWavesSpeed');
  gui
    .add(waterUniforms.uSmallWavesSpeed, 'value')
    .min(0)
    .max(10)
    .step(0.001)
    .name('uSmallWavesSpeed');
  gui
    .add(waterUniforms.uSmallWavesFrequency, 'value')
    .min(0)
    .max(30)
    .step(0.001)
    .name('uSmallWavesFrequency');
  gui
    .add(waterUniforms.uSmallWavesIterations, 'value')
    .min(0)
    .max(6)
    .step(1)
    .name('uSmallWavesIterations');
  gui
    .add(waterUniforms.uSmallWavesElevation, 'value')
    .min(0)
    .max(1)
    .step(0.001)
    .name('uSmallWavesElevation');
}

// water take 2
// Water

/* const waterGeometry = new THREE.PlaneGeometry(10, 10, 1, 1);
const water = new Water(waterGeometry, {
  textureWidth: 1024,
  textureHeight: 1024,
  waterNormals: waterNormalMap,

  waterColor: '#66a8ff',
  distortionScale: 3.7,
  fog: scene.fog !== undefined,
});

water.rotation.x = -Math.PI / 2;
water.position.y = -0.1;

scene.add(water); */
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
  metalnessMap: armWood,
  roughnessMap: armWood,
  aoMap: armWood,
  map: diffWood,
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
  350
);
camera.position.set(-10, 6, -2);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.maxPolarAngle = Math.PI / 2;
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

// add plane movement
const movePlane = (theta) => {
  const angle = Math.sin(theta) / 3;
  plane.position.z = angle;
};
const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  // uniforms
  uniforms.uTime.value = waterUniforms.uTime.value = elapsedTime;
  if (animationMixer) animationMixer.update(elapsedTime);

  // Update controls
  controls.update();

  // animate plane motion
  if (plane) {
    movePlane(elapsedTime);
  }

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
