/**
 * Kenzo's Sushi Battlegrounds
 * Asset Loader Module - Manages loading of all 3D models and textures
 */

export class AssetLoader {
    constructor(scene) {
        this.scene = scene;
        this.loadedModels = new Map();
        this.loadedTextures = new Map();
        this.loadProgress = 0;
        this.totalAssets = 0;
        this.loadedAssets = 0;

        // Asset paths
        this.basePath = 'Assets/';
        this.modelsPath = this.basePath + 'Models/';
        this.interfacePath = this.basePath + 'Interface/';
    }

    /**
     * Character model definitions
     */
    get characterModels() {
        return [
            { id: 'fighter1', name: 'Ryu', file: 'Characters/Fighter1.glb', selectable: true },
            { id: 'fighter2', name: 'Hana', file: 'Characters/Fighter2.glb', selectable: true },
            { id: 'fighter3', name: 'Kenji', file: 'Characters/Fighter3.glb', selectable: true },
            { id: 'fighter4', name: 'Sakura', file: 'Characters/Fighter4Female.glb', selectable: true },
            { id: 'fighter5', name: 'Takeshi', file: 'Characters/Fighter5.glb', selectable: true },
            { id: 'kenzo', name: 'Kenzo', file: 'Characters/Kenzo.glb', selectable: false }
        ];
    }

