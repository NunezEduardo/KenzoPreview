/**
 * Kenzo's Sushi Battlegrounds
 * Battle System - Core battle mechanics and round management
 */

export class BattleSystem {
    constructor(cardSystem, audioManager) {
        this.cardSystem = cardSystem;
        this.audioManager = audioManager;

        // Game state
        this.playerHand = [];
        this.kenzoHand = [];
        this.playerScore = 0;
        this.kenzoScore = 0;
        this.currentRound = 1;
        this.cardsPerRound = 2;
        this.maxPossibleRounds = 5; // 10 cards / 2 per round

        // Selected cards for current round
        this.playerSelectedCards = [];
        this.kenzoSelectedCards = [];

        // Battle state
        this.isActive = false;
        this.phase = 'selection'; // 'selection', 'battle', 'result', 'gameover'

        // Callbacks
        this.onRoundStart = null;
        this.onCardSelected = null;
        this.onBattleReady = null;
        this.onBattleResult = null;
        this.onRoundEnd = null;
        this.onGameEnd = null;
    }

    /**
     * Initialize battle with hands from draft
     */
    initialize(playerHand, kenzoHand) {
        this.playerHand = [...playerHand];
        this.kenzoHand = [...kenzoHand];
        this.playerScore = 0;
        this.kenzoScore = 0;
        this.currentRound = 1;
        this.playerSelectedCards = [];
        this.kenzoSelectedCards = [];
        this.isActive = true;
        this.phase = 'selection';

        // Play round announcement
        this.announceRound();
    }

    /**
     * Announce current round
     */
    announceRound() {
        const roundVoices = ['kenzoRound1', 'kenzoRound2', 'kenzoRound3', 'kenzoFinalRound', 'kenzoFinalRound'];
        const voiceIndex = Math.min(this.currentRound - 1, roundVoices.length - 1);

        if (this.currentRound >= this.maxPossibleRounds) {
            this.audioManager.playVoice('kenzoFinalRound');
        } else {
            this.audioManager.playVoice(roundVoices[voiceIndex]);
        }

        if (this.onRoundStart) {
            this.onRoundStart(this.currentRound);
        }
    }

    /**
     * Player selects a card for battle
     */
    selectPlayerCard(cardIndex) {
        if (this.phase !== 'selection') return false;
        if (this.playerSelectedCards.length >= this.cardsPerRound) return false;
        if (cardIndex < 0 || cardIndex >= this.playerHand.length) return false;

        const card = this.playerHand[cardIndex];

        // Check if already selected
        if (this.playerSelectedCards.find(c => c.id === card.id)) return false;

        this.playerSelectedCards.push(card);

        // Play select sound
        this.audioManager.play('cardPlace1');

        if (this.onCardSelected) {
            this.onCardSelected(card, this.playerSelectedCards.length);
        }

        // Check if ready for battle
        if (this.playerSelectedCards.length >= this.cardsPerRound) {
            this.prepareKenzoSelection();
        }

        return true;
    }

    /**
     * Deselect a player card
     */
    deselectPlayerCard(cardIndex) {
        if (this.phase !== 'selection') return false;

        const card = this.playerSelectedCards[cardIndex];
        if (!card) return false;

        this.playerSelectedCards.splice(cardIndex, 1);
        this.audioManager.play('cardSlide1');

        return true;
    }

    /**
     * Kenzo AI selects cards
     */
    prepareKenzoSelection() {
        // Kenzo's AI strategy
        this.kenzoSelectedCards = this.selectKenzoCards();

        this.phase = 'battle';

        if (this.onBattleReady) {
            this.onBattleReady(this.playerSelectedCards, this.kenzoSelectedCards);
        }
    }

    /**
     * Kenzo's card selection AI
     */
    selectKenzoCards() {
        const selected = [];
        const available = [...this.kenzoHand];

        // Simple strategy: pick highest power cards
        available.sort((a, b) => this.cardSystem.getCardPower(b) - this.cardSystem.getCardPower(a));

        for (let i = 0; i < this.cardsPerRound && i < available.length; i++) {
            selected.push(available[i]);
        }

        return selected;
    }

