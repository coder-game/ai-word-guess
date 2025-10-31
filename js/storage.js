// Storage Manager - handles both localStorage and Firebase
const StorageManager = {
    userId: null,

    init() {
        this.userId = FirebaseHelpers.getUserId();
        console.log('Storage initialized for user:', this.userId);
    },

    // Save game data
    async saveGameData(gameData) {
        const path = `users/${this.userId}/games/${Date.now()}`;
        await FirebaseHelpers.saveData(path, {
            ...gameData,
            timestamp: Date.now()
        });

        // Also save to localStorage as backup
        const localGames = this.getLocalGames();
        localGames.push(gameData);
        if (localGames.length > 100) localGames.shift();
        localStorage.setItem('wordmaster_games', JSON.stringify(localGames));
    },

    // Get user games
    async getUserGames() {
        const path = `users/${this.userId}/games`;
        return await FirebaseHelpers.getData(path) || {};
    },

    // Save AI progress
    async saveAIProgress(aiData) {
        await FirebaseHelpers.updateData(`aiData/global`, {
            ...aiData,
            lastUpdated: Date.now()
        });

        // Local backup
        localStorage.setItem('wordmaster_ai', JSON.stringify(aiData));
    },

    // Get AI progress
    async getAIProgress() {
        const firebaseData = await FirebaseHelpers.getData('aiData/global');
        if (firebaseData) return firebaseData;

        // Fallback to local
        const localData = localStorage.getItem('wordmaster_ai');
        return localData ? JSON.parse(localData) : null;
    },

    // Save user stats
    async saveUserStats(stats) {
        await FirebaseHelpers.updateData(`users/${this.userId}/stats`, {
            ...stats,
            lastUpdated: Date.now()
        });

        localStorage.setItem('wordmaster_stats', JSON.stringify(stats));
    },

    // Get user stats
    async getUserStats() {
        const firebaseStats = await FirebaseHelpers.getData(`users/${this.userId}/stats`);
        if (firebaseStats) return firebaseStats;

        const localStats = localStorage.getItem('wordmaster_stats');
        return localStats ? JSON.parse(localStats) : this.getDefaultStats();
    },

    // Default stats structure
    getDefaultStats() {
        return {
            gamesPlayed: 0,
            gamesWon: 0,
            currentStreak: 0,
            maxStreak: 0,
            totalGuesses: 0,
            guessDistribution: [0, 0, 0, 0, 0, 0],
            vsBotWins: 0,
            vsBotLosses: 0,
            level: 1,
            xp: 0
        };
    },

    // Local games (backup)
    getLocalGames() {
        const games = localStorage.getItem('wordmaster_games');
        return games ? JSON.parse(games) : [];
    },

    // Save achievement
    async saveAchievement(achievementId) {
        const path = `users/${this.userId}/achievements/${achievementId}`;
        await FirebaseHelpers.saveData(path, {
            unlocked: true,
            unlockedAt: Date.now()
        });

        // Local backup
        const achievements = this.getLocalAchievements();
        if (!achievements.includes(achievementId)) {
            achievements.push(achievementId);
            localStorage.setItem('wordmaster_achievements', JSON.stringify(achievements));
        }
    },

    // Get user achievements
    async getUserAchievements() {
        const path = `users/${this.userId}/achievements`;
        const firebaseAchievements = await FirebaseHelpers.getData(path);
        if (firebaseAchievements) return Object.keys(firebaseAchievements);

        return this.getLocalAchievements();
    },

    // Local achievements
    getLocalAchievements() {
        const achievements = localStorage.getItem('wordmaster_achievements');
        return achievements ? JSON.parse(achievements) : [];
    },

    // Update leaderboard
    async updateLeaderboard(score, stats) {
        const path = `leaderboard/${this.userId}`;
        await FirebaseHelpers.saveData(path, {
            score: score,
            wins: stats.gamesWon,
            games: stats.gamesPlayed,
            winRate: ((stats.gamesWon / stats.gamesPlayed) * 100).toFixed(1),
            level: stats.level,
            timestamp: Date.now()
        });
    },

    // Get leaderboard
    async getLeaderboard(limit = 10) {
        const leaderboard = await FirebaseHelpers.getData('leaderboard');
        if (!leaderboard) return [];

        return Object.entries(leaderboard)
            .map(([userId, data]) => ({ userId, ...data }))
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    },

    // Clear all data
    async clearAllData() {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            await FirebaseHelpers.saveData(`users/${this.userId}`, null);
            localStorage.clear();
            location.reload();
        }
    }
};

// Initialize on load
window.StorageManager = StorageManager;
