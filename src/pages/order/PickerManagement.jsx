import React, { useState, useEffect } from 'react';
import { 
    Users, Search, Filter, Eye, ChevronRight, 
    X, Package, Layers, Activity, Calendar,
    UserPlus, TrendingUp, CheckCircle, Clock, RefreshCw, Printer, FileText, Download
} from 'lucide-react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import moment from 'moment';
import { createPortal } from 'react-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const PickerManagement = () => {
    const [pickers, setPickers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPicker, setSelectedPicker] = useState(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [ordersRes, pickersRes] = await Promise.all([
                api.get('/orders'),
                api.get('/pickers')
            ]);

            if (ordersRes.data.success && pickersRes.data.success) {
                const allOrders = ordersRes.data.orders;
                setOrders(allOrders);

                const dbPickers = pickersRes.data.pickers;
                
                // Process orders to get history for each picker
                const historyMap = {};
                allOrders.forEach(order => {
                    const name = order.pickerName;
                    if (name) {
                        if (!historyMap[name]) {
                            historyMap[name] = {
                                totalOrders: 0,
                                lastActive: order.updatedAt || order.createdAt,
                                productsPicked: []
                            };
                        }
                        
                        historyMap[name].totalOrders += 1;
                        if (moment(order.updatedAt || order.createdAt).isAfter(historyMap[name].lastActive)) {
                            historyMap[name].lastActive = order.updatedAt || order.createdAt;
                        }
                        
                        order.items.forEach(item => {
                            historyMap[name].productsPicked.push({
                                orderId: order._id,
                                productName: item.productName,
                                quantity: item.quantity,
                                date: order.updatedAt || order.createdAt,
                                status: order.status
                            });
                        });
                    }
                });

                // Merge DB pickers with calculated history
                const finalPickers = dbPickers.map(p => ({
                    ...p,
                    totalOrders: historyMap[p.name]?.totalOrders || 0,
                    lastActive: historyMap[p.name]?.lastActive || p.updatedAt,
                    productsPicked: historyMap[p.name]?.productsPicked || []
                }));

                // Add any pickers found in orders but NOT in DB yet (for backward compatibility)
                Object.keys(historyMap).forEach(name => {
                    if (!dbPickers.find(p => p.name === name)) {
                        finalPickers.push({
                            name,
                            _id: 'legacy-' + name,
                            totalOrders: historyMap[name].totalOrders,
                            lastActive: historyMap[name].lastActive,
                            productsPicked: historyMap[name].productsPicked
                        });
                    }
                });

                setPickers(finalPickers.sort((a, b) => b.totalOrders - a.totalOrders));
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
            Swal.fire('Error', 'Failed to load picker data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddPicker = async () => {
        const { value: name } = await Swal.fire({
            title: 'Add New Picker',
            input: 'text',
            inputLabel: 'Full Name',
            inputPlaceholder: 'Enter staff name...',
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) return 'Name is required!';
            }
        });

        if (name) {
            try {
                const { data } = await api.post('/pickers', { name });
                if (data.success) {
                    Swal.fire('Success', 'Staff member added successfully', 'success');
                    fetchData(); // Refresh list to get new picker from DB
                }
            } catch (error) {
                console.error("Add Picker Error:", error);
                Swal.fire('Error', error.response?.data?.message || 'Failed to add picker', 'error');
            }
        }
    };

    const filteredPickers = pickers.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDownloadPDF = () => {
        if (!selectedPicker) return;

        const doc = new jsPDF();
        
        // Header
        doc.setFillColor(0, 59, 92); // #003B5C
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('STAFF PERFORMANCE REPORT', 15, 20);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated on: ${moment().format('DD MMM YYYY, HH:mm')}`, 15, 30);
        
        // Picker Info Grid
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Picker Details:', 15, 55);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Name: ${selectedPicker.name.toUpperCase()}`, 15, 65);
        doc.text(`Total Orders Picked: ${selectedPicker.totalOrders}`, 15, 72);
        doc.text(`Last Activity: ${moment(selectedPicker.lastActive).format('DD MMM YYYY, HH:mm')}`, 15, 79);
        doc.text(`Status: ACTIVE STAFF`, 15, 86);

        // History Table
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Picking Detailed History', 15, 105);

        const tableData = selectedPicker.productsPicked
            .sort((a,b) => moment(b.date).diff(moment(a.date)))
            .map(item => [
                `#${item.orderId.substr(-8).toUpperCase()}`,
                item.productName.toUpperCase(),
                item.quantity,
                moment(item.date).format('DD/MM/YYYY HH:mm'),
                item.status.toUpperCase()
            ]);

        autoTable(doc, {
            startY: 110,
            head: [['Order ID', 'Product Description', 'Qty', 'Date/Time', 'Status']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [0, 59, 92], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 15, halign: 'center' },
                3: { cellWidth: 35 },
                4: { cellWidth: 30, halign: 'right' }
            }
        });

        // Save
        doc.save(`Picker_Report_${selectedPicker.name.replaceAll(' ', '_')}.pdf`);
    };

    const stats = {
        totalPickers: pickers.length,
        totalPickedOrders: orders.filter(o => o.status !== 'Picking' && o.pickerName).length,
        mostActive: pickers[0]?.name || 'N/A'
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Picker Management</h1>
                    <p className="text-sm text-gray-500 font-medium">Track staff picking performance and history.</p>
                </div>
                <button 
                    onClick={handleAddPicker}
                    className="flex items-center gap-2 bg-[#003B5C] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#002b44] transition-all active:scale-95 shadow-lg shadow-blue-900/20"
                >
                    <UserPlus size={18} />
                    Add New Picker
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-gray-400">Total Staff</p>
                        <p className="text-xl font-black text-gray-800 dark:text-white">{stats.totalPickers}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-600">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-gray-400">Orders Picked</p>
                        <p className="text-xl font-black text-gray-800 dark:text-white">{stats.totalPickedOrders}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-600">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-gray-400">Most Operations</p>
                        <p className="text-xl font-black text-gray-800 dark:text-white truncate max-w-[150px]">{stats.mostActive}</p>
                    </div>
                </div>
            </div>

            {/* Search & List */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search Picker Name..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={fetchData} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-[10px] font-black uppercase text-gray-500 tracking-widest border-b border-gray-100 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4">Picker Name</th>
                                <th className="px-6 py-4 text-center">Total Orders</th>
                                <th className="px-6 py-4">Efficiency</th>
                                <th className="px-6 py-4">Last Active</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {loading ? (
                                <tr><td colSpan="5" className="px-6 py-20 text-center text-gray-400 animate-pulse font-bold">Loading Staff Performance Data...</td></tr>
                            ) : filteredPickers.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-20 text-center text-gray-400 font-bold uppercase tracking-wider">No pickers found</td></tr>
                            ) : (
                                filteredPickers.map((picker, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-black text-sm">
                                                    {picker.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800 dark:text-white uppercase text-xs">{picker.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-medium">Internal Staff</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-black px-3 py-1 rounded-full text-xs">
                                                {picker.totalOrders}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="w-full max-w-[100px] h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-emerald-500 rounded-full" 
                                                    style={{ width: `${Math.min(100, (picker.totalOrders / (stats.totalPickedOrders || 1)) * 100 * 3)}%` }}
                                                ></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                            {moment(picker.lastActive).fromNow()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {/* <button 
                                                onClick={() => { setSelectedPicker(picker); setShowHistoryModal(true); }}
                                                className="inline-flex items-center gap-2 text-blue-600 hover:text-white px-4 py-1.5 hover:bg-blue-600 rounded-lg font-black text-[10px] uppercase transition-all shadow-sm border border-blue-100 dark:border-blue-900/50 active:scale-95"
                                            >
                                                <Eye size={14} />
                                                View History
                                            </button> */}
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No Actions</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Picker History Modal commented out */}
            {/* {showHistoryModal && selectedPicker && createPortal(
                ... (Modal code)
            )} */}

            {/* Hidden Printable Section commented out */}
            {/* {selectedPicker && (
                ... (Printable code)
            )} */}
        </div>
    );
};

export default PickerManagement;
