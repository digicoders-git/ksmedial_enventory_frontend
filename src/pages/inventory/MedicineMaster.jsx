import React, { useState, useEffect } from 'react';
import { Save, X, AlertCircle, UploadCloud, FileText, Activity, Layers, Tag, DollarSign, Package, Check, ScanLine, RefreshCw, Plus, Download } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useInventory } from '../../context/InventoryContext';
import api from '../../api/axios';
import Papa from 'papaparse';

const MedicineMaster = () => {
  const navigate = useNavigate();
  const { generateSKU, fetchInventory } = useInventory();
  const location = useLocation();
  const editData = location.state?.medicine;
  const mode = location.state?.mode;
  const isViewMode = mode === 'view';
  const isEditMode = !!editData && !isViewMode;

  const [imagePreview, setImagePreview] = useState(null);
  const [bulkData, setBulkData] = useState([]);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    genericName: '',
    packing: '',
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
    sellingPrice: '',
    group: '',
    category: '',
    batchNumber: '',
    manufacturingDate: '',
    expiryDate: ''
  });

  const [groups, setGroups] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [units, setUnits] = useState([]);

  const fetchOptions = async () => {
    try {
      const [groupsRes, categoriesRes, locationsRes, unitsRes] = await Promise.all([
        api.get('/groups'),
        api.get('/categories'),
        api.get('/locations?pageSize=1000&status=Active'),
        api.get('/units')
      ]);
      if (groupsRes.data.success) setGroups(groupsRes.data.groups);
      if (categoriesRes.data.success) setCategories(categoriesRes.data.categories);
      if (locationsRes.data.success) setLocations(locationsRes.data.locations);
      if (unitsRes.data.success) setUnits(unitsRes.data.units);
    } catch (error) {
      console.error("Failed to fetch options", error);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    if (editData) {
      setFormData({
        barcode: editData.sku || editData.barcode || '',
        name: editData.name || '',
        genericName: editData.generic || '',
        packing: editData.packing || '',
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
        sellingPrice: editData.mrp || '',
        group: editData.group || '',
        category: editData.category || '',
        batchNumber: editData.batch || '',
        manufacturingDate: editData.manufacturingDate || '',
        expiryDate: editData.expiry || ''
      });
      if (editData.image) {
          setImagePreview(editData.image);
      }
    } else {
      // Auto-generate SKU for new medicine
      setFormData(prev => ({
        ...prev,
        barcode: generateSKU ? generateSKU() : 'SKU-' + Math.floor(10000 + Math.random() * 90000),
        batchNumber: ''
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

  const downloadSampleCSV = () => {
    const headers = [
      'Name',
      'SKU',
      'Generic Name',
      'Category',
      'Manufacturer',
      'HSN',
      'Tax %',
      'Unit',
      'Rack Location',
      'Purchase Price',
      'Selling Price',
      'Min Level',
      'Prescription Required (Yes/No)'
    ];

    const sampleData = [
      'Dolo 650,SKU-DOLO650,Paracetamol,Tablet,Micro Labs,3004,12,Strip,R-01,20.50,30.00,50,No',
      'Augmentin 625,SKU-AUG625,Amoxicillin + Clavulanic Acid,Antibiotic,GSK,3004,12,Strip,R-02,150.00,200.00,20,Yes'
    ];

    const csvContent = [headers.join(','), ...sampleData].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'medicine_import_sample.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: (results) => {
            const parsedData = results.data.map((row, index) => {
                // Normalize keys to lowercase for flexible matching
                const normalizedRow = {};
                Object.keys(row).forEach(key => {
                    normalizedRow[key.toLowerCase().replace(/[^a-z0-9]/g, '')] = row[key];
                });

                // Flexible mapping
                const name = normalizedRow.name || normalizedRow.medicinename || normalizedRow.productname || normalizedRow.product || '';
                
                let sku = normalizedRow.barcode || normalizedRow.sku || normalizedRow.code || normalizedRow.itemcode;
                if (!sku) {
                    // Auto-generate robust unique SKU if missing in CSV
                    const timestamp = Date.now().toString().slice(-6); // Last 6 digits for compactness
                    const random = Math.floor(1000 + Math.random() * 9000); // 4 random digits
                    sku = `SKU-${timestamp}${random}-${index + 1}`;
                }
                const generic = normalizedRow.genericname || normalizedRow.generic || normalizedRow.composition || '';
                const packing = normalizedRow.packing || normalizedRow.size || '';
                const category = normalizedRow.type || normalizedRow.category || normalizedRow.group || 'Tablet';
                const company = normalizedRow.manufacturer || normalizedRow.company || normalizedRow.brand || '';
                const hsn = normalizedRow.hsn || normalizedRow.hsncode || '';
                const tax = normalizedRow.tax || normalizedRow.gst || normalizedRow.taxpercent || '18';
                const unit = normalizedRow.unit || normalizedRow.baseunit || 'Strip';
                const rack = normalizedRow.rack || normalizedRow.shelf || normalizedRow.location || '';
                const buy = normalizedRow.purchaseprice || normalizedRow.rate || normalizedRow.buyprice || 0;
                const sell = normalizedRow.sellingprice || normalizedRow.mrp || normalizedRow.sellprice || 0;
                const min = normalizedRow.minlevel || normalizedRow.stocklevel || normalizedRow.reorderlevel || 20;
                const img = normalizedRow.imageurl || normalizedRow.image || '';
                const rx = (normalizedRow.prescriptionrequired || normalizedRow.rx || normalizedRow.schedh || '').toLowerCase().includes('yes') || normalizedRow.prescriptionrequired === '1';

                return {
                    id: index + 1,
                    sku: String(sku).trim(),
                    name: String(name).trim(),
                    genericName: String(generic).trim(),
                    packing: String(packing).trim(),
                    category: String(category).trim(),
                    company: String(company).trim(),
                    hsnCode: String(hsn).trim(),
                    tax: Number(String(tax).replace(/%/g, '')) || 0,
                    unit: String(unit).trim(),
                    rackLocation: String(rack).trim(),
                    purchasePrice: Number(buy) || 0,
                    sellingPrice: Number(sell) || 0,
                    reorderLevel: Number(min) || 0,
                    image: String(img).trim(),
                    status: 'Active',
                    isPrescriptionRequired: rx
                };
            }).filter(m => m.name); // Require name at least
            
            if (parsedData.length > 0) {
                setBulkData(parsedData);
                setIsBulkMode(true);
                Swal.fire('Success', `${parsedData.length} medicines parsed successfully.`, 'success');
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Parsing Failed',
                    text: 'No valid medicine data found. Ensure your CSV has at least a "Name" column.',
                    footer: '<div class="text-xs text-center">Supported Headers: Name, SKU/Barcode, Generic, Category, Rate, MRP, Tax</div>'
                });
            }
            setUploading(false);
        },
        error: (error) => {
            console.error("CSV Parse Error:", error);
            Swal.fire('Error', 'Failed to parse CSV file.', 'error');
            setUploading(false);
        }
    });
  };

  const removeBulkRow = (id) => {
      const updated = bulkData.filter(row => row.id !== id);
      setBulkData(updated);
      if (updated.length === 0) setIsBulkMode(false);
  };

  const clearBulkData = () => {
      setBulkData([]);
      setIsBulkMode(false);
  };

  const handleAddUnit = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Add New Measurement Unit',
      html:
        '<div class="flex flex-col gap-3 p-2">' +
        '<input id="swal-input1" class="swal2-input !m-0 w-full" placeholder="Unit Name (e.g. Kilogram)">' +
        '<input id="swal-input2" class="swal2-input !m-0 w-full" placeholder="Abbreviation (e.g. kg)">' +
        '</div>',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Create Unit',
      confirmButtonColor: '#0D9488',
      preConfirm: () => {
        return [
          document.getElementById('swal-input1').value,
          document.getElementById('swal-input2').value
        ]
      }
    });

    if (formValues) {
      const [name, code] = formValues;
      if (!name || !code) {
        Swal.fire('Error', 'Please fill both Name and Code', 'error');
        return;
      }
      try {
        const { data } = await api.post('/units', { name, code });
        if (data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Created!',
            text: 'New unit added successfully',
            timer: 1500,
            showConfirmButton: false
          });
          await fetchOptions(); // Refresh the list
          setFormData(prev => ({ ...prev, unit: data.unit.name }));
        }
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Failed to create unit', 'error');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      if (isBulkMode) {
          Swal.fire({
              title: 'Processing Bulk Upload',
              text: `Saving ${bulkData.length} items to database...`,
              allowOutsideClick: false,
              didOpen: () => {
                  Swal.showLoading();
              }
          });

          let successCount = 0;
          let failCount = 0;
          let errorMessages = [];

          for (const item of bulkData) {
              try {
                  const payload = {
                      ...item,
                      batchNumber: 'N/A',
                      expiryDate: 'N/A'
                  };
                  delete payload.id;

                  const { data } = await api.post('/products', payload);
                  if (data.success) successCount++;
                  else {
                      failCount++;
                      errorMessages.push(`${item.name}: ${data.message}`);
                  }
              } catch (err) {
                  failCount++;
                  errorMessages.push(`${item.name}: ${err.response?.data?.message || err.message}`);
              }
          }

          Swal.fire({
              icon: failCount === 0 ? 'success' : (successCount > 0 ? 'warning' : 'error'),
              title: 'Bulk Upload Finished',
              html: `
                <div class="text-center">
                    <p class="font-bold text-lg mb-2 text-emerald-600">Successfully added: ${successCount}</p>
                    ${failCount > 0 ? `<p class="font-bold text-red-500 mb-4">Failed: ${failCount}</p>` : ''}
                    ${errorMessages.length > 0 ? `
                        <div class="text-left text-xs bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">
                            <p class="font-black mb-2 uppercase border-b pb-1">Error Logs:</p>
                            ${errorMessages.map(msg => `<p class="mb-1">• ${msg}</p>`).join('')}
                        </div>
                    ` : ''}
                </div>
              `,
              customClass: {
                container: 'max-h-screen'
              }
          }).then(() => {
              if (successCount > 0) {
                  fetchInventory();
                  navigate('/medicines/list');
              }
          });
          return;
      }

      // Validation for all mandatory fields
      const missingFields = [];
      if (!formData.name) missingFields.push('Medicine Name');
      if (!formData.barcode) missingFields.push('SKU/Barcode');
      if (!formData.genericName) missingFields.push('Generic Name');
      if (!formData.company) missingFields.push('Manufacturer');
      if (!formData.unit) missingFields.push('Base Unit');
      if (!formData.group) missingFields.push('Medicine Group');
      if (!formData.category) missingFields.push('Category');
      if (!formData.packing) missingFields.push('Packing');
      if (!formData.rackLocation) missingFields.push('Rack Location');
      if (!formData.purchasePrice) missingFields.push('Purchase Price');
      if (!formData.sellingPrice) missingFields.push('Selling Price');
      if (!formData.minLevel) missingFields.push('Min Stock Level');
      if (!formData.batchNumber) missingFields.push('Batch Number');
      if (!formData.manufacturingDate) missingFields.push('Manufacturing Date');
      if (!formData.expiryDate) missingFields.push('Expiry Date');

      if (missingFields.length > 0) {
         Swal.fire({
            title: 'Required Fields Missing',
            html: `<div class="text-left"><p class="mb-2 font-bold">Please fill the following mandatory fields:</p><ul class="list-disc pl-5">${missingFields.map(f => `<li>${f}</li>`).join('')}</ul></div>`,
            icon: 'error',
            confirmButtonColor: '#007242'
         });
         return;
      }

      const payload = {
        name: formData.name,
        genericName: formData.genericName,
        company: formData.company,
        sku: formData.barcode,
        unit: formData.unit,
        packing: formData.packing,
        hsnCode: formData.hsnCode,
        tax: Number(formData.tax) || 0,
        rackLocation: formData.rackLocation,
        purchasePrice: Number(formData.purchasePrice) || 0,
        sellingPrice: Number(formData.sellingPrice) || 0,
        reorderLevel: Number(formData.minLevel) || 20,
        status: formData.status,
        isPrescriptionRequired: formData.isPrescriptionRequired,
        group: formData.group,
        category: formData.category,
        batchNumber: formData.batchNumber,
        manufacturingDate: formData.manufacturingDate || 'N/A',
        expiryDate: formData.expiryDate,
        image: imagePreview
      };

      let response;
      if (isEditMode) {
          response = await api.put(`/products/${editData.id}`, payload);
      } else {
          response = await api.post('/products', payload);
      }

      const { data } = response;

      if (data.success) {
        await fetchInventory();
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: `${formData.name} has been ${isEditMode ? 'updated' : 'added'} successfully.`,
          confirmButtonColor: '#007242'
        }).then(() => {
          navigate('/medicines/list');
        });
      } else {
        Swal.fire('Error', data.message || 'Something went wrong', 'error');
      }
    } catch (error) {
      console.error("Medicine save error:", error);
      Swal.fire('Error', error.response?.data?.message || 'Failed to connect to server', 'error');
    }
  };

  return (
    <div className="animate-fade-in-up max-w-[1600px] mx-auto pb-10">
      
      {/* Top Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-10">
        <div className="flex items-center gap-4 w-full xl:w-auto">
           <div className="p-4 bg-primary/10 dark:bg-primary/20 rounded-2xl text-primary shadow-sm border border-primary/10">
              <Package size={28} strokeWidth={2.5} />
           </div>
           <div>
              <h1 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight leading-none">
                {isViewMode ? 'View Medicine' : (isEditMode ? 'Edit Medicine' : 'Add New Medicine')}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1.5 opacity-90">
                {isViewMode ? 'Reference record details' : (isEditMode ? 'Modify master product data' : 'Create a master record for a new item')}
              </p>
           </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            {!isEditMode && !isViewMode && (
                <div className="flex items-center gap-2 flex-1 sm:flex-none">
                    <div className="relative flex-1 sm:flex-none">
                        <input 
                            type="file" 
                            accept=".csv" 
                            id="csv-upload" 
                            className="hidden" 
                            onChange={handleCSVUpload}
                            disabled={uploading}
                        />
                        <label 
                            htmlFor="csv-upload"
                            className="w-full sm:w-auto px-5 py-3 rounded-xl border-2 border-dashed border-primary/30 text-primary dark:text-primary-400 font-black hover:bg-primary/5 cursor-pointer transition-all text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap"
                        >
                            {uploading ? <RefreshCw className="animate-spin" size={18} /> : <UploadCloud size={18} strokeWidth={3} />}
                            <span>Bulk Upload (CSV)</span>
                        </label>
                    </div>
                    <button
                        onClick={downloadSampleCSV}
                        className="h-[46px] w-[46px] flex items-center justify-center bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all active:scale-95"
                        title="Download Sample CSV"
                    >
                        <Download size={20} strokeWidth={2.5} />
                    </button>
                </div>
            )}
            
            <button 
              onClick={() => navigate('/medicines/list')}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-xs uppercase tracking-widest active:scale-95"
            >
              {isViewMode ? 'Back' : 'Cancel'}
            </button>

            {!isViewMode && (
              <button 
                 onClick={handleSubmit} 
                 className={`flex-1 sm:flex-none px-8 py-3 rounded-xl text-white font-black shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest ${isBulkMode ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-primary hover:bg-secondary'}`}
              >
                {isBulkMode ? <Check size={18} strokeWidth={3} /> : <Save size={18} strokeWidth={3} />}
                <span>{isBulkMode ? `Save ${bulkData.length}` : (isEditMode ? 'Update' : 'Save Record')}</span>
              </button>
            )}
        </div>
      </div>

      {/* Bulk Preview Table */}
      {isBulkMode && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-900/30 overflow-hidden">
               <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-900/30 flex justify-between items-center">
                   <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
                       <FileText size={20} />
                       <span>Bulk Upload Preview ({bulkData.length} items detected)</span>
                   </div>
                   <button 
                       onClick={clearBulkData}
                       className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1 bg-white dark:bg-gray-700 px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-900/30 shadow-sm"
                   >
                       <X size={14} /> Clear Bulk Upload
                   </button>
               </div>
               <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm">
                       <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-bold">
                           <tr>
                               <th className="px-4 py-3">Barcode</th>
                               <th className="px-4 py-3">Medicine Name</th>
                               <th className="px-4 py-3">Type</th>
                               <th className="px-4 py-3">Price (P/S)</th>
                               <th className="px-4 py-3">Tax</th>
                               <th className="px-4 py-3">Image</th>
                               <th className="px-4 py-3 text-center">Action</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                           {bulkData.slice(0, 50).map((row) => (
                               <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                   <td className="px-4 py-3 font-mono font-bold text-primary">{row.sku}</td>
                                   <td className="px-4 py-3">
                                       <div className="font-bold text-gray-800 dark:text-gray-100">{row.name}</div>
                                       <div className="text-[10px] text-gray-400">{row.genericName}</div>
                                   </td>
                                   <td className="px-4 py-3">
                                       <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold">{row.category}</span>
                                   </td>
                                   <td className="px-4 py-3">
                                       <span className="text-gray-500">₹{row.purchasePrice}</span> / <span className="font-bold text-emerald-600">₹{row.sellingPrice}</span>
                                   </td>
                                   <td className="px-4 py-3 font-medium text-gray-500">{row.tax}%</td>
                                   <td className="px-4 py-3">
                                       {row.image ? <img src={row.image} className="w-8 h-8 rounded border object-cover" alt="medicine" /> : <Layers size={16} className="text-gray-300" />}
                                   </td>
                                   <td className="px-4 py-3 text-center">
                                       <button onClick={() => removeBulkRow(row.id)} className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                           <X size={16} />
                                       </button>
                                   </td>
                               </tr>
                           ))}
                           {bulkData.length > 50 && (
                               <tr>
                                   <td colSpan="7" className="px-4 py-3 text-center text-gray-400 italic">... and {bulkData.length - 50} more items ...</td>
                               </tr>
                           )}
                       </tbody>
                   </table>
               </div>
          </div>
      )}

      <fieldset disabled={isViewMode || isBulkMode} className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-none p-0 m-0 min-w-0">
        
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
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Generic Name <span className="text-red-500">*</span></label>
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
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Manufacturer <span className="text-red-500">*</span></label>
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
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Medicine Group <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                      <select 
                        name="group"
                        value={formData.group}
                        onChange={handleChange}
                        className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-gray-700 dark:text-gray-200 cursor-pointer"
                      >
                        <option value="">Select Group</option>
                        {groups.map(g => (
                          <option key={g._id} value={g.name}>{g.name}</option>
                        ))}
                      </select>
                      <button 
                         type="button"
                         onClick={async () => {
                             const { value: newGroup } = await Swal.fire({
                                 title: 'Add New Medicine Group',
                                 input: 'text',
                                 inputLabel: 'Group Name',
                                 inputPlaceholder: 'e.g. Antibiotics',
                                 showCancelButton: true
                             });
                             if (newGroup) {
                                 try {
                                     const { data } = await api.post('/groups', { name: newGroup });
                                     if (data.success) {
                                         Swal.fire('Success', 'Group added successfully', 'success');
                                         fetchOptions(); // Refresh lists
                                         setFormData(prev => ({ ...prev, group: data.group.name }));
                                     }
                                 } catch (error) {
                                     Swal.fire('Error', error.response?.data?.message || 'Failed to add group', 'error');
                                 }
                             }
                         }}
                         className="p-2.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-500 hover:text-primary transition-all active:scale-95 shadow-sm"
                         title="Add New Group"
                       >
                          <Plus size={18} />
                       </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Therapeutic Category <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                        <select 
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-gray-700 dark:text-gray-200 cursor-pointer"
                        >
                          <option value="">Select Category</option>
                          {categories.map(c => (
                            <option key={c._id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                        <button 
                             type="button"
                             onClick={async () => {
                                 const { value: newCat } = await Swal.fire({
                                     title: 'Add New Category',
                                     input: 'text',
                                     inputLabel: 'Category Name',
                                     inputPlaceholder: 'e.g. Analgesic',
                                     showCancelButton: true
                                 });
                                 if (newCat) {
                                     try {
                                         const { data } = await api.post('/categories', { name: newCat });
                                         if (data.success) {
                                             Swal.fire('Success', 'Category added successfully', 'success');
                                             fetchOptions(); // Refresh lists
                                             setFormData(prev => ({ ...prev, category: data.category.name }));
                                         }
                                     } catch (error) {
                                         Swal.fire('Error', error.response?.data?.message || 'Failed to add category', 'error');
                                     }
                                 }
                             }}
                             className="p-2.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-500 hover:text-primary transition-all active:scale-95 shadow-sm"
                             title="Add New Category"
                           >
                              <Plus size={18} />
                           </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Base Unit <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                       <select 
                         name="unit"
                         value={formData.unit}
                         onChange={handleChange}
                         className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-gray-700 dark:text-gray-200 cursor-pointer"
                       >
                         <option value="">Select Unit</option>
                         {units.map(u => (
                           <option key={u._id} value={u.name}>{u.name}</option>
                         ))}
                         {/* Fallbacks if units empty */}
                         {units.length === 0 && (
                           <>
                             <option value="Strip">Strip</option>
                             <option value="Bottle">Bottle</option>
                             <option value="Tube">Tube</option>
                             <option value="Vial">Vial</option>
                             <option value="Box">Box</option>
                             <option value="Pc">Piece</option>
                           </>
                         )}
                       </select>
                       <button 
                         type="button"
                         onClick={handleAddUnit}
                         className="p-2.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-500 hover:text-primary transition-all active:scale-95 shadow-sm"
                         title="Add New Unit"
                       >
                          <Plus size={18} />
                       </button>
                    </div>
                  </div>

                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Packing (e.g. 1x15) <span className="text-red-500">*</span></label>
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

            {/* Section 2: Batch & Expiry Details */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
               <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                  <Activity className="text-indigo-500" size={20} /> Batch & Expiry Details
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Batch Number <span className="text-red-500">*</span></label>
                     <div className="relative flex gap-2">
                        <input 
                           type="text" 
                           name="batchNumber"
                           value={formData.batchNumber}
                           onChange={handleChange}
                           placeholder="e.g. BATCH-001"
                           className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-mono font-bold text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        />
                        <button 
                           type="button"
                           onClick={() => {
                               const random = Math.floor(1000 + Math.random() * 9000);
                               const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
                               setFormData(prev => ({ ...prev, batchNumber: `BN${date}-${random}` }));
                           }}
                           className="px-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-500 hover:text-primary hover:bg-white dark:hover:bg-gray-600 transition-all shadow-sm"
                           title="Auto Generate Batch"
                        >
                           <RefreshCw size={18} />
                        </button>
                     </div>
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Manufacturing Date <span className="text-red-500">*</span></label>
                     <input 
                       type="date" 
                       name="manufacturingDate"
                       value={formData.manufacturingDate}
                       onChange={handleChange}
                       className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-gray-800 dark:text-white cursor-pointer"
                     />
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Expiry Date <span className="text-red-500">*</span></label>
                     <input 
                       type="date" 
                       name="expiryDate"
                       value={formData.expiryDate}
                       onChange={handleChange}
                       className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-gray-800 dark:text-white cursor-pointer"
                     />
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
                     <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Rack / Shelf Location <span className="text-red-500">*</span></label>
                     <select 
                       name="rackLocation"
                       value={formData.rackLocation}
                       onChange={handleChange}
                       className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-mono text-gray-800 dark:text-white cursor-pointer"
                     >
                        <option value="">Select Location</option>
                        {locations.map(loc => (
                          <option key={loc._id} value={loc.locationCode}>
                            {loc.locationCode} {loc.category ? `(${loc.category})` : ''}
                          </option>
                        ))}
                     </select>
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
                     <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Purchase Price (Rate) <span className="text-red-500">*</span></label>
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
                     <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Selling Price (MRP) <span className="text-red-500">*</span></label>
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
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Low Stock Alert Level <span className="text-red-500">*</span></label>
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
