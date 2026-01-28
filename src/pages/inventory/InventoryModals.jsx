import React, { useState, useEffect, useRef } from 'react';
import { X, Search, CheckCircle, AlertTriangle, Package, ArrowUpCircle, ArrowDownCircle, Info, Calendar, Filter, FileText } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import Swal from 'sweetalert2';

export const AdjustStockModal = ({ isOpen, onClose }) => {
  const { inventory, adjustStock } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustmentType, setAdjustmentType] = useState('deduct'); // 'add' or 'deduct'
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('Damage');
  const [note, setNote] = useState('');
  const dropdownRef = useRef(null);

  // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setSelectedItem(null);
            setQuantity('');
            setNote('');
            setAdjustmentType('deduct');
        }
    }, [isOpen]);

  const filteredItems = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.batch.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdjust = (e) => {
    e.preventDefault();
    if (!selectedItem || !quantity) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Please select an item and enter quantity' });
        return;
    }

    const qtyNum = parseInt(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
        Swal.fire({ icon: 'error', title: 'Invalid Quantity', text: 'Please enter a valid quantity' });
        return;
    }

    const type = adjustmentType === 'add' ? 'add' : 'subtract';
    const finalReason = note ? `${reason} - ${note}` : reason;
    const result = adjustStock(selectedItem.id, type, qtyNum, finalReason);

    if (result.success) {
        Swal.fire({
            icon: 'success',
            title: 'Stock Updated',
            text: `${selectedItem.name} stock ${type === 'add' ? 'increased' : 'decreased'} by ${qtyNum}`,
            timer: 2000,
            showConfirmButton: false,
            confirmButtonColor: '#007242'
        });
        onClose();
    } else {
        Swal.fire({ icon: 'error', title: 'Failed', text: result.message });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl transform transition-all animate-scale-up border border-white/40 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
           <div>
             <h3 className="font-bold text-gray-900 text-xl tracking-tight">Adjust Stock</h3>
             <p className="text-gray-500 text-xs font-medium mt-0.5">Manually update inventory levels</p>
           </div>
           <button 
             onClick={onClose} 
             className="text-gray-400 hover:text-gray-700 transition-colors bg-gray-50 hover:bg-gray-100 p-2 rounded-full border border-transparent hover:border-gray-200"
           >
               <X size={20} />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/50 p-6 space-y-6">
           
           {/* Item Search */}
           <div className="relative" ref={dropdownRef}>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Product</label>
              <div className="relative group shadow-sm rounded-xl">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                 <input 
                   type="text" 
                   value={selectedItem ? selectedItem.name : searchTerm}
                   onChange={(e) => {
                       setSearchTerm(e.target.value);
                       setSelectedItem(null);
                   }}
                   placeholder="Search product name or batch..."
                   className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-semibold text-gray-800 text-sm placeholder:font-normal"
                   autoFocus
                 />
                 {selectedItem && (
                    <button 
                        onClick={() => { setSelectedItem(null); setSearchTerm(''); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors p-1"
                    >
                        <X size={16} />
                    </button>
                 )}
              </div>

              {/* Dropdown Results */}
              {searchTerm && !selectedItem && filteredItems.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar ring-1 ring-black/5 p-1">
                      {filteredItems.map(item => (
                          <div 
                            key={item.id} 
                            onClick={() => { setSelectedItem(item); setSearchTerm(''); }}
                            className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer flex justify-between items-center group transition-all"
                          >
                             <div>
                                <p className="font-bold text-gray-800 text-sm group-hover:text-primary">{item.name}</p>
                                <div className="flex gap-2 text-[11px] text-gray-500 mt-0.5 font-medium">
                                   <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 border border-gray-200">Batch: {item.batch}</span>
                                </div>
                             </div>
                             <div className="text-right">
                                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${item.stock < 20 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                   {item.stock} Units
                                </span>
                             </div>
                          </div>
                      ))}
                  </div>
              )}
           </div>
           
           {/* Selected Item Info Card */}
           {selectedItem && (
               <div className="p-4 bg-white border border-gray-200 rounded-xl flex items-center justify-between shadow-sm animate-fade-in relative overflow-hidden">
                   <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                   <div className="pl-2">
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Current Stock</p>
                       <p className="text-2xl font-bold text-gray-800 leading-none tracking-tight">{selectedItem.stock} <span className="text-sm font-medium text-gray-400">Units</span></p>
                   </div>
                   <div className="text-right space-y-1">
                       <div className="inline-flex items-center px-2 py-1 bg-gray-50 rounded-lg border border-gray-100">
                           <p className="text-xs text-gray-500 font-medium">Batch: <span className="font-bold text-gray-800">{selectedItem.batch}</span></p>
                       </div>
                   </div>
               </div>
           )}

           <div className="grid grid-cols-2 gap-5">
              {/* Action Type */}
              <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Action</label>
                 <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                    <button 
                        type="button"
                        onClick={() => setAdjustmentType('add')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-all ${adjustmentType === 'add' ? 'bg-green-50 text-green-700 shadow-sm ring-1 ring-green-200' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                    >
                        <ArrowUpCircle size={16} /> Add
                    </button>
                    <button 
                        type="button"
                        onClick={() => setAdjustmentType('deduct')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-all ${adjustmentType === 'deduct' ? 'bg-red-50 text-red-700 shadow-sm ring-1 ring-red-200' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                    >
                        <ArrowDownCircle size={16} /> Deduct
                    </button>
                 </div>
              </div>

              {/* Quantity */}
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Quantity</label>
                  <input 
                    type="number" 
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-bold text-lg text-center transition-all shadow-sm"
                  />
              </div>
           </div>

           {/* Reason & Note */}
           <div className="space-y-5">
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Reason</label>
                  <div className="relative shadow-sm rounded-xl">
                      <select 
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          className="w-full pl-4 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none appearance-none font-semibold text-gray-700 text-sm transition-all"
                      >
                           {adjustmentType === 'deduct' ? (
                               <>
                                 <option value="Damage">Damage / Expired</option>
                                 <option value="Theft">Original Lost / Theft</option>
                                 <option value="Correction">Inventory Correction</option>
                                 <option value="Consumer">Internal Consumption</option>
                               </>
                           ) : (
                               <>
                                 <option value="Purchase">New Purchase</option>
                                 <option value="Return">Customer Return</option>
                                 <option value="Found">Stock Found</option>
                                 <option value="Correction">Inventory Correction</option>
                               </>
                           )}
                      </select>
                      <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  </div>
               </div>

               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Remarks <span className="text-gray-300 font-normal normal-case">(Optional)</span></label>
                  <textarea 
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Add specific details..."
                      rows="2"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none resize-none text-sm transition-all shadow-sm placeholder:text-gray-400"
                  />
               </div>
           </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-white shrink-0">
             <button 
                  onClick={onClose} 
                  className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 hover:border-gray-300 transition-all text-sm"
              >
                Cancel
              </button>
              <button 
                  onClick={handleAdjust}
                  disabled={!selectedItem || !quantity}
                  className="px-8 py-3 rounded-xl bg-primary text-white font-bold hover:bg-secondary shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                Confirm Update
              </button>
        </div>

      </div>
    </div>
  );
};

export const StockCheckModal = ({ isOpen, onClose }) => {
    const { inventory } = useInventory();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        if(isOpen) {
            setSearchTerm('');
            setSelectedItem(null);
        }
    }, [isOpen]);

    const filteredItems = inventory.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl transform transition-all animate-scale-up border border-white/20 flex flex-col h-[600px] max-h-[90vh]">
            
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0 rounded-t-2xl">
                <div>
                   <h3 className="font-bold text-gray-800 text-lg">Stock Check</h3>
                   <p className="text-gray-500 text-xs">Instant inventory lookup</p>
                </div>
                <button 
                  onClick={onClose} 
                  className="text-gray-400 hover:text-gray-600 transition-colors bg-white p-2 rounded-full shadow-sm hover:shadow-md border border-gray-100"
                >
                  <X size={18} />
                </button>
            </div>

            <div className="p-6 flex flex-col h-full overflow-hidden">
                <div className="relative mb-6 shrink-0 group">
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setSelectedItem(null);
                        }}
                        placeholder="Search product name..."
                        className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-sm text-gray-800"
                        autoFocus
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                    {searchTerm && (
                        <button onClick={() => { setSearchTerm(''); setSelectedItem(null); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"><X size={16} /></button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 relative">
                    {selectedItem ? (
                        <div className="animate-fade-in space-y-5 h-full flex flex-col">
                           <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 text-center relative overflow-hidden flex-1 flex flex-col justify-center items-center">
                               <div className="relative z-10 w-full">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedItem.name}</h3>
                                    <span className="inline-block px-3 py-1 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-600 mb-6 shadow-sm">
                                        {selectedItem.category}
                                    </span>
                                    
                                    <div className="grid grid-cols-2 gap-3 text-left w-full">
                                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Stock Level</p>
                                            <p className={`text-xl font-bold ${selectedItem.stock < 20 ? 'text-red-600' : 'text-green-600'}`}>
                                                {selectedItem.stock} <span className="text-sm font-medium text-gray-500">Units</span>
                                            </p>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Selling Rate</p>
                                            <p className="text-xl font-bold text-gray-800">₹{selectedItem.rate}</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Batch</p>
                                            <p className="font-bold text-gray-700 text-sm">{selectedItem.batch}</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Expiry</p>
                                            <p className="font-bold text-gray-700 text-sm flex items-center gap-1">
                                                <Calendar size={12} className="text-gray-400" /> {selectedItem.exp}
                                            </p>
                                        </div>
                                    </div>
                               </div>
                           </div>

                           <div className="grid grid-cols-2 gap-3 shrink-0">
                               <button onClick={() => setSelectedItem(null)} className="py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm">
                                   <Search size={16} /> Search Again
                               </button>
                               <button className="py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-secondary shadow-lg shadow-primary/20 transition-colors flex items-center justify-center gap-2 text-sm">
                                   <FileText size={16} /> View History
                               </button>
                           </div>
                        </div>
                    ) : (
                        <div className="h-full">
                            {searchTerm ? (
                                <div className="space-y-2">
                                    {filteredItems.length > 0 ? (
                                        filteredItems.map(item => (
                                            <div 
                                                key={item.id} 
                                                onClick={() => setSelectedItem(item)}
                                                className="p-3.5 rounded-xl border border-gray-100 hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all group flex items-center justify-between"
                                            >
                                                <div>
                                                    <p className="font-bold text-gray-800 text-sm group-hover:text-primary">{item.name}</p>
                                                    <div className="flex gap-3 text-[10px] text-gray-500 mt-1">
                                                        <span>Batch: {item.batch}</span>
                                                        <span>Rate: ₹{item.rate}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-base font-bold ${item.stock < 20 ? 'text-red-600' : 'text-green-600'}`}>{item.stock}</p>
                                                    <p className="text-[8px] text-gray-400 uppercase font-bold">Stock</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-12 text-center text-gray-400 flex flex-col items-center">
                                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                                <AlertTriangle className="opacity-30" size={24} />
                                            </div>
                                            <p className="font-medium text-sm">No products found</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 pb-10">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                        <Search className="opacity-20 text-gray-500" size={32} />
                                    </div>
                                    <p className="font-bold text-gray-500 text-sm">Inventory Search</p>
                                    <p className="text-xs mt-1 max-w-[200px] text-center opacity-70">Enter name to search...</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Footer for Stock Check (Only visible if item selected?) No, let's keep search context clean */} 
        </div>
        </div>
    );
};
