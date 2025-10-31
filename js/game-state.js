// Game State Manager
const GameState = {
    // Current game mode: 'human', 'ai', 'vsbot'
    mode: null,
    
    // Target word
    targetWord: '',
    
    // Current state
    currentRow: 0,
    currentGuess: '',
    guesses: [],
    gameOver: false,
    gameWon: false,
    
    // Keyboard state
    keyboardState: {},
    
    // VS Bot specific
    vsBotState: {
        playerTurn: true,
        playerAttempts: 10,
        botAttempts: 10,
        playerGuesses: [],
        botGuesses: [],
        playerRow: 0,
        botRow: 0,
        playerWon: false,
        botWon: false
    },
    
    // Initialize new game
    init(mode) {
        this.mode = mode;
        this.targetWord = this.getRandomWord();
        this.currentRow = 0;
        this.currentGuess = '';
        this.guesses = [];
        this.gameOver = false;
        this.gameWon = false;
        this.keyboardState = {};
        
        // Reset VS Bot state
        if (mode === 'vsbot') {
            this.vsBotState = {
                playerTurn: true,
                playerAttempts: CONFIG.MAX_ATTEMPTS_VSBOT,
                botAttempts: CONFIG.MAX_ATTEMPTS_VSBOT,
                playerGuesses: [],
                botGuesses: [],
                playerRow: 0,
                botRow: 0,
                playerWon: false,
                botWon: false
            };
        }
        
        console.log('🎮 Game initialized:', this.mode);
        console.log('🎯 Target word:', this.targetWord);
    },
    
    // Get random word
    getRandomWord() {
        return CONFIG.WORDS[Math.floor(Math.random() * CONFIG.WORDS.length)];
    },
    
    // Check if word is valid
    isValidWord(word) {
        return CONFIG.WORDS.includes(word.toLowerCase());
    },
    
    // Add letter to current guess
    addLetter(letter) {
        if (this.currentGuess.length < CONFIG.WORD_LENGTH) {
            this.currentGuess += letter.toLowerCase();
            return true;
        }
        return false;
    },
    
    // Remove last letter
    removeLetter() {
        if (this.currentGuess.length > 0) {
            this.currentGuess = this.currentGuess.slice(0, -1);
            return true;
        }
        return false;
    },
    
    // Submit guess
    submitGuess() {
        if (this.currentGuess.length !== CONFIG.WORD_LENGTH) {
            return { success: false, error: 'Word must be 5 letters' };
        }
        
        if (!this.isValidWord(this.currentGuess)) {
            return { success: false, error: 'Word not in list' };
        }
        
        // Add to guesses
        this.guesses.push(this.currentGuess);
        
        // Check if won
        if (this.currentGuess === this.targetWord) {
            this.gameWon = true;
            this.gameOver = true;
        }
        
        // Check if lost
        const maxAttempts = this.mode === 'vsbot' 
            ? CONFIG.MAX_ATTEMPTS_VSBOT 
            : CONFIG.MAX_ATTEMPTS_SOLO;
            
        if (this.currentRow >= maxAttempts - 1 && !this.gameWon) {
            this.gameOver = true;
        }
        
        // Move to next row
        this.currentRow++;
        this.currentGuess = '';
        
        return { 
            success: true, 
            gameOver: this.gameOver,
            gameWon: this.gameWon
        };
    },
    
    // Evaluate guess (get color feedback)
    evaluateGuess(guess) {
        const result = [];
        const target = this.targetWord;
        const targetLetters = target.split('');
        const guessLetters = guess.split('');
        const letterCount = {};
        
        // Count letters in target
        for (let char of targetLetters) {
            letterCount[char] = (letterCount[char] || 0) + 1;
        }
        
        // First pass: mark correct positions
        for (let i = 0; i < CONFIG.WORD_LENGTH; i++) {
            if (guessLetters[i] === targetLetters[i]) {
                result[i] = 'correct';
                letterCount[guessLetters[i]]--;
            }
        }
        
        // Second pass: mark present and absent
        for (let i = 0; i < CONFIG.WORD_LENGTH; i++) {
            if (result[i] !== 'correct') {
                if (target.includes(guessLetters[i]) && letterCount[guessLetters[i]] > 0) {
                    result[i] = 'present';
                    letterCount[guessLetters[i]]--;
                } else {
                    result[i] = 'absent';
                }
            }
        }
        
        return result;
    },
    
    // Update keyboard state
    updateKeyboardState(letter, state) {
        const priority = { correct: 3, present: 2, absent: 1 };
        const currentState = this.keyboardState[letter];
        
        if (!currentState || priority[state] > priority[currentState]) {
            this.keyboardState[letter] = state;
        }
    },
    
    // VS Bot: Submit player guess
    submitPlayerGuess() {
        if (this.currentGuess.length !== CONFIG.WORD_LENGTH) {
            return { success: false, error: 'Word must be 5 letters' };
        }
        
        if (!this.isValidWord(this.currentGuess)) {
            return { success: false, error: 'Word not in list' };
        }
        
        this.vsBotState.playerGuesses.push(this.currentGuess);
        
        if (this.currentGuess === this.targetWord) {
            this.vsBotState.playerWon = true;
            this.gameOver = true;
        }
        
        this.vsBotState.playerRow++;
        this.vsBotState.playerAttempts--;
        this.vsBotState.playerTurn = false;
        
        this.currentGuess = '';
        
        return { 
            success: true, 
            gameOver: this.gameOver,
            won: this.vsBotState.playerWon
        };
    },
    
    // VS Bot: Submit bot guess
    submitBotGuess(guess) {
        this.vsBotState.botGuesses.push(guess);
        
        if (guess === this.targetWord) {
            this.vsBotState.botWon = true;
            this.gameOver = true;
        }
        
        this.vsBotState.botRow++;
        this.vsBotState.botAttempts--;
        this.vsBotState.playerTurn = true;
        
        return {
            success: true,
            gameOver: this.gameOver,
            won: this.vsBotState.botWon
        };
    },
    
    // Get game summary
    getGameSummary() {
        return {
            mode: this.mode,
            targetWord: this.targetWord,
            won: this.gameWon,
            guesses: this.guesses,
            attempts: this.currentRow,
            timestamp: Date.now()
        };
    },
    
    // Reset game
    reset() {
        this.init(this.mode);
    }
};

// Export
window.GameState = GameState;
