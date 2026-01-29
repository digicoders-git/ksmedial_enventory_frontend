import React, { useState, useEffect } from 'react';
import { Save, X, AlertCircle, UploadCloud, FileText, Activity, Layers, Tag, DollarSign, Package, Check, ScanLine, RefreshCw } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useInventory } from '../../context/InventoryContext';

const MedicineMaster = () => {
  const navigate = useNavigate();
  const { addMedicine, generateSKU, fetchInventory } = useInventory();
  const location = useLocation();
  const editData = location.state?.medicine;
  const mode = location.state?.mode;
  const isViewMode = mode === 'view';
  const isEditMode = !!editData && !isViewMode;

  const [imagePreview, setImagePreview] = useState(null);
  
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    genericName: '',
    packing: '',
    group: '',
    company: '',
    hsnCode: '',
    tax: '',
    unit: '',
    minLevel: '',
    description: '',
    isPrescriptionRequired: false,
    rackLocation: '',
    status: 'Active',
    purchasePrice: '',
    sellingPrice: ''
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        barcode: editData.sku || editData.barcode || '',
        name: editData.name || '',
        genericName: editData.generic || '',
        packing: editData.packing || '',
        group: editData.group || '',
        company: editData.company || '',
        hsnCode: editData.hsnCode || '',
        tax: editData.tax || '',
        unit: editData.unit || '',
        minLevel: editData.minLevel || '',
        description: editData.description || '',
        isPrescriptionRequired: editData.isPrescriptionRequired || false,
        rackLocation: editData.rackLocation || '',
        status: editData.status || 'Active',
        purchasePrice: editData.rate || '',
        sellingPrice: editData.mrp || ''
      });
      if (editData.image) {
          setImagePreview(editData.image);
      }
    } else {
      // Auto-generate SKU for new medicine
      setFormData(prev => ({
        ...prev,
        barcode: generateSKU ? generateSKU() : 'SKU-' + Math.floor(10000 + Math.random() * 90000)
      }));
    }
  }, [editData, generateSKU]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
       Swal.fire('Required', 'Medicine Name is required', 'warning');
       return;
    }

    try {
      const token = localStorage.getItem('ks_shop_token');
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      
      const payload = {
        name: formData.name,
        genericName: formData.genericName,
        category: formData.group,
        company: formData.company,
        sku: formData.barcode,
        unit: formData.unit,
        packing: formData.packing,
        hsnCode: formData.hsnCode,
        tax: formData.tax,
        rackLocation: formData.rackLocation,
        purchasePrice: Number(formData.purchasePrice) || 0,
        sellingPrice: Number(formData.sellingPrice) || 0,
        reorderLevel: Number(formData.minLevel) || 20,
        status: formData.status,
        isPrescriptionRequired: formData.isPrescriptionRequired,
        batchNumber: editData?.batch || 'N/A', // Using existing or default if new
        expiryDate: editData?.expiry || 'N/A',     // Using existing or default if new
        image: imagePreview // Send Base64 image
      };

      const url = isEditMode ? `${apiBase}/products/${editData.id}` : `${apiBase}/products`;
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        await fetchInventory(); // Refresh context data
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: `${formData.name} has been ${isEditMode ? 'updated' : 'added'} successfully.`,
          confirmButtonColor: 'var(--color-primary)'
        }).then(() => {
          navigate('/medicines/list');
        });
      } else {
        Swal.fire('Error', data.message || 'Something went wrong', 'error');
      }
    } catch (error) {
      console.error("Medicine save error:", error);
      Swal.fire('Error', 'Failed to connect to server', 'error');
    }
  };

  return (
    <div className="animate-fade-in-up max-w-[1600px] mx-auto pb-10">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-primary/10 dark:bg-primary/20 rounded-lg text-primary dark:text-primary-400">
                <Package size={24} />
             </div>
             <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                  {isViewMode ? 'View Medicine Details' : (isEditMode ? 'Edit Medicine' : 'Add New Medicine')}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
                  {isViewMode ? 'View medicine details' : (isEditMode ? 'Update existing medicine record' : 'Create a master record for a new inventory item')}.
                </p>
             </div>
          </div>
        </div>
        <div className="flex gap-3">
            <button 
              onClick={() => navigate('/medicines/list')}
              className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold hover:bg-white dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all text-sm"
            >
              {isViewMode ? 'Back' : 'Cancel'}
            </button>
            {!isViewMode && (
            <button 
               onClick={handleSubmit} 
               className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-secondary shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all flex items-center gap-2"
            >
              <Save size={18} />
              <span>{isEditMode ? 'Update Record' : 'Save Record'}</span>
            </button>
            )}
        </div>
      </div>

      <fieldset disabled={isViewMode} className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-none p-0 m-0 min-w-0 contents">
        
        {/* LEFT COLUMN: Main Form (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
           
           {/* Section 1: Basic Details */}
           <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                 <FileText className="text-blue-500" size={20} /> Essential Information
              </h3>
              
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 
                 {/* Barcode - Advanced */}
                 <div className="space-y-1.5">
                     <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1">
                        <ScanLine size={14} className="text-primary" /> Barcode / SKU
                     </label>
                     <div className="relative group flex gap-2">
                        <div className="relative flex-1">
                           <input 
                              type="text" 
                              name="barcode"
                              autoFocus
                              value={formData.barcode}
                              onChange={handleChange}
                              placeholder="Scan or type..."
                              className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-mono font-semibold text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                           />
                           <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-primary">
                               <ScanLine size={18} />
                           </div>
                        </div>
                        {!isViewMode && (
                           <button 
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, barcode: generateSKU() }))}
                              className="px-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-500 hover:text-primary hover:bg-white dark:hover:bg-gray-600 transition-all shadow-sm"
                              title="Generate New SKU"
                           >
                              <RefreshCw size={18} />
                           </button>
                        )}
                     </div>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Medicine Name <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Dolo 650mg Tablet"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-base font-semibold text-gray-800 dark:text-white placeholder:font-normal placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Generic Name</label>
                    <input 
                      type="text" 
                      name="genericName"
                      value={formData.genericName}
                      onChange={handleChange}
                      placeholder="e.g. Paracetamol"
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Manufacturer</label>
                    <input 
                      type="text" 
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      placeholder="e.g. Micro Labs Ltd"
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Medicine Type</label>
                    <select 
                      name="group"
                      value={formData.group}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-gray-700 dark:text-gray-200 cursor-pointer"
                    >
                      <option value="">Select Type</option>
                      <option value="Tablet">Tablet</option>
                      <option value="Capsule">Capsule</option>
                      <option value="Syrup">Syrup</option>
                      <option value="Injection">Injection</option>
                      <option value="Cream">Cream / Gel</option>
                      <option value="Drops">Drops</option>
                      <option value="Powder">Powder</option>
                      <option value="Surgical">Surgical / Other</option>
                    </select>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Base Unit</label>
                    <select 
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-gray-700 dark:text-gray-200 cursor-pointer"
                    >
                      <option value="">Select Unit</option>
                      <option value="Strip">Strip</option>
                      <option value="Bottle">Bottle</option>
                      <option value="Tube">Tube</option>
                      <option value="Vial">Vial</option>
                      <option value="Box">Box</option>
                      <option value="Pc">Piece</option>
                    </select>
                 </div>

                 {/* Packing - Advanced */}
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Packing (e.g. 1x15)</label>
                    <input 
                      type="text" 
                      name="packing"
                      value={formData.packing}
                      onChange={handleChange}
                      placeholder="e.g. 10 Tabs"
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                 </div>

                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Status</label>
                     <select 
                       name="status"
                       value={formData.status || 'Active'}
                       onChange={handleChange}
                       className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-gray-700 dark:text-gray-200 cursor-pointer"
                     >
                       <option value="Active">Active</option>
                       <option value="Inactive">Inactive</option>
                     </select>
                  </div>
               </div>
            </div>

            {/* Section 2: Taxation & Location */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
               <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                  <Tag className="text-orange-500" size={20} /> Taxation & Location
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">HSN Code</label>
                     <input 
                       type="text" 
                       name="hsnCode"
                       value={formData.hsnCode}
                       onChange={handleChange}
                       placeholder="e.g. 3004"
                       className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                     />
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">GST Tax (%)</label>
                     <select 
                       name="tax"
                       value={formData.tax}
                       onChange={handleChange}
                       className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-gray-700 dark:text-gray-200 cursor-pointer"
                     >
                       <option value="0">0% (Nil)</option>
                       <option value="5">5%</option>
                       <option value="12">12%</option>
                       <option value="18">18%</option>
                       <option value="28">28%</option>
                     </select>
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Rack / Shelf Location</label>
                     <input 
                       type="text" 
                       name="rackLocation"
                       value={formData.rackLocation}
                       onChange={handleChange}
                       placeholder="e.g. A-12"
                       className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-mono text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                     />
                  </div>
               </div>
            </div>

            {/* Section 3: Standard Pricing (Reference) */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
               <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                  <DollarSign className="text-green-500" size={20} /> Standard Pricing (Reference)
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Purchase Price (Rate)</label>
                     <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                        <input 
                           type="number" 
                           name="purchasePrice"
                           value={formData.purchasePrice}
                           onChange={handleChange}
                           placeholder="0.00"
                           className="w-full pl-8 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-100 focus:border-green-500 outline-none text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        />
                     </div>
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Selling Price (MRP)</label>
                     <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                        <input 
                           type="number" 
                           name="sellingPrice"
                           value={formData.sellingPrice}
                           onChange={handleChange}
                           placeholder="0.00"
                           className="w-full pl-8 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-100 focus:border-green-500 outline-none text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        />
                     </div>
                  </div>
               </div>
            </div>
        </div>

        {/* RIGHT COLUMN: Extra Details (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
           
           {/* Image Upload */}
           <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
               <div className="mb-4 relative w-32 h-32 rounded-full border-4 border-gray-50 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-700 group cursor-pointer shadow-inner">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 dark:text-gray-500">
                       <UploadCloud size={32} />
                    </div>
                  )}
                  <input type="file" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
               </div>
               <p className="text-xs text-gray-400 font-medium">Click to upload medicine image</p>
           </div>
           
           {/* Alerts Config */}
           <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
               <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
                 <Activity className="text-red-500" size={16} /> Alerts & Safety
               </h3>

               <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Low Stock Alert Level</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        name="minLevel"
                        value={formData.minLevel}
                        onChange={handleChange}
                        placeholder="20"
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Qty</span>
                    </div>
                 </div>

                 <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                     <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.isPrescriptionRequired ? 'bg-red-500 border-red-500' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500'}`}>
                        {formData.isPrescriptionRequired && <Check size={14} className="text-white" />}
                     </div>
                     <input 
                       type="checkbox" 
                       name="isPrescriptionRequired" 
                       checked={formData.isPrescriptionRequired}
                       onChange={handleChange}
                       className="hidden"
                     />
                     <div>
                        <span className="block text-sm font-bold text-gray-700 dark:text-gray-200">Schedule H</span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Prescription Required</span>
                     </div>
                 </label>
               </div>
           </div>

           {/* Note */}
           <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-100 dark:border-yellow-900/30 flex gap-3">
              <AlertCircle size={20} className="text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
              <div>
                 <h4 className="text-sm font-bold text-yellow-800 dark:text-yellow-200">Note</h4>
                 <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1 leading-relaxed">
                    This only creates the medicine definition. Price & Stocks are added via Purchase Entry.
                 </p>
              </div>
           </div>

        </div>
      </fieldset>
    </div>
  );
};

export default MedicineMaster;
