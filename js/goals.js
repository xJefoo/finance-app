window.FH = window.FH || {};
var FH = window.FH;
FH.getUniqueInvestmentNames = () => {
    const names = new Set();
    FH.allInvestments.forEach(inv => { if (inv.name) names.add(inv.name); });
    return [...names].sort();
};
FH.updateGoalDropdown = () => {
    const select = document.getElementById('goalInvestment');
    if (!select) return;
    const names = FH.getUniqueInvestmentNames();
    select.innerHTML = names.map(n => `<option value="${FH.escapeHTML(n)}">${FH.escapeHTML(n)}</option>`).join('') || '<option value="">Nenhum investimento disponível</option>';
};
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
FH.saveGoal = async () => {
    if (!FH.currentUser) return;
    const investmentName = document.getElementById('goalInvestment')?.value || '';
    const target = FH.parseMoney(document.getElementById('goalTarget')?.value);
    const deadline = document.getElementById('goalDeadline')?.value || '';
    if (!investmentName || !target || target <= 0) {
        alert('Escolha um investimento e defina um objetivo');
        return;
    }
    const goalData = {
        investmentName,
        target,
        deadline,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    try {
        if (FH.state.editingGoalId) {
            await FH.db.collection('goals').doc(FH.state.editingGoalId).update(goalData);
        } else {
            await FH.db.collection('goals').add({
                ...goalData,
                userId: FH.currentUser.id,
                userName: FH.currentUser.name,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        FH.closeGoalModal();
    } catch (e) {
        alert('Erro ao salvar meta');
    }
};
FH.deleteGoal = async id => {
    if (!confirm('Excluir meta?')) return;
    try {
        await FH.db.collection('goals').doc(id).delete();
    } catch (e) {}
};
FH.loadGoals = () => {
    const goalsWithData = FH.allGoals.map(g => {
        const matchingInvestments = FH.allInvestments.filter(i => i.name === g.investmentName);
        const currentValue = matchingInvestments.reduce((sum, inv) => sum + (inv.currentValue || inv.totalInvested || 0), 0);
        const totalInvested = matchingInvestments.reduce((sum, inv) => sum + (inv.totalInvested || 0), 0);
        const pct = g.target > 0 ? (currentValue / g.target) * 100 : 0;
        const remaining = g.target - currentValue;
        const dl = g.deadline ? new Date(g.deadline + 'T12:00:00') : null;
        const now = new Date();
        let monthlyHint = '';
        if (dl && dl > now && remaining > 0) {
            const monthsLeft = (dl.getFullYear() - now.getFullYear()) * 12 + (dl.getMonth() - now.getMonth()) + 1;
            if (monthsLeft > 0) monthlyHint = `💡 Precisa investir + R$ ${(remaining / monthsLeft).toFixed(2)}/mês`;
        }
        const firstInv = matchingInvestments[0] || {};
        return {
            ...g,
            currentValue,
            totalInvested,
            pct,
            remaining,
            monthlyHint,
            institution: firstInv.institution || '',
            type: firstInv.type || '',
            rate: firstInv.rate || 0,
            indexer: firstInv.indexer || '',
            matchCount: matchingInvestments.length
        };
    });
    const totalTarget = goalsWithData.reduce((s, g) => s + g.target, 0);
    const totalCurrent = goalsWithData.reduce((s, g) => s + g.currentValue, 0);
    const totalPct = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;
    const summary = document.getElementById('goalsSummary');
    if (summary) {
        summary.innerHTML = `
            <div class="summary-card investment"><div class="card-label">🎯 Total em Metas</div><div class="card-value">R$ ${totalTarget.toFixed(2)}</div></div>
            <div class="summary-card income"><div class="card-label">💰 Valor Atual</div><div class="card-value positive">R$ ${totalCurrent.toFixed(2)}</div></div>
            <div class="summary-card balance"><div class="card-label">📊 Progresso Geral</div><div class="card-value">${totalPct.toFixed(1)}%</div></div>
        `;
    }
    const idxLabels = { cdi: '% CDI', selic: '% Selic', ipca: 'IPCA +', pre: 'Pré' };
    const list = document.getElementById('goalsList');
    if (list) {
        list.innerHTML = goalsWithData.map(g => {
            const own = g.userId === FH.currentUser?.id;
            const cls = g.pct >= 80 && g.pct < 100 ? 'yellow' : 'green';
            return `
                <div class="goal-card">
                    <div class="goal-card-header">
                        <h3>🎯 Meta: ${FH.escapeHTML(g.investmentName)} ${g.matchCount > 1 ? `<span style="font-size:11px;color:var(--text-light);">(${g.matchCount} investimentos)</span>` : ''}</h3>
                        <div>${own ? `<button class="btn-sm btn-edit" onclick="openGoalModal('${FH.escapeHTML(g.id)}')">✏️</button><button class="btn-sm btn-delete" onclick="deleteGoal('${FH.escapeHTML(g.id)}')">🗑️</button>` : '<span class="user-tag">👤 ' + FH.escapeHTML(g.userName || 'Outro') + '</span>'}</div>
                    </div>
                    <div class="goal-card-meta">
                        <span>🏦 ${FH.escapeHTML(g.institution || '-')}</span><span>📋 ${FH.escapeHTML(g.type || '-')}</span><span>📊 ${FH.escapeHTML(String(g.rate || 0))}% ${FH.escapeHTML(idxLabels[g.indexer] || '')}</span>
                    </div>
                    <div class="goal-card-values">
                        <div class="val-item"><div class="val-label">🎯 Objetivo</div><div class="val-number">R$ ${g.target.toFixed(2)}</div></div>
                        <div class="val-item"><div class="val-label">📊 Valor Atual</div><div class="val-number">R$ ${g.currentValue.toFixed(2)}</div></div>
                        <div class="val-item"><div class="val-label">💰 Já investido</div><div class="val-number">R$ ${g.totalInvested.toFixed(2)}</div></div>
                        ${g.deadline ? `<div class="val-item"><div class="val-label">📅 Data Alvo</div><div class="val-number" style="font-size:12px;">${new Date(g.deadline + 'T12:00:00').toLocaleDateString('pt-BR')}</div></div>` : ''}
                    </div>
                    <div class="goal-progress-bar"><div class="goal-progress-fill ${cls}" style="width:${Math.min(g.pct, 100)}%"></div></div>
                    <div class="goal-stats"><span>${g.pct.toFixed(1)}% concluído</span><span>Faltam R$ ${(g.remaining > 0 ? g.remaining : 0).toFixed(2)}</span></div>
                    ${g.monthlyHint ? `<p class="goal-hint">${FH.escapeHTML(g.monthlyHint)}</p>` : ''}
                </div>`;
        }).join('') || '<p style="text-align:center;padding:30px;">Nenhuma meta criada.</p>';
    }
};
