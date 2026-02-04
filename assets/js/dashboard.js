// Day Wise Breakup Table
function renderDayWiseBreakup(dailyRows, capital, pnlType = 'net') {
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const yearDayMap = {}; // { '2025': { Mon: 0, Tue: 0, ... }, '2026': { Mon: 0, Tue: 0, ... } }
    const usePnlField = pnlType === 'gross' ? 'grossPnl' : 'netPnl';
    
    dailyRows.forEach(row => {
        const year = row.date.getFullYear().toString();
        const day = row.date.toLocaleDateString('en-US', { weekday: 'short' });
        
        if (!yearDayMap[year]) {
            yearDayMap[year] = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0 };
        }
        
        if (yearDayMap[year].hasOwnProperty(day)) {
            yearDayMap[year][day] += row[usePnlField];
        }
    });
    
    let html = '<table class="table table-bordered" style="text-align:center;">';
    html += '<thead><tr><th>Day</th>' + dayNames.map(d => `<th>${d}</th>`).join("") + '</tr></thead>';
    html += '<tbody>';
    
    // Add rows for each year
    const years = Object.keys(yearDayMap).sort();
    years.forEach(year => {
        html += `<tr><td>${year}</td>` + dayNames.map(d => {
            const val = yearDayMap[year][d];
            const pct = capital > 0 ? ((val / capital) * 100).toFixed(2) : 0;
            let bg = val > 0 ? '#e8f5e9' : val < 0 ? '#ffebee' : '#f8fafc';
            let color = val > 0 ? 'green' : val < 0 ? 'red' : 'black';
            return `<td style="background:${bg};color:${color};font-weight:600;">${Math.round(val)}<br><span style="font-size:0.85em;">(${pct}%)</span></td>`;
        }).join("") + '</tr>';
    });
    
    // Add total row
    html += '<tr><td>Total</td>';
    dayNames.forEach(d => {
        let totalVal = 0;
        years.forEach(year => {
            totalVal += yearDayMap[year][d];
        });
        const pct = capital > 0 ? ((totalVal / capital) * 100).toFixed(2) : 0;
        let color = totalVal > 0 ? 'green' : totalVal < 0 ? 'red' : 'black';
        html += `<td style="color:${color};font-weight:600;">${Math.round(totalVal)}<br><span style="font-size:0.85em;">(${pct}%)</span></td>`;
    });
    html += '</tr>';
    html += '</tbody></table>';
    document.getElementById('dayWiseBreakup').innerHTML = html;
}

// Monthly Breakup Table
function renderMonthlyBreakup(monthlyMap, stats) {
    if (!monthlyMap) return;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let html = '<table class="table table-bordered" style="text-align:center;">';
    html += '<thead><tr><th>Month</th>' + months.map(m => `<th>${m}</th>`).join("") + '<th>Total</th><th>MDD</th><th>ROI</th></tr></thead>';
    html += '<tbody><tr><td>2026</td>';
    let total = 0;
    for (let m = 1; m <= 12; m++) {
        const key = `2026-${m}`;
        const val = monthlyMap.has(key) ? monthlyMap.get(key) : 0;
        total += val;
        let bg = val > 0 ? '#e8f5e9' : val < 0 ? '#ffebee' : '#f8fafc';
        let color = val > 0 ? 'green' : val < 0 ? 'red' : 'black';
        html += `<td style="background:${bg};color:${color};font-weight:600;">${val !== 0 ? val : 0}</td>`;
    }
    // Get MDD and ROI from stats
    const mddStat = stats.find(s => s.name.toLowerCase().includes('max drawdown'));
    const roiStat = stats.find(s => s.name.toLowerCase().includes('roi'));
    html += `<td style="color:green;font-weight:600;">${total}</td>`;
    html += `<td style="color:red;font-weight:600;">${mddStat ? mddStat.value : 'NA'}</td>`;
    html += `<td style="color:green;font-weight:600;">${roiStat ? roiStat.value : '0%'}</td>`;
    html += '</tr>';
    html += '<tr><td>Total</td>';
    for (let m = 1; m <= 12; m++) {
        const key = `2026-${m}`;
        const val = monthlyMap.has(key) ? monthlyMap.get(key) : 0;
        let color = val > 0 ? 'green' : val < 0 ? 'red' : 'black';
        html += `<td style="color:${color};font-weight:600;">${val !== 0 ? val : 0}</td>`;
    }
    html += `<td style="color:green;font-weight:600;">${total}</td>`;
    html += `<td style="color:red;font-weight:600;">${mddStat ? mddStat.value : 'NA'}</td>`;
    html += `<td style="color:green;font-weight:600;">${roiStat ? roiStat.value : '0%'}</td>`;
    html += '</tr>';
    html += '</tbody></table>';
    document.getElementById('monthlyBreakup').innerHTML = html;
}
// Daily PnL Bar Chart
let chartSliderEnabled = false;
let chartDataCache = null;
const MAX_VISIBLE_DAYS = 30;

function renderDailyPnlBarChart(dailyRows, capital, pnlType = 'net') {
    const canvas = document.getElementById('dailyPnlBarChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!dailyRows || dailyRows.length === 0) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        return;
    }
    
    // Cache the full data
    chartDataCache = { dailyRows, capital, pnlType };
    
    // Determine if slider should be shown
    const totalDays = dailyRows.length;
    const controlsContainer = document.getElementById('chartControlsContainer');
    
    if (totalDays > MAX_VISIBLE_DAYS) {
        chartSliderEnabled = true;
        controlsContainer.style.display = 'block';
        
        // Setup slider if not already done
        const slider = document.getElementById('chartSlider');
        slider.max = totalDays - MAX_VISIBLE_DAYS;
        slider.value = 0;
        
        // Remove previous event listeners to avoid duplicates
        const newSlider = slider.cloneNode(true);
        slider.parentNode.replaceChild(newSlider, slider);
        
        newSlider.addEventListener('input', function() {
            updateChartFromSlider();
        });
        
        updateChartFromSlider();
    } else {
        chartSliderEnabled = false;
        controlsContainer.style.display = 'none';
        renderChartWithData(dailyRows, capital, pnlType, 0, dailyRows.length);
    }
}

