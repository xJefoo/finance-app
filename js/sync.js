window.FH = window.FH || {};
const FH = window.FH;
FH.refreshCurrentView = () => {
    const t = document.querySelector('.tab-content.active');
    if (!t) return;
    switch (t.id) {
        case 'dashboard': FH.loadDashboard(); break;
        case 'investments': FH.loadInvestments(); break;
        case 'goals': FH.loadGoals(); break;
        case 'settings': FH.loadSettingsView(); break;
    }
};
FH.startListeningToFirestore = () => {
    FH.db.collection('transactions').orderBy('createdAt', 'desc').onSnapshot(snap => {
        FH.allTransactions = [];
        snap.forEach(d => FH.allTransactions.push({ id: d.id, ...d.data() }));
        FH.refreshCurrentView();
    });
    FH.db.collection('investments').orderBy('createdAt', 'desc').onSnapshot(snap => {
        FH.allInvestments = [];
        snap.forEach(d => FH.allInvestments.push({ id: d.id, ...d.data() }));
        FH.refreshCurrentView();
    });
    FH.db.collection('goals').orderBy('createdAt', 'desc').onSnapshot(snap => {
        FH.allGoals = [];
        snap.forEach(d => FH.allGoals.push({ id: d.id, ...d.data() }));
        FH.refreshCurrentView();
    });
    FH.db.collection('categories').orderBy('createdAt', 'asc').onSnapshot(snap => {
        FH.allCategories = {};
        snap.forEach(d => {
            const data = d.data();
            if (data.id) {
                FH.allCategories[data.id] = {
                    name: data.name,
                    icon: data.icon || '📦',
                    color: data.color || '#ccc',
                    type: data.type || 'expense',
                    docId: d.id
                };
            }
        });
        FH.updateCategoryDropdown();
        FH.refreshCurrentView();
    });
    FH.db.collection('recurring').orderBy('createdAt', 'asc').onSnapshot(async snap => {
        FH.allRecurring = [];
        snap.forEach(d => FH.allRecurring.push({ id: d.id, ...d.data() }));
        await FH.processRecurring();
        FH.refreshCurrentView();
    });
    FH.db.collection('settings').doc('indexers').onSnapshot(snap => {
        if (snap.exists) FH.indexers = snap.data();
        FH.refreshCurrentView();
    });
};
