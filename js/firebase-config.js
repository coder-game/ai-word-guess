// Firebase Configuration
// Replace these values with your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyDQugAaucGe4UtYdjrZDeNBzdrXosQVUQ8",
  authDomain: "rating-system-c7adc.firebaseapp.com",
  projectId: "rating-system-c7adc",
  storageBucket: "rating-system-c7adc.firebasestorage.app",
  messagingSenderId: "876647083847",
  appId: "1:876647083847:web:11cac4f4c52a2f9babe662",
  measurementId: "G-S5VR126WCL"
};

// Initialize Firebase
let firebaseApp, database;

try {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    console.log('✅ Firebase initialized successfully');
} catch (error) {
    console.error('❌ Firebase initialization error:', error);
}

// Database References
const DB_REFS = {
    users: () => database.ref('users'),
    aiData: () => database.ref('aiData'),
    leaderboard: () => database.ref('leaderboard'),
    achievements: () => database.ref('achievements'),
    games: () => database.ref('games')
};

// Helper Functions
const FirebaseHelpers = {
    // Get user ID (generate if doesn't exist)
    getUserId() {
        let userId = localStorage.getItem('wordmaster_userId');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('wordmaster_userId', userId);
        }
        return userId;
    },

    // Save data to Firebase
    async saveData(path, data) {
        try {
            await database.ref(path).set(data);
            return true;
        } catch (error) {
            console.error('Error saving to Firebase:', error);
            return false;
        }
    },

    // Get data from Firebase
    async getData(path) {
        try {
            const snapshot = await database.ref(path).once('value');
            return snapshot.val();
        } catch (error) {
            console.error('Error getting from Firebase:', error);
            return null;
        }
    },

    // Update data in Firebase
    async updateData(path, updates) {
        try {
            await database.ref(path).update(updates);
            return true;
        } catch (error) {
            console.error('Error updating Firebase:', error);
            return false;
        }
    },

    // Listen to data changes
    onDataChange(path, callback) {
        database.ref(path).on('value', (snapshot) => {
            callback(snapshot.val());
        });
    },

    // Remove listener
    offDataChange(path) {
        database.ref(path).off();
    }
};

// Export
window.FirebaseHelpers = FirebaseHelpers;
window.DB_REFS = DB_REFS;
