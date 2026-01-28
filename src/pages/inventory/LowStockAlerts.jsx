import React, { useState, useMemo } from 'react';
import { AlertCircle, ShoppingCart, TrendingDown, ArrowRight, Truck, Bell, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import Swal from 'sweetalert2';
import { useInventory } from '../../context/InventoryContext';

const LowStockAlerts = () => {
    const { inventory, updateThreshold } = useInventory();
    const [searchTerm, setSearchTerm] = useState('');
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    
    // Derive alerts from inventory
    const alerts = useMemo(() => {
        return inventory
            .filter(item => item.stock <= (item.reorderLevel || 20))
            .map(item => ({
                id: item.id,
                name: item.name,
                current: item.stock,
                reorderLevel: item.reorderLevel || 20,
                sku: item.sku || '',
                batch: item.batch || '',
                supplier: item.supplier || 'Patanjali Dist.',
                avgSale: 5, 
                status: item.stock <= (item.reorderLevel || 20) * 0.3 ? 'Critical' : 'Low'
            }));
    }, [inventory]);

    const handleReorder = (item) => {
        Swal.fire({
            title: `Reorder ${item.name}?`,
            text: `Current Stock: ${item.current} | Reorder Level: ${item.reorderLevel}`,
            input: 'number',
            inputLabel: 'Quantity to Order',
            inputValue: item.reorderLevel * 2,
            showCancelButton: true,
            confirmButtonText: 'Place Order',
            confirmButtonColor: 'var(--color-primary)',
            showLoaderOnConfirm: true,
            preConfirm: () => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve();
                    }, 1000); // Simulate API call
                });
            },
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    icon: 'success',
                    title: 'Order Placed!',
                    text: `Purchase Order sent to ${item.supplier} for ${result.value} units.`,
                });
            }
        });
    };

    const handleSetThreshold = (item) => {
        Swal.fire({
            title: 'Set Low Stock Threshold',
            text: `Adjust minimum stock level for ${item.name}`,
            input: 'number',
            inputLabel: 'Minimum Units',
            inputValue: item.reorderLevel,
            showCancelButton: true,
            confirmButtonText: 'Update Threshold',
            confirmButtonColor: 'var(--color-primary)',
            inputValidator: (value) => {
                if (!value || value < 0) {
                    return 'Please enter a valid quantity';
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const res = updateThreshold(item.id, parseInt(result.value));
                if (res.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: `${item.name} threshold updated to ${result.value} units.`,
                        timer: 2000,
                        showConfirmButton: false
                    });
                }
            }
        });
    };

    const handleConfigureAlerts = () => {
        Swal.fire({
            title: 'Configure Stock Alerts',
            html: `
                <div class="text-left space-y-4 px-2">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-1">Low Stock Threshold (Global)</label>
                        <p class="text-xs text-gray-500 mb-2">Trigger alert when stock drops below percentage of max capacity.</p>
                        <div class="flex items-center gap-3">
                            <input type="range" class="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" min="5" max="50" value="20" oninput="document.getElementById('rangeVal').innerText = this.value + '%'">
                            <span id="rangeVal" class="text-sm font-bold text-primary w-10">20%</span>
                        </div>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Save Configuration',
            cancelButtonText: 'Cancel',
            confirmButtonColor: 'var(--color-primary)',
        });
    };

    const handleAutoReorderAll = () => {
        Swal.fire({
            title: 'Auto-Reorder All?',
            text: `Create purchase orders for all ${alerts.length} low stock items?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Place Orders',
            confirmButtonColor: 'var(--color-primary)',
            showLoaderOnConfirm: true,
            preConfirm: () => {
                 return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve();
                    }, 1500);
                });
            }
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    icon: 'success',
                    title: 'Orders Placed Successfully',
                    text: `Purchase orders generated for ${alerts.length} suppliers.`,
                });
            }
        });
    };

    // Search and pagination logic
    const { filteredAlerts, totalPages, paginationInfo } = useMemo(() => {
        let filtered = alerts;
        
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase().trim();
            filtered = alerts.filter(alert => {
                const nameMatch = alert.name.toLowerCase().includes(searchLower);
                const skuMatch = alert.sku?.toLowerCase().includes(searchLower);
                const batchMatch = alert.batch?.toLowerCase().includes(searchLower);
                return nameMatch || skuMatch || batchMatch;
            });
        }

        const totalItems = filtered.length;
        const totalPgs = Math.ceil(totalItems / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedItems = filtered.slice(startIndex, endIndex);

        return {
            filteredAlerts: paginatedItems,
            totalPages: totalPgs,
            paginationInfo: {
                totalItems,
                startIndex: startIndex + 1,
                endIndex: Math.min(endIndex, totalItems),
                currentPage
            }
        };
    }, [alerts, searchTerm, currentPage, itemsPerPage]);

    const handleSearchChange = (value) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const handleItemsPerPageChange = (value) => {
        setItemsPerPage(Number(value));
        setCurrentPage(1);
    };

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const criticalCount = alerts.filter(a => a.status === 'Critical').length;
    
    return (
        <div className="animate-fade-in-up space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <TrendingDown className="text-red-500" /> Low Stock Alerts
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Real-time alerts for medicines below safety stock levels.</p>
                </div>
                <div className="flex gap-2">
                     <button onClick={handleConfigureAlerts} className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                        <Bell size={16} /> Configure Alerts
                    </button>
                    <button onClick={handleAutoReorderAll} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-secondary shadow-md active:scale-95 transition-all flex items-center gap-2">
                        <ShoppingCart size={16} /> Auto-Reorder All
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 hover:shadow-md transition-all group">
                    <div className="p-3 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Critical Shortage</p>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{criticalCount} <span className="text-sm font-medium text-gray-400">Items</span></h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 hover:shadow-md transition-all group">
                    <div className="p-3 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
                        <Truck size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Restock Needed</p>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{alerts.length - criticalCount} <span className="text-sm font-medium text-gray-400">Items</span></h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 hover:shadow-md transition-all group">
                    <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                        <Bell size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Alert Thresholds</p>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Active</h3>
                    </div>
                </div>
            </div>

            {/* List */}
             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between gap-4 bg-gray-50/30 dark:bg-gray-700/30">
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <AlertCircle size={18} className="text-gray-400" /> Alert List
                    </h3>
                    <div className="flex gap-2">
                         <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input 
                                type="text" 
                                placeholder="Search by Name, SKU or QR..." 
                                value={searchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="pl-9 pr-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:border-primary outline-none" 
                            />
                        </div>
                        <button className="p-1.5 border border-gray-200 dark:border-gray-600 rounded-lg"><Filter size={16} /></button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-700 text-gray-500  uppercase">
                            <tr>
                                <th className="px-6 py-4 whitespace-nowrap text-left">Medicine Name</th>
                                <th className="px-6 py-4 whitespace-nowrap text-left">Stock Status</th>
                                <th className="px-6 py-4 whitespace-nowrap text-left">Threshold</th>
                                <th className="px-6 py-4 whitespace-nowrap text-left">Supplier</th>
                                <th className="px-6 py-4 text-center whitespace-nowrap">Action</th>
                            </tr>
                        </thead>
                         <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {filteredAlerts.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-black text-gray-800 dark:text-gray-200">{item.name}</div>
                                        <div className="flex gap-2 mt-1 items-center">
                                            <span className="text-[10px] font-mono font-black px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded border border-gray-200 dark:border-gray-600 shadow-sm uppercase tracking-tighter">
                                                {item.batch}
                                            </span>
                                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                                                {item.sku}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col gap-1.5 w-32">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                                                <span className={`${item.status === 'Critical' ? 'text-red-600' : 'text-orange-600'}`}>{item.current} Left</span>
                                                <span className="text-gray-400">Limit: {item.reorderLevel}</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden border border-gray-200/50 dark:border-gray-600/50">
                                                <div className={`h-full ${item.status === 'Critical' ? 'bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-gradient-to-r from-orange-600 to-orange-400'}`} style={{ width: `${Math.min((item.current / item.reorderLevel) * 100, 100)}%` }}></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-gray-700 dark:text-gray-300"> {item.reorderLevel} <span className="text-[10px] font-normal text-gray-400 uppercase">units</span></span>
                                            <button onClick={() => handleSetThreshold(item)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-primary transition-colors"><Bell size={14} /></button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{item.supplier}</td>
                                    <td className="px-6 py-4 text-center">
                                        <button onClick={() => handleReorder(item)} className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg text-xs font-bold transition-all">Order Now</button>
                                    </td>
                                </tr>
                            ))}
                         </tbody>
                    </table>
                 </div>

                 {/* Pagination Controls */}
                 {paginationInfo.totalItems > 0 && (
                     <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Showing <span className="font-bold">{paginationInfo.startIndex}</span>-
                            <span className="font-bold">{paginationInfo.endIndex}</span> of{' '}
                            <span className="font-bold">{paginationInfo.totalItems}</span>
                        </p>
                        
                        <div className="flex items-center gap-2">
                            <select value={itemsPerPage} onChange={(e) => handleItemsPerPageChange(e.target.value)} className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm">
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="20">20</option>
                            </select>

                            <div className="flex items-center gap-1">
                                <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="p-1.5 rounded border hover:bg-gray-100 disabled:opacity-50"><ChevronLeft size={16} /></button>
                                <span className="px-3 py-1 bg-primary text-white rounded text-sm font-bold">{currentPage}</span>
                                <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="p-1.5 rounded border hover:bg-gray-100 disabled:opacity-50"><ChevronRight size={16} /></button>
                            </div>
                        </div>
                     </div>
                 )}
             </div>
        </div>
    );
};

export default LowStockAlerts;