function updateChartFromSlider() {
    if (!chartDataCache) return;
    
    const slider = document.getElementById('chartSlider');
    const startIndex = parseInt(slider.value);
    const endIndex = Math.min(startIndex + MAX_VISIBLE_DAYS, chartDataCache.dailyRows.length);
    
    renderChartWithData(chartDataCache.dailyRows, chartDataCache.capital, chartDataCache.pnlType, startIndex, endIndex);
}

function renderChartWithData(dailyRows, capital, pnlType, startIndex, endIndex) {
    const canvas = document.getElementById('dailyPnlBarChart');
    const ctx = canvas.getContext('2d');
    
    const usePnlField = pnlType === 'gross' ? 'grossPnl' : 'netPnl';
    
    // Slice data for visible range
    const visibleRows = dailyRows.slice(startIndex, endIndex);
    const labels = visibleRows.map(row => row.date.toLocaleDateString("en-IN"));
    const data = visibleRows.map(row => row[usePnlField]);
    const bgColors = visibleRows.map(row => row[usePnlField] >= 0 ? 'rgba(76,175,80,0.7)' : 'rgba(244,67,54,0.7)');
    
    // Calculate min/max for y1 axis scaling
    const minVal = Math.min(...data);
    const maxVal = Math.max(...data);
    const minPercent = (minVal / capital) * 100;
    const maxPercent = (maxVal / capital) * 100;
    
    if (window.dailyPnlBarChart && typeof window.dailyPnlBarChart.destroy === 'function') {
        window.dailyPnlBarChart.destroy();
    }
    const pnlTypeLabel = pnlType === 'gross' ? 'Gross PnL' : 'Net PnL';
    window.dailyPnlBarChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `Daily ${pnlTypeLabel} (INR)`,
                data: data,
                backgroundColor: bgColors,
                borderColor: bgColors,
                borderWidth: 1,
                yAxisID: 'y'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true },
                title: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.y;
                            const percentage = capital > 0 ? ((value / capital) * 100).toFixed(2) : '0.00';
                            return `${context.dataset.label}: ${currency.format(value)} (${percentage}%)`;
                        }
                    }
                }
            },
            scales: {
                x: { 
                    title: { display: true, text: 'Date' },
                    ticks: {
                        autoSkip: true,
                        maxTicksLimit: visibleRows.length > 50 ? 10 : 20
                    }
                },
                y: { 
                    title: { display: true, text: `${pnlTypeLabel} (INR)` },
                    position: 'left'
                },
                y1: {
                    title: { display: true, text: '% of Capital' },
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    min: minPercent,
                    max: maxPercent,
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(2) + '%';
                        }
                    }
                }
            }
        }
    });
}

// Monthly PnL Heatmap (already implemented previously)
function renderMonthlyHeatmap(monthlyMap, capital) {
    const heatmapDiv = document.getElementById("monthlyHeatmap");
    if (!monthlyMap || monthlyMap.size === 0) {
        heatmapDiv.innerHTML = '<p class="text-muted">No monthly data available.</p>';
        return;
    }
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const yearMonthPnL = {};
    monthlyMap.forEach((pnl, key) => {
        const [year, month] = key.split("-");
        if (!yearMonthPnL[year]) yearMonthPnL[year] = {};
        yearMonthPnL[year][month] = pnl;
    });
    let html = '<div class="table-responsive"><table class="table table-bordered" style="text-align:center;">';
    html += '<thead><tr><th>Year</th>' + months.map(m => `<th>${m}</th>`).join("") + '<th>Total</th></tr></thead><tbody>';
    Object.keys(yearMonthPnL).sort().forEach(year => {
        let yearTotal = 0;
        html += `<tr><td><strong>${year}</strong></td>`;
        for (let m = 1; m <= 12; m++) {
            const val = yearMonthPnL[year][m] || 0;
            yearTotal += val;
            const pct = capital > 0 ? ((val / capital) * 100).toFixed(2) : 0;
            let bgColor = '#e0f7fa';
            if (val > 0) bgColor = '#c8e6c9';
            if (val < 0) bgColor = '#ffcdd2';
            html += `<td style="background:${bgColor};font-weight:600;">${val !== 0 ? Math.round(val) : '-'}<br><span style="font-size:0.85em;">(${pct}%)</span></td>`;
        }
        const totalPct = capital > 0 ? ((yearTotal / capital) * 100).toFixed(2) : 0;
        const totalColor = yearTotal > 0 ? 'green' : yearTotal < 0 ? 'red' : 'black';
        html += `<td style="color:${totalColor};font-weight:700;">${yearTotal !== 0 ? Math.round(yearTotal) : '-'}<br><span style="font-size:0.85em;">(${totalPct}%)</span></td>`;
        html += '</tr>';
    });
    html += '</tbody></table></div>';
    heatmapDiv.innerHTML = html;
}
const TAX_CONFIG = {
    sttRateSellOptions: 0.00025, // 0.025% on sell side for options (Zerodha)
    gstRate: 0.18,
    transactionChargeNSE: 0.0000297, // 0.00297% for NSE
    sebiChargePerCrore: 10, // ₹10 per crore
    ipftChargePerCrore: 50 // ₹50 per crore for options (on premium)
};

const currency = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
});

const percent = new Intl.NumberFormat("en-IN", {
    style: "percent",
    minimumFractionDigits: 2
});

const form = document.getElementById("inputForm");
const results = document.getElementById("results");
const statsTable = document.getElementById("statsTable");
const dailySummary = document.getElementById("dailySummary");

// Global storage for analysis data
let globalAnalysis = null;
let globalCapital = 0;
let globalDailyRows = [];
let globalPnlType = 'net'; // 'net' or 'gross'
let globalProfitSharingPct = 0;

