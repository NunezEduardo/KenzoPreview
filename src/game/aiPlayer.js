/**
 * Kenzo's Sushi Battlegrounds
 * AI Player - Kenzo's strategic AI for card battles
 */

export class AIPlayer {
    constructor(cardSystem) {
        this.cardSystem = cardSystem;
        this.difficulty = 'normal'; // 'easy', 'normal', 'hard'
        this.personality = 'balanced'; // 'aggressive', 'defensive', 'balanced'
    }

    /**
     * Set AI difficulty
     */
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
    }

    /**
     * Analyze player's hand tendency
     */
    analyzePlayerTendency(playerPlayedCards) {
        if (playerPlayedCards.length < 2) return null;

        const typeCounts = { attack: 0, defense: 0, healing: 0 };
        playerPlayedCards.forEach(card => {
            typeCounts[card.type]++;
        });

        // Find dominant type
        let maxType = 'attack';
        let maxCount = 0;
        for (const [type, count] of Object.entries(typeCounts)) {
            if (count > maxCount) {
                maxCount = count;
                maxType = type;
            }
        }

        return maxType;
    }

    /**
     * Get counter type
     */
    getCounterType(type) {
        const counters = {
            attack: 'defense',
            defense: 'healing',
            healing: 'attack'
        };
        return counters[type] || 'attack';
    }

    /**
     * Select cards strategically
     */
    selectCards(hand, count, playerPlayedCards = []) {
        const selected = [];
        const available = [...hand];

        // Analyze player tendency
        const playerTendency = this.analyzePlayerTendency(playerPlayedCards);

        // Strategy based on difficulty
        switch (this.difficulty) {
            case 'easy':
                return this.selectRandomCards(available, count);
            case 'hard':
                return this.selectStrategicCards(available, count, playerTendency);
            default:
                // Normal: 50% strategic, 50% random
                if (Math.random() > 0.5) {
                    return this.selectStrategicCards(available, count, playerTendency);
                }
                return this.selectBalancedCards(available, count);
        }
    }

    /**
     * Select random cards (easy mode)
     */
    selectRandomCards(available, count) {
        const shuffled = [...available].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    /**
     * Select balanced cards (normal mode)
     */
    selectBalancedCards(available, count) {
        const selected = [];

        // Try to pick cards of different types
        const byType = {
            attack: available.filter(c => c.type === 'attack'),
            defense: available.filter(c => c.type === 'defense'),
            healing: available.filter(c => c.type === 'healing')
        };

        // Sort each type by power
        for (const type in byType) {
            byType[type].sort((a, b) => this.cardSystem.getCardPower(b) - this.cardSystem.getCardPower(a));
        }

        // Pick best from each type
        const types = ['attack', 'defense', 'healing'];
        let typeIndex = 0;

        while (selected.length < count) {
            const typeName = types[typeIndex % types.length];
            const typeCards = byType[typeName];

            if (typeCards.length > 0) {
                const card = typeCards.shift();
                if (!selected.find(c => c.id === card.id)) {
                    selected.push(card);
                }
            }

            typeIndex++;

            // Safety check
            if (typeIndex > count * 3) break;
        }

        // Fill remaining with highest power
        if (selected.length < count) {
            const remaining = available
                .filter(c => !selected.find(s => s.id === c.id))
                .sort((a, b) => this.cardSystem.getCardPower(b) - this.cardSystem.getCardPower(a));

            while (selected.length < count && remaining.length > 0) {
                selected.push(remaining.shift());
            }
        }

        return selected;
    }

    /**
     * Select strategic cards (hard mode)
     */
    selectStrategicCards(available, count, playerTendency) {
        const selected = [];

        // Counter player's tendency
        const counterType = playerTendency ? this.getCounterType(playerTendency) : null;

        // Sort by power
        const sorted = [...available].sort((a, b) => {
            // Prioritize counter type
            if (counterType) {
                if (a.type === counterType && b.type !== counterType) return -1;
                if (b.type === counterType && a.type !== counterType) return 1;
            }
            // Then by power
            return this.cardSystem.getCardPower(b) - this.cardSystem.getCardPower(a);
        });

        // Pick top cards
        for (let i = 0; i < count && i < sorted.length; i++) {
            selected.push(sorted[i]);
        }

        return selected;
    }

    /**
     * Evaluate a card's value in current situation
     */
    evaluateCard(card, context = {}) {
        let score = this.cardSystem.getCardPower(card);

        // Bonus for countering opponent
        if (context.opponentType && this.getCounterType(context.opponentType) === card.type) {
            score += 3;
        }

        // Bonus for legendary cards
        if (card.tier === 'legendary') {
            score += 2;
        } else if (card.tier === 'rare') {
            score += 1;
        }

        return score;
    }

    /**
     * Draft phase card selection
     */
    selectDraftCard(choices, ownHand = []) {
        if (choices.length === 0) return null;
        if (choices.length === 1) return 0;

        // Evaluate both choices
        const scores = choices.map((card, index) => {
            let score = this.cardSystem.getCardPower(card);

            // Check hand composition
            const typeCount = ownHand.filter(c => c.type === card.type).length;

            // Penalize if we have too many of same type
            if (typeCount >= 4) {
                score -= 2;
            }

            // Bonus for variety
            if (typeCount === 0) {
                score += 1;
            }

            return { index, score };
        });

        // Sort by score and pick best
        scores.sort((a, b) => b.score - a.score);

        // In easy mode, sometimes pick worse card
        if (this.difficulty === 'easy' && Math.random() < 0.3) {
            return scores[scores.length - 1].index;
        }

        return scores[0].index;
    }

    /**
     * Generate a taunt/emote based on game state
     */
    generateReaction(context) {
        const { isWinning, roundResult, isFlawless } = context;

        if (isFlawless) {
            return { emote: 'emote_faceAngry', voice: 'kenzoLoser' };
        }

        if (roundResult === 'player') {
            // Player won round
            return Math.random() > 0.5
                ? { emote: 'emote_anger', voice: null }
                : { emote: 'emote_swirl', voice: null };
        }

        if (roundResult === 'kenzo') {
            // Kenzo won round
            return Math.random() > 0.5
                ? { emote: 'emote_laugh', voice: null }
                : { emote: 'emote_stars', voice: null };
        }

        // Tie
        return { emote: 'emote_dots3', voice: null };
    }
}
