// ReportsPage.jsx (ESM) - FINAL VERSION WITH PDF EXPORT
import React, { useState, useEffect } from 'react';
import api from '../../utils/api.js';
import { FaDownload, FaChartBar, FaBoxes, FaCalendarAlt } from 'react-icons/fa';
// Dynamic import for PDF libraries (avoids crashing if not installed)
import('jspdf').then(m => { window.jsPDF = m.jsPDF; });
import 'jspdf-autotable';


const convertJsonToCsv = (reportData, reportType) => {
    if (!reportData) return '';
    const dataArray = reportType === 'SALES_SUMMARY' ? reportData.salesByProduct : reportData.stockSummary;
    const headers = Object.keys(dataArray[0] || {});
    
    const csvContent = [
        headers.join(','), 
        ...dataArray.map(row => headers.map(fieldName => JSON.stringify(row[fieldName])).join(','))
    ].join('\n');
    
    return csvContent;
};


const ReportsPage = () => {
    const [reportType, setReportType] = useState('SALES_SUMMARY');
    const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportData, setReportData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const generateReport = async () => {
        setIsLoading(true);
        setMessage({ type: '', text: '' });
        setReportData(null);

        try {
            let response;
            if (reportType === 'SALES_SUMMARY') {
                const start = new Date(startDate);
                const end = new Date(endDate);
                if (start >= end) throw new Error("Start date must be before end date.");
                
                response = await api.get(`/admin/reports/sales?startDate=${start.toISOString()}&endDate=${end.toISOString()}`);
            } else {
                response = await api.get('/admin/reports/inventory');
            }
            
            setReportData(response.data.data);
            setMessage({ type: 'success', text: `${reportType.replace('_', ' ')} generated successfully.` });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Error generating report.' });
        } finally {
            setIsLoading(false);
        }
    };

    // --- IMPLEMENTED EXPORT FUNCTION ---
    const handleExport = (format) => {
        if (!reportData) {
            setMessage({ type: 'error', text: 'Please generate a report before exporting.' });
            return;
        }

        const dataArray = reportType === 'SALES_SUMMARY' ? reportData.salesByProduct : reportData.stockSummary;
        if (dataArray.length === 0) {
            setMessage({ type: 'error', text: 'Report data is empty. Nothing to export.' });
            return;
        }

        if (format === 'CSV') {
            const csvContent = convertJsonToCsv(reportData, reportType);
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            
            link.setAttribute("href", URL.createObjectURL(blob));
            link.setAttribute("download", `${reportType}_${new Date().toISOString().slice(0, 10)}.csv`);
            link.click();
            setMessage({ type: 'success', text: `Exported ${reportType} to CSV.` });
        
        } else if (format === 'PDF') {
            if (typeof window.jsPDF === 'undefined') {
                 return setMessage({ type: 'error', text: 'PDF libraries not fully loaded yet. Please wait a moment.' });
            }

            const doc = new window.jsPDF();
            const headers = Object.keys(dataArray[0]).map(key => key.replace(/([A-Z])/g, ' $1').toUpperCase()); // Format headers
            const body = dataArray.map(item => Object.values(item).map(v => typeof v === 'number' ? `₱${v.toFixed(2)}` : String(v)));
            
            doc.autoTable({
                head: [headers],
                body: body,
                startY: 20,
                styles: { fontSize: 8, cellPadding: 2, textColor: [34, 34, 34] },
                headStyles: { fillColor: [59, 7, 100] }, // Indigo color
                didDrawPage: function(data) {
                    doc.text(`${reportType} - Generated Report`, 14, 15);
                }
            });

            doc.save(`${reportType}_${new Date().toISOString().slice(0, 10)}.pdf`);
            setMessage({ type: 'success', text: `Exported ${reportType} to PDF.` });
        }
    };

    // --- UI COMPONENTS ---
    const SalesSummaryView = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <StatCard title="Total Revenue" value={`₱${reportData.totalRevenue.toLocaleString()}`} icon={FaChartBar} color="bg-indigo-500" />
                <StatCard title="Total Units Sold" value={reportData.totalUnits.toLocaleString()} icon={FaBoxes} color="bg-green-500" />
                <StatCard title="Total Unique Items" value={reportData.salesByProduct.length} icon={FaChartBar} color="bg-blue-500" />
            </div>
            
            <h4 className="text-lg font-bold pt-4 dark:text-white">Sales Breakdown by Product</h4>
            <div className="border rounded-xl dark:border-gray-700 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 font-medium">
                        <tr>
                            <th className="px-4 py-3">Product Name</th>
                            <th className="px-4 py-3 text-right">Qty Sold</th>
                            <th className="px-4 py-3 text-right">Revenue</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                        {reportData.salesByProduct.map((item, i) => (
                            <tr key={i}>
                                <td className="px-4 py-3 font-medium dark:text-white">{item.productName}</td>
                                <td className="px-4 py-3 text-right">{item.quantity}</td>
                                <td className="px-4 py-3 text-right font-bold text-indigo-600">₱{item.revenue.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
    
    const InventorySnapshotView = () => (
        <div className="space-y-6">
             <div className="grid grid-cols-3 gap-6">
                 {reportData.stockSummary.map((item, i) => (
                    <StatCard 
                        key={i}
                        title={item.itemName.toUpperCase()} 
                        value={item.stockLevel.toLocaleString()} 
                        icon={FaBoxes} 
                        color={item.stockLevel < 10 ? 'bg-orange-500' : 'bg-emerald-500'} 
                    />
                 ))}
             </div>
             <p className="text-sm text-gray-500 pt-2">Active Products Tracked: {reportData.activeProductsCount}</p>
        </div>
    );

    const StatCard = ({ title, value, icon: Icon, color }) => (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-2xl font-bold dark:text-white">{value}</p>
            </div>
            <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
                <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
            </div>
        </div>
    );
    
    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
            
            <div className="card">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="input-field w-full sm:w-48">
                        <option value="SALES_SUMMARY">Sales Summary</option>
                        <option value="INVENTORY_SNAPSHOT">Inventory Snapshot</option>
                    </select>
                    
                    {reportType === 'SALES_SUMMARY' && (
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <FaCalendarAlt className="text-gray-500" />
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="input-field" />
                            <span className="text-gray-500">to</span>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="input-field" />
                        </div>
                    )}
                    
                    <button onClick={generateReport} disabled={isLoading} className="btn-primary px-6 py-2.5 w-full sm:w-auto">
                        {isLoading ? 'Generating...' : 'Generate Report'}
                    </button>
                </div>
            </div>

            {/* Notifications */}
            {message.text && (
                <div className={`p-4 rounded-xl border-l-4 ${message.type === 'error' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-emerald-50 border-emerald-500 text-emerald-700'}`}>
                    {message.text}
                </div>
            )}

            {/* Report Display and Export */}
            {reportData && (
                <div className="card space-y-6">
                    <div className="flex justify-between items-center border-b pb-4 dark:border-gray-700">
                         <h2 className="text-2xl font-bold dark:text-white">{reportType.replace('_', ' ')}</h2>
                         <div className="space-x-3">
                            <button onClick={() => handleExport('CSV')} className="btn-danger px-4 py-2 text-sm">
                                <FaDownload className="inline mr-2" /> Export CSV
                            </button>
                            <button onClick={() => handleExport('PDF')} className="btn bg-gray-200 text-gray-700 hover:bg-gray-300 px-4 py-2 text-sm">
                                Export PDF
                            </button>
                         </div>
                    </div>
                    
                    {reportType === 'SALES_SUMMARY' ? <SalesSummaryView /> : <InventorySnapshotView />}
                </div>
            )}
        </div>
    );
};

export default ReportsPage;