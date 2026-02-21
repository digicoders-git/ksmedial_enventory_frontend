import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Download, Search, ChevronLeft, ChevronRight, PackageX } from 'lucide-react';
import api from '../../api/axios';

const NonMovingStock = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        fetchNonMovingStock();
    }, []);

    const fetchNonMovingStock = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/products/non-moving');
            if (data.success) {
                setProducts(data.products);
            }
        } catch (error) {
            console.error('Error fetching non-moving stock:', error);
        } finally {
            setLoading(false);
        }
    };

    const downloadCSV = () => {
        const headers = ['Product Name', 'SKU', 'Batch', 'Stock Qty', 'Last Added', 'Value'];
        const csvContent = [
            headers.join(','),
            ...filteredProducts.map(item => [
                `"${item.name}"`,
                `"${item.sku}"`,
                `"${item.batchNumber}"`,
                item.quantity,
                `"${new Date(item.createdAt).toLocaleDateString()}"`,
                (item.quantity * item.purchasePrice).toFixed(2)
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'non_moving_stock.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    const { filteredProducts, totalPages, paginationInfo } = useMemo(() => {
        let filtered = products;

        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            filtered = products.filter(p => 
                p.name.toLowerCase().includes(searchLower) || 
                p.sku?.toLowerCase().includes(searchLower)
            );
        }

        if (dateFilter) {
            const filterDate = new Date(dateFilter);
            filtered = filtered.filter(p => {
                const createdDate = new Date(p.createdAt);
                return createdDate >= filterDate;
            });
        }

        const totalItems = filtered.length;
        const totalPgs = Math.ceil(totalItems / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedItems = filtered.slice(startIndex, endIndex);

        return {
            filteredProducts: paginatedItems,
            totalPages: totalPgs,
            paginationInfo: {
                totalItems,
                startIndex: totalItems > 0 ? startIndex + 1 : 0,
                endIndex: Math.min(endIndex, totalItems),
                currentPage
            }
        };
    }, [products, searchTerm, dateFilter, currentPage, itemsPerPage]);

    const handleSearchChange = (val) => {
        setSearchTerm(val);
        setCurrentPage(1);
    };

    const totalValue = products.reduce((acc, curr) => acc + (curr.quantity * curr.purchasePrice), 0);

    return (
        <div className="animate-fade-in-up space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <PackageX className="text-orange-500" /> Non-Moving Stock
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        Items with ZERO sales in the last 30 days. Consider discounting or returning.
                    </p>
                </div>
                <button 
                    onClick={downloadCSV}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                    <Download size={16} /> Download Report
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                    <div className="p-3 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
                        <PackageX size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Stagnant Items</p>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{products.length} <span className="text-sm font-medium text-gray-400">SKUs</span></h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                    <div className="p-3 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Blocked Capital</p>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white">₹{totalValue.toLocaleString()}</h3>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-700/30">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                        <div className="md:col-span-1">
                            <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-2">
                                <AlertTriangle size={18} className="text-orange-500" /> Stagnant Inventory List
                            </h3>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-500 mb-1 block">Added After Date</label>
                            <input 
                                type="datetime-local" 
                                value={dateFilter}
                                onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:border-primary outline-none"
                            />
                        </div>
                        <div className="relative">
                            <label className="text-[10px] font-black uppercase text-gray-500 mb-1 block">Search</label>
                            <Search className="absolute left-3 top-[34px] -translate-y-1/2 text-gray-400" size={14} />
                            <input 
                                type="text" 
                                placeholder="Name or SKU..." 
                                value={searchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:border-primary outline-none" 
                            />
                        </div>
                    </div>
                    {dateFilter && (
                        <div className="mt-3 flex justify-end">
                            <button 
                                onClick={() => { setDateFilter(''); setCurrentPage(1); }}
                                className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold uppercase rounded-lg flex items-center gap-1 border border-red-200 dark:border-red-900/30"
                            >
                                <X size={12} /> Clear Date
                            </button>
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-700 text-gray-500 uppercase">
                            <tr>
                                <th className="px-6 py-4 whitespace-nowrap">Product Name</th>
                                <th className="px-6 py-4 whitespace-nowrap">SKU / Batch</th>
                                <th className="px-6 py-4 whitespace-nowrap">Current Stock</th>
                                <th className="px-6 py-4 whitespace-nowrap">Value</th>
                                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">Loading non-moving stock...</td>
                                </tr>
                            ) : filteredProducts.length > 0 ? (
                                filteredProducts.map((item) => (
                                    <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-800 dark:text-gray-200">{item.name}</div>
                                            <div className="text-xs text-gray-500">{item.company}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded w-fit">{item.sku}</span>
                                                <span className="text-xs text-gray-500">Batch: {item.batchNumber}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-200">
                                            {item.quantity} <span className="text-xs font-normal text-gray-500">units</span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-gray-700 dark:text-gray-300">
                                            ₹{(item.quantity * item.purchasePrice).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">
                                                <AlertTriangle size={12} /> No Sales (30d)
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                                        <PackageX size={48} className="mx-auto mb-3 opacity-20" />
                                        <p>Great! No stagnant inventory found.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {paginationInfo.totalItems > 0 && (
                     <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Showing <span className="font-bold">{paginationInfo.startIndex}</span>-
                            <span className="font-bold">{paginationInfo.endIndex}</span> of{' '}
                            <span className="font-bold">{paginationInfo.totalItems}</span>
                        </p>
                        
                        <div className="flex items-center gap-2">
                            <select 
                                value={itemsPerPage} 
                                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} 
                                className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm"
                            >
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                            </select>

                            <div className="flex items-center gap-1">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded border hover:bg-gray-100 disabled:opacity-50"><ChevronLeft size={16} /></button>
                                <span className="px-3 py-1 bg-primary text-white rounded text-sm font-bold">{currentPage}</span>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded border hover:bg-gray-100 disabled:opacity-50"><ChevronRight size={16} /></button>
                            </div>
                        </div>
                     </div>
                )}
            </div>
        </div>
    );
};

export default NonMovingStock;
