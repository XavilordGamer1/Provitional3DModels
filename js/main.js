import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// 1. Configuración básica
const container = document.getElementById('viewer-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#ebebeb'); // Fondo que coincida con el CSS

const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
camera.position.set(5, 5, 5); // Posición inicial de la cámara

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

// 2. Controles de órbita (Para girar el modelo como en la imagen)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; 
controls.dampingFactor = 0.05;
controls.target.set(0, 1, 0); // Apuntar al centro del modelo

// 3. Iluminación
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 10, 5);
scene.add(directionalLight);

// 4. Helper (Cuadrícula temporal para orientarte)
const gridHelper = new THREE.GridHelper(10, 10);
scene.add(gridHelper);

// 5. Cargar tu modelo 3D (Descomenta y ajusta la ruta cuando tengas tu .glb)
/*
const loader = new GLTFLoader();
loader.load('assets/tu_modelo_escalera.glb', function (gltf) {
    scene.add(gltf.scene);
    // Ajustar posición/escala si es necesario
    // gltf.scene.scale.set(1, 1, 1);
}, undefined, function (error) {
    console.error('Error al cargar el modelo:', error);
});
*/

// 6. Animación y Render
function animate() {
    requestAnimationFrame(animate);
    controls.update(); // Necesario si enableDamping es true
    renderer.render(scene, camera);
}
animate();

// 7. Ajustar el tamaño si se redimensiona la ventana
window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});