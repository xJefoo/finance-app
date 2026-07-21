window.FH = window.FH || {};
var FH = window.FH;

FH.getPeriodRange = () => {
    const now = new Date();
    let start = new Date(now);
    const { qty, unit } = FH.currentPeriod;  // ← CORRIGIDO
    switch (unit) {
        case 'm': start.setMinutes(now.getMinutes() - qty); break;
        case 'h': start.setHours(now.getHours() - qty); break;
        case 'd': start.setDate(now.getDate() - qty); break;
        case 'M': start.setMonth(now.getMonth() - qty); break;
        case 'y': start.setFullYear(now.getFullYear() - qty); break;
        case 'custom': start = FH.currentPeriod.start ? new Date(FH.currentPeriod.start) : start; break;  // ← CORRIGIDO
        default: start.setDate(now.getDate() - 30);
    }
    const end = FH.currentPeriod.unit === 'custom' && FH.currentPeriod.end ? new Date(FH.currentPeriod.end) : now;  // ← CORRIGIDO
    if (FH.currentPeriod.unit !== 'custom') start.setHours(0, 0, 0, 0);  // ← CORRIGIDO
    return { start, end };
};

FH.updatePeriodLabel = () => {
    const { qty, unit } = FH.currentPeriod;  // ← CORRIGIDO
    const unitNames = { m: 'minutos', h: 'horas', d: 'dias', M: 'meses', y: 'anos' };
    const label = unit === 'custom' ? 'Personalizado' : `Últimos ${qty} ${unitNames[unit] || unit}`;
    const periodLabel = document.getElementById('periodLabel');
    if (periodLabel) periodLabel.textContent = label;
    const periodCurrent = document.getElementById('periodCurrent');
    if (periodCurrent) periodCurrent.textContent = '📍 ' + label;
    const { start, end } = FH.getPeriodRange();
    const fmtDate = d => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    const fmtTime = d => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    let startStr = fmtDate(start), endStr = fmtDate(end);
    if (FH.currentPeriod.unit === 'm' || FH.currentPeriod.unit === 'h') {  // ← CORRIGIDO
        startStr += ' ' + fmtTime(start);
        endStr += ' ' + fmtTime(end);
    }
    document.querySelectorAll('.period-badge').forEach(el => { el.textContent = `${startStr} - ${endStr}`; });
};

FH.parseCustomPeriod = str => {
    const match = String(str || '').trim().match(/^(\d+)\s*(m|h|d|M|y)$/);
    return match ? { qty: parseInt(match[1], 10), unit: match[2] } : null;
};

FH.toggleDropdown = () => {
    document.getElementById('periodDropdown')?.classList.toggle('open');
};

FH.selectChip = period => {
    document.querySelectorAll('#quickChips .dd-chip').forEach(el => el.classList.remove('active'));
    const chip = document.querySelector(`#quickChips .dd-chip[data-period="${period}"]`);
    if (chip) chip.classList.add('active');
    const map = {
        '1h': { qty: 1, unit: 'h' },
        '6h': { qty: 6, unit: 'h' },
        '24h': { qty: 24, unit: 'h' },
        '7d': { qty: 7, unit: 'd' },
        '30d': { qty: 30, unit: 'd' },
        '90d': { qty: 90, unit: 'd' },
        '1y': { qty: 1, unit: 'y' }
    };
    FH.currentPeriod = map[period] || { qty: 30, unit: 'd' };  // ← CORRIGIDO
    FH.updatePeriodLabel();
    document.getElementById('periodDropdown')?.classList.remove('open');
    FH.refreshCurrentView();
};

FH.applyPeriod = () => {
    const customInput = document.getElementById('customPeriod')?.value.trim();
    const startDate = document.getElementById('customStart')?.value;
    const endDate = document.getElementById('customEnd')?.value;
    if (customInput) {
        const parsed = FH.parseCustomPeriod(customInput);
        if (parsed) {
            FH.currentPeriod = parsed;  // ← CORRIGIDO
            document.querySelectorAll('#quickChips .dd-chip').forEach(el => el.classList.remove('active'));
        } else {
            alert('Formato inválido. Use: 26d, 15h, 45m, 3M, 1y');
            return;
        }
    } else if (startDate && endDate) {
        FH.currentPeriod = { qty: 0, unit: 'custom', start: new Date(startDate + 'T12:00:00'), end: new Date(endDate + 'T12:00:00') };  // ← CORRIGIDO
        document.querySelectorAll('#quickChips .dd-chip').forEach(el => el.classList.remove('active'));
    }
    FH.updatePeriodLabel();
    document.getElementById('periodDropdown')?.classList.remove('open');
    FH.refreshCurrentView();
};

FH.setupPeriodEvents = () => {
    document.getElementById('periodTrigger')?.addEventListener('click', e => { e.stopPropagation(); FH.toggleDropdown(); });
    document.getElementById('quickChips')?.addEventListener('click', e => {
        if (e.target.classList.contains('dd-chip')) {
            e.stopPropagation();
            FH.selectChip(e.target.dataset.period);
        }
    });
    document.getElementById('applyPeriodBtn')?.addEventListener('click', e => { e.stopPropagation(); FH.applyPeriod(); });
    document.getElementById('periodDropdown')?.addEventListener('click', e => { e.stopPropagation(); });
    document.addEventListener('click', e => {
        if (!e.target.closest('.period-trigger')) {
            document.getElementById('periodDropdown')?.classList.remove('open');
        }
    });
};