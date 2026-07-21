window.FH = window.FH || {};
const FH = window.FH;
FH.updateCategoryDropdown = () => {
    const select = document.getElementById('transCategory');
    if (!select) return;
    const type = document.getElementById('transType')?.value || 'expense';
    const cats = FH.getCategories();
    const options = Object.entries(cats)
        .filter(([, c]) => c.type === type)
        .map(([id, c]) => `<option value="${FH.escapeHTML(id)}">${FH.escapeHTML(c.icon)} ${FH.escapeHTML(c.name)}</option>`);
    select.innerHTML = options.join('') || '<option value="other">📦 Outros</option>';
};
FH.saveTransaction = async () => {
    if (!FH.currentUser) return;
    const type = document.getElementById('transType')?.value || 'expense';
    const desc = document.getElementById('transDescription')?.value.trim() || '';
    const amt = FH.parseMoney(document.getElementById('transAmount')?.value);
    const cat = document.getElementById('transCategory')?.value || 'other';
    const date = document.getElementById('transDate')?.value || FH.toLocalDateStr(new Date());
    if (!desc || !amt || amt <= 0) { alert('Preencha'); return; }
    try {
        if (FH.state.editingTransactionId) {
            await FH.db.collection('transactions').doc(FH.state.editingTransactionId).update({
                type,
                description: desc,
                amount: amt,
                category: cat,
                date,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            await FH.db.collection('transactions').add({
                type,
                description: desc,
                amount: amt,
                category: cat,
                date,
                userId: FH.currentUser.id,
                userName: FH.currentUser.name,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        FH.closeTransactionModal();
    } catch (e) {
        alert('Erro');
    }
};
FH.deleteTransaction = async id => {
    if (!confirm('Excluir?')) return;
    try {
        await FH.db.collection('transactions').doc(id).delete();
    } catch (e) {}
};
