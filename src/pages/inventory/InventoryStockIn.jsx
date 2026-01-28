import React, { useState, useEffect } from 'react';
import { Search, Calendar, Package, DollarSign, Save, Truck, Plus, ArrowRight, RefreshCw, FileText, Trash2, ShoppingCart, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useInventory } from '../../context/InventoryContext';
import api from '../../api/axios';

const InventoryStockIn = () => {
  const navigate = useNavigate();
  const { inventory, suppliers } = useInventory();
  
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


  const handleSaveInvoice = async () => {
      if (!invoiceDetails.supplierId || !invoiceDetails.invoiceNo) {
          Swal.fire('Error', 'Please fill Supplier and Invoice Number', 'error');
          return;
      }
      if (cart.length === 0) {
          Swal.fire('Error', 'Add at least one item to invoice', 'warning');
          return;
      }

      try {
          const payload = {
              supplierId: invoiceDetails.supplierId,
              invoiceNumber: invoiceDetails.invoiceNo,
              purchaseDate: invoiceDetails.invoiceDate, // Backend expects purchaseDate or dates? Check model. Model has purchaseDate.
              items: cart.map(item => ({
                  productId: item.medicineId,
                  name: item.name,
                  quantity: parseInt(item.quantity) + parseInt(item.freeQty || 0), // Total qty
                  purchasePrice: parseFloat(item.purchaseRate),
                  amount: item.total
              })),
              subTotal: invoiceTotal,
              taxAmount: 0, // Not calculated in frontend currently
              discount: 0,
              grandTotal: invoiceTotal,
              paymentStatus: 'Unpaid', // Default
              paymentMethod: 'Cash', // Default
              notes: 'Created from Stock In'
          };

          const { data } = await api.post('/purchases', payload);

          if (data.success) {
              Swal.fire({
                  icon: 'success',
                  title: 'Purchase Saved',
                  text: `Invoice ${invoiceDetails.invoiceNo} saved and stock updated.`,
                  confirmButtonColor: '#007242'
              }).then(() => {
                  navigate('/purchase/invoices'); // Redirect to invoices list instead of stock list
              });
          } else {
              Swal.fire('Error', data.message || 'Failed to save purchase', 'error');
          }
      } catch (error) {
          console.error(error);
          Swal.fire('Error', 'Failed to save purchase transaction', 'error');
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
           
           {/* Invoice Details Card */}
           <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
             <h3 className="font-bold text-gray-800 dark:text-white mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                <FileText size={16} className="text-blue-500" /> Invoice Details
             </h3>
             <div className="space-y-3">
                <div className="space-y-1">
                   <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Supplier</label>
                   <select 
                     name="supplierId"
                     value={invoiceDetails.supplierId}
                     onChange={handleInvoiceChange}
                     className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none text-sm text-gray-800 dark:text-gray-100"
                   >
                      <option value="">Select Supplier</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                   </select>
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
    </div>
  );
};

export default InventoryStockIn;
