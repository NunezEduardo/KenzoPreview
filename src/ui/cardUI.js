/**
 * Kenzo's Sushi Battlegrounds
 * Card UI - Improved 3D model rendering on cards
 */

export class CardUI {
    constructor(scene, cardSystem, assetLoader) {
        this.scene = scene;
        this.cardSystem = cardSystem;
        this.assetLoader = assetLoader;
        this.cardPreviews = new Map();
        this.cardWidth = 1.2;
        this.cardHeight = 1.8;
    }

    /**
     * Create an HTML card element with 3D model preview
     */
    createCardElement(cardData, onClick = null) {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.dataset.cardId = cardData.id;

        // Tier badge
        const tier = document.createElement('div');
        tier.className = `card-tier ${cardData.tier}`;
        tier.textContent = cardData.tier.toUpperCase();
        card.appendChild(tier);

        // Type badge
        const type = document.createElement('div');
        type.className = `card-type ${cardData.type}`;
        type.textContent = this.cardSystem.getTypeIcon(cardData.type);
        card.appendChild(type);

        // Card image area with 3D model
        const imageArea = document.createElement('div');
        imageArea.className = 'card-image';

        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 130;
        canvas.style.cssText = 'width: 100%; height: 100%; border-radius: 8px;';
        imageArea.appendChild(canvas);
        card.appendChild(imageArea);

        // Initialize 3D preview
        this.initializeCardModel(canvas, cardData);

        // Card name
        const name = document.createElement('div');
        name.className = 'card-name';
        name.textContent = cardData.name;
        card.appendChild(name);

        // Stats
        const stats = document.createElement('div');
        stats.className = 'card-stats';

        stats.appendChild(this.createStatElement('⚔️', cardData.attack, 'attack'));
        stats.appendChild(this.createStatElement('🛡️', cardData.defense, 'defense'));
        stats.appendChild(this.createStatElement('💚', cardData.healing, 'healing'));
        card.appendChild(stats);

        if (onClick) {
            card.addEventListener('click', () => onClick(cardData));
            card.style.cursor = 'pointer';
        }

        return card;
    }

    /**
     * Initialize 3D model on card canvas
     */
    async initializeCardModel(canvas, cardData) {
        try {
            const engine = new BABYLON.Engine(canvas, true, {
                preserveDrawingBuffer: true,
                stencil: false,
                antialias: true
            });

            const scene = new BABYLON.Scene(engine);

            // Gradient background based on card type
            const bgColors = {
                attack: new BABYLON.Color4(0.15, 0.08, 0.08, 1),
                defense: new BABYLON.Color4(0.08, 0.12, 0.15, 1),
                healing: new BABYLON.Color4(0.08, 0.15, 0.1, 1)
            };
            scene.clearColor = bgColors[cardData.type] || new BABYLON.Color4(0.1, 0.1, 0.12, 1);

            // Camera
            const camera = new BABYLON.ArcRotateCamera(
                'cam',
                Math.PI / 4,
                Math.PI / 3,
                2.5,
                BABYLON.Vector3.Zero(),
                scene
            );

            // Lighting
            const ambient = new BABYLON.HemisphericLight('ambient', new BABYLON.Vector3(0, 1, 0), scene);
            ambient.intensity = 1.2;
            ambient.groundColor = new BABYLON.Color3(0.2, 0.2, 0.3);

            const frontLight = new BABYLON.DirectionalLight('front', new BABYLON.Vector3(0.5, -0.5, 1), scene);
            frontLight.intensity = 0.8;

            // Type-specific accent light
            const accentColors = {
                attack: new BABYLON.Color3(1, 0.4, 0.3),
                defense: new BABYLON.Color3(0.3, 0.7, 1),
                healing: new BABYLON.Color3(0.4, 1, 0.6)
            };
            const accentLight = new BABYLON.PointLight('accent', new BABYLON.Vector3(-1, 1, 1), scene);
            accentLight.diffuse = accentColors[cardData.type] || new BABYLON.Color3(1, 1, 1);
            accentLight.intensity = 0.4;

            // Load the model
            const modelPath = `Assets/Models/${cardData.file}`;

            try {
                const result = await BABYLON.SceneLoader.ImportMeshAsync('', '', modelPath, scene);

                if (result.meshes.length > 0) {
                    // Get bounds
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

                    // Create parent node
                    const parent = new BABYLON.TransformNode('sushiModel', scene);
                    result.meshes.forEach(mesh => {
                        if (!mesh.parent || mesh.parent.name === '__root__') {
                            mesh.parent = parent;
                        }
                    });

                    parent.position = center.negate().scale(scale);
                    parent.scaling = new BABYLON.Vector3(scale, scale, scale);

                    // Smooth rotation animation
                    let rotationSpeed = 0.012;
                    scene.registerBeforeRender(() => {
                        parent.rotation.y += rotationSpeed;
                        // Gentle bobbing
                        parent.position.y = Math.sin(Date.now() * 0.002) * 0.05;
                    });
                }
            } catch (e) {
                console.warn('Could not load card model:', cardData.name);
                this.showFallbackDisplay(canvas, cardData);
                engine.dispose();
                return;
            }

            engine.runRenderLoop(() => {
                scene.render();
            });

            // Store for cleanup
            this.cardPreviews.set(`${cardData.id}_${Date.now()}`, { engine, scene });

        } catch (error) {
            console.warn('Failed to create card preview:', cardData.name);
            this.showFallbackDisplay(canvas, cardData);
        }
    }

