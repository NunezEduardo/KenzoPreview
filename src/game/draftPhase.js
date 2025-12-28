/**
 * Kenzo's Sushi Battlegrounds
 * Draft Phase - Handles the card selection phase before battle
 */

export class DraftPhase {
    constructor(cardSystem, audioManager) {
        this.cardSystem = cardSystem;
        this.audioManager = audioManager;

        this.playerHand = [];
        this.kenzoHand = [];
        this.currentChoices = [];
        this.cardsPerPlayer = 10;
        this.isActive = false;

        // Callbacks
        this.onChoicePresented = null;
        this.onCardSelected = null;
        this.onDraftComplete = null;
    }

    /**
     * Start the draft phase
     */
    start() {
        this.isActive = true;
        this.playerHand = [];
        this.kenzoHand = [];
        this.cardSystem.resetDeck();

        // Play shuffle sound
        this.audioManager.play('cardShuffle');

        // Present first choice after shuffle animation
        setTimeout(() => {
            this.presentNextChoice();
        }, 1000);
    }

    /**
     * Present two cards for player to choose from
     */
    presentNextChoice() {
        if (this.playerHand.length >= this.cardsPerPlayer) {
            this.completeDraft();
            return;
        }

        this.currentChoices = this.cardSystem.getDraftChoice();

        if (this.currentChoices.length < 2) {
            // Not enough cards, complete draft early
            this.completeDraft();
            return;
        }

        // Play card slide sound
        this.audioManager.play('cardSlide1');

        if (this.onChoicePresented) {
            this.onChoicePresented(this.currentChoices, this.cardsPerPlayer - this.playerHand.length);
        }
    }

    /**
     * Player selects a card
     */
    selectCard(cardIndex) {
        if (!this.isActive || this.currentChoices.length < 2) return;

        const selectedCard = this.currentChoices[cardIndex];
        const discardedCard = this.currentChoices[1 - cardIndex];

        // Add to player hand
        this.playerHand.push(selectedCard);

        // Kenzo takes a card from the remaining deck
        this.selectKenzoCard(discardedCard);

        // Play card place sound
        this.audioManager.play('cardPlace1');

        if (this.onCardSelected) {
            this.onCardSelected(selectedCard, this.playerHand.length);
        }

        // Clear current choices
        this.currentChoices = [];

        // Present next choice after short delay
        setTimeout(() => {
            this.presentNextChoice();
        }, 500);
    }

    /**
     * Kenzo's AI selects cards
     */
    selectKenzoCard(discardedByPlayer) {
        // Kenzo considers the discarded card and one from deck
        const deckCard = this.cardSystem.drawCard();

        if (!deckCard) {
            // If no deck card, take the discarded one
            this.kenzoHand.push(discardedByPlayer);
            return;
        }

        // AI logic: prefer higher power cards
        const discardedPower = this.cardSystem.getCardPower(discardedByPlayer);
        const deckPower = this.cardSystem.getCardPower(deckCard);

        if (discardedPower > deckPower) {
            this.kenzoHand.push(discardedByPlayer);
            this.cardSystem.returnToDeck(deckCard);
        } else {
            this.kenzoHand.push(deckCard);
            this.cardSystem.discardCard(discardedByPlayer);
        }
    }

    /**
     * Complete the draft phase
     */
    completeDraft() {
        this.isActive = false;

        // Ensure Kenzo has enough cards
        while (this.kenzoHand.length < this.cardsPerPlayer) {
            const card = this.cardSystem.drawCard();
            if (card) {
                this.kenzoHand.push(card);
            } else {
                break;
            }
        }

        // Play completion sound
        this.audioManager.play('cardFan');

        if (this.onDraftComplete) {
            this.onDraftComplete(this.playerHand, this.kenzoHand);
        }
    }

    /**
     * Get remaining cards to draft
     */
    getRemainingCount() {
        return this.cardsPerPlayer - this.playerHand.length;
    }

    /**
     * Get player's current hand
     */
    getPlayerHand() {
        return [...this.playerHand];
    }

    /**
     * Get Kenzo's hand (for debugging)
     */
    getKenzoHand() {
        return [...this.kenzoHand];
    }
}
