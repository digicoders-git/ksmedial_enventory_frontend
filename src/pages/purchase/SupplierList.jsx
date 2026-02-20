import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Phone, Mail, MapPin, MoreVertical, Edit2, Trash2, Truck, Star, CreditCard, X, Briefcase, FileText, CheckCircle, LayoutGrid, List as ListIcon, Building2, Printer, ChevronLeft, ChevronRight } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../api/axios';

const SupplierList = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchTerm, setSearchTerm] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/suppliers', {
        params: { keyword: searchTerm }
      });
      if (data.success) {
        setSuppliers(data.suppliers.map(s => ({
          ...s,
          id: s._id,
          supplierCode: s.supplierCode,
          contact: s.contactPerson,
          gst: s.gstNumber,
          license: s.drugLicenseNumber
        })));
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      Swal.fire('Error', 'Failed to fetch suppliers', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // Print function for supplier details
  const handlePrint = (supplier) => {
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Supplier Details - ${supplier.name}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 30px;
              color: #1f2937;
              background: white;
            }
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              border: 2px solid #e5e7eb;
              padding: 0;
            }
            .header {
              background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
              padding: 25px 30px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 4px solid #4338CA;
            }
            .logo-section {
              display: flex;
              align-items: center;
              gap: 15px;
            }
            .logo {
              width: 60px;
              height: 60px;
              background: white;
              border-radius: 8px;
              padding: 8px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .company-info {
              color: white;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 3px;
            }
            .company-tagline {
              font-size: 12px;
              opacity: 0.9;
            }
            .doc-info {
              text-align: right;
              color: white;
            }
            .doc-title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .doc-date {
              font-size: 11px;
              opacity: 0.9;
            }
            .content {
              padding: 30px;
            }
            .supplier-header {
              background: #F9FAFB;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 25px;
              border-left: 4px solid #4F46E5;
            }
            .supplier-name {
              font-size: 26px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 10px;
            }
            .badges {
              display: flex;
              gap: 10px;
              align-items: center;
            }
            .status-badge {
              display: inline-block;
              padding: 5px 12px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .status-active {
              background: #D1FAE5;
              color: #065F46;
              border: 1px solid #6EE7B7;
            }
            .status-inactive {
              background: #F3F4F6;
              color: #4B5563;
              border: 1px solid #D1D5DB;
            }
            .rating-badge {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              padding: 5px 12px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: bold;
              background: #FEF3C7;
              color: #92400E;
              border: 1px solid #FCD34D;
            }
            .details-section {
              margin-bottom: 25px;
            }
            .section-title {
              font-size: 13px;
              font-weight: bold;
              color: #6B7280;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 15px;
              padding-bottom: 8px;
              border-bottom: 2px solid #E5E7EB;
            }
            .details-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
            }
            .detail-item {
              padding: 15px;
              background: #F9FAFB;
              border: 1px solid #E5E7EB;
              border-radius: 6px;
            }
            .detail-label {
              font-size: 10px;
              font-weight: bold;
              color: #6B7280;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 6px;
            }
            .detail-value {
              font-size: 14px;
              font-weight: 600;
              color: #1f2937;
              word-break: break-word;
            }
            .full-width {
              grid-column: 1 / -1;
            }
            .balance-section {
              background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
              padding: 25px;
              border-radius: 8px;
              text-align: center;
              color: white;
              margin-top: 25px;
            }
            .balance-label {
              font-size: 12px;
              opacity: 0.9;
              margin-bottom: 8px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .balance-amount {
              font-size: 36px;
              font-weight: bold;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px solid #E5E7EB;
              text-align: center;
              color: #6B7280;
              font-size: 11px;
            }
            .footer p {
              margin: 5px 0;
            }
            @media print {
              body {
                padding: 0;
              }
              .invoice-container {
                border: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <div class="logo-section">
                <img src="/KS2-Logo.png" alt="KS2 Logo" class="logo" />
                <div class="company-info">
                  <div class="company-name">KS4 PharmaNet</div>
                  <div class="company-tagline">Pharmacy Management System</div>
                </div>
              </div>
              <div class="doc-info">
                <div class="doc-title">Supplier Information</div>
                <div class="doc-date">${new Date().toLocaleDateString('en-IN', { 
                  day: '2-digit',
                  month: 'short', 
                  year: 'numeric'
                })} at ${new Date().toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}</div>
              </div>
            </div>
            
            <div class="content">
              <div class="supplier-header">
                <div class="supplier-name">${supplier.name}</div>
                <div class="badges">
                  <span class="status-badge ${supplier.status === 'Active' ? 'status-active' : 'status-inactive'}">
                    ${supplier.status}
                  </span>
                  <span class="rating-badge">⭐ ${supplier.rating}</span>
                </div>
              </div>

              <div class="details-section">
                <div class="section-title">📋 Company Information</div>
                <div class="details-grid">
                  <div class="detail-item">
                    <div class="detail-label">Contact Person</div>
                    <div class="detail-value">${supplier.contact}</div>
                  </div>
                  
                  <div class="detail-item">
                    <div class="detail-label">Phone Number</div>
                    <div class="detail-value">${supplier.phone}</div>
                  </div>
                  
                  <div class="detail-item">
                    <div class="detail-label">Email Address</div>
                    <div class="detail-value">${supplier.email}</div>
                  </div>
                  
                  <div class="detail-item">
                    <div class="detail-label">City</div>
                    <div class="detail-value">${supplier.city}</div>
                  </div>
                </div>
              </div>

              <div class="details-section">
                <div class="section-title">📄 Legal Information</div>
                <div class="details-grid">
                  <div class="detail-item">
                    <div class="detail-label">GST Number</div>
                    <div class="detail-value">${supplier.gst}</div>
                  </div>
                  
                  <div class="detail-item">
                    <div class="detail-label">Drug License No.</div>
                    <div class="detail-value">${supplier.license}</div>
                  </div>
                  
                  <div class="detail-item full-width">
                    <div class="detail-label">Registered Address</div>
                    <div class="detail-value">${supplier.address}</div>
                  </div>
                </div>
              </div>

              <div class="balance-section">
                <div class="balance-label">Outstanding Balance</div>
                <div class="balance-amount">Rs. ${supplier.balance.toLocaleString('en-IN')}</div>
              </div>

              <div class="footer">
                <p><strong>Printed on:</strong> ${new Date().toLocaleString('en-IN', { 
                  dateStyle: 'full', 
                  timeStyle: 'short' 
                })}</p>
                <p>This is a computer-generated document and does not require a signature.</p>
                <p style="margin-top: 10px; color: #4F46E5; font-weight: bold;">KS4 PharmaNet © ${new Date().getFullYear()}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Pagination State
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const supplierData = {
      name: formData.get('name'),
      contactPerson: formData.get('contact'),
      gstNumber: formData.get('gst'),
      drugLicenseNumber: formData.get('license'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      city: formData.get('city'),
      address: formData.get('address'),
    };

    // Validation
    if (!supplierData.name || supplierData.name.trim() === '') {
      Swal.fire({
        icon: 'warning',
        title: 'Company Name Required',
        text: 'Please enter the company name',
        confirmButtonColor: '#007242'
      });
      return;
    }

    if (!supplierData.phone || supplierData.phone.trim() === '') {
      Swal.fire({
        icon: 'warning',
        title: 'Phone Number Required',
        text: 'Please enter the phone number',
        confirmButtonColor: '#007242'
      });
      return;
    }

    try {
      if (selectedSupplier) {
        // Edit mode
        const { data } = await api.put(`/suppliers/${selectedSupplier._id}`, supplierData);
        if (data.success) {
          Swal.fire('Updated', 'Supplier updated successfully', 'success');
        }
      } else {
        // Create mode
        const { data } = await api.post('/suppliers', supplierData);
        if (data.success) {
          Swal.fire('Created', 'New supplier added successfully', 'success');
        }
      }
      setShowAddModal(false);
      setSelectedSupplier(null);
      fetchSuppliers();
    } catch (error) {
      console.error("Error saving supplier:", error);
      Swal.fire('Error', error.response?.data?.message || 'Failed to save supplier', 'error');
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
              const { data } = await api.delete(`/suppliers/${id}`);
              if (data.success) {
                Swal.fire('Deleted!', 'Supplier has been deleted.', 'success');
                fetchSuppliers();
              }
            } catch (error) {
              Swal.fire('Error', 'Failed to delete supplier', 'error');
            }
        }
    });
  };

  const handleEdit = (supplier) => {
      setSelectedSupplier(supplier);
      setShowAddModal(true);
  };

  const handleView = (supplier) => {
      setSelectedSupplier(supplier);
      setShowViewModal(true);
  };

  const handleViewHistory = async (supplier) => {
    try {
        setHistoryLoading(true);
        const { data } = await api.get('/purchases', {
            params: { supplierId: supplier._id || supplier.id }
        });
        if (data.success) {
            setHistoryData(data.purchases);
            setSelectedSupplier(supplier);
            setShowViewModal(false); // Close view modal if it was open
            setShowHistoryModal(true);
        }
    } catch (error) {
        console.error("Error fetching history:", error);
        Swal.fire('Error', 'Failed to fetch supplier history', 'error');
    } finally {
        setHistoryLoading(false);
    }
  };

  // Pagination Logic
  const { paginatedSuppliers, totalPages, paginationInfo } = useMemo(() => {
    const totalItems = suppliers.length;
    const totalPgs = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = suppliers.slice(startIndex, endIndex);

    return {
      paginatedSuppliers: paginatedItems,
      totalPages: totalPgs,
      paginationInfo: {
        totalItems,
        startIndex: totalItems > 0 ? startIndex + 1 : 0,
        endIndex: Math.min(endIndex, totalItems),
        currentPage
      }
    };
  }, [suppliers, currentPage, itemsPerPage]);

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

  return (
    <>
      <div className="space-y-6 animate-fade-in-up pb-10">
        {/* Header */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="flex items-center gap-4 w-full xl:w-auto">
            <div className="p-4 bg-primary/10 text-primary rounded-2xl shadow-sm border border-primary/20 dark:border-primary/10">
              <Truck size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight leading-none flex items-center gap-2">
                Supplier Master
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1.5 opacity-90">Manage your medicine distributors and vendors.</p>
            </div>
          </div>
          <button 
            onClick={() => { setSelectedSupplier(null); setShowAddModal(true); }}
            className="w-full xl:w-auto flex items-center justify-center gap-2 bg-primary text-white px-8 py-3.5 rounded-xl font-black uppercase tracking-widest hover:bg-secondary shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95 text-[11px]"
          >
            <Plus size={18} strokeWidth={3} />
            <span>Add Supplier</span>
          </button>
        </div>

        {/* Filters & Toggle */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-center px-5 py-5">
            <div className="relative w-full xl:w-96">
               <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
               <input 
                 type="text" 
                 placeholder="Search name, contact, city..." 
                 value={searchTerm}
                 onChange={(e) => handleSearchChange(e.target.value)}
                 className="w-full pl-11 pr-4 py-3 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 font-medium"
               />
            </div>
            
            <div className="flex items-center gap-1.5 bg-gray-100/50 dark:bg-gray-900/50 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 w-full xl:w-auto">
                <button 
                    onClick={() => setViewMode('grid')}
                    className={`flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
                        ${viewMode === 'grid' 
                            ? 'bg-white dark:bg-gray-600 text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/10' 
                            : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700'}`}
                >
                    <LayoutGrid size={16} strokeWidth={2.5} />
                    <span>Grid</span>
                </button>
                <button 
                    onClick={() => setViewMode('list')}
                    className={`flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
                        ${viewMode === 'list' 
                            ? 'bg-white dark:bg-gray-600 text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/10' 
                            : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700'}`}
                >
                    <ListIcon size={16} strokeWidth={2.5} />
                    <span>List</span>
                </button>
            </div>
        </div>

        {/* Content */}
        {loading ? (
           <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
               <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
               <p className="text-gray-500 font-medium">Loading suppliers...</p>
           </div>
        ) : viewMode === 'grid' ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {paginatedSuppliers.map((supplier) => (
                    <div key={supplier.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden flex flex-col">
                    <div className="p-6 pb-4">
                        <div className="flex justify-between items-start mb-4">
                            <div className="lg:max-w-[70%]">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white truncate">{supplier.name}</h3>
                                    {supplier.status === 'Active' && <CheckCircle size={14} className="text-green-500 fill-green-50 dark:fill-green-900/20" />}
                                </div>
                                <p className="text-[10px] font-mono font-bold text-primary bg-primary/5 px-2 py-0.5 rounded inline-block mb-1">{supplier.supplierCode || 'N/A'}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1.5"><Briefcase size={12} /> {supplier.contact}</p>
                            </div>
                            <div className="w-10 h-10 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-500 group-hover:text-primary group-hover:bg-primary/5 transition-colors">
                                <Truck size={20} />
                            </div>
                        </div>

                        <div className="space-y-3 mb-4">
                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center shrink-0"><Phone size={16} /></div>
                                <span className="font-medium">{supplier.phone}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-500 flex items-center justify-center shrink-0"><Mail size={16} /></div>
                                <span className="truncate">{supplier.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-500 flex items-center justify-center shrink-0"><MapPin size={16} /></div>
                                <span className="truncate">{supplier.city}, {supplier.gst}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto border-t border-gray-50 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-700/30 p-4 px-6 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded uppercase tracking-wider font-bold inline-block mb-1">Due Balance</p>
                            <p className={`text-lg font-bold ${supplier.balance > 0 ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>Rs. {supplier.balance.toLocaleString()}</p>
                        </div>
                        <div className="flex gap-1 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(supplier)} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors" title="Edit"><Edit2 size={16} /></button>
                            <button onClick={() => handleView(supplier)} className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 rounded-lg transition-colors" title="View"><FileText size={16} /></button>
                            <button onClick={() => handlePrint(supplier)} className="p-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-400 dark:text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg transition-colors" title="Print"><Printer size={16} /></button>
                            <button onClick={() => handleDelete(supplier.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors" title="Delete"><Trash2 size={16} /></button>
                        </div>
                    </div>
                    </div>
                ))}
                {paginatedSuppliers.length === 0 && (
                   <div className="col-span-full py-16 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                      <p className="font-medium">No suppliers found.</p>
                      <p className="text-sm mt-1">Try adjusting your search.</p>
                   </div>
                )}
            </div>
        ) : (
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden animate-fade-in">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-750 border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Supplier Code</th>
                                <th className="px-6 py-4">Supplier Name</th>
                                <th className="px-6 py-4">City</th>
                                <th className="px-6 py-4">Contact Person</th>
                                <th className="px-6 py-4">Phone</th>
                                <th className="px-6 py-4">Balance</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {paginatedSuppliers.map((s) => (
                                <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs text-primary font-bold">{s.supplierCode || 'N/A'}</td>
                                    <td className="px-6 py-4 font-bold text-gray-800 dark:text-white">{s.name}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{s.city}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{s.contact}</td>
                                    <td className="px-6 py-4 font-medium dark:text-gray-300">{s.phone}</td>
                                    <td className={`px-6 py-4 font-bold ${s.balance > 0 ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>Rs. {s.balance.toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${s.status === 'Active' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`}>
                                            {s.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                         <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handleEdit(s)} className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                            <button onClick={() => handleView(s)} className="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"><FileText size={16} /></button>
                                            <button onClick={() => handlePrint(s)} className="p-1.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors" title="Print"><Printer size={16} /></button>
                                            <button onClick={() => handleDelete(s.id)} className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                         </div>
                                    </td>
                                </tr>
                            ))}
                            {paginatedSuppliers.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="px-6 py-10 text-center text-gray-400 dark:text-gray-500">
                                        No suppliers found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                 </div>
            </div>
        )}

        {/* Pagination Controls */}
        {paginationInfo.totalItems > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 px-6 py-6 transition-all">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              
              {/* Info & Limit Selector */}
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto justify-center lg:justify-start">
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium order-2 sm:order-1">
                  Showing <span className="font-black text-gray-800 dark:text-gray-200">{paginationInfo.startIndex}</span> to{' '}
                  <span className="font-black text-gray-800 dark:text-gray-200">{paginationInfo.endIndex}</span> of{' '}
                  <span className="font-black text-gray-800 dark:text-gray-200">{paginationInfo.totalItems}</span> suppliers
                </p>
                
                <div className="flex items-center gap-2 bg-white dark:bg-gray-700 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm order-1 sm:order-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Show:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(e.target.value)}
                    className="bg-transparent border-none text-sm font-black text-primary outline-none cursor-pointer focus:ring-0 p-0"
                  >
                    {[5, 10, 20, 50].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>

              {/* Page Navigation */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 sm:p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90"
                  >
                    <ChevronLeft size={18} strokeWidth={2.5} />
                  </button>

                  <div className="flex items-center gap-1 sm:gap-1.5">
                     {[...Array(totalPages)].map((_, i) => {
                        const pg = i + 1;
                        if (totalPages <= 7 || (pg === 1 || pg === totalPages || (pg >= currentPage - 1 && pg <= currentPage + 1))) {
                            return (
                                <button
                                    key={pg}
                                    onClick={() => goToPage(pg)}
                                    className={`min-w-[36px] sm:min-w-[40px] h-9 sm:h-10 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center shadow-sm active:scale-95
                                        ${currentPage === pg 
                                            ? 'bg-primary text-white shadow-primary/20 scale-105' 
                                            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary/50 border border-gray-200 dark:border-gray-600'}`}
                                >
                                    {pg}
                                </button>
                            );
                        } else if (pg === currentPage - 2 || pg === currentPage + 2) {
                            return <span key={pg} className="px-1 text-gray-400 font-black">...</span>;
                        }
                        return null;
                     })}
                  </div>

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 sm:p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90"
                  >
                    <ChevronRight size={18} strokeWidth={2.5} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl transform transition-all animate-scale-up border border-white/20 dark:border-gray-700 flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/50 rounded-t-2xl">
              <h3 className="font-bold text-gray-800 dark:text-white text-lg">{selectedSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 rounded-full bg-white dark:bg-gray-700 shadow-sm hover:shadow-md dark:shadow-none">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
               <form id="supplier-form" onSubmit={handleSubmit} className="space-y-6">
                  {/* Reuse existing form fields with proper defaultValues from selectedSupplier */}
                  <div>
                      <h4 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">Company Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1.5">
                              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Company Name <span className="text-red-500">*</span></label>
                              <input type="text" name="name" defaultValue={selectedSupplier?.name} placeholder="e.g. Health Distributors" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500" required />
                          </div>
                          <div className="space-y-1.5">
                              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Contact Person</label>
                              <input type="text" name="contact" defaultValue={selectedSupplier?.contact} placeholder="Rahul Singh" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500" />
                          </div>
                          <div className="space-y-1.5">
                              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">GSTIN</label>
                              <input type="text" name="gst" defaultValue={selectedSupplier?.gst} placeholder="27AABCU9603R1ZN" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl font-mono uppercase text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500" />
                          </div>
                           <div className="space-y-1.5">
                              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Drug License No.</label>
                              <input type="text" name="license" defaultValue={selectedSupplier?.license} placeholder="DL-123456" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl font-mono uppercase text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500" />
                          </div>
                          <div className="space-y-1.5">
                              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">City</label>
                              <input type="text" name="city" defaultValue={selectedSupplier?.city} placeholder="Mumbai" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none text-sm text-gray-800 dark:text-white" />
                          </div>
                      </div>
                  </div>
                  <div>
                      <h4 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-gray-700 pb-2 mt-4">Contact Info</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-1.5">
                              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Phone <span className="text-red-500">*</span></label>
                              <input type="tel" name="phone" defaultValue={selectedSupplier?.phone} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none text-sm text-gray-800 dark:text-white" required />
                          </div>
                          <div className="space-y-1.5">
                              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Email</label>
                              <input type="email" name="email" defaultValue={selectedSupplier?.email} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none text-sm text-gray-800 dark:text-white" />
                          </div>
                          <div className="col-span-1 md:col-span-2 space-y-1.5">
                              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Address</label>
                              <textarea rows="2" name="address" defaultValue={selectedSupplier?.address} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none text-sm resize-none text-gray-800 dark:text-white"></textarea>
                          </div>
                      </div>
                  </div>
               </form>
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-b-2xl sticky bottom-0 z-10">
              <button onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold hover:bg-white dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 text-sm">Cancel</button>
              <button type="submit" form="supplier-form" className="px-8 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-secondary shadow-lg shadow-primary/20 active:scale-95 transition-all text-sm">Save Supplier</button>
            </div>
          </div>
        </div>
      )}

      {/* View Supplier Modal */}
      {showViewModal && selectedSupplier && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
              <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl animate-scale-up border border-white/20 dark:border-gray-700 overflow-hidden">
                  <div className="relative bg-primary h-24">
                      <button onClick={() => setShowViewModal(false)} className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 p-2 rounded-full backdrop-blur-sm">
                          <X size={20} />
                      </button>
                      <div className="absolute -bottom-10 left-8 p-1 bg-white dark:bg-gray-800 rounded-2xl shadow-md">
                          <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700 rounded-xl flex items-center justify-center text-primary">
                              <Truck size={40} />
                          </div>
                      </div>
                  </div>
                  <div className="pt-12 px-8 pb-8">
                       <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{selectedSupplier.name}</h3>
                       <div className="flex gap-2 mt-2">
                           <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${selectedSupplier.status === 'Active' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`}>
                               {selectedSupplier.status}
                           </span>
                           <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold border bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                               <Star size={12} className="fill-amber-600 dark:fill-amber-400" /> {selectedSupplier.rating}
                           </span>
                       </div>

                       <div className="mt-6 space-y-4">
                           <div className="flex items-start gap-4">
                               <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg text-gray-500 dark:text-gray-400"><Building2 size={18} /></div>
                               <div>
                                   <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Company Info</p>
                                   <p className="text-sm font-medium text-gray-800 dark:text-white">{selectedSupplier.contact}</p>
                                   <p className="text-xs text-gray-500 dark:text-gray-400">GST: {selectedSupplier.gst}</p>
                               </div>
                           </div>
                           <div className="flex items-start gap-4">
                               <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg text-gray-500 dark:text-gray-400"><Phone size={18} /></div>
                               <div>
                                   <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Contact</p>
                                   <p className="text-sm font-medium text-gray-800 dark:text-white">{selectedSupplier.phone}</p>
                                   <p className="text-xs text-gray-500 dark:text-gray-400">{selectedSupplier.email}</p>
                               </div>
                           </div>
                           <div className="flex items-start gap-4">
                               <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg text-gray-500 dark:text-gray-400"><MapPin size={18} /></div>
                               <div>
                                   <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Address</p>
                                   <p className="text-sm font-medium text-gray-800 dark:text-white">{selectedSupplier.address}</p>
                                   <p className="text-xs text-gray-500 dark:text-gray-400">{selectedSupplier.city}</p>
                               </div>
                           </div>
                       </div>
                       
                       <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center gap-3">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Outstanding Balance</p>
                                <p className={`text-xl font-black ${selectedSupplier.balance > 0 ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>Rs. {selectedSupplier.balance.toLocaleString()}</p>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handlePrint(selectedSupplier)}
                                    className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-secondary transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
                                    title="Print Supplier Details"
                                >
                                    <Printer size={16} />
                                    Print
                                </button>
                                <button 
                                    onClick={() => handleViewHistory(selectedSupplier)}
                                    className="px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm font-bold rounded-xl hover:bg-black dark:hover:bg-gray-600 transition-colors"
                                >
                                    View History
                                </button>
                            </div>
                       </div>
                  </div>
              </div>
          </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedSupplier && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-fade-in">
              <div className="bg-white dark:bg-gray-800 w-full max-w-4xl rounded-3xl shadow-2xl animate-scale-up border border-white/20 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/50">
                      <div>
                          <h3 className="text-xl font-bold text-gray-800 dark:text-white">Transaction History</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Showing all purchases from <span className="font-bold text-primary">{selectedSupplier.name}</span></p>
                      </div>
                      <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 rounded-full bg-white dark:bg-gray-700 shadow-sm hover:shadow-md dark:shadow-none">
                          <X size={20} />
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                      {historyLoading ? (
                          <div className="flex flex-col items-center justify-center py-20">
                              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                              <p className="text-gray-500 font-medium">Fetching history...</p>
                          </div>
                      ) : historyData.length > 0 ? (
                          <div className="space-y-6">
                              <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
                                  <table className="w-full text-left text-sm">
                                      <thead className="bg-gray-50 dark:bg-gray-750 text-gray-500 dark:text-gray-400 uppercase font-semibold">
                                          <tr>
                                              <th className="px-6 py-4">Date</th>
                                              <th className="px-6 py-4">Invoice #</th>
                                              <th className="px-6 py-4">Status</th>
                                              <th className="px-6 py-4">Payment</th>
                                              <th className="px-6 py-4 text-right">Amount</th>
                                          </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                          {historyData.map((item) => (
                                              <tr key={item._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                                  <td className="px-6 py-4 dark:text-gray-300 whitespace-nowrap">
                                                       {new Date(item.purchaseDate || item.createdAt).toLocaleDateString('en-IN', {
                                                          day: '2-digit',
                                                          month: 'short',
                                                          year: 'numeric'
                                                      })}
                                                  </td>
                                                  <td className="px-6 py-4 font-bold text-gray-800 dark:text-white">{item.invoiceNumber}</td>
                                                  <td className="px-6 py-4">
                                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                          item.status === 'Received' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                          item.status === 'Pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                      }`}>
                                                          {item.status}
                                                      </span>
                                                  </td>
                                                  <td className="px-6 py-4">
                                                       <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                          item.paymentStatus === 'Paid' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                          item.paymentStatus === 'Partial' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                      }`}>
                                                          {item.paymentStatus}
                                                      </span>
                                                  </td>
                                                  <td className="px-6 py-4 text-right font-black text-gray-900 dark:text-white">
                                                      Rs. {item.grandTotal.toLocaleString()}
                                                  </td>
                                              </tr>
                                          ))}
                                      </tbody>
                                  </table>
                              </div>
                              
                              <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                                   <div className="flex items-center gap-4">
                                       <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                                           <CreditCard size={24} />
                                       </div>
                                       <div>
                                           <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Procurement</p>
                                           <p className="text-xl font-black text-gray-800 dark:text-white">Rs. {historyData.reduce((acc, curr) => acc + curr.grandTotal, 0).toLocaleString()}</p>
                                       </div>
                                   </div>
                                   <div className="flex items-center gap-3">
                                       <div className="text-right">
                                           <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-widest">Outstanding</p>
                                           <p className="text-lg font-black text-red-500">Rs. {selectedSupplier.balance.toLocaleString()}</p>
                                       </div>
                                   </div>
                              </div>
                          </div>
                      ) : (
                          <div className="flex flex-col items-center justify-center py-20 text-center">
                              <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700 rounded-3xl flex items-center justify-center text-gray-300 dark:text-gray-600 mb-4">
                                  <FileText size={40} />
                              </div>
                              <h4 className="text-lg font-bold text-gray-700 dark:text-white">No history found</h4>
                              <p className="text-gray-500 dark:text-gray-400 max-w-xs mt-1">There are no recorded transactions for this supplier yet.</p>
                          </div>
                      )}
                  </div>
                  
                  <div className="p-8 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50 flex justify-end">
                      <button onClick={() => setShowHistoryModal(false)} className="px-8 py-3 bg-gray-900 dark:bg-gray-700 text-white font-bold rounded-2xl hover:bg-black dark:hover:bg-gray-600 transition-all active:scale-95 shadow-lg shadow-gray-200 dark:shadow-none">
                          Close History
                      </button>
                  </div>
              </div>
          </div>
      )}

    </>
  );
};

export default SupplierList;
