import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const InventoryContext = createContext();

export const useInventory = () => useContext(InventoryContext);

export const InventoryProvider = ({ children }) => {
    const [inventory, setInventory] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchInventory = async () => {
        try {
            const { data } = await api.get('/products');
            if (data.success) {
                const mapped = data.products.map(p => ({
                    id: p._id,
                    name: p.name,
                    stock: p.quantity || 0,
                    rate: p.sellingPrice || 0, // Keeping for backward compatibility
                    mrp: p.sellingPrice || 0,
                    purchasePrice: p.purchasePrice || 0,
                    category: p.category,
                    batch: p.batchNumber,
                    sku: p.sku,
                    exp: (p.expiryDate && !isNaN(new Date(p.expiryDate).getTime())) ? new Date(p.expiryDate).toISOString().split('T')[0] : '',
                    reorderLevel: p.reorderLevel || 10,
                    brand: p.brand || 'Generic',
                    company: p.company || 'N/A',
                    generic: p.genericName || 'N/A',
                    unit: p.unit || 'Pc',
                    status: p.status || 'Active',
                    image: p.image || null,
                    packing: p.packing || '',
                    hsnCode: p.hsnCode || '',
                    tax: p.tax || 0,
                    description: p.description || '',
                    isPrescriptionRequired: p.isPrescriptionRequired || false,
                    rackLocation: p.rackLocation || '',
                    createdAt: p.createdAt
                }));
                setInventory(mapped);
            }
        } catch (error) {
            console.error("Error fetching inventory:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactions = async () => {
         try {
             // Fetch data from multiple sources for a unified history
             const [salesRes, logsRes, purchaseRes, saleReturnRes, purchaseReturnRes] = await Promise.all([
                 api.get('/sales?limit=50'),
                 api.get('/products/logs'),
                 api.get('/purchases?pageSize=50'),
                 api.get('/sales/returns?limit=50'),
                 api.get('/purchase-returns?pageSize=50')
             ]);

             let allTransactions = [];

             // 1. Sales (OUT)
             if (salesRes.data.success) {
                  const mappedSales = salesRes.data.sales.map(s => ({
                      id: s._id,
                      type: 'OUT',
                      source: 'SALE',
                      reason: 'Sale', 
                      reference: s.invoiceNumber,
                      paymentMode: s.paymentMethod,
                      date: s.createdAt,
                      totalQty: s.items.reduce((acc, i) => acc + i.quantity, 0),
                      items: s.items.map(i => ({
                          name: i.name,
                          qty: i.quantity,
                          price: i.price, 
                          batch: i.productId?.batchNumber || 'N/A', 
                          sku: i.productId?.sku || 'N/A'
                      })),
                      totalAmount: s.totalAmount
                  }));
                  allTransactions = [...allTransactions, ...mappedSales];
             }

             // 2. Inventory Logs (Manual IN/OUT)
             if (logsRes.data.success) {
                 const mappedLogs = logsRes.data.logs.map(l => ({
                     id: l._id,
                     type: l.type,
                     source: 'ADJUSTMENT',
                     reason: l.reason,
                     note: l.note,
                     date: l.date,
                     totalQty: l.quantity,
                     items: [{
                         name: l.productName || 'Unknown Product',
                         qty: l.quantity,
                         batch: l.batchNumber || 'N/A',
                         sku: 'N/A'
                     }]
                 }));
                 allTransactions = [...allTransactions, ...mappedLogs];
             }

             // 3. Purchases (IN)
             if (purchaseRes.data.success) {
                 const mappedPurchases = purchaseRes.data.purchases.map(p => ({
                     id: p._id,
                     type: 'IN',
                     source: 'PURCHASE',
                     reason: 'Purchase',
                     reference: p.invoiceNumber,
                     date: p.purchaseDate || p.createdAt,
                     totalQty: p.items.reduce((acc, i) => acc + i.quantity, 0),
                     items: p.items.map(i => ({
                         name: i.name || 'Product',
                         qty: i.quantity,
                         price: i.purchasePrice,
                         batch: i.batchNumber || 'N/A',
                         sku: 'N/A'
                     })),
                     totalAmount: p.grandTotal
                 }));
                 allTransactions = [...allTransactions, ...mappedPurchases];
             }

             // 4. Sales Returns (IN)
             if (saleReturnRes.data.success) {
                 const mappedSaleReturns = saleReturnRes.data.returns.map(r => ({
                     id: r._id,
                     type: 'IN',
                     source: 'SALE_RETURN',
                     reason: 'Sale Return',
                     reference: r.returnNumber,
                     date: r.createdAt,
                     totalQty: r.items.reduce((acc, i) => acc + i.quantity, 0),
                     items: r.items.map(i => ({
                         name: i.name || 'Product',
                         qty: i.quantity,
                         price: i.price || 0,
                         batch: i.batchNumber || 'N/A',
                         sku: 'N/A'
                     })),
                     totalAmount: r.totalAmount
                 }));
                 allTransactions = [...allTransactions, ...mappedSaleReturns];
             }

             // 5. Purchase Returns (OUT)
             if (purchaseReturnRes.data.success) {
                 const mappedPurchaseReturns = purchaseReturnRes.data.returns.map(r => ({
                     id: r._id,
                     type: 'OUT',
                     source: 'PURCHASE_RETURN',
                     reason: 'Purchase Return',
                     reference: r.returnNumber,
                     date: r.createdAt,
                     totalQty: r.items.reduce((acc, i) => acc + (i.returnQuantity || i.quantity), 0),
                     items: r.items.map(i => ({
                         name: i.productId?.name || 'Product',
                         qty: i.returnQuantity || i.quantity,
                         price: i.purchasePrice || 0,
                         batch: 'N/A',
                         sku: 'N/A'
                     })),
                     totalAmount: r.totalAmount
                 }));
                 allTransactions = [...allTransactions, ...mappedPurchaseReturns];
             }

             // Sort by date desc
             allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

             setTransactions(allTransactions);
         } catch (error) {
             console.error("Error fetching unified transactions:", error);
         }
    };

    useEffect(() => {
        fetchInventory();
        fetchTransactions();
        fetchSuppliers();
    }, []);

    // Derived statistics
    const totalProducts = inventory.length;
    const totalStockValue = inventory.reduce((acc, item) => acc + (item.stock * item.rate), 0);
    const totalStockUnits = inventory.reduce((acc, item) => acc + item.stock, 0);
    const lowStockItems = inventory.filter(item => item.stock > 0 && item.stock <= (item.reorderLevel || 20)).length;
    const outOfStockItems = inventory.filter(item => item.stock === 0).length;
    
    // Function to sell items (Create or Update)
    const sellItems = async (soldItems, metadata = {}, saleId = null) => {
        try {
            const saleItemsPayload = soldItems.map(s => {
                const product = inventory.find(p => p.id === s.id);
                if (!product) throw new Error(`Product mapping failed`);
                return {
                    productId: s.id,
                    name: product.name,
                    quantity: s.qty,
                    price: product.rate,
                    tax: product.tax || 18,
                    subtotal: s.qty * product.rate
                };
            });

            const payload = {
                items: saleItemsPayload,
                totalAmount: metadata.totalAmount, 
                subTotal: metadata.subTotal,
                tax: metadata.tax,
                discount: metadata.discount || 0,
                amountPaid: metadata.totalAmount,
                customer: metadata.customer?._id || metadata.customer,
                customerName: typeof metadata.customer === 'string' ? metadata.customer : metadata.customer?.name,
                paymentMethod: metadata.paymentMode || 'Cash',
                status: metadata.status || (metadata.paymentMode === 'Credit' ? 'Pending' : 'Paid'),
            };

            const response = saleId 
                ? await api.put(`/sales/${saleId}`, payload)
                : await api.post('/sales', payload);

            const { data } = response;

            if (data.success) {
                await fetchInventory(); // Refresh stock
                await fetchTransactions(); // Refresh history
                
                return { 
                    success: true, 
                    message: saleId ? "Invoice updated successfully!" : "Sale processed successfully!",
                    sale: data.sale,
                    saleId: data.sale?._id // Return the ID for viewing
                };
            } else {
                return { success: false, message: data.message || "Operation failed" };
            }
        } catch (error) {
            console.error(error);
            return { success: false, message: error.response?.data?.message || error.message };
        }
    };

    const adjustStock = async (id, type, quantity, reason, note) => {
        try {
             const { data } = await api.put(`/products/${id}/adjust`, {
                 type,
                 quantity,
                 reason,
                 note
             });

             if(data.success) {
                 await fetchInventory();
                 
                 // Update transactions with new log
                 if(data.log) {
                     const newLog = {
                         id: data.log._id,
                         type: data.log.type,
                         reason: data.log.reason,
                         note: data.log.note,
                         date: data.log.date,
                         totalQty: data.log.quantity,
                         items: [{
                             name: data.log.productName,
                             qty: data.log.quantity,
                             batch: data.log.batchNumber,
                             sku: 'N/A'
                         }]
                     };
                     setTransactions(prev => [newLog, ...prev]);
                 }

                 return { success: true, message: "Stock adjusted successfully" };
             }
             return { success: false, message: data.message };

        } catch (error) {
             return { success: false, message: error.response?.data?.message || error.message };
        }
    };

    const bulkAdjustStock = async (items, type, reason, note) => {
        try {
            const results = await Promise.all(items.map(item => 
                api.put(`/products/${item.id}/adjust`, {
                    type,
                    quantity: item.qty || item.quantity,
                    reason,
                    note
                })
            ));

            const allSuccess = results.every(r => r.data.success);
            if (allSuccess) {
                await fetchInventory();
                await fetchTransactions();
                const firstLogId = results[0]?.data?.log?._id;
                return { success: true, message: "Bulk stock adjustment completed", logId: firstLogId };
            }
            return { success: false, message: "Some adjustments failed" };
        } catch (error) {
            console.error("Bulk adjust error:", error);
            return { success: false, message: error.response?.data?.message || error.message };
        }
    };

    const [suppliers, setSuppliers] = useState([]);

    const fetchSuppliers = async () => {
        try {
            const { data } = await api.get('/suppliers');
            if (data.success) {
                setSuppliers(data.suppliers.map(s => ({
                    ...s,
                    id: s._id
                })));
            }
        } catch (error) {
            console.error("Error fetching suppliers:", error);
        }
    };

    const addSupplier = async (supplier) => {
        try {
            const { data } = await api.post('/suppliers', supplier);
            if (data.success) {
                fetchSuppliers();
                return { success: true, message: 'Supplier added successfully' };
            }
            return { success: false, message: data.message };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Failed to add supplier' };
        }
    };

    const deleteItem = async (id) => {
        try {
            const { data } = await api.delete(`/products/${id}`);
            if(data.success) {
                await fetchInventory();
                return { success: true, message: "Item deleted" };
            }
            return { success: false, message: data.message };
        } catch(error) {
            return { success: false, message: error.response?.data?.message || "Delete failed" };
        }
    };

    const deleteTransaction = async (id) => {
        try {
            const { data } = await api.delete(`/sales/${id}`);
            if (data.success) {
                // If we want to restore stock, backend should handle it.
                // Assuming backend restore logic is in place or user just wants to remove record.
                await fetchTransactions(); // Refresh history
                await fetchInventory(); // Refresh stock as restore happened
                return { success: true, message: "Transaction deleted" };
            }
            return { success: false, message: data.message };
        } catch (error) {
             return { success: false, message: error.response?.data?.message || "Delete failed" };
        }
    };

    const clearAllTransactions = async () => {
        try {
            const { data } = await api.delete('/sales');
            if (data.success) {
                await fetchTransactions();
                await fetchInventory();
                return { success: true, message: "All transactions cleared" };
            }
            return { success: false, message: data.message };
        } catch (error) {
             return { success: false, message: error.response?.data?.message || "Clear invalid" };
        }
    };

    const updateThreshold = async (id, newThreshold) => {
         // Need API update
         try {
             const { data } = await api.put(`/products/${id}`, { reorderLevel: newThreshold });
             if(data.success) {
                 await fetchInventory();
                 return { success: true, message: "Reorder level updated" };
             }
             return { success: false, message: "Update failed" };
         } catch(error) {
             console.error("Update threshold error:", error);
             return { success: false, message: "Update failed" };
         }
    };

    const addMedicine = async (medicine) => {
      try {
           const payload = {
               name: medicine.name,
               purchasePrice: medicine.purchasePrice,
               sellingPrice: medicine.sellingPrice || medicine.mrp, // Map fields
               quantity: medicine.openingStock || 0,
               category: medicine.group,
               sku: medicine.barcode,
               batchNumber: medicine.batch, // If provided
               reorderLevel: medicine.minStock,
               expiryDate: medicine.expiryDate // Ensure format
           };
           const { data } = await api.post('/products', payload);
           if(data.success) {
               await fetchInventory();
               return { success: true, message: "Medicine Master created" };
           }
           return { success: false, message: data.message };
      } catch (error) {
           return { success: false, message: error.response?.data?.message || error.message };
      }
    };

    const generateSKU = () => {
        return 'SKU-' + Math.floor(10000 + Math.random() * 90000);
    };

    return (
        <InventoryContext.Provider value={{ 
            inventory, 
            sellItems,
            adjustStock,
            bulkAdjustStock,
            deleteItem,
            deleteTransaction,
            clearAllTransactions,
            transactions,
            suppliers,
            addSupplier,
            addMedicine,
            stats: { 
                totalProducts, 
                totalStockValue, 
                totalStockUnits,
                lowStockItems, 
                outOfStockItems 
            },
            updateThreshold,
            generateSKU,
            loading,
            fetchInventory
        }}>
            {children}
        </InventoryContext.Provider>
    );
};