// Function to parse CSV and run analysis
function parseAndAnalyzeCSV(file) {
    const capital = Number(document.getElementById("capital").value);
    const brokeragePerSide = Number(document.getElementById("brokerage").value);
    const profitSharingPct = Number(document.getElementById("profitSharing").value) || 0;

    // Check if file is Excel (.xlsx or .xls)
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || 
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel') {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0]; // Get first sheet
                const worksheet = workbook.Sheets[sheetName];
                let rows = XLSX.utils.sheet_to_json(worksheet);
                
                // Trim whitespace from column names and values
                rows = rows.map(row => {
                    const trimmedRow = {};
                    for (const key in row) {
                        const trimmedKey = key.trim();
                        trimmedRow[trimmedKey] = typeof row[key] === 'string' ? row[key].trim() : row[key];
                    }
                    return trimmedRow;
                });
                
                console.log("Excel file parsed rows sample:", rows.slice(0, 2));
                console.log("Column names:", Object.keys(rows[0] || {}));
                
                processData(rows, capital, brokeragePerSide, profitSharingPct);
            } catch (error) {
                console.error("Excel parse error:", error);
                alert("Failed to parse Excel file: " + error.message);
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        // Parse as CSV
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (result) => {
                console.log("CSV parsed rows sample:", result.data.slice(0, 2));
                processData(result.data, capital, brokeragePerSide, profitSharingPct);
            },
            error: (error) => {
                console.error("CSV parse error:", error);
                alert("Failed to parse CSV file: " + error.message);
            }
        });
    }
}

function processData(rows, capital, brokeragePerSide, profitSharingPct) {
    // Filter out empty rows
    rows = rows.filter(row => {
        return row && Object.values(row).some(val => val !== null && val !== undefined && val !== '');
    });
    
    if (rows.length === 0) {
        alert("No data found in file.");
        return;
    }
    
    const analysis = analyzeTrades(rows, capital, brokeragePerSide, profitSharingPct);
    
    // Store globally
    globalAnalysis = analysis;
    globalCapital = capital;
    globalDailyRows = analysis.dailyRows;
    globalProfitSharingPct = profitSharingPct;
    
    // Set date range from data
    if (globalDailyRows.length > 0) {
        const dates = globalDailyRows.map(r => r.date).sort((a, b) => a - b);
        const minDate = dates[0];
        const maxDate = dates[dates.length - 1];
        
        document.getElementById("dateFrom").value = minDate.toISOString().split('T')[0];
        document.getElementById("dateTo").value = maxDate.toISOString().split('T')[0];
        const dateRangeDisplay = document.getElementById("dateRangeDisplay");
        if (dateRangeDisplay) {
            dateRangeDisplay.textContent = `${minDate.toLocaleDateString("en-IN")} → ${maxDate.toLocaleDateString("en-IN")}`;
        }
        
        // Populate month filter
        populateMonthFilter(globalDailyRows);
    }
    
    console.log("DailyRows for Day Wise Breakup:", analysis.dailyRows);
    console.log("MonthlyMap for Monthly Breakup:", analysis.monthlyMap);
    console.log("Stats for Monthly Breakup:", analysis.stats);
    
    renderSummary(analysis, capital);
    renderTaxBreakdown(analysis, capital, globalPnlType);
    renderStats(analysis.stats, capital, analysis.winDays, analysis.lossDays);
    renderMonthlyHeatmap(analysis.monthlyMap, capital);
    renderDayWiseBreakup(analysis.dailyRows, capital, globalPnlType);
    renderDailyPnlBarChart(analysis.dailyRows, globalCapital, globalPnlType);
    renderDailySummary(analysis.dailyRows);
    results.style.display = "block";
    
    // Setup filters
    setupDateFilters();
}

// Populate month filter with unique months from data
function populateMonthFilter(dailyRows) {
    const monthsSet = new Set();
    dailyRows.forEach(row => {
        if (row.date instanceof Date && !isNaN(row.date)) {
            const year = row.date.getFullYear();
            const month = row.date.getMonth() + 1;
            const monthKey = `${year}-${String(month).padStart(2, '0')}`;
            monthsSet.add(monthKey);
        }
    });
    
    const months = Array.from(monthsSet).sort();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const container = document.getElementById('monthFilterContainer');
    container.innerHTML = '<button type="button" class="btn btn-outline-primary active" id="monthAll" data-month="All">All</button>';
    
    months.forEach(monthKey => {
        const [year, monthNum] = monthKey.split('-');
        const monthName = monthNames[parseInt(monthNum) - 1];
        const label = `${monthName} ${year}`;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-outline-primary';
        btn.setAttribute('data-month', monthKey);
        btn.textContent = label;
        container.appendChild(btn);
    });
}

// Setup date and day filters
function setupDateFilters() {
    // Only setup once
    if (window.filtersSetup) return;
    window.filtersSetup = true;
    
    // Day toggle buttons
    const dayButtons = document.querySelectorAll('[data-day]');
    dayButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const dayValue = this.getAttribute('data-day');
            if (dayValue === 'All') {
                dayButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            } else {
                const allBtn = document.querySelector('[data-day="All"]');
                if (allBtn) allBtn.classList.remove('active');
                this.classList.toggle('active');
                const anyDayActive = Array.from(dayButtons).some(b => b.getAttribute('data-day') !== 'All' && b.classList.contains('active'));
                if (!anyDayActive && allBtn) {
                    allBtn.classList.add('active');
                }
            }
            applyFilters();
        });
    });
    
    // Month toggle buttons (delegated event handling since they're dynamic)
    document.getElementById('monthFilterContainer').addEventListener('click', function(e) {
        if (e.target.tagName === 'BUTTON' && e.target.hasAttribute('data-month')) {
            const monthValue = e.target.getAttribute('data-month');
            const monthButtons = document.querySelectorAll('[data-month]');
            
            if (monthValue === 'All') {
                monthButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            } else {
                const allBtn = document.querySelector('[data-month="All"]');
                if (allBtn) allBtn.classList.remove('active');
                e.target.classList.toggle('active');
                const anyMonthActive = Array.from(monthButtons).some(b => b.getAttribute('data-month') !== 'All' && b.classList.contains('active'));
                if (!anyMonthActive && allBtn) {
                    allBtn.classList.add('active');
                }
            }
            applyFilters();
        }
    });
    
    // PnL type toggle buttons
    const pnlButtons = document.querySelectorAll('[data-pnl]');
    pnlButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            pnlButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            globalPnlType = this.getAttribute('data-pnl');
            console.log('PnL Type Changed to:', globalPnlType);
            applyFilters();
        });
    });
    
    // Date range inputs
    document.getElementById('dateFrom').addEventListener('change', applyFilters);
    document.getElementById('dateTo').addEventListener('change', applyFilters);
}

