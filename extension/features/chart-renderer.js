// This script is injected onto the page to render charts.
// It relies on Chart.js being loaded first.

window.renderScreenerCharts = (financialData) => {
    if (!financialData || !window.Chart) {
        console.error("Chart.js or financial data is not available.");
        return;
    }

    const { yearlyData, quarterlyData } = financialData;

    // Process data into a format Chart.js understands
    const processedYearly = window.processFinancialDataForCharts(yearlyData);
    const processedQuarterly = window.processFinancialDataForCharts(quarterlyData);
    
    // --- RENDER CHARTS ---
    createChart(
        'sales-chart',
        'Sales Performance (Cr)',
        'line',
        processedYearly.labels,
        [
            {
                label: 'Yearly Sales',
                data: processedYearly.datasets['sales'],
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                yAxisID: 'y',
            },
            {
                label: 'Quarterly Sales (last 8)',
                data: processedQuarterly.datasets['sales'].slice(-8),
                borderColor: 'rgb(255, 159, 64)',
                backgroundColor: 'rgba(255, 159, 64, 0.5)',
                type: 'bar',
                yAxisID: 'y',
            }
        ]
    );
    
    createChart(
        'profit-chart',
        'Net Profit & OPM (%)',
        'bar',
        processedYearly.labels,
        [
             {
                label: 'Net Profit (Cr)',
                data: processedYearly.datasets['net profit'],
                backgroundColor: 'rgb(75, 192, 192)',
                 yAxisID: 'y',
            },
            {
                label: 'OPM %',
                data: processedYearly.datasets['opm %'],
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                type: 'line',
                yAxisID: 'y1',
            }
        ]
    );
};

function createChart(canvasId, title, type, labels, datasets) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: title
                },
                legend: {
                    position: 'top',
                },
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Amount (Cr)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Percentage (%)'
                    },
                    grid: {
                        drawOnChartArea: false, // only draw grid lines for the first Y axis
                    },
                },
            }
        }
    });
}
