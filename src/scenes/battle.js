/**
 * Kenzo's Sushi Battlegrounds
 * Battle Scene - Main gameplay scene with 3D environment
 */

import { CardSystem } from '../game/cardSystem.js';
import { DraftPhase } from '../game/draftPhase.js';
import { BattleSystem } from '../game/battleSystem.js';
import { AIPlayer } from '../game/aiPlayer.js';
import { CardUI } from '../ui/cardUI.js';
import { HUD } from '../ui/hud.js';
import { EmoteSystem } from '../ui/emotes.js';
import { RestaurantScene } from './restaurantScene.js';

export class BattleScene {
    constructor(engine, assetLoader, audioManager) {
        this.engine = engine;
        this.assetLoader = assetLoader;
        this.audioManager = audioManager;

        // Game systems
        this.cardSystem = new CardSystem(assetLoader);
        this.draftPhase = new DraftPhase(this.cardSystem, audioManager);
        this.battleSystem = new BattleSystem(this.cardSystem, audioManager);
        this.aiPlayer = new AIPlayer(this.cardSystem);

        // 3D Restaurant Scene
        this.restaurantScene = new RestaurantScene(engine, assetLoader);

        // UI - Pass assetLoader to CardUI for 3D model loading
        this.cardUI = new CardUI(engine.scene, this.cardSystem, assetLoader);
        this.hud = new HUD(audioManager);
        this.emoteSystem = new EmoteSystem(audioManager);

        // State
        this.selectedCharacter = null;
        this.isActive = false;
        this.currentPhase = 'draft'; // 'draft', 'battle', 'result'
        this.sceneBuilt = false;

        // Callbacks
        this.onGameEnd = null;
    }

    /**
     * Initialize the battle scene
     */
    async initialize() {
        this.cardSystem.initialize();
        this.hud.initialize();
        this.emoteSystem.initialize();

        // Build the 3D restaurant environment
        await this.restaurantScene.build();
        this.sceneBuilt = true;

        // Setup callbacks
        this.setupDraftCallbacks();
        this.setupBattleCallbacks();
        this.setupUICallbacks();
    }

    /**
     * Setup draft phase callbacks
     */
    setupDraftCallbacks() {
        this.draftPhase.onChoicePresented = (choices, remaining) => {
            this.showDraftChoices(choices, remaining);
        };

        this.draftPhase.onCardSelected = (card, total) => {
            this.audioManager.play('cardPlace1');
            document.getElementById('cards-remaining').textContent = 10 - total;
        };

        this.draftPhase.onDraftComplete = (playerHand, kenzoHand) => {
            this.startBattlePhase(playerHand, kenzoHand);
        };
    }

    /**
     * Setup battle system callbacks
     */
    setupBattleCallbacks() {
        this.battleSystem.onRoundStart = (round) => {
            this.hud.updateRound(round);
            this.hud.showRoundAnnouncement(round);
        };

        this.battleSystem.onCardSelected = (card, count) => {
            this.updateSelectedCardsDisplay();
        };

        this.battleSystem.onBattleReady = (playerCards, kenzoCards) => {
            this.showBattleCards(playerCards, kenzoCards);
        };

        this.battleSystem.onBattleResult = async (result) => {
            await this.showBattleResult(result);
        };

        this.battleSystem.onRoundEnd = (nextRound) => {
            this.resetForNextRound();
        };

        this.battleSystem.onGameEnd = (result) => {
            this.showGameResult(result);
        };
    }

    /**
     * Setup UI callbacks
     */
    setupUICallbacks() {
        const btnBattle = document.getElementById('btn-battle');
        btnBattle?.addEventListener('click', () => {
            if (this.battleSystem.canBattle()) {
                this.executeBattle();
            }
        });
    }

    /**
     * Start the battle scene
     */
    async start(selectedCharacter) {
        this.selectedCharacter = selectedCharacter;

        // Hide character select, show game
        document.getElementById('character-select')?.classList.remove('active');
        document.getElementById('game-screen')?.classList.add('active');

        // Start render loop
        this.engine.startRenderLoop();

        this.isActive = true;

        // Setup 3D characters in the restaurant
        await this.restaurantScene.setupBattleCharacters(selectedCharacter.id);

        // Animate camera to battle position
        await this.engine.animateCameraTo(
            new BABYLON.Vector3(0, 1, 0),  // target
            8,                              // radius
            Math.PI / 2,                    // alpha
            Math.PI / 3,                    // beta
            1500                            // duration
        );

        // Set player info in HUD
        this.hud.setPlayerInfo(selectedCharacter.name);
        this.hud.reset();

        // Show VS splash then start draft
        this.hud.showVSSplash(selectedCharacter.name, () => {
            this.startDraftPhase();
        });

        // Kenzo emote
        this.emoteSystem.triggerAIEmote({ event: 'game_start' });
    }

