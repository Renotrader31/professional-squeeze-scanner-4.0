// Options Scanner Pro - Frontend JavaScript
class OptionsScanner {
    constructor() {
        this.results = [];
        this.isScanning = false;
        this.init();
    }

    init() {
        console.log('Options Scanner Pro initialized');
        this.setupEventListeners();
        this.updateTickers();
    }

    setupEventListeners() {
        // Add any additional event listeners here
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.runScan();
            }
        });
    }

    updateTickers() {
        const preset = document.getElementById('tickerPreset').value;
        const tickerList = document.getElementById('tickerList');
        
        const presets = {
            'mega_tech': 'AAPL, MSFT, NVDA, GOOGL, AMZN, META, TSLA',
            'etfs': 'SPY, QQQ, IWM, DIA, XLF, XLE, GLD',
            'meme': 'GME, AMC, BBBY, BB, NOK',
            'custom': tickerList.value || 'AAPL, MSFT, NVDA'
        };

        if (preset !== 'custom') {
            tickerList.value = presets[preset];
        }
    }

    updateDTE() {
        const value = document.getElementById('daysToExp').value;
        document.getElementById('dteValue').textContent = value;
    }

    updateReturn() {
        const value = document.getElementById('minReturn').value;
        document.getElementById('returnValue').textContent = value;
    }

    async runScan() {
        if (this.isScanning) {
            this.showAlert('Scan already in progress', 'warning');
            return;
        }

        this.isScanning = true;
        this.showLoading(true);
        this.hideAllSections();
        this.updateScanStatus('Scanning...', 'warning');

        try {
            // Gather form data
            const scanData = this.gatherScanData();
            
            // Validate inputs
            if (!this.validateInputs(scanData)) {
                return;
            }

            // Make API call
            const response = await fetch('/api/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(scanData)
            });

            const result = await response.json();

            if (result.success) {
                this.results = result.results;
                this.displayResults();
                this.updateScanStatus(`Found ${result.count} opportunities`, 'success');
            } else {
                this.showAlert(`Scan failed: ${result.error || result.message}`, 'danger');
                this.updateScanStatus('Scan failed', 'danger');
            }

        } catch (error) {
            console.error('Scan error:', error);
            this.showAlert(`Network error: ${error.message}`, 'danger');
            this.updateScanStatus('Error', 'danger');
        } finally {
            this.isScanning = false;
            this.showLoading(false);
        }
    }

    gatherScanData() {
        const tickerText = document.getElementById('tickerList').value;
        const tickers = tickerText.split(',').map(t => t.trim().toUpperCase()).filter(t => t);

        return {
            polygon_key: document.getElementById('polygonKey').value.trim(),
            uw_key: document.getElementById('uwKey').value.trim(),
            tickers: tickers,
            days_to_exp: parseInt(document.getElementById('daysToExp').value),
            min_return: parseInt(document.getElementById('minReturn').value),
            strategies: ['Long Calls', 'Long Puts', 'Bull Call Spreads', 'Bear Put Spreads', 'Cash-Secured Puts']
        };
    }

    validateInputs(data) {
        if (!data.polygon_key && !data.uw_key) {
            this.showAlert('Please enter at least one API key', 'warning');
            this.updateScanStatus('Missing API key', 'warning');
            return false;
        }

        if (!data.tickers || data.tickers.length === 0) {
            this.showAlert('Please enter at least one ticker symbol', 'warning');
            this.updateScanStatus('Missing tickers', 'warning');
            return false;
        }

        return true;
    }

    displayResults() {
        if (!this.results || this.results.length === 0) {
            this.showNoResults();
            return;
        }

        this.updateResultsSummary();
        this.populateResultsTable();
        this.createCharts();
        this.showResultsSection();
    }

    updateResultsSummary() {
        const results = this.results;
        
        // Calculate summary metrics
        const totalOps = results.length;
        const returns = results.map(r => parseFloat(r.return) || 0);
        const bestReturn = Math.max(...returns);
        const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        
        // Get strategy counts
        const strategyCounts = {};
        results.forEach(r => {
            strategyCounts[r.strategy] = (strategyCounts[r.strategy] || 0) + 1;
        });
        const topStrategy = Object.keys(strategyCounts).reduce((a, b) => 
            strategyCounts[a] > strategyCounts[b] ? a : b
        );

        // Average DTE
        const dtes = results.map(r => parseInt(r.dte) || 0).filter(d => d > 0);
        const avgDTE = dtes.length > 0 ? Math.round(dtes.reduce((a, b) => a + b, 0) / dtes.length) : 0;

        // Update DOM
        document.getElementById('totalOps').textContent = totalOps.toLocaleString();
        document.getElementById('bestReturn').textContent = `${bestReturn.toFixed(1)}%`;
        document.getElementById('avgReturn').textContent = `${avgReturn.toFixed(1)}%`;
        document.getElementById('topStrategy').textContent = topStrategy.substring(0, 15) + (topStrategy.length > 15 ? '...' : '');
        document.getElementById('avgDTE').textContent = `${avgDTE}d`;

        document.getElementById('resultsSummary').classList.remove('d-none');
        document.getElementById('resultsSummary').classList.add('fade-in');
    }

    populateResultsTable() {
        const tbody = document.getElementById('resultsBody');
        tbody.innerHTML = '';

        // Show top 50 results
        const displayResults = this.results.slice(0, 50);

        displayResults.forEach(result => {
            const row = document.createElement('tr');
            
            const returnClass = this.getReturnClass(parseFloat(result.return) || 0);
            
            row.innerHTML = `
                <td><strong>${result.ticker}</strong></td>
                <td>${result.strategy}</td>
                <td class="${returnClass}">${this.formatReturn(result.return)}</td>
                <td>${this.formatCurrency(result.current_price)}</td>
                <td>${this.formatCurrency(result.strike)}</td>
                <td>${this.formatDate(result.expiration)}</td>
                <td>${result.dte || '-'}</td>
                <td>${this.formatPercentage(result.iv)}</td>
                <td>${this.formatCurrency(result.premium)}</td>
            `;

            tbody.appendChild(row);
        });

        document.getElementById('resultsTable').classList.remove('d-none');
        document.getElementById('resultsTable').classList.add('fade-in');
    }

    createCharts() {
        this.createReturnDistributionChart();
        this.createStrategyChart();
        document.getElementById('chartsSection').classList.remove('d-none');
        document.getElementById('chartsSection').classList.add('fade-in');
    }

    createReturnDistributionChart() {
        const returns = this.results.map(r => parseFloat(r.return) || 0);
        
        const trace = {
            x: returns,
            type: 'histogram',
            nbinsx: 20,
            marker: {
                color: returns,
                colorscale: [[0, '#667eea'], [0.5, '#00ff88'], [1, '#00d4ff']],
                line: { color: '#2a2a3e', width: 1 }
            },
            hovertemplate: 'Return: %{x:.1f}%<br>Count: %{y}<extra></extra>'
        };

        const layout = {
            title: {
                text: 'Return Distribution',
                font: { color: '#00ff88', size: 16 }
            },
            xaxis: { 
                title: 'Return (%)',
                gridcolor: '#2a2a3e',
                color: '#e0e0e0'
            },
            yaxis: { 
                title: 'Count',
                gridcolor: '#2a2a3e',
                color: '#e0e0e0'
            },
            plot_bgcolor: '#1a1a2e',
            paper_bgcolor: '#1a1a2e',
            font: { color: '#e0e0e0' },
            height: 300,
            margin: { t: 50, b: 50, l: 50, r: 50 }
        };

        Plotly.newPlot('returnChart', [trace], layout, { displayModeBar: false });
    }

    createStrategyChart() {
        const strategyCounts = {};
        this.results.forEach(r => {
            strategyCounts[r.strategy] = (strategyCounts[r.strategy] || 0) + 1;
        });

        const strategies = Object.keys(strategyCounts);
        const counts = Object.values(strategyCounts);

        const trace = {
            labels: strategies,
            values: counts,
            type: 'pie',
            hole: 0.6,
            marker: {
                colors: ['#667eea', '#00ff88', '#00d4ff', '#ff6b6b', '#ffd93d', '#a8e6cf', '#ff8cc8', '#6bcf7f'],
                line: { color: '#1a1a2e', width: 2 }
            },
            textposition: 'outside',
            textinfo: 'label+percent',
            hovertemplate: '%{label}<br>Count: %{value}<br>%{percent}<extra></extra>'
        };

        const layout = {
            title: {
                text: 'Strategy Distribution',
                font: { color: '#00ff88', size: 16 }
            },
            plot_bgcolor: '#1a1a2e',
            paper_bgcolor: '#1a1a2e',
            font: { color: '#e0e0e0' },
            height: 300,
            showlegend: false,
            margin: { t: 50, b: 50, l: 50, r: 50 },
            annotations: [{
                text: `${strategies.length}<br>Strategies`,
                x: 0.5, y: 0.5,
                font: { size: 16, color: '#00ff88' },
                showarrow: false
            }]
        };

        Plotly.newPlot('strategyChart', [trace], layout, { displayModeBar: false });
    }

    // Utility Methods
    getReturnClass(returnValue) {
        if (returnValue >= 30) return 'return-high';
        if (returnValue >= 15) return 'return-medium';
        return 'return-low';
    }

    formatCurrency(value) {
        if (!value || value === '' || isNaN(value)) return '-';
        return `$${parseFloat(value).toFixed(2)}`;
    }

    formatPercentage(value) {
        if (!value || value === '' || isNaN(value)) return '-';
        return `${parseFloat(value).toFixed(1)}%`;
    }

    formatReturn(value) {
        if (!value || value === '' || isNaN(value)) return '-';
        const num = parseFloat(value);
        return `${num.toFixed(1)}%`;
    }

    formatDate(dateStr) {
        if (!dateStr) return '-';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch {
            return dateStr;
        }
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (show) {
            loading.classList.remove('d-none');
        } else {
            loading.classList.add('d-none');
        }
    }

    showAlert(message, type = 'danger') {
        const alert = document.getElementById('errorAlert');
        const messageEl = document.getElementById('errorMessage');
        
        alert.className = `alert alert-${type}`;
        messageEl.textContent = message;
        alert.classList.remove('d-none');

        // Auto-hide after 5 seconds
        setTimeout(() => {
            alert.classList.add('d-none');
        }, 5000);
    }

    updateScanStatus(message, type) {
        const status = document.getElementById('scanStatus');
        status.textContent = message;
        status.className = `badge bg-${type}`;
    }

    hideAllSections() {
        ['errorAlert', 'resultsSummary', 'resultsTable', 'chartsSection', 'noResults'].forEach(id => {
            document.getElementById(id).classList.add('d-none');
        });
    }

    showResultsSection() {
        // Results are shown by individual methods
    }

    showNoResults() {
        document.getElementById('noResults').classList.remove('d-none');
        document.getElementById('noResults').classList.add('fade-in');
        this.updateScanStatus('No results', 'secondary');
    }
}

// Global functions for HTML onclick handlers
function updateTickers() {
    scanner.updateTickers();
}

function updateDTE() {
    scanner.updateDTE();
}

function updateReturn() {
    scanner.updateReturn();
}

function runScan() {
    scanner.runScan();
}

// Initialize the scanner when DOM is loaded
let scanner;
document.addEventListener('DOMContentLoaded', function() {
    scanner = new OptionsScanner();
});