// Apply filters and recalculate statistics
function applyFilters() {
    console.log('applyFilters called, globalPnlType:', globalPnlType);
    const dateFrom = new Date(document.getElementById('dateFrom').value);
    const dateTo = new Date(document.getElementById('dateTo').value);
    
    // Get selected days
    const selectedDays = [];
    document.querySelectorAll('[data-day].active').forEach(btn => {
        selectedDays.push(btn.getAttribute('data-day'));
    });
    const isAllDaysSelected = selectedDays.includes('All');
    const effectiveDays = isAllDaysSelected ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] : selectedDays;
    
    // Get selected months
    const selectedMonths = [];
    document.querySelectorAll('[data-month].active').forEach(btn => {
        selectedMonths.push(btn.getAttribute('data-month'));
    });
    const isAllMonthsSelected = selectedMonths.includes('All');
    
    // Filter daily rows
    const filteredRows = globalDailyRows.filter(row => {
        const dateMatch = row.date >= dateFrom && row.date <= dateTo;
        const dayName = row.date.toLocaleDateString('en-US', { weekday: 'short' });
        const dayMatch = effectiveDays.includes(dayName);
        
        let monthMatch = true;
        if (!isAllMonthsSelected && selectedMonths.length > 0) {
            const year = row.date.getFullYear();
            const month = row.date.getMonth() + 1;
            const monthKey = `${year}-${String(month).padStart(2, '0')}`;
            monthMatch = selectedMonths.includes(monthKey);
        }
        
        return dateMatch && dayMatch && monthMatch;
    });
    
    // Recalculate statistics from filtered data
    const filteredAnalysis = recalculateStats(filteredRows, globalCapital, globalPnlType, globalProfitSharingPct);
    
    // Re-render with filtered data
    renderSummary(filteredAnalysis, globalCapital);
    renderTaxBreakdown(filteredAnalysis, globalCapital, globalPnlType);
    renderStats(filteredAnalysis.stats, globalCapital, filteredAnalysis.winDays, filteredAnalysis.lossDays);
    renderDayWiseBreakup(filteredRows, globalCapital, globalPnlType);
    renderMonthlyHeatmap(filteredAnalysis.monthlyMap, globalCapital);
    renderDailyPnlBarChart(filteredRows, globalCapital, globalPnlType);
    renderDailySummary(filteredRows);
}

