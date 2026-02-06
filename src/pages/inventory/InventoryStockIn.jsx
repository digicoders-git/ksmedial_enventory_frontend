import { useState, useEffect } from 'react';
import { Search, Package, Save, Truck, Plus, RefreshCw, FileText, Trash2, ShoppingCart, CheckCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { createPortal } from 'react-dom';
import Swal from 'sweetalert2';
import Papa from 'papaparse';
import { useInventory } from '../../context/InventoryContext';
import api from '../../api/axios';

const InventoryStockIn = () => {    
  const navigate = useNavigate();
  const location = useLocation();
  const { inventory, suppliers, addSupplier } = useInventory();
  
  // Invoice Header State
  const [invoiceDetails, setInvoiceDetails] = useState({
    supplierId: '',
    invoiceNo: '',
    invoiceDate: new Date().toISOString().split('T')[0],
  });

  // Item Entry State
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [itemForm, setItemForm] = useState({
    batchNo: '',
    expiryDate: '',
    quantity: '',
    freeQty: 0,
    purchaseRate: '',
    mrp: '',
    rack: '',
    hsnCode: '',
    tax: '',
    packing: '',
    unit: '',
    company: ''
  });

  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSelectMedicine = (m) => {
      setSelectedMedicine(m);
      setSearchTerm(m.name);
      setItemForm(prev => ({
           ...prev,
           purchaseRate: m.purchasePrice || m.rate || '',
           mrp: m.sellingPrice || m.mrp || (m.rate ? m.rate * 1.5 : ''),
           hsnCode: m.hsnCode || '',
           tax: m.tax || '',
           packing: m.packing || '',
           unit: m.unit || '',
           company: m.company || '',
           rack: m.rackLocation || '',
           batchNo: '',
           quantity: '',
           freeQty: 0,
           expiryDate: '' 
       }));
  };

  const handleAddSupplier = async () => {
    const { value: name } = await Swal.fire({
      title: 'New Supplier',
      input: 'text',
      inputLabel: 'Supplier Name',
      showCancelButton: true,
      inputPlaceholder: 'Enter supplier name'
    });

    if (name) {
      const res = await addSupplier({ 
        name, 
        contactPerson: 'Manager', 
        phone: '9999999999', 
        email: 'supplier@example.com', 
        address: 'Local' 
      });
      if (res.success) {
        Swal.fire('Success', 'Supplier added', 'success');
      } else {
        Swal.fire('Error', res.message, 'error');
      }
    }
  };

  const handleInvoiceChange = (e) => {
      const { name, value } = e.target;
      
      if (name === 'supplierId' && value) {
          // Auto-generate invoice details when supplier is selected
          const randomInv = 'INV-' + Math.floor(1000 + Math.random() * 9000);
          const today = new Date().toISOString().split('T')[0];
          
          setInvoiceDetails(prev => ({
              ...prev,
              supplierId: value,
              invoiceNo: prev.invoiceNo || randomInv, // Keep existing if manually entered, else generate
              invoiceDate: prev.invoiceDate || today
          }));
      } else {
          setInvoiceDetails({ ...invoiceDetails, [name]: value });
      }
  };

  const handleItemChange = (e) => {
      setItemForm({ ...itemForm, [e.target.name]: e.target.value });
  };

  const generateBatch = () => {
    const randomBatch = 'BTC-' + Math.floor(Math.random() * 100000);
    setItemForm(prev => ({ ...prev, batchNo: randomBatch }));
  };

  // Physical Validation Loading
  const [physicalId, setPhysicalId] = useState(location.state?.prefill?.physicalId || '');
  
  const handleLoadPhysical = async () => {
      if (!physicalId) return;
      try {
          const { data } = await api.get(`/physical-receiving/${physicalId}`);
          if (data.success) {
            const entry = data.data;
            if (entry.status !== 'Done') {
                 Swal.fire('Warning', 'This physical entry is not marked as Validated/Done yet.', 'warning');
                 return;
            }
            // Auto fill
            setInvoiceDetails(prev => ({
                 ...prev,
                 invoiceNo: entry.invoiceNumber,
                 invoiceDate: entry.invoiceDate.split('T')[0],
                 // We need to find supplier ID by name if possible, or just warn
            }));

            // Try to find supplier
            const supplier = suppliers.find(s => s.name.toLowerCase() === entry.supplierName.toLowerCase());
            if (supplier) {
                setInvoiceDetails(prev => ({ ...prev, supplierId: supplier.id }));
            } else {
                Swal.fire('Info', `Supplier "${entry.supplierName}" not found in master. Please add it first.`, 'info');
            }

            Swal.fire('Success', `Loaded details for Invoice ${entry.invoiceNumber}`, 'success');
          }
      } catch (error) {
          Swal.fire('Error', 'Physical Validation ID not found', 'error');
      }
  };

  const addItemToCart = (e) => {
      e.preventDefault();
      if (!selectedMedicine) {
          Swal.fire('Error', 'Select a medicine first', 'error');
          return;
      }
      if (!itemForm.quantity || !itemForm.purchaseRate || !itemForm.batchNo) {
          Swal.fire('Error', 'Fill all required item details', 'warning');
          return;
      }

      const newItem = {
          id: Date.now(),
          medicineId: selectedMedicine.id,
          name: selectedMedicine.name,
          ...itemForm,
          total: parseFloat(itemForm.quantity) * parseFloat(itemForm.purchaseRate)
      };

      setCart([...cart, newItem]);
      
      // Reset Item Form
      setSelectedMedicine(null);
      setItemForm({
          batchNo: '',
          expiryDate: '',
          quantity: '',
          freeQty: 0,
          purchaseRate: '',
          mrp: '',
          rack: '',
          hsnCode: '',
          tax: '',
          packing: '',
          unit: '',
          company: ''
      });
      setSearchTerm('');
  };



  const removeItem = (id) => {
      setCart(cart.filter(item => item.id !== id));
  };
// ... rest of file until Search Render
// replacing Search Dropdown
// ...
// In replace_file_content I need to match exact context. I will replace from useInventory destructuring to handleSelectMedicine usage.


  // const location = useLocation(); // Moved to top
  const [invoiceImage, setInvoiceImage] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [savedPurchaseData, setSavedPurchaseData] = useState(null);

  // Load from Navigation State (GRN Waitlist)
  useEffect(() => {
    if (location.state?.prefill) {
        const { physicalId, entryData } = location.state.prefill;
        // setPhysicalId handled in init
        // Auto load details
        setInvoiceDetails(prev => ({
            ...prev,
            invoiceNo: entryData.invoiceNumber,
            invoiceDate: entryData.invoiceDate.split('T')[0],
        }));
        
        // Match supplier
        const supplier = suppliers.find(s => s.name.toLowerCase() === entryData.supplierName.toLowerCase());
        if (supplier) {
            setInvoiceDetails(prev => ({ ...prev, supplierId: supplier.id }));
        }
        
        // Notify
        Swal.fire({
            title: 'GRN Started',
            text: `Loaded validated entry ${physicalId}`,
            icon: 'info',
            timer: 2000,
            showConfirmButton: false
        });
    }
  }, [location.state, suppliers]);

  // Image Helper
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        // Convert to Base64 for simplicity in this demo environment
        const reader = new FileReader();
        reader.onloadend = () => {
            setInvoiceImage(reader.result);
        };
        reader.readAsDataURL(file);
    }
  };

  const removeInvoiceImage = () => {
      setInvoiceImage(null);
      // Reset file input if needed (by id)
      const fileInput = document.getElementById('invoice-image-input');
      if(fileInput) fileInput.value = '';
  };

  // CSV Helpers
  const downloadSampleCSV = () => {
      const csvContent = "data:text/csv;charset=utf-8," 
          + "Medicine Name,Batch Number,Expiry Date (YYYY-MM),Quantity,Free Quantity,Purchase Rate,MRP,HSN,GST %,Packing,Unit,Company\n"
          + "Dolo 650,BATCH123,2026-12,100,10,25.50,30.00,3004,12,15s,Strip,Micro Labs";
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "grn_import_sample.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleCSVUpload = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
              if (results.errors.length) {
                  console.error(results.errors);
                  Swal.fire('Error', 'Failed to parse CSV file', 'error');
                  return;
              }

              const newItems = results.data.map((row, index) => {
                  // Basic validation/mapping
                  if (!row['Medicine Name'] || !row['Quantity'] || !row['Purchase Rate']) return null;

                  return {
                      id: Date.now() + index, // unique id
                      medicineId: null, // New item or unmatched
                      name: row['Medicine Name'],
                      batchNo: row['Batch Number'] || 'NA',
                      expiryDate: row['Expiry Date (YYYY-MM)'] || '',
                      quantity: row['Quantity'],
                      freeQty: row['Free Quantity'] || 0,
                      purchaseRate: row['Purchase Rate'],
                      mrp: row['MRP'] || (parseFloat(row['Purchase Rate']) * 1.5).toFixed(2),
                      hsnCode: row['HSN'] || '',
                      tax: row['GST %'] || 0,
                      packing: row['Packing'] || '',
                      unit: row['Unit'] || '',
                      company: row['Company'] || '',
                      total: parseFloat(row['Quantity']) * parseFloat(row['Purchase Rate'])
                  };
              }).filter(item => item !== null);

              if (newItems.length > 0) {
                  setCart(prev => [...prev, ...newItems]);
                  Swal.fire('Success', `Imported ${newItems.length} items from CSV`, 'success');
              } else {
                  Swal.fire('Warning', 'No valid items found in CSV', 'warning');
              }
              
              // Reset input
              e.target.value = '';
          }
      });
  };

  const handleSaveInvoice = async () => {
      if (!invoiceDetails.supplierId || !invoiceDetails.invoiceNo) {
          Swal.fire('Error', 'Please fill Supplier and Invoice Number', 'error');
          return;
      }
      if (cart.length === 0) {
          Swal.fire('Error', 'Add at least one item to invoice', 'warning');
          return;
      }

      const physicalEntry = location.state?.prefill?.entryData;

      try {
          // Calculate totals (Same as before)
          let taxableAmount = 0;
          let mrpValue = 0;
          
          const items = cart.map(item => {
              const receivedQty = parseInt(item.quantity) || 0;
              const freeQty = parseInt(item.freeQty) || 0;
              const purchasePrice = parseFloat(item.purchaseRate) || 0;
              const mrp = parseFloat(item.mrp) || 0;
              const amount = receivedQty * purchasePrice;
              
              taxableAmount += amount;
              mrpValue += mrp * receivedQty;
              
              return {
                  productId: item.medicineId,
                  productName: item.name,
                  batchNumber: item.batchNo,
                  expiryDate: item.expiryDate || null,
                  receivedQty: receivedQty,
                  physicalFreeQty: freeQty,
                  schemeFreeQty: 0,
                  purchasePrice: purchasePrice,
                  sellingPrice: mrp,
                  mrp: mrp,
                  baseRate: purchasePrice,
                  amount: amount,
                  hsnCode: item.hsnCode || '',
                  cgst: parseFloat(item.tax) / 2 || 0,
                  sgst: parseFloat(item.tax) / 2 || 0,
                  igst: 0
              };
          });
          
          const amountAfterGst = taxableAmount;
          const invoiceAmount = Math.round(amountAfterGst);
          
          const payload = {
              supplierId: invoiceDetails.supplierId,
              invoiceNumber: invoiceDetails.invoiceNo,
              invoiceDate: invoiceDetails.invoiceDate,
              items: items,
              invoiceSummary: {
                  taxableAmount: parseFloat(taxableAmount.toFixed(2)),
                  tcsAmount: 0,
                  mrpValue: parseFloat(mrpValue.toFixed(2)),
                  netAmount: parseFloat(taxableAmount.toFixed(2)),
                  amountAfterGst: parseFloat(amountAfterGst.toFixed(2)),
                  roundAmount: invoiceAmount - amountAfterGst,
                  invoiceAmount: invoiceAmount
              },
              taxBreakup: {
                  gst5: { taxable: 0, tax: 0 },
                  gst12: { taxable: 0, tax: 0 },
                  gst18: { taxable: 0, tax: 0 },
                  gst28: { taxable: 0, tax: 0 }
              },
              subTotal: taxableAmount,
              taxAmount: 0,
              discount: 0,
              grandTotal: invoiceAmount,
              paymentStatus: 'Pending',
              paymentMethod: 'Cash',
              notes: 'Created from Stock In',
              status: 'Putaway_Pending',
              // Link
              physicalReceivingId: physicalEntry?._id
          };

          const { data } = await api.post('/purchases', payload);

          if (data.success) {
              const purchaseData = data.data || {};
              const purchaseId = purchaseData._id;
              
              // If loaded from Physical ID, update the status
              const physicalEntry = location.state?.prefill?.entryData;
              if (purchaseId && physicalEntry?._id) {
                  try {
                      await api.put(`/physical-receiving/${physicalEntry._id}/grn-status`, {
                          grnStatus: 'Done',
                          grnId: purchaseId,
                          invoiceImageUrl: invoiceImage
                      });
                  } catch (updateError) {
                      console.error("Failed to update GRN status", updateError);
                  }
              }

              // Show Success & QR Modal
              setSavedPurchaseData({ ...purchaseData, items }); // Pass items for QR
              setShowQRModal(true);
              
              // Clear Form later when closing modal
          } else {
              Swal.fire('Error', data.message || 'Failed to save purchase', 'error');
          }
      } catch (error) {
          console.error(error);
          Swal.fire('Error', error.response?.data?.message || 'Failed to save purchase transaction', 'error');
      }
  };

  const invoiceTotal = cart.reduce((sum, item) => sum + item.total, 0);

  // Filter medicines for search
  const filteredMedicines = inventory.filter(m => {
      const term = searchTerm.toLowerCase();
      return (
          m.name.toLowerCase().includes(term) ||
          m.sku?.toLowerCase().includes(term) ||
          m.batch?.toLowerCase().includes(term)
      );
  });

  return (
    <div className="animate-fade-in-up max-w-[1600px] mx-auto space-y-6 pb-10">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 dark:border-gray-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
             <Truck className="text-primary" /> Purchase Entry (Stock In)
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Create purchase invoice and add stock.</p>
        </div>
        <div className="flex gap-3">
             <button 
                onClick={() => navigate('/medicines/add')}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium flex items-center gap-2"
             >
                <Plus size={16} /> New Medicine
             </button>
             <button 
                onClick={() => navigate('/inventory/stock')}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium"
             >
                Cancel
             </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Input Form (4 cols) */}
        <div className="xl:col-span-4 space-y-4">

           {/* Physical Validation Loader */}
           <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex gap-2 items-center">
                <input 
                    value={physicalId}
                    onChange={(e) => setPhysicalId(e.target.value)}
                    placeholder="Enter Physical ID (e.g. PHY-1234)"
                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none text-sm font-bold uppercase"
                />
                <button 
                    onClick={handleLoadPhysical}
                    className="px-4 py-2 bg-secondary text-white rounded-lg font-bold text-sm hover:shadow-lg transition-all"
                >
                    Load
                </button>
           </div>
           
           {/* Invoice Details Card */}
           <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
             <h3 className="font-bold text-gray-800 dark:text-white mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                <FileText size={16} className="text-blue-500" /> Invoice Details
             </h3>
             <div className="space-y-3">
                <div className="space-y-1">
                   <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Supplier</label>
                   <div className="flex gap-2">
                       <select 
                         name="supplierId"
                         value={invoiceDetails.supplierId}
                         onChange={handleInvoiceChange}
                         className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none text-sm text-gray-800 dark:text-gray-100"
                       >
                          <option value="">Select Supplier</option>
                          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                       </select>
                       <button onClick={handleAddSupplier} className="px-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-100 dark:border-blue-900/30">
                            <Plus size={18} />
                       </button>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Invoice No</label>
                       <input name="invoiceNo" value={invoiceDetails.invoiceNo} onChange={handleInvoiceChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500" placeholder="INV-001" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Date</label>
                       <input type="date" name="invoiceDate" value={invoiceDetails.invoiceDate} onChange={handleInvoiceChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none text-sm text-gray-800 dark:text-gray-100" />
                    </div>
                </div>
                {/* Image Upload */}
                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center justify-between">
                         <span>Invoice Image</span>
                         <span className="text-[10px] bg-gray-100 dark:bg-gray-700 px-2 rounded text-gray-500">Optional</span>
                    </label>
                    
                    {!invoiceImage ? (
                        <div className="relative group">
                            <input 
                                  id="invoice-image-input"
                                  type="file" 
                                  accept="image/*"
                                  onChange={handleImageChange}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 group-hover:border-primary group-hover:text-primary transition-colors">
                                <FileText size={20} className="mb-1" />
                                <span className="text-xs font-medium">Click to Upload Invoice</span>
                            </div>
                        </div>
                    ) : (
                        <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group">
                            <img src={invoiceImage} alt="Invoice Preview" className="w-full h-32 object-cover" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={removeInvoiceImage} className="p-2 bg-white rounded-full text-red-500 hover:bg-red-50">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* CSV Upload */}
                 <div className="pt-2">
                     <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Bulk Upload</label>
                        <button onClick={downloadSampleCSV} className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline">Download Sample CSV</button>
                     </div>
                     <div className="relative">
                         <input 
                            type="file" 
                            accept=".csv"
                            onChange={handleCSVUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                         />
                         <button type="button" className="w-full py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-lg text-xs font-bold hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors flex items-center justify-center gap-2">
                             <FileText size={14} /> Upload Items via CSV
                         </button>
                     </div>
                 </div>
             </div>
           </div>

           {/* Item Add Card */}
           <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden flex flex-col h-auto">
             <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
             <h3 className="font-bold text-gray-800 dark:text-white mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                 <Package size={16} className="text-primary" /> Add Item
             </h3>
             
             <form onSubmit={addItemToCart} className="space-y-3">
                <div className="space-y-1 relative">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Search Medicine</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Scan QR or Search Name, SKU..."
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        />
                    </div>
                    {/* Dropdown results */}
                    {searchTerm && !selectedMedicine && (
                        <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-lg rounded-lg mt-1 max-h-48 overflow-y-auto">
                            {filteredMedicines.map(m => (
                                <div key={m.id} onClick={() => handleSelectMedicine(m)} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-200 border-b border-gray-50 dark:border-gray-700">
                                    {m.name}
                                </div>
                            ))}
                            {filteredMedicines.length === 0 && <div className="p-2 text-xs text-gray-400">No matches</div>}
                        </div>
                    )}
                </div>

                {selectedMedicine && (
                    <div className="bg-primary/5 dark:bg-primary/20 p-2 rounded text-xs text-primary dark:text-primary-light font-bold mb-2">
                        Selected: {selectedMedicine.name}
                    </div>
                )}

                {/* Auto-filled details row 1 */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Packing</label>
                        <input name="packing" value={itemForm.packing} onChange={handleItemChange} className="w-full px-2 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none text-sm text-gray-800 dark:text-gray-100" placeholder="e.g. 10s" />
                    </div>
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Unit</label>
                        <input name="unit" value={itemForm.unit} onChange={handleItemChange} className="w-full px-2 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none text-sm text-gray-800 dark:text-gray-100" placeholder="e.g. Strip" />
                    </div>
                </div>

                {/* Auto-filled details row 2 */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">HSN Code</label>
                        <input name="hsnCode" value={itemForm.hsnCode} onChange={handleItemChange} className="w-full px-2 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none text-sm text-gray-800 dark:text-gray-100" placeholder="HSN" />
                    </div>
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">GST %</label>
                        <input name="tax" value={itemForm.tax} onChange={handleItemChange} className="w-full px-2 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none text-sm text-gray-800 dark:text-gray-100" placeholder="0" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Batch</label>
                        <div className="flex gap-1">
                             <input name="batchNo" value={itemForm.batchNo} onChange={handleItemChange} className="w-full px-2 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none text-sm uppercase text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500" placeholder="B001" />
                             <button type="button" onClick={generateBatch} className="px-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-600 dark:text-gray-300"><RefreshCw size={14} /></button>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Expiry</label>
                        <input type="month" name="expiryDate" value={itemForm.expiryDate} onChange={handleItemChange} className="w-full px-2 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none text-sm text-gray-800 dark:text-gray-100" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Buy Qty</label>
                        <input type="number" name="quantity" value={itemForm.quantity} onChange={handleItemChange} className="w-full px-2 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none text-sm font-bold text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500" placeholder="0" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Free Qty</label>
                        <input type="number" name="freeQty" value={itemForm.freeQty} onChange={handleItemChange} className="w-full px-2 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500" placeholder="0" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Purchase Rate</label>
                        <input type="number" name="purchaseRate" value={itemForm.purchaseRate} onChange={handleItemChange} className="w-full px-2 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500" placeholder="0.00" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">MRP</label>
                        <input type="number" name="mrp" value={itemForm.mrp} onChange={handleItemChange} className="w-full px-2 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500" placeholder="0.00" />
                    </div>
                </div>

                <button type="submit" className="w-full py-2.5 bg-gray-900 dark:bg-black hover:bg-black dark:hover:bg-gray-900 border border-transparent dark:border-gray-700 text-white rounded-lg font-bold text-sm mt-2 transition-colors flex justify-center gap-2 items-center">
                    <Plus size={16} /> Add to Invoice
                </button>
             </form>
           </div>
        </div>

        {/* RIGHT COLUMN: Invoice Cart (8 cols) */}
        <div className="xl:col-span-8 flex flex-col h-full">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                       <ShoppingCart size={18} /> Invoice Items
                    </h3>
                    <div className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full font-bold">
                        {cart.length} Items Added
                    </div>
                </div>
                
                <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3">Medicine</th>
                                <th className="px-4 py-3">Batch / Exp</th>
                                <th className="px-4 py-3 text-center">Qty</th>
                                <th className="px-4 py-3 text-right">Rate</th>
                                <th className="px-4 py-3 text-right">Total</th>
                                <th className="px-4 py-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {cart.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-50 dark:border-gray-700 last:border-0">
                                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{item.name}</td>
                                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                                        <div>{item.batchNo}</div>
                                        <div>{item.expiryDate}</div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="font-bold text-gray-800 dark:text-gray-200">{item.quantity}</div>
                                        {parseInt(item.freeQty) > 0 && <div className="text-xs text-green-600 dark:text-green-400">+{item.freeQty} free</div>}
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">₹{parseFloat(item.purchaseRate).toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right font-bold text-gray-800 dark:text-gray-200">₹{item.total.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-center">
                                        <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {cart.length === 0 && (
                                <tr><td colSpan="6" className="text-center py-10 text-gray-400">List is empty. Add items from the left panel.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-end gap-10 text-right mb-6">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Sub Total</p>
                            <p className="text-lg font-bold text-gray-800 dark:text-gray-100">₹{invoiceTotal.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Tax</p>
                            <p className="text-lg font-bold text-gray-800 dark:text-gray-100">₹0.00</p>
                        </div>
                         <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Grand Total</p>
                            <p className="text-2xl font-bold text-primary">₹{invoiceTotal.toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-4">
                        <button type="button" className="px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold hover:bg-white dark:hover:bg-gray-800 text-sm transition-colors">Save as Draft</button>
                        <button onClick={handleSaveInvoice} disabled={cart.length===0} className="px-8 py-3 rounded-xl bg-primary text-white font-bold hover:bg-secondary shadow-lg shadow-primary/20 active:scale-95 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                            <Save size={18} className="inline mr-2" /> Complete Information
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
      {/* QR Code Modal */}
      {showQRModal && savedPurchaseData && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
             <div className="bg-white dark:bg-gray-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl animate-scale-in">
                 <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                     <div>
                        <h2 className="text-xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                             <CheckCircle className="text-green-500" /> GRN Completed Successfully
                        </h2>
                        <p className="text-xs text-gray-500">GRN ID: {savedPurchaseData._id}</p>
                     </div>
                 </div>
                 
                 <div className="p-8 space-y-8">
                      {/* Invoice QR */}
                      <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-600">
                          <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Invoice QR Code</h3>
                          <div className="bg-white p-4 rounded-xl shadow-sm">
                               <QRCodeCanvas 
                                  value={JSON.stringify({ 
                                      type: 'INVOICE', 
                                      id: savedPurchaseData._id, 
                                      no: savedPurchaseData.invoiceNumber,
                                      amt: savedPurchaseData.grandTotal 
                                  })} 
                                  size={150} 
                               />
                          </div>
                          <p className="mt-4 text-sm font-mono text-gray-500">{savedPurchaseData.invoiceNumber}</p>
                          <button className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold shadow-lg" onClick={() => window.print()}>Print Invoice QR</button>
                      </div>

                      {/* Item QRs */}
                      <div>
                          <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white border-b pb-2">Item Quantity Labels</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {savedPurchaseData.items.map((item, idx) => (
                                  <div key={idx} className="p-4 border border-gray-200 dark:border-gray-600 rounded-xl flex items-start gap-4 bg-white dark:bg-gray-700/30">
                                      <div className="bg-white p-2 rounded shadow-sm shrink-0">
                                          <QRCodeCanvas 
                                              value={JSON.stringify({
                                                  type: 'ITEM',
                                                  sku: item.productId, // Should be SKU ideally
                                                  batch: item.batchNumber,
                                                  exp: item.expiryDate
                                              })}
                                              size={64}
                                          />
                                      </div>
                                      <div className="min-w-0">
                                          <p className="text-sm font-bold truncate text-gray-800 dark:text-white">{item.productName}</p>
                                          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">Batch: {item.batchNumber}</p>
                                          <p className="text-xs text-gray-500 dark:text-gray-400">Qty: {item.receivedQty} + {item.physicalFreeQty}</p>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                 </div>

                 <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t flex justify-end">
                     <button 
                        onClick={() => {
                            setShowQRModal(false);
                            navigate('/purchase/invoices');
                        }}
                        className="px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg hover:bg-secondary transition-all"
                     >
                         Done & Go to List
                     </button>
                 </div>
             </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default InventoryStockIn;
