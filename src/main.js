/**
 * Kenzo's Sushi Battlegrounds
 * Main Entry Point - Initializes and connects all game systems
 */

import { GameEngine } from './core/engine.js';
import { AssetLoader } from './core/assetLoader.js';
import { AudioManager } from './core/audioManager.js';
import { SplashScene } from './scenes/splash.js';
import { MenuScene } from './scenes/menu.js';
import { CharacterSelectScene } from './scenes/characterSelect.js';
import { BattleScene } from './scenes/battle.js';

class KenzosSushiBattlegrounds {
    constructor() {
        this.engine = null;
        this.assetLoader = null;
        this.audioManager = null;

        // Scenes
        this.splashScene = null;
        this.menuScene = null;
        this.characterSelectScene = null;
        this.battleScene = null;

        // State
        this.isInitialized = false;
    }

    /**
     * Initialize the game
     */
    async init() {
        console.log('🍣 Kenzo\'s Sushi Battlegrounds - Initializing...');

        try {
            // Initialize audio first (needs user interaction on some browsers)
            this.audioManager = new AudioManager();
            await this.audioManager.initialize();

            // Initialize Babylon engine
            this.engine = new GameEngine();
            await this.engine.initialize();

            // Initialize asset loader with the scene
            this.assetLoader = new AssetLoader(this.engine.scene);

            // Load all assets with progress callback
            await this.loadAssets();

            // Initialize scenes
            await this.initializeScenes();

            this.isInitialized = true;
            console.log('🍣 Game initialized successfully!');

            // Start the game flow
            this.startGameFlow();

        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showError('Failed to load game. Please refresh the page.');
        }
    }

    /**
     * Load all game assets with progress tracking
     */
    async loadAssets() {
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');

        await this.assetLoader.loadAllAssets((progress, loaded, total) => {
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }
            if (progressText) {
                progressText.textContent = `${Math.round(progress)}%`;
            }
        });
    }

    /**
     * Initialize all game scenes
     */
    async initializeScenes() {
        // Splash scene
        this.splashScene = new SplashScene(this.audioManager);

        // Menu scene
        this.menuScene = new MenuScene(this.audioManager);
        this.menuScene.initialize();

        // Character select
        this.characterSelectScene = new CharacterSelectScene(this.assetLoader, this.audioManager);
        this.characterSelectScene.initialize();

        // Battle scene
        this.battleScene = new BattleScene(this.engine, this.assetLoader, this.audioManager);
        await this.battleScene.initialize();

        // Connect scene callbacks
        this.setupSceneCallbacks();
    }

    /**
     * Setup callbacks between scenes
     */
    setupSceneCallbacks() {
        // Splash -> Menu
        this.splashScene.onComplete = () => {
            this.menuScene.show();
        };

        // Menu -> Character Select
        this.menuScene.onStartGame = () => {
            this.menuScene.hide();
            this.characterSelectScene.show();
        };

        // Character Select -> Battle
        this.characterSelectScene.onFight = (character) => {
            this.characterSelectScene.hide();
            this.battleScene.start(character);
        };

        // Battle -> Menu (after game ends)
        this.battleScene.onGameEnd = () => {
            this.menuScene.show();
        };
    }

    /**
     * Start the game flow
     */
    startGameFlow() {
        // Allow click to skip splash
        document.addEventListener('click', () => {
            if (this.splashScene && !this.splashScene.isComplete) {
                // Continue with splash if not complete
            }
        }, { once: true });

        // Start splash sequence
        this.splashScene.start();
    }

    /**
     * Show error message to user
     */
    showError(message) {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div style="text-align: center; color: #ff6b6b;">
                    <h2>Error</h2>
                    <p>${message}</p>
                    <button onclick="location.reload()" style="
                        padding: 10px 30px;
                        margin-top: 20px;
                        background: #c41e3a;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 1rem;
                    ">Retry</button>
                </div>
            `;
        }
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const game = new KenzosSushiBattlegrounds();
    game.init();
});

// Handle visibility change (pause/resume)
document.addEventListener('visibilitychange', () => {
    // Could pause audio/animations when tab is hidden
});

// Export for debugging
window.KenzosSushiBattlegrounds = KenzosSushiBattlegrounds;