// Recalculate statistics from filtered daily rows
function recalculateStats(dailyRows, capital, pnlType = 'net', profitSharingPct = 0) {
    const totalDays = dailyRows.length;
    const totalGross = dailyRows.reduce((sum, row) => sum + row.grossPnl, 0);
    const totalBrokerage = dailyRows.reduce((sum, row) => sum + row.brokerage, 0);
    const totalStt = dailyRows.reduce((sum, row) => sum + row.stt, 0);
    const totalTransactionCharge = dailyRows.reduce((sum, row) => sum + row.transactionCharge, 0);
    const totalSebiCharge = dailyRows.reduce((sum, row) => sum + row.sebiCharge, 0);
    const totalIpftCharge = dailyRows.reduce((sum, row) => sum + row.ipftCharge, 0);
    const totalGst = dailyRows.reduce((sum, row) => sum + row.gst, 0);
    const totalCharges = dailyRows.reduce((sum, row) => sum + row.totalCost, 0);
    const totalProfitSharing = dailyRows.reduce((sum, row) => sum + (row.profitSharing || 0), 0);
    const totalNet = dailyRows.reduce((sum, row) => sum + row.netPnl, 0);
    
    // Choose PnL based on type
    const usePnlField = pnlType === 'gross' ? 'grossPnl' : 'netPnl';
    const totalPnl = pnlType === 'gross' ? totalGross : totalNet;
    
    const winDays = dailyRows.filter(row => row[usePnlField] > 0);
    const lossDays = dailyRows.filter(row => row[usePnlField] < 0);
    
    const maxProfitDay = Math.max(...dailyRows.map(row => row[usePnlField]), 0);
    const maxLossDay = Math.min(...dailyRows.map(row => row[usePnlField]), 0);
    
    const avgDaily = totalDays > 0 ? totalPnl / totalDays : 0;
    const avgProfitDay = winDays.length > 0 ? winDays.reduce((sum, row) => sum + row[usePnlField], 0) / winDays.length : 0;
    const avgLossDay = lossDays.length > 0 ? lossDays.reduce((sum, row) => sum + row[usePnlField], 0) / lossDays.length : 0;
    
    const totalTradesCount = dailyRows.reduce((sum, row) => sum + row.trades, 0);
    const avgTradesPerDay = totalDays > 0 ? totalTradesCount / totalDays : 0;
    
    // Monthly calculations
    const monthlyMap = new Map();
    dailyRows.forEach(row => {
        if (row.date instanceof Date && !isNaN(row.date)) {
            const year = row.date.getFullYear();
            const month = row.date.getMonth() + 1;
            const key = `${year}-${month}`;
            if (!monthlyMap.has(key)) {
                monthlyMap.set(key, 0);
            }
            monthlyMap.set(key, monthlyMap.get(key) + row[usePnlField]);
        }
    });
    const monthlyProfit = Array.from(monthlyMap.values());
    const avgMonthlyProfit = monthlyProfit.length > 0 ? monthlyProfit.reduce((sum, val) => sum + val, 0) / monthlyProfit.length : 0;
    const totalRoi = capital > 0 ? totalPnl / capital : 0;
    const avgMonthlyRoi = capital > 0 ? avgMonthlyProfit / capital : 0;
    
    const maxDrawdown = calculateMaxDrawdown(dailyRows, capital, pnlType);
    
    // Calculate streaks
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    
    dailyRows.forEach(row => {
        if (row[usePnlField] > 0) {
            currentWinStreak++;
            currentLossStreak = 0;
            maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
        } else if (row[usePnlField] < 0) {
            currentLossStreak++;
            currentWinStreak = 0;
            maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
        } else {
            currentWinStreak = 0;
            currentLossStreak = 0;
        }
    });
    
    const expectancy = totalTradesCount > 0 ? totalPnl / totalTradesCount : 0;
    
    const winDaysPct = totalDays > 0 ? ((winDays.length / totalDays) * 100).toFixed(2) : "0.00";
    const lossDaysPct = totalDays > 0 ? ((lossDays.length / totalDays) * 100).toFixed(2) : "0.00";
    const avgBrokeragePerDay = totalDays > 0 ? (totalBrokerage / totalDays) : 0;

    const stats = [
        { name: "Capital Required", value: currency.format(capital) },
        { name: "Total Trading Days", value: totalDays },
        { name: "Win Days", value: `${winDays.length}<br><span style="font-size:0.75em;color:#666;">(${winDaysPct}%)</span>` },
        { name: "Loss Days", value: `${lossDays.length}<br><span style="font-size:0.75em;color:#666;">(${lossDaysPct}%)</span>` },
        { name: "Avg Monthly Profit", value: currency.format(avgMonthlyProfit) },
        { name: "Total Profit", value: currency.format(totalPnl) },
        { name: "Avg Monthly ROI", value: percent.format(avgMonthlyRoi) },
        { name: "Total ROI", value: percent.format(totalRoi) },
        { name: "Max Profit in a Day", value: currency.format(maxProfitDay) },
        { name: "Max Loss in a Day", value: currency.format(maxLossDay) },
        { name: "Avg Profit/Loss Daily", value: currency.format(avgDaily) },
        { name: "Avg Profit on Profit Days", value: currency.format(avgProfitDay) },
        { name: "Avg Loss on Loss Days", value: currency.format(avgLossDay) },
        { name: "Avg Trades (Buy + Sell) per Day", value: `${avgTradesPerDay.toFixed(2)} (${currency.format(avgBrokeragePerDay)})` },
        { name: "Total Trading Cost", value: currency.format(totalCharges) },
        { name: "Max Drawdown", value: currency.format(maxDrawdown.amount) },
        { name: "Max Winning Streak", value: `${maxWinStreak} Days` },
        { name: "Max Losing Streak", value: `${maxLossStreak} Days` }
    ];
    
    return {
        stats,
        dailyRows,
        monthlyMap,
        winDays,
        lossDays,
        totalNet,
        totalBrokerage,
        totalCharges,
        totalStt,
        totalTransactionCharge,
        totalSebiCharge,
        totalIpftCharge,
        totalGst,
        totalGrossPnl: totalGross,
        totalProfitSharing
    };
}

// Auto-load CSV from same directory on page load - DISABLED
// window.addEventListener('load', () => {
//     const xhr = new XMLHttpRequest();
//     xhr.open('GET', 'IPE.csv', true);
//     xhr.onload = function() {
//         if (xhr.status === 200) {
//             const blob = new Blob([xhr.responseText], { type: 'text/csv' });
//             const file = new File([blob], 'IPE.csv', { type: 'text/csv' });
//             
//             // Set file input
//             const dataTransfer = new DataTransfer();
//             dataTransfer.items.add(file);
//             document.getElementById("csvFile").files = dataTransfer.files;
//             document.getElementById("csvFile").value = 'IPE.csv';
//             console.log("CSV file loaded automatically!");
//             
//             // Auto-analyze
//             parseAndAnalyzeCSV(file);
//         }
//     };
//     xhr.onerror = function() {
//         console.log("IPE.csv not found in directory. Please upload manually.");
//     };
//     xhr.send();
// });

form.addEventListener("submit", (event) => {
    event.preventDefault();

    const fileInput = document.getElementById("csvFile");

    if (!fileInput.files || fileInput.files.length === 0) {
        alert("Please upload a CSV file.");
        return;
    }

    const file = fileInput.files[0];
    parseAndAnalyzeCSV(file);
});

