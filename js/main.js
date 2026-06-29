import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// init escena
const container = document.getElementById('viewer-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#ebebeb');
scene.fog = new THREE.FogExp2('#ebebeb', 0.015);

// camara (se inicia generica, se auto-ajustara al cargar el modelo)
const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);

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
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

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

// preparamos la textura
const textureLoader = new THREE.TextureLoader();
const carpetTexture = textureLoader.load('assets/carpet.jpg');
carpetTexture.wrapS = THREE.RepeatWrapping;
carpetTexture.wrapT = THREE.RepeatWrapping;

// panel gui 
const gui = new GUI();
gui.domElement.style.position = 'absolute';
gui.domElement.style.top = '10px';
gui.domElement.style.right = '10px';
container.appendChild(gui.domElement);

const envFolder = gui.addFolder('luces');
envFolder.add(ambientLight, 'intensity', 0, 3, 0.1).name('ambiental');
envFolder.add(dirLight, 'intensity', 0, 3, 0.1).name('luz camara');

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
    
    // calculamos las proporciones reales del modelo
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    // ENCUADRE AUTOMATICO
    // busca la medida mas grande para saber que tan lejos debe ir la camara
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let cameraDist = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    
    // multiplicador para darle un margen visual a los bordes
    cameraDist *= 1.3; 
    
    // coloca la camara en un angulo 3/4 (isometrico)
    // nota: si la camara queda mirando la parte de atras, cambia "maxDim" por "-maxDim" en el eje X o Z
    camera.position.set(center.x + maxDim, center.y + (maxDim * 0.6), center.z + cameraDist);
    
    // fuerza la camara a mirar exactamente al centro del modelo
    controls.target.copy(center);
    controls.update();

    // creacion del piso a medida
    const margen = 3.048; 
    const floorWidth = size.x + (margen * 2);
    const floorDepth = size.z + (margen * 2);

    carpetTexture.repeat.set(floorWidth / 2, floorDepth / 2);

    const floorGeo = new THREE.PlaneGeometry(floorWidth, floorDepth);
    const floorMat = new THREE.MeshStandardMaterial({ 
        map: carpetTexture,
        roughness: 1, 
        metalness: 0,
        color: '#dddddd'
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    
}, undefined, (err) => console.error('error gltf:', err));

// render loop
function animate() {
    requestAnimationFrame(animate);
    controls.update(); 
    
    // la luz copia la posicion de la camara
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