// Main Application Controller
const App = {
    // Initialize application
    async init() {
        console.log('🎮 Word Master Pro - Initializing...');
        
        UIManager.showLoading(true);
        
        try {
            // Initialize all managers
            StorageManager.init();
            await AIEngine.init();
            await AchievementsManager.init();
            
            // Load user stats
            const stats = await StorageManager.getUserStats();
            UIManager.updateStatsDisplay(stats);
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize analytics
            AnalyticsManager.init();
            
            // Initialize neural network
            await NeuralNetworkViz.init();
            
            console.log('✅ Application initialized successfully');
            
        } catch (error) {
            console.error('❌ Initialization error:', error);
        } finally {
            UIManager.showLoading(false);
        }
    },

    // Setup event listeners
    setupEventListeners() {
        // Home screen buttons
        document.querySelectorAll('.home-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                this.startGame(mode);
            });
        });

        // Back buttons
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', () => this.goHome());
        });

        // Play again buttons
        document.querySelectorAll('.play-again-btn').forEach(btn => {
            btn.addEventListener('click', () => this.resetGame());
        });

        // Analytics toggle buttons
        document.querySelectorAll('.analytics-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = GameState.mode;
                if (mode === 'ai') {
                    UIManager.toggleNeuralPanel();
                    AnalyticsManager.updateAllGraphs();
                } else {
                    const panelId = mode + 'Analytics';
                    UIManager.toggleAnalyticsPanel(panelId);
                }
            });
        });

        // Achievements button
        const achievementsBtn = document.getElementById('achievementsBtn');
        if (achievementsBtn) {
            achievementsBtn.addEventListener('click', () => this.showAchievements());
        }

        // Modal close
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.modal').classList.remove('active');
            });
        });

        // Close modal on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    },

    // Start game
    async startGame(mode) {
        console.log('🎮 Starting game mode:', mode);
        
        GameState.init(mode);
        
        if (mode === 'human') {
            this.startHumanGame();
        } else if (mode === 'ai') {
            this.startAIGame();
        } else if (mode === 'vsbot') {
            this.startVsBotGame();
        }
        
        // Show appropriate screen
        UIManager.showScreen(mode + 'Screen');
    },

    // Human game mode
    startHumanGame() {
        UIManager.createGrid('humanGrid', CONFIG.MAX_ATTEMPTS_SOLO);
        KeyboardManager.create('humanKeyboard', (key) => this.handleHumanKey(key));
        UIManager.updateAttempts('humanAttempts', CONFIG.MAX_ATTEMPTS_SOLO);
    },

    // Handle human key press
    handleHumanKey(key) {
        if (GameState.gameOver) return;

        if (key === 'ENTER') {
            this.submitHumanGuess();
        } else if (key === 'BACK') {
            GameState.removeLetter();
            UIManager.updateGrid('humanGrid', GameState.currentGuess, GameState.currentRow);
        } else {
            if (GameState.addLetter(key.toLowerCase())) {
                UIManager.updateGrid('humanGrid', GameState.currentGuess, GameState.currentRow);
            }
        }
    },

    // Submit human guess
    async submitHumanGuess() {
        const result = GameState.submitGuess();

        if (!result.success) {
            UIManager.showError(result.error, 'humanError');
            UIManager.shakeRow('humanGrid', GameState.currentRow - 1);
            return;
        }

        // Get the guess and evaluate
        const guess = GameState.guesses[GameState.guesses.length - 1];
        const evaluation = GameState.evaluateGuess(guess);

        // Animate reveal
        await UIManager.revealGuess('humanGrid', guess, GameState.currentRow - 1, evaluation);

        // Update attempts
        const remaining = CONFIG.MAX_ATTEMPTS_SOLO - GameState.currentRow;
        UIManager.updateAttempts('humanAttempts', remaining);

        // Check game over
        if (result.gameOver) {
            await this.endHumanGame(result.gameWon);
        }
    },

    // End human game
    async endHumanGame(won) {
        UIManager.showGameStatus('humanStatus', won, GameState.targetWord);

        // Update stats
        const stats = await StorageManager.getUserStats();
        stats.gamesPlayed++;
        
        if (won) {
            stats.gamesWon++;
            stats.currentStreak++;
            stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
            stats.guessDistribution[GameState.currentRow - 1]++;
        } else {
            stats.currentStreak = 0;
        }
        
        stats.totalGuesses += GameState.currentRow;
        
        await StorageManager.saveUserStats(stats);
        UIManager.updateStatsDisplay(stats);

        // Check achievements
        const lastGame = {
            mode: 'human',
            won: won,
            attempts: GameState.currentRow
        };
        await AchievementsManager.checkAchievements(stats, lastGame);

        // Save game
        await StorageManager.saveGameData(GameState.getGameSummary());
    },

    // AI game mode
    async startAIGame() {
        UIManager.createGrid('aiGrid', CONFIG.MAX_ATTEMPTS_SOLO);
        AIEngine.resetElimination();
        AnalyticsManager.startRealTimeUpdates();
        
        // Start AI playing
        setTimeout(() => this.playAITurn(), 1000);
    },

    // AI plays a turn
    async playAITurn() {
        if (GameState.gameOver) return;

        UIManager.showAIThinking(true);
        
        await new Promise(resolve => setTimeout(resolve, CONFIG.AI_THINK_TIME + Math.random() * 1000));

        // Get AI's guess
        const guess = AIEngine.getNextGuess(GameState.currentRow);
        GameState.currentGuess = guess;
        
        UIManager.updateGrid('aiGrid', guess, GameState.currentRow);
        UIManager.showAIThinking(false);

        await new Promise(resolve => setTimeout(resolve, 500));

        // Submit guess
        const result = GameState.submitGuess();
        const evaluation = GameState.evaluateGuess(guess);

        // Update AI knowledge
        AIEngine.updateKnowledge(guess, evaluation);

        // Animate
        await UIManager.revealGuess('aiGrid', guess, GameState.currentRow - 1, evaluation);

        // Activate neural network
        const inputData = new Array(26).fill(0);
        guess.split('').forEach((char, idx) => {
            inputData[char.charCodeAt(0) - 97] = 1;
        });
        NeuralNetworkViz.activate(inputData);

        // Update analytics in real-time
        AnalyticsManager.updateProbabilityGraph();
        AnalyticsManager.updateStatsDisplay();

        // Check game over
        if (result.gameOver) {
            AnalyticsManager.stopRealTimeUpdates();
            await this.endAIGame(result.gameWon);
        } else {
            setTimeout(() => this.playAITurn(), 1000);
        }
    },

    // End AI game
    async endAIGame(won) {
        UIManager.showGameStatus('aiStatus', won, GameState.targetWord);

        // Update AI stats
        AIEngine.updateStats(won, GameState.currentRow);
        AnalyticsManager.updateAllGraphs();
        AnalyticsManager.updateStatsDisplay();

        // Train neural network
        await NeuralNetworkViz.train(AIEngine.state.performanceHistory);
    },

    // VS Bot game mode
    async startVsBotGame() {
        await VsBotMode.init();
    },

    // Reset current game
    resetGame() {
        const mode = GameState.mode;
        
        // Clear status
        const statusId = mode + 'Status';
        document.getElementById(statusId).classList.remove('active', 'win', 'lose');
        
        // Reset keyboard
        KeyboardManager.resetAll();
        
        // Start new game
        this.startGame(mode);
    },

    // Go back to home
    goHome() {
        // Stop any ongoing processes
        AnalyticsManager.stopRealTimeUpdates();
        
        // Clear grids
        ['humanGrid', 'aiGrid', 'playerGrid', 'botGrid'].forEach(id => {
            UIManager.clearGrid(id);
        });
        
        // Show home screen
        UIManager.showScreen('homeScreen');
    },

    // Show achievements modal
    showAchievements() {
        AchievementsManager.renderAchievements();
        document.getElementById('achievementsModal').classList.add('active');
    }
};

// Global keyboard handler
window.handleHumanKey = (key) => App.handleHumanKey(key);

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}

// Export
window.App = App;
