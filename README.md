# 📊 Trading Statistics Dashboard

A professional **web-based trading analysis tool** that helps traders analyze their P&L, calculate charges, and track trading performance metrics.

## 🚀 Features

✅ **CSV/XLSX/XLS Support** - Upload trade data in multiple formats  
✅ **Real-time Analysis** - Instant P&L calculations and metrics  
✅ **Gross to Net Tracking** - Monitor profit retention rate  
✅ **Date Range Filtering** - Analyze specific trading periods  
✅ **Day-wise Breakdown** - Performance by day of week  
✅ **Monthly Heatmap** - Visual monthly P&L analysis  
✅ **Tax Breakdown** - Detailed charges & tax calculations  
✅ **Statistics Cards** - Win/Loss days, averages, streaks  
✅ **Interactive Charts** - Daily P&L bar chart with dual-axis  
✅ **Responsive Design** - Works on desktop, tablet, mobile  

## 📋 How to Use

1. **Visit the Dashboard**: Open `index.html` in your browser
2. **Enter Your Details**:
   - Capital Required (amount you trade with)
   - Brokerage per Trade (your trading cost per order)
3. **Upload Your File** (CSV, XLSX, or XLS):
   - Required columns: `entry_date`, `quantity`, `price`, `amount`, `txn_type`
   - Example: "Daily Safe Sensex - 10 Prem.csv"
4. **Click Analyze** - Dashboard generates all metrics
5. **Filter & Explore**:
   - Date range filter
   - Day of week filter (Mon-Fri)
   - PnL type toggle (Net/Gross)

## 📊 Dashboard Sections

### Summary Cards
- **Gross PnL** - Total profit before charges
- **Brokerage** - Trading costs
- **Taxes** - STT, Transaction charges, SEBI, GST, IPFT
- **Net PnL** - Final profit after all charges
- **Gross to Net %** - Retention rate

### Statistics
- Win/Loss days with percentages
- Average profit/loss metrics
- Max drawdown
- Winning/Losing streaks
- ROI calculations

### Charts & Tables
- Daily P&L bar chart (INR and % of capital)
- Day-wise P&L breakdown
- Monthly heatmap
- Daily summary table with cost analysis

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, Bootstrap 5
- **Charts**: Chart.js
- **Data Parsing**: Papa Parse (CSV), SheetJS (Excel)
- **JavaScript**: Vanilla JS (no frameworks)

## 📁 File Structure

```
trading-dashboard/
├── index.html        # Main dashboard UI
├── assets/
│   └── js/
│       └── dashboard.js   # All business logic
├── samples/          # Sample data files (ignored by git)
└── README.md         # This file
```

## 💾 CSV File Format

Your trade data should have these columns:

| Column | Type | Description |
|--------|------|-------------|
| entry_date | Date | Trade date (DD-MMM-YY format) |
| quantity | Number | Trade quantity |
| price | Number | Trade price |
| amount | Number | Transaction value (negative for sells) |
| txn_type | Text | 'B' for Buy, 'S' for Sell |

**Example Row:**
```
29-Sep-25,12:29:20 PM,-40,42.35,-1694,S
```

## 🔧 Configuration

Edit these values in the input form:
- **Capital Required**: Your trading capital
- **Brokerage per Trade**: Cost per transaction

## 🌐 Hosting Options

### Free Hosting
- **GitHub Pages** - github.com/yourusername/yourusername.github.io
- **Netlify** - netlify.com (connect your repo)
- **Vercel** - vercel.com

### Steps to Deploy
1. Create GitHub repository `yourusername.github.io`
2. Upload `index.html` and `dashboard.js`
3. Your dashboard is live at `https://yourusername.github.io`

## 📈 Key Metrics Explained

- **Gross PnL**: Total profit from all trades
- **Net PnL**: Gross PnL minus all charges
- **Gross to Net %**: (Net PnL / Gross PnL) × 100 - Higher is better
- **Cost %**: (Total Charges / Gross PnL) × 100 - Lower is better
- **ROI**: Return on Investment percentage
- **Max Drawdown**: Largest peak-to-trough decline

## 🎯 Target Users

- Day traders
- Options traders
- Swing traders
- Trading analysts
- Risk managers

## 📝 Notes

- All calculations are done **client-side** (your data is private)
- No server needed - works offline
- Mobile-friendly interface
- Real-time filtering and updates

## 📧 Support

For issues or suggestions, please visit the GitHub repository and create an issue.

---

**Built with ❤️ for traders**
