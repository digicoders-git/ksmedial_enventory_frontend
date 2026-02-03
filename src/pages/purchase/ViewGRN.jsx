import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Calendar, FileText, 
    User, Truck, Package, CheckCircle, Download 
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../api/axios';

const ViewGRN = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [purchase, setPurchase] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPurchase = async () => {
             try {
                 const { data } = await api.get(`/purchases/${id}`);
                 if (data.success) {
                     setPurchase(data.purchase);
                 }
             } catch (err) {
                 console.error("Failed to load GRN", err);
             } finally {
                 setLoading(false);
             }
        };
        fetchPurchase();
    }, [id]);

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!purchase) return <div className="p-8 text-center">GRN not found</div>;

    const exportToPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // Header
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('GOODS RECEIPT NOTE', pageWidth / 2, 20, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Purchase Receive Order', pageWidth / 2, 27, { align: 'center' });
        
        // Invoice Number and Date (Right side)
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(purchase.invoiceNumber || 'N/A', pageWidth - 15, 20, { align: 'right' });
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const invoiceDate = purchase.invoiceDate || purchase.purchaseDate;
        doc.text(`Date: ${invoiceDate ? new Date(invoiceDate).toLocaleDateString('en-IN') : 'N/A'}`, pageWidth - 15, 27, { align: 'right' });
        
        // Horizontal line
        doc.setDrawColor(200);
        doc.line(15, 33, pageWidth - 15, 33);
        
        // Supplier Details (Left)
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('SUPPLIER DETAILS', 15, 42);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(purchase.supplierId?.name || 'N/A', 15, 49);
        
        const address = purchase.supplierId?.address || 'N/A';
        const splitAddress = doc.splitTextToSize(address, 80);
        doc.text(splitAddress, 15, 55);
        
        const addressHeight = splitAddress.length * 5;
        doc.text(`GST: ${purchase.supplierId?.gstNumber || 'N/A'}`, 15, 55 + addressHeight);
        doc.text(`Phone: ${purchase.supplierId?.phone || 'N/A'}`, 15, 60 + addressHeight);
        
        // Invoice Summary (Right)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('INVOICE SUMMARY', pageWidth - 75, 42);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const summary = purchase.invoiceSummary || {};
        
        let summaryY = 49;
        doc.text(`Taxable Amount:`, pageWidth - 75, summaryY);
        doc.text(`Rs ${(summary.taxableAmount || 0).toFixed(2)}`, pageWidth - 15, summaryY, { align: 'right' });
        
        summaryY += 6;
        doc.text(`MRP Value:`, pageWidth - 75, summaryY);
        doc.text(`Rs ${(summary.mrpValue || 0).toFixed(2)}`, pageWidth - 15, summaryY, { align: 'right' });
        
        summaryY += 6;
        doc.text(`Amount After GST:`, pageWidth - 75, summaryY);
        doc.text(`Rs ${(summary.amountAfterGst || 0).toFixed(2)}`, pageWidth - 15, summaryY, { align: 'right' });
        
        summaryY += 6;
        doc.text(`Round Amount:`, pageWidth - 75, summaryY);
        doc.text(`Rs ${(summary.roundAmount || 0).toFixed(2)}`, pageWidth - 15, summaryY, { align: 'right' });
        
        summaryY += 8;
        doc.setFont('helvetica', 'bold');
        doc.text(`Invoice Amount:`, pageWidth - 75, summaryY);
        doc.text(`Rs ${(summary.invoiceAmount || purchase.grandTotal || 0).toFixed(2)}`, pageWidth - 15, summaryY, { align: 'right' });
        
        // Items Table
        const tableStartY = Math.max(70 + addressHeight, summaryY + 10);
        
        const tableColumn = ["#", "Product", "SKU", "Batch", "Expiry", "Qty", "Free", "Rate", "MRP", "Amount"];
        const tableRows = purchase.items.map((item, index) => {
            const totalFree = (item.physicalFreeQty || 0) + (item.schemeFreeQty || 0);
            return [
                index + 1,
                item.productName || item.productId?.name || 'N/A',
                item.skuId || item.productId?.sku || '-',
                item.batchNumber || '-',
                item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-IN') : '-',
                item.receivedQty || item.quantity || 0,
                totalFree || '-',
                `Rs ${(item.baseRate || item.purchasePrice || 0).toFixed(2)}`,
                `Rs ${(item.mrp || 0).toFixed(2)}`,
                `Rs ${(item.amount || 0).toFixed(2)}`
            ];
        });
        
        autoTable(doc, {
            startY: tableStartY,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            headStyles: { 
                fillColor: [16, 185, 129], 
                textColor: [255, 255, 255],
                fontSize: 8,
                fontStyle: 'bold',
                halign: 'center'
            },
            bodyStyles: { 
                fontSize: 8,
                cellPadding: 2
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 8 },
                1: { halign: 'left', cellWidth: 35 },
                2: { halign: 'left', cellWidth: 20 },
                3: { halign: 'center', cellWidth: 18 },
                4: { halign: 'center', cellWidth: 20 },
                5: { halign: 'center', cellWidth: 12 },
                6: { halign: 'center', cellWidth: 12 },
                7: { halign: 'right', cellWidth: 20 },
                8: { halign: 'right', cellWidth: 20 },
                9: { halign: 'right', cellWidth: 25 }
            },
            margin: { left: 15, right: 15 }
        });
        
        const finalY = doc.lastAutoTable.finalY + 10;
        
        // Tax Breakup
        if (purchase.taxBreakup) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text('TAX BREAKUP', 15, finalY);
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            let yPos = finalY + 7;
            
            const taxEntries = [
                { label: 'GST 5%', key: 'gst5' },
                { label: 'GST 12%', key: 'gst12' },
                { label: 'GST 18%', key: 'gst18' },
                { label: 'GST 28%', key: 'gst28' }
            ];
            
            taxEntries.forEach(({ label, key }) => {
                const taxData = purchase.taxBreakup[key];
                if (taxData && taxData.taxable > 0) {
                    doc.text(`${label}:`, 15, yPos);
                    doc.text(`Taxable: Rs ${taxData.taxable.toFixed(2)}`, 50, yPos);
                    doc.text(`Tax: Rs ${taxData.tax.toFixed(2)}`, 100, yPos);
                    yPos += 5;
                }
            });
        }
        
        // Footer
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100);
        doc.text('This is a computer generated document.', pageWidth / 2, pageHeight - 15, { align: 'center' });
        doc.text(`Status: ${purchase.status || 'N/A'} | Payment: ${purchase.paymentStatus || 'N/A'}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        
        doc.save(`GRN_${purchase.invoiceNumber}.pdf`);
    };

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-6">
            {/* Header / Actions */}
            <div className="flex justify-between items-center print:hidden">
                <button 
                    onClick={() => navigate('/purchase/grn')}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 transition-all"
                >
                    <ArrowLeft size={18} />
                    Back to List
                </button>
                <div className="flex gap-3">
                    <button 
                        onClick={exportToPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
                    >
                        <Download size={18} />
                        Export
                    </button>
                </div>
            </div>

            {/* GRN Document */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden print:shadow-none print:border-0">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-8 print:bg-gray-100 print:text-black">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tight">Goods Receipt Note</h1>
                            <p className="mt-2 text-emerald-100 print:text-gray-600 font-medium">Purchase Receive Order</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-2xl font-mono font-black">{purchase.invoiceNumber}</h2>
                            <div className="mt-2 text-emerald-100 print:text-gray-600 text-sm font-bold">
                                Date: {new Date(purchase.invoiceDate || purchase.purchaseDate).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Section: Supplier + Summary */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 p-8 border-b border-gray-100 dark:border-gray-700">
                    {/* Supplier Details */}
                    <div className="xl:col-span-2">
                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Supplier Details</h3>
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                            <p className="text-lg font-black text-gray-800 dark:text-white uppercase">{purchase.supplierId?.name || 'Unknown Supplier'}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{purchase.supplierId?.address}</p>
                            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                                <div>
                                    <span className="text-gray-500">GST:</span>
                                    <span className="ml-2 font-bold text-gray-800 dark:text-white">{purchase.supplierId?.gstNumber || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Phone:</span>
                                    <span className="ml-2 font-bold text-gray-800 dark:text-white">{purchase.supplierId?.phone}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Invoice Summary */}
                    <div>
                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Invoice Summary</h3>
                        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-xl border border-emerald-100 dark:border-emerald-800">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Taxable Amount:</span>
                                    <span className="font-bold">₹{purchase.invoiceSummary?.taxableAmount?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">MRP Value:</span>
                                    <span className="font-bold">₹{purchase.invoiceSummary?.mrpValue?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Amount After GST:</span>
                                    <span className="font-bold">₹{purchase.invoiceSummary?.amountAfterGst?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Round Amount:</span>
                                    <span className="font-bold">₹{purchase.invoiceSummary?.roundAmount?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-emerald-200 dark:border-emerald-800">
                                    <span className="font-black text-gray-800 dark:text-white">Invoice Amount:</span>
                                    <span className="font-black text-emerald-600 text-lg">₹{purchase.invoiceSummary?.invoiceAmount || purchase.grandTotal}</span>
                                </div>
                            </div>
                        </div>

                        {/* Tax Breakup */}
                        <div className="mt-4 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                            <h4 className="text-xs font-black text-gray-500 uppercase mb-3">Tax Breakup</h4>
                            <div className="space-y-1.5 text-xs">
                                {[
                                    { label: '5%', key: 'gst5' },
                                    { label: '12%', key: 'gst12' },
                                    { label: '18%', key: 'gst18' },
                                    { label: '28%', key: 'gst28' }
                                ].map(({ label, key }) => (
                                    purchase.taxBreakup?.[key]?.tax > 0 && (
                                        <div key={key} className="grid grid-cols-3 gap-2">
                                            <span className="font-bold text-gray-600">{label}</span>
                                            <span className="text-right text-gray-600">₹{purchase.taxBreakup[key].taxable?.toFixed(2)}</span>
                                            <span className="text-right font-bold text-blue-600">₹{purchase.taxBreakup[key].tax?.toFixed(2)}</span>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="p-8">
                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Received Items</h3>
                    <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black uppercase tracking-wider">
                                <tr>
                                    <th className="py-4 px-4 text-center">#</th>
                                    <th className="py-4 px-4 min-w-[200px]">Product Name</th>
                                    <th className="py-4 px-4 min-w-[120px]">SKU</th>
                                    <th className="py-4 px-4 min-w-[100px]">Batch</th>
                                    <th className="py-4 px-4 min-w-[100px]">Expiry</th>
                                    <th className="py-4 px-4 text-center min-w-[80px]">Received</th>
                                    <th className="py-4 px-4 text-center min-w-[80px]">Free Qty</th>
                                    <th className="py-4 px-4 text-right min-w-[100px]">Base Rate</th>
                                    <th className="py-4 px-4 text-right min-w-[100px]">Amount</th>
                                    <th className="py-4 px-4 text-center min-w-[60px]">GST</th>
                                    <th className="py-4 px-4 text-right min-w-[100px]">MRP</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                                {purchase.items?.map((item, index) => {
                                    const totalFree = (item.physicalFreeQty || 0) + (item.schemeFreeQty || 0);
                                    const totalGst = (item.cgst || 0) + (item.sgst || 0) + (item.igst || 0);
                                    return (
                                        <tr key={index} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors">
                                            <td className="py-4 px-4 text-center text-gray-500 font-bold">{index + 1}</td>
                                            <td className="py-4 px-4 font-bold text-gray-900 dark:text-white">
                                                {item.productName || item.productId?.name || 'N/A'}
                                            </td>
                                            <td className="py-4 px-4 text-gray-600 dark:text-gray-400 font-mono text-xs">
                                                {item.skuId || item.productId?.sku || 'N/A'}
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="text-gray-900 dark:text-white font-mono text-xs bg-gray-100 dark:bg-gray-700 inline-block px-3 py-1 rounded-lg font-bold">
                                                    {item.batchNumber || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-gray-600 dark:text-gray-400 text-xs">
                                                {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-IN') : 'N/A'}
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">
                                                    {item.receivedQty || item.quantity || 0}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <span className="font-bold text-blue-600 dark:text-blue-400">
                                                    {totalFree > 0 ? totalFree : '-'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-right font-bold text-gray-900 dark:text-white">
                                                ₹{(item.baseRate || item.purchasePrice || 0).toFixed(2)}
                                            </td>
                                            <td className="py-4 px-4 text-right font-black text-gray-900 dark:text-white text-base">
                                                ₹{(item.amount || 0).toFixed(2)}
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-lg font-black text-xs">
                                                    {totalGst}%
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-right font-bold text-purple-600 dark:text-purple-400">
                                                ₹{(item.mrp || 0).toFixed(2)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Notes */}
                {purchase.notes && (
                    <div className="p-8 pt-0 border-t border-gray-100 dark:border-gray-700">
                        <h4 className="text-xs font-black text-gray-500 uppercase mb-3">Remarks:</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                            {purchase.notes}
                        </p>
                    </div>
                )}

                {/* Status Footer */}
                <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <CheckCircle size={20} className="text-emerald-500" />
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Status:</span>
                        <span className="px-3 py-1 rounded-lg text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-black uppercase border border-emerald-200 dark:border-emerald-800">
                            {purchase.status}
                        </span>
                    </div>
                    <div className="text-sm text-gray-500">
                        Payment: <span className="font-bold text-gray-700 dark:text-gray-300">{purchase.paymentStatus}</span>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    
                    .max-w-7xl, .max-w-7xl * {
                        visibility: visible;
                    }
                    
                    .max-w-7xl {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        max-width: 100%;
                        margin: 0;
                        padding: 0;
                    }
                    
                    @page {
                        size: auto;
                        margin: 10mm;
                    }
                    
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default ViewGRN;
