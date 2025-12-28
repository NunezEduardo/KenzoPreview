/**
 * Kenzo's Sushi Battlegrounds
 * Menu Scene - Main menu with image background
 */

export class MenuScene {
    constructor(audioManager, engine) {
        this.audioManager = audioManager;
        this.engine = engine;
        this.isActive = false;
        // No 3D menu scene anymore
    }

    /**
     * Initialize menu
     */
    initialize() {
        // Get buttons
        const btnStart = document.getElementById('btn-start');
        const btnOptions = document.getElementById('btn-options');
        const btnCredits = document.getElementById('btn-credits');
        const btnCloseOptions = document.getElementById('btn-close-options');
        const btnCloseCredits = document.getElementById('btn-close-credits');

        // Start game
        btnStart?.addEventListener('click', () => {
            this.audioManager.play('confirm');
            if (this.onStartGame) {
                this.onStartGame();
            }
        });

        // Options
        btnOptions?.addEventListener('click', () => {
            this.audioManager.play('click');
            this.showOptions();
        });

        btnCloseOptions?.addEventListener('click', () => {
            this.audioManager.play('back');
            this.hideOptions();
        });

        // Credits
        btnCredits?.addEventListener('click', () => {
            this.audioManager.play('click');
            this.showCredits();
        });

        btnCloseCredits?.addEventListener('click', () => {
            this.audioManager.play('back');
            this.hideCredits();
        });

        // Volume sliders
        this.initializeVolumeSliders();

        // Add hover sounds
        document.querySelectorAll('.menu-btn').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                this.audioManager.play('tick');
            });
        });

        // Background is handled via CSS (Background.png blurred)
    }

    /**
     * Initialize volume sliders
     */
    initializeVolumeSliders() {
        const musicSlider = document.getElementById('music-volume');
        const sfxSlider = document.getElementById('sfx-volume');
        const voiceSlider = document.getElementById('voice-volume');

        musicSlider?.addEventListener('input', (e) => {
            this.audioManager.setMusicVolume(e.target.value / 100);
        });

        sfxSlider?.addEventListener('input', (e) => {
            this.audioManager.setSfxVolume(e.target.value / 100);
            this.audioManager.play('click');
        });

        voiceSlider?.addEventListener('input', (e) => {
            this.audioManager.setVoiceVolume(e.target.value / 100);
        });
    }

    /**
     * Show the menu
     */
    show() {
        const splashScreen = document.getElementById('splash-screen');
        const mainMenu = document.getElementById('main-menu');

        splashScreen?.classList.remove('active');
        mainMenu?.classList.add('active');
        this.isActive = true;
    }

    /**
     * Hide the menu
     */
    hide() {
        const mainMenu = document.getElementById('main-menu');
        mainMenu?.classList.remove('active');
        this.isActive = false;
    }

    /**
     * Show options modal
     */
    showOptions() {
        document.getElementById('options-modal')?.classList.remove('hidden');
    }

    /**
     * Hide options modal
     */
    hideOptions() {
        document.getElementById('options-modal')?.classList.add('hidden');
    }

    /**
     * Show credits modal
     */
    showCredits() {
        document.getElementById('credits-modal')?.classList.remove('hidden');
    }

    /**
     * Hide credits modal
     */
    hideCredits() {
        document.getElementById('credits-modal')?.classList.add('hidden');
    }
}
