window.FH = window.FH || {};
var FH = window.FH;
FH.defaultCategories = {
    food: { name: 'Alimentação', icon: '🍽️', color: '#FF6B6B', type: 'expense' },
    housing: { name: 'Moradia', icon: '🏠', color: '#4ECDC4', type: 'expense' },
    transport: { name: 'Transporte', icon: '🚗', color: '#45B7D1', type: 'expense' },
    health: { name: 'Saúde', icon: '🏥', color: '#96CEB4', type: 'expense' },
    leisure: { name: 'Lazer', icon: '🎮', color: '#DDA0DD', type: 'expense' },
    other: { name: 'Outros', icon: '📦', color: '#98D8C8', type: 'expense' },
    salary: { name: 'Salário', icon: '💰', color: '#2ECC71', type: 'income' },
    freelance: { name: 'Freelance', icon: '💻', color: '#3498DB', type: 'income' }
};
FH.escapeHTML = str => {
    const s = String(str || '');
    return s.replace(/[&<>\"]+/g, match => {
        switch (match) {
            case '&': return '&amp;';
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            default: return match;
        }
    });
};
FH.parseMoney = val => {
    if (val == null || val === '') return 0;
    return parseFloat(val.toString().replace(/\./g, '').replace(',', '.')) || 0;
};
FH.formatMoney = val => Number(val || 0).toFixed(2).replace('.', ',');
FH.toLocalDateStr = date => {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
FH.getCategories = () => {
    return Object.keys(FH.allCategories).length > 0
        ? { ...FH.defaultCategories, ...FH.allCategories }
        : FH.defaultCategories;
};
FH.getCategoryById = catId => {
    const cats = FH.getCategories();
    return cats[catId] || { name: catId || 'Outros', icon: '📦', color: '#ccc', type: 'expense' };
};
FH.getAnnualRate = (rate, indexer) => {
    const base = FH.indexers[indexer] || 0;
    return indexer === 'pre' ? rate : (rate / 100) * base;
};
FH.calcProjectedValue = (aportes, rate, indexer, endDate) => {
    const annualRate = FH.getAnnualRate(rate, indexer) / 100;
    const dailyRate = Math.pow(1 + annualRate, 1 / 365) - 1;
    let total = 0;
    const end = endDate ? new Date(endDate) : new Date();
    aportes.forEach(ap => {
        const d = new Date(ap.date + 'T12:00:00');
        const days = Math.max(0, Math.floor((end - d) / 86400000));
        total += ap.value * Math.pow(1 + dailyRate, days);
    });
    return total;
};
FH.calcCurrentValue = (aportes, rate, indexer) => FH.calcProjectedValue(aportes, rate, indexer, new Date());
FH.recalcInvestment = inv => {
    const aportes = inv.aportes || [];
    inv.totalInvested = aportes.reduce((sum, ap) => sum + (ap.value || 0), 0);
    inv.currentValue = FH.calcCurrentValue(aportes, inv.rate || 0, inv.indexer || 'cdi');
    inv.projectedValue = FH.calcProjectedValue(
        aportes,
        inv.rate || 0,
        inv.indexer || 'cdi',
        inv.endDate ? inv.endDate + 'T12:00:00' : new Date(Date.now() + 365 * 86400000)
    );
    return inv;
};
FH.filterByPeriod = arr => {
    const { start, end } = FH.getPeriodRange();
    return arr.filter(t => {
        const value = t.createdAt?.toDate ? t.createdAt.toDate() : new Date((t.createdAt || t.date) + 'T12:00:00');
        return value >= start && value <= end;
    });
};
FH.processRecurring = async () => {
    const now = new Date();
    for (const rec of FH.allRecurring) {
        const lastRun = rec.lastRun ? new Date(rec.lastRun + 'T12:00:00') : new Date(rec.startDate + 'T12:00:00');
        let nextRun = new Date(lastRun);
        while (nextRun <= now) {
            const freqDays = rec.frequency === '7d' ? 7 : rec.frequency === '15d' ? 15 : 30;
            nextRun.setDate(nextRun.getDate() + freqDays);
            const nextRunStr = FH.toLocalDateStr(nextRun);
            if (nextRun <= now) {
                const exists = FH.allTransactions.some(t => {
                    const td = t.createdAt?.toDate ? t.createdAt.toDate() : new Date((t.createdAt || t.date) + 'T12:00:00');
                    return t.description === rec.name && FH.toLocalDateStr(td) === nextRunStr && t.userId === rec.userId;
                });
                if (!exists) {
                    await FH.db.collection('transactions').add({
                        type: rec.type,
                        description: rec.name,
                        amount: rec.value,
                        category: rec.type === 'income' ? 'salary' : 'other',
                        date: nextRunStr,
                        userId: rec.userId,
                        userName: rec.userName,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
                await FH.db.collection('recurring').doc(rec.id).update({ lastRun: nextRunStr });
            }
        }
    }
};
