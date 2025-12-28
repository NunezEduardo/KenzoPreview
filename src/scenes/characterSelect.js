/**
 * Kenzo's Sushi Battlegrounds
 * Character Select Scene - Static 3D model previews (No animation)
 */

export class CharacterSelectScene {
    constructor(assetLoader, audioManager) {
        this.assetLoader = assetLoader;
        this.audioManager = audioManager;
        this.isActive = false;
        this.selectedCharacter = null;

        // 3D Preview
        this.previewEngine = null;
        this.previewScene = null;
        this.previewCanvas = null;
        this.currentPreviewModel = null;

        // Callbacks
        this.onFight = null;
        this.onBack = null;
    }

    /**
     * Initialize the character select screen
     */
    initialize() {
        const grid = document.getElementById('character-grid');
        const btnFight = document.getElementById('btn-fight');

        if (!grid) return;

        // Create character cards with 3D previews
        const characters = this.assetLoader.getSelectableCharacters();

        characters.forEach((char, index) => {
            const card = this.createCharacterCard(char, index);
            grid.appendChild(card);
        });

        // Initialize 3D preview canvas for selected character
        this.initializePreviewCanvas();

        // Setup Kenzo preview
        this.setupKenzoPreview();

        // Fight button
        btnFight?.addEventListener('click', () => {
            if (this.selectedCharacter) {
                this.audioManager.play('confirm');
                this.audioManager.playVoice('kenzoFight');
                this.disposePreview();
                if (this.onFight) {
                    this.onFight(this.selectedCharacter);
                }
            }
        });
    }

