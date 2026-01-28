import React, { useState } from 'react';
import { Search, Plus, Filter, MoreVertical, Phone, Mail, FileText, CheckCircle, XCircle, Printer } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import Swal from 'sweetalert2';

const SupplierList = () => {
  const { suppliers, addSupplier } = useInventory();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newSupplier, setNewSupplier] = useState({
      name: '',
      contact: '',
      email: '',
      gstin: '',
      address: '',
      status: 'Active'
  });

  const handleInputChange = (e) => {
      const { name, value } = e.target;
      setNewSupplier(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
      e.preventDefault();
      if (!newSupplier.name || !newSupplier.contact) {
          Swal.fire('Error', 'Name and Contact are required', 'error');
          return;
      }
      addSupplier(newSupplier);
      setShowModal(false);
      setNewSupplier({ name: '', contact: '', email: '', gstin: '', address: '', status: 'Active' });
      Swal.fire('Success', 'Supplier added successfully', 'success');
  };

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
                </div>
              </div>

              <div class="details-section">
                <div class="section-title">📋 Contact Information</div>
                <div class="details-grid">
                  <div class="detail-item">
                    <div class="detail-label">Contact Number</div>
                    <div class="detail-value">${supplier.contact}</div>
                  </div>
                  
                  <div class="detail-item">
                    <div class="detail-label">Email Address</div>
                    <div class="detail-value">${supplier.email || 'N/A'}</div>
                  </div>
                </div>
              </div>

              <div class="details-section">
                <div class="section-title">📄 Legal Information</div>
                <div class="details-grid">
                  <div class="detail-item">
                    <div class="detail-label">GST Number</div>
                    <div class="detail-value">${supplier.gstin || 'N/A'}</div>
                  </div>
                  
                  <div class="detail-item full-width">
                    <div class="detail-label">Registered Address</div>
                    <div class="detail-value">${supplier.address || 'N/A'}</div>
                  </div>
                </div>
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

  const filteredSuppliers = suppliers.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.contact.includes(searchTerm)
  );

  return (
    <div className="animate-fade-in-up space-y-6 pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">Supplier Management</h1>
           <p className="text-gray-500 text-sm mt-1">Manage your vendors and purchase sources.</p>
        </div>
        <button 
           onClick={() => setShowModal(true)}
           className="px-6 py-2.5 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:bg-secondary active:scale-95 transition-all flex items-center gap-2 font-bold text-sm"
        >
           <Plus size={18} /> Add New Supplier
        </button>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4">
         <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search Suppliers..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
            />
         </div>
         <button className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 flex items-center gap-2 text-sm font-medium">
             <Filter size={16} /> Filters
         </button>
      </div>

      {/* Supplier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
         {filteredSuppliers.map(supplier => (
             <div key={supplier.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                 <div className={`absolute top-0 left-0 w-1 h-full ${supplier.status === 'Active' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                 
                 <div className="flex justify-between items-start mb-4">
                     <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 flex items-center justify-center font-bold text-lg border border-blue-100">
                            {supplier.name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 line-clamp-1">{supplier.name}</h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${supplier.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                {supplier.status}
                            </span>
                        </div>
                     </div>
                     <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-50">
                        <MoreVertical size={18} />
                     </button>
                 </div>

                 <div className="space-y-3 text-sm text-gray-600">
                     <div className="flex items-center gap-3">
                         <Phone size={16} className="text-gray-400" />
                         <span>{supplier.contact}</span>
                     </div>
                     <div className="flex items-center gap-3">
                         <Mail size={16} className="text-gray-400" />
                         <span className="truncate">{supplier.email}</span>
                     </div>
                     <div className="flex items-center gap-3">
                         <FileText size={16} className="text-gray-400" />
                         <span className="font-mono text-xs bg-gray-50 px-2 py-1 rounded">GSTIN: {supplier.gstin || 'N/A'}</span>
                     </div>
                 </div>

                 <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center">
                     <div className="text-xs text-gray-400">
                         Balance: <span className="text-red-500 font-bold">₹ 12,450</span>
                     </div>
                     <div className="flex gap-2">
                         <button 
                             onClick={() => handlePrint(supplier)}
                             className="text-xs font-bold text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                             title="Print Supplier Details"
                         >
                             <Printer size={14} />
                             Print
                         </button>
                         <button className="text-xs font-bold text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors">
                             View Ledger
                         </button>
                     </div>
                 </div>
             </div>
         ))}
      </div>

      {/* Add Supplier Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
           <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
               <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                   <h3 className="font-bold text-gray-800">Add New Supplier</h3>
                   <button onClick={() => setShowModal(false)} className="mx-2 text-gray-400 hover:text-red-500"><XCircle size={20}/></button>
               </div>
               <form onSubmit={handleSubmit} className="p-6 space-y-4">
                   <div className="space-y-1.5">
                       <label className="text-xs font-bold text-gray-500 uppercase">Supplier Name *</label>
                       <input 
                         name="name" value={newSupplier.name} onChange={handleInputChange} 
                         className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-primary"
                         placeholder="Enter company name"
                         autoFocus
                       />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                           <label className="text-xs font-bold text-gray-500 uppercase">Contact No *</label>
                           <input 
                             name="contact" value={newSupplier.contact} onChange={handleInputChange} 
                             className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-primary"
                             placeholder="+91..."
                           />
                       </div>
                       <div className="space-y-1.5">
                           <label className="text-xs font-bold text-gray-500 uppercase">Email ID</label>
                           <input 
                             name="email" value={newSupplier.email} onChange={handleInputChange} 
                             className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-primary"
                             placeholder="name@company.com"
                           />
                       </div>
                   </div>
                   <div className="space-y-1.5">
                       <label className="text-xs font-bold text-gray-500 uppercase">GSTIN</label>
                       <input 
                         name="gstin" value={newSupplier.gstin} onChange={handleInputChange} 
                         className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-primary"
                         placeholder="GST Number"
                       />
                   </div>
                    <div className="space-y-1.5">
                       <label className="text-xs font-bold text-gray-500 uppercase">Address</label>
                       <textarea 
                         name="address" rows="2" value={newSupplier.address} onChange={handleInputChange} 
                         className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-primary resize-none"
                         placeholder="Full Address"
                       ></textarea>
                   </div>
                   
                   <div className="pt-4 flex justify-end gap-3">
                       <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 text-sm">Cancel</button>
                       <button type="submit" className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-secondary shadow-lg shadow-primary/20 text-sm">Save Supplier</button>
                   </div>
               </form>
           </div>
        </div>
      )}

    </div>
  );
};

export default SupplierList;
