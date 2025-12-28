/**
 * Kenzo's Sushi Battlegrounds
 * Restaurant Scene Builder - Simplified: Only table and characters, no animations, no environment clutter
 */

export class RestaurantScene {
    constructor(engine, assetLoader) {
        this.engine = engine;
        this.scene = engine.scene;
        this.assetLoader = assetLoader;
        this.sceneObjects = new Map();
        this.characters = new Map();

        // Disable default environment/background color since we want transparent background
        this.scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
    }

    /**
     * Build the simplified battle environment (Table only)
     */
    async build() {
        console.log('🏮 Building simplified battle scene (Table only)...');

        // Removed: createFloor, createWalls, addDecorations

        // Create heavy ambient light to ensure visibility without environment lights
        const hemiLight = new BABYLON.HemisphericLight('hemiLight', new BABYLON.Vector3(0, 1, 0), this.scene);
        hemiLight.intensity = 1.2;
        hemiLight.groundColor = new BABYLON.Color3(0.5, 0.5, 0.5); // Add some ground reflection color

        // Directional light for shadows
        const mainLight = new BABYLON.DirectionalLight('mainLight', new BABYLON.Vector3(-0.5, -1, -0.5), this.scene);
        mainLight.intensity = 0.8;

        // Create table
        await this.createBattleTable();

        // Ensure camera looks at the center where characters and table are
        if (this.scene.activeCamera) {
            this.scene.activeCamera.setTarget(new BABYLON.Vector3(0, -0.5, 0));
            this.scene.activeCamera.radius = 12; // Zoom in
            this.scene.activeCamera.beta = Math.PI / 2.5;
        }

        console.log('🏮 Simplified scene complete!');
    }

    /**
     * Create the battle table
     */
    async createBattleTable() {
        // Try to load table model
        try {
            const result = await BABYLON.SceneLoader.ImportMeshAsync('', '', 'Assets/Models/Background/Table.glb', this.scene);
            if (result.meshes.length > 0) {
                const parent = new BABYLON.TransformNode('table', this.scene);
                result.meshes.forEach(mesh => {
                    if (!mesh.parent || mesh.parent.name === '__root__') {
                        mesh.parent = parent;
                    }
                    mesh.receiveShadows = true;
                });
                parent.position = new BABYLON.Vector3(0, -1, 0); // Lowered slightly
                parent.scaling = new BABYLON.Vector3(2, 1.5, 2);
                this.sceneObjects.set('table', parent);
            }
        } catch (e) {
            // Fallback table
            const table = BABYLON.MeshBuilder.CreateBox('table', {
                width: 5,
                height: 0.15,
                depth: 3
            }, this.scene);
            table.position = new BABYLON.Vector3(0, 0, 0);
            this.sceneObjects.set('table', table);
        }

        // Try to load stools
        try {
            const result = await BABYLON.SceneLoader.ImportMeshAsync('', '', 'Assets/Models/Background/Stool.glb', this.scene);
            if (result.meshes.length > 0) {
                const parent = new BABYLON.TransformNode('stool', this.scene);
                result.meshes.forEach(mesh => {
                    if (!mesh.parent || mesh.parent.name === '__root__') {
                        mesh.parent = parent;
                    }
                });
                parent.position = new BABYLON.Vector3(0, -1, 3);
                parent.scaling = new BABYLON.Vector3(1.2, 1.2, 1.2);
            }
        } catch (e) { }
    }

    /**
     * Setup battle characters with direct model loading (No animations forced)
     */
    async setupBattleCharacters(playerCharId) {
        // Map character ID to filename
        const charFiles = {
            'fighter1': 'Fighter 1.glb',
            'fighter2': 'Fighter 2.glb',
            'fighter3': 'Fighter 3.glb',
            'fighter4': 'Fighter 4.glb',
            'fighter5': 'Fighter 5.glb',
            'kenzo': 'Kenzo.glb'
        };

        // Load player character
        await this.loadCharacterModel(
            charFiles[playerCharId] || 'Fighter 1.glb',
            playerCharId,
            new BABYLON.Vector3(0, -1.5, 3.5), // Lowered slightly to look seated/standing behind
            Math.PI
        );

        // Load Kenzo
        await this.loadCharacterModel(
            'Kenzo.glb',
            'kenzo',
            new BABYLON.Vector3(0, -0.8, -4), // Raised Kenzo to be clearly visible
            0
        );
    }

    /**
     * Load character model directly
     */
    async loadCharacterModel(filename, characterId, position, rotation) {
        try {
            const result = await BABYLON.SceneLoader.ImportMeshAsync(
                '', '',
                `Assets/Models/Characters/${filename}`,
                this.scene
            );

            if (result.meshes.length > 0) {
                // Calculate bounds to normalize size
                let min = new BABYLON.Vector3(Infinity, Infinity, Infinity);
                let max = new BABYLON.Vector3(-Infinity, -Infinity, -Infinity);

                result.meshes.forEach(mesh => {
                    if (mesh.getBoundingInfo) {
                        const bi = mesh.getBoundingInfo();
                        min = BABYLON.Vector3.Minimize(min, bi.boundingBox.minimumWorld);
                        max = BABYLON.Vector3.Maximize(max, bi.boundingBox.maximumWorld);
                    }
                });

                const height = max.y - min.y;
                const scale = 1.8 / height;

                const parent = new BABYLON.TransformNode(`char_${characterId}`, this.scene);
                result.meshes.forEach(mesh => {
                    if (!mesh.parent || mesh.parent.name === '__root__') {
                        mesh.parent = parent;
                    }
                    mesh.receiveShadows = true;
                });

                parent.position = position;
                parent.rotation.y = rotation;
                parent.scaling = new BABYLON.Vector3(scale, scale, scale);

                this.characters.set(characterId, parent);

                // STOP AI Animations requested by user
                if (result.animationGroups) {
                    result.animationGroups.forEach(ag => ag.stop());
                }

                console.log(`✅ Loaded character (Static): ${characterId}`);
            }
        } catch (e) {
            console.warn(`Could not load character ${characterId}:`, e);
            // Placeholder logic moved/simplified here implicitly
        }
    }

    /**
     * Removed all playCharacterReaction animations
     */
    playCharacterReaction(characterId, reactionType) {
        // No animations as requested
        console.log(`Reacting: ${characterId} - ${reactionType} (Animation disabled)`);
    }

    /**
     * Dispose all scene objects
     */
    dispose() {
        this.sceneObjects.forEach(obj => {
            if (obj && obj.dispose) obj.dispose();
        });
        this.characters.forEach(obj => {
            if (obj && obj.dispose) obj.dispose();
        });
        this.sceneObjects.clear();
        this.characters.clear();
    }
}
