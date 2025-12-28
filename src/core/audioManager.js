/**
 * Kenzo's Sushi Battlegrounds
 * Audio Manager - Handles all game sounds, music, and voice lines
 */

export class AudioManager {
    constructor() {
        this.sounds = new Map();
        this.music = null;
        this.currentVoice = null;

        // Volume levels (0-1)
        this.musicVolume = 0.7;
        this.sfxVolume = 0.8;
        this.voiceVolume = 0.9;

        // Audio context
        this.audioContext = null;

        // Base paths
        this.basePath = 'Assets/Audio/';
        this.voicesPath = this.basePath + 'Voices/';
        this.backgroundPath = this.basePath + 'Background/';
        this.interfacePath = this.basePath + 'Interface/';
        this.jinglesPath = this.basePath + 'jingles/';
    }

    /**
     * Initialize audio context
     */
    async initialize() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Resume audio context on user interaction (required by browsers)
            document.addEventListener('click', () => {
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }
            }, { once: true });

            // Preload essential sounds
            await this.preloadSounds();

        } catch (error) {
            console.warn('Audio initialization failed:', error);
        }
    }

    /**
     * Sound definitions
     */
    get soundDefinitions() {
        return {
            // Interface sounds
            click: { path: this.interfacePath + 'click_001.ogg', category: 'sfx' },
            select: { path: this.interfacePath + 'select_001.ogg', category: 'sfx' },
            confirm: { path: this.interfacePath + 'confirmation_001.ogg', category: 'sfx' },
            back: { path: this.interfacePath + 'back_001.ogg', category: 'sfx' },
            error: { path: this.interfacePath + 'error_001.ogg', category: 'sfx' },
            open: { path: this.interfacePath + 'open_001.ogg', category: 'sfx' },
            close: { path: this.interfacePath + 'close_001.ogg', category: 'sfx' },
            toggle: { path: this.interfacePath + 'toggle_001.ogg', category: 'sfx' },
            tick: { path: this.interfacePath + 'tick_001.ogg', category: 'sfx' },

            // Card sounds
            cardSlide1: { path: this.backgroundPath + 'card-slide-1.ogg', category: 'sfx' },
            cardSlide2: { path: this.backgroundPath + 'card-slide-2.ogg', category: 'sfx' },
            cardSlide3: { path: this.backgroundPath + 'card-slide-3.ogg', category: 'sfx' },
            cardPlace1: { path: this.backgroundPath + 'card-place-1.ogg', category: 'sfx' },
            cardPlace2: { path: this.backgroundPath + 'card-place-2.ogg', category: 'sfx' },
            cardShuffle: { path: this.backgroundPath + 'card-shuffle.ogg', category: 'sfx' },
            cardFan: { path: this.backgroundPath + 'card-fan-1.ogg', category: 'sfx' },

            // Jingles
            jingleIntro: { path: this.jinglesPath + 'jingles_NES00.ogg', category: 'jingle' },
            jingleWin: { path: this.jinglesPath + 'jingles_NES05.ogg', category: 'jingle' },
            jingleLose: { path: this.jinglesPath + 'jingles_NES03.ogg', category: 'jingle' },
            jingleRound: { path: this.jinglesPath + 'jingles_NES01.ogg', category: 'jingle' },
            jingleSelect: { path: this.jinglesPath + 'jingles_NES02.ogg', category: 'jingle' },

            // Kenzo voice lines
            kenzoChooseCharacter: { path: this.voicesPath + 'Kenzo/choose_your_character.ogg', category: 'voice' },
            kenzoFight: { path: this.voicesPath + 'Kenzo/fight.ogg', category: 'voice' },
            kenzoReady: { path: this.voicesPath + 'Kenzo/ready.ogg', category: 'voice' },
            kenzoBegin: { path: this.voicesPath + 'Kenzo/begin.ogg', category: 'voice' },
            kenzoRound1: { path: this.voicesPath + 'Kenzo/round_1.ogg', category: 'voice' },
            kenzoRound2: { path: this.voicesPath + 'Kenzo/round_2.ogg', category: 'voice' },
            kenzoRound3: { path: this.voicesPath + 'Kenzo/round_3.ogg', category: 'voice' },
            kenzoFinalRound: { path: this.voicesPath + 'Kenzo/final_round.ogg', category: 'voice' },
            kenzoWinner: { path: this.voicesPath + 'Kenzo/winner.ogg', category: 'voice' },
            kenzoLoser: { path: this.voicesPath + 'Kenzo/loser.ogg', category: 'voice' },
            kenzoYouWin: { path: this.voicesPath + 'Kenzo/you_win.ogg', category: 'voice' },
            kenzoYouLose: { path: this.voicesPath + 'Kenzo/you_lose.ogg', category: 'voice' },
            kenzoTie: { path: this.voicesPath + 'Kenzo/tie.ogg', category: 'voice' },
            kenzoFlawlessVictory: { path: this.voicesPath + 'Kenzo/flawless_victory.ogg', category: 'voice' },
            kenzoGameOver: { path: this.voicesPath + 'Kenzo/game_over.ogg', category: 'voice' },
            kenzoPrepare: { path: this.voicesPath + 'Kenzo/prepare_yourself.ogg', category: 'voice' },

            // Male fighter voice lines  
            maleFight: { path: this.voicesPath + 'Male/fight.ogg', category: 'voice' },
            maleReady: { path: this.voicesPath + 'Male/ready.ogg', category: 'voice' },
            maleWinner: { path: this.voicesPath + 'Male/winner.ogg', category: 'voice' },
            maleLoser: { path: this.voicesPath + 'Male/loser.ogg', category: 'voice' },

            // Female fighter voice lines
            femaleFight: { path: this.voicesPath + 'Female - Fighter 4 Only/fight.ogg', category: 'voice' },
            femaleReady: { path: this.voicesPath + 'Female - Fighter 4 Only/ready.ogg', category: 'voice' },
            femaleWinner: { path: this.voicesPath + 'Female - Fighter 4 Only/winner.ogg', category: 'voice' },
            femaleLoser: { path: this.voicesPath + 'Female - Fighter 4 Only/loser.ogg', category: 'voice' }
        };
    }

    /**
     * Preload essential sounds
     */
    async preloadSounds() {
        const essentialSounds = [
            'click', 'select', 'confirm', 'back', 'error',
            'cardSlide1', 'cardPlace1', 'cardShuffle',
            'jingleIntro', 'jingleWin', 'jingleLose',
            'kenzoChooseCharacter', 'kenzoFight', 'kenzoReady'
        ];

        for (const soundId of essentialSounds) {
            const def = this.soundDefinitions[soundId];
            if (def) {
                await this.loadSound(soundId, def.path, def.category);
            }
        }
    }

    /**
     * Load a sound file
     */
    async loadSound(id, path, category = 'sfx') {
        try {
            const audio = new Audio(path);
            audio.preload = 'auto';

            // Set volume based on category
            switch (category) {
                case 'voice':
                    audio.volume = this.voiceVolume;
                    break;
                case 'jingle':
                    audio.volume = this.musicVolume;
                    break;
                default:
                    audio.volume = this.sfxVolume;
            }

            this.sounds.set(id, { audio, category });

            return new Promise((resolve, reject) => {
                audio.addEventListener('canplaythrough', () => resolve(audio), { once: true });
                audio.addEventListener('error', reject, { once: true });
                audio.load();
            });
        } catch (error) {
            console.warn(`Failed to load sound: ${id}`, error);
            return null;
        }
    }

    /**
     * Play a sound effect
     */
    play(soundId) {
        const sound = this.sounds.get(soundId);
        if (sound) {
            // Clone for overlapping sounds
            const clone = sound.audio.cloneNode();
            clone.volume = this.getVolumeForCategory(sound.category);
            clone.play().catch(e => console.warn('Playback failed:', e));
            return clone;
        } else {
            // Try to load and play
            const def = this.soundDefinitions[soundId];
            if (def) {
                this.loadSound(soundId, def.path, def.category).then(() => {
                    this.play(soundId);
                });
            }
        }
        return null;
    }

    /**
     * Play a random card sound
     */
    playCardSound(type = 'slide') {
        const sounds = type === 'slide'
            ? ['cardSlide1', 'cardSlide2', 'cardSlide3']
            : ['cardPlace1', 'cardPlace2'];
        const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
        this.play(randomSound);
    }

    /**
     * Play a voice line (stops current voice if playing)
     */
    playVoice(voiceId) {
        // Stop current voice
        if (this.currentVoice) {
            this.currentVoice.pause();
            this.currentVoice.currentTime = 0;
        }

        const sound = this.sounds.get(voiceId);
        if (sound) {
            sound.audio.volume = this.voiceVolume;
            sound.audio.currentTime = 0;
            sound.audio.play().catch(e => console.warn('Voice playback failed:', e));
            this.currentVoice = sound.audio;
            return sound.audio;
        } else {
            const def = this.soundDefinitions[voiceId];
            if (def) {
                this.loadSound(voiceId, def.path, def.category).then(() => {
                    this.playVoice(voiceId);
                });
            }
        }
        return null;
    }

    /**
     * Play a jingle and return promise when done
     */
    playJingle(jingleId) {
        return new Promise((resolve) => {
            const sound = this.sounds.get(jingleId);
            if (sound) {
                sound.audio.volume = this.musicVolume;
                sound.audio.currentTime = 0;
                sound.audio.addEventListener('ended', resolve, { once: true });
                sound.audio.play().catch(e => {
                    console.warn('Jingle playback failed:', e);
                    resolve();
                });
            } else {
                const def = this.soundDefinitions[jingleId];
                if (def) {
                    this.loadSound(jingleId, def.path, def.category).then(() => {
                        this.playJingle(jingleId).then(resolve);
                    });
                } else {
                    resolve();
                }
            }
        });
    }

    /**
     * Get volume for category
     */
    getVolumeForCategory(category) {
        switch (category) {
            case 'voice': return this.voiceVolume;
            case 'jingle': return this.musicVolume;
            default: return this.sfxVolume;
        }
    }

    /**
     * Set music volume
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        // Update currently playing music if any
        this.sounds.forEach((sound, id) => {
            if (sound.category === 'jingle') {
                sound.audio.volume = this.musicVolume;
            }
        });
    }

    /**
     * Set SFX volume
     */
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }

    /**
     * Set voice volume
     */
    setVoiceVolume(volume) {
        this.voiceVolume = Math.max(0, Math.min(1, volume));
    }

    /**
     * Stop all sounds
     */
    stopAll() {
        this.sounds.forEach(sound => {
            sound.audio.pause();
            sound.audio.currentTime = 0;
        });
        this.currentVoice = null;
    }

    /**
     * Get fighter voice prefix based on character
     */
    getVoicePrefix(characterId) {
        if (characterId === 'fighter4') {
            return 'female';
        }
        if (characterId === 'kenzo') {
            return 'kenzo';
        }
        return 'male';
    }

    /**
     * Play character-specific voice line
     */
    playCharacterVoice(characterId, lineType) {
        const prefix = this.getVoicePrefix(characterId);
        const voiceId = `${prefix}${lineType.charAt(0).toUpperCase() + lineType.slice(1)}`;
        this.playVoice(voiceId);
    }
}