    /**
     * Card model definitions with stats
     */
    get cardModels() {
        return [
            // Legendary cards (tier 3) - High stats
            { id: 'dead_octopus', name: 'Dead Octopus', file: 'Cards/Dead Octopus.glb', tier: 'legendary', type: 'attack', attack: 9, defense: 4, healing: 3 },
            { id: 'sea_urchin_roll', name: 'Sea Urchin Roll', file: 'Cards/Sea Urchin Roll.glb', tier: 'legendary', type: 'defense', attack: 3, defense: 9, healing: 4 },
            { id: 'shimesaba', name: 'Shimesaba', file: 'Cards/Shimesaba.glb', tier: 'legendary', type: 'healing', attack: 4, defense: 3, healing: 9 },
            { id: 'ramen', name: 'Ramen', file: 'Cards/Ramen.glb', tier: 'legendary', type: 'healing', attack: 3, defense: 5, healing: 10 },
            { id: 'udon', name: 'Udon', file: 'Cards/Udon.glb', tier: 'legendary', type: 'defense', attack: 2, defense: 10, healing: 5 },
            { id: 'dead_tuna', name: 'Dead Tuna', file: 'Cards/Dead Tuna.glb', tier: 'legendary', type: 'attack', attack: 10, defense: 3, healing: 2 },

            // Rare cards (tier 2) - Medium-high stats
            { id: 'salmon_nigiri', name: 'Salmon Nigiri', file: 'Cards/Salmon Nigiri.glb', tier: 'rare', type: 'attack', attack: 7, defense: 4, healing: 3 },
            { id: 'maguro_nigiri', name: 'Maguro Nigiri', file: 'Cards/Maguro Nigiri.glb', tier: 'rare', type: 'attack', attack: 6, defense: 5, healing: 4 },
            { id: 'ebi_nigiri', name: 'Ebi Nigiri', file: 'Cards/Ebi Nigiri.glb', tier: 'rare', type: 'defense', attack: 4, defense: 7, healing: 3 },
            { id: 'octopus_nigiri', name: 'Octopus Nigiri', file: 'Cards/Octopus Nigiri.glb', tier: 'rare', type: 'attack', attack: 7, defense: 3, healing: 4 },
            { id: 'tamago_nigiri', name: 'Tamago Nigiri', file: 'Cards/Tamago Nigiri.glb', tier: 'rare', type: 'healing', attack: 3, defense: 4, healing: 7 },
            { id: 'salmon_roll', name: 'Salmon Roll', file: 'Cards/Salmon Roll.glb', tier: 'rare', type: 'defense', attack: 4, defense: 6, healing: 5 },
            { id: 'sea_urchin_open', name: 'Sea Urchin Open', file: 'Cards/Sea Urchin Open.glb', tier: 'rare', type: 'healing', attack: 4, defense: 3, healing: 6 },
            { id: 'gyoza', name: 'Gyoza', file: 'Cards/Gyoza.glb', tier: 'rare', type: 'defense', attack: 3, defense: 7, healing: 5 },
            { id: 'dead_flounder', name: 'Dead Flounder', file: 'Cards/Dead Flounder.glb', tier: 'rare', type: 'attack', attack: 6, defense: 6, healing: 3 },
            { id: 'dead_salmon', name: 'Dead Salmon', file: 'Cards/Dead Salmon.glb', tier: 'rare', type: 'attack', attack: 7, defense: 4, healing: 4 },
            { id: 'dead_mackerel', name: 'Dead Mackerel', file: 'Cards/Dead Mackerel.glb', tier: 'rare', type: 'defense', attack: 4, defense: 6, healing: 5 },
            { id: 'dead_eel', name: 'Dead Eel', file: 'Cards/Dead Eel.glb', tier: 'rare', type: 'healing', attack: 5, defense: 4, healing: 6 },

            // Common cards (tier 1) - Lower stats
            { id: 'avocado', name: 'Avocado', file: 'Cards/Avocado.glb', tier: 'common', type: 'healing', attack: 2, defense: 3, healing: 5 },
            { id: 'cucumber', name: 'Cucumber', file: 'Cards/Cucumber.glb', tier: 'common', type: 'healing', attack: 2, defense: 2, healing: 4 },
            { id: 'sliced_cucumber', name: 'Sliced Cucumber', file: 'Cards/Sliced Cucumber.glb', tier: 'common', type: 'healing', attack: 1, defense: 3, healing: 5 },
            { id: 'wasabi', name: 'Wasabi', file: 'Cards/Wasabi.glb', tier: 'common', type: 'attack', attack: 5, defense: 1, healing: 2 },
            { id: 'rice_ball', name: 'Rice Ball', file: 'Cards/Rice Ball.glb', tier: 'common', type: 'defense', attack: 2, defense: 5, healing: 3 },
            { id: 'onigiri', name: 'Onigiri', file: 'Cards/Onigiri.glb', tier: 'common', type: 'defense', attack: 3, defense: 4, healing: 3 },
            { id: 'sushi_roll', name: 'Sushi Roll', file: 'Cards/Sushi Roll.glb', tier: 'common', type: 'defense', attack: 3, defense: 5, healing: 2 },
            { id: 'dango', name: 'Dango', file: 'Cards/Dango.glb', tier: 'common', type: 'healing', attack: 2, defense: 2, healing: 5 },
            { id: 'chukaman', name: 'Chukaman', file: 'Cards/Chukaman.glb', tier: 'common', type: 'defense', attack: 2, defense: 5, healing: 3 },
            { id: 'dead_fish', name: 'Dead Fish', file: 'Cards/Dead Fish.glb', tier: 'common', type: 'attack', attack: 4, defense: 3, healing: 2 },
            { id: 'fish_fillet', name: 'Fish Fillet', file: 'Cards/Fish Fillet.glb', tier: 'common', type: 'attack', attack: 5, defense: 2, healing: 2 },
            { id: 'salmon', name: 'Salmon', file: 'Cards/Salmon.glb', tier: 'common', type: 'attack', attack: 4, defense: 4, healing: 2 },
            { id: 'ebi', name: 'Ebi', file: 'Cards/Ebi.glb', tier: 'common', type: 'attack', attack: 4, defense: 3, healing: 3 },
            { id: 'squid', name: 'Squid', file: 'Cards/Squid.glb', tier: 'common', type: 'defense', attack: 3, defense: 4, healing: 3 },
            { id: 'tentacle', name: 'Tentacle', file: 'Cards/Tentacle.glb', tier: 'common', type: 'attack', attack: 5, defense: 3, healing: 2 },
            { id: 'crabsticks', name: 'Crabsticks', file: 'Cards/Crabsticks.glb', tier: 'common', type: 'defense', attack: 2, defense: 4, healing: 4 },
            { id: 'sea_urchin', name: 'Sea Urchin', file: 'Cards/Sea Urchin.glb', tier: 'common', type: 'healing', attack: 3, defense: 2, healing: 4 }
        ];
    }