    /**
     * Initialize the 3D preview canvas
     */
    initializePreviewCanvas() {
        const playerPortrait = document.getElementById('player-portrait');
        if (!playerPortrait) return;

        playerPortrait.innerHTML = '';
        playerPortrait.style.overflow = 'hidden';

        this.previewCanvas = document.createElement('canvas');
        this.previewCanvas.style.cssText = 'width: 100%; height: 100%; border-radius: 50%;';
        playerPortrait.appendChild(this.previewCanvas);

        this.previewEngine = new BABYLON.Engine(this.previewCanvas, true, {
            preserveDrawingBuffer: true,
            stencil: false,
            antialias: true,
            alpha: true // Enable transparency
        });

        this.previewScene = new BABYLON.Scene(this.previewEngine);
        this.previewScene.clearColor = new BABYLON.Color4(0, 0, 0, 0); // Transparent

        // Camera
        const camera = new BABYLON.ArcRotateCamera(
            'previewCam',
            Math.PI / 2,
            Math.PI / 2.5,
            3,
            new BABYLON.Vector3(0, 0.8, 0),
            this.previewScene
        );

        // Lighting
        const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), this.previewScene);
        light.intensity = 1.5;

        // Start render loop
        this.previewEngine.runRenderLoop(() => {
            this.previewScene.render();
        });
    }

    /**
     * Create a character card element with 3D preview
     */
    createCharacterCard(character, index) {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.dataset.characterId = character.id;

        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'char-image';
        canvasContainer.style.cssText = 'position: relative; overflow: hidden;';

        const canvas = document.createElement('canvas');
        canvas.width = 150;
        canvas.height = 180;
        canvas.style.cssText = 'width: 100%; height: 100%;';
        canvasContainer.appendChild(canvas);
        card.appendChild(canvasContainer);

        const name = document.createElement('div');
        name.className = 'char-name';
        name.textContent = character.name;
        card.appendChild(name);

        this.initializeCharacterPreview(canvas, character);

        card.addEventListener('click', () => this.selectCharacter(character, card));

        return card;
    }

    /**
     * Initialize 3D preview for a character card
     */
    async initializeCharacterPreview(canvas, character) {
        try {
            const engine = new BABYLON.Engine(canvas, true, {
                preserveDrawingBuffer: true,
                stencil: false,
                antialias: true,
                alpha: true
            });

            const scene = new BABYLON.Scene(engine);
            scene.clearColor = new BABYLON.Color4(0, 0, 0, 0); // Transparent

            const camera = new BABYLON.ArcRotateCamera(
                'cam',
                Math.PI / 2,
                Math.PI / 2.5,
                2.5,
                new BABYLON.Vector3(0, 0.7, 0),
                scene
            );

            const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
            light.intensity = 1.3;

            const modelPath = `Assets/Models/Characters/${character.file.split('/').pop()}`;

            try {
                const result = await BABYLON.SceneLoader.ImportMeshAsync('', '', modelPath, scene);

                if (result.meshes.length > 0) {
                    let min = new BABYLON.Vector3(Infinity, Infinity, Infinity);
                    let max = new BABYLON.Vector3(-Infinity, -Infinity, -Infinity);

                    result.meshes.forEach(mesh => {
                        if (mesh.getBoundingInfo) {
                            const bi = mesh.getBoundingInfo();
                            min = BABYLON.Vector3.Minimize(min, bi.boundingBox.minimumWorld);
                            max = BABYLON.Vector3.Maximize(max, bi.boundingBox.maximumWorld);
                        }
                    });

                    const center = BABYLON.Vector3.Center(min, max);
                    const size = max.subtract(min);
                    const maxDim = Math.max(size.x, size.y, size.z);
                    const scale = 1.6 / maxDim; // Slightly larger for cartoon feel

                    const parent = new BABYLON.TransformNode('parent', scene);
                    result.meshes.forEach(mesh => {
                        if (!mesh.parent || mesh.parent.name === '__root__') {
                            mesh.parent = parent;
                        }
                    });

                    parent.position.y = -center.y * scale;
                    parent.scaling = new BABYLON.Vector3(scale, scale, scale);

                    // Stop any animations
                    if (result.animationGroups) {
                        result.animationGroups.forEach(ag => ag.stop());
                    }

                    // No rotation animation added
                }
            } catch (e) {
                console.warn('Could not load character model:', character.name);
            }

            engine.runRenderLoop(() => {
                scene.render();
            });

        } catch (error) {
            console.warn('Failed to create character preview:', character.name);
        }
    }

    /**
     * Select a character
     */
    async selectCharacter(character, cardElement) {
        document.querySelectorAll('.character-card').forEach(c => {
            c.classList.remove('selected');
        });

        cardElement.classList.add('selected');
        this.selectedCharacter = character;

        this.updatePreview(character);
        await this.loadCharacterIntoPortrait(character);

        const btnFight = document.getElementById('btn-fight');
        if (btnFight) {
            btnFight.disabled = false;
        }

        this.audioManager.play('select');
        const voicePrefix = character.id === 'fighter4' ? 'female' : 'male';
        this.audioManager.playVoice(`${voicePrefix}Ready`);
    }

    /**
     * Load character 3D model into portrait preview
     */
    async loadCharacterIntoPortrait(character) {
        if (!this.previewScene) return;

        if (this.currentPreviewModel) {
            this.currentPreviewModel.dispose();
        }

        try {
            const modelPath = `Assets/Models/Characters/${character.file.split('/').pop()}`;
            const result = await BABYLON.SceneLoader.ImportMeshAsync('', '', modelPath, this.previewScene);

            if (result.meshes.length > 0) {
                let min = new BABYLON.Vector3(Infinity, Infinity, Infinity);
                let max = new BABYLON.Vector3(-Infinity, -Infinity, -Infinity);

                result.meshes.forEach(mesh => {
                    if (mesh.getBoundingInfo) {
                        const bi = mesh.getBoundingInfo();
                        min = BABYLON.Vector3.Minimize(min, bi.boundingBox.minimumWorld);
                        max = BABYLON.Vector3.Maximize(max, bi.boundingBox.maximumWorld);
                    }
                });

                const center = BABYLON.Vector3.Center(min, max);
                const size = max.subtract(min);
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 1.3 / maxDim;

                const parent = new BABYLON.TransformNode('charPreview', this.previewScene);
                result.meshes.forEach(mesh => {
                    if (!mesh.parent || mesh.parent.name === '__root__') {
                        mesh.parent = parent;
                    }
                });

                parent.position.y = -center.y * scale + 0.3;
                parent.scaling = new BABYLON.Vector3(scale, scale, scale);

                // Stop animation
                if (result.animationGroups) {
                    result.animationGroups.forEach(ag => ag.stop());
                }

                this.currentPreviewModel = parent;
            }
        } catch (e) {
            console.warn('Could not load character preview:', e);
        }
    }

    /**
     * Update character preview text
     */
    updatePreview(character) {
        const previewName = document.getElementById('preview-name');
        if (previewName) {
            previewName.textContent = character.name;
        }
    }

    /**
     * Setup Kenzo opponent preview
     */
    async setupKenzoPreview() {
        const kenzoPortrait = document.querySelector('.kenzo-portrait');
        if (!kenzoPortrait) return;

        kenzoPortrait.innerHTML = '';
        kenzoPortrait.style.overflow = 'hidden';

        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'width: 100%; height: 100%; border-radius: 50%;';
        kenzoPortrait.appendChild(canvas);

        try {
            const engine = new BABYLON.Engine(canvas, true, {
                preserveDrawingBuffer: true,
                stencil: false,
                antialias: true,
                alpha: true
            });

            const scene = new BABYLON.Scene(engine);
            scene.clearColor = new BABYLON.Color4(0, 0, 0, 0); // Transparent

            const camera = new BABYLON.ArcRotateCamera(
                'kenzoCam',
                Math.PI / 2,
                Math.PI / 2.5,
                2.5,
                new BABYLON.Vector3(0, 0.7, 0),
                scene
            );

            const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
            light.intensity = 1.3;

            const result = await BABYLON.SceneLoader.ImportMeshAsync('', '', 'Assets/Models/Characters/Kenzo.glb', scene);

            if (result.meshes.length > 0) {
                let min = new BABYLON.Vector3(Infinity, Infinity, Infinity);
                let max = new BABYLON.Vector3(-Infinity, -Infinity, -Infinity);

                result.meshes.forEach(mesh => {
                    if (mesh.getBoundingInfo) {
                        const bi = mesh.getBoundingInfo();
                        min = BABYLON.Vector3.Minimize(min, bi.boundingBox.minimumWorld);
                        max = BABYLON.Vector3.Maximize(max, bi.boundingBox.maximumWorld);
                    }
                });

                const center = BABYLON.Vector3.Center(min, max);
                const size = max.subtract(min);
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 1.3 / maxDim;

                const parent = new BABYLON.TransformNode('kenzoPreview', scene);
                result.meshes.forEach(mesh => {
                    if (!mesh.parent || mesh.parent.name === '__root__') {
                        mesh.parent = parent;
                    }
                });

                parent.position.y = -center.y * scale + 0.3;
                parent.scaling = new BABYLON.Vector3(scale, scale, scale);

                if (result.animationGroups) {
                    result.animationGroups.forEach(ag => ag.stop());
                }
            }

            engine.runRenderLoop(() => {
                scene.render();
            });

        } catch (e) {
            console.warn('Could not load Kenzo preview:', e);
        }
    }

    /**
     * Show the character select screen
     */
    show() {
        const mainMenu = document.getElementById('main-menu');
        const charSelect = document.getElementById('character-select');

        mainMenu?.classList.remove('active');
        charSelect?.classList.add('active');
        this.isActive = true;

        this.selectedCharacter = null;
        document.querySelectorAll('.character-card').forEach(c => {
            c.classList.remove('selected');
        });
        document.getElementById('btn-fight').disabled = true;

        setTimeout(() => {
            this.audioManager.playVoice('kenzoChooseCharacter');
        }, 500);
    }

    /**
     * Hide the character select screen
     */
    hide() {
        const charSelect = document.getElementById('character-select');
        charSelect?.classList.remove('active');
        this.isActive = false;
    }

    /**
     * Dispose preview resources
     */
    disposePreview() {
        if (this.previewScene) {
            this.previewScene.dispose();
        }
        if (this.previewEngine) {
            this.previewEngine.dispose();
        }
    }

    /**
     * Get the selected character
     */
    getSelectedCharacter() {
        return this.selectedCharacter;
    }
}
