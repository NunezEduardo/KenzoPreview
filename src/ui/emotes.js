/**
 * Kenzo's Sushi Battlegrounds  
 * Emotes - Player and AI emote system
 */

export class EmoteSystem {
    constructor(audioManager) {
        this.audioManager = audioManager;
        this.emotePath = 'Assets/Interface/emote/';
        this.currentEmote = null;
        this.emoteTimeout = null;
        this.cooldown = false;
        this.cooldownTime = 2000; // 2 seconds between emotes
    }

    /**
     * Available emotes
     */
    get emotes() {
        return [
            { id: 'emote_faceHappy', name: 'Happy' },
            { id: 'emote_faceSad', name: 'Sad' },
            { id: 'emote_faceAngry', name: 'Angry' },
            { id: 'emote_heart', name: 'Love' },
            { id: 'emote_hearts', name: 'Hearts' },
            { id: 'emote_heartBroken', name: 'Heartbroken' },
            { id: 'emote_idea', name: 'Idea' },
            { id: 'emote_question', name: 'Question' },
            { id: 'emote_exclamation', name: 'Surprise' },
            { id: 'emote_laugh', name: 'Laugh' },
            { id: 'emote_anger', name: 'Anger' },
            { id: 'emote_star', name: 'Star' },
            { id: 'emote_stars', name: 'Stars' },
            { id: 'emote_dots1', name: 'Thinking 1' },
            { id: 'emote_dots2', name: 'Thinking 2' },
            { id: 'emote_dots3', name: 'Thinking 3' },
            { id: 'emote_sleep', name: 'Sleep' },
            { id: 'emote_sleeps', name: 'Sleepy' },
            { id: 'emote_music', name: 'Music' },
            { id: 'emote_swirl', name: 'Confused' },
            { id: 'emote_drop', name: 'Sweat' },
            { id: 'emote_drops', name: 'Nervous' },
            { id: 'emote_cloud', name: 'Dreaming' },
            { id: 'emote_alert', name: 'Alert' },
            { id: 'emote_cash', name: 'Cash' },
            { id: 'emote_cross', name: 'No' },
            { id: 'emote_circle', name: 'Yes' }
        ];
    }

    /**
     * Initialize the emote panel
     */
    initialize() {
        const toggle = document.getElementById('emote-toggle');
        const grid = document.getElementById('emote-grid');

        if (!toggle || !grid) return;

        // Create emote buttons
        this.emotes.forEach(emote => {
            const btn = document.createElement('button');
            btn.className = 'emote-btn';
            btn.title = emote.name;
            btn.innerHTML = `<img src="${this.emotePath}${emote.id}.png" alt="${emote.name}">`;
            btn.addEventListener('click', () => this.showEmote(emote.id, 'player'));
            grid.appendChild(btn);
        });

        // Toggle panel
        toggle.addEventListener('click', () => {
            grid.classList.toggle('hidden');
            this.audioManager.play('click');
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.emote-panel')) {
                grid.classList.add('hidden');
            }
        });
    }

    /**
     * Show an emote
     */
    showEmote(emoteId, sender = 'player') {
        if (this.cooldown && sender === 'player') {
            return;
        }

        // Clear previous emote
        if (this.emoteTimeout) {
            clearTimeout(this.emoteTimeout);
        }

        const displayedEmote = document.getElementById('displayed-emote');
        const emoteImage = document.getElementById('emote-image');

        if (!displayedEmote || !emoteImage) return;

        // Set position based on sender
        if (sender === 'kenzo') {
            displayedEmote.style.right = 'auto';
            displayedEmote.style.left = '100px';
        } else {
            displayedEmote.style.left = 'auto';
            displayedEmote.style.right = '100px';
        }

        // Set image and show
        emoteImage.src = `${this.emotePath}${emoteId}.png`;
        displayedEmote.classList.remove('hidden');

        // Play sound
        this.audioManager.play('select');

        // Close panel
        document.getElementById('emote-grid')?.classList.add('hidden');

        // Start cooldown for player
        if (sender === 'player') {
            this.cooldown = true;
            setTimeout(() => {
                this.cooldown = false;
            }, this.cooldownTime);
        }

        // Hide emote after animation
        this.emoteTimeout = setTimeout(() => {
            displayedEmote.classList.add('hidden');
        }, 2000);
    }

    /**
     * AI trigger emote based on game state
     */
    triggerAIEmote(context) {
        const { event, isWinning, roundResult } = context;

        let emoteId;

        switch (event) {
            case 'round_win':
                emoteId = this.pickRandom(['emote_laugh', 'emote_stars', 'emote_faceHappy']);
                break;
            case 'round_lose':
                emoteId = this.pickRandom(['emote_anger', 'emote_faceAngry', 'emote_swirl']);
                break;
            case 'tie':
                emoteId = this.pickRandom(['emote_dots3', 'emote_question']);
                break;
            case 'game_start':
                emoteId = this.pickRandom(['emote_exclamation', 'emote_alert']);
                break;
            case 'game_win':
                emoteId = this.pickRandom(['emote_laugh', 'emote_stars', 'emote_cash']);
                break;
            case 'game_lose':
                emoteId = this.pickRandom(['emote_faceAngry', 'emote_heartBroken']);
                break;
            case 'thinking':
                emoteId = this.pickRandom(['emote_dots1', 'emote_dots2', 'emote_dots3']);
                break;
            default:
                emoteId = 'emote_dots3';
        }

        // Random delay for natural feeling
        const delay = Math.random() * 500 + 300;
        setTimeout(() => {
            this.showEmote(emoteId, 'kenzo');
        }, delay);
    }

    /**
     * Pick random from array
     */
    pickRandom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    /**
     * Get random emote
     */
    getRandomEmote() {
        return this.emotes[Math.floor(Math.random() * this.emotes.length)].id;
    }
}
