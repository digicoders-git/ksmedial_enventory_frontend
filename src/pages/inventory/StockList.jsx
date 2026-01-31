import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Filter, Eye, Edit2, Ban, Calendar, X, Save, AlertTriangle, Plus, Package, Trash2, ChevronLeft, ChevronRight, QrCode, Download } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useInventory } from '../../context/InventoryContext';

const StockList = () => {
  const navigate = useNavigate();
  const { inventory, deleteItem, adjustStock, loading } = useInventory(); // Use context
  
  // Local loading state not needed if using context's loading, or alias it
  // const [inventory, setInventory] = useState([]); // REMOVED
  // const [loading, setLoading] = useState(true); // REMOVED

  // fetchStock REMOVED - InventoryContext handles it

  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [adjustmentData, setAdjustmentData] = useState({
    type: 'add',
    quantity: '',
    reason: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFilterDropdown && !event.target.closest('.filter-dropdown-container')) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilterDropdown]);

  const openAdjustModal = (stock) => {
    setSelectedStock(stock);
    setAdjustmentData({ type: 'add', quantity: '', reason: '' });
    setShowAdjustModal(true);
  };

  const openViewModal = (stock) => {
    setSelectedStock(stock);
    setShowViewModal(true);
  }

  const handleDelete = (id, name) => {
      Swal.fire({
          title: 'Are you sure?',
          text: `You want to delete ${name}? This action cannot be undone.`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Yes, delete it!'
      }).then(async (result) => {
          if (result.isConfirmed) {
            const res = await deleteItem(id);
            if (res.success) {
               Swal.fire('Deleted!', 'The item has been deleted.', 'success');
            } else {
               Swal.fire('Error', res.message, 'error');
            }
          }
      })
  };
  
  const handleAdjustmentChange = (e) => {
    const { name, value } = e.target;
    setAdjustmentData(prev => ({ ...prev, [name]: value }));
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustmentData.quantity || parseInt(adjustmentData.quantity) <= 0) {
      Swal.fire('Error', 'Please enter a valid quantity', 'error');
      return;
    }

    const qtyChange = parseInt(adjustmentData.quantity);
    
    // adjustStock(id, type, quantity, reason)
    // Note: InventoryContext adjustStock expects 'add' or 'deduct'. 
    // StockList uses 'add', 'subtract', 'damage', 'expired'. 
    // Need to map 'subtract'/'damage'/'expired' to 'deduct' but pass reason correctly?
    // Wait, InventoryContext adjustStock takes (id, type, ...). Check backend.
    // Backend productController: type === 'add' ? + : -. So 'deduct' or anything else works as minus.
    // But better to be explicit.
    
    const contextType = adjustmentData.type === 'add' ? 'add' : 'deduct';
    // If reason is needed, pass it.
    
    const result = await adjustStock(
        selectedStock.id, 
        contextType, 
        qtyChange, 
        adjustmentData.reason || adjustmentData.type // Use detailed type as reason if empty
    );

    if (result.success) {
        setShowAdjustModal(false);
        const actionText = adjustmentData.type === 'add' ? 'Added' : 'Removed';
         Swal.fire({
          icon: 'success',
          title: 'Stock Updated',
          text: `Successfully ${actionText} ${qtyChange} units.`,
          confirmButtonColor: '#007242',
          timer: 2000
        });
    } else {
       Swal.fire('Error', result.message, 'error');
    }
  };

  // Filter and search logic with pagination
  const { filteredStocks, totalPages, paginationInfo } = useMemo(() => {
    // Step 1: Search filter
    let filtered = inventory.filter(item => {
      const searchLower = searchTerm.toLowerCase().trim();
      if (!searchLower) return true;
      
      const nameMatch = item.name.toLowerCase().includes(searchLower);
      const batchMatch = item.batch?.toLowerCase().includes(searchLower);
      const skuMatch = item.sku?.toLowerCase().includes(searchLower);
      
      return nameMatch || batchMatch || skuMatch;
    });

    // Step 2: Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => {
        switch (filterStatus) {
          case 'active':
            return item.stock > 100;
          case 'low':
            return item.stock > 0 && item.stock <= 100;
          case 'out':
            return item.stock === 0;
          default:
            return true;
        }
      });
    }

    // Step 3: Pagination
    const totalItems = filtered.length;
    const totalPgs = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = filtered.slice(startIndex, endIndex);

    return {
      filteredStocks: paginatedItems,
      totalPages: totalPgs,
      paginationInfo: {
        totalItems,
        startIndex: startIndex + 1,
        endIndex: Math.min(endIndex, totalItems),
        currentPage
      }
    };
  }, [inventory, searchTerm, filterStatus, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (status) => {
    setFilterStatus(status);
    setCurrentPage(1);
    setShowFilterDropdown(false);
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

  return (
    <>
    <div className="space-y-6 animate-fade-in-up relative pb-10">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Stock List</h1>
           <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Detailed view of all batches and inventory status.</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => navigate('/inventory/stock-in')}
             className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-secondary shadow-md active:scale-95 transition-all flex items-center gap-2"
           >
             <Plus size={16} /> New Stock Entry
           </button>
           <div className="relative filter-dropdown-container">
             <button 
               onClick={() => setShowFilterDropdown(!showFilterDropdown)}
               className={`px-4 py-2 bg-white dark:bg-gray-800 border rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                 filterStatus !== 'all' 
                   ? 'border-primary text-primary dark:border-primary dark:text-primary' 
                   : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
               }`}
             >
               <Filter size={16} />
               Filter
               {filterStatus !== 'all' && (
                 <span className="ml-1 px-1.5 py-0.5 bg-primary text-white text-xs rounded-full">1</span>
               )}
             </button>

             {/* Filter Dropdown */}
             {showFilterDropdown && (
               <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
                 <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                   <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase px-2">Stock Status</p>
                 </div>
                 <div className="p-1">
                   <button
                     onClick={() => handleFilterChange('all')}
                     className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                       filterStatus === 'all'
                         ? 'bg-primary text-white font-medium'
                         : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                     }`}
                   >
                     All Stock
                   </button>
                   <button
                     onClick={() => handleFilterChange('active')}
                     className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                       filterStatus === 'active'
                         ? 'bg-green-500 text-white font-medium'
                         : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                     }`}
                   >
                     <span className="w-2 h-2 rounded-full bg-green-500"></span>
                     Active (&gt;100)
                   </button>
                   <button
                     onClick={() => handleFilterChange('low')}
                     className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                       filterStatus === 'low'
                         ? 'bg-yellow-500 text-white font-medium'
                         : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                     }`}
                   >
                     <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                     Low Stock (1-100)
                   </button>
                   <button
                     onClick={() => handleFilterChange('out')}
                     className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                       filterStatus === 'out'
                         ? 'bg-red-500 text-white font-medium'
                         : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                     }`}
                   >
                     <span className="w-2 h-2 rounded-full bg-red-500"></span>
                     Out of Stock
                   </button>
                 </div>
               </div>
             )}
           </div>
        </div>
      </div>

       <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
         <div className="relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
           <input 
             type="text" 
             placeholder="Search by Name, Batch, or SKU (QR Code)..." 
             value={searchTerm}
             onChange={(e) => handleSearchChange(e.target.value)}
             className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
           />
         </div>
       </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 uppercase">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap text-left">Medicine Name</th>
                <th className="px-6 py-4 whitespace-nowrap text-left">Batch Number</th>
                <th className="px-6 py-4 whitespace-nowrap text-left">SKU / QR</th>
                <th className="px-6 py-4 whitespace-nowrap text-left">Expiry Date</th>
                <th className="px-6 py-4 text-right whitespace-nowrap">Qty</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">Status</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {filteredStocks.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-200 whitespace-nowrap border-l-4 border-transparent hover:border-accent transition-all">{item.name}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-mono font-black text-xs whitespace-nowrap">{item.batch}</td>
                  <td className="px-6 py-4">
                     <span className="font-mono text-[10px] font-black px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded border border-blue-100 dark:border-blue-900/30 whitespace-nowrap inline-block shadow-sm uppercase tracking-tighter">
                        {item.sku}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400 flex items-center gap-2 whitespace-nowrap">
                     <Calendar size={14} className="text-gray-400" /> <span className="font-medium">{item.exp}</span>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-gray-800 dark:text-gray-100">{item.stock}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border
                      ${item.stock > 100 ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-800/30' : 
                        item.stock === 0 ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800/30' : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-100 dark:border-yellow-800/30'}`}>
                      {item.stock > 100 ? 'Active' : item.stock === 0 ? 'Out of Stock' : 'Low Stock'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                       <button 
                          onClick={() => openViewModal(item)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-blue-500 transition-colors" 
                          title="View Details"
                       >
                          <Eye size={16} />
                       </button>
                       <button 
                          onClick={() => openAdjustModal(item)} 
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-accent transition-colors" 
                          title="Adjust Stock"
                       >
                          <Edit2 size={16} />
                       </button>
                       <button 
                            onClick={() => handleDelete(item.id, item.name)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-red-500 transition-colors" 
                            title="Delete"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStocks.length === 0 && (
                  <tr><td colSpan="6" className="text-center py-6 text-gray-500 dark:text-gray-400">No items found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {paginationInfo.totalItems > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              {/* Items Info & Selector */}
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto justify-center lg:justify-start">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
                  Showing <span className="font-bold text-gray-800 dark:text-gray-200">{paginationInfo.startIndex}</span> to{' '}
                  <span className="font-bold text-gray-800 dark:text-gray-200">{paginationInfo.endIndex}</span> of{' '}
                  <span className="font-bold text-gray-800 dark:text-gray-200">{paginationInfo.totalItems}</span> items
                </p>
                
                <div className="flex items-center gap-2 bg-white dark:bg-gray-700 px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Show:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(e.target.value)}
                    className="bg-transparent border-none text-sm font-bold text-gray-700 dark:text-gray-300 focus:ring-0 outline-none cursor-pointer py-0.5"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </select>
                </div>
              </div>

              {/* Page Navigation */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90"
                    title="Previous Page"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    {/* First Page if needed */}
                    {currentPage > 2 && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => goToPage(1)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                        >
                          1
                        </button>
                        <span className="text-gray-400 px-1 font-bold">...</span>
                      </div>
                    )}

                    {/* Sequential Page Numbers around current */}
                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      // Show current, one before, one after
                      if (
                        pageNum === currentPage ||
                        pageNum === currentPage - 1 ||
                        pageNum === currentPage + 1
                      ) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => goToPage(pageNum)}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-black transition-all shadow-sm active:scale-95
                              ${currentPage === pageNum 
                                ? 'bg-primary text-white scale-105 z-10' 
                                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary hover:text-primary'}`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                      return null;
                    })}

                    {/* Last Page if needed */}
                    {currentPage < totalPages - 1 && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 px-1 font-bold">...</span>
                        <button
                          onClick={() => goToPage(totalPages)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                        >
                          {totalPages}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90"
                    title="Next Page"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {showViewModal && selectedStock && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl transform transition-all animate-scale-up border border-white/20 dark:border-gray-700 flex flex-col max-h-[85vh]">
             <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 shrink-0 rounded-t-2xl">
                 <div>
                    <h3 className="font-bold text-gray-800 dark:text-white text-xl">Batch Details</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">Inventory Information</p>
                 </div>
                 <button 
                   onClick={() => setShowViewModal(false)} 
                   className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors bg-gray-50 dark:bg-gray-700 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
                 >
                     <X size={20} />
                 </button>
             </div>
             
             <div className="p-6 overflow-y-auto custom-scrollbar">
                
                {/* Product Header */}
                <div className="flex gap-5 mb-8">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm shrink-0">
                        <Package size={28} />
                    </div>
                    <div>
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white leading-tight mb-1">{selectedStock.name}</h4>
                        <div className="flex flex-wrap gap-2">
                            <span className="text-xs font-bold px-2.5 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                {selectedStock.category || 'Medicine'}
                            </span>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${selectedStock.stock > 0 ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/30' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30'}`}>
                                {selectedStock.stock > 0 ? 'In Stock' : 'Out of Stock'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Batch Number</p>
                        <p className="font-mono font-bold text-gray-800 dark:text-gray-200 text-lg border-b border-gray-100 dark:border-gray-700 pb-1">{selectedStock.batch || 'N/A'}</p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Expiry Date</p>
                        <p className="font-bold text-gray-800 dark:text-gray-200 text-lg border-b border-gray-100 dark:border-gray-700 pb-1 flex items-center gap-2">
                           <Calendar size={16} className="text-red-500" /> {selectedStock.exp || 'N/A'}
                        </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">SKU Code</p>
                      <p className="font-mono font-bold text-gray-800 dark:text-gray-200 text-lg border-b border-gray-100 dark:border-gray-700 pb-1">
                        {selectedStock.sku || 'N/A'}
                      </p>
                    </div>

                    <div className="row-span-2 flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl">
                      <div className="bg-white p-2 rounded-lg shadow-sm mb-2">
                        <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(JSON.stringify({
                                id: selectedStock.id,
                                name: selectedStock.name,
                                batch: selectedStock.batch,
                                expiry: selectedStock.exp,
                                mrp: selectedStock.rate, // map rate to mrp for consistency
                                stock: selectedStock.stock,
                                sku: selectedStock.sku,
                                generic: selectedStock.generic,
                                company: selectedStock.company
                            }))}`}
                            alt="QR Code"
                            className="w-[120px] h-[120px]"
                        />
                      </div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Scan for Details</p>
                      <button 
                        onClick={async () => {
                            try {
                                const dataStart = JSON.stringify({
                                    id: selectedStock.id,
                                    name: selectedStock.name,
                                    batch: selectedStock.batch,
                                    expiry: selectedStock.exp,
                                    mrp: selectedStock.rate,
                                    stock: selectedStock.stock,
                                    sku: selectedStock.sku,
                                    generic: selectedStock.generic,
                                    company: selectedStock.company
                                });
                                const url = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(dataStart)}`;
                                const response = await fetch(url);
                                const blob = await response.blob();
                                const blobUrl = window.URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = blobUrl;
                                link.download = `${selectedStock.name}_${selectedStock.batch}_QR.png`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                window.URL.revokeObjectURL(blobUrl);
                            } catch (e) {
                                console.error(e);
                                Swal.fire('Error', 'Failed to download QR Code', 'error');
                            }
                        }}
                        className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <Download size={14} /> Download QR
                      </button>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Available Quantity</p>
                        <p className="font-bold text-gray-800 dark:text-gray-200 text-lg border-b border-gray-100 dark:border-gray-700 pb-1">
                           {selectedStock.stock} <span className="text-sm text-gray-400 font-medium">Units</span>
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Selling Price (MRP)</p>
                        <p className="font-bold text-gray-800 dark:text-gray-200 text-lg border-b border-gray-100 dark:border-gray-700 pb-1">
                           ₹ {selectedStock.rate}
                        </p>
                    </div>
                </div>

                <div className="mt-8 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-600">
                    <div className="flex justify-between items-center mb-2">
                       <h5 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Stock Level Indicator</h5>
                       <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{selectedStock.stock} / 1000</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${selectedStock.stock > 50 ? 'bg-green-500' : selectedStock.stock > 10 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                          style={{ width: `${Math.min((selectedStock.stock / 1000) * 100, 100)}%` }}
                        ></div>
                    </div>
                </div>
             </div>

             <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-b-2xl shrink-0 flex justify-end">
                 <button 
                   onClick={() => setShowViewModal(false)}
                   className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-bold rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm"
                 >
                   Close
                 </button>
             </div>
          </div>
        </div>,
        document.body
      )}

      {/* Adjust Stock Modal - Standardized */}
      {showAdjustModal && selectedStock && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl transform transition-all animate-scale-up border border-white/20 dark:border-gray-700 flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/50 shrink-0 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-gray-800 dark:text-white text-lg">Adjust Stock</h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Update quantity for <span className="font-mono font-semibold">{selectedStock.batch}</span></p>
              </div>
              <button 
                onClick={() => setShowAdjustModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors bg-white dark:bg-gray-700 p-2 rounded-full shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-6 space-y-6">
                
                {/* Current Info */}
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                        <Package size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Current Stock</p>
                         <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100">{selectedStock.stock} Units</h4>
                      </div>
                   </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Adjustment Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`cursor-pointer relative overflow-hidden rounded-xl border p-3 flex flex-col items-center justify-center gap-2 transition-all duration-200 group
                      ${adjustmentData.type === 'add' ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-400 shadow-sm' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                      <input type="radio" name="type" value="add" className="hidden" checked={adjustmentData.type === 'add'} onChange={handleAdjustmentChange} />
                      <div className={`p-1.5 rounded-full ${adjustmentData.type === 'add' ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'}`}>
                         <Plus size={18} />
                      </div>
                      <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">Add Stock</span>
                    </label>

                    <label className={`cursor-pointer relative overflow-hidden rounded-xl border p-3 flex flex-col items-center justify-center gap-2 transition-all duration-200 group
                      ${['subtract', 'damage', 'expired'].includes(adjustmentData.type) ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400 shadow-sm' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                       <input type="radio" name="type" value="subtract" className="hidden" checked={adjustmentData.type === 'subtract'} onChange={handleAdjustmentChange} />
                      <div className={`p-1.5 rounded-full ${['subtract', 'damage', 'expired'].includes(adjustmentData.type) ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'}`}>
                         <Ban size={18} />
                      </div>
                      <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">Remove Stock</span>
                    </label>
                  </div>

                  {/* Sub-options for Remove */}
                   <div className="grid grid-cols-2 gap-3 pt-1">
                     <label className={`cursor-pointer rounded-lg border px-3 py-2 flex items-center justify-center gap-2 transition-all text-xs font-medium
                        ${adjustmentData.type === 'damage' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 text-orange-700 dark:text-orange-400 shadow-sm' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                        <input type="radio" name="type" value="damage" className="hidden" checked={adjustmentData.type === 'damage'} onChange={handleAdjustmentChange} />
                        <AlertTriangle size={14} /> Damaged
                      </label>
                      <label className={`cursor-pointer rounded-lg border px-3 py-2 flex items-center justify-center gap-2 transition-all text-xs font-medium
                        ${adjustmentData.type === 'expired' ? 'bg-gray-100 dark:bg-gray-700 border-gray-400 text-gray-800 dark:text-gray-200 shadow-sm' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                        <input type="radio" name="type" value="expired" className="hidden" checked={adjustmentData.type === 'expired'} onChange={handleAdjustmentChange} />
                        <Calendar size={14} /> Expired/Lost
                      </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Quantity <span className="text-red-500">*</span></label>
                    <input 
                        type="number" 
                        name="quantity"
                        min="1"
                        autoFocus
                        placeholder="0" 
                        value={adjustmentData.quantity}
                        onChange={handleAdjustmentChange}
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-bold text-gray-800 dark:text-white transition-all"
                      />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Remarks</label>
                    <textarea 
                      name="reason"
                      rows="2"
                      placeholder="Reason for adjustment..." 
                      value={adjustmentData.reason}
                      onChange={handleAdjustmentChange}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none text-sm resize-none text-gray-800 dark:text-white"
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-b-2xl sticky bottom-0 z-10 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setShowAdjustModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 font-bold hover:bg-white dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500 transition-all text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={!adjustmentData.quantity}
                  className={`px-6 py-2.5 rounded-xl text-white font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed
                    ${adjustmentData.type === 'add' ? 'bg-primary hover:bg-secondary shadow-primary/20' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}`}
                >
                  <Save size={18} />
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
    </>
  );
};

export default StockList;
