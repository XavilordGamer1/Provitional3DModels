import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// init escena
const container = document.getElementById('viewer-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#ebebeb');
scene.fog = new THREE.FogExp2('#ebebeb', 0.02);

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

// luz ambiental
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

// luz hemisferio
const hemiLight = new THREE.HemisphereLight(0xffffff, 0xc0c0c0, 0.4);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

// luz principal
const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(2, 12, 5); 
dirLight.castShadow = true;

// config sombras
dirLight.shadow.camera.top = 10;
dirLight.shadow.camera.bottom = -10;
dirLight.shadow.camera.left = -10;
dirLight.shadow.camera.right = 10;
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 40;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.bias = -0.001;
dirLight.shadow.radius = 4; 
scene.add(dirLight);

// panel gui interactivo
const gui = new GUI();
gui.domElement.style.position = 'absolute';
gui.domElement.style.top = '10px';
gui.domElement.style.right = '10px';
container.appendChild(gui.domElement);

// controles de luces
const lightFolder = gui.addFolder('luz principal');
lightFolder.add(dirLight.position, 'x', -20, 20, 0.1).name('pos x');
lightFolder.add(dirLight.position, 'y', 0, 20, 0.1).name('pos y');
lightFolder.add(dirLight.position, 'z', -20, 20, 0.1).name('pos z');
lightFolder.add(dirLight, 'intensity', 0, 3, 0.1).name('intensidad');

const envFolder = gui.addFolder('luces de relleno');
envFolder.add(ambientLight, 'intensity', 0, 2, 0.1).name('ambiental');
envFolder.add(hemiLight, 'intensity', 0, 2, 0.1).name('hemisferio');

// suelo
const floorGeo = new THREE.PlaneGeometry(100, 100);
const floorMat = new THREE.MeshStandardMaterial({ 
    color: 0xdfdfdf,
    roughness: 1, 
    metalness: 0
});
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// cargar modelo gltf
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

    // auto centrar basico
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    
    model.position.x += (model.position.x - center.x);
    model.position.z += (model.position.z - center.z);
    model.position.y -= box.min.y;

    // agregar control al panel para ajuste fino del suelo
    const modelFolder = gui.addFolder('ajuste del modelo');
    modelFolder.add(model.position, 'y', -5, 5, 0.01).name('altura (y)');
    
}, undefined, (err) => console.error('error gltf:', err));

// render loop
function animate() {
    requestAnimationFrame(animate);
    controls.update(); 
    renderer.render(scene, camera);
}
animate();

// auto resize
window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});