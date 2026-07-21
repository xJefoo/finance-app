window.FH = window.FH || {};
var FH = window.FH;
FH.setupGlobalHandlers = () => {
    window.loginWithGoogle = FH.loginWithGoogle;
    window.logout = FH.logout;
    window.showTab = FH.showTab;
    window.applyPeriod = FH.applyPeriod;
    window.selectChip = FH.selectChip;
    window.openTransactionModal = FH.openTransactionModal;
    window.closeTransactionModal = FH.closeTransactionModal;
    window.saveTransaction = FH.saveTransaction;
    window.deleteTransaction = FH.deleteTransaction;
    window.openInvestmentModal = FH.openInvestmentModal;
    window.closeInvestmentModal = FH.closeInvestmentModal;
    window.saveInvestment = FH.saveInvestment;
    window.deleteInvestment = FH.deleteInvestment;
    window.addAporteToInvestment = FH.addAporteToInvestment;
    window.removeAporteFromInvestment = FH.removeAporteFromInvestment;
    window.openGoalModal = FH.openGoalModal;
    window.closeGoalModal = FH.closeGoalModal;
    window.saveGoal = FH.saveGoal;
    window.deleteGoal = FH.deleteGoal;
    window.openCategoryModal = FH.openCategoryModal;
    window.closeCategoryModal = FH.closeCategoryModal;
    window.saveCategory = FH.saveCategory;
    window.deleteCategory = FH.deleteCategory;
    window.startEditRecurring = id => {
        if (FH.startEditRecurring) FH.startEditRecurring(id);
    };
    window.cancelEditRecurring = () => {
        if (FH.cancelEditRecurring) FH.cancelEditRecurring();
    };
    window.saveRecurring = FH.saveRecurring;
    window.deleteRecurring = FH.deleteRecurring;
    window.updateCategoryDropdown = FH.updateCategoryDropdown;
};
FH.setupRecurringButtons = () => {
    document.getElementById('recAddBtn')?.addEventListener('click', FH.saveRecurring);
    document.getElementById('recSaveBtn')?.addEventListener('click', FH.saveRecurring);
    document.getElementById('recCancelBtn')?.addEventListener('click', FH.cancelEditRecurring);
};
FH.initialize = () => {
    FH.setupGlobalHandlers();
    FH.setupCategoryPickers();
    FH.setupPeriodEvents();
    FH.updatePeriodLabel();
    FH.setupAuthListener();
};
document.addEventListener('DOMContentLoaded', () => FH.initialize());
