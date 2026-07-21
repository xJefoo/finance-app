window.FH = window.FH || {};

// Firebase Config
window.FH.firebaseConfig = {
    apiKey: "AIzaSyCm4N4NK18X-ok3Pi7R1f-4tTWdZf7kzec",
    authDomain: "app-damins.firebaseapp.com",
    projectId: "app-damins",
    storageBucket: "app-damins.firebasestorage.app",
    messagingSenderId: "704942561066",
    appId: "1:704942561066:web:55bda959851be7ea917053"
};

// Inicializar Firebase
firebase.initializeApp(window.FH.firebaseConfig);
window.FH.auth = firebase.auth();
window.FH.db = firebase.firestore();
window.FH.provider = new firebase.auth.GoogleAuthProvider();

// Estado Global (DIRETO no FH, sem FH.state)
window.FH.currentUser = null;
window.FH.allTransactions = [];
window.FH.allInvestments = [];
window.FH.allGoals = [];
window.FH.allCategories = {};
window.FH.allRecurring = [];
window.FH.indexers = { cdi: 13.65, selic: 13.75, ipca: 4.20 };
window.FH.currentPeriod = { qty: 30, unit: 'd' };
window.FH.charts = {};
window.FH.editingTransactionId = null;
window.FH.editingInvestmentId = null;
window.FH.editingGoalId = null;
window.FH.editingRecurringId = null;
window.FH.selectedColor = '#FF6B6B';
window.FH.selectedIcon = '📦';

window.FH.defaultCategories = {
    food: { name: 'Alimentação', icon: '🍽️', color: '#FF6B6B', type: 'expense' },
    housing: { name: 'Moradia', icon: '🏠', color: '#4ECDC4', type: 'expense' },
    transport: { name: 'Transporte', icon: '🚗', color: '#45B7D1', type: 'expense' },
    health: { name: 'Saúde', icon: '🏥', color: '#96CEB4', type: 'expense' },
    leisure: { name: 'Lazer', icon: '🎮', color: '#DDA0DD', type: 'expense' },
    other: { name: 'Outros', icon: '📦', color: '#98D8C8', type: 'expense' },
    salary: { name: 'Salário', icon: '💰', color: '#2ECC71', type: 'income' },
    freelance: { name: 'Freelance', icon: '💻', color: '#3498DB', type: 'income' }
};

console.log('✅ Config carregado');