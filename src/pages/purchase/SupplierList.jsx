import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Phone, Mail, MapPin, MoreVertical, Edit2, Trash2, Truck, Star, CreditCard, X, Briefcase, FileText, CheckCircle, LayoutGrid, List as ListIcon, Building2, Printer, ChevronLeft, ChevronRight } from 'lucide-react';
import Swal from 'sweetalert2';

const SupplierList = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchTerm, setSearchTerm] = useState('');

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
                <div class="balance-amount">₹${supplier.balance.toLocaleString('en-IN')}</div>
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Mock Data
  const [suppliers, setSuppliers] = useState([
    { id: 1, name: 'Health Dist', contact: 'Rahul Singh', phone: '9876543210', email: 'rahul@healthdist.com', gst: '27AABCU9603R1ZN', city: 'Mumbai', address: '123, Pharma Park, Andheri East, Mumbai', rating: 4.5, status: 'Active', balance: 0, license: 'DL-MH-10293' },
    { id: 2, name: 'Pharma World', contact: 'Amit Verma', phone: '9898989898', email: 'amit@pharmaworld.com', gst: '27AABCU9603R1ZN', city: 'Pune', address: '45, Tech Hub, Hinjewadi, Pune', rating: 4.8, status: 'Active', balance: 12500, license: 'DL-MH-44556' },
    { id: 3, name: 'Sun Pharma Dist', contact: 'Suresh Kumar', phone: '9123456780', email: 'suresh@sunpharma.com', gst: '27AABCU9603R1ZN', city: 'Nagpur', address: 'Plot 88, MIDC, Nagpur', rating: 4.2, status: 'Inactive', balance: 0, license: 'DL-MH-77889' },
    { id: 4, name: 'MediCare Supplies', contact: 'Priya Gupta', phone: '8765432109', email: 'priya@medicare.com', gst: '27AABCU9603R1ZN', city: 'Nashik', address: 'Shop 12, Main Market, Nashik', rating: 4.0, status: 'Active', balance: 45000, license: 'DL-MH-33221' },
    { id: 5, name: 'Global Meds', contact: 'Vikram Das', phone: '9000012345', email: 'vikram@globalmeds.com', gst: '27AABCU9603R1ZN', city: 'Thane', address: 'Sector 5, Thane West', rating: 4.6, status: 'Active', balance: 2500, license: 'DL-MH-55667' },
    { id: 6, name: 'Zenith Pharma', contact: 'Anjali Rao', phone: '9988776655', email: 'anjali@zenith.com', gst: '27AABCU9603R1ZN', city: 'Aurangabad', address: 'Industrial Area, Waluj', rating: 3.9, status: 'Inactive', balance: 0, license: 'DL-MH-99001' },
    { id: 7, name: 'LifeCare Distributors', contact: 'Rohan Mehta', phone: '8877665544', email: 'rohan@lifecare.com', gst: '27AABCU9603R1ZN', city: 'Mumbai', address: 'Dadar West, Mumbai', rating: 4.3, status: 'Active', balance: 18000, license: 'DL-MH-22334' },
    { id: 8, name: 'Shiv Shakti Pharma', contact: 'Manoj Tiwari', phone: '7766554433', email: 'manoj@shivshakti.com', gst: '27AABCU9603R1ZN', city: 'Pune', address: 'Camp, Pune', rating: 4.1, status: 'Active', balance: 5000, license: 'DL-MH-44112' },
    { id: 9, name: 'Apollo Supply Chain', contact: 'Kavita Iyer', phone: '6655443322', email: 'kavita@apollo.com', gst: '27AABCU9603R1ZN', city: 'Navi Mumbai', address: 'Vashi, Navi Mumbai', rating: 4.9, status: 'Active', balance: 0, license: 'DL-MH-77665' },
    { id: 10, name: 'Metro Medicals', contact: 'Rajesh Khanna', phone: '5544332211', email: 'rajesh@metro.com', gst: '27AABCU9603R1ZN', city: 'Mumbai', address: 'Bandra, Mumbai', rating: 4.4, status: 'Active', balance: 8900, license: 'DL-MH-33445' },
    { id: 11, name: 'Universal Drugs', contact: 'Simran Kaur', phone: '4433221100', email: 'simran@universal.com', gst: '27AABCU9603R1ZN', city: 'Nagpur', address: 'Sitabuldi, Nagpur', rating: 3.8, status: 'Inactive', balance: 0, license: 'DL-MH-11223' },
    { id: 12, name: 'City Pharma', contact: 'Arjun Reddy', phone: '3322110099', email: 'arjun@citypharma.com', gst: '27AABCU9603R1ZN', city: 'Nashik', address: 'Gangapur Road, Nashik', rating: 4.7, status: 'Active', balance: 1200, license: 'DL-MH-66778' },
    { id: 13, name: 'Best Care', contact: 'Pooja Hegde', phone: '2211009988', email: 'pooja@bestcare.com', gst: '27AABCU9603R1ZN', city: 'Pune', address: 'Kothrud, Pune', rating: 4.5, status: 'Active', balance: 0, license: 'DL-MH-88990' },
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowAddModal(false);
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: selectedSupplier ? 'Supplier updated successfully!' : 'New supplier added successfully!',
      timer: 2000,
      showConfirmButton: false
    });
    setSelectedSupplier(null);
  };

  const handleDelete = (id) => {
    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            setSuppliers(suppliers.filter(s => s.id !== id));
            Swal.fire('Deleted!', 'Supplier has been deleted.', 'success');
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

  // Filter & Pagination Logic
  const { paginatedSuppliers, totalPages, paginationInfo } = useMemo(() => {
    const search = searchTerm.toLowerCase();
    const filtered = suppliers.filter(s => 
      s.name.toLowerCase().includes(search) || 
      s.contact.toLowerCase().includes(search) || 
      s.city.toLowerCase().includes(search)
    );

    const totalItems = filtered.length;
    const totalPgs = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = filtered.slice(startIndex, endIndex);

    return {
      paginatedSuppliers: paginatedItems,
      totalPages: totalPgs,
      paginationInfo: {
        totalItems,
        startIndex: startIndex + 1,
        endIndex: Math.min(endIndex, totalItems),
        currentPage
      }
    };
  }, [suppliers, searchTerm, currentPage, itemsPerPage]);

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Truck className="text-primary" /> Supplier Master
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your medicine distributors and vendors.</p>
          </div>
          <button 
            onClick={() => { setSelectedSupplier(null); setShowAddModal(true); }}
            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:bg-secondary shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all text-sm"
          >
            <Plus size={18} />
            <span>Add Supplier</span>
          </button>
        </div>

        {/* Filters & Toggle */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative w-full sm:w-96">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
               <input 
                 type="text" 
                 placeholder="Search name, contact, city..." 
                 value={searchTerm}
                 onChange={(e) => handleSearchChange(e.target.value)}
                 className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
               />
            </div>
            
            <div className="flex gap-2">
                <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg border border-gray-200 dark:border-gray-600">
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 text-primary shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                        title="Grid View"
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 text-primary shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                        title="List View"
                    >
                        <ListIcon size={18} />
                    </button>
                </div>
            </div>
        </div>

        {/* Content */}
        {viewMode === 'grid' ? (
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
                            <p className={`text-lg font-bold ${supplier.balance > 0 ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>₹{supplier.balance.toLocaleString()}</p>
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
                                    <td className="px-6 py-4 font-bold text-gray-800 dark:text-white">{s.name}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{s.city}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{s.contact}</td>
                                    <td className="px-6 py-4 font-medium dark:text-gray-300">{s.phone}</td>
                                    <td className={`px-6 py-4 font-bold ${s.balance > 0 ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>₹{s.balance.toLocaleString()}</td>
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
                                    <td colSpan="7" className="px-6 py-10 text-center text-gray-400 dark:text-gray-500">
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
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm mt-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Items Info */}
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing <span className="font-bold text-gray-800 dark:text-gray-200">{paginationInfo.startIndex}</span> to{' '}
                  <span className="font-bold text-gray-800 dark:text-gray-200">{paginationInfo.endIndex}</span> of{' '}
                  <span className="font-bold text-gray-800 dark:text-gray-200">{paginationInfo.totalItems}</span> suppliers
                </p>
                
                {/* Items per page selector */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400">Show:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(e.target.value)}
                    className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <div className="flex items-center gap-1">
                     {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${currentPage === page ? 'bg-primary text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        >
                            {page}
                        </button>
                     ))}
                  </div>

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight size={18} />
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
                              <input type="text" defaultValue={selectedSupplier?.name} placeholder="e.g. Health Distributors" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500" required />
                          </div>
                          <div className="space-y-1.5">
                              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Contact Person</label>
                              <input type="text" defaultValue={selectedSupplier?.contact} placeholder="Rahul Singh" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500" />
                          </div>
                          <div className="space-y-1.5">
                              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">GSTIN</label>
                              <input type="text" defaultValue={selectedSupplier?.gst} placeholder="27AABCU9603R1ZN" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl font-mono uppercase text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500" />
                          </div>
                           <div className="space-y-1.5">
                              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Drug License No.</label>
                              <input type="text" defaultValue={selectedSupplier?.license} placeholder="DL-123456" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl font-mono uppercase text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500" />
                          </div>
                      </div>
                  </div>
                  <div>
                      <h4 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-gray-700 pb-2 mt-4">Contact Info</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-1.5">
                              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Phone <span className="text-red-500">*</span></label>
                              <input type="tel" defaultValue={selectedSupplier?.phone} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none text-sm text-gray-800 dark:text-white" required />
                          </div>
                          <div className="space-y-1.5">
                              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Email</label>
                              <input type="email" defaultValue={selectedSupplier?.email} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none text-sm text-gray-800 dark:text-white" />
                          </div>
                          <div className="col-span-1 md:col-span-2 space-y-1.5">
                              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Address</label>
                              <textarea rows="2" defaultValue={selectedSupplier?.address} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none text-sm resize-none text-gray-800 dark:text-white"></textarea>
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
                                <p className={`text-xl font-black ${selectedSupplier.balance > 0 ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>₹{selectedSupplier.balance.toLocaleString()}</p>
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
                                <button className="px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm font-bold rounded-xl hover:bg-black dark:hover:bg-gray-600 transition-colors">
                                    View History
                                </button>
                            </div>
                       </div>
                  </div>
              </div>
          </div>
      )}
    </>
  );
};

export default SupplierList;
