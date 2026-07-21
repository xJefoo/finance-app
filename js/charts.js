window.FH = window.FH || {};
var FH = window.FH;
FH.createLineChart = (cid, labels, datasets) => {
    const ctx = document.getElementById(cid);
    if (!ctx) return;
    if (FH.state.charts[cid]) FH.state.charts[cid].destroy();
    FH.state.charts[cid] = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: datasets.map(ds => ({
                label: ds.label,
                data: ds.data,
                borderColor: ds.color,
                backgroundColor: ds.color + '20',
                fill: true,
                tension: 0.4,
                pointRadius: 2
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } },
            scales: { y: { beginAtZero: true, ticks: { callback: v => 'R$ ' + v } } }
        }
    });
};
FH.createPieChart = (cid, labels, data, colors) => {
    const ctx = document.getElementById(cid);
    if (!ctx) return;
    if (FH.state.charts[cid]) FH.state.charts[cid].destroy();
    FH.state.charts[cid] = new Chart(ctx, {
        type: 'pie',
        data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
};
