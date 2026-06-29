import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'; // Importamos el cargador de GLTF

// 1. Configuración del contenedor y la escena
const container = document.getElementById('viewer-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#ebebeb'); // Gris claro de fondo igual al diseño

// 2. Configuración de la cámara
const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
camera.position.set(4, 4, 6); // Posición inicial elevada para una vista isométrica/perspectiva

// 3. Renderizador
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true; // Activar sombras si tu modelo las usa
container.appendChild(renderer.domElement);

// 4. Controles de órbita (Mouse/Gesto para rotar 360°)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; 
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2; // Evita que la cámara pase por debajo del suelo

// 5. Iluminación (Esencial para que el modelo no se vea negro)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.85); // Luz ambiental suave
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6); // Luz directa para definir volúmenes
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

// 6. Carga del Modelo 3D
const loader = new GLTFLoader();

// REEMPLAZA 'escalera.glb' por el nombre exacto de tu archivo
loader.load(
    'assets/escalera.glb', 
    (gltf) => {
        const model = gltf.scene;
        scene.add(model);

        // Ajuste automático: Centrar el modelo en el visor
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        
        model.position.x += (model.position.x - center.x);
        model.position.z += (model.position.z - center.z);
        
        // Si notas que el modelo aparece muy grande o muy chico, puedes escalarlo aquí:
        // model.scale.set(0.5, 0.5, 0.5); 

        console.log('¡Modelo 3D cargado con éxito!');
    },
    (xhr) => {
        // Progreso de carga en consola
        console.log((xhr.loaded / xhr.total * 100) + '% cargado');
    },
    (error) => {
        console.error('Ocurrió un error al cargar el modelo 3D:', error);
    }
);

// 7. Ciclo de animación continua
function animate() {
    requestAnimationFrame(animate);
    controls.update(); 
    renderer.render(scene, camera);
}
animate();

// 8. Ajuste responsivo al cambiar el tamaño de la ventana
window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});