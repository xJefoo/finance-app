window.FH = window.FH || {};
const FH = window.FH;
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
FH.saveInvestment = async () => {
    if (!FH.currentUser) return;
    const type = document.getElementById('invType')?.value || 'CDB';
    const institution = document.getElementById('invInstitution')?.value.trim() || '';
    const name = document.getElementById('invName')?.value.trim() || '';
    const rate = parseFloat(document.getElementById('invRate')?.value) || 0;
    const indexer = document.getElementById('invIndexer')?.value || 'cdi';
    const startDate = document.getElementById('invStartDate')?.value || FH.toLocalDateStr(new Date());
    let endDate = document.getElementById('invEndDate')?.value;
    if (!endDate) {
        const sd = new Date(startDate + 'T12:00:00');
        sd.setFullYear(sd.getFullYear() + 1);
        endDate = FH.toLocalDateStr(sd);
    }
    const initialValue = FH.parseMoney(document.getElementById('invInitialValue')?.value);
    if (!name || !initialValue || initialValue <= 0) { alert('Preencha'); return; }
    const aportes = [{ value: initialValue, date: startDate }];
    const currentValue = FH.calcCurrentValue(aportes, rate, indexer);
    const projectedValue = FH.calcProjectedValue(aportes, rate, indexer, endDate + 'T12:00:00');
    const invData = {
        type,
        institution,
        name,
        rate,
        indexer,
        startDate,
        endDate,
        aportes,
        totalInvested: initialValue,
        currentValue,
        projectedValue,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    try {
        if (FH.state.editingInvestmentId) {
            await FH.db.collection('investments').doc(FH.state.editingInvestmentId).update(invData);
        } else {
            await FH.db.collection('investments').add({ ...invData, userId: FH.currentUser.id, userName: FH.currentUser.name, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
        }
        FH.closeInvestmentModal();
    } catch (e) {
        alert('Erro');
    }
};
FH.deleteInvestment = async id => {
    if (!confirm('Excluir?')) return;
    try {
        await FH.db.collection('investments').doc(id).delete();
    } catch (e) {}
};
FH.addAporteToInvestment = async invId => {
    const vi = document.getElementById(`aporte-val-${invId}`);
    const di = document.getElementById(`aporte-date-${invId}`);
    const value = FH.parseMoney(vi?.value);
    const date = di?.value;
    if (!value || value <= 0 || !date) { alert('Preencha'); return; }
    const inv = FH.allInvestments.find(i => i.id === invId);
    if (!inv) return;
    const aportes = [...(inv.aportes || []), { value, date }];
    const updatedInv = FH.recalcInvestment({ ...inv, aportes });
    try {
        await FH.db.collection('investments').doc(invId).update({
            aportes,
            totalInvested: updatedInv.totalInvested,
            currentValue: updatedInv.currentValue,
            projectedValue: updatedInv.projectedValue,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        if (vi) vi.value = '';
        if (di) di.value = '';
    } catch (e) {
        alert('Erro');
    }
};
FH.removeAporteFromInvestment = async (invId, index) => {
    const inv = FH.allInvestments.find(i => i.id === invId);
    if (!inv || (inv.aportes || []).length <= 1) { alert('Não pode remover o aporte inicial.'); return; }
    const aportes = (inv.aportes || []).filter((_, i) => i !== index);
    const updatedInv = FH.recalcInvestment({ ...inv, aportes });
    try {
        await FH.db.collection('investments').doc(invId).update({
            aportes,
            totalInvested: updatedInv.totalInvested,
            currentValue: updatedInv.currentValue,
            projectedValue: updatedInv.projectedValue,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (e) {
        alert('Erro');
    }
};
FH.loadInvestments = () => {
    FH.allInvestments.forEach(inv => FH.recalcInvestment(inv));
    const ti = FH.allInvestments.reduce((s, i) => s + (i.totalInvested || 0), 0);
    const tc = FH.allInvestments.reduce((s, i) => s + (i.currentValue || 0), 0);
    const rv = tc - ti;
    const rp = ti > 0 ? (rv / ti) * 100 : 0;
    const summary = document.getElementById('investmentSummary');
    if (summary) {
        summary.innerHTML = `
            <div class="summary-card investment"><div class="card-label">💼 Total Investido</div><div class="card-value">R$ ${ti.toFixed(2)}</div></div>
            <div class="summary-card ${rv >= 0 ? 'income' : 'expense'}"><div class="card-label">📊 Valor Atual</div><div class="card-value ${rv >= 0 ? 'positive' : 'negative'}">R$ ${tc.toFixed(2)}</div></div>
            <div class="summary-card ${rv >= 0 ? 'income' : 'expense'}"><div class="card-label">📈 Rent. Nominal</div><div class="card-value ${rv >= 0 ? 'positive' : 'negative'}">${rp.toFixed(2)}%</div></div>
            <div class="summary-card ${rv - (FH.indexers.ipca || 0) >= 0 ? 'income' : 'expense'}"><div class="card-label">💎 Rent. Real</div><div class="card-value ${rv - (FH.indexers.ipca || 0) >= 0 ? 'positive' : 'negative'}">${(rp - (FH.indexers.ipca || 0)).toFixed(2)}%</div></div>
        `;
    }
    const fixaTypes = ['CDB', 'Tesouro Direto', 'LCI/LCA', 'Poupança'];
    let tf = 0, tv = 0;
    FH.allInvestments.forEach(inv => {
        const v = inv.currentValue || inv.totalInvested || 0;
        if (fixaTypes.includes(inv.type)) tf += v; else tv += v;
    });
    const tp = tf + tv;
    if (tp > 0) {
        const fp = (tf / tp) * 100;
        const vp = (tv / tp) * 100;
        const ctxP = document.getElementById('portfolioTypeChart');
        if (ctxP) {
            FH.createPieChart('portfolioTypeChart', ['Renda Fixa', 'Renda Variável'], [tf, tv], ['#2563eb', '#ea580c']);
        }
        document.getElementById('portfolioTypeAnalysis')?.insertAdjacentHTML('beforeend', `<strong>Ideal 60/40:</strong> Fixa: <strong style="color:#2563eb;">${fp.toFixed(1)}%</strong> ${fp - 60 > 5 ? '⚠️ Conservador' : fp - 60 < -5 ? '⚠️ Arriscado' : '✅'} | Var: <strong style="color:#ea580c;">${vp.toFixed(1)}%</strong>${Math.abs(fp - 60) > 10 ? '<br>💡 Rebalancear' : ''}`);
    }
    const allAportes = [];
    FH.allInvestments.forEach(inv => {
        (inv.aportes || []).forEach(ap => allAportes.push({ ...ap, rate: inv.rate || 0, indexer: inv.indexer || 'cdi', endDate: inv.endDate }));
    });
    if (allAportes.length > 0) {
        const dailyData = {};
        allAportes.forEach(ap => {
            const d = new Date(ap.date + 'T12:00:00');
            const key = FH.toLocalDateStr(d);
            if (!dailyData[key]) dailyData[key] = { invested: 0, entries: [] };
            dailyData[key].invested += ap.value;
            dailyData[key].entries.push(ap);
        });
        const sortedDays = Object.keys(dailyData).sort();
        const investedLine = [];
        const currentLine = [];
        const projLine = [];
        let cumInvested = 0;
        let maxProjDate = new Date();
        FH.allInvestments.forEach(inv => {
            const ed = new Date((inv.endDate || FH.toLocalDateStr(new Date(new Date().setFullYear(new Date().getFullYear() + 1)))) + 'T12:00:00');
            if (ed > maxProjDate) maxProjDate = ed;
        });
        sortedDays.forEach(day => {
            cumInvested += dailyData[day].invested;
            investedLine.push(cumInvested);
            const entries = sortedDays.filter(d => d <= day).flatMap(d => dailyData[d].entries);
            const curVal = entries.reduce((s, ap) => s + FH.calcProjectedValue([ap], ap.rate || 0, ap.indexer || 'cdi', new Date()), 0);
            const projVal = entries.reduce((s, ap) => s + FH.calcProjectedValue([ap], ap.rate || 0, ap.indexer || 'cdi', maxProjDate), 0);
            currentLine.push(curVal);
            projLine.push(projVal);
        });
        const projDays = [];
        const lastDay = new Date(sortedDays[sortedDays.length - 1] + 'T12:00:00');
        const current = new Date(lastDay);
        while (current <= maxProjDate) {
            current.setDate(current.getDate() + 30);
            if (current <= maxProjDate) projDays.push(FH.toLocalDateStr(current));
        }
        if (!projDays.length || projDays[projDays.length - 1] !== FH.toLocalDateStr(maxProjDate)) {
            projDays.push(FH.toLocalDateStr(maxProjDate));
        }
        const allLabels = [...sortedDays, ...projDays];
        const lastInvested = investedLine[investedLine.length - 1] || 0;
        const lastCurrent = currentLine[currentLine.length - 1] || 0;
        const lastProj = projLine[projLine.length - 1] || 0;
        const fullInvestedLine = [...investedLine, ...projDays.map(() => lastInvested)];
        const fullCurrentLine = [...currentLine, ...projDays.map(() => lastCurrent)];
        const fullProjLine = [...projLine, ...projDays.map(() => lastProj)];
        FH.createLineChart('investmentEvolutionChart', allLabels, [
            { label: 'Valor Investido', data: fullInvestedLine, color: '#2563eb' },
            { label: 'Valor Atual', data: fullCurrentLine, color: '#16a34a' },
            { label: 'Projeção (até ' + maxProjDate.toLocaleDateString('pt-BR',{month:'short',year:'numeric'}) + ')', data: fullProjLine, color: '#7c3aed' }
        ]);
    }
    const idxLabels = { cdi: '% CDI', selic: '% Selic', ipca: 'IPCA +', pre: 'Pré' };
    const cards = document.getElementById('investmentCards');
    if (cards) {
        cards.innerHTML = FH.allInvestments.map(inv => {
            const ret = (inv.currentValue || 0) - (inv.totalInvested || 0);
            const retP = inv.totalInvested > 0 ? (ret / inv.totalInvested) * 100 : 0;
            const realRet = retP - (FH.indexers.ipca || 0);
            const own = inv.userId === FH.currentUser?.id;
            const aportes = inv.aportes || [];
            return `
                <div class="data-card">
                    <div class="data-card-header">
                        <h4>📈 ${FH.escapeHTML(inv.name)}</h4>
                        <div>${own ? `<button class="btn-sm btn-edit" onclick="openInvestmentModal('${FH.escapeHTML(inv.id)}')">✏️</button><button class="btn-sm btn-delete" onclick="deleteInvestment('${FH.escapeHTML(inv.id)}')">🗑️</button>` : '<span class="user-tag">👤 ' + FH.escapeHTML(inv.userName || 'Outro') + '</span>'}</div>
                    </div>
                    <div class="data-card-meta">
                        <span>🏦 ${FH.escapeHTML(inv.institution || '-')}</span>
                        <span>📋 ${FH.escapeHTML(inv.type || '')}</span>
                        <span>📊 ${FH.escapeHTML(String(inv.rate || 0))}% ${FH.escapeHTML(idxLabels[inv.indexer] || '')}</span>
                        <span>📅 ${new Date((inv.startDate || FH.toLocalDateStr(new Date())) + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                        <span>🏁 ${new Date((inv.endDate || FH.toLocalDateStr(new Date(new Date().setFullYear(new Date().getFullYear() + 1)))) + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div class="investment-card-values">
                        <div class="val-item"><div class="val-label">💰 Investido</div><div class="val-number">R$ ${(inv.totalInvested || 0).toFixed(2)}</div></div>
                        <div class="val-item"><div class="val-label">📊 Atual</div><div class="val-number">R$ ${(inv.currentValue || 0).toFixed(2)}</div></div>
                        <div class="val-item"><div class="val-label">📈 Projeção</div><div class="val-number">R$ ${(inv.projectedValue || 0).toFixed(2)}</div></div>
                        <div class="val-item"><div class="val-label">📈 Nominal</div><div class="val-number ${ret >= 0 ? 'positive' : 'negative'}">${retP.toFixed(2)}%</div></div>
                        <div class="val-item"><div class="val-label">💎 Real</div><div class="val-number ${realRet >= 0 ? 'positive' : 'negative'}">${realRet.toFixed(2)}%</div></div>
                    </div>
                    <div class="aportes-section">
                        <h4>🏷️ Aportes (${aportes.length})</h4>
                        ${aportes.map((ap, i) => `<div class="aporte-mini-item"><span>R$ ${ap.value.toFixed(2)}</span><span class="aporte-date">${FH.escapeHTML(ap.date)}</span>${own ? `<button class="btn-sm btn-delete" style="margin-left:8px;" onclick="removeAporteFromInvestment('${FH.escapeHTML(inv.id)}', ${i})">✕</button>` : ''}</div>`).join('')}
                        ${own ? `<div class="aporte-add-mini"><input id="aporte-val-${FH.escapeHTML(inv.id)}" type="text" placeholder="Valor" inputmode="decimal"><input id="aporte-date-${FH.escapeHTML(inv.id)}" type="date"><button class="btn-sm btn-add" onclick="addAporteToInvestment('${FH.escapeHTML(inv.id)}')">Adicionar</button></div>` : ''}
                    </div>
                </div>`;
        }).join('');
    }
};
