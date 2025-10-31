// UI Manager
const UIManager = {
    // Show/Hide screens
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    },

    // Show error message
    showError(message, containerId = 'humanError') {
        const errorEl = document.getElementById(containerId);
        errorEl.textContent = message;
        errorEl.classList.add('show');
        
        setTimeout(() => {
            errorEl.classList.remove('show');
        }, CONFIG.ERROR_DISPLAY_TIME);
    },

    // Create grid
    createGrid(containerId, rows = 6) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        for (let i = 0; i < rows; i++) {
            const row = document.createElement('div');
            row.className = 'grid-row';
            
            for (let j = 0; j < CONFIG.WORD_LENGTH; j++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                row.appendChild(cell);
            }
            
            container.appendChild(row);
        }
    },

    // Update grid with current guess
    updateGrid(containerId, guess, row) {
        const cells = document.querySelectorAll(`#${containerId} [data-row="${row}"]`);
        
        for (let i = 0; i < CONFIG.WORD_LENGTH; i++) {
            const cell = cells[i];
            if (i < guess.length) {
                cell.textContent = guess[i].toUpperCase();
                cell.classList.add('filled');
            } else {
                cell.textContent = '';
                cell.classList.remove('filled');
            }
        }
    },

    // Animate and reveal guess
    async revealGuess(containerId, guess, row, evaluation) {
        const cells = document.querySelectorAll(`#${containerId} [data-row="${row}"]`);
        
        // Animate each cell
        for (let i = 0; i < CONFIG.WORD_LENGTH; i++) {
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const cell = cells[i];
            cell.classList.add(evaluation[i]);
            cell.classList.add('bounce');
            
            // Update keyboard
            GameState.updateKeyboardState(guess[i], evaluation[i]);
            KeyboardManager.updateKey(guess[i], evaluation[i]);
            
            setTimeout(() => cell.classList.remove('bounce'), 600);
        }
    },

    // Shake row (invalid word)
    shakeRow(containerId, row) {
        const cells = document.querySelectorAll(`#${containerId} [data-row="${row}"]`);
        cells.forEach(cell => {
            cell.classList.add('shake');
            setTimeout(() => cell.classList.remove('shake'), 500);
        });
    },

    // Show game status
    showGameStatus(statusId, won, word) {
        const status = document.getElementById(statusId);
        const title = status.querySelector('.status-title');
        const wordEl = status.querySelector('.status-word');
        
        status.classList.add('active', won ? 'win' : 'lose');
        title.textContent = won ? '🎉 YOU WIN!' : '😔 GAME OVER';
        wordEl.innerHTML = `The word was: <strong>${word.toUpperCase()}</strong>`;
    },

    // Show AI thinking
    showAIThinking(show = true) {
        const thinking = document.getElementById('aiThinking');
        if (thinking) {
            thinking.classList.toggle('active', show);
        }
    },

    // Update attempts counter
    updateAttempts(elementId, attempts) {
        const el = document.getElementById(elementId);
        if (el) el.textContent = attempts;
    },

    // Show turn indicator
    updateTurnIndicator(isPlayerTurn) {
        const indicator = document.getElementById('turnIndicator');
        if (!indicator) return;
        
        indicator.className = 'turn-indicator ' + (isPlayerTurn ? 'player-turn' : 'bot-turn');
        indicator.innerHTML = isPlayerTurn 
            ? '<i class="fas fa-user"></i> Your Turn'
            : '<i class="fas fa-robot"></i> Bot\'s Turn';
    },

    // Toggle analytics panel
    toggleAnalyticsPanel(panelId) {
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.classList.toggle('active');
        }
    },

    // Toggle neural viz panel
    toggleNeuralPanel() {
        const panel = document.getElementById('neuralVizPanel');
        if (panel) {
            panel.classList.toggle('active');
        }
    },

    // Show achievement unlock
    showAchievementUnlock(achievement) {
        const animation = document.createElement('div');
        animation.className = 'achievement-unlock-animation';
        animation.innerHTML = `
            <div class="achievement-unlock-header">
                <i class="fas fa-trophy"></i>
                <div class="achievement-unlock-title">Achievement Unlocked!</div>
            </div>
            <div class="achievement-unlock-content">
                <div class="achievement-unlock-icon">${achievement.icon}</div>
                <div class="achievement-unlock-info">
                    <h4>${achievement.title}</h4>
                    <p>${achievement.description}</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(animation);
        
        // Remove after animation
        setTimeout(() => {
            animation.remove();
        }, 3500);
    },

    // Update stats display
    updateStatsDisplay(stats) {
        // Global stats on home
        document.getElementById('globalWins').textContent = stats.gamesWon;
        document.getElementById('globalStreak').textContent = stats.currentStreak;
        document.getElementById('globalLevel').textContent = stats.level;
    },

    // Show loading
    showLoading(show = true) {
        const loading = document.getElementById('loadingScreen');
        if (loading) {
            loading.classList.toggle('hidden', !show);
        }
    },

    // Clear grid
    clearGrid(containerId) {
        const cells = document.querySelectorAll(`#${containerId} .grid-cell`);
        cells.forEach(cell => {
            cell.textContent = '';
            cell.className = 'grid-cell';
        });
    }
};

// Export
window.UIManager = UIManager;
