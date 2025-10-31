// VS Bot Mode - Player vs AI with collaborative hints
const VsBotMode = {
    // Initialize VS Bot game
    async init() {
        console.log('🤖 VS Bot Mode initialized');
        
        GameState.init('vsbot');
        AIEngine.resetElimination();
        
        // Create grids
        UIManager.createGrid('playerGrid', CONFIG.MAX_ATTEMPTS_VSBOT);
        UIManager.createGrid('botGrid', CONFIG.MAX_ATTEMPTS_VSBOT);
        
        // Create keyboard
        KeyboardManager.create('vsBotKeyboard', (key) => this.handleKey(key));
        
        // Update UI
        UIManager.updateAttempts('playerAttempts', GameState.vsBotState.playerAttempts);
        UIManager.updateAttempts('botAttempts', GameState.vsBotState.botAttempts);
        UIManager.updateTurnIndicator(true);
        
        // Update scores
        const stats = await StorageManager.getUserStats();
        document.getElementById('playerScore').textContent = stats.vsBotWins || 0;
        document.getElementById('botScore').textContent = stats.vsBotLosses || 0;
        
        // Highlight player section
        document.querySelector('.player-section').classList.add('active');
    },

    // Handle keyboard input
    handleKey(key) {
        if (GameState.gameOver) return;
        if (!GameState.vsBotState.playerTurn) return;

        if (key === 'ENTER') {
            this.submitPlayerGuess();
        } else if (key === 'BACK') {
            GameState.removeLetter();
            UIManager.updateGrid('playerGrid', GameState.currentGuess, GameState.vsBotState.playerRow);
        } else {
            if (GameState.addLetter(key.toLowerCase())) {
                UIManager.updateGrid('playerGrid', GameState.currentGuess, GameState.vsBotState.playerRow);
            }
        }
    },

    // Submit player's guess
    async submitPlayerGuess() {
        const result = GameState.submitPlayerGuess();

        if (!result.success) {
            UIManager.showError(result.error, 'vsBotError');
            UIManager.shakeRow('playerGrid', GameState.vsBotState.playerRow - 1);
            return;
        }

        // Get the guess and evaluate
        const guess = GameState.vsBotState.playerGuesses[GameState.vsBotState.playerGuesses.length - 1];
        const evaluation = GameState.evaluateGuess(guess);

        // Animate reveal
        await UIManager.revealGuess('playerGrid', guess, GameState.vsBotState.playerRow - 1, evaluation);

        // Update AI's knowledge (collaborative hint!)
        AIEngine.updateKnowledge(guess, evaluation);
        this.showCollaborativeHint();

        // Update attempts
        UIManager.updateAttempts('playerAttempts', GameState.vsBotState.playerAttempts);

        // Check if player won
        if (result.won) {
            this.endGame('player');
            return;
        }

        // Check if player ran out of attempts
        if (GameState.vsBotState.playerAttempts === 0) {
            this.switchTurn();
            return;
        }

        // Switch to bot's turn
        setTimeout(() => {
            this.switchTurn();
            this.botTurn();
        }, 1000);
    },

    // Bot's turn
    async botTurn() {
        if (GameState.gameOver) return;
        if (GameState.vsBotState.playerTurn) return;

        // Show thinking
        const botSection = document.querySelector('.bot-section');
        botSection.style.position = 'relative';
        
        const thinking = document.createElement('div');
        thinking.className = 'bot-thinking';
        thinking.innerHTML = `
            <div class="bot-thinking-dots">
                <div class="bot-thinking-dot"></div>
                <div class="bot-thinking-dot"></div>
                <div class="bot-thinking-dot"></div>
            </div>
            <div class="bot-thinking-text">Bot is thinking...</div>
        `;
        botSection.appendChild(thinking);

        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
        thinking.remove();

        // Get AI's guess
        const guess = AIEngine.getNextGuess(GameState.vsBotState.botRow);
        const evaluation = GameState.evaluateGuess(guess);

        // Update bot grid
        UIManager.updateGrid('botGrid', guess, GameState.vsBotState.botRow);
        await new Promise(resolve => setTimeout(resolve, 300));

        // Submit bot guess
        const result = GameState.submitBotGuess(guess);

        // Animate reveal
        await UIManager.revealGuess('botGrid', guess, GameState.vsBotState.botRow - 1, evaluation);

        // Update AI's knowledge
        AIEngine.updateKnowledge(guess, evaluation);

        // Update attempts
        UIManager.updateAttempts('botAttempts', GameState.vsBotState.botAttempts);

        // Check if bot won
        if (result.won) {
            this.endGame('bot');
            return;
        }

        // Check if bot ran out of attempts
        if (GameState.vsBotState.botAttempts === 0 && GameState.vsBotState.playerAttempts === 0) {
            this.endGame('draw');
            return;
        }

        // Switch back to player
        setTimeout(() => {
            this.switchTurn();
        }, 1000);
    },

    // Switch turns
    switchTurn() {
        GameState.vsBotState.playerTurn = !GameState.vsBotState.playerTurn;
        UIManager.updateTurnIndicator(GameState.vsBotState.playerTurn);

        // Highlight active section
        document.querySelector('.player-section').classList.toggle('active', GameState.vsBotState.playerTurn);
        document.querySelector('.bot-section').classList.toggle('active', !GameState.vsBotState.playerTurn);
    },

    // Show collaborative hint
    showCollaborativeHint() {
        const hintContainer = document.querySelector('.collaborative-hint');
        if (hintContainer) hintContainer.remove();

        const knownCorrect = Object.keys(AIEngine.state.knownCorrect).length;
        const knownPresent = AIEngine.state.knownPresent.size;
        const knownAbsent = AIEngine.state.knownAbsent.size;

        if (knownCorrect === 0 && knownPresent === 0 && knownAbsent === 0) return;

        const hint = document.createElement('div');
        hint.className = 'collaborative-hint';
        hint.innerHTML = `
            <strong>Shared Knowledge:</strong> 
            ${knownCorrect > 0 ? `${knownCorrect} correct position(s)` : ''}
            ${knownPresent > 0 ? `${knownPresent} present letter(s)` : ''}
            ${knownAbsent > 0 ? `${knownAbsent} eliminated letter(s)` : ''}
        `;

        const container = document.querySelector('.dual-grid');
        if (container) {
            container.insertAdjacentElement('afterend', hint);
            setTimeout(() => hint.remove(), 4000);
        }
    },

    // End game
    async endGame(winner) {
        GameState.gameOver = true;

        // Update stats
        const stats = await StorageManager.getUserStats();
        
        if (winner === 'player') {
            stats.vsBotWins = (stats.vsBotWins || 0) + 1;
            stats.gamesWon++;
        } else if (winner === 'bot') {
            stats.vsBotLosses = (stats.vsBotLosses || 0) + 1;
        }
        
        stats.gamesPlayed++;
        
        await StorageManager.saveUserStats(stats);

        // Show winner
        const status = document.getElementById('vsBotStatus');
        const title = status.querySelector('.status-title');
        const word = status.querySelector('.status-word');

        status.classList.add('active');
        
        if (winner === 'player') {
            status.classList.add('win');
            title.textContent = '🎉 YOU WIN!';
        } else if (winner === 'bot') {
            status.classList.add('lose');
            title.textContent = '🤖 BOT WINS!';
        } else {
            title.textContent = '🤝 DRAW!';
        }

        word.innerHTML = `The word was: <strong>${GameState.targetWord.toUpperCase()}</strong>`;

        // Check achievements
        const lastGame = {
            mode: 'vsbot',
            won: winner === 'player',
            attempts: GameState.vsBotState.playerRow
        };
        await AchievementsManager.checkAchievements(stats, lastGame);

        // Save game
        await StorageManager.saveGameData(lastGame);
    },

    // Reset game
    reset() {
        document.getElementById('vsBotStatus').classList.remove('active', 'win', 'lose');
        KeyboardManager.resetAll();
        this.init();
    }
};

// Export
window.VsBotMode = VsBotMode;
window.handleVsBotKey = (key) => VsBotMode.handleKey(key);