function analyzeTrades(rows, capital, brokeragePerSide, profitSharingPct) {
    const dailyMap = new Map();
    let totalGrossPnl = 0;
    let totalTrades = 0;
    let totalSellTurnover = 0;
    let totalBuyTurnover = 0;

    rows.forEach((row) => {
        // Normalize column names - handle both Title Case and lowercase_with_underscores
        const entryDateValue = row["Entry Date"] || row["entry_date"];
        const amountValue = row["Amount"] || row["amount"];
        
        const entryDate = parseDate(entryDateValue);
        if (!entryDate) {
            console.log("Skipping row with invalid date:", entryDateValue);
            return;
        }
        const dateKey = entryDate.toISOString().slice(0, 10);
        const amount = parseFloat(String(amountValue || 0).replace(/,/g, '')) || 0;
        
        const isSell = amount < 0; // Negative = sell, positive = buy
        
        // Reverse the amount for PnL calculation (negate it)
        const pnl = -amount; // Negate to reverse the sign
        
        // Track total PnL and turnover
        totalGrossPnl += pnl; // Use negated amount
        totalTrades += 1;
        
        if (isSell) {
            totalSellTurnover += Math.abs(amount);
        } else {
            totalBuyTurnover += Math.abs(amount);
        }

        if (!dailyMap.has(dateKey)) {
            dailyMap.set(dateKey, {
                date: entryDate,
                grossPnl: 0,
                stt: 0,
                brokerage: 0,
                transactionCharge: 0,
                sebiCharge: 0,
                ipftCharge: 0,
                gst: 0,
                totalCost: 0,
                trades: 0
            });
        }

        const bucket = dailyMap.get(dateKey);
        bucket.grossPnl += pnl; // Use negated amount
        bucket.trades += 1;
    });

    // Calculate total charges
    const totalBrokerage = totalTrades * brokeragePerSide;
    
    // STT: 0.025% on sell side only
    const totalStt = totalSellTurnover * TAX_CONFIG.sttRateSellOptions;
    
    // Transaction charges: 0.00297% on all turnover
    const totalTransactionCharge = (totalBuyTurnover + totalSellTurnover) * TAX_CONFIG.transactionChargeNSE;
    
    // SEBI charges: ₹10 per crore
    const totalSebiCharge = ((totalBuyTurnover + totalSellTurnover) / 10000000) * TAX_CONFIG.sebiChargePerCrore;
    
    // IPFT charges: ₹50 per crore on premium value
    const totalIpftCharge = ((totalBuyTurnover + totalSellTurnover) / 10000000) * TAX_CONFIG.ipftChargePerCrore;
    
    // GST: 18% on (brokerage + transaction charges + SEBI charges)
    const totalGst = (totalBrokerage + totalTransactionCharge + totalSebiCharge) * TAX_CONFIG.gstRate;
    
    const totalTax = totalStt + totalTransactionCharge + totalSebiCharge + totalIpftCharge + totalGst;
    const totalCharges = totalBrokerage + totalTax;
    
    // Calculate profit sharing from gross PnL
    const totalProfitSharing = (profitSharingPct / 100) * totalGrossPnl;

    const dailyRows = Array.from(dailyMap.values())
        .sort((a, b) => a.date - b.date)
        .map((entry) => {
            // Distribute charges proportionally
            const entryTrades = entry.trades;
            const brokeragePercentage = totalTrades > 0 ? entryTrades / totalTrades : 0;
            const entryCost = (totalBrokerage + totalTax) * brokeragePercentage;
            const entryProfitSharing = totalProfitSharing * brokeragePercentage;
            
            return {
                date: entry.date,
                grossPnl: entry.grossPnl,
                brokerage: totalBrokerage * brokeragePercentage,
                stt: totalStt * brokeragePercentage,
                transactionCharge: totalTransactionCharge * brokeragePercentage,
                sebiCharge: totalSebiCharge * brokeragePercentage,
                ipftCharge: totalIpftCharge * brokeragePercentage,
                gst: totalGst * brokeragePercentage,
                totalCost: entryCost,
                profitSharing: entryProfitSharing,
                netPnl: entry.grossPnl - entryCost - entryProfitSharing,
                trades: entryTrades
            };
        });

    const totalDays = dailyRows.length;
    const totalTradesCount = dailyRows.reduce((sum, row) => sum + row.trades, 0);
    const totalGross = dailyRows.reduce((sum, row) => sum + row.grossPnl, 0);
    const totalCostDaily = dailyRows.reduce((sum, row) => sum + row.totalCost, 0);
    const totalNet = dailyRows.reduce((sum, row) => sum + row.netPnl, 0);

    const winDays = dailyRows.filter((row) => row.netPnl > 0);
    const lossDays = dailyRows.filter((row) => row.netPnl < 0);

    const maxProfitDay = Math.max(...dailyRows.map((row) => row.netPnl), 0);
    const maxLossDay = Math.min(...dailyRows.map((row) => row.netPnl), 0);

    const avgDaily = totalDays > 0 ? totalNet / totalDays : 0;
    const avgProfitDay = winDays.length > 0 ? winDays.reduce((sum, row) => sum + row.netPnl, 0) / winDays.length : 0;
    const avgLossDay = lossDays.length > 0 ? lossDays.reduce((sum, row) => sum + row.netPnl, 0) / lossDays.length : 0;

    const avgTradesPerDay = totalDays > 0 ? totalTradesCount / totalDays : 0;

    const monthlyMap = new Map();
    dailyRows.forEach((row) => {
        if (row.date instanceof Date && !isNaN(row.date)) {
            const year = row.date.getFullYear();
            const month = row.date.getMonth() + 1;
            const key = `${year}-${month}`;
            if (!monthlyMap.has(key)) {
                monthlyMap.set(key, 0);
            }
            monthlyMap.set(key, monthlyMap.get(key) + row.netPnl);
        }
    });
    const monthlyProfit = Array.from(monthlyMap.values());
    const avgMonthlyProfit = monthlyProfit.length > 0 ? monthlyProfit.reduce((sum, val) => sum + val, 0) / monthlyProfit.length : 0;
    const totalRoi = capital > 0 ? totalNet / capital : 0;
    const avgMonthlyRoi = capital > 0 ? avgMonthlyProfit / capital : 0;

    const maxDrawdown = calculateMaxDrawdown(dailyRows, capital);
    
    // Calculate max winning and losing streaks
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    
    dailyRows.forEach(row => {
        if (row.netPnl > 0) {
            currentWinStreak++;
            currentLossStreak = 0;
            maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
        } else if (row.netPnl < 0) {
            currentLossStreak++;
            currentWinStreak = 0;
            maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
        } else {
            currentWinStreak = 0;
            currentLossStreak = 0;
        }
    });
    
    const winDaysPct = totalDays > 0 ? ((winDays.length / totalDays) * 100).toFixed(2) : "0.00";
    const lossDaysPct = totalDays > 0 ? ((lossDays.length / totalDays) * 100).toFixed(2) : "0.00";
    const avgBrokeragePerDay = totalDays > 0 ? (totalBrokerage / totalDays) : 0;

    const stats = [
        { name: "Capital Required", value: currency.format(capital) },
        { name: "Total Trading Days", value: totalDays },
        { name: "Win Days", value: `${winDays.length} (${winDaysPct}%)` },
        { name: "Loss Days", value: `${lossDays.length} (${lossDaysPct}%)` },
        { name: "Avg Monthly Profit", value: currency.format(avgMonthlyProfit) },
        { name: "Total Profit", value: currency.format(totalNet) },
        { name: "Avg Monthly ROI", value: percent.format(avgMonthlyRoi) },
        { name: "Total ROI", value: percent.format(totalRoi) },
        { name: "Max Profit in a Day", value: currency.format(maxProfitDay) },
        { name: "Max Loss in a Day", value: currency.format(maxLossDay) },
        { name: "Avg Profit/Loss Daily", value: currency.format(avgDaily) },
        { name: "Avg Profit on Profit Days", value: currency.format(avgProfitDay) },
        { name: "Avg Loss on Loss Days", value: currency.format(avgLossDay) },
        { name: "Avg Trades (Buy + Sell) per Day", value: `${avgTradesPerDay.toFixed(2)} (${currency.format(avgBrokeragePerDay)} Brokerage)` },
        { name: "Total Trading Cost", value: currency.format(totalCharges) },
        { name: "Max Drawdown", value: currency.format(maxDrawdown.amount) },
        { name: "Max Winning Streak", value: `${maxWinStreak} Days` },
        { name: "Max Losing Streak", value: `${maxLossStreak} Days` }
    ];

    return { stats, dailyRows, monthlyMap, winDays, lossDays, totalNet, totalBrokerage: totalBrokerage, totalCharges: totalCharges, totalStt, totalTransactionCharge, totalSebiCharge, totalIpftCharge, totalGst, totalGrossPnl, totalProfitSharing };
}

