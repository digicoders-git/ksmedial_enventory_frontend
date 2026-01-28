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
                    rate: p.sellingPrice || 0,
                    category: p.category,
                    batch: p.batchNumber,
                    sku: p.sku,
                    exp: (p.expiryDate && !isNaN(new Date(p.expiryDate).getTime())) ? new Date(p.expiryDate).toISOString().split('T')[0] : '',
                    reorderLevel: p.reorderLevel || 10,
                    brand: p.brand || 'Generic' 
                }));
                setInventory(mapped);
            }
        } catch (error) {
            console.error("Error fetching inventory:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    // Derived statistics
    const totalProducts = inventory.length;
    const totalStockValue = inventory.reduce((acc, item) => acc + (item.stock * item.rate), 0);
    const totalStockUnits = inventory.reduce((acc, item) => acc + item.stock, 0);
    const lowStockItems = inventory.filter(item => item.stock > 0 && item.stock <= (item.reorderLevel || 20)).length;
    const outOfStockItems = inventory.filter(item => item.stock === 0).length;
    
    // Function to sell items
    const sellItems = async (soldItems, metadata = {}) => {
        try {
            const saleItemsPayload = soldItems.map(s => {
                const product = inventory.find(p => p.id === s.id);
                if (!product) throw new Error(`Product ${s.name || s.id} not found`);
                return {
                    productId: s.id,
                    name: product.name,
                    quantity: s.qty,
                    price: product.rate,
                    subtotal: s.qty * product.rate
                };
            });

            const totalAmount = saleItemsPayload.reduce((acc, item) => acc + item.subtotal, 0);

            const payload = {
                items: saleItemsPayload,
                totalAmount,
                subTotal: totalAmount, // Assuming no tax/discount logic in frontend for now, or calculate if needed
                amountPaid: totalAmount,
                customer: metadata.customer || 'Walk-in',
                paymentMethod: metadata.paymentMode || 'Cash',
            };

            const { data } = await api.post('/sales', payload);

            if (data.success) {
                await fetchInventory(); // Refresh stock
                
                // Add to local transactions list for UI responsiveness if needed (or fetch transactions)
                 const newTransaction = {
                    id: data.sale._id,
                    type: 'OUT',
                    ...metadata,
                    items: saleItemsPayload.map(s => ({
                         ...s,
                         batch: inventory.find(i=>i.id===s.productId)?.batch,
                         sku: inventory.find(i=>i.id===s.productId)?.sku,
                         category: inventory.find(i=>i.id===s.productId)?.category
                    })),
                    date: new Date(),
                    totalQty: soldItems.reduce((acc, s) => acc + s.qty, 0)
                };
                setTransactions([newTransaction, ...transactions]);

                return { success: true, message: "Sale processed successfully! Inventory updated." };
            } else {
                return { success: false, message: data.message || "Sale failed" };
            }
        } catch (error) {
            console.error(error);
            return { success: false, message: error.response?.data?.message || error.message };
        }
    };

    const adjustStock = async (id, type, quantity, reason) => {
        try {
            // Use specific endpoint if available, else update product
             const { data } = await api.put(`/products/${id}/adjust`, {
                 type,
                 quantity,
                 reason
             });

             if(data.success) {
                 await fetchInventory();
                 return { success: true, message: "Stock adjusted successfully" };
             }
             return { success: false, message: data.message };

        } catch (error) {
             return { success: false, message: error.response?.data?.message || error.message };
        }
    };

    const [suppliers, setSuppliers] = useState([
        { id: 1, name: "Health Distributors", contact: "9876543210", email: "info@healthdist.com", status: "Active" },
        { id: 2, name: "Pharma World Ltd", contact: "9123456780", email: "sales@pharmaworld.com", status: "Active" },
    ]);

    const addSupplier = (supplier) => {
        // Implement API call for supplier
        setSuppliers([...suppliers, { ...supplier, id: Date.now() }]);
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

    const updateThreshold = async (id, newThreshold) => {
         // Need API update
         try {
             const { data } = await api.put(`/products/${id}`, { reorderLevel: newThreshold });
             if(data.success) {
                 await fetchInventory();
                 return { success: true, message: "Reorder level updated" };
             }
             return { false: true, message: "Update failed" };
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
            deleteItem,
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
            loading
        }}>
            {children}
        </InventoryContext.Provider>
    );
};
