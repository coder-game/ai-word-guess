// Advanced AI Engine with Elimination Strategy
const AIEngine = {
    // AI State
    state: {
        gamesPlayed: 0,
        wins: 0,
        totalGuesses: 0,
        performanceHistory: [],
        wordScores: {},
        letterFrequency: {},
        
        // Elimination tracking
        knownCorrect: {},      // position -> letter
        knownPresent: new Set(), // letters that exist but wrong position
        knownAbsent: new Set(),  // letters that don't exist
        
        // Real-time probabilities
        currentProbabilities: [],
        lastGuess: null,
        lastEvaluation: null
    },

    // Initialize AI
    async init() {
        console.log('🤖 Initializing AI Engine...');
        
        // Calculate letter frequencies
        this.calculateLetterFrequencies();
        
        // Load saved progress
        const savedProgress = await StorageManager.getAIProgress();
        if (savedProgress) {
            this.state = { ...this.state, ...savedProgress };
            console.log('✅ AI Progress loaded');
        }
        
        // Initialize word scores
        this.initializeWordScores();
    },

    // Calculate letter frequency from word list
    calculateLetterFrequencies() {
        this.state.letterFrequency = {};
        
        CONFIG.WORDS.forEach(word => {
            word.split('').forEach(char => {
                this.state.letterFrequency[char] = (this.state.letterFrequency[char] || 0) + 1;
            });
        });
        
        // Normalize
        const maxFreq = Math.max(...Object.values(this.state.letterFrequency));
        for (let char in this.state.letterFrequency) {
            this.state.letterFrequency[char] /= maxFreq;
        }
    },

    // Initialize word scores
    initializeWordScores() {
        CONFIG.WORDS.forEach(word => {
            if (!this.state.wordScores[word]) {
                this.state.wordScores[word] = 1.0;
            }
        });
    },

    // Reset elimination tracking for new game
    resetElimination() {
        this.state.knownCorrect = {};
        this.state.knownPresent = new Set();
        this.state.knownAbsent = new Set();
        this.state.lastGuess = null;
        this.state.lastEvaluation = null;
    },

    // Update knowledge from guess result
    updateKnowledge(guess, evaluation) {
        this.state.lastGuess = guess;
        this.state.lastEvaluation = evaluation;
        
        for (let i = 0; i < guess.length; i++) {
            const letter = guess[i];
            const result = evaluation[i];
            
            if (result === 'correct') {
                // Letter is in correct position
                this.state.knownCorrect[i] = letter;
                this.state.knownPresent.delete(letter);
            } else if (result === 'present') {
                // Letter exists but wrong position
                this.state.knownPresent.add(letter);
                this.state.knownAbsent.delete(letter);
            } else if (result === 'absent') {
                // Letter doesn't exist (unless it's already known to be present/correct)
                if (!this.state.knownPresent.has(letter) && 
                    !Object.values(this.state.knownCorrect).includes(letter)) {
                    this.state.knownAbsent.add(letter);
                }
            }
        }
        
        console.log('📊 AI Knowledge Updated:');
        console.log('  Correct positions:', this.state.knownCorrect);
        console.log('  Present letters:', Array.from(this.state.knownPresent));
        console.log('  Absent letters:', Array.from(this.state.knownAbsent));
    },

    // Get available words with ADVANCED ELIMINATION
    getAvailableWords() {
        return CONFIG.WORDS.filter(word => {
            // Rule 1: Must have all known correct letters in correct positions
            for (let pos in this.state.knownCorrect) {
                if (word[pos] !== this.state.knownCorrect[pos]) {
                    return false;
                }
            }
            
            // Rule 2: Must contain all known present letters
            for (let letter of this.state.knownPresent) {
                if (!word.includes(letter)) {
                    return false;
                }
            }
            
            // Rule 3: CRITICAL - Must NOT contain any absent letters
            for (let letter of this.state.knownAbsent) {
                if (word.includes(letter)) {
                    return false;
                }
            }
            
            // Rule 4: Known present letters must not be in their previous wrong positions
            if (this.state.lastGuess && this.state.lastEvaluation) {
                for (let i = 0; i < this.state.lastGuess.length; i++) {
                    const letter = this.state.lastGuess[i];
                    if (this.state.lastEvaluation[i] === 'present' && word[i] === letter) {
                        return false; // Can't be in same wrong position
                    }
                }
            }
            
            return true;
        });
    },

    // Calculate word score with advanced heuristics
    calculateWordScore(word) {
        let score = 0;
        const seenLetters = new Set();
        
        // 1. Letter frequency score (unique letters prioritized)
        for (let i = 0; i < word.length; i++) {
            const char = word[i];
            
            if (!seenLetters.has(char)) {
                score += (this.state.letterFrequency[char] || 0.5) * 10;
                seenLetters.add(char);
            }
        }
        
        // 2. Positional bonus (letters in common positions)
        for (let i = 0; i < word.length; i++) {
            score += (3 - Math.abs(2 - i)) * 0.5;
        }
        
        // 3. Learning bonus (from past performance)
        if (this.state.wordScores[word]) {
            score *= this.state.wordScores[word];
        }
        
        // 4. HUGE bonus for maximizing NEW letter information
        const newLettersCount = Array.from(seenLetters).filter(
            letter => !this.state.knownAbsent.has(letter) && 
                     !this.state.knownPresent.has(letter) &&
                     !Object.values(this.state.knownCorrect).includes(letter)
        ).length;
        
        score += newLettersCount * 5; // Big reward for exploring new letters
        
        return score;
    },

    // Get AI's next guess
    getNextGuess(guessNumber) {
        // First guess: use optimal starting word
        if (guessNumber === 0) {
            const starters = ['arose', 'slate', 'crane', 'stare', 'about'];
            return starters[Math.floor(Math.random() * starters.length)];
        }
        
        // Get available words
        const available = this.getAvailableWords();
        
        console.log(`🎯 Available words: ${available.length}`);
        
        if (available.length === 0) {
            console.error('❌ No available words! Fallback to random.');
            return CONFIG.WORDS[Math.floor(Math.random() * CONFIG.WORDS.length)];
        }
        
        if (available.length === 1) {
            return available[0];
        }
        
        // Calculate probabilities for all available words
        const probabilities = available.map(word => ({
            word,
            score: this.calculateWordScore(word)
        }));
        
        // Sort by score
        probabilities.sort((a, b) => b.score - a.score);
        
        // Store for visualization
        this.state.currentProbabilities = probabilities.slice(0, 10);
        
        // Update real-time graphs
        if (typeof AnalyticsManager !== 'undefined') {
            AnalyticsManager.updateProbabilityGraph(this.state.currentProbabilities);
        }
        
        // Choose from top candidates with weighted randomness
        const topCandidates = probabilities.slice(0, 5);
        const totalScore = topCandidates.reduce((sum, item) => sum + item.score, 0);
        
        let random = Math.random() * totalScore;
        for (let candidate of topCandidates) {
            random -= candidate.score;
            if (random <= 0) {
                console.log(`🤖 AI chose: ${candidate.word} (score: ${candidate.score.toFixed(2)})`);
                return candidate.word;
            }
        }
        
        return topCandidates[0].word;
    },

    // Update AI stats after game
    updateStats(won, guesses) {
        this.state.gamesPlayed++;
        if (won) this.state.wins++;
        this.state.totalGuesses += guesses;
        
        // Add to performance history
        this.state.performanceHistory.push({
            game: this.state.gamesPlayed,
            guesses: guesses,
            won: won,
            timestamp: Date.now()
        });
        
        // Keep only last 100 games
        if (this.state.performanceHistory.length > 100) {
            this.state.performanceHistory.shift();
        }
        
        // Update word scores based on performance
        GameState.guesses.forEach(guess => {
            const performance = won ? 1.05 : 0.95;
            this.state.wordScores[guess] = (this.state.wordScores[guess] || 1.0) * performance;
        });
        
        // Save progress
        StorageManager.saveAIProgress(this.state);
        
        // Update analytics
        if (typeof AnalyticsManager !== 'undefined') {
            AnalyticsManager.updateAllGraphs();
        }
    },

    // Get stats for display
    getStats() {
        const winRate = this.state.gamesPlayed > 0 
            ? (this.state.wins / this.state.gamesPlayed * 100).toFixed(1)
            : 0;
        
        const avgGuesses = this.state.gamesPlayed > 0
            ? (this.state.totalGuesses / this.state.gamesPlayed).toFixed(1)
            : 0;
        
        return {
            gamesPlayed: this.state.gamesPlayed,
            wins: this.state.wins,
            winRate: winRate,
            avgGuesses: avgGuesses,
            learningProgress: Math.min(100, this.state.gamesPlayed * 2)
        };
    }
};

// Export
window.AIEngine = AIEngine;
