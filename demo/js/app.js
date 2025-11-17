// Sanity check log to confirm the correct, new file is loading
console.log("--- TEST: app.js (NEW FILE) is loading ---");

// --- 1. Three.js Imports (from CDN) ---
// These are stable and loaded from the internet.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@latest/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@latest/examples/jsm/controls/OrbitControls.js';

// --- 2. MuJoCo Imports (Local) ---
// These paths go up one level (../) from 'js/' to the 'demo/' folder.
import { initMujoco, loadSceneFromURL } from '../mujocoUtils.js';
import load_mujoco from '../mujoco_wasm.js';

// --- 3. Scene Configuration ---
// This path MUST also go up one level (../) to find the 'environment' folder.
const mujocoXML = "../environment/coop-openended-v2.xml";


// --- 4. Main Application Logic ---
async function init() {
    try {
        // --- Load MuJoCo WebAssembly ---
        console.log("Loading MuJoCo...");
        const mujoco = await load_mujoco();
        console.log("MuJoCo loaded successfully.");

        // --- Set up the virtual filesystem and mount the XML ---
        console.log("Setting up virtual filesystem...");
        mujoco.FS.mkdir('/working');
        mujoco.FS.mount(mujoco.MEMFS, { root: '.' }, '/working');
        
        console.log("Fetching XML file:", mujocoXML);
        const xmlContent = await (await fetch(mujocoXML)).text();
        mujoco.FS.writeFile("/working/coop-openended-v2.xml", xmlContent);
        console.log("XML file written to virtual filesystem.");

        // --- Load MuJoCo scene from XML ---
        console.log("Loading MuJoCo model from XML...");
        const [model, data] = mujoco.loadXML("/working/coop-openended-v2.xml");
        console.log("MuJoCo model loaded.");

        // --- Create a Three.js scene ---
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0.9, 0.9, 0.9); // Light grey background

        // Basic ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);

        // Directional light
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
        dirLight.position.set(5, 10, 7.5);
        scene.add(dirLight);

        // --- Camera setup ---
        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.001, 100);
        camera.position.set(2.0, 1.5, 2.0);

        // --- Renderer setup ---
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        // --- Orbit Controls (to move around the scene) ---
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 0.7, 0);
        controls.update();

        // --- Load the scene geometry (static, no physics updates) ---
        console.log("Loading Three.js geometry from MuJoCo model...");
        // This function should be available from 'mujocoUtils.js'
        await loadSceneFromURL(mujoco, model, scene); 
        console.log("Three.js geometry loaded.");

        // --- Animation loop ---
        function animate() {
            requestAnimationFrame(animate);
            
            // Here you would typically step the physics (if it were running)
            // e.g., mujoco.step(model, data);
            // And then update the mesh positions
            
            controls.update();
            renderer.render(scene, camera);
        }
        animate();
        console.log("Animation loop started.");

        // --- Resize handler ---
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

    } catch (error) {
        console.error("Error during initialization:", error);
    }
}

// Run the initialization
init();