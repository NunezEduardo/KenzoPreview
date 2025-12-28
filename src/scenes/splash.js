/**
 * Kenzo's Sushi Battlegrounds
 * Splash Scene - Logo intro animations
 */

export class SplashScene {
    constructor(audioManager) {
        this.audioManager = audioManager;
        this.isComplete = false;
        this.onComplete = null;
    }

    /**
     * Start the splash sequence
     */
    async start() {
        const splashScreen = document.getElementById('splash-screen');
        const loadingScreen = document.getElementById('loading-screen');
        const studioLogo = document.getElementById('studio-logo');
        const gameLogo = document.getElementById('game-logo');

        // Hide loading, show splash
        loadingScreen.classList.remove('active');
        splashScreen.classList.add('active');

        // Play intro jingle
        this.audioManager.playJingle('jingleIntro');

        // Show studio logo
        await this.showLogo(studioLogo, 2500);

        // Hide studio logo, show game logo
        studioLogo.classList.add('hidden');
        studioLogo.classList.remove('visible');

        gameLogo.classList.remove('hidden');
        await this.showLogo(gameLogo, 2500);

        // Complete
        this.isComplete = true;
        if (this.onComplete) {
            this.onComplete();
        }
    }

    /**
     * Show a logo with fade animation
     */
    showLogo(logoElement, duration) {
        return new Promise((resolve) => {
            logoElement.classList.add('visible');

            setTimeout(() => {
                logoElement.classList.remove('visible');
                logoElement.classList.add('hidden');
                resolve();
            }, duration);
        });
    }

    /**
     * Skip splash (for repeat plays)
     */
    skip() {
        const splashScreen = document.getElementById('splash-screen');
        splashScreen.classList.remove('active');

        this.isComplete = true;
        if (this.onComplete) {
            this.onComplete();
        }
    }
}
