window.FH = window.FH || {};
var FH = window.FH;

FH.checkUserAuthorization = async uid => {
    try {
        const userDoc = await FH.db.collection('users').doc(uid).get();
        return userDoc.exists && userDoc.data().allowed === true;
    } catch (e) {
        return false;
    }
};

FH.showLoading = visible => {
    document.getElementById('loadingOverlay')?.classList.toggle('hidden', !visible);
};

FH.showTab = tn => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    const te = document.getElementById(tn);
    if (te) te.classList.add('active');
    const tm = { dashboard: 0, investments: 1, goals: 2, settings: 3 };
    const bt = document.querySelectorAll('.nav-tab');
    if (bt[tm[tn]]) bt[tm[tn]].classList.add('active');
    switch (tn) {
        case 'dashboard': FH.loadDashboard(); break;
        case 'investments': FH.loadInvestments(); break;
        case 'goals': FH.loadGoals(); break;
        case 'settings': FH.loadSettingsView(); break;
    }
};

FH.enterApp = () => {
    const b = document.getElementById('userBadge');
    if (FH.currentUser?.avatar?.startsWith('http')) {
        b.innerHTML = `<img src="${FH.currentUser.avatar}" style="width:22px;height:22px;border-radius:50%;"> ${FH.currentUser.name}`;
    } else {
        b.textContent = '👤 ' + (FH.currentUser?.name || 'Usuário');
    }
    document.getElementById('loginScreen')?.classList.add('hidden');
    document.getElementById('mainApp')?.classList.add('active');
    document.getElementById('loginError')?.classList.remove('show');
    FH.updateCategoryDropdown();
    FH.updatePeriodLabel();
    FH.setupPeriodEvents();
    FH.showTab('dashboard');
};

FH.loginWithGoogle = async () => {
    const le = document.getElementById('loginError');
    le?.classList.remove('show');
    try {
        FH.showLoading(true);
        const result = await FH.auth.signInWithPopup(FH.provider);
        if (!await FH.checkUserAuthorization(result.user.uid)) {
            await FH.auth.signOut();
            le?.classList.add('show');
            FH.showLoading(false);
            return;
        }
        FH.currentUser = {
            id: result.user.uid,
            name: result.user.displayName || result.user.email.split('@')[0],
            avatar: result.user.photoURL || null,
            email: result.user.email
        };
        FH.startListeningToFirestore();
        FH.enterApp();
        FH.showLoading(false);
    } catch (e) {
        if (e.code !== 'auth/popup-closed-by-user') alert('Erro: ' + e.message);
        FH.showLoading(false);
    }
};

FH.logout = async () => {
    if (!confirm('Sair?')) return;
    try {
        await FH.auth.signOut();
    } catch (e) {}
    FH.currentUser = null;
    FH.allTransactions = [];
    FH.allInvestments = [];
    FH.allGoals = [];
    FH.allCategories = {};
    FH.allRecurring = [];
    document.getElementById('mainApp')?.classList.remove('active');
    document.getElementById('loginScreen')?.classList.remove('hidden');
};

FH.setupAuthListener = () => {
    FH.auth.onAuthStateChanged(async u => {
        if (u) {
            FH.showLoading(true);
            if (!await FH.checkUserAuthorization(u.uid)) {
                await FH.auth.signOut();
                document.getElementById('loginError')?.classList.add('show');
                FH.showLoading(false);
                return;
            }
            FH.currentUser = {
                id: u.uid,
                name: u.displayName || u.email.split('@')[0],
                avatar: u.photoURL || null,
                email: u.email
            };
            FH.startListeningToFirestore();
            FH.enterApp();
            FH.showLoading(false);
        } else {
            FH.currentUser = null;
            FH.allTransactions = [];
            FH.allInvestments = [];
            FH.allGoals = [];
            FH.allCategories = {};
            FH.allRecurring = [];
            document.getElementById('mainApp')?.classList.remove('active');
            document.getElementById('loginScreen')?.classList.remove('hidden');
            FH.showLoading(false);
        }
    });
};