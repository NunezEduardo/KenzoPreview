/**
 * Kenzo's Sushi Battlegrounds
 * HUD - In-game heads-up display
 */

export class HUD {
    constructor(audioManager) {
        this.audioManager = audioManager;

        // Element references
        this.elements = {
            playerScore: null,
            kenzoScore: null,
            roundNumber: null,
            phaseDisplay: null,
            playerName: null,
            playerAvatar: null
        };

        // Animation timers
        this.scoreAnimationTimer = null;
    }

    /**
     * Initialize HUD elements
     */
    initialize() {
        this.elements.playerScore = document.getElementById('player-score');
        this.elements.kenzoScore = document.getElementById('kenzo-score');
        this.elements.roundNumber = document.getElementById('round-number');
        this.elements.phaseDisplay = document.getElementById('phase-display');
        this.elements.playerName = document.getElementById('hud-player-name');
        this.elements.playerAvatar = document.getElementById('hud-player-avatar');
    }

    /**
     * Set player info
     */
    setPlayerInfo(name, avatarUrl = null) {
        if (this.elements.playerName) {
            this.elements.playerName.textContent = name.toUpperCase();
        }
        if (this.elements.playerAvatar && avatarUrl) {
            this.elements.playerAvatar.innerHTML = `<img src="${avatarUrl}" alt="${name}">`;
        }
    }

    /**
     * Update score display
     */
    updateScore(playerScore, kenzoScore, animate = true) {
        if (this.elements.playerScore) {
            if (animate) {
                this.animateScoreChange(this.elements.playerScore, playerScore);
            } else {
                this.elements.playerScore.textContent = playerScore;
            }
        }
        if (this.elements.kenzoScore) {
            if (animate) {
                this.animateScoreChange(this.elements.kenzoScore, kenzoScore);
            } else {
                this.elements.kenzoScore.textContent = kenzoScore;
            }
        }
    }

    /**
     * Animate score change
     */
    animateScoreChange(element, newScore) {
        const currentScore = parseInt(element.textContent) || 0;

        if (currentScore !== newScore) {
            // Pop animation
            element.style.transform = 'scale(1.5)';
            element.style.color = newScore > currentScore ? '#2ecc71' : '#ff6b6b';

            setTimeout(() => {
                element.textContent = newScore;
                element.style.transform = 'scale(1)';
                element.style.color = '';
            }, 200);
        }
    }

    /**
     * Update round display
     */
    updateRound(roundNumber) {
        if (this.elements.roundNumber) {
            this.elements.roundNumber.textContent = roundNumber;

            // Flash animation
            this.elements.roundNumber.classList.add('fade-in');
            setTimeout(() => {
                this.elements.roundNumber.classList.remove('fade-in');
            }, 500);
        }
    }

    /**
     * Update phase display
     */
    updatePhase(phaseName) {
        if (this.elements.phaseDisplay) {
            this.elements.phaseDisplay.textContent = phaseName.toUpperCase();

            // Color based on phase
            switch (phaseName.toLowerCase()) {
                case 'draft phase':
                    this.elements.phaseDisplay.style.background = 'rgba(74, 158, 255, 0.2)';
                    this.elements.phaseDisplay.style.borderColor = 'rgba(74, 158, 255, 0.3)';
                    this.elements.phaseDisplay.style.color = '#4a9eff';
                    break;
                case 'battle phase':
                    this.elements.phaseDisplay.style.background = 'rgba(196, 30, 58, 0.2)';
                    this.elements.phaseDisplay.style.borderColor = 'rgba(196, 30, 58, 0.3)';
                    this.elements.phaseDisplay.style.color = '#c41e3a';
                    break;
                case 'select cards':
                    this.elements.phaseDisplay.style.background = 'rgba(212, 175, 55, 0.2)';
                    this.elements.phaseDisplay.style.borderColor = 'rgba(212, 175, 55, 0.3)';
                    this.elements.phaseDisplay.style.color = '#d4af37';
                    break;
                default:
                    this.elements.phaseDisplay.style.background = 'rgba(255, 255, 255, 0.1)';
                    this.elements.phaseDisplay.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    this.elements.phaseDisplay.style.color = '#ffffff';
            }
        }
    }

