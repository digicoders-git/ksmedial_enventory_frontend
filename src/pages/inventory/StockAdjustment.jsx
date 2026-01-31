import React, { useState, useMemo } from 'react';
import { ClipboardList, Save, X, Search, ArrowUpCircle, ArrowDownCircle, ScanLine, Calendar, FileText } from 'lucide-react';
import Swal from 'sweetalert2';
import { useInventory } from '../../context/InventoryContext';

const StockAdjustment = () => {
  const { inventory, adjustStock, transactions } = useInventory();
  const [formData, setFormData] = useState({
    product: '',
    adjustmentType: 'deduct', // 'add' or 'deduct'
    quantity: '',
    reason: 'Damage',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase().trim();
    return inventory.filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.batch?.toLowerCase().includes(term) ||
      p.sku?.toLowerCase().includes(term)
    );
  }, [inventory, searchTerm]);

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setFormData({ ...formData, product: product.name });
    setSearchTerm(product.name);
    setShowProductDropdown(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedProduct || !formData.quantity) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Please select a product and enter quantity',
        confirmButtonColor: 'var(--color-primary)'
      });
      return;
    }

    const qty = parseInt(formData.quantity);
    if (isNaN(qty) || qty <= 0) {
       Swal.fire({
        icon: 'error',
        title: 'Invalid Quantity',
        text: 'Please enter a valid positive number',
        confirmButtonColor: 'var(--color-primary)'
      });
      return;
    }

    Swal.fire({
      title: 'Confirm Adjustment',
      text: `Are you sure you want to ${formData.adjustmentType === 'add' ? 'increase' : 'decrease'} stock for ${selectedProduct.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Adjust',
      confirmButtonColor: formData.adjustmentType === 'add' ? '#10B981' : '#EF4444'
    }).then(async (result) => {
      if (result.isConfirmed) {
        const adjustmentResult = await adjustStock(
            selectedProduct.id, 
            formData.adjustmentType, 
            qty, 
            formData.reason,
            formData.note
        );

        if (adjustmentResult.success) {
            Swal.fire({
                icon: 'success',
                title: 'Stock Updated!',
                text: adjustmentResult.message,
                timer: 2000,
                showConfirmButton: false
            });
            // Reset form
            setFormData({
                product: '',
                adjustmentType: 'deduct',
                quantity: '',
                reason: 'Damage',
                date: new Date().toISOString().split('T')[0],
                note: ''
            });
            setSelectedProduct(null);
            setSearchTerm('');
        } else {
            Swal.fire('Error', adjustmentResult.message, 'error');
        }
      }
    });
  };

  return (
    <div className="animate-fade-in-up max-w-[1000px] mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 mb-8">
        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl shadow-sm border border-indigo-100 dark:border-indigo-900/30">
           <ClipboardList size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Stock Adjustment</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Correct physical stock discrepancies (Damage, Theft, etc.)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
             
             {/* Adjustment Type Selection */}
             <div className="flex gap-4 mb-6">
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, adjustmentType: 'deduct'})}
                  className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    formData.adjustmentType === 'deduct' 
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400' 
                    : 'border-gray-100 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                   <ArrowDownCircle size={24} className={formData.adjustmentType === 'deduct' ? 'text-red-500' : 'text-gray-400'} />
                   <span className="font-bold">Stock Out / Deduct</span>
                   <span className="text-xs opacity-75">Damage, Theft, Loss</span>
                </button>

                <button 
                  type="button"
                  onClick={() => setFormData({...formData, adjustmentType: 'add'})}
                  className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    formData.adjustmentType === 'add' 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                    : 'border-gray-100 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                   <ArrowUpCircle size={24} className={formData.adjustmentType === 'add' ? 'text-green-500' : 'text-gray-400'} />
                   <span className="font-bold">Stock In / Add</span>
                   <span className="text-xs opacity-75">Found, Surplus</span>
                </button>
             </div>

             <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Product Search */}
                <div className="relative">
                   <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Select Product</label>
                   <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setShowProductDropdown(true);
                          if(selectedProduct && e.target.value !== selectedProduct.name) {
                            setSelectedProduct(null); // Clear selection if user types
                          }
                        }}
                        onFocus={() => setShowProductDropdown(true)}
                        placeholder="Search by Name, Batch, or SKU (QR Code)..."
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      />
                   </div>
                   
                   {/* Dropdown Results */}
                   {showProductDropdown && searchTerm && !selectedProduct && (
                     <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                        {filteredProducts.length > 0 ? (
                           filteredProducts.map(product => (
                             <div 
                               key={product.id} 
                               onClick={() => handleProductSelect(product)}
                               className="p-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer border-b border-gray-50 dark:border-gray-700 last:border-0"
                             >
                                <p className="font-bold text-gray-800 dark:text-white">{product.name}</p>
                                 <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase font-bold tracking-wider">
                                    <span>Batch: {product.batch}</span>
                                    {product.sku && <span className="text-blue-500">SKU: {product.sku}</span>}
                                    <span>Stock: {product.stock}</span>
                                 </div>
                             </div>
                           ))
                        ) : (
                          <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">No products found</div>
                        )}
                     </div>
                   )}
                </div>

                {/* Selected Product Info */}
                {selectedProduct && (
                   <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-bold text-blue-900 dark:text-blue-300">{selectedProduct.name}</p>
                        <p className="text-xs text-blue-700 dark:text-blue-400">Batch: {selectedProduct.batch} | Current: {selectedProduct.stock}</p>
                      </div>
                      <button type="button" onClick={() => {setSelectedProduct(null); setSearchTerm('');}} className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-300">
                        <X size={16} />
                      </button>
                   </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Reason</label>
                      <select 
                        value={formData.reason}
                        onChange={(e) => setFormData({...formData, reason: e.target.value})}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-gray-800 dark:text-white"
                      >
                         {formData.adjustmentType === 'deduct' ? (
                           <>
                             <option value="Damage">Damaged / Broken</option>
                             <option value="Expired">Expired</option>
                             <option value="Theft">Theft / Lost</option>
                             <option value="Correction">Counting Correction</option>
                           </>
                         ) : (
                           <>
                             <option value="Found">Stock Found</option>
                             <option value="Return">Customer Return</option>
                             <option value="Correction">Counting Correction</option>
                           </>
                         )}
                         <option value="Other">Other</option>
                      </select>
                   </div>

                   <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Date</label>
                      <div className="relative">
                        <input 
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({...formData, date: e.target.value})}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-gray-800 dark:text-white"
                        />
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                      </div>
                   </div>
                </div>

                <div className="space-y-1.5">
                   <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Quantity to {formData.adjustmentType === 'add' ? 'Add' : 'Deduct'}</label>
                   <input 
                      type="number"
                      placeholder="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-lg font-bold text-gray-800 dark:text-white"
                   />
                </div>

                <div className="space-y-1.5">
                   <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Note / Remarks</label>
                   <textarea
                      rows="2"
                      placeholder="Optional details..."
                      value={formData.note}
                      onChange={(e) => setFormData({...formData, note: e.target.value})}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none resize-none text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                   ></textarea>
                </div>

                <div className="pt-4">
                   <button 
                     type="submit"
                     className={`w-full py-3.5 rounded-xl text-white font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                       formData.adjustmentType === 'add' 
                       ? 'bg-green-600 hover:bg-green-700 shadow-green-200 dark:shadow-none' 
                       : 'bg-red-600 hover:bg-red-700 shadow-red-200 dark:shadow-none'
                     }`}
                   >
                     <Save size={20} />
                     Confirm Stock {formData.adjustmentType === 'add' ? 'Addition' : 'Deduction'}
                   </button>
                </div>

             </form>
          </div>
        </div>

        {/* Info / Sidebar */}
        <div className="space-y-6">
           <div className="bg-blue-600 dark:bg-blue-700 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
             <div className="relative z-10">
               <h3 className="text-lg font-bold mb-2">Did you know?</h3>
               <p className="text-blue-100 text-sm leading-relaxed">
                 Regular stock adjustments help maintain inventory accuracy. Always categorize reasons correctly for better reporting.
               </p>
             </div>
             <ScanLine className="absolute -bottom-4 -right-4 text-blue-500 opacity-30" size={100} />
           </div>

           <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-gray-800 dark:text-white mb-4">Recent Adjustments</h3>
               <div className="space-y-4">
                  {transactions
                    .filter(tx => (tx.type === 'IN' || tx.type === 'OUT') && tx.reason !== 'Sale')
                    .slice(0, 5)
                    .map((tx, idx) => (
                    <div key={tx.id || idx} className="flex items-start gap-3 pb-3 border-b border-gray-50 dark:border-gray-700 last:border-0 last:pb-0">
                       <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${tx.type === 'IN' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                       <div className="flex-1">
                         <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                            {tx.items?.[0]?.name || 'Unknown Item'}
                         </p>
                         <p className="text-xs text-gray-500 dark:text-gray-400">
                            {tx.type === 'IN' ? '+' : '-'}{tx.totalQty} Units • {tx.items?.[0]?.reason || 'Manual'}
                         </p>
                         <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                            {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </p>
                       </div>
                    </div>
                  ))}
                  {transactions.length === 0 && (
                    <div className="text-center py-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                        <FileText size={20} className="mx-auto text-gray-300 mb-1" />
                        <p className="text-xs text-gray-400">No recent adjustments</p>
                    </div>
                  )}
               </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default StockAdjustment;
