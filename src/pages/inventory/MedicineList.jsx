import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, MoreVertical, FileEdit, Trash2, Eye, QrCode, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import QRCodeModal from '../../components/QRCodeModal';
import { useInventory } from '../../context/InventoryContext';


const MedicineList = () => {
  const navigate = useNavigate();
  const { inventory: medicines, deleteItem } = useInventory(); // Use inventory as medicines

  // Pagination & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter & Pagination Logic
  const { filteredMedicines, totalPages, paginationInfo } = useMemo(() => {
    // Step 1: Search Filter
    let filtered = medicines;
    
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = medicines.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        (item.generic && item.generic.toLowerCase().includes(searchLower)) ||
        (item.company && item.company.toLowerCase().includes(searchLower)) ||
        (item.sku && item.sku.toLowerCase().includes(searchLower)) ||
        (item.batch && item.batch.toLowerCase().includes(searchLower))
      );
    }

    // Step 2: Pagination
    const totalItems = filtered.length;
    const totalPgs = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = filtered.slice(startIndex, endIndex);

    return {
      filteredMedicines: paginatedItems,
      totalPages: totalPgs,
      paginationInfo: {
        totalItems,
        startIndex: startIndex + 1,
        endIndex: Math.min(endIndex, totalItems),
        currentPage
      }
    };
  }, [medicines, searchTerm, currentPage, itemsPerPage]);

  // Handlers
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to page 1 on search
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

  // QR Code Modal State
  const [qrModal, setQrModal] = useState({ isOpen: false, medicine: null, medicines: [] });
  const [selectedItems, setSelectedItems] = useState([]);

  const handleEdit = (item) => {
    navigate('/medicines/add', { state: { medicine: item, mode: 'edit' } });
  };

  const handleView = (item) => {
    navigate('/medicines/add', { state: { medicine: item, mode: 'view' } });
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await deleteItem(id);
        if (res.success) {
           Swal.fire('Deleted!', 'Medicine has been deleted.', 'success');
        } else {
           Swal.fire('Error', res.message, 'error');
        }
      }
    });
  };

  // QR Code Handlers
  const handleGenerateQR = (medicine) => {
    setQrModal({ isOpen: true, medicine, medicines: [] });
  };

  const handleBatchQR = () => {
    if (selectedItems.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Items Selected',
        text: 'Please select at least one medicine to generate QR codes.',
      });
      return;
    }
    const selectedMedicines = medicines.filter(m => selectedItems.includes(m.id));
    setQrModal({ isOpen: true, medicine: null, medicines: selectedMedicines });
  };

  const toggleSelectItem = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === medicines.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(medicines.map(m => m.id));
    }
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Medicine Master</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your medicine list and details.</p>
          </div>
          <div className="flex gap-2">
            {selectedItems.length > 0 && (
              <button 
                onClick={handleBatchQR}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm active:scale-95"
              >
                <QrCode size={18} />
                <span>Generate QR ({selectedItems.length})</span>
              </button>
            )}
            <button 
              onClick={() => navigate('/medicines/add')}
              className="flex items-center gap-2 bg-accent hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm active:scale-95"
            >
              <Plus size={18} />
              <span>Add New Medicine</span>
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by Name, SKU, Batch or QR Code..." 
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {selectedItems.length > 0 && (
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {selectedItems.length} selected
              </span>
            )}
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors">
              <Filter size={16} />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4 w-12">
                    <input 
                      type="checkbox" 
                      checked={selectedItems.length === medicines.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-accent bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-accent focus:ring-2 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4 whitespace-nowrap text-left">Medicine Name</th>
                  <th className="px-6 py-4 whitespace-nowrap text-left">SKU / Barcode</th>
                  <th className="px-6 py-4 whitespace-nowrap text-left">Generic Name</th>
                  <th className="px-6 py-4 whitespace-nowrap text-left">Group</th>
                  <th className="px-6 py-4 whitespace-nowrap text-left">Company</th>
                  <th className="px-6 py-4 whitespace-nowrap text-right">Price (Rate / MRP)</th>
                  <th className="px-6 py-4 whitespace-nowrap text-center">Status</th>
                  <th className="px-6 py-4 whitespace-nowrap text-right">Stock</th>
                  <th className="px-6 py-4 whitespace-nowrap text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {filteredMedicines.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors group">
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggleSelectItem(item.id)}
                        className="w-4 h-4 text-accent bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-accent focus:ring-2 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-200 whitespace-nowrap">{item.name}</td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded border border-gray-200 dark:border-gray-600 uppercase tracking-tighter whitespace-nowrap inline-block shadow-sm">
                          {item.sku}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">{item.generic}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">{item.company}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-gray-800 dark:text-gray-200 font-bold">₹{item.mrp?.toFixed(2) || '0.00'}</span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Rate: ₹{item.purchasePrice?.toFixed(2) || '0.00'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${item.status === 'Active' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900/30' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30'}`}>
                         {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {item.stock} <span className="text-[10px] text-gray-400 dark:text-gray-500 font-normal ml-1 uppercase">{item.unit}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleGenerateQR(item)}
                          className="p-1.5 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-400 dark:text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 rounded transition-colors" 
                          title="Generate QR Code"
                        >
                           <QrCode size={16} />
                        </button>
                        <button 
                          onClick={() => handleView(item)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors" 
                          title="View"
                        >
                           <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => handleEdit(item)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-accent dark:hover:text-accent rounded transition-colors" 
                          title="Edit"
                        >
                           <FileEdit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-danger dark:hover:text-red-400 rounded transition-colors" 
                          title="Delete"
                        >
                           <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredMedicines.length === 0 && (
                  <tr>
                     <td colSpan="9" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                        No medicines found matching your search.
                     </td>
                  </tr>
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
                                  ? 'bg-accent text-white scale-105 z-10' 
                                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-accent hover:text-accent'}`}
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
      </div>

      {/* QR Code Modal moved outside animated container */}
      <QRCodeModal 
        isOpen={qrModal.isOpen}
        onClose={() => setQrModal({ isOpen: false, medicine: null, medicines: [] })}
        medicine={qrModal.medicine}
        medicines={qrModal.medicines}
      />
    </>
  );
};

export default MedicineList;