    /**
     * Execute the battle
     */
    executeBattle() {
        if (this.phase !== 'battle') return null;

        this.phase = 'result';

        const results = [];
        let playerRoundScore = 0;
        let kenzoRoundScore = 0;

        // Compare each pair of cards
        for (let i = 0; i < this.cardsPerRound; i++) {
            const playerCard = this.playerSelectedCards[i];
            const kenzoCard = this.kenzoSelectedCards[i];

            if (!playerCard || !kenzoCard) continue;

            const result = this.cardSystem.compareCards(playerCard, kenzoCard);

            results.push({
                playerCard,
                kenzoCard,
                winner: result
            });

            if (result === 'player') {
                playerRoundScore++;
            } else if (result === 'kenzo') {
                kenzoRoundScore++;
            }
        }

        // Determine round winner
        let roundWinner = 'tie';
        if (playerRoundScore > kenzoRoundScore) {
            roundWinner = 'player';
            this.playerScore++;
            this.audioManager.playVoice('kenzoWinner'); // Announces player won
        } else if (kenzoRoundScore > playerRoundScore) {
            roundWinner = 'kenzo';
            this.kenzoScore++;
            this.audioManager.playVoice('kenzoLoser'); // Kenzo taunts
        } else {
            this.audioManager.playVoice('kenzoTie');
        }

        // Play result jingle
        if (roundWinner === 'player') {
            this.audioManager.playJingle('jingleWin');
        } else if (roundWinner === 'kenzo') {
            this.audioManager.playJingle('jingleLose');
        }

        const battleResult = {
            comparisons: results,
            playerRoundScore,
            kenzoRoundScore,
            roundWinner,
            totalPlayerScore: this.playerScore,
            totalKenzoScore: this.kenzoScore
        };

        if (this.onBattleResult) {
            this.onBattleResult(battleResult);
        }

        return battleResult;
    }

    /**
     * End the current round and setup next
     */
    endRound() {
        // Remove used cards from hands
        this.playerSelectedCards.forEach(card => {
            const idx = this.playerHand.findIndex(c => c.id === card.id);
            if (idx !== -1) this.playerHand.splice(idx, 1);
        });

        this.kenzoSelectedCards.forEach(card => {
            const idx = this.kenzoHand.findIndex(c => c.id === card.id);
            if (idx !== -1) this.kenzoHand.splice(idx, 1);
        });

        // Clear selections
        this.playerSelectedCards = [];
        this.kenzoSelectedCards = [];

        // Check for game end
        if (this.checkGameEnd()) {
            return;
        }

        // Next round
        this.currentRound++;
        this.phase = 'selection';

        if (this.onRoundEnd) {
            this.onRoundEnd(this.currentRound);
        }

        // Announce next round
        this.announceRound();
    }

    /**
     * Check if game should end (irreversible advantage or no cards)
     */
    checkGameEnd() {
        const remainingRounds = Math.floor(this.playerHand.length / this.cardsPerRound);
        const scoreDiff = Math.abs(this.playerScore - this.kenzoScore);

        // No more cards
        if (this.playerHand.length < this.cardsPerRound ||
            this.kenzoHand.length < this.cardsPerRound) {
            this.endGame();
            return true;
        }

        // Irreversible advantage: score difference > remaining rounds
        if (scoreDiff > remainingRounds) {
            this.endGame();
            return true;
        }

        return false;
    }

    /**
     * End the game
     */
    endGame() {
        this.isActive = false;
        this.phase = 'gameover';

        let winner;
        if (this.playerScore > this.kenzoScore) {
            winner = 'player';
            this.audioManager.playVoice('kenzoYouWin');
        } else if (this.kenzoScore > this.playerScore) {
            winner = 'kenzo';
            this.audioManager.playVoice('kenzoYouLose');
        } else {
            winner = 'tie';
            this.audioManager.playVoice('kenzoTie');
        }

        // Check for flawless victory
        if (winner === 'player' && this.kenzoScore === 0) {
            this.audioManager.playVoice('kenzoFlawlessVictory');
        }

        if (this.onGameEnd) {
            this.onGameEnd({
                winner,
                playerScore: this.playerScore,
                kenzoScore: this.kenzoScore,
                isFlawless: (winner === 'player' && this.kenzoScore === 0) ||
                    (winner === 'kenzo' && this.playerScore === 0)
            });
        }
    }

    /**
     * Get current game state
     */
    getState() {
        return {
            playerHand: [...this.playerHand],
            kenzoHand: [...this.kenzoHand],
            playerScore: this.playerScore,
            kenzoScore: this.kenzoScore,
            currentRound: this.currentRound,
            phase: this.phase,
            playerSelectedCards: [...this.playerSelectedCards],
            kenzoSelectedCards: [...this.kenzoSelectedCards]
        };
    }

    /**
     * Check if player can select more cards
     */
    canSelectMore() {
        return this.phase === 'selection' &&
            this.playerSelectedCards.length < this.cardsPerRound;
    }

    /**
     * Check if battle can be executed
     */
    canBattle() {
        return this.phase === 'battle';
    }
}
