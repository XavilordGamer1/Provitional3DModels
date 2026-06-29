import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// init escena
const container = document.getElementById('viewer-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#ebebeb');
scene.fog = new THREE.FogExp2('#ebebeb', 0.015);

// camara
const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
camera.position.set(6, 5, 8); 

// render
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
container.appendChild(renderer.domElement);

// controles
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; 
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.05; 

// iluminacion
// 1. luz ambiental base
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

// 2. luz principal (esta es la que seguirá a la cámara)
const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.castShadow = true;

// config sombra suave
dirLight.shadow.camera.top = 10;
dirLight.shadow.camera.bottom = -10;
dirLight.shadow.camera.left = -10;
dirLight.shadow.camera.right = 10;
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 40;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.bias = -0.0005;
dirLight.shadow.radius = 8; 
scene.add(dirLight);

// suelo invisible para atrapar la sombra
const floorGeo = new THREE.PlaneGeometry(100, 100);
const floorMat = new THREE.ShadowMaterial({ 
    opacity: 0.1 
});
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// panel gui 
const gui = new GUI();
gui.domElement.style.position = 'absolute';
gui.domElement.style.top = '10px';
gui.domElement.style.right = '10px';
container.appendChild(gui.domElement);

// controles gui ajustados
const envFolder = gui.addFolder('luces');
envFolder.add(ambientLight, 'intensity', 0, 3, 0.1).name('ambiental');
envFolder.add(dirLight, 'intensity', 0, 3, 0.1).name('luz camara');

const shadowFolder = gui.addFolder('sombra de contacto');
shadowFolder.add(floorMat, 'opacity', 0, 0.5, 0.01).name('oscuridad sombra');
shadowFolder.add(dirLight.shadow, 'radius', 1, 20, 1).name('difuminado');

// cargar modelo 
const loader = new GLTFLoader();
loader.load('assets/escalera.glb', (gltf) => {
    const model = gltf.scene;

    model.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
                child.material.roughness = Math.max(child.material.roughness, 0.7);
            }
        }
    });

    scene.add(model);
    model.position.set(0, 0, 0); 
    
}, undefined, (err) => console.error('error gltf:', err));

// render loop
function animate() {
    requestAnimationFrame(animate);
    controls.update(); 
    
    // magia: la luz copia la posicion de la camara en cada frame
    dirLight.position.copy(camera.position);
    
    renderer.render(scene, camera);
}
animate();

// auto resize
window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});