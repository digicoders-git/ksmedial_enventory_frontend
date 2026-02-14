import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Eye, Calendar, User, FileText, ChevronLeft, ChevronRight, ArrowDownCircle, ArrowUpCircle, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';

const StockHistory = () => {
    const navigate = useNavigate();
    const { transactions, fetchTransactions } = useInventory();
    
    // Filter transactions to show only adjustments (or allow all)
    // User requested "stock adjustment history" specifically when clicking from Inventory Master?
    // User said: "stock list page par abhi ja raha hai... proper stock list ka name rename karke stock history rakho"
    // So this page should generally show history. I'll focus on adjustments but maybe show all.
    // Let's filter for adjustments by default if that's the primary use case, or just show all with filters.
    // Given the context used 'ADJUSTMENT' source for manual adjustments.

    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('ADJUSTMENT'); // Default to Adjustment history
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            // Filter by Type
            if (filterType !== 'ALL' && t.source !== filterType) return false;
            
            // Search
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = 
                t.items?.[0]?.name?.toLowerCase().includes(searchLower) ||
                t.adjustedBy?.name?.toLowerCase().includes(searchLower) ||
                t.reason?.toLowerCase().includes(searchLower) ||
                t.reference?.toLowerCase().includes(searchLower);

            return matchesSearch;
        });
    }, [transactions, filterType, searchTerm]);

    // Pagination
    const totalItems = filteredTransactions.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    return (
        <div className="space-y-6 animate-fade-in-up p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                   <h1 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Stock History</h1>
                   <p className="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide">
                       Log of all stock adjustments, movements, and updates.
                   </p>
                </div>
                <div className="flex gap-2">
                     <button
                        onClick={() => navigate('/inventory/master')}
                        className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl shadow-sm hover:bg-gray-50 transition-all text-xs uppercase tracking-wider flex items-center gap-2"
                     >
                        <ChevronLeft size={16} /> Back to Master
                     </button>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by Product, Adjuster, Reason..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium"
                    />
                </div>
                
                <div className="flex gap-2 relative">
                    <div className="relative">
                        <button 
                            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                            className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            <Filter size={14} strokeWidth={2.5} /> {filterType === 'ADJUSTMENT' ? 'Adjustments Only' : filterType === 'ALL' ? 'All Transactions' : filterType}
                        </button>
                        
                        {showFilterDropdown && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                                <button onClick={() => { setFilterType('ALL'); setShowFilterDropdown(false); }} className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-50 dark:border-gray-700">All History</button>
                                <button onClick={() => { setFilterType('ADJUSTMENT'); setShowFilterDropdown(false); }} className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-50 dark:border-gray-700 text-blue-600">Adjustments</button>
                                <button onClick={() => { setFilterType('SALE'); setShowFilterDropdown(false); }} className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-50 dark:border-gray-700">Sales</button>
                                <button onClick={() => { setFilterType('PURCHASE'); setShowFilterDropdown(false); }} className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-gray-700">Purchases</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px]">
                        <thead>
                            <tr className="bg-gray-900 text-white text-[10px] font-black uppercase tracking-wider text-left">
                                <th className="px-6 py-4">Date & Time</th>
                                <th className="px-6 py-4">Product Details</th>
                                <th className="px-6 py-4 text-center">Type</th>
                                <th className="px-6 py-4 text-center">Change</th>
                                <th className="px-6 py-4">Reason / Note</th>
                                <th className="px-6 py-4">Adjusted By</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {currentData.length > 0 ? (
                                currentData.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                <Calendar size={14} className="text-gray-400" />
                                                <span className="text-xs font-bold">{new Date(item.date).toLocaleDateString()}</span>
                                                <span className="text-[10px] text-gray-400 font-mono">{new Date(item.date).toLocaleTimeString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-800 dark:text-gray-200 text-xs">{item.items?.[0]?.name || 'Unknown'}</span>
                                                <span className="text-[10px] text-gray-500 font-mono">Batch: {item.items?.[0]?.batch || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1
                                                ${item.type === 'IN' || item.type === 'add' 
                                                    ? 'bg-green-50 text-green-700 border border-green-100' 
                                                    : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                                {item.type === 'IN' || item.type === 'add' ? <ArrowUpCircle size={10} /> : <ArrowDownCircle size={10} />}
                                                {item.type === 'IN' || item.type === 'add' ? 'Added' : 'Deduced'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`font-black text-xs ${item.type === 'IN' || item.type === 'add' ? 'text-green-600' : 'text-red-500'}`}>
                                                {item.type === 'IN' || item.type === 'add' ? '+' : '-'}{Math.abs(item.totalQty)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col max-w-[200px]">
                                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{item.reason}</span>
                                                {item.note && <span className="text-[10px] text-gray-500 italic truncate" title={item.note}>{item.note}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.adjustedBy ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center shrink-0 text-xs font-bold border border-blue-100">
                                                        {item.adjustedBy.name ? item.adjustedBy.name.charAt(0) : <User size={14} />}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{item.adjustedBy.name || 'Unknown'}</span>
                                                        <span className="text-[10px] text-gray-400">{item.adjustedBy.email}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">System / N/A</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-12">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <FileText size={48} className="opacity-20 mb-4" />
                                            <p className="text-sm font-bold">No history found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-500">Page {currentPage} of {totalPages}</span>
                    <div className="flex gap-2">
                         <button 
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 border rounded-lg bg-white disabled:opacity-50 hover:bg-gray-50 font-bold text-gray-600"
                         >
                             Previous
                         </button>
                         <button 
                             onClick={() => goToPage(currentPage + 1)}
                             disabled={currentPage === totalPages}
                            className="px-3 py-1.5 border rounded-lg bg-white disabled:opacity-50 hover:bg-gray-50 font-bold text-gray-600"
                         >
                             Next
                         </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockHistory;
