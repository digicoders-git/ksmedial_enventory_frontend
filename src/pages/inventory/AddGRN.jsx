import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    Save, X, Plus, Trash2, Calendar, 
    FileText, User, Search, Package, 
    ArrowLeft, Upload, Download
} from 'lucide-react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import Papa from 'papaparse';

const AddGRN = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedSupplierDetails, setSelectedSupplierDetails] = useState(null);
    const [invoiceFile, setInvoiceFile] = useState(null);
    
    // Form State
    const [formData, setFormData] = useState({
        supplierId: '',
        invoiceNumber: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        notes: ''
    });

    // Invoice Summary State
    const [invoiceSummary, setInvoiceSummary] = useState({
        taxableAmount: 0,
        tcsAmount: 0,
        mrpValue: 0,
        netAmount: 0,
        amountAfterGst: 0,
        roundAmount: 0,
        invoiceAmount: 0
    });

    // Tax Breakup State
    const [taxBreakup, setTaxBreakup] = useState({
        gst5: { taxable: 0, tax: 0 },
        gst12: { taxable: 0, tax: 0 },
        gst18: { taxable: 0, tax: 0 },
        gst28: { taxable: 0, tax: 0 }
    });

    // Items State
    const [items, setItems] = useState([]);
    
    // Product Search
    const [productSearch, setProductSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [showAddSkuModal, setShowAddSkuModal] = useState(false);
    const [modalSearchTerm, setModalSearchTerm] = useState('');
    const [physicalId, setPhysicalId] = useState('');
    
    const prefillHandled = React.useRef(false);

    const formatDateForInput = (dateStr) => {
        if (!dateStr || dateStr === 'N/A') return '';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '';
            return date.toISOString().split('T')[0];
        } catch (e) {
            return '';
        }
    };

    const fetchAndSetPOItems = async (poId) => {
        if (!poId) return false;
        try {
            // Handle multiple POs (take first) if comma separated
            const idToFetch = poId.split(',')[0].trim();
            const { data: response } = await api.get(`/purchase-orders/${idToFetch}`);
            const po = response.data || response.order || response;
            
            if (po && po.items) {
                const poItems = po.items.map(item => {
                    const prodId = item.product?._id || item.product;
                    const product = products.find(p => p._id === prodId); 
                    const purchaseRate = parseFloat(item.purchaseRate || product?.purchasePrice || product?.rate || 0);
                    const mrpPrice = parseFloat(product?.mrp || product?.sellingPrice || 0);

                    return {
                        productId: product?._id || prodId || '',
                        productName: item.medicineName || product?.name || '',
                        supplierSkuId: '',
                        skuId: product?.sku || item.product?.sku || '',
                        pack: product?.packing || product?.packSize || '',
                        batchNumber: (product?.batchNumber && product?.batchNumber !== 'N/A') ? product?.batchNumber : (product?.batchNo || product?.batch || ''),
                        expiryDate: formatDateForInput(product?.expiryDate || product?.expiry || product?.exp),
                        mfgDate: formatDateForInput(product?.manufacturingDate || product?.mfgDate || product?.mfg),
                        systemMrp: mrpPrice,
                        orderedQty: item.quantity || 0,
                        receivedQty: item.quantity || 0,
                        physicalFreeQty: 0,
                        schemeFreeQty: 0,
                        poRate: purchaseRate,
                        ptr: parseFloat(product?.ptr || purchaseRate || 0),
                        baseRate: purchaseRate,
                        schemeDiscount: 0,
                        discountPercent: 0,
                        amount: 0,
                        hsnCode: product?.hsnCode || '',
                        cgst: (item.gst || product?.tax || 0) / 2,
                        sgst: (item.gst || product?.tax || 0) / 2,
                        igst: 0,
                        purchasePrice: purchaseRate,
                        sellingPrice: product?.sellingPrice || mrpPrice,
                        mrp: mrpPrice,
                        margin: mrpPrice > 0 ? ((mrpPrice - purchaseRate) / mrpPrice * 100).toFixed(2) : 0
                    };
                });
                
                const enriched = poItems.map(i => {
                    i.amount = i.baseRate * i.receivedQty;
                    return i;
                });
                
                setItems(enriched);
                calculateSummary(enriched);
                return true;
            }
            return false;
        } catch (error) {
            console.error("Failed to fetch PO details", error);
            return false;
        }
    };

    useEffect(() => {
        fetchSuppliers();
        fetchProducts();
    }, []);

    useEffect(() => {
        // Handle prefill from state (Physical or Purchase Order)
        if (location.state?.prefill && suppliers.length > 0 && products.length > 0 && !prefillHandled.current) {
            const { physicalId: phId, entryData, poData } = location.state.prefill;
            
            // 1. Prefill from Physical Validation
            if (phId) {
                const supplier = suppliers.find(s => s.name.toLowerCase() === entryData?.supplierName?.toLowerCase());
                setPhysicalId(phId || '');
                setFormData(prev => ({ 
                    ...prev, 
                    supplierId: supplier?._id || '',
                    invoiceNumber: entryData?.invoiceNumber || '',
                    invoiceDate: entryData?.invoiceDate?.split('T')[0] || new Date().toISOString().split('T')[0],
                    notes: `Ref: Physical ID ${phId}, Loc: ${entryData?.location || 'N/A'}`
                }));
                if (supplier) setSelectedSupplierDetails(supplier);
                
                // Fetch PO Items if PO ID is present
                if (entryData?.poIds) {
                    const loadItems = async () => {
                        const success = await fetchAndSetPOItems(entryData.poIds);
                        if (success) {
                            Swal.fire({
                                title: 'Data Loaded',
                                text: `Prefilled from Physical ID: ${phId} & PO: ${entryData.poIds}`,
                                icon: 'success',
                                timer: 2000,
                                showConfirmButton: false
                            });
                        } else {
                            Swal.fire({
                                title: 'Data Loaded',
                                text: `Prefilled from Physical ID: ${phId}. (Items not linked or PO not found)`,
                                icon: 'info',
                                timer: 2000,
                                showConfirmButton: false
                            });
                        }
                    };
                    loadItems();
                } else {
                     Swal.fire({
                        title: 'Data Loaded',
                        text: `Prefilled details from Physical ID: ${phId}`,
                        icon: 'info',
                        timer: 2000,
                        showConfirmButton: false
                    });
                }
            }
            
            // 2. Prefill from Purchase Order (Direct)
            else if (poData) {
                const supplier = suppliers.find(s => s._id === poData.supplierId || s.name === poData.supplierName);
                setFormData(prev => ({
                    ...prev,
                    supplierId: supplier?._id || poData.supplierId || '',
                    notes: `Ref: PO #${poData.poNumber}`,
                    invoiceNumber: '' 
                }));
                
                if (supplier) setSelectedSupplierDetails(supplier);

                // Prefill Items from PO
                if (poData.items && poData.items.length > 0) {
                    const poItems = poData.items.map(item => {
                        const product = products.find(p => p._id === item.product || p._id === item.productId); 
                        return {
                            productId: product?._id || item.product || '',
                            productName: item.medicineName || product?.name || '',
                            supplierSkuId: '',
                            skuId: product?.sku || '',
                            pack: product?.packSize || '',
                            batchNumber: '',
                            expiryDate: '',
                            mfgDate: '',
                            systemMrp: product?.mrp || 0,
                            orderedQty: item.quantity || 0,
                            receivedQty: item.quantity || 0, 
                            physicalFreeQty: 0,
                            schemeFreeQty: 0,
                            poRate: item.purchaseRate || 0,
                            ptr: 0,
                            baseRate: item.purchaseRate || 0,
                            schemeDiscount: 0,
                            discountPercent: 0,
                            amount: 0, 
                            hsnCode: product?.hsnCode || '',
                            cgst: (item.gst || 0) / 2,
                            sgst: (item.gst || 0) / 2,
                            igst: 0,
                            purchasePrice: item.purchaseRate || 0,
                            sellingPrice: product?.sellingPrice || 0,
                            mrp: product?.mrp || 0,
                            margin: 0
                        };
                    });
                    
                    const enriched = poItems.map(i => {
                        i.amount = i.baseRate * i.receivedQty;
                        return i;
                    });
                    
                    setItems(enriched);
                    calculateSummary(enriched);
                }

                Swal.fire({
                    title: 'PO Loaded',
                    text: `Prefilled details from Purchase Order: ${poData.poNumber}`,
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
            
            prefillHandled.current = true;
        }
    }, [location.state, suppliers, products]);

    const handleLoadPhysical = async () => {
        if (!physicalId) return;
        try {
            setLoading(true);
            const { data } = await api.get(`/physical-receiving/${physicalId}`);
            if (data.success) {
                const entry = data.data;
                if (entry.status !== 'Done') {
                    Swal.fire('Warning', 'This physical entry is not marked as Validated yet.', 'warning');
                    return;
                }
                
                const supplier = suppliers.find(s => s.name.toLowerCase() === entry.supplierName.toLowerCase());

                setFormData(prev => ({
                    ...prev,
                    invoiceNumber: entry.invoiceNumber,
                    invoiceDate: entry.invoiceDate.split('T')[0],
                    supplierId: supplier?._id || '',
                    notes: `Ref: Physical ID ${entry.physicalReceivingId}, Loc: ${entry.location || 'N/A'}`
                }));

                if (supplier) {
                    setSelectedSupplierDetails(supplier);
                }

                if (entry.poIds) {
                    await fetchAndSetPOItems(entry.poIds);
                    Swal.fire('Success', `Loaded details & Items for Invoice ${entry.invoiceNumber}`, 'success');
                } else {
                    Swal.fire('Success', `Loaded details for Invoice ${entry.invoiceNumber}`, 'success');
                }
            }
        } catch (error) {
            Swal.fire('Error', 'Physical Validation ID not found', 'error');
        } finally {
            setLoading(false);
        }
    };

    const downloadSampleCSV = () => {
        // Updated header list to match parsing logic
        const headers = [
            'Medicine Name',
            'SKU',
            'Supplier SKU',
            'Pack',
            'Batch',
            'Expiry',
            'Mfg Date',
            'Received Qty',
            'Free Qty',
            'Purchase Rate', // Base Rate
            'PTR',
            'MRP',
            'Disc %',
            'GST %',
            'HSN'
        ];

        const sampleData = [
            'Dolo 650,SKU-123,SUP-456,15T,B1234,2025-12-31,2023-12-01,100,2,25.50,22.00,45.00,5,12,3004',
            'Crosin,SKU-789,SUP-999,10T,C5678,2026-05-30,2024-01-15,50,0,15.75,13.50,25.00,10,5,3004'
        ];

        const csvContent = [headers.join(','), ...sampleData].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'grn_import_sample.csv');
        link.style.visibility = 'hidden';
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
                    Swal.fire('Error', 'Failed to parse CSV file', 'error');
                    return;
                }

                const newItems = results.data.map(row => {
                    if (!row['Medicine Name'] && !row['Item Name']) return null;
                    const name = row['Medicine Name'] || row['Item Name'];
                    const product = products.find(p => p.name.toLowerCase() === name.toLowerCase());
                    
                    const mrpPrice = parseFloat(row['MRP']) || parseFloat(product?.mrp) || parseFloat(product?.sellingPrice) || 0;

                    return {
                        productId: product?._id || '',
                        productName: name,
                        skuId: product?.sku || row['SKU'] || '',
                        supplierSkuId: row['Supplier SKU'] || '',
                        pack: row['Pack'] || row['Packing'] || '',
                        batchNumber: row['Batch'] || row['Batch Number'] || '',
                        expiryDate: row['Expiry'] || row['Expiry Date'] || '',
                        mfgDate: row['Mfg Date'] || '',
                        systemMrp: product?.mrp || 0,
                        orderedQty: parseFloat(row['Ordered Qty']) || 0,
                        receivedQty: parseFloat(row['Received Qty']) || parseFloat(row['Quantity']) || 0,
                        physicalFreeQty: parseFloat(row['Free Qty']) || 0,
                        schemeFreeQty: 0,
                        poRate: parseFloat(row['Rate']) || parseFloat(row['Purchase Rate']) || 0,
                        ptr: parseFloat(row['PTR']) || 0,
                        baseRate: parseFloat(row['Base Rate']) || parseFloat(row['Purchase Rate']) || 0,
                        schemeDiscount: 0,
                        discountPercent: parseFloat(row['Disc %']) || 0,
                        amount: 0, // Will be calculated
                        hsnCode: product?.hsnCode || row['HSN'] || '',
                        cgst: (parseFloat(row['GST %']) / 2) || 0,
                        sgst: (parseFloat(row['GST %']) / 2) || 0,
                        igst: 0, // Handle correctly if needed
                        sellingPrice: product?.sellingPrice || mrpPrice,
                        mrp: mrpPrice,
                        purchasePrice: parseFloat(row['Base Rate']) || parseFloat(row['Purchase Rate']) || 0,
                        margin: parseFloat(row['Margin']) || 0
                    };
                }).filter(Boolean);

                if (newItems.length > 0) {
                    // Enrich items with calculations
                    const enriched = newItems.map(item => {
                        const baseAmount = item.baseRate * item.receivedQty;
                        const discountAmount = baseAmount * (item.discountPercent / 100);
                        item.amount = baseAmount - discountAmount;
                        if (item.baseRate > 0 && item.mrp > 0) {
                            item.margin = ((item.mrp - item.baseRate) / item.baseRate * 100).toFixed(2);
                        }
                        return item;
                    });
                    setItems(prev => [...prev, ...enriched]);
                    calculateSummary([...items, ...enriched]);
                    Swal.fire('Success', `Imported ${newItems.length} items from CSV`, 'success');
                }
                e.target.value = '';
            }
        });
    };

    const fetchSuppliers = async () => {
        try {
            const { data } = await api.get('/suppliers');
            if (data.success) setSuppliers(data.suppliers);
        } catch (error) {
            console.error("Failed to fetch suppliers");
        }
    };

    const fetchProducts = async () => {
        try {
            const { data } = await api.get('/products');
            if (data.success) setProducts(data.products);
        } catch (error) {
            console.error("Failed to fetch products");
        }
    };

    const handleProductSearch = (value) => {
        setProductSearch(value);
        if (value.length > 1) {
            const results = products.filter(p => 
                p.name.toLowerCase().includes(value.toLowerCase()) ||
                p.sku?.toLowerCase().includes(value.toLowerCase())
            );
            setSearchResults(results);
            setShowResults(true);
        } else {
            setShowResults(false);
        }
    };

    const addProductToGRN = (product) => {
        const existingIndex = items.findIndex(item => item.productId === product._id);
        
        if (existingIndex >= 0) {
            Swal.fire('Already Added', 'This product is already in the GRN', 'info');
            return;
        }

        const purchaseRate = parseFloat(product.purchasePrice || product.rate || 0);
        const mrpPrice = parseFloat(product.mrp || product.sellingPrice || 0);
        const ptrPrice = parseFloat(product.ptr || purchaseRate || 0);

        const newItem = {
            productId: product._id,
            productName: product.name,
            supplierSkuId: '',
            skuId: product.sku || '',
            pack: product.packing || product.packSize || '',
            // Fallback keys for batch and dates with robust formatting
            batchNumber: (product.batchNumber && product.batchNumber !== 'N/A') ? product.batchNumber : (product.batchNo || product.batch || ''),
            expiryDate: formatDateForInput(product.expiryDate || product.expiry || product.exp),
            mfgDate: formatDateForInput(product.manufacturingDate || product.mfgDate || product.mfg),
            systemMrp: mrpPrice,
            orderedQty: 1, 
            receivedQty: 1, 
            physicalFreeQty: 0,
            schemeFreeQty: 0,
            poRate: purchaseRate,
            ptr: ptrPrice,
            baseRate: purchaseRate,
            schemeDiscount: 0,
            discountPercent: 0,
            amount: purchaseRate, 
            hsnCode: product.hsnCode || '',
            cgst: product.tax ? (product.tax / 2) : 0,
            sgst: product.tax ? (product.tax / 2) : 0,
            igst: 0,
            purchasePrice: purchaseRate,
            sellingPrice: product.sellingPrice || mrpPrice,
            mrp: mrpPrice,
            margin: mrpPrice > 0 ? ((mrpPrice - purchaseRate) / mrpPrice * 100).toFixed(2) : (purchaseRate > 0 ? 0 : 0)
        };

        const updatedItems = [...items, newItem];
        setItems(updatedItems);
        calculateSummary(updatedItems); // Immediately update summary
        setProductSearch('');
        setShowResults(false);
    };

    const updateItem = (index, field, value) => {
        const updatedItems = [...items];
        updatedItems[index][field] = value;

        const item = updatedItems[index];

        // If PO Rate or PTR is updated, also update Base Rate to stay in sync
        if (field === 'poRate' || field === 'ptr') {
            item.baseRate = value;
        }

        // Auto-calculate amount and margin based on updated fields (Trigger on any price/qty change)
        if (['poRate', 'ptr', 'baseRate', 'receivedQty', 'discountPercent', 'mrp'].includes(field)) {
            const currentRate = parseFloat(item.baseRate) || 0;
            const currentQty = parseFloat(item.receivedQty) || 0;
            const currentDisc = parseFloat(item.discountPercent) || 0;
            const currentMrp = parseFloat(item.mrp) || 0;

            const baseAmount = currentRate * currentQty;
            const discountAmount = baseAmount * (currentDisc / 100);
            item.amount = baseAmount - discountAmount;
            
            // Recalculate margin: (MRP - Cost) / MRP * 100
            // This is the standard Retail Margin formula
            if (currentMrp > 0) {
                item.margin = (((currentMrp - currentRate) / currentMrp) * 100).toFixed(2);
            } else if (currentRate > 0) {
                // Fallback to markup if MRP is 0
                item.margin = (((currentMrp - currentRate) / currentRate) * 100).toFixed(2);
            } else {
                item.margin = "0.00";
            }
        }

        setItems(updatedItems);
        calculateSummary(updatedItems);
    };

    const removeItem = (index) => {
        const updatedItems = items.filter((_, i) => i !== index);
        setItems(updatedItems);
        calculateSummary(updatedItems);
    };

    const calculateSummary = (itemsList) => {
        let taxableAmount = 0;
        let mrpValue = 0;
        const breakup = {
            gst5: { taxable: 0, tax: 0 },
            gst12: { taxable: 0, tax: 0 },
            gst18: { taxable: 0, tax: 0 },
            gst28: { taxable: 0, tax: 0 }
        };

        itemsList.forEach(item => {
            const itemTaxable = item.amount || 0;
            const totalGst = (item.cgst || 0) + (item.sgst || 0) + (item.igst || 0);
            const itemTax = itemTaxable * (totalGst / 100);

            taxableAmount += itemTaxable;
            mrpValue += (item.mrp || 0) * (item.receivedQty || 0);

            // Categorize by GST
            if (totalGst === 5) {
                breakup.gst5.taxable += itemTaxable;
                breakup.gst5.tax += itemTax;
            } else if (totalGst === 12) {
                breakup.gst12.taxable += itemTaxable;
                breakup.gst12.tax += itemTax;
            } else if (totalGst === 18) {
                breakup.gst18.taxable += itemTaxable;
                breakup.gst18.tax += itemTax;
            } else if (totalGst === 28) {
                breakup.gst28.taxable += itemTaxable;
                breakup.gst28.tax += itemTax;
            }
        });

        const totalTax = breakup.gst5.tax + breakup.gst12.tax + breakup.gst18.tax + breakup.gst28.tax;
        const amountAfterGst = taxableAmount + totalTax;
        const roundAmount = Math.round(amountAfterGst) - amountAfterGst;
        const invoiceAmount = Math.round(amountAfterGst);

        setInvoiceSummary({
            taxableAmount: parseFloat(taxableAmount.toFixed(2)),
            tcsAmount: 0,
            mrpValue: parseFloat(mrpValue.toFixed(2)),
            netAmount: parseFloat(taxableAmount.toFixed(2)),
            amountAfterGst: parseFloat(amountAfterGst.toFixed(2)),
            roundAmount: parseFloat(roundAmount.toFixed(2)),
            invoiceAmount
        });

        setTaxBreakup(breakup);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation 1: Supplier
        if (!formData.supplierId) {
            Swal.fire({
                icon: 'warning',
                title: 'Supplier Required',
                text: 'Please select a supplier before submitting',
                confirmButtonColor: '#10b981'
            });
            return;
        }

        // Validation 2: Invoice Date
        if (!formData.invoiceDate) {
            Swal.fire({
                icon: 'warning',
                title: 'Invoice Date Required',
                text: 'Please select the invoice date',
                confirmButtonColor: '#10b981'
            });
            return;
        }

        // Validation 3: Items
        if (items.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No Items Added',
                text: 'Please add at least one item to the GRN',
                confirmButtonColor: '#10b981'
            });
            return;
        }

        // Validation 4: Check each item for required fields
        const invalidItems = [];
        items.forEach((item, index) => {
            const errors = [];
            
            if (!item.productId || item.productId.trim() === '') {
                errors.push('Product (Not found in system)');
            }
            if (!item.supplierSkuId || item.supplierSkuId.trim() === '') {
                errors.push('Supplier SKU ID');
            }
            if (!item.skuId || item.skuId.trim() === '') {
                errors.push('SKU ID');
            }
            if (!item.pack || item.pack.trim() === '') {
                errors.push('Pack');
            }
            if (!item.batchNumber || item.batchNumber.trim() === '') {
                errors.push('Batch Number');
            }
            if (!item.expiryDate) {
                errors.push('Expiry Date');
            }
            if (!item.mfgDate) {
                errors.push('Mfg Date');
            }
            if (!item.orderedQty || item.orderedQty <= 0) {
                errors.push('Ordered Qty');
            }
            if (!item.receivedQty || item.receivedQty <= 0) {
                errors.push('Received Qty');
            }
            if (!item.poRate || item.poRate <= 0) {
                errors.push('PO Rate');
            }
            if (!item.ptr || item.ptr <= 0) {
                errors.push('PTR');
            }
            if (!item.baseRate || item.baseRate <= 0) {
                errors.push('Base Rate');
            }
            if (!item.hsnCode || item.hsnCode.trim() === '') {
                errors.push('HSN Code');
            }
            if (item.cgst === undefined || item.cgst === null || item.cgst < 0) {
                errors.push('CGST');
            }
            if (item.sgst === undefined || item.sgst === null || item.sgst < 0) {
                errors.push('SGST');
            }
            if (!item.mrp || item.mrp <= 0) {
                errors.push('MRP');
            }
            
            if (errors.length > 0) {
                invalidItems.push({
                    index: index + 1,
                    name: item.productName,
                    errors: errors
                });
            }
        });

        if (invalidItems.length > 0) {
            const errorList = invalidItems.map(item => 
                `<div class="text-left mb-2">
                    <strong>Item ${item.index}: ${item.name}</strong><br/>
                    <span class="text-red-500 text-sm">Missing: ${item.errors.join(', ')}</span>
                </div>`
            ).join('');
            
            Swal.fire({
                icon: 'error',
                title: 'Incomplete Item Details',
                html: `<div class="max-h-60 overflow-y-auto">${errorList}</div>`,
                confirmButtonColor: '#10b981',
                width: '600px'
            });
            return;
        }

        const result = await Swal.fire({
            title: 'Confirm GRN Details?',
            text: "Are you sure you want to save this GRN? Items will be moved to Put Away Bucket.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981', // Emerald-500
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Save GRN'
        });

        if (result.isConfirmed) {
            try {
                setLoading(true);

                const formDataToSend = new FormData();
                formDataToSend.append('supplierId', formData.supplierId);
                formDataToSend.append('invoiceDate', formData.invoiceDate);
                formDataToSend.append('invoiceNumber', formData.invoiceNumber);
                formDataToSend.append('notes', formData.notes);
                
                // Properly stringify arrays/objects for FormData
                formDataToSend.append('items', JSON.stringify(items)); 
                formDataToSend.append('invoiceSummary', JSON.stringify(invoiceSummary));
                formDataToSend.append('taxBreakup', JSON.stringify(taxBreakup));
                
                // Add explicit fields if backend expects them separately (though they are in summary)
                formDataToSend.append('subTotal', invoiceSummary.taxableAmount);
                formDataToSend.append('taxAmount', invoiceSummary.amountAfterGst - invoiceSummary.taxableAmount);
                formDataToSend.append('discount', 0);
                formDataToSend.append('grandTotal', invoiceSummary.invoiceAmount);
                
                formDataToSend.append('status', 'Putaway_Pending');
                formDataToSend.append('paymentStatus', 'Pending');
                if (physicalId) formDataToSend.append('physicalReceivingId', physicalId);
                
                if (invoiceFile) {
                    formDataToSend.append('invoiceFile', invoiceFile);
                }

                // Log payload for debugging
                // for (var pair of formDataToSend.entries()) {
                //     console.log(pair[0]+ ', ' + pair[1]); 
                // }

                const { data } = await api.post('/purchases', formDataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                
                if (data.success) {
                    await Swal.fire({
                        title: 'GRN Created!',
                        text: 'Items sent to Put Away Bucket for verification.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });
                    // Navigate to Invoice View
                    navigate(`/purchase/grn/view/${data.purchase._id}`);
                }
            } catch (error) {
                console.error("GRN Save Error:", error);
                Swal.fire('Error', error.response?.data?.message || 'Failed to create GRN', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight">
                        Purchase Receive Orders
                    </h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">Create new GRN with invoice details</p>
                </div>
                <button
                    onClick={() => navigate('/purchase/grn-list')}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 transition-all"
                >
                    <ArrowLeft size={18} /> Back
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Top Section: Supplier + Summary */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Left: Supplier Info */}
                    <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                        <h3 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-widest mb-6">
                            Supplier & Invoice Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Physical Validation ID</label>
                                <div className="flex gap-2">
                                    <input 
                                        value={physicalId}
                                        onChange={(e) => setPhysicalId(e.target.value)}
                                        placeholder="e.g. PV-1234"
                                        className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold uppercase"
                                    />
                                    <button 
                                        type="button"
                                        onClick={handleLoadPhysical}
                                        className="px-4 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-emerald-700 transition-all shadow-md active:scale-95"
                                    >
                                        Load
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bulk Import (CSV)</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="file" 
                                        id="csv-upload"
                                        className="hidden" 
                                        accept=".csv"
                                        onChange={handleCSVUpload}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => document.getElementById('csv-upload').click()}
                                        className="w-full h-[40px] flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 rounded-xl text-xs font-bold uppercase hover:bg-blue-100 transition-all flex-1"
                                    >
                                        <Upload size={14} /> Upload CSV
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={downloadSampleCSV}
                                        className="h-[40px] w-[40px] flex items-center justify-center bg-gray-50 text-gray-500 rounded-xl border border-gray-200 hover:bg-gray-100"
                                        title="Download Sample CSV"
                                    >
                                        <Download size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Invoice Upload</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="file" 
                                        id="invoice-upload"
                                        className="hidden" 
                                        accept="*"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file && file.size > 50 * 1024 * 1024) {
                                                Swal.fire({
                                                    icon: 'error',
                                                    title: 'File Too Large',
                                                    text: 'Invoice file size must be less than 50MB',
                                                    confirmButtonColor: '#10b981'
                                                });
                                                e.target.value = null;
                                                return;
                                            }
                                            setInvoiceFile(file);
                                        }}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => document.getElementById('invoice-upload').click()}
                                        className={`w-full h-[40px] flex items-center justify-center gap-2 px-4 py-2 border rounded-xl text-xs font-bold uppercase transition-all ${
                                            invoiceFile 
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                        }`}
                                    >
                                        <FileText size={14} /> {invoiceFile ? invoiceFile.name.substring(0, 15) + '...' : 'Upload Invoice'}
                                    </button>
                                    {invoiceFile && (
                                        <button 
                                            type="button"
                                            onClick={() => setInvoiceFile(null)}
                                            className="h-[40px] w-[40px] flex items-center justify-center bg-red-50 text-red-500 rounded-xl border border-red-100 hover:bg-red-100"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                                    Supplier <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.supplierId}
                                    onChange={(e) => {
                                        const supplierId = e.target.value;
                                        setFormData({ ...formData, supplierId });
                                        // Auto-fill supplier details
                                        const supplier = suppliers.find(s => s._id === supplierId);
                                        setSelectedSupplierDetails(supplier || null);
                                    }}
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                    required
                                >
                                    <option value="">Select Supplier</option>
                                    {suppliers.map(s => (
                                        <option key={s._id} value={s._id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Invoice Number</label>
                                <input
                                    type="text"
                                    value={formData.invoiceNumber}
                                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                    placeholder="Auto-generated (GRN-YYYY-XXXX)"
                                    readOnly
                                />
                                <p className="text-[10px] text-gray-400 mt-1 font-medium">Invoice number will be auto-generated</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                                    Invoice Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={formData.invoiceDate}
                                    onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                                    max={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Notes</label>
                                <input
                                    type="text"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                    placeholder="Optional notes"
                                />
                            </div>
                        </div>
                        
                        {/* Supplier Details Display */}
                        {selectedSupplierDetails && (
                            <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                                <h4 className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-3">Supplier Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-gray-500 text-xs font-bold">Contact Person:</span>
                                        <p className="font-bold text-gray-800 dark:text-white">{selectedSupplierDetails.contactPerson || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 text-xs font-bold">Phone:</span>
                                        <p className="font-bold text-gray-800 dark:text-white">{selectedSupplierDetails.phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 text-xs font-bold">Email:</span>
                                        <p className="font-bold text-gray-800 dark:text-white">{selectedSupplierDetails.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 text-xs font-bold">City:</span>
                                        <p className="font-bold text-gray-800 dark:text-white">{selectedSupplierDetails.city || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 text-xs font-bold">GST Number:</span>
                                        <p className="font-bold text-gray-800 dark:text-white font-mono">{selectedSupplierDetails.gstNumber || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 text-xs font-bold">Drug License:</span>
                                        <p className="font-bold text-gray-800 dark:text-white font-mono">{selectedSupplierDetails.drugLicenseNumber || 'N/A'}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <span className="text-gray-500 text-xs font-bold">Address:</span>
                                        <p className="font-bold text-gray-800 dark:text-white">{selectedSupplierDetails.address || 'N/A'}</p>
                                    </div>
                                    {selectedSupplierDetails.supplierCode && (
                                        <div>
                                            <span className="text-gray-500 text-xs font-bold">Supplier Code:</span>
                                            <p className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{selectedSupplierDetails.supplierCode}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Summary & Tax Breakup */}
                    <div className="space-y-4">
                        {/* Summary */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Summary</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Taxable Amount:</span>
                                    <span className="font-bold">₹{invoiceSummary.taxableAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">TCS Amount:</span>
                                    <span className="font-bold">₹{invoiceSummary.tcsAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">MRP Value:</span>
                                    <span className="font-bold">₹{invoiceSummary.mrpValue.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Net Amount:</span>
                                    <span className="font-bold">₹{invoiceSummary.netAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Amount After GST:</span>
                                    <span className="font-bold">₹{invoiceSummary.amountAfterGst.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Round Amount:</span>
                                    <span className="font-bold">₹{invoiceSummary.roundAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <span className="font-black text-gray-800 dark:text-white">Invoice Amount:</span>
                                    <span className="font-black text-emerald-600 text-lg">₹{invoiceSummary.invoiceAmount}</span>
                                </div>
                            </div>
                        </div>

                        {/* Tax Breakup */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Tax Breakup</h3>
                            <div className="space-y-2 text-xs">
                                {[
                                    { label: '5%', key: 'gst5' },
                                    { label: '12%', key: 'gst12' },
                                    { label: '18%', key: 'gst18' },
                                    { label: '28%', key: 'gst28' }
                                ].map(({ label, key }) => (
                                    <div key={key} className="grid grid-cols-3 gap-2">
                                        <span className="font-bold text-gray-500">{label}</span>
                                        <span className="text-right">₹{taxBreakup[key].taxable.toFixed(2)}</span>
                                        <span className="text-right font-bold">₹{taxBreakup[key].tax.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add Product Section */}
                <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={productSearch}
                                onChange={(e) => handleProductSearch(e.target.value)}
                                placeholder="Search products by name or SKU..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                            />
                            {showResults && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto z-50">
                                    {searchResults.map(product => (
                                        <div
                                            key={product._id}
                                            onClick={() => addProductToGRN(product)}
                                            className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0"
                                        >
                                            <p className="text-sm font-bold text-gray-800 dark:text-white">{product.name}</p>
                                            <p className="text-xs text-gray-500">SKU: {product.sku} | MRP: ₹{product.mrp}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowAddSkuModal(true)}
                            className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all flex items-center gap-2 active:scale-95"
                        >
                            <Plus size={18} /> Add SKU
                        </button>
                    </div>
                </div>

                {/* Items Table */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="py-3 px-3">Supplier SKU ID <span className="text-red-500">*</span></th>
                                    <th className="py-3 px-3">SKU ID <span className="text-red-500">*</span></th>
                                    <th className="py-3 px-3">Name</th>
                                    <th className="py-3 px-3">Pack <span className="text-red-500">*</span></th>
                                    <th className="py-3 px-3">Batch <span className="text-red-500">*</span></th>
                                    <th className="py-3 px-3">Expiry <span className="text-red-500">*</span></th>
                                    <th className="py-3 px-3">Mfg Date <span className="text-red-500">*</span></th>
                                    <th className="py-3 px-3">Ordered Qty <span className="text-red-500">*</span></th>
                                    <th className="py-3 px-3">Received Qty <span className="text-red-500">*</span></th>
                                    <th className="py-3 px-3">Physical Free</th>
                                    <th className="py-3 px-3">Scheme Free</th>
                                    <th className="py-3 px-3">PO Rate <span className="text-red-500">*</span></th>
                                    <th className="py-3 px-3">PTR <span className="text-red-500">*</span></th>
                                    <th className="py-3 px-3">Base Rate <span className="text-red-500">*</span></th>
                                    <th className="py-3 px-3">Scheme Disc</th>
                                    <th className="py-3 px-3">Disc %</th>
                                    <th className="py-3 px-3">Amount</th>
                                    <th className="py-3 px-3">HSN Code <span className="text-red-500">*</span></th>
                                    <th className="py-3 px-3">CGST <span className="text-red-500">*</span></th>
                                    <th className="py-3 px-3">SGST <span className="text-red-500">*</span></th>
                                    <th className="py-3 px-3">MRP <span className="text-red-500">*</span></th>
                                    <th className="py-3 px-3">Margin</th>
                                    <th className="py-3 px-3 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan="24" className="py-12 text-center text-gray-400">
                                            <Package size={48} className="mx-auto mb-2 opacity-30" />
                                            <p className="font-bold uppercase text-xs">No items added yet</p>
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                                            <td className="py-2 px-3">
                                                <input 
                                                    type="text" 
                                                    value={item.supplierSkuId} 
                                                    onChange={(e) => updateItem(index, 'supplierSkuId', e.target.value)} 
                                                    className={`w-20 px-2 py-1 border rounded text-xs ${
                                                        !item.supplierSkuId ? 'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                                                    }`}
                                                    placeholder="Required"
                                                    required
                                                />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input 
                                                    type="text" 
                                                    value={item.skuId} 
                                                    onChange={(e) => updateItem(index, 'skuId', e.target.value)} 
                                                    className={`w-20 px-2 py-1 border rounded text-xs ${
                                                        !item.skuId ? 'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                                                    }`}
                                                    placeholder="Required"
                                                    required
                                                />
                                            </td>
                                            <td className="py-2 px-3 font-bold text-gray-800 dark:text-white">{item.productName}</td>
                                            <td className="py-2 px-3">
                                                <input 
                                                    type="text" 
                                                    value={item.pack} 
                                                    onChange={(e) => updateItem(index, 'pack', e.target.value)} 
                                                    className={`w-16 px-2 py-1 border rounded text-xs ${
                                                        !item.pack ? 'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                                                    }`}
                                                    placeholder="Required"
                                                    required
                                                />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input 
                                                    type="text" 
                                                    value={item.batchNumber} 
                                                    onChange={(e) => updateItem(index, 'batchNumber', e.target.value)} 
                                                    className={`w-20 px-2 py-1 border rounded text-xs ${
                                                        !item.batchNumber ? 'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                                                    }`}
                                                    placeholder="Required"
                                                    required
                                                />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input 
                                                    type="date" 
                                                    value={item.expiryDate} 
                                                    onChange={(e) => updateItem(index, 'expiryDate', e.target.value)} 
                                                    min={new Date().toISOString().split('T')[0]}
                                                    className={`w-28 px-2 py-1 border rounded text-xs ${
                                                        !item.expiryDate ? 'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                                                    }`}
                                                    required
                                                />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input 
                                                    type="date" 
                                                    value={item.mfgDate} 
                                                    onChange={(e) => updateItem(index, 'mfgDate', e.target.value)} 
                                                    max={new Date().toISOString().split('T')[0]}
                                                    className={`w-28 px-2 py-1 border rounded text-xs ${
                                                        !item.mfgDate ? 'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                                                    }`}
                                                    required
                                                />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input 
                                                    type="number" 
                                                    value={item.orderedQty} 
                                                    onChange={(e) => updateItem(index, 'orderedQty', parseFloat(e.target.value) || 0)} 
                                                    min="1"
                                                    className={`w-16 px-2 py-1 border rounded text-xs ${
                                                        !item.orderedQty || item.orderedQty <= 0 ? 'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                                                    }`}
                                                    required
                                                />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input 
                                                    type="number" 
                                                    value={item.receivedQty} 
                                                    onChange={(e) => updateItem(index, 'receivedQty', parseFloat(e.target.value) || 0)} 
                                                    min="1"
                                                    className={`w-16 px-2 py-1 border rounded text-xs font-bold ${
                                                        !item.receivedQty || item.receivedQty <= 0 ? 'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                                                    }`}
                                                    required
                                                />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input type="number" value={item.physicalFreeQty} onChange={(e) => updateItem(index, 'physicalFreeQty', parseFloat(e.target.value) || 0)} className="w-16 px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-xs" />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input type="number" value={item.schemeFreeQty} onChange={(e) => updateItem(index, 'schemeFreeQty', parseFloat(e.target.value) || 0)} className="w-16 px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-xs" />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input 
                                                    type="number" 
                                                    value={item.poRate} 
                                                    onChange={(e) => updateItem(index, 'poRate', parseFloat(e.target.value) || 0)} 
                                                    min="0.01"
                                                    step="0.01"
                                                    className={`w-20 px-2 py-1 border rounded text-xs ${
                                                        !item.poRate || item.poRate <= 0 ? 'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                                                    }`}
                                                    required
                                                />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input 
                                                    type="number" 
                                                    value={item.ptr} 
                                                    onChange={(e) => updateItem(index, 'ptr', parseFloat(e.target.value) || 0)} 
                                                    min="0.01"
                                                    step="0.01"
                                                    className={`w-20 px-2 py-1 border rounded text-xs ${
                                                        !item.ptr || item.ptr <= 0 ? 'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                                                    }`}
                                                    required
                                                />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input 
                                                    type="number" 
                                                    value={item.baseRate} 
                                                    onChange={(e) => updateItem(index, 'baseRate', parseFloat(e.target.value) || 0)} 
                                                    min="0.01"
                                                    step="0.01"
                                                    className={`w-20 px-2 py-1 border rounded text-xs font-bold ${
                                                        !item.baseRate || item.baseRate <= 0 ? 'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                                    }`}
                                                    required
                                                />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input type="number" value={item.schemeDiscount} onChange={(e) => updateItem(index, 'schemeDiscount', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-xs" />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input type="number" value={item.discountPercent} onChange={(e) => updateItem(index, 'discountPercent', parseFloat(e.target.value) || 0)} className="w-16 px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-xs" />
                                            </td>
                                            <td className="py-2 px-3 font-bold text-emerald-600">{item.amount.toFixed(2)}</td>
                                            <td className="py-2 px-3">
                                                <input 
                                                    type="text" 
                                                    value={item.hsnCode} 
                                                    onChange={(e) => updateItem(index, 'hsnCode', e.target.value)} 
                                                    className={`w-20 px-2 py-1 border rounded text-xs ${
                                                        !item.hsnCode ? 'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                                                    }`}
                                                    placeholder="Required"
                                                    required
                                                />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input 
                                                    type="number" 
                                                    value={item.cgst} 
                                                    onChange={(e) => updateItem(index, 'cgst', parseFloat(e.target.value) || 0)} 
                                                    min="0"
                                                    step="0.01"
                                                    className={`w-16 px-2 py-1 border rounded text-xs ${
                                                        item.cgst === undefined || item.cgst === null || item.cgst < 0 ? 'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                                                    }`}
                                                    required
                                                />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input 
                                                    type="number" 
                                                    value={item.sgst} 
                                                    onChange={(e) => updateItem(index, 'sgst', parseFloat(e.target.value) || 0)} 
                                                    min="0"
                                                    step="0.01"
                                                    className={`w-16 px-2 py-1 border rounded text-xs ${
                                                        item.sgst === undefined || item.sgst === null || item.sgst < 0 ? 'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                                                    }`}
                                                    required
                                                />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input 
                                                    type="number" 
                                                    value={item.mrp} 
                                                    onChange={(e) => updateItem(index, 'mrp', parseFloat(e.target.value) || 0)} 
                                                    min="0.01"
                                                    step="0.01"
                                                    className={`w-20 px-2 py-1 border rounded text-xs ${
                                                        !item.mrp || item.mrp <= 0 ? 'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                                                    }`}
                                                    required
                                                />
                                            </td>
                                            <td className="py-2 px-3 text-gray-500">{item.margin}%</td>
                                            <td className="py-2 px-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                {/* Submit Button */}
                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/inventory/grn')}
                        className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save size={18} />
                        {loading ? 'Saving...' : 'Save GRN'}
                    </button>
                </div>
            </form>

            {/* Add SKU Modal - Using Portal to render outside component tree */}
            {showAddSkuModal && ReactDOM.createPortal(
                <div className="fixed inset-0 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in" style={{ zIndex: 999999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-4xl rounded-2xl shadow-2xl transform transition-all animate-scale-up border border-white/20 dark:border-gray-700 flex flex-col max-h-[85vh]">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/20 rounded-t-2xl">
                            <div>
                                <h3 className="font-black text-gray-800 dark:text-white text-lg uppercase tracking-tight">Add Products to GRN</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Select products to add to your purchase order</p>
                            </div>
                            <button onClick={() => { setShowAddSkuModal(false); setModalSearchTerm(''); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 rounded-full bg-white dark:bg-gray-700 shadow-sm hover:shadow-md">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={modalSearchTerm}
                                    onChange={(e) => setModalSearchTerm(e.target.value)}
                                    placeholder="Search products by name or SKU..."
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {products
                                    .filter(p => 
                                        modalSearchTerm === '' || 
                                        p.name.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
                                        p.sku?.toLowerCase().includes(modalSearchTerm.toLowerCase())
                                    )
                                    .map(product => (
                                        <div
                                            key={product._id}
                                            onClick={() => {
                                                addProductToGRN(product);
                                                setShowAddSkuModal(false);
                                                setModalSearchTerm('');
                                            }}
                                            className="p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300 dark:hover:border-emerald-700 cursor-pointer transition-all group"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="text-sm font-black text-gray-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{product.name}</h4>
                                                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded uppercase">
                                                    {product.category?.name || 'N/A'}
                                                </span>
                                            </div>
                                            <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                                                <p><span className="font-bold">SKU:</span> {product.sku || 'N/A'}</p>
                                                <p><span className="font-bold">MRP:</span> ₹{product.mrp || 0}</p>
                                                <p><span className="font-bold">Stock:</span> {product.quantity || 0} units</p>
                                            </div>
                                        </div>
                                    ))}
                                {products.filter(p => 
                                    modalSearchTerm === '' || 
                                    p.name.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
                                    p.sku?.toLowerCase().includes(modalSearchTerm.toLowerCase())
                                ).length === 0 && (
                                    <div className="col-span-2 py-12 text-center text-gray-400">
                                        <Package size={48} className="mx-auto mb-2 opacity-30" />
                                        <p className="font-bold uppercase text-xs">No products found</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end bg-gray-50/50 dark:bg-gray-700/50 rounded-b-2xl">
                            <button
                                onClick={() => { setShowAddSkuModal(false); setModalSearchTerm(''); }}
                                className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold hover:bg-white dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 text-sm transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default AddGRN;
