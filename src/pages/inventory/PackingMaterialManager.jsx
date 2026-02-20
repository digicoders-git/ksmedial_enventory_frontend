import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
    Package, 
    Plus, 
    Search, 
    Trash2, 
    Archive, 
    ArrowUpCircle, 
    ArrowDownCircle, 
    AlertTriangle,
    X,
    Filter
} from 'lucide-react';
import Swal from 'sweetalert2';

const PackingMaterialManager = () => {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [newMaterial, setNewMaterial] = useState({
        name: '',
        type: 'Box',
        dimensions: '',
        quantity: 0,
        unit: 'Pcs',
        minStockLevel: 50,
        supplier: ''
    });

    const [stockModal, setStockModal] = useState({ show: false, id: null, type: 'add', name: '', current: 0 });
    const [stockQty, setStockQty] = useState('');

    const fetchMaterials = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/packing-materials');
            if (data.success) {
                setMaterials(data.materials);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMaterials();
    }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!newMaterial.name || !newMaterial.type) {
            Swal.fire({
                title: 'Validation Error',
                text: 'Material name and type are required',
                icon: 'error',
                confirmButtonColor: '#007242'
            });
            return;
        }
        
        try {
            const { data } = await api.post('/packing-materials', newMaterial);
            if (data.success) {
                Swal.fire('Success', 'Material added successfully', 'success');
                setShowModal(false);
                setNewMaterial({ name: '', type: 'Box', dimensions: '', quantity: 0, unit: 'Pcs', minStockLevel: 50, supplier: '' });
                fetchMaterials();
            }
        } catch (error) {
            Swal.fire('Error', 'Failed to add material', 'error');
        }
    };

    const handleUpdateStock = async () => {
        if (!stockQty || isNaN(stockQty) || Number(stockQty) <= 0) {
            Swal.fire({
                title: 'Invalid Quantity',
                text: 'Please enter a valid quantity greater than 0',
                icon: 'error',
                confirmButtonColor: '#007242'
            });
            return;
        }
        try {
            const { data } = await api.put(`/packing-materials/${stockModal.id}/stock`, {
                quantity: stockQty,
                operation: stockModal.type === 'add' ? 'add' : 'subtract'
            });
            if (data.success) {
                Swal.fire('Success', 'Stock updated', 'success');
                setStockModal({ ...stockModal, show: false });
                setStockQty('');
                fetchMaterials();
            }
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Update failed', 'error');
        }
    };

    const handleDelete = async (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "This item will be permanently removed",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await api.delete(`/packing-materials/${id}`);
                    fetchMaterials();
                    Swal.fire('Deleted!', 'Material has been deleted.', 'success');
                } catch (error) {
                    Swal.fire('Error', 'Failed to delete', 'error');
                }
            }
        });
    };

    const filteredMaterials = materials.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        m.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
        <div className="animate-fade-in-up pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div className="w-full sm:w-auto">
                    <h1 className="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                        <Archive className="text-orange-500" /> Packing Materials
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">Manage Boxes, Bags, Labels & Consumables.</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="w-full sm:w-auto px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <Plus size={18} /> Add New Material
                </button>
            </div>

            {/* Quick Filter & Stats */}
            <div className="flex flex-col gap-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-1 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                         <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Low Stock Items</p>
                         <h3 className="text-2xl font-black text-red-500 mt-1">{materials.filter(m => m.quantity <= m.minStockLevel).length}</h3>
                    </div>
                     <div className="md:col-span-3 bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center">
                        <Search className="text-gray-400 ml-3 min-w-[20px]" size={20} />
                        <input 
                            type="text" 
                            placeholder="Search materials by name or type..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-3 bg-transparent outline-none text-gray-800 dark:text-white placeholder:text-gray-400 font-medium text-sm sm:text-base"
                        />
                    </div>
                </div>
            </div>

            {/* Materials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                    [...Array(6)].map((_, i) => (
                        <div key={i} className="h-40 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"></div>
                    ))
                ) : filteredMaterials.length > 0 ? (
                    filteredMaterials.map(item => (
                        <div key={item._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-all group relative overflow-hidden">
                             {item.quantity <= item.minStockLevel && (
                                 <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase">
                                     Low Stock
                                 </div>
                             )}
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl">
                                    <Package size={24} />
                                </div>
                                <div className="text-right">
                                    <h3 className="text-2xl font-black text-gray-800 dark:text-white">{item.quantity}</h3>
                                    <p className="text-xs font-bold text-gray-400 uppercase">{item.unit}</p>
                                </div>
                            </div>
                            
                            <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-1">{item.name}</h4>
                            <div className="flex gap-2 mb-4">
                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 text-[10px] font-black uppercase rounded">{item.type}</span>
                                {item.dimensions && <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 text-[10px] font-black uppercase rounded">{item.dimensions}</span>}
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <button 
                                    onClick={() => setStockModal({ show: true, id: item._id, type: 'subtract', name: item.name, current: item.quantity })}
                                    className="px-3 py-2 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-xl text-xs font-black uppercase hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-1"
                                >
                                    <ArrowDownCircle size={14} /> Consume
                                </button>
                                <button 
                                    onClick={() => setStockModal({ show: true, id: item._id, type: 'add', name: item.name, current: item.quantity })}
                                    className="px-3 py-2 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black uppercase hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors flex items-center justify-center gap-1"
                                >
                                    <ArrowUpCircle size={14} /> Add Stock
                                </button>
                            </div>

                            <button 
                                onClick={() => handleDelete(item._id)}
                                className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="col-span-3 text-center py-20">
                        <Package size={48} className="mx-auto text-gray-200 mb-4" />
                        <p className="text-gray-400 font-bold">No packing materials found</p>
                    </div>
                )}
            </div>
        </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-scale-up max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-750 sticky top-0 z-10">
                            <h3 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tight">Add Packing Material</h3>
                            <button onClick={() => setShowModal(false)}><X size={24} className="text-gray-400 hover:text-red-500" /></button>
                        </div>
                        <form onSubmit={handleAdd} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Material Name <span className="text-red-500">*</span></label>
                                <input required type="text" value={newMaterial.name} onChange={e => setNewMaterial({...newMaterial, name: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border-none outline-none font-bold text-gray-800 dark:text-white" placeholder="e.g. Small Corrugated Box" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                                    <select value={newMaterial.type} onChange={e => setNewMaterial({...newMaterial, type: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border-none outline-none font-bold text-gray-800 dark:text-white">
                                        <option>Box</option>
                                        <option>Poly Bag</option>
                                        <option>Tape</option>
                                        <option>Label</option>
                                        <option>Wrap</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Unit</label>
                                    <select value={newMaterial.unit} onChange={e => setNewMaterial({...newMaterial, unit: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border-none outline-none font-bold text-gray-800 dark:text-white">
                                        <option>Pcs</option>
                                        <option>Kg</option>
                                        <option>Roll</option>
                                        <option>Meter</option>
                                        <option>Bundle</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dimensions</label>
                                    <input type="text" value={newMaterial.dimensions} onChange={e => setNewMaterial({...newMaterial, dimensions: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border-none outline-none font-bold text-gray-800 dark:text-white" placeholder="e.g. 10x10x5" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Min Stock Alert</label>
                                    <input type="number" value={newMaterial.minStockLevel} onChange={e => setNewMaterial({...newMaterial, minStockLevel: Number(e.target.value)})} className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border-none outline-none font-bold text-gray-800 dark:text-white" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Supplier (Optional)</label>
                                <input type="text" value={newMaterial.supplier} onChange={e => setNewMaterial({...newMaterial, supplier: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border-none outline-none font-bold text-gray-800 dark:text-white" placeholder="Supplier Name" />
                            </div>
                            <button type="submit" className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl uppercase tracking-widest shadow-lg shadow-orange-500/30 transition-all active:scale-95">
                                Save Material
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Stock Update Modal */}
            {stockModal.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-scale-up">
                        <div className={`p-6 text-white text-center ${stockModal.type === 'add' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                            <h3 className="text-xl font-black uppercase tracking-tight">{stockModal.type === 'add' ? 'Add Stock' : 'Consume Stock'}</h3>
                            <p className="opacity-80 font-medium text-sm mt-1">{stockModal.name}</p>
                            <p className="font-black text-3xl mt-2">{stockModal.current}</p>
                            <p className="text-[10px] uppercase font-bold opacity-70">Current Balance</p>
                        </div>
                        <div className="p-6">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Quantity to {stockModal.type === 'add' ? 'Add' : 'Remove'}</label>
                            <input 
                                autoFocus
                                type="number" 
                                value={stockQty} 
                                onChange={e => setStockQty(e.target.value)} 
                                className="w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border-none outline-none font-black text-2xl text-center text-gray-800 dark:text-white"
                                placeholder="0" 
                            />
                            <div className="grid grid-cols-2 gap-3 mt-6">
                                <button onClick={() => setStockModal({...stockModal, show: false})} className="p-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                                <button onClick={handleUpdateStock} className={`p-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${stockModal.type === 'add' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30' : 'bg-red-500 hover:bg-red-600 shadow-red-500/30'}`}>
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default PackingMaterialManager;
