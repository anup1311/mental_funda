// This script processes the raw extracted data into a chart-friendly format.

window.processFinancialDataForCharts = (data) => {
    if (!data || !data.headers || !data.rows) {
        return { labels: [], datasets: {} };
    }

    const labels = data.headers;
    const datasets = {};

    // Key metrics we want to chart
    const keyMetrics = ['sales', 'net profit', 'opm %'];

    for (const metric of keyMetrics) {
        // Find the corresponding row, allowing for slight variations in naming
        const rowKey = Object.keys(data.rows).find(key => key.includes(metric));
        
        if (rowKey) {
            // Convert string numbers to float, removing commas
            datasets[metric] = data.rows[rowKey].map(val => 
                parseFloat(val.replace(/,/g, '')) || 0
            );
        } else {
            // If metric not found, fill with zeros to prevent errors
            datasets[metric] = new Array(labels.length).fill(0);
        }
    }

    return { labels, datasets };
};
