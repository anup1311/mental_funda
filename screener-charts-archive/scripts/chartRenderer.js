// Chart renderer for creating and displaying financial charts

(function() {
    window.renderScreenerCharts = function(financialData, container) {
      // Process data to ensure it's in the right format
      const processedData = window.processFinancialData(financialData);
      
      // Create metrics cards with key financial indicators
      createMetricsCards(processedData, container);
      
      // Create four main charts
      createRevenueChart(processedData, container);
      createProfitChart(processedData, container);
      createEPSChart(processedData, container);
      createPEChart(processedData, container);
      
      // Create year-wise returns chart
      createReturnsChart(processedData, container);
    };
  
    // Create metrics cards showing key financial indicators
    function createMetricsCards(data, container) {
      const metricsContainer = document.createElement('div');
      metricsContainer.className = 'metrics-cards-container';
      
      // Create cards for latest metrics
      const latestQuarterlyData = getLatestQuarterlyData(data.quarterlyData);
      const latestYearlyData = getLatestYearlyData(data.yearlyData);
      
      // Add cards for key metrics
      if (latestQuarterlyData) {
        addMetricCard(metricsContainer, 'Quarterly Revenue', latestQuarterlyData.revenue, 
          latestQuarterlyData.revenueGrowth, 'YoY');
        addMetricCard(metricsContainer, 'Quarterly Profit', latestQuarterlyData.profit, 
          latestQuarterlyData.profitGrowth, 'YoY');
      }
      
      if (latestYearlyData) {
        addMetricCard(metricsContainer, 'Annual Revenue', latestYearlyData.revenue, 
          latestYearlyData.revenueGrowth, 'YoY');
        addMetricCard(metricsContainer, 'Annual Profit', latestYearlyData.profit, 
          latestYearlyData.profitGrowth, 'YoY');
        addMetricCard(metricsContainer, 'Latest P/E', latestYearlyData.pe, 
          null, '');
      }
      
      container.appendChild(metricsContainer);
    }
  
    // Helper to get latest quarterly data
    function getLatestQuarterlyData(quarterlyData) {
      if (!quarterlyData || !quarterlyData.datasets || 
          !quarterlyData.datasets[0] || !quarterlyData.datasets[0].data || 
          quarterlyData.datasets[0].data.length === 0) {
        return null;
      }
      
      const length = quarterlyData.datasets[0].data.length;
      const revenueData = quarterlyData.datasets.find(ds => ds.label === 'Sales')?.data || [];
      const profitData = quarterlyData.datasets.find(ds => ds.label === 'Net Profit')?.data || [];
      
      if (length < 5 || revenueData.length < length || profitData.length < length) {
        return null;
      }
      
      return {
        revenue: formatNumber(revenueData[length-1]),
        revenueGrowth: calculateGrowth(revenueData[length-1], revenueData[length-5]),
        profit: formatNumber(profitData[length-1]),
        profitGrowth: calculateGrowth(profitData[length-1], profitData[length-5])
      };
    }
  
    // Helper to get latest yearly data
    function getLatestYearlyData(yearlyData) {
      if (!yearlyData || !yearlyData.datasets || 
          !yearlyData.datasets[0] || !yearlyData.datasets[0].data || 
          yearlyData.datasets[0].data.length === 0) {
        return null;
      }
      
      const length = yearlyData.datasets[0].data.length;
      const revenueData = yearlyData.datasets.find(ds => ds.label === 'Sales')?.data || [];
      const profitData = yearlyData.datasets.find(ds => ds.label === 'Net Profit')?.data || [];
      const epsData = yearlyData.datasets.find(ds => ds.label === 'EPS')?.data || [];
      
      if (length < 2 || revenueData.length < length || profitData.length < length) {
        return null;
      }
  
      // Calculate P/E based on latest EPS and current price
      let pe = null;
      if (epsData.length > 0) {
        const latestEPS = epsData[epsData.length - 1];
        if (latestEPS > 0) {
          // Try to get current price from the page
          const priceElement = document.querySelector('.number, [data-field="CMP"]');
          if (priceElement) {
            const price = parseFloat(priceElement.textContent.replace(/[₹,]/g, ''));
            if (!isNaN(price)) {
              pe = (price / latestEPS).toFixed(2);
            }
          }
        }
      }
      
      return {
        revenue: formatNumber(revenueData[length-1]),
        revenueGrowth: calculateGrowth(revenueData[length-1], revenueData[length-2]),
        profit: formatNumber(profitData[length-1]),
        profitGrowth: calculateGrowth(profitData[length-1], profitData[length-2]),
        pe: pe
      };
    }
  
    // Helper to add a metric card
    function addMetricCard(container, title, value, growth, growthLabel) {
      const card = document.createElement('div');
      card.className = 'metric-card';
      
      const titleEl = document.createElement('div');
      titleEl.className = 'metric-title';
      titleEl.textContent = title;
      
      const valueEl = document.createElement('div');
      valueEl.className = 'metric-value';
      valueEl.textContent = value;
      
      card.appendChild(titleEl);
      card.appendChild(valueEl);
      
      if (growth !== null) {
        const growthEl = document.createElement('div');
        const growthValue = parseFloat(growth);
        growthEl.className = `metric-growth ${growthValue >= 0 ? 'positive' : 'negative'}`;
        growthEl.textContent = `${growth}% ${growthLabel}`;
        card.appendChild(growthEl);
      }
      
      container.appendChild(card);
    }
  
    // Create revenue chart
    function createRevenueChart(data, container) {
      createChart(
        container,
        'screener-chart-revenue',
        'Revenue Trends',
        data.quarterlyData.labels,
        [data.quarterlyData.datasets.find(ds => ds.label === 'Sales')],
        {
          tooltips: {
            callbacks: {
              label: function(tooltipItem, data) {
                return 'Revenue: ₹' + formatNumber(tooltipItem.yLabel);
              }
            }
          }
        }
      );
    }
  
    // Create profit chart
    function createProfitChart(data, container) {
      createChart(
        container,
        'screener-chart-profit',
        'Profit Trends',
        data.quarterlyData.labels,
        [data.quarterlyData.datasets.find(ds => ds.label === 'Net Profit')],
        {
          tooltips: {
            callbacks: {
              label: function(tooltipItem, data) {
                return 'Profit: ₹' + formatNumber(tooltipItem.yLabel);
              }
            }
          }
        }
      );
    }
  
    // Create EPS chart
    function createEPSChart(data, container) {
      createChart(
        container,
        'screener-chart-eps',
        'EPS Trends',
        data.quarterlyData.labels,
        [data.quarterlyData.datasets.find(ds => ds.label === 'EPS')],
        {
          tooltips: {
            callbacks: {
              label: function(tooltipItem, data) {
                return 'EPS: ₹' + tooltipItem.yLabel.toFixed(2);
              }
            }
          }
        }
      );
    }
  
    // Create P/E chart - derived from EPS and price data
    function createPEChart(data, container) {
      // We need to calculate P/E from price history and EPS
      // This is simplified - ideally we would need historical price data
      const canvas = document.createElement('canvas');
      canvas.id = 'screener-chart-pe';
      container.appendChild(canvas);
      
      const chartContainer = document.createElement('div');
      chartContainer.className = 'chart-container';
      chartContainer.innerHTML = '<h3>P/E Ratio</h3><p>P/E ratio calculation requires historical price data, which is not available in the current view.</p>';
      container.appendChild(chartContainer);
    }
  
    // Create year-wise returns chart
    function createReturnsChart(data, container) {
      if (!data.returnsData || !data.returnsData.labels || data.returnsData.labels.length === 0) {
        return;
      }
      
      const canvas = document.createElement('canvas');
      canvas.id = 'screener-chart-returns';
      container.appendChild(canvas);
      
      new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: data.returnsData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          title: {
            display: true,
            text: 'Year-wise Returns'
          },
          scales: {
            yAxes: [{
              ticks: {
                callback: function(value) {
                  return value + '%';
                }
              }
            }]
          },
          tooltips: {
            callbacks: {
              label: function(tooltipItem, data) {
                return tooltipItem.yLabel.toFixed(2) + '%';
              }
            }
          }
        }
      });
    }
  
    // Generic chart creation helper
    function createChart(container, id, title, labels, datasets, additionalOptions = {}) {
      const canvas = document.createElement('canvas');
      canvas.id = id;
      container.appendChild(canvas);
      
      const options = {
        responsive: true,
        maintainAspectRatio: false,
        title: {
          display: true,
          text: title
        },
        ...additionalOptions
      };
      
      new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
          labels: labels,
          datasets: datasets
        },
        options: options
      });
    }
  
    // Helper to format numbers in Indian format (crores/lakhs)
    function formatNumber(num) {
      if (typeof num !== 'number') return 'N/A';
      
      if (num >= 10000000) {
        return (num / 10000000).toFixed(2) + ' Cr';
      } else if (num >= 100000) {
        return (num / 100000).toFixed(2) + ' L';
      } else {
        return num.toFixed(2);
      }
    }
  
    // Helper to calculate growth percentage
    function calculateGrowth(current, previous) {
      if (!current || !previous || previous === 0) return null;
      return ((current - previous) / Math.abs(previous) * 100).toFixed(2);
    }
  })();