function calculateMaxDrawdown(dailyRows, capital, pnlType = 'net') {
    const usePnlField = pnlType === 'gross' ? 'grossPnl' : 'netPnl';
    let peak = 0;
    let maxDrawdown = 0;
    let cumulative = 0;

    dailyRows.forEach((row) => {
        cumulative += row[usePnlField];
        if (cumulative > peak) {
            peak = cumulative;
        }
        const drawdown = peak - cumulative;
        if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown;
        }
    });

    const percent = capital > 0 ? maxDrawdown / capital : 0;
    return { amount: maxDrawdown, percent };
}

function renderSummary(analysis, capital) {
    document.getElementById("totalGrossPnlDisplay").textContent = currency.format(analysis.totalGrossPnl);
    const grossPct = capital > 0 ? ((analysis.totalGrossPnl / capital) * 100).toFixed(2) : "0.00";
    document.getElementById("grossPnlCapital").textContent = `(${grossPct}%)`;
    
    document.getElementById("totalBrokerageDisplay").textContent = currency.format(analysis.totalBrokerage);
    document.getElementById("brokerageBreakdown").textContent = `(${Math.round(analysis.dailyRows.reduce((sum, r) => sum + r.trades, 0))} trades × ${document.getElementById("brokerage").value})`;
    const brokeragePct = capital > 0 ? ((analysis.totalBrokerage / capital) * 100).toFixed(2) : "0.00";
    document.getElementById("brokerageCapital").textContent = `(${brokeragePct}%)`;

    const totalTaxes = Math.max(analysis.totalCharges - analysis.totalBrokerage, 0);
    document.getElementById("totalTaxesDisplay").textContent = currency.format(totalTaxes);
    const taxesPct = capital > 0 ? ((totalTaxes / capital) * 100).toFixed(2) : "0.00";
    document.getElementById("taxesCapital").textContent = `(${taxesPct}%)`;
    
    document.getElementById("totalChargesDisplay").textContent = currency.format(analysis.totalCharges);
    const chargesPct = capital > 0 ? ((analysis.totalCharges / capital) * 100).toFixed(2) : "0.00";
    document.getElementById("chargesCapital").textContent = `(${chargesPct}%)`;
    
    document.getElementById("profitSharingDisplay").textContent = currency.format(analysis.totalProfitSharing || 0);
    const profitSharingPct = capital > 0 ? ((analysis.totalProfitSharing / capital) * 100).toFixed(2) : "0.00";
    document.getElementById("profitSharingCapital").textContent = `(${profitSharingPct}%)`;
    
    document.getElementById("totalNetPnlDisplay").textContent = currency.format(analysis.totalNet);
    const netPct = capital > 0 ? ((analysis.totalNet / capital) * 100).toFixed(2) : "0.00";
    document.getElementById("netPnlCapital").textContent = `(${netPct}%)`;
    
    // Color code net PnL
    const netElement = document.getElementById("totalNetPnlDisplay");
    netElement.style.color = analysis.totalNet >= 0 ? "green" : "red";
    
    // Calculate Gross to Net PnL %
    const grossToNetPct = analysis.totalGrossPnl > 0 ? ((analysis.totalNet / analysis.totalGrossPnl) * 100).toFixed(2) : "0.00";
    document.getElementById("grossToNetPctDisplay").textContent = grossToNetPct + "%";
    document.getElementById("grossToNetNote").textContent = `(Retention Rate)`;
    
    // Color code Gross to Net %
    const grossToNetElement = document.getElementById("grossToNetPctDisplay");
    grossToNetElement.style.color = parseFloat(grossToNetPct) >= 80 ? "green" : parseFloat(grossToNetPct) >= 50 ? "orange" : "red";
}

