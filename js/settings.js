window.FH = window.FH || {};
const FH = window.FH;
FH.loadSettingsView = () => {
    document.getElementById('indexersContainer')?.insertAdjacentHTML('afterbegin', '');
    const indexersContainer = document.getElementById('indexersContainer');
    if (indexersContainer) {
        indexersContainer.innerHTML = `
            <div class="indexer-row"><label>CDI</label><input type="number" id="idxCdi" value="${FH.indexers.cdi || 13.65}" step="0.01"> <span>% a.a.</span> <button class="btn-sm btn-save" onclick="saveIndexer('cdi')">💾</button></div>
            <div class="indexer-row"><label>Selic</label><input type="number" id="idxSelic" value="${FH.indexers.selic || 13.75}" step="0.01"> <span>% a.a.</span> <button class="btn-sm btn-save" onclick="saveIndexer('selic')">💾</button></div>
            <div class="indexer-row"><label>IPCA</label><input type="number" id="idxIpca" value="${FH.indexers.ipca || 4.20}" step="0.01"> <span>% a.a.</span> <button class="btn-sm btn-save" onclick="saveIndexer('ipca')">💾</button></div>
        `;
    }
    const recurringContainer = document.getElementById('recurringContainer');
    if (recurringContainer) {
        recurringContainer.innerHTML = FH.allRecurring.map(r => {
            const own = r.userId === FH.currentUser?.id;
            return `
                <div class="recurring-row">
                    <span style="flex:1;font-size:11px;"><strong>${FH.escapeHTML(r.name)}</strong> - R$ ${Number(r.value || 0).toFixed(2)} - ${r.type === 'income' ? 'Receita' : 'Despesa'} - a cada ${r.frequency === '7d' ? '7 dias' : r.frequency === '15d' ? '15 dias' : '1 mês'} - desde ${new Date((r.startDate || '') + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                    ${own ? `<button class="btn-sm btn-edit" onclick="startEditRecurring('${FH.escapeHTML(r.id)}')">✏️</button><button class="btn-sm btn-delete" onclick="deleteRecurring('${FH.escapeHTML(r.id)}')">🗑️</button>` : '<span class="user-tag">👤 ' + FH.escapeHTML(r.userName || 'Outro') + '</span>'}
                </div>`;
        }).join('') || '<p style="font-size:11px;color:var(--text-light);">Nenhuma recorrência.</p>';
    }
    const cats = FH.getCategories();
    const defIds = Object.keys(FH.defaultCategories);
    let html = '';
    const custom = Object.entries(cats).filter(([id]) => !defIds.includes(id));
    const def = Object.entries(cats).filter(([id]) => defIds.includes(id));
    if (custom.length > 0) {
        html += '<h4 style="margin-bottom:4px;">✨ Personalizadas</h4><div class="category-pills" style="margin-bottom:10px;">';
        custom.forEach(([id, cat]) => {
            html += `<div class="category-pill"><span class="color-dot" style="background:${FH.escapeHTML(cat.color)}"></span>${FH.escapeHTML(cat.icon)} ${FH.escapeHTML(cat.name)} <button onclick="deleteCategory('${FH.escapeHTML(id)}')" style="background:none;border:none;font-size:10px;">🗑️</button></div>`;
        });
        html += '</div>';
    }
    html += '<h4 style="margin-bottom:4px;">📋 Padrão</h4><div class="category-pills">';
    def.forEach(([id, cat]) => {
        html += `<div class="category-pill"><span class="color-dot" style="background:${FH.escapeHTML(cat.color)}"></span>${FH.escapeHTML(cat.icon)} ${FH.escapeHTML(cat.name)}</div>`;
    });
    html += '</div>';
    document.getElementById('categoryPills')?.insertAdjacentHTML('afterbegin', html);
};
FH.saveIndexer = async type => {
    const input = document.getElementById(`idx${type.charAt(0).toUpperCase() + type.slice(1)}`);
    if (!input) return;
    const val = parseFloat(input.value);
    if (!val || val <= 0) return;
    FH.indexers[type] = val;
    try {
        await FH.db.collection('settings').doc('indexers').set(FH.indexers);
    } catch (e) {
        alert('Erro');
    }
};
FH.saveCategory = async () => {
    if (!FH.currentUser) return;
    const name = document.getElementById('catName')?.value.trim();
    const type = document.getElementById('catType')?.value || 'expense';
    const icon = document.getElementById('catIconInput')?.value || '📦';
    if (!name) { alert('Digite um nome'); return; }
    const catId = name.toLowerCase().normalize('NFD').replace(/[-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    try {
        await FH.db.collection('categories').add({
            id: catId,
            name,
            type,
            color: FH.state.selectedColor,
            icon,
            createdBy: FH.currentUser.id,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        FH.closeCategoryModal();
    } catch (e) {
        alert('Erro');
    }
};
FH.deleteCategory = async catId => {
    if (!confirm('Excluir?')) return;
    try {
        const snapshot = await FH.db.collection('categories').where('id', '==', catId).get();
        snapshot.forEach(doc => doc.ref.delete());
    } catch (e) {}
};
FH.startEditRecurring = rid => {
    const rec = FH.allRecurring.find(r => r.id === rid);
    if (!rec) return;
    FH.state.editingRecurringId = rid;
    document.getElementById('recName').value = rec.name || '';
    document.getElementById('recValue').value = FH.formatMoney(rec.value);
    document.getElementById('recDate').value = rec.startDate || '';
    document.getElementById('recFreq').value = rec.frequency || '1m';
    document.getElementById('recType').value = rec.type || 'income';
    document.getElementById('recAddBtn')?.style.display = 'none';
    document.getElementById('recSaveBtn')?.style.display = 'inline';
    document.getElementById('recCancelBtn')?.style.display = 'inline';
};
FH.cancelEditRecurring = () => {
    FH.state.editingRecurringId = null;
    document.getElementById('recName').value = '';
    document.getElementById('recValue').value = '';
    document.getElementById('recDate').value = '';
    document.getElementById('recFreq').value = '1m';
    document.getElementById('recType').value = 'income';
    document.getElementById('recAddBtn')?.style.display = 'inline';
    document.getElementById('recSaveBtn')?.style.display = 'none';
    document.getElementById('recCancelBtn')?.style.display = 'none';
};
FH.saveRecurring = async () => {
    if (!FH.currentUser) return;
    const name = document.getElementById('recName')?.value.trim() || '';
    const value = FH.parseMoney(document.getElementById('recValue')?.value);
    const date = document.getElementById('recDate')?.value;
    const frequency = document.getElementById('recFreq')?.value || '1m';
    const type = document.getElementById('recType')?.value || 'income';
    if (!name || !value || value <= 0 || !date) { alert('Preencha'); return; }
    try {
        if (FH.state.editingRecurringId) {
            await FH.db.collection('recurring').doc(FH.state.editingRecurringId).update({
                name,
                value,
                startDate: date,
                lastRun: date,
                frequency,
                type,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            await FH.db.collection('recurring').add({
                name,
                value,
                startDate: date,
                lastRun: date,
                frequency,
                type,
                userId: FH.currentUser.id,
                userName: FH.currentUser.name,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        FH.cancelEditRecurring();
    } catch (e) {
        alert('Erro');
    }
};
FH.deleteRecurring = async id => {
    if (!confirm('Excluir?')) return;
    try {
        await FH.db.collection('recurring').doc(id).delete();
    } catch (e) {}
};
FH.updateColorPicker = () => {
    document.querySelectorAll('#colorPicker .color-option').forEach(el => {
        el.classList.toggle('selected', el.dataset.color === FH.state.selectedColor);
    });
};
FH.updateIconPicker = () => {
    document.querySelectorAll('#iconPicker .icon-option').forEach(el => {
        el.classList.toggle('selected', el.dataset.icon === FH.state.selectedIcon);
    });
};
FH.setupCategoryPickers = () => {
    document.getElementById('colorPicker')?.addEventListener('click', e => {
        if (e.target.classList.contains('color-option')) {
            FH.state.selectedColor = e.target.dataset.color;
            FH.updateColorPicker();
        }
    });
    document.getElementById('iconPicker')?.addEventListener('click', e => {
        if (e.target.classList.contains('icon-option')) {
            FH.state.selectedIcon = e.target.dataset.icon;
            document.getElementById('catIconInput').value = FH.state.selectedIcon;
            FH.updateIconPicker();
        }
    });
    document.getElementById('catIconInput')?.addEventListener('input', e => {
        FH.state.selectedIcon = e.target.value || '📦';
        FH.updateIconPicker();
    });
};
