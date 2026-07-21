window.FH = window.FH || {};
var FH = window.FH;
FH.openTransactionModal = tid => {
    FH.state.editingTransactionId = tid;
    document.getElementById('transactionModal')?.classList.add('active');
    FH.updateCategoryDropdown();
    if (tid) {
        const t = FH.allTransactions.find(x => x.id === tid);
        if (t) {
            document.getElementById('transModalTitle').textContent = 'Editar Transação';
            document.getElementById('transType').value = t.type || 'expense';
            document.getElementById('transDescription').value = t.description || '';
            document.getElementById('transAmount').value = FH.formatMoney(t.amount);
            document.getElementById('transDate').value = t.date || FH.toLocalDateStr(t.createdAt?.toDate ? t.createdAt.toDate() : t.createdAt);
            document.getElementById('transEditId').value = tid;
            FH.updateCategoryDropdown();
            setTimeout(() => { if (document.getElementById('transCategory')) document.getElementById('transCategory').value = t.category; }, 100);
        }
    } else {
        document.getElementById('transModalTitle').textContent = 'Nova Transação';
        document.getElementById('transType').value = 'expense';
        document.getElementById('transDescription').value = '';
        document.getElementById('transAmount').value = '';
        document.getElementById('transDate').value = FH.toLocalDateStr(new Date());
        document.getElementById('transEditId').value = '';
        FH.updateCategoryDropdown();
    }
};
FH.closeTransactionModal = () => document.getElementById('transactionModal')?.classList.remove('active');
FH.openGoalModal = gid => {
    FH.state.editingGoalId = gid;
    FH.updateGoalDropdown();
    document.getElementById('goalModal')?.classList.add('active');
    if (gid) {
        const g = FH.allGoals.find(x => x.id === gid);
        if (g) {
            document.getElementById('goalModalTitle').textContent = 'Editar Meta';
            document.getElementById('goalInvestment').value = g.investmentName || '';
            document.getElementById('goalTarget').value = FH.formatMoney(g.target);
            document.getElementById('goalDeadline').value = g.deadline || '';
            document.getElementById('goalEditId').value = gid;
        }
    } else {
        document.getElementById('goalModalTitle').textContent = 'Nova Meta';
        document.getElementById('goalTarget').value = '';
        document.getElementById('goalDeadline').value = '';
        document.getElementById('goalEditId').value = '';
    }
};
FH.closeGoalModal = () => { document.getElementById('goalModal')?.classList.remove('active'); FH.state.editingGoalId = null; };
FH.openInvestmentModal = invId => {
    FH.state.editingInvestmentId = invId;
    document.getElementById('investmentModal')?.classList.add('active');
    if (invId) {
        const inv = FH.allInvestments.find(i => i.id === invId);
        if (inv) {
            document.getElementById('investmentModalTitle').textContent = 'Editar Investimento';
            document.getElementById('invType').value = inv.type || 'CDB';
            document.getElementById('invInstitution').value = inv.institution || '';
            document.getElementById('invName').value = inv.name || '';
            document.getElementById('invRate').value = inv.rate || '';
            document.getElementById('invIndexer').value = inv.indexer || 'cdi';
            document.getElementById('invStartDate').value = inv.startDate || '';
            document.getElementById('invEndDate').value = inv.endDate || '';
            document.getElementById('invInitialValue').value = FH.formatMoney((inv.aportes && inv.aportes.length > 0) ? inv.aportes[0].value : 0);
            document.getElementById('invEditId').value = invId;
        }
    } else {
        document.getElementById('investmentModalTitle').textContent = 'Novo Investimento';
        document.getElementById('invType').value = 'CDB';
        document.getElementById('invInstitution').value = '';
        document.getElementById('invName').value = '';
        document.getElementById('invRate').value = '';
        document.getElementById('invIndexer').value = 'cdi';
        document.getElementById('invStartDate').value = FH.toLocalDateStr(new Date());
        document.getElementById('invEndDate').value = '';
        document.getElementById('invInitialValue').value = '';
        document.getElementById('invEditId').value = '';
    }
};
FH.closeInvestmentModal = () => document.getElementById('investmentModal')?.classList.remove('active');
FH.openCategoryModal = () => {
    document.getElementById('categoryModal')?.classList.add('active');
    document.getElementById('catName').value = '';
    document.getElementById('catType').value = 'expense';
    FH.state.selectedColor = '#FF6B6B';
    FH.state.selectedIcon = '📦';
    document.getElementById('catIconInput').value = '📦';
    FH.updateColorPicker();
    FH.updateIconPicker();
};
FH.closeCategoryModal = () => document.getElementById('categoryModal')?.classList.remove('active');