    /**
     * Show fallback display if model fails
     */
    showFallbackDisplay(canvas, cardData) {
        const ctx = canvas.getContext('2d');

        // Background gradient based on type
        const gradients = {
            attack: ['#2a1515', '#1a0a0a'],
            defense: ['#152025', '#0a1015'],
            healing: ['#152a1a', '#0a150d']
        };
        const colors = gradients[cardData.type] || ['#1a1a2e', '#0f0f1a'];

        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(1, colors[1]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw emoji
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.getCardEmoji(cardData), canvas.width / 2, canvas.height / 2);
    }

    /**
     * Create a simpler card element for hand display (performance)
     */
    createSimpleCardElement(cardData, onClick = null) {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.dataset.cardId = cardData.id;

        // Tier
        const tier = document.createElement('div');
        tier.className = `card-tier ${cardData.tier}`;
        tier.textContent = cardData.tier.charAt(0).toUpperCase();
        card.appendChild(tier);

        // Type
        const type = document.createElement('div');
        type.className = `card-type ${cardData.type}`;
        type.textContent = this.cardSystem.getTypeIcon(cardData.type);
        card.appendChild(type);

        // Smaller 3D preview for hand cards
        const imageArea = document.createElement('div');
        imageArea.className = 'card-image';

        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 80;
        canvas.style.cssText = 'width: 100%; height: 100%;';
        imageArea.appendChild(canvas);
        card.appendChild(imageArea);

        // Initialize smaller 3D preview
        this.initializeSimpleCardModel(canvas, cardData);

        // Name
        const name = document.createElement('div');
        name.className = 'card-name';
        name.textContent = cardData.name;
        card.appendChild(name);

        // Stats
        const stats = document.createElement('div');
        stats.className = 'card-stats';
        stats.appendChild(this.createStatElement('⚔️', cardData.attack, 'attack'));
        stats.appendChild(this.createStatElement('🛡️', cardData.defense, 'defense'));
        stats.appendChild(this.createStatElement('💚', cardData.healing, 'healing'));
        card.appendChild(stats);

        if (onClick) {
            card.addEventListener('click', () => onClick(cardData));
            card.style.cursor = 'pointer';
        }

        return card;
    }

    /**
     * Initialize simpler 3D model for hand cards
     */
    async initializeSimpleCardModel(canvas, cardData) {
        try {
            const engine = new BABYLON.Engine(canvas, true, {
                preserveDrawingBuffer: true,
                stencil: false
            });

            const scene = new BABYLON.Scene(engine);
            scene.clearColor = new BABYLON.Color4(0.08, 0.08, 0.1, 1);

            const camera = new BABYLON.ArcRotateCamera(
                'cam', Math.PI / 4, Math.PI / 3, 2, BABYLON.Vector3.Zero(), scene
            );

            const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
            light.intensity = 1.5;

            const modelPath = `Assets/Models/${cardData.file}`;

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
                    const maxDim = Math.max(max.x - min.x, max.y - min.y, max.z - min.z);
                    const scale = 1.0 / maxDim;

                    const parent = new BABYLON.TransformNode('model', scene);
                    result.meshes.forEach(mesh => {
                        if (!mesh.parent || mesh.parent.name === '__root__') {
                            mesh.parent = parent;
                        }
                    });

                    parent.position = center.negate().scale(scale);
                    parent.scaling = new BABYLON.Vector3(scale, scale, scale);

                    scene.registerBeforeRender(() => {
                        parent.rotation.y += 0.015;
                    });
                }
            } catch (e) {
                this.showFallbackDisplay(canvas, cardData);
                engine.dispose();
                return;
            }

            engine.runRenderLoop(() => scene.render());
            this.cardPreviews.set(`simple_${cardData.id}_${Date.now()}`, { engine, scene });

        } catch (error) {
            this.showFallbackDisplay(canvas, cardData);
        }
    }

    /**
     * Create a stat element
     */
    createStatElement(icon, value, type) {
        const stat = document.createElement('div');
        stat.className = 'card-stat';

        const iconSpan = document.createElement('span');
        iconSpan.className = 'stat-icon';
        iconSpan.textContent = icon;
        stat.appendChild(iconSpan);

        const valueSpan = document.createElement('span');
        valueSpan.className = `stat-value stat-${type}`;
        valueSpan.textContent = value;
        stat.appendChild(valueSpan);

        return stat;
    }

    /**
     * Get emoji fallback for card
     */
    getCardEmoji(cardData) {
        const emojiMap = {
            'dead_octopus': '🐙', 'sea_urchin_roll': '🍣', 'shimesaba': '🐟',
            'ramen': '🍜', 'udon': '🍲', 'dead_tuna': '🐟', 'salmon_nigiri': '🍣',
            'maguro_nigiri': '🍣', 'ebi_nigiri': '🦐', 'octopus_nigiri': '🍣',
            'tamago_nigiri': '🍳', 'salmon_roll': '🍣', 'sea_urchin_open': '🦔',
            'gyoza': '🥟', 'dead_flounder': '🐟', 'dead_salmon': '🐟',
            'dead_mackerel': '🐟', 'dead_eel': '🐍', 'avocado': '🥑',
            'cucumber': '🥒', 'sliced_cucumber': '🥒', 'wasabi': '🟢',
            'rice_ball': '🍙', 'onigiri': '🍙', 'sushi_roll': '🍣',
            'dango': '🍡', 'chukaman': '🥟', 'dead_fish': '🐟',
            'fish_fillet': '🐟', 'salmon': '🐟', 'ebi': '🦐',
            'squid': '🦑', 'tentacle': '🦑', 'crabsticks': '🦀', 'sea_urchin': '🦔'
        };
        return emojiMap[cardData.id] || '🍣';
    }

    /**
     * Dispose all card render engines
     */
    dispose() {
        this.cardPreviews.forEach(({ engine, scene }) => {
            if (scene) scene.dispose();
            if (engine) engine.dispose();
        });
        this.cardPreviews.clear();
    }
}
