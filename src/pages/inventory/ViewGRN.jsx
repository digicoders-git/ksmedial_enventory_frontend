import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Download, CheckCircle 
} from 'lucide-react';
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

    // Generate comprehensive QR Data
    const qrData = purchase ? `
GRN No: ${purchase.invoiceNumber}
Date: ${new Date(purchase.invoiceDate || purchase.purchaseDate).toLocaleDateString('en-IN')}
Supplier: ${purchase.supplierId?.name || 'N/A'}
PO No: ${purchase.poNumber || 'N/A'}
Inv No: ${purchase.externalInvoiceNumber || purchase.invoiceNumber}
Total Amount: ₹${purchase.grandTotal?.toFixed(2)}
Items: ${purchase.items?.length || 0}
Status: ${purchase.status}
    `.trim() : '';

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="max-w-5xl mx-auto pb-20 space-y-6">
            {/* Header / Actions - Hidden in Print */}
            <div className="flex justify-between items-center print:hidden">
                <button 
                    onClick={() => navigate('/purchase/grn-list')}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 transition-all font-medium"
                >
                    <ArrowLeft size={18} />
                    Back to List
                </button>
                <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-secondary shadow-lg shadow-primary/20 transition-all"
                >
                    <Download size={18} />
                    Print / Download PDF
                </button>
            </div>

            {/* GRN Document */}
            {/* Added 'w-full' and removed max-width constraints for print */}
            <div className="bg-white text-gray-800 shadow-xl print:shadow-none print:w-[100%] print:max-w-full p-8 md:p-12 font-sans box-border" id="grn-document">
                
                {/* 1. Header Title */}
                <div className="text-center border-b-2 border-primary/20 pb-4 mb-6">
                    <h1 className="text-2xl md:text-3xl font-black text-primary uppercase tracking-wide">Goods Receipt Note (GRN)</h1>
                </div>

                {/* 2. Company & GRN Meta */}
                <div className="flex flex-col md:flex-row print:flex-row justify-between gap-6 mb-8">
                    {/* Company Info */}
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">KS4 PharmaNet Ltd.</h2>
                        <div className="text-sm text-gray-600 space-y-1">
                            <p>123, Pharma Tech Park, Industrial Area</p>
                            <p>New Delhi - 110020</p>
                            <p>Phone: +91-9876543210 | Email: support@ks4pharmanet.com</p>
                            <p className="font-semibold mt-2">GSTIN: 07AABCU9603R1ZN</p>
                        </div>
                    </div>

                    {/* GRN Details & QR */}
                    <div className="flex-1 flex flex-col md:flex-row print:flex-row justify-end gap-6">
                        <div className="text-sm space-y-2 text-right">
                             <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-left md:text-right">
                                <span className="font-bold text-primary whitespace-nowrap">GRN No:</span>
                                <span className="font-mono font-bold text-gray-900">{purchase.invoiceNumber}</span>
                                
                                <span className="font-bold text-primary whitespace-nowrap">GRN Date:</span>
                                <span className="text-gray-900">{new Date(purchase.invoiceDate || purchase.purchaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                
                                <span className="font-bold text-primary whitespace-nowrap">PO No:</span>
                                <span className="text-gray-900">{purchase.poNumber || 'N/A'}</span>
                                
                                <span className="font-bold text-primary whitespace-nowrap">Invoice No:</span>
                                <span className="text-gray-900">{purchase.externalInvoiceNumber || purchase.invoiceNumber}</span>
                            </div>
                        </div>
                         {/* QR Code */}
                         <div className="flex justify-end md:justify-start">
                            <img src={qrCodeUrl} alt="GRN QR" className="w-28 h-28 border border-gray-200 p-1 bg-white" />
                         </div>
                    </div>
                </div>

                {/* Separator */}
                <div className="border-t border-gray-200 mb-8"></div>

                {/* 3. Supplier & Receiving Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-8 mb-8">
                    {/* Supplier */}
                    <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100 print:border-gray-200">
                        <h3 className="text-sm font-bold text-primary uppercase border-b border-gray-200 pb-2 mb-3">Supplier Details</h3>
                        <div className="text-sm text-gray-700 space-y-2">
                             <p className="font-bold text-lg text-gray-900">{purchase.supplierId?.name || 'Unknown Supplier'}</p>
                             <p className="whitespace-pre-line text-gray-600">{purchase.supplierId?.address || 'Address Not Available'}</p>
                             <div className="grid grid-cols-2 gap-2 mt-2">
                                <p><span className="font-semibold text-gray-500">GSTIN:</span> {purchase.supplierId?.gstNumber || 'N/A'}</p>
                                <p><span className="font-semibold text-gray-500">Phone:</span> {purchase.supplierId?.phone || 'N/A'}</p>
                             </div>
                        </div>
                    </div>

                    {/* Receiving */}
                    <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100 print:border-gray-200">
                        <h3 className="text-sm font-bold text-primary uppercase border-b border-gray-200 pb-2 mb-3">Receiving Details</h3>
                        <div className="grid grid-cols-[120px_1fr] gap-y-2 text-sm text-gray-700">
                             <span className="font-semibold text-gray-500">Received By:</span>
                             <span className="font-medium text-gray-900">{purchase.receivedBy?.name || 'Admin'}</span>
                             
                             <span className="font-semibold text-gray-500">Receiving Date:</span>
                             <span className="font-medium text-gray-900">{new Date(purchase.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                             
                             <span className="font-semibold text-gray-500">Payment Status:</span>
                             <span className={`font-bold ${purchase.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-orange-600'}`}>{purchase.paymentStatus}</span>

                             <span className="font-semibold text-gray-500">Delivery Note:</span>
                             <span className="font-medium text-gray-900">{purchase.deliveryNote || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* 4. Items Table */}
                <div className="mb-8 rounded-lg border border-gray-200 print:border-0 print:overflow-visible">
                     <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-[#003B5C] text-white print:bg-[#003B5C] print:text-white">
                                <th className="py-3 px-3 text-center border-r border-[#004e7a] w-12 font-semibold">Sr.</th>
                                <th className="py-3 px-3 text-left border-r border-[#004e7a] font-semibold">Item Name</th>
                                <th className="py-3 px-3 text-left border-r border-[#004e7a] w-24 font-semibold">Batch</th>
                                <th className="py-3 px-3 text-center border-r border-[#004e7a] w-24 font-semibold">Expiry</th>
                                <th className="py-3 px-3 text-center border-r border-[#004e7a] w-16 font-semibold">Qty</th>
                                <th className="py-3 px-3 text-center border-r border-[#004e7a] w-16 font-semibold">Free</th>
                                <th className="py-3 px-3 text-right border-r border-[#004e7a] w-24 font-semibold">Rate</th>
                                <th className="py-3 px-3 text-center border-r border-[#004e7a] w-16 font-semibold">GST</th>
                                <th className="py-3 px-3 text-right w-28 font-semibold">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchase.items?.map((item, index) => {
                                const totalFree = (item.physicalFreeQty || 0) + (item.schemeFreeQty || 0);
                                const totalGst = item.gst || item.tax || (item.productId?.tax) || ((item.cgst || 0) + (item.sgst || 0) + (item.igst || 0)) || 0;
                                return (
                                    <tr key={index} className="border-b border-gray-200 odd:bg-white even:bg-gray-50 print:even:bg-gray-100 break-inside-avoid">
                                        <td className="py-2 px-3 text-center border-r border-gray-200 text-gray-500">{index + 1}</td>
                                        <td className="py-2 px-3 border-r border-gray-200 font-bold text-gray-800">{item.productName || item.productId?.name}</td>
                                        <td className="py-2 px-3 border-r border-gray-200 font-mono text-xs text-gray-600 uppercase">{item.batchNumber}</td>
                                        <td className="py-2 px-3 text-center border-r border-gray-200 text-gray-600">{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-IN', {month: '2-digit', year: '2-digit'}) : '-'}</td>
                                        <td className="py-2 px-3 text-center border-r border-gray-200 font-bold text-gray-900">{item.receivedQty || item.quantity}</td>
                                        <td className="py-2 px-3 text-center border-r border-gray-200 text-xs text-gray-500">{totalFree > 0 ? totalFree : '-'}</td>
                                        <td className="py-2 px-3 text-right border-r border-gray-200 text-gray-700">{item.baseRate?.toFixed(2)}</td>
                                        <td className="py-2 px-3 text-center border-r border-gray-200 text-xs text-gray-600">{totalGst}%</td>
                                        <td className="py-2 px-3 text-right font-bold text-gray-900">{item.amount?.toFixed(2)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                     </table>
                </div>

                {/* 5. Footer & Totals */}
                <div className="flex flex-col md:flex-row print:flex-row gap-8 break-inside-avoid page-break-inside-avoid">
                    {/* Left: Remarks & Signatures */}
                    <div className="flex-1 flex flex-col justify-between">
                         <div className="mb-4">
                            <h4 className="font-bold text-primary mb-2 text-sm uppercase">Remarks</h4>
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm italic text-gray-600 min-h-[60px]">
                                {purchase.notes || "All items received in good condition and verified against the purchase order."}
                            </div>
                         </div>
                         
                         <div className="mt-8 flex justify-between gap-10">
                             <div className="border-t-2 border-gray-300 pt-2 w-40 text-center text-sm font-bold text-gray-500 uppercase">Checked By</div>
                             <div className="border-t-2 border-gray-300 pt-2 w-40 text-center text-sm font-bold text-gray-500 uppercase">Approved By</div>
                         </div>
                    </div>

                    {/* Right: Totals */}
                    <div className="w-full md:w-80">
                        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                            <div className="flex justify-between px-4 py-2 border-b border-gray-100 text-sm">
                                <span className="font-semibold text-gray-600">Total Quantity</span>
                                <span className="font-bold text-gray-900">{purchase.items.reduce((acc, item) => acc + (item.receivedQty || item.quantity || 0), 0)}</span>
                            </div>
                             <div className="flex justify-between px-4 py-2 border-b border-gray-100 text-sm">
                                <span className="font-semibold text-gray-600">Subtotal</span>
                                <span className="font-bold text-gray-900">₹{purchase.invoiceSummary?.taxableAmount?.toFixed(2) || '0.00'}</span>
                            </div>
                             <div className="flex justify-between px-4 py-2 border-b border-gray-100 text-sm">
                                <span className="font-semibold text-gray-600">Total GST</span>
                                <span className="font-bold text-gray-900">₹{((purchase.invoiceSummary?.amountAfterGst || 0) - (purchase.invoiceSummary?.taxableAmount || 0)).toFixed(2)}</span>
                            </div>
                             <div className="flex justify-between px-4 py-2 border-b border-gray-100 text-sm">
                                <span className="font-semibold text-gray-600">Round Off</span>
                                <span className="font-bold text-gray-900">₹{purchase.invoiceSummary?.roundAmount?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div className="flex justify-between px-4 py-3 bg-primary text-white text-lg print:bg-[#007242] print:text-white">
                                <span className="font-bold">Grand Total</span>
                                <span className="font-black">₹{purchase.grandTotal?.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Disclaimer */}
                <div className="mt-12 pt-4 border-t border-gray-200 text-center text-[10px] text-gray-400 uppercase tracking-wider">
                    <p>This is a computer-generated document and does not require a physical signature. | Printed on: {new Date().toLocaleString('en-IN')}</p>
                </div>
            </div>

            {/* Print Styles Override */}
            <style>{`
                @media print {
                    @page {
                        margin: 10mm;
                        size: A4;
                    }
                    body {
                        background: white;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    
                    /* Important for multi-page tables */
                    table { page-break-inside: auto; }
                    tr { page-break-inside: avoid; page-break-after: auto; }
                    thead { display: table-header-group; }
                    tfoot { display: table-footer-group; }
                    
                    /* Spacing adjustments */
                    .break-inside-avoid {
                        page-break-inside: avoid;
                    }
                    
                    /* Hide everything else */
                    body > * {
                        display: none;
                    }
                    /* Show only the React app root, but specifically target our document */
                    #root, #root > * {
                        display: block; 
                    }
                    .max-w-5xl {
                        max-width: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    /* Re-hide header/sidebar if they are part of layout wrapper which we can't easily detach */
                    nav, aside, header {
                        display: none !important;
                    }
                    #grn-document {
                        box-shadow: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        width: 100% !important;
                        overflow: visible !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default ViewGRN;
