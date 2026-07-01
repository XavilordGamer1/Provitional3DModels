import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// init escena
const container = document.getElementById('viewer-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#ebebeb');
scene.fog = new THREE.FogExp2('#ebebeb', 0.015);

// camara
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
gui.domElement.style.top = '50px'; 
gui.domElement.style.right = '10px';
gui.hide(); 
container.appendChild(gui.domElement);

const envFolder = gui.addFolder('luces');
envFolder.add(ambientLight, 'intensity', 0, 3, 0.1).name('ambiental');
envFolder.add(dirLight, 'intensity', 0, 3, 0.1).name('luz camara');

// boton de configuracion
const settingsBtn = document.createElement('div');
settingsBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>`;
settingsBtn.style.position = 'absolute';
settingsBtn.style.top = '15px';
settingsBtn.style.right = '15px';
settingsBtn.style.cursor = 'pointer';
settingsBtn.style.opacity = '0.3'; 
settingsBtn.style.transition = 'opacity 0.2s';
settingsBtn.style.zIndex = '100';

settingsBtn.onmouseover = () => settingsBtn.style.opacity = '1';
settingsBtn.onmouseout = () => settingsBtn.style.opacity = '0.3';

settingsBtn.onclick = () => {
    if (gui._hidden) {
        gui.show();
    } else {
        gui.hide();
    }
};
container.appendChild(settingsBtn);

// ==========================================
// NUEVA LÓGICA PARA CARGAR MODELOS DINÁMICOS
// ==========================================
const loader = new GLTFLoader();
let currentModel = null;
let currentFloor = null;

function loadStairModel(modelUrl) {
    // Si ya hay un modelo o piso en la escena, los borramos
    if (currentModel) scene.remove(currentModel);
    if (currentFloor) scene.remove(currentFloor);

    loader.load(modelUrl, (gltf) => {
        const model = gltf.scene;
        currentModel = model; // Guardamos la referencia del nuevo modelo

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
        
        // encuadre automatico
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraDist = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        
        cameraDist *= 1.3; 
        
        // encuadre frontal
        camera.position.set(center.x - maxDim, center.y + (maxDim * 0.6), center.z - cameraDist);
        controls.target.copy(center);
        controls.update();

        // creacion del piso a medida basado en el NUEVO modelo
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
        currentFloor = new THREE.Mesh(floorGeo, floorMat);
        currentFloor.rotation.x = -Math.PI / 2;
        currentFloor.receiveShadow = true;
        scene.add(currentFloor);
        
    }, undefined, (err) => console.error('error gltf:', err));
}

// Escuchar el evento del selector de HTML
const stairSelector = document.getElementById('stair-selector');
const activeStairText = document.getElementById('active-stair-text');

if (stairSelector) {
    stairSelector.addEventListener('change', (event) => {
        const selectedUrl = event.target.value;
        const selectedName = event.target.options[event.target.selectedIndex].text;
        
        // Actualizamos el texto de arriba
        if(activeStairText) activeStairText.textContent = selectedName;
        
        // Cargamos el nuevo modelo
        loadStairModel(selectedUrl);
    });
}

// Cargar el modelo principal al iniciar la página
loadStairModel('assets/escalera.glb');
// ==========================================

// render loop
function animate() {
    requestAnimationFrame(animate);
    controls.update(); 
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