    /**
     * Start the draft phase
     */
    startDraftPhase() {
        this.currentPhase = 'draft';
        this.hud.updatePhase('DRAFT PHASE');

        // Show draft UI
        document.getElementById('draft-ui')?.classList.remove('hidden');
        document.getElementById('battle-ui')?.classList.add('hidden');
        document.getElementById('player-hand')?.classList.add('hidden');

        // Start draft
        this.draftPhase.start();
    }

    /**
     * Show draft card choices with 3D models
     */
    showDraftChoices(choices, remaining) {
        const container = document.getElementById('draft-choices');
        if (!container) return;

        // Clean up previous card previews
        this.cardUI.dispose();
        container.innerHTML = '';

        choices.forEach((card, index) => {
            const cardElement = this.cardUI.createCardElement(card, () => {
                this.draftPhase.selectCard(index);
            });
            cardElement.classList.add('fade-in');
            container.appendChild(cardElement);
        });

        document.getElementById('cards-remaining').textContent = remaining;
    }

    /**
     * Start battle phase
     */
    startBattlePhase(playerHand, kenzoHand) {
        this.currentPhase = 'battle';
        this.hud.updatePhase('SELECT CARDS');

        // Clean up draft card previews
        this.cardUI.dispose();

        // Hide draft UI, show battle UI
        document.getElementById('draft-ui')?.classList.add('hidden');
        document.getElementById('battle-ui')?.classList.remove('hidden');
        document.getElementById('player-hand')?.classList.remove('hidden');

        // Initialize battle
        this.battleSystem.initialize(playerHand, kenzoHand);

        // Show player hand
        this.renderPlayerHand();

        // Announce ready
        this.audioManager.playVoice('kenzoReady');

        // Kenzo reaction
        this.restaurantScene.playCharacterReaction('kenzo', 'ready');
    }

    /**
     * Render player's hand with 3D card models
     */
    renderPlayerHand() {
        const handContainer = document.getElementById('player-hand');
        if (!handContainer) return;

        // Dispose previous card previews for hand
        handContainer.innerHTML = '';

        const state = this.battleSystem.getState();
        state.playerHand.forEach((card, index) => {
            // Use simple cards in hand for performance
            const cardElement = this.cardUI.createSimpleCardElement(card, () => {
                this.selectCardForBattle(index);
            });

            // Mark as selected if in selection
            if (state.playerSelectedCards.find(c => c.id === card.id)) {
                cardElement.classList.add('selected');
            }

            handContainer.appendChild(cardElement);
        });
    }

    /**
     * Select a card for battle
     */
    selectCardForBattle(cardIndex) {
        if (this.battleSystem.selectPlayerCard(cardIndex)) {
            this.audioManager.play('cardPlace1');
            this.renderPlayerHand();
            this.updateSelectedCardsDisplay();

            // Enable battle button if ready
            if (this.battleSystem.canBattle()) {
                document.getElementById('btn-battle').disabled = false;
            }

            // Player character reaction
            this.restaurantScene.playCharacterReaction(this.selectedCharacter.id, 'select');
        }
    }

    /**
     * Update selected cards display in battle slots
     */
    updateSelectedCardsDisplay() {
        const playerSlot = document.getElementById('player-slot-cards');
        if (!playerSlot) return;

        playerSlot.innerHTML = '';

        const state = this.battleSystem.getState();
        state.playerSelectedCards.forEach(card => {
            const miniCard = this.cardUI.createSimpleCardElement(card);
            miniCard.style.transform = 'scale(0.7)';
            playerSlot.appendChild(miniCard);
        });
    }

    /**
     * Show battle cards (both player and Kenzo)
     */
    showBattleCards(playerCards, kenzoCards) {
        const kenzoSlot = document.getElementById('opponent-slot-cards');
        if (!kenzoSlot) return;

        // Initially show card backs
        kenzoSlot.innerHTML = '';
        kenzoCards.forEach(() => {
            const cardBack = document.createElement('div');
            cardBack.className = 'game-card card-back';
            cardBack.style.cssText = `
                background: linear-gradient(135deg, #c41e3a 0%, #8b1528 100%);
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 3rem;
            `;
            cardBack.textContent = '🍣';
            kenzoSlot.appendChild(cardBack);
        });

        // Enable battle button
        document.getElementById('btn-battle').disabled = false;
    }

    /**
     * Execute the battle
     */
    async executeBattle() {
        this.hud.updatePhase('BATTLE!');
        this.audioManager.playVoice('kenzoBegin');
        document.getElementById('btn-battle').disabled = true;

        // Character attack animations
        this.restaurantScene.playCharacterReaction(this.selectedCharacter.id, 'attack');
        this.restaurantScene.playCharacterReaction('kenzo', 'attack');

        // Reveal Kenzo's cards
        const kenzoSlot = document.getElementById('opponent-slot-cards');
        const state = this.battleSystem.getState();

        kenzoSlot.innerHTML = '';
        state.kenzoSelectedCards.forEach(card => {
            const cardElement = this.cardUI.createSimpleCardElement(card);
            cardElement.style.transform = 'scale(0.7)';
            cardElement.classList.add('fade-in');
            kenzoSlot.appendChild(cardElement);
        });

        // Wait for reveal animation
        await new Promise(r => setTimeout(r, 1000));

        // Execute battle logic
        const result = this.battleSystem.executeBattle();

        if (result) {
            await this.showBattleResult(result);
        }
    }

    /**
     * Show battle result
     */
    async showBattleResult(result) {
        this.hud.updateScore(result.totalPlayerScore, result.totalKenzoScore);

        // Character reactions based on result
        if (result.roundWinner === 'player') {
            this.restaurantScene.playCharacterReaction(this.selectedCharacter.id, 'victory');
            this.restaurantScene.playCharacterReaction('kenzo', 'defeat');
        } else if (result.roundWinner === 'kenzo') {
            this.restaurantScene.playCharacterReaction('kenzo', 'victory');
            this.restaurantScene.playCharacterReaction(this.selectedCharacter.id, 'defeat');
        }

        // Show result overlay
        await this.hud.showBattleResult(result);

        // Kenzo emote
        if (result.roundWinner === 'kenzo') {
            this.emoteSystem.triggerAIEmote({ event: 'round_win' });
        } else if (result.roundWinner === 'player') {
            this.emoteSystem.triggerAIEmote({ event: 'round_lose' });
        } else {
            this.emoteSystem.triggerAIEmote({ event: 'tie' });
        }

        // Wait then end round
        await new Promise(r => setTimeout(r, 1500));
        this.battleSystem.endRound();
    }

    /**
     * Reset for next round
     */
    resetForNextRound() {
        this.hud.updatePhase('SELECT CARDS');

        // Clear battle slots
        document.getElementById('player-slot-cards').innerHTML = '';
        document.getElementById('opponent-slot-cards').innerHTML = '';

        // Re-render hand
        this.renderPlayerHand();

        // Reset battle button
        document.getElementById('btn-battle').disabled = true;
    }

    /**
     * Show game result
     */
    showGameResult(result) {
        this.currentPhase = 'result';
        this.isActive = false;

        // Final character reactions
        if (result.winner === 'player') {
            this.restaurantScene.playCharacterReaction(this.selectedCharacter.id, 'victory');
            this.restaurantScene.playCharacterReaction('kenzo', 'defeat');
        } else {
            this.restaurantScene.playCharacterReaction('kenzo', 'victory');
            this.restaurantScene.playCharacterReaction(this.selectedCharacter.id, 'defeat');
        }

        // Hide game screen, show result
        document.getElementById('game-screen')?.classList.remove('active');
        document.getElementById('result-screen')?.classList.add('active');

        // Update result display
        const titleElement = document.getElementById('final-result-title');
        const scoreElement = document.getElementById('final-score');

        if (result.winner === 'player') {
            titleElement.textContent = 'VICTORY!';
            titleElement.className = 'result-title victory';
            this.audioManager.playJingle('jingleWin');
            this.emoteSystem.triggerAIEmote({ event: 'game_lose' });
        } else if (result.winner === 'kenzo') {
            titleElement.textContent = 'DEFEAT';
            titleElement.className = 'result-title defeat';
            this.audioManager.playJingle('jingleLose');
            this.emoteSystem.triggerAIEmote({ event: 'game_win' });
        } else {
            titleElement.textContent = 'DRAW';
            titleElement.className = 'result-title';
        }

        scoreElement.textContent = `${result.playerScore} - ${result.kenzoScore}`;

        // Setup result buttons
        this.setupResultButtons();
    }

    /**
     * Setup result screen buttons
     */
    setupResultButtons() {
        const btnRematch = document.getElementById('btn-rematch');
        const btnMenu = document.getElementById('btn-menu');

        btnRematch?.addEventListener('click', () => {
            this.audioManager.play('confirm');
            document.getElementById('result-screen')?.classList.remove('active');
            this.start(this.selectedCharacter);
        }, { once: true });

        btnMenu?.addEventListener('click', () => {
            this.audioManager.play('back');
            this.returnToMenu();
        }, { once: true });
    }

    /**
     * Return to main menu
     */
    returnToMenu() {
        document.getElementById('result-screen')?.classList.remove('active');
        document.getElementById('game-screen')?.classList.remove('active');
        document.getElementById('main-menu')?.classList.add('active');

        this.engine.stopRenderLoop();

        // Clean up card previews
        this.cardUI.dispose();

        if (this.onGameEnd) {
            this.onGameEnd();
        }
    }

    /**
     * Hide the battle scene
     */
    hide() {
        document.getElementById('game-screen')?.classList.remove('active');
        this.isActive = false;
    }
}