    /**
     * Background model definitions
     */
    get backgroundModels() {
        return [
            // Floors
            { id: 'tile_floor', name: 'Tile Floor', file: 'Background/Tile Floor.glb', category: 'floor' },
            { id: 'wood_floor', name: 'Wood Floor', file: 'Background/Wood Floor.glb', category: 'floor' },
            { id: 'kitchen_flooring', name: 'Kitchen Flooring', file: 'Background/Kitchen Flooring.glb', category: 'floor' },

            // Walls
            { id: 'normal_wall', name: 'Normal Wall', file: 'Background/Normal Wall.glb', category: 'wall' },
            { id: 'red_wood_wall', name: 'Red Wood Wall', file: 'Background/Red Wood Wall.glb', category: 'wall' },
            { id: 'shoji_wall', name: 'Shoji Wall', file: 'Background/Shoji Wall.glb', category: 'wall' },
            { id: 'shoji_interior', name: 'Shoji Interior', file: 'Background/Shoji Interior.glb', category: 'wall' },
            { id: 'wall_shelves', name: 'Wall with Shelves', file: 'Background/Wall with Shelves.glb', category: 'wall' },

            // Furniture
            { id: 'table', name: 'Table', file: 'Background/Table.glb', category: 'furniture' },
            { id: 'chair', name: 'Chair', file: 'Background/Chair.glb', category: 'furniture' },
            { id: 'stool', name: 'Stool', file: 'Background/Stool.glb', category: 'furniture' },
            { id: 'bench', name: 'Bench', file: 'Background/Bench.glb', category: 'furniture' },
            { id: 'sofa', name: 'Sofa', file: 'Background/Sofa.glb', category: 'furniture' },

            // Counter elements
            { id: 'counter_straight', name: 'Counter Straight', file: 'Background/Counter Straight.glb', category: 'counter' },
            { id: 'counter_corner', name: 'Counter Corner', file: 'Background/Counter Corner.glb', category: 'counter' },
            { id: 'counter_end', name: 'Counter End', file: 'Background/Counter End.glb', category: 'counter' },
            { id: 'counter_sink', name: 'Counter Sink', file: 'Background/Counter Sink.glb', category: 'counter' },
            { id: 'counter_drawers', name: 'Counter Drawers', file: 'Background/Counter Drawers.glb', category: 'counter' },

            // Kitchen equipment
            { id: 'fridge', name: 'Fridge', file: 'Background/Fridge.glb', category: 'equipment' },
            { id: 'can_fridge', name: 'Can Fridge', file: 'Background/Can Fridge.glb', category: 'equipment' },
            { id: 'oven', name: 'Oven', file: 'Background/Oven.glb', category: 'equipment' },
            { id: 'chukaman_steamer', name: 'Chukaman Steamer', file: 'Background/Chukaman Steamer.glb', category: 'equipment' },

            // Props
            { id: 'bottles', name: 'Bottles', file: 'Background/Bottles.glb', category: 'prop' },
            { id: 'bowl', name: 'Bowl', file: 'Background/Bowl.glb', category: 'prop' },
            { id: 'plate', name: 'Plate', file: 'Background/Plate.glb', category: 'prop' },
            { id: 'chopping_board', name: 'Chopping Board', file: 'Background/Chopping board.glb', category: 'prop' },
            { id: 'kitchen_knives', name: 'Kitchen Knives', file: 'Background/Kitchen Knives.glb', category: 'prop' },
            { id: 'pan', name: 'Pan', file: 'Background/Pan.glb', category: 'prop' },
            { id: 'pot_filled', name: 'Pot Filled', file: 'Background/Pot Filled.glb', category: 'prop' },

            // Decorations
            { id: 'torii_gate', name: 'Torii Gate', file: 'Background/Torii Gate.glb', category: 'decoration' },
            { id: 'arch', name: 'Arch', file: 'Background/Arch.glb', category: 'decoration' },
            { id: 'doorway', name: 'Doorway', file: 'Background/Doorway.glb', category: 'decoration' },
            { id: 'japanese_door', name: 'Japanese Door', file: 'Background/Japanese Door.glb', category: 'decoration' }
        ];
    }

    /**
     * Calculate total assets to load
     */
    calculateTotalAssets() {
        this.totalAssets =
            this.characterModels.length +
            this.cardModels.length +
            20; // Subset of background models for performance
        return this.totalAssets;
    }

    /**
     * Update loading progress
     */
    updateProgress(onProgress) {
        this.loadedAssets++;
        this.loadProgress = (this.loadedAssets / this.totalAssets) * 100;
        if (onProgress) {
            onProgress(this.loadProgress, this.loadedAssets, this.totalAssets);
        }
    }

    /**
     * Load all game assets
     */
    async loadAllAssets(onProgress) {
        this.calculateTotalAssets();

        // Load characters
        await this.loadCharacters(onProgress);

        // Load cards
        await this.loadCards(onProgress);

        // Load background (essential only)
        await this.loadBackgroundEssentials(onProgress);

        return {
            characters: this.loadedModels,
            cards: this.loadedModels,
            background: this.loadedModels
        };
    }