function renderTaxBreakdown(analysis, capital, pnlType = 'net') {
    const taxBreakdownDiv = document.getElementById("taxBreakdown");

    // Add percentage info for each tax category
    const taxes = [
        { label: "Brokerage", value: analysis.totalBrokerage },
        { label: "STT", value: analysis.totalStt },
        { label: "Transaction", value: analysis.totalTransactionCharge },
        { label: "SEBI", value: analysis.totalSebiCharge },
        { label: "IPFT", value: analysis.totalIpftCharge },
        { label: "GST", value: analysis.totalGst }
    ];

    const totalTax = taxes.reduce((sum, t) => sum + t.value, 0);
    const capitalPct = capital > 0 ? ((totalTax / capital) * 100).toFixed(2) : "0.00";

    const html = `
        <div class="tax-cards">
            ${taxes.map(tax => {
                const taxCapitalPct = capital > 0 ? ((tax.value / capital) * 100).toFixed(2) : "0.00";
                return `
                    <div class="tax-card">
                        <strong>${tax.label}</strong>
                        <span>${currency.format(tax.value)}</span><br>
                        <small style="color:#1e40af;">(${taxCapitalPct}%)</small>
                    </div>
                `;
            }).join("")}
            <div class="tax-card" style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);border-color:#3b82f6;">
                <strong style="color:#1e40af;">Total</strong>
                <span style="color:#1e40af;">${currency.format(totalTax)}</span><br>
                <small style="color:#1e40af;">(${capitalPct}%)</small>
            </div>
        </div>
    `;

    taxBreakdownDiv.innerHTML = html;
}

function renderStats(stats, capital, winDays, lossDays) {
    // Card color logic
    function getCardClass(name) {
        if (/profit|win|expectancy|return|margin|overall|avg monthly profit|total profit|avg profit|trading/i.test(name)) return 'stat-green';
        if (/loss|drawdown|mdd|losing/i.test(name)) return 'stat-red';
        if (/avg|monthly|day|roi|win rate|cost/i.test(name)) return 'stat-yellow';
        if (/max profit|max loss|capital|streak|trades/i.test(name)) return 'stat-blue';
        return 'stat-grey';
    }

    // Format value with capital % if applicable
    function formatStatValue(stat, capital) {
        let displayValue = stat.value;
        const valueStr = String(stat.value);
        const numValue = parseFloat(valueStr.replace(/[^0-9.-]/g, ''));
        
        // Skip adding percentage for Win Days and Loss Days as they already have it in the value
        if (valueStr.includes('<span') || /win days|loss days/i.test(stat.name)) {
            return displayValue;
        }
        
        if (!isNaN(numValue) && capital > 0 && /profit|loss|charge|drawdown|brokerage|expectancy/i.test(stat.name)) {
            const capitalPct = ((numValue / capital) * 100).toFixed(2);
            displayValue = `${stat.value}<br><span style="font-size:0.85em;color:#666;">(${capitalPct}%)</span>`;
        }
        return displayValue;
    }

    const allStats = stats;

    statsTable.innerHTML = `
        <div class="stats-grid">
            ${allStats.map(item => {
                const htmlValue = formatStatValue(item, capital);
                return `
                <div class="stat-card ${getCardClass(item.name)}">
                    <div class="stat-label">${item.name}</div>
                    <div class="stat-value" style="font-size:1.2rem;">${htmlValue}</div>
                </div>
            `}).join("")}
        </div>
    `;
}

function renderDailySummary(dailyRows) {
    const sortedRows = [...dailyRows].sort((a, b) => b.date - a.date);
    const rows = sortedRows.map((row) => {
        const netPnlColor = row.netPnl >= 0 ? 'green' : 'red';
        const otherCharges = row.transactionCharge + row.sebiCharge + row.ipftCharge + row.stt + row.gst;
        const profitSharing = row.profitSharing || 0;
        const totalDeductions = row.totalCost + profitSharing;
        const costPctValue = row.grossPnl !== 0 ? (totalDeductions / Math.abs(row.grossPnl)) * 100 : 0;
        const costPctText = costPctValue.toFixed(2);
        const barWidth = Math.min(costPctValue, 100);
        const barColor = costPctValue > 100 ? '#dc2626' : '#3b82f6';
        const dayName = row.date.toLocaleDateString('en-US', { weekday: 'short' });
        return `
            <tr>
                <td>${row.date.toLocaleDateString("en-IN")}</td>
                <td>${dayName}</td>
                <td>${currency.format(row.grossPnl)}</td>
                <td>${currency.format(row.brokerage)}</td>
                <td>${currency.format(otherCharges)}</td>
                <td>${currency.format(row.totalCost)}</td>
                <td>${currency.format(profitSharing)}</td>
                <td>
                    <div style="font-weight:600;">${costPctText}%</div>
                    <div style="height:6px;background:#e5e7eb;border-radius:4px;overflow:hidden;margin-top:4px;">
                        <div style="height:100%;width:${barWidth}%;background:${barColor};"></div>
                    </div>
                </td>
                <td style="color:${netPnlColor}; font-weight:600;">${currency.format(row.netPnl)}</td>
                <td>${row.trades}</td>
            </tr>
        `;
    }).join(" ");

    dailySummary.innerHTML = `
        <table class="table table-bordered table-striped">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Day</th>
                    <th>Gross PnL</th>
                    <th>Brokerage</th>
                    <th>Other Charges</th>
                    <th>Total Cost</th>
                    <th>Profit Sharing</th>
                    <th>Total Deductions %</th>
                    <th>Net PnL</th>
                    <th>Trades</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
}

function parseDate(input) {
    if (!input) {
        return null;
    }
    
    // Handle Excel serial date (number)
    if (typeof input === 'number') {
        // Excel serial date: days since 1900-01-01
        const excelEpoch = new Date(1900, 0, 1);
        const jsDate = new Date(excelEpoch.getTime() + (input - 1) * 24 * 60 * 60 * 1000);
        return jsDate;
    }
    
    const value = String(input).trim();
    // Try YYYY-MM-DD first
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return new Date(value);
    }
    // Try DD-MMM-YY or DD-MMM-YYYY
    const parts = value.split("-");
    if (parts.length === 3) {
        const [day, mon, year] = parts;
        const months = {
            jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
            jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
        };
        const monthIndex = months[mon.toLowerCase()];
        if (monthIndex !== undefined) {
            let yearNumber = Number(year);
            if (year.length === 2) {
                yearNumber = yearNumber > 50 ? 1900 + yearNumber : 2000 + yearNumber;
            }
            return new Date(yearNumber, monthIndex, Number(day));
        }
    }
    // Fallback: try Date.parse
    const d = Date.parse(value);
    if (!isNaN(d)) {
        return new Date(d);
    }
    return null;
}
