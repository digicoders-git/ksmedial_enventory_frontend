import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, Plus, Filter, Calendar, 
    FileText, Eye, Download, CheckCircle, 
    AlertCircle, Package, Truck, User,
    Printer, Edit, RotateCcw, Share, QrCode,
    Upload, X, ChevronRight, ChevronLeft
} from 'lucide-react';
import api from '../../api/axios';
import moment from 'moment';
import Swal from 'sweetalert2';
import Papa from 'papaparse';

const GRNList = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [grns, setGrns] = useState([]);
    const [selectedGrns, setSelectedGrns] = useState([]);
    
    // Detailed Filters
    const [filters, setFilters] = useState({
        id: '',
        invoiceNumber: '',
        priority: '',
        status: '',
        putAwayStatus: '',
        startDate: '',
        endDate: '',
        supplierName: ''
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalEntries, setTotalEntries] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    const fetchGRNs = useCallback(async () => {
        try {
            setLoading(true);
            const params = {
                pageNumber: currentPage,
                pageSize: itemsPerPage,
                keyword: filters.invoiceNumber || filters.supplierName,
                status: filters.status || undefined,
                priority: filters.priority || undefined,
                startDate: filters.startDate || undefined,
                endDate: filters.endDate || undefined
            };

            // Remove undefined params
            Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

            const { data } = await api.get('/purchases', { params });

            if (data.success) {
                const enriched = data.purchases.map(p => ({
                    ...p,
                    putAwayStatus: p.status === 'Received' ? 'Completed' : p.status === 'Putaway_Pending' ? 'Pending' : 'Not Started',
                    failReason: '-'
                }));
                
                let finalData = enriched;
                
                // Client-side filters
                if (filters.putAwayStatus) {
                    finalData = finalData.filter(d => d.putAwayStatus === filters.putAwayStatus);
                }
                if (filters.id) {
                    finalData = finalData.filter(d => d._id.toLowerCase().includes(filters.id.toLowerCase()));
                }

                setGrns(finalData);
                setTotalPages(data.pages || 1);
                setTotalEntries(data.total || finalData.length);
            }
        } catch (error) {
            console.error("Failed to fetch GRNs", error);
            Swal.fire('Error', 'Failed to load purchase receipts', 'error');
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage, filters.invoiceNumber, filters.supplierName, filters.status, filters.priority, filters.startDate, filters.endDate, filters.putAwayStatus, filters.id]);

    useEffect(() => {
        fetchGRNs();
    }, [fetchGRNs]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({
            id: '',
            invoiceNumber: '',
            priority: '',
            status: '',
            putAwayStatus: '',
            startDate: '',
            endDate: '',
            supplierName: ''
        });
        setCurrentPage(1);
    };

    const handleSearch = () => {
        setCurrentPage(1);
        fetchGRNs();
    };

    const handleExport = () => {
        const csv = Papa.unparse(grns.map(g => ({
            'ID': g._id,
            'Invoice Number': g.invoiceNumber,
            'Supplier': g.supplierId?.name || 'N/A',
            'Status': g.status,
            'Priority': g.priority || 'P3',
            'Location': g.receivingLocation || 'Dock-1',
            'Put Away Status': g.putAwayStatus,
            'Created': moment(g.createdAt).format('YYYY-MM-DD HH:mm'),
            'Total Amount': g.grandTotal || g.invoiceSummary?.invoiceAmount || 0
        })));
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `purchase_receive_${moment().format('YYYYMMDD')}.csv`;
        a.click();
    };

    const handlePrintQR = (grn) => {
        const qrData = `
GRN No: ${grn.invoiceNumber}
Date: ${new Date(grn.invoiceDate || grn.createdAt).toLocaleDateString('en-IN')}
Supplier: ${grn.supplierId?.name || 'N/A'}
Total Amount: ₹${(grn.grandTotal || grn.invoiceSummary?.invoiceAmount || 0).toFixed(2)}
Items: ${grn.items?.length || 0}
Status: ${grn.status}
        `.trim();

        // Use higher resolution for better quality
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

        Swal.fire({
            title: 'GRN QR Code',
            html: `
                <div style="display: flex; flex-direction: column; align-items: center; padding: 10px;">
                    <img src="${qrUrl}" alt="QR Code" style="width: 200px; height: 200px; margin-bottom: 20px; border: 1px solid #ddd; padding: 10px; border-radius: 8px;" />
                    <div style="text-align: left; width: 100%; font-size: 13px; color: #4b5563; background: #f3f4f6; padding: 12px; border-radius: 8px;">
                        <p style="margin-bottom: 4px;"><strong>GRN:</strong> ${grn.invoiceNumber}</p>
                        <p style="margin-bottom: 4px;"><strong>Supplier:</strong> ${grn.supplierId?.name || 'N/A'}</p>
                        <p style="margin-bottom: 0;"><strong>Amount:</strong> ₹${(grn.grandTotal || grn.invoiceSummary?.invoiceAmount || 0).toFixed(2)}</p>
                    </div>
                </div>
            `,
            showDenyButton: true,
            confirmButtonText: 'Close',
            denyButtonText: 'Download',
            confirmButtonColor: '#6B7280',
            denyButtonColor: '#003B5C',
        }).then(async (result) => {
            if (result.isDenied) {
                try {
                    const response = await fetch(qrUrl);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `GRN_QR_${grn.invoiceNumber}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                } catch (error) {
                    console.error("Download failed", error);
                    Swal.fire('Error', 'Failed to download QR Code', 'error');
                }
            }
        });
    };

    const handlePrintReceipt = (grn) => {
        navigate(`/purchase/grn/view/${grn._id}`);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedGrns(grns.map(g => g._id));
        } else {
            setSelectedGrns([]);
        }
    };

    const handleSelectGrn = (id) => {
        setSelectedGrns(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'Received': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'Putaway_Pending': return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'Cancelled': return 'bg-red-50 text-red-700 border-red-200';
            case 'Pending': return 'bg-blue-50 text-blue-700 border-blue-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const getPriorityColor = (priority) => {
        switch(priority) {
            case 'P1': return 'border-red-200 bg-red-50 text-red-600';
            case 'P2': return 'border-amber-200 bg-amber-50 text-amber-600';
            case 'P3': return 'border-emerald-200 bg-emerald-50 text-emerald-600';
            default: return 'border-gray-200 bg-gray-50 text-gray-600';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Purchase Receive</h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">Manage and track incoming stock deliveries</p>
                </div>
                <button 
                    onClick={() => navigate('/purchase/grn/add')}
                    className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg font-bold uppercase text-sm shadow-sm transition-all"
                >
                    <Plus size={18} />
                    Create GRN
                </button>
            </div>

            {/* Filter Section */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {/* ID */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">ID</label>
                        <input 
                            name="id" 
                            placeholder="Search by ID" 
                            value={filters.id} 
                            onChange={handleFilterChange} 
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                        />
                    </div>
                    
                    {/* Invoice Number */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Invoice Number</label>
                        <input 
                            name="invoiceNumber" 
                            placeholder="Search invoice #" 
                            value={filters.invoiceNumber} 
                            onChange={handleFilterChange} 
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                        />
                    </div>

                    {/* Supplier */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Supplier</label>
                        <input 
                            name="supplierName" 
                            placeholder="Supplier name" 
                            value={filters.supplierName} 
                            onChange={handleFilterChange} 
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                        />
                    </div>

                    {/* Priority */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Priority</label>
                        <select 
                            name="priority" 
                            value={filters.priority} 
                            onChange={handleFilterChange} 
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-bold"
                        >
                            <option value="">All Priorities</option>
                            <option value="P1">P1 - High</option>
                            <option value="P2">P2 - Medium</option>
                            <option value="P3">P3 - Low</option>
                        </select>
                    </div>
                    
                    {/* Status */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</label>
                        <select 
                            name="status" 
                            value={filters.status} 
                            onChange={handleFilterChange} 
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-bold"
                        >
                            <option value="">All Status</option>
                            <option value="Received">Received</option>
                            <option value="Pending">Pending</option>
                            <option value="Putaway_Pending">Putaway Pending</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>

                    {/* Put Away Status */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Put Away Status</label>
                        <select 
                            name="putAwayStatus" 
                            value={filters.putAwayStatus} 
                            onChange={handleFilterChange} 
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-bold"
                        >
                            <option value="">All Status</option>
                            <option value="Completed">Completed</option>
                            <option value="Pending">Pending</option>
                            <option value="Not Started">Not Started</option>
                        </select>
                    </div>

                    {/* Start Date */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Start Date & Time</label>
                        <input 
                            type="datetime-local"
                            name="startDate" 
                            value={filters.startDate} 
                            onChange={handleFilterChange} 
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-bold"
                        />
                    </div>

                    {/* End Date */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">End Date & Time</label>
                        <input 
                            type="datetime-local"
                            name="endDate" 
                            value={filters.endDate} 
                            onChange={handleFilterChange} 
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-bold"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-end gap-2 lg:col-span-2">
                        <button 
                            onClick={handleSearch} 
                            className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white font-bold uppercase px-4 py-2 rounded-lg text-sm transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                            <Search size={16} /> Search
                        </button>
                        <button 
                            onClick={clearFilters} 
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold uppercase rounded-lg text-sm transition-all flex items-center gap-2"
                        >
                            <X size={16} /> Clear
                        </button>
                    </div>
                </div>
            </div>

            {/* List Table */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
                {/* Table Header Actions */}
                <div className="p-4 flex flex-wrap justify-between items-center gap-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-bold text-gray-500">
                        Showing {grns.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} - {Math.min(currentPage * itemsPerPage, totalEntries)} of {totalEntries} purchase receipts
                    </p>
                    
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-500">Per page:</span>
                            <select 
                                value={itemsPerPage} 
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }} 
                                className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 outline-none bg-white dark:bg-gray-900"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                        <button 
                            className="px-3 py-1.5 bg-cyan-500 text-white text-xs font-bold uppercase rounded flex items-center gap-2 hover:bg-cyan-600 transition-all" 
                            onClick={handleExport}
                        >
                            <Download size={14} /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#003B5C] text-white text-[11px] font-bold uppercase">
                            <tr>
                                <th className="p-3 w-10">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedGrns.length === grns.length && grns.length > 0}
                                        onChange={handleSelectAll}
                                        className="cursor-pointer"
                                    />
                                </th>
                                <th className="p-3 min-w-[100px]">ID</th>
                                <th className="p-3 min-w-[150px]">Invoice Number</th>
                                <th className="p-3 min-w-[150px]">Supplier Name</th>
                                <th className="p-3 min-w-[120px]">Status</th>
                                <th className="p-3 min-w-[80px]">Priority</th>
                                <th className="p-3 min-w-[100px]">Location</th>
                                <th className="p-3 min-w-[150px]">Created On</th>
                                <th className="p-3 min-w-[120px]">Put Away Status</th>
                                <th className="p-3 text-center min-w-[80px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300">
                            {loading ? (
                                <tr>
                                    <td colSpan="10" className="p-10 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-500"></div>
                                            <span>Loading GRNs...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : grns.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="p-10 text-center text-gray-500">
                                        <Package size={48} className="mx-auto mb-3 opacity-30" />
                                        <p className="font-bold">No purchase receipts found</p>
                                        <p className="text-xs mt-1">Try adjusting your filters or create a new GRN</p>
                                    </td>
                                </tr>
                            ) : (
                                grns.map((grn) => (
                                    <tr key={grn._id} className="hover:bg-cyan-50/50 dark:hover:bg-gray-800 transition-colors">
                                        <td className="p-3 text-center">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedGrns.includes(grn._id)}
                                                onChange={() => handleSelectGrn(grn._id)}
                                                className="cursor-pointer"
                                            />
                                        </td>
                                        <td className="p-3">
                                            <span 
                                                onClick={() => navigate(`/purchase/grn/view/${grn._id}`)} 
                                                className="text-cyan-600 cursor-pointer hover:underline font-mono font-bold"
                                            >
                                                #{grn._id.substr(-8).toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <span 
                                                className="font-bold text-cyan-600 cursor-pointer hover:underline" 
                                                onClick={() => navigate(`/purchase/grn/view/${grn._id}`)}
                                            >
                                                {grn.invoiceNumber}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <Truck size={14} className="text-gray-400" />
                                                <span>{grn.supplierId?.name || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded border text-[10px] uppercase font-black ${getStatusColor(grn.status)}`}>
                                                {grn.status}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 border rounded text-[10px] font-black ${getPriorityColor(grn.priority)}`}>
                                                {grn.priority || 'P3'}
                                            </span>
                                        </td>
                                        <td className="p-3 text-gray-600">
                                            {grn.receivingLocation || 'Dock-1'}
                                        </td>
                                        <td className="p-3 text-gray-600">
                                            {moment(grn.createdAt).format('DD MMM YYYY, HH:mm')}
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                                grn.putAwayStatus === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                                grn.putAwayStatus === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                                {grn.putAwayStatus}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button 
                                                    onClick={() => navigate(`/purchase/grn/view/${grn._id}`)} 
                                                    className="p-1.5 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 rounded text-cyan-600 transition-all" 
                                                    title="View/Edit"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                {grn.invoiceFile && (
                                                    <a 
                                                        href={`${(import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace('/api', '').replace(/\/$/, '')}${grn.invoiceFile.startsWith('/') ? '' : '/'}${grn.invoiceFile}`} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded text-emerald-600 transition-all"
                                                        title="View Invoice"
                                                    >
                                                        <FileText size={16} />
                                                    </a>
                                                )}
                                                <button 
                                                    onClick={() => handlePrintReceipt(grn)} 
                                                    className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded text-blue-600 transition-all" 
                                                    title="Print Receipt"
                                                >
                                                    <Printer size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handlePrintQR(grn)} 
                                                    className="p-1.5 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded text-purple-600 transition-all" 
                                                    title="Generate QR"
                                                >
                                                    <QrCode size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500">
                        {selectedGrns.length > 0 && (
                            <span className="font-bold text-cyan-600">{selectedGrns.length} selected</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            disabled={currentPage === 1} 
                            onClick={() => setCurrentPage(1)}
                            className="p-1.5 rounded bg-gray-100 dark:bg-gray-700 disabled:opacity-50 hover:bg-gray-200 transition-all"
                            title="First Page"
                        >
                            <ChevronLeft size={16} className="text-gray-600" />
                        </button>
                        <button 
                            disabled={currentPage === 1} 
                            onClick={() => setCurrentPage(c => Math.max(1, c - 1))} 
                            className="px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-700 disabled:opacity-50 hover:bg-gray-200 transition-all text-xs font-bold"
                        >
                            Previous
                        </button>
                        <span className="text-xs font-bold px-3 py-1.5 bg-cyan-500 text-white rounded">
                            {currentPage} / {totalPages}
                        </span>
                        <button 
                            disabled={currentPage >= totalPages} 
                            onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))} 
                            className="px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-700 disabled:opacity-50 hover:bg-gray-200 transition-all text-xs font-bold"
                        >
                            Next
                        </button>
                        <button 
                            disabled={currentPage >= totalPages} 
                            onClick={() => setCurrentPage(totalPages)}
                            className="p-1.5 rounded bg-gray-100 dark:bg-gray-700 disabled:opacity-50 hover:bg-gray-200 transition-all"
                            title="Last Page"
                        >
                            <ChevronRight size={16} className="text-gray-600" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GRNList;
