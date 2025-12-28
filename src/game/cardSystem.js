/**
 * Kenzo's Sushi Battlegrounds
 * Card System - Card data structures and game logic
 */

export class CardSystem {
    constructor(assetLoader) {
        this.assetLoader = assetLoader;
        this.allCards = [];
        this.deck = [];
        this.discardPile = [];
    }

    /**
     * Initialize the card system with all cards from asset loader
     */
    initialize() {
        this.allCards = this.assetLoader.getAllCards();
        this.resetDeck();
    }

    /**
     * Reset and shuffle the deck
     */
    resetDeck() {
        this.deck = [...this.allCards];
        this.discardPile = [];
        this.shuffleDeck();
    }

    /**
     * Fisher-Yates shuffle
     */
    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    /**
     * Draw a card from the deck
     */
    drawCard() {
        if (this.deck.length === 0) {
            // Reshuffle discard pile if deck is empty
            if (this.discardPile.length > 0) {
                this.deck = [...this.discardPile];
                this.discardPile = [];
                this.shuffleDeck();
            } else {
                return null;
            }
        }
        return this.deck.pop();
    }

    /**
     * Draw multiple cards
     */
    drawCards(count) {
        const cards = [];
        for (let i = 0; i < count; i++) {
            const card = this.drawCard();
            if (card) {
                cards.push(card);
            }
        }
        return cards;
    }

    /**
     * Discard a card
     */
    discardCard(card) {
        this.discardPile.push(card);
    }

    /**
     * Get two random cards for draft choice
     */
    getDraftChoice() {
        const card1 = this.drawCard();
        const card2 = this.drawCard();
        return [card1, card2].filter(c => c !== null);
    }

    /**
     * Return card to deck (when not chosen in draft)
     */
    returnToDeck(card) {
        this.deck.unshift(card);
    }

    /**
     * Compare two cards in battle
     * Returns: 'player', 'kenzo', or 'tie'
     */
    compareCards(playerCard, kenzoCard) {
        // Type advantage table: attack > healing > defense > attack
        const typeAdvantage = {
            attack: 'healing',
            healing: 'defense',
            defense: 'attack'
        };

        const playerType = playerCard.type;
        const kenzoType = kenzoCard.type;

        // Check if types are different - apply rock-paper-scissors
        if (playerType !== kenzoType) {
            // Player has advantage
            if (typeAdvantage[playerType] === kenzoType) {
                // Player wins if stat >= opponent's stat
                const playerStat = this.getPrimaryStat(playerCard);
                const kenzoStat = this.getPrimaryStat(kenzoCard);
                return playerStat >= kenzoStat ? 'player' : 'kenzo';
            }
            // Kenzo has advantage
            if (typeAdvantage[kenzoType] === playerType) {
                const playerStat = this.getPrimaryStat(playerCard);
                const kenzoStat = this.getPrimaryStat(kenzoCard);
                return kenzoStat >= playerStat ? 'kenzo' : 'player';
            }
        }

        // Same type - compare primary stat
        const playerStat = this.getPrimaryStat(playerCard);
        const kenzoStat = this.getPrimaryStat(kenzoCard);

        if (playerStat > kenzoStat) return 'player';
        if (kenzoStat > playerStat) return 'kenzo';
        return 'tie';
    }

    /**
     * Get the primary stat value for a card based on its type
     */
    getPrimaryStat(card) {
        switch (card.type) {
            case 'attack': return card.attack;
            case 'defense': return card.defense;
            case 'healing': return card.healing;
            default: return card.attack;
        }
    }

    /**
     * Get card tier color for UI
     */
    getTierColor(tier) {
        switch (tier) {
            case 'legendary': return '#d4af37';
            case 'rare': return '#4a9eff';
            default: return '#888888';
        }
    }

    /**
     * Get type icon
     */
    getTypeIcon(type) {
        switch (type) {
            case 'attack': return '⚔️';
            case 'defense': return '🛡️';
            case 'healing': return '💚';
            default: return '❓';
        }
    }

    /**
     * Calculate total stat value for a card
     */
    getTotalStats(card) {
        return card.attack + card.defense + card.healing;
    }

    /**
     * Get card power level (for AI evaluation)
     */
    getCardPower(card) {
        const primaryStat = this.getPrimaryStat(card);
        const tierBonus = card.tier === 'legendary' ? 2 : (card.tier === 'rare' ? 1 : 0);
        return primaryStat + tierBonus;
    }
}
