/**
 * Kenzo's Sushi Battlegrounds
 * Core Babylon.js Engine Module
 */

export class GameEngine {
    constructor() {
        this.canvas = null;
        this.engine = null;
        this.scene = null;
        this.camera = null;
        this.lights = [];
        this.isRunning = false;
    }

    /**
     * Initialize the Babylon.js engine
     */
    async initialize() {
        this.canvas = document.getElementById('game-canvas');

        // Create the Babylon engine
        this.engine = new BABYLON.Engine(this.canvas, true, {
            preserveDrawingBuffer: true,
            stencil: true,
            antialias: true
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.engine.resize();
        });

        // Create the scene
        this.scene = this.createScene();

        return this;
    }

    /**
     * Create the main 3D scene
     */
    createScene() {
        const scene = new BABYLON.Scene(this.engine);

        // Set scene background color (Transparent for CSS background)
        scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

        // Enable fog for depth
        scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        scene.fogColor = new BABYLON.Color3(0.02, 0.02, 0.05);
        scene.fogDensity = 0.01;

        // Create camera
        this.camera = new BABYLON.ArcRotateCamera(
            'mainCamera',
            Math.PI / 2,    // alpha (horizontal rotation)
            Math.PI / 3,    // beta (vertical rotation)
            15,             // radius (distance from target)
            new BABYLON.Vector3(0, 2, 0),
            scene
        );

        // Camera limits
        this.camera.lowerBetaLimit = Math.PI / 6;
        this.camera.upperBetaLimit = Math.PI / 2.2;
        this.camera.lowerRadiusLimit = 8;
        this.camera.upperRadiusLimit = 25;

        // Disable user camera control during gameplay
        this.camera.attachControl(this.canvas, false);

        // Create lights
        this.setupLights(scene);

        // Enable shadows
        this.setupShadows(scene);

        return scene;
    }

    /**
     * Setup scene lighting
     */
    setupLights(scene) {
        // Ambient light
        const ambient = new BABYLON.HemisphericLight(
            'ambientLight',
            new BABYLON.Vector3(0, 1, 0),
            scene
        );
        ambient.intensity = 0.4;
        ambient.groundColor = new BABYLON.Color3(0.1, 0.05, 0.05);
        this.lights.push(ambient);

        // Main directional light (sun-like)
        const mainLight = new BABYLON.DirectionalLight(
            'mainLight',
            new BABYLON.Vector3(-0.5, -1, -0.5),
            scene
        );
        mainLight.intensity = 0.8;
        mainLight.diffuse = new BABYLON.Color3(1, 0.95, 0.85);
        this.lights.push(mainLight);

        // Warm accent light (from right)
        const warmLight = new BABYLON.PointLight(
            'warmLight',
            new BABYLON.Vector3(5, 4, 2),
            scene
        );
        warmLight.intensity = 0.5;
        warmLight.diffuse = new BABYLON.Color3(1, 0.6, 0.3);
        this.lights.push(warmLight);

        // Cool accent light (from left)
        const coolLight = new BABYLON.PointLight(
            'coolLight',
            new BABYLON.Vector3(-5, 4, 2),
            scene
        );
        coolLight.intensity = 0.3;
        coolLight.diffuse = new BABYLON.Color3(0.5, 0.7, 1);
        this.lights.push(coolLight);

        // Red accent for dramatic effect
        const redAccent = new BABYLON.PointLight(
            'redAccent',
            new BABYLON.Vector3(0, 3, -5),
            scene
        );
        redAccent.intensity = 0.4;
        redAccent.diffuse = new BABYLON.Color3(1, 0.2, 0.2);
        this.lights.push(redAccent);
    }

    /**
     * Setup shadow generator
     */
    setupShadows(scene) {
        const mainLight = this.lights.find(l => l.name === 'mainLight');
        if (mainLight) {
            const shadowGenerator = new BABYLON.ShadowGenerator(2048, mainLight);
            shadowGenerator.useBlurExponentialShadowMap = true;
            shadowGenerator.blurKernel = 32;
            shadowGenerator.darkness = 0.3;
            this.shadowGenerator = shadowGenerator;
        }
    }

    /**
     * Add a mesh to receive shadows
     */
    addShadowCaster(mesh) {
        if (this.shadowGenerator) {
            this.shadowGenerator.addShadowCaster(mesh);
        }
    }

    /**
     * Start the render loop
     */
    startRenderLoop() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.engine.runRenderLoop(() => {
            if (this.scene && this.scene.activeCamera) {
                this.scene.render();
            }
        });
    }

    /**
     * Stop the render loop
     */
    stopRenderLoop() {
        this.isRunning = false;
        this.engine.stopRenderLoop();
    }

    /**
     * Animate camera to a target position
     */
    animateCameraTo(target, radius, alpha, beta, duration = 1000) {
        return new Promise((resolve) => {
            const frameRate = 60;
            const totalFrames = (duration / 1000) * frameRate;

            // Target animation
            const targetAnim = new BABYLON.Animation(
                'cameraTargetAnim',
                'target',
                frameRate,
                BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
            );
            targetAnim.setKeys([
                { frame: 0, value: this.camera.target.clone() },
                { frame: totalFrames, value: target }
            ]);

            // Radius animation
            const radiusAnim = new BABYLON.Animation(
                'cameraRadiusAnim',
                'radius',
                frameRate,
                BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
            );
            radiusAnim.setKeys([
                { frame: 0, value: this.camera.radius },
                { frame: totalFrames, value: radius }
            ]);

            // Alpha animation
            const alphaAnim = new BABYLON.Animation(
                'cameraAlphaAnim',
                'alpha',
                frameRate,
                BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
            );
            alphaAnim.setKeys([
                { frame: 0, value: this.camera.alpha },
                { frame: totalFrames, value: alpha }
            ]);

            // Beta animation
            const betaAnim = new BABYLON.Animation(
                'cameraBetaAnim',
                'beta',
                frameRate,
                BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
            );
            betaAnim.setKeys([
                { frame: 0, value: this.camera.beta },
                { frame: totalFrames, value: beta }
            ]);

            // Easing
            const easingFunction = new BABYLON.CubicEase();
            easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
            [targetAnim, radiusAnim, alphaAnim, betaAnim].forEach(anim => {
                anim.setEasingFunction(easingFunction);
            });

            this.camera.animations = [targetAnim, radiusAnim, alphaAnim, betaAnim];

            this.scene.beginAnimation(this.camera, 0, totalFrames, false, 1, () => {
                resolve();
            });
        });
    }

    /**
     * Create a skybox
     */
    createSkybox() {
        const skybox = BABYLON.MeshBuilder.CreateBox('skyBox', { size: 100 }, this.scene);
        const skyboxMaterial = new BABYLON.StandardMaterial('skyBoxMaterial', this.scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.emissiveColor = new BABYLON.Color3(0.02, 0.02, 0.05);
        skybox.material = skyboxMaterial;
        skybox.infiniteDistance = true;
        return skybox;
    }

    /**
     * Dispose of the engine and scene
     */
    dispose() {
        if (this.scene) {
            this.scene.dispose();
        }
        if (this.engine) {
            this.engine.dispose();
        }
    }
}