    /**
     * Show round announcement
     */
    showRoundAnnouncement(roundNumber, callback = null) {
        const overlay = document.createElement('div');
        overlay.className = 'round-announcement';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            background: rgba(0, 0, 0, 0.7);
            z-index: 1000;
            pointer-events: none;
        `;

        const text = document.createElement('div');
        text.style.cssText = `
            font-family: 'Orbitron', sans-serif;
            font-size: 5rem;
            font-weight: 900;
            color: #d4af37;
            text-shadow: 0 0 50px rgba(212, 175, 55, 0.8);
            animation: roundPop 1.5s ease-out forwards;
        `;
        text.textContent = `ROUND ${roundNumber}`;
        overlay.appendChild(text);

        // Add animation keyframes if not exists
        if (!document.getElementById('round-pop-style')) {
            const style = document.createElement('style');
            style.id = 'round-pop-style';
            style.textContent = `
                @keyframes roundPop {
                    0% { transform: scale(0); opacity: 0; }
                    30% { transform: scale(1.3); opacity: 1; }
                    50% { transform: scale(1); }
                    80% { transform: scale(1); opacity: 1; }
                    100% { transform: scale(2); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(overlay);

        // Remove after animation
        setTimeout(() => {
            overlay.remove();
            if (callback) callback();
        }, 1500);
    }

    /**
     * Show VS splash
     */
    showVSSplash(playerName, callback = null) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            background: linear-gradient(135deg, rgba(10,10,15,0.95) 0%, rgba(20,10,10,0.95) 100%);
            z-index: 1000;
        `;

        overlay.innerHTML = `
            <div style="display: flex; align-items: center; gap: 60px;">
                <div style="text-align: center;">
                    <div style="font-family: 'Orbitron', sans-serif; font-size: 2rem; color: #d4af37; margin-bottom: 10px;">${playerName.toUpperCase()}</div>
                    <div style="font-size: 1rem; color: rgba(255,255,255,0.6);">CHALLENGER</div>
                </div>
                <div style="font-family: 'Orbitron', sans-serif; font-size: 6rem; font-weight: 900; color: #c41e3a; text-shadow: 0 0 50px rgba(196,30,58,0.8); animation: vsPulse 1s ease-in-out infinite;">VS</div>
                <div style="text-align: center;">
                    <div style="font-family: 'Orbitron', sans-serif; font-size: 2rem; color: #c41e3a; margin-bottom: 10px;">KENZO</div>
                    <div style="font-size: 1rem; color: rgba(255,255,255,0.6);">THE MASTER</div>
                </div>
            </div>
        `;

        // Add VS pulse animation
        if (!document.getElementById('vs-pulse-style')) {
            const style = document.createElement('style');
            style.id = 'vs-pulse-style';
            style.textContent = `
                @keyframes vsPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(overlay);

        // Fade out and remove
        setTimeout(() => {
            overlay.style.transition = 'opacity 0.5s ease';
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.remove();
                if (callback) callback();
            }, 500);
        }, 2000);
    }

    /**
     * Show battle result
     */
    showBattleResult(result) {
        const resultElement = document.getElementById('round-result');
        const resultText = document.getElementById('result-text');
        const resultDetail = document.getElementById('result-detail');

        if (!resultElement || !resultText) return;

        // Set text and class
        resultText.classList.remove('player-win', 'kenzo-win', 'tie');

        if (result.roundWinner === 'player') {
            resultText.textContent = 'YOU WIN!';
            resultText.classList.add('player-win');
            resultDetail.textContent = `${result.playerRoundScore} - ${result.kenzoRoundScore}`;
        } else if (result.roundWinner === 'kenzo') {
            resultText.textContent = 'KENZO WINS!';
            resultText.classList.add('kenzo-win');
            resultDetail.textContent = `${result.playerRoundScore} - ${result.kenzoRoundScore}`;
        } else {
            resultText.textContent = "IT'S A TIE!";
            resultText.classList.add('tie');
            resultDetail.textContent = 'No points awarded';
        }

        // Show with animation
        resultElement.classList.remove('hidden');

        // Hide after delay
        return new Promise((resolve) => {
            setTimeout(() => {
                resultElement.classList.add('hidden');
                resolve();
            }, 2000);
        });
    }

    /**
     * Reset HUD to initial state
     */
    reset() {
        this.updateScore(0, 0, false);
        this.updateRound(1);
        this.updatePhase('WAITING');
    }
}
