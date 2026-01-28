import React, { useState, useMemo } from 'react';
import { Search, ShoppingCart, User, Plus, Trash2, ArrowRight, Printer, FileText, CheckCircle } from 'lucide-react';
import Swal from 'sweetalert2';

import { useInventory } from '../../context/InventoryContext';

const InventoryStockOut = () => {
  const { inventory, sellItems, transactions } = useInventory(); // Use Context
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [stockOutReason, setStockOutReason] = useState('Sale');
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [paymentMode, setPaymentMode] = useState('Cash');

  // FEFO (First Expiring First Out) + FIFO (First In First Out) Sorting
  const sortedInventory = useMemo(() => {
    return [...inventory].sort((a, b) => {
      // Step 1: Same medicine name? Sort by Expiry Date
      if (a.name.toLowerCase() === b.name.toLowerCase()) {
        const dateA = new Date(a.exp);
        const dateB = new Date(b.exp);
        if (dateA - dateB !== 0) return dateA - dateB;
        // Tie-breaker: Same expiry date? Use FIFO (First added comes first)
        return a.id - b.id;
      }
      // Step 2: Different medicines? Sort alphabetically
      return a.name.localeCompare(b.name);
    });
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return sortedInventory.filter(m => 
      m.name.toLowerCase().includes(term) || 
      m.batch?.toLowerCase().includes(term) ||
      m.sku?.toLowerCase().includes(term)
    );
  }, [sortedInventory, searchTerm]);

  // Removed local medicines mock data

  const addToCart = (medicine) => {
    if (medicine.stock <= 0) {
       Swal.fire('Out of Stock', 'This item is currently unavailable.', 'error');
       return;
    }
    const existing = cart.find(item => item.id === medicine.id);
    if (existing) {
      if (existing.qty < medicine.stock) {
        setCart(cart.map(item => item.id === medicine.id ? { ...item, qty: item.qty + 1 } : item));
      } else {
        Swal.fire('Limit Reached', 'Cannot add more than available stock', 'warning');
      }
    } else {
      // Ensure we use 'rate' as price in cart for consistency
      setCart([...cart, { ...medicine, qty: 1, price: medicine.rate }]);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQty = (id, newQty) => {
    if (newQty < 1) return;
    const item = cart.find(i => i.id === id);
    if (newQty > item.stock) {
       Swal.fire('Stock Limit', `Only ${item.stock} units available`, 'warning');
       return;
    }
    setCart(cart.map(i => i.id === id ? { ...i, qty: newQty } : i));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.qty), 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      Swal.fire('Cart Empty', 'Please add medicines to process', 'error');
      return;
    }
    
    Swal.fire({
      title: 'Confirm Stock Out?',
      html: `
        <div class="text-left text-sm">
           <p><strong>Reason:</strong> ${stockOutReason}</p>
           ${stockOutReason === 'Sale' ? `<p><strong>Payment Mode:</strong> ${paymentMode}</p>` : ''}
           <p><strong>Items:</strong> ${cart.length}</p>
           <p><strong>Total Amount:</strong> ₹${calculateTotal().toFixed(2)}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirm & Process',
      confirmButtonColor: 'var(--color-primary)'
    }).then((result) => {
      if (result.isConfirmed) {
        // Use context sellItems
        const soldItems = cart.map(item => ({ id: item.id, qty: item.qty }));
        const saleResult = sellItems(soldItems, { 
            customer, 
            paymentMode: stockOutReason === 'Sale' ? paymentMode : null,
            reason: stockOutReason
        });
        
        if (saleResult.success) {
            Swal.fire('Success', 'Stock deducted successfully!', 'success');
            setCart([]);
            setCustomer({ name: '', phone: '' });
        } else {
            Swal.fire('Error', saleResult.message, 'error');
        }
      }
    });
  };

  return (
    <div className="animate-fade-in-up pb-10 space-y-8">
      <div className="h-[calc(100vh-100px)] flex flex-col xl:flex-row gap-6">
      
      {/* LEFT: Product Catalog (Professional List View) */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
         {/* Search Header */}
         <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 relative w-full">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
               <input 
                 type="text" 
                 placeholder="Scan QR or Search Name, SKU, Batch..." 
                 className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 autoFocus
               />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
               <select className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
                  <option>All Categories</option>
                  <option>Tablets</option>
                  <option>Syrups</option>
                  <option>Injections</option>
               </select>
            </div>
         </div>

         {/* Product List Table Header */}
         <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50/80 dark:bg-gray-700/80 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
            <div className="col-span-4">Medicine Info</div>
            <div className="col-span-2">Batch / Exp</div>
            <div className="col-span-2 text-center">Stock</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-2 text-center">Action</div>
         </div>

          {/* Product List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
             {filteredInventory.length > 0 ? (
                <div className="divide-y divide-gray-50 dark:divide-gray-700">
                   {filteredInventory.map((item) => (
                      <div key={item.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors group">
                         
                         {/* Name & Company */}
                        <div className="col-span-4">
                           <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm">{item.name}</h4>
                           <p className="text-xs text-gray-400 mt-0.5">{item.company || 'Generic'} • {item.category}</p>
                           {item.sku && <span className="text-[10px] text-blue-500 font-mono">{item.sku}</span>}
                        </div>

                        {/* Batch & Exp */}
                        <div className="col-span-2">
                           <span className="block text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded w-fit mb-1">{item.batch}</span>
                           <span className={`text-[10px] font-bold ${item.exp?.includes('23') ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                              Exp: {item.exp}
                           </span>
                        </div>

                        {/* Stock */}
                        <div className="col-span-2 text-center">
                           <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.stock === 0 ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : item.stock < 50 ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'}`}>
                              {item.stock}
                           </span>
                        </div>

                        {/* Price */}
                        <div className="col-span-2 text-right">
                           <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">₹{item.rate.toFixed(2)}</span>
                           <p className="text-[10px] text-gray-400">/ unit</p>
                        </div>

                        {/* Action */}
                        <div className="col-span-2 flex justify-center">
                           <button 
                             onClick={() => addToCart(item)}
                             disabled={item.stock === 0}
                             className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center shadow-md shadow-primary/20 hover:bg-secondary active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                           >
                             <Plus size={16} strokeWidth={3} />
                           </button>
                        </div>
                     </div>
                   ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                   <Search size={32} className="mb-2 opacity-20" />
                   <p>No medicines found.</p>
                </div>
            )}
         </div>
      </div>

      {/* RIGHT: Transaction Cart */}
      <div className="w-full xl:w-[400px] bg-white dark:bg-gray-800 rounded-2xl shadow-xl flex flex-col border border-gray-100 dark:border-gray-700 h-full">
         
         {/* Cart Header & Type */}
         <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50">
            <h2 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-base mb-3">
               <ShoppingCart size={18} className="text-primary" /> Stock Out Entry
            </h2>
            
            {/* Reason Selector */}
            <div className="relative">
                <select 
                   value={stockOutReason}
                   onChange={(e) => setStockOutReason(e.target.value)}
                   className="w-full pl-3 pr-8 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none appearance-none cursor-pointer text-gray-800 dark:text-white"
                >
                   <option value="Sale">Sale / Billing</option>
                   <option value="Internal Use">Internal Use / Hospital</option>
                   <option value="Damaged">Damaged / Broken</option>
                   <option value="Expired">Expired Disposal</option>
                   <option value="Adjustment">Stock Adjustment (Less)</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                   <ArrowRight size={14} className="rotate-90" />
                </div>
            </div>
         </div>

         {/* Sales Specific (Customer & Payment) */}
         {stockOutReason === 'Sale' && (
            <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-3">
               {/* Customer Name */}
               <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Customer Name" 
                    value={customer.name}
                    onChange={(e) => setCustomer({...customer, name: e.target.value})}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:border-primary outline-none text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
               </div>

               {/* Payment Mode Selector */}
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Payment Mode</label>
                  <div className="grid grid-cols-2 gap-1.5">
                     {['Cash', 'UPI', 'Card', 'Credit'].map((mode) => (
                        <button
                           key={mode}
                           onClick={() => setPaymentMode(mode)}
                           className={`py-1.5 text-[11px] font-bold rounded-lg border transition-all ${
                              paymentMode === mode 
                              ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                              : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                           }`}
                        >
                           {mode}
                        </button>
                     ))}
                  </div>
               </div>
            </div>
         )}

         {/* Cart Items */}
         <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {cart.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-xl m-2">
                  <ShoppingCart size={24} className="mb-2 opacity-20" />
                  <p>No items added</p>
                  <p className="text-xs text-gray-300 dark:text-gray-500">Select Issue Type & items</p>
               </div>
            ) : (
               cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-start p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 group hover:border-primary/20 transition-all">
                     <div className="flex-1">
                        <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate">{item.name}</h4>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-mono mt-0.5">{item.batch}</p>
                        <p className="text-xs text-primary font-bold mt-1">₹{(item.price * item.qty).toFixed(2)}</p>
                     </div>
                     
                     <div className="flex flex-col items-end gap-2">
                        <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                           <Trash2 size={14} />
                        </button>
                        <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm h-8 overflow-hidden">
                           <button onClick={() => updateQty(item.id, item.qty - 1)} className="w-7 h-full hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center border-r border-gray-200 dark:border-gray-600">-</button>
                           <span className="w-8 text-center text-xs font-bold text-gray-800 dark:text-gray-200">{item.qty}</span>
                           <button onClick={() => updateQty(item.id, item.qty + 1)} className="w-7 h-full hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center border-l border-gray-200 dark:border-gray-600">+</button>
                        </div>
                     </div>
                  </div>
               ))
            )}
         </div>

         {/* Footer Summary */}
         <div className="mt-auto bg-gray-50 dark:bg-gray-900/50 p-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-end mb-3">
               <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Total Amount</span>
               <span className="text-xl font-bold text-gray-800 dark:text-white leading-none">₹{calculateTotal().toFixed(2)}</span>
            </div>
            
            <button 
               onClick={handleCheckout}
               disabled={cart.length === 0}
               className="w-full py-3 bg-gray-900 dark:bg-primary text-white rounded-xl font-bold shadow-lg hover:bg-gray-800 dark:hover:bg-secondary active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
               <CheckCircle size={18} className="group-hover:scale-110 transition-transform" />
               <span>Process Stock Out</span>
            </button>
         </div>
      </div>
    
      </div>
    
    {/* Recent Transactions Section */}
    <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-10">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <FileText size={18} className="text-gray-500" /> Recent Stock Out History
            </h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 uppercase text-xs">
                    <tr>
                        <th className="px-6 py-4">Date & Time</th>
                        <th className="px-6 py-4">Type / Payment</th>
                         <th className="px-6 py-4">Items Details</th>
                        <th className="px-6 py-4 text-center">Qty</th>
                         <th className="px-6 py-4 text-right">Total Amount</th>
                        <th className="px-6 py-4 text-center">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                    {transactions
                        .filter(t => t.type === 'OUT')
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .slice(0, 10)
                        .map(tx => (
                        <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                <div className="font-bold text-gray-800 dark:text-white">{new Date(tx.date).toLocaleDateString()}</div>
                                <div className="text-xs">{new Date(tx.date).toLocaleTimeString()}</div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                    tx.reason === 'Sale' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                }`}>
                                    {tx.reason || 'Manual'}
                                </span>
                                {tx.paymentMode && (
                                    <div className="text-[10px] mt-1 font-bold text-gray-400 flex items-center gap-1">
                                        <div className="w-1 h-1 rounded-full bg-gray-400"></div> {tx.paymentMode}
                                    </div>
                                )}
                            </td>
                            <td className="px-6 py-4">
                                <div className="space-y-1">
                                    {tx.items.map((item, idx) => (
                                        <div key={idx} className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                            <span className="font-bold text-gray-800 dark:text-gray-200">{item.name}</span>
                                            <span className="text-gray-400">({item.batch})</span>
                                            <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-500 text-[10px]">x{item.qty}</span>
                                        </div>
                                    ))}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-gray-800 dark:text-gray-200">
                                {tx.totalQty}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                ₹{tx.items.reduce((sum, i) => sum + (i.qty * i.rate), 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-center">
                                <span className="px-2.5 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-xs font-bold border border-green-200 dark:border-green-900/30">
                                    Processed
                                </span>
                            </td>
                        </tr>
                    ))}
                    {transactions.filter(t => t.type === 'OUT').length === 0 && (
                        <tr>
                            <td colSpan="6" className="px-6 py-8 text-center text-gray-400">No stock out transactions found yet.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
    </div>
  );
};

export default InventoryStockOut;