    /**
     * Load character models
     */
    async loadCharacters(onProgress) {
        for (const char of this.characterModels) {
            try {
                const result = await BABYLON.SceneLoader.ImportMeshAsync(
                    '',
                    this.modelsPath,
                    char.file,
                    this.scene
                );

                // Create a parent container for all meshes
                const container = new BABYLON.TransformNode(char.id, this.scene);
                result.meshes.forEach(mesh => {
                    if (!mesh.parent) {
                        mesh.parent = container;
                    }
                    mesh.isVisible = false;
                });

                // Store with animations
                this.loadedModels.set(char.id, {
                    ...char,
                    container,
                    meshes: result.meshes,
                    animationGroups: result.animationGroups,
                    skeletons: result.skeletons
                });

                this.updateProgress(onProgress);
            } catch (error) {
                console.warn(`Failed to load character: ${char.name}`, error);
                this.updateProgress(onProgress);
            }
        }
    }

    /**
     * Load card models
     */
    async loadCards(onProgress) {
        for (const card of this.cardModels) {
            try {
                const result = await BABYLON.SceneLoader.ImportMeshAsync(
                    '',
                    this.modelsPath,
                    card.file,
                    this.scene
                );

                // Create container
                const container = new BABYLON.TransformNode(`card_${card.id}`, this.scene);
                result.meshes.forEach(mesh => {
                    if (!mesh.parent) {
                        mesh.parent = container;
                    }
                    mesh.isVisible = false;
                });

                this.loadedModels.set(`card_${card.id}`, {
                    ...card,
                    container,
                    meshes: result.meshes
                });

                this.updateProgress(onProgress);
            } catch (error) {
                console.warn(`Failed to load card: ${card.name}`, error);
                this.updateProgress(onProgress);
            }
        }
    }

    /**
     * Load essential background models
     */
    async loadBackgroundEssentials(onProgress) {
        // Load only the most important background elements
        const essentialIds = [
            'table', 'chair', 'stool', 'counter_straight', 'counter_corner',
            'tile_floor', 'normal_wall', 'shoji_wall', 'torii_gate',
            'bottles', 'bowl', 'plate', 'chopping_board', 'kitchen_knives',
            'fridge', 'oven', 'japanese_door', 'arch', 'bench', 'pot_filled'
        ];

        for (const bgModel of this.backgroundModels) {
            if (!essentialIds.includes(bgModel.id)) continue;

            try {
                const result = await BABYLON.SceneLoader.ImportMeshAsync(
                    '',
                    this.modelsPath,
                    bgModel.file,
                    this.scene
                );

                const container = new BABYLON.TransformNode(`bg_${bgModel.id}`, this.scene);
                result.meshes.forEach(mesh => {
                    if (!mesh.parent) {
                        mesh.parent = container;
                    }
                    mesh.isVisible = false;
                });

                this.loadedModels.set(`bg_${bgModel.id}`, {
                    ...bgModel,
                    container,
                    meshes: result.meshes
                });

                this.updateProgress(onProgress);
            } catch (error) {
                console.warn(`Failed to load background: ${bgModel.name}`, error);
                this.updateProgress(onProgress);
            }
        }
    }

    /**
     * Get a loaded model by ID
     */
    getModel(id) {
        return this.loadedModels.get(id);
    }

    /**
     * Clone a model for use in the scene
     */
    cloneModel(id, newName) {
        const model = this.loadedModels.get(id);
        if (!model) {
            console.warn(`Model not found: ${id}`);
            return null;
        }

        const clone = model.container.clone(newName, null);
        clone.getChildMeshes().forEach(mesh => {
            mesh.isVisible = true;
        });

        return clone;
    }

    /**
     * Get all selectable characters
     */
    getSelectableCharacters() {
        return this.characterModels.filter(c => c.selectable);
    }

    /**
     * Get all cards as data array
     */
    getAllCards() {
        return this.cardModels.map(card => ({
            ...card,
            modelId: `card_${card.id}`
        }));
    }

    /**
     * Dispose of all loaded models
     */
    dispose() {
        this.loadedModels.forEach((value) => {
            if (value.container) {
                value.container.dispose();
            }
        });
        this.loadedModels.clear();
    }
}
