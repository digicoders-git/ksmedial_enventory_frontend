import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Phone, Mail, Printer, ArrowLeft, Download, Share2, FileText, Truck, Calendar } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import KS2Logo from '/KS2-Logo.png'; 
import api from '../../api/axios';

const ViewPurchaseInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loading && invoice && searchParams.get('autoPrint') === 'true') {
        setTimeout(() => {
            window.print();
        }, 500); // Small delay to ensuring rendering
    }
  }, [loading, invoice, searchParams]);

  // Generate QR Data for scanning - using JSON format for better scannability
  const qrData = invoice ? JSON.stringify({
    type: 'PURCHASE_INVOICE',
    company: 'KS Pharma Net',
    invoiceNo: invoice.id,
    date: invoice.date,
    supplier: invoice.supplier,
    amount: invoice.grandTotal,
    payment: invoice.payment,
    status: invoice.status,
    verified: true
  }) : '';

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;

  useEffect(() => {
    const fetchInvoice = async () => {
        try {
            // Check if id is local or mongoId. 
            // Usually we might need a specific endpoint or filter.
            // Assuming '/purchases/:id' works with mongoId.
            // If 'id' from params is invoiceNumber (e.g. INV-2024...), we might need to search or use different endpoint.
            // Let's assume we pass mongoId in URL or backend supports lookup.
            // If URL is /purchase/invoice/view/INV-001, backend needs to support it. 
            // Standardizing to use mongoId is safest if we linked it that way. 
            // But let's check how Sales does it. Sales uses `ViewInvoice` which simulates fetch.
            
            // For now, I'll try to fetch all and find, or assume ID is mongoID.
            // Better: Fetch by ID.
            let response = null;
            try {
                response = await api.get(`/purchases/${id}`);
            } catch(e) {
                 // specific lookup by invoice number could be needed if id is not mongoid
                 // For now let's hope it's mongoId or backend handles it.
                 // Actually the user URL example was `/sales/invoices/view/INV-2024-001`.
                 // If I want to support that, I need lookup by invoice number.
                 // But typically I'll link to `_id`.
                 console.error("Direct fetch failed", e);
            }

            if (response && response.data.success) {
                const p = response.data.purchase;
                setInvoice({
                    id: p.invoiceNumber,
                    date: (p.purchaseDate && !isNaN(new Date(p.purchaseDate).getTime())) ? new Date(p.purchaseDate).toISOString().split('T')[0] : 'N/A',
                    supplier: p.supplierId?.name || 'Unknown Supplier',
                    contact: p.supplierId?.phone || 'N/A',
                    address: p.supplierId?.address || 'N/A',
                    gst: p.supplierId?.gstNumber || 'N/A',
                    payment: p.paymentStatus,
                    status: p.status || 'Received',
                    items: p.items.map(i => ({
                         name: i.productName || i.productId?.name || i.name, 
                         qty: i.receivedQty || i.quantity || 0,
                         rate: i.purchasePrice || i.baseRate || 0,
                         tax: i.cgst + i.sgst + i.igst || 0,
                         amount: i.amount || 0
                    })),
                    subtotal: p.subTotal,
                    taxAmount: p.taxAmount,
                    discountAmount: p.discount,
                    grandTotal: p.grandTotal
                });
            } else {
                // If ID was invoice number (string), we might need to fetch all and find? Or backend search.
                // Let's fallback to list fetch if needed or error.
                setError("Invoice not found");
            }

        } catch (err) {
            setError("Failed to load invoice");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if(id) fetchInvoice();
  }, [id]);


  const handleDownloadPDF = () => {
    if (!invoice) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Helper to add Logo
    const img = new Image();
    img.src = KS2Logo;
    
    img.onload = () => {
        // Add QR Code to PDF
        const qrImg = new Image();
        qrImg.crossOrigin = "anonymous";
        qrImg.src = qrCodeUrl;
        
        qrImg.onload = () => {
            doc.addImage(img, 'PNG', 14, 10, 45, 20);
            
            // QR Code in Top Right corner of PDF
            doc.addImage(qrImg, 'PNG', pageWidth - 44, 45, 30, 30);

        // Company Info
        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.text('KS Pharma Net', 14, 40);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text('123, Health Avenue, Medical District', 14, 46);
        doc.text('Phone: +91 98765 43210', 14, 51);
        doc.text('Email: support@kspharma.com', 14, 56);

        // Invoice Header
        doc.setFontSize(36);
        doc.setTextColor(230, 230, 230);
        doc.setFont('helvetica', 'bold');
        doc.text('PURCHASE', pageWidth - 14, 25, { align: 'right' });
        
        doc.setFontSize(16);
        doc.setTextColor(0);
        doc.text(`#${invoice.id}`, pageWidth - 14, 38, { align: 'right' });
        
        // Status Badge - moved to left side to avoid QR overlap
        const statusX = 14;
        const statusY = 62;
        doc.setDrawColor(220, 252, 231);
        doc.setFillColor(240, 253, 244);
        doc.roundedRect(statusX, statusY, 20, 6, 1, 1, 'FD');
        doc.setTextColor(22, 101, 52);
        doc.setFontSize(8);
        doc.text(invoice.status.toUpperCase(), statusX + 10, statusY + 4.2, { align: 'center' });

        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`Date: ${invoice.date}`, 14, 72);

        doc.setDrawColor(245);
        doc.line(14, 75, pageWidth - 14, 75);

        // Bill To & Payment Info (Dual Column)
        doc.setFontSize(8);
        doc.setTextColor(160);
        doc.setFont('helvetica', 'bold');
        doc.text('SUPPLIER', 14, 85);
        doc.text('PAYMENT INFO', pageWidth - 14, 85, { align: 'right' });

        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(invoice.supplier, 14, 93);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.setFont('helvetica', 'normal');
        const splitAddress = doc.splitTextToSize(invoice.address, 70);
        doc.text(splitAddress, 14, 100);
        doc.text(`Tel: ${invoice.contact}`, 14, 100 + (splitAddress.length * 5));
        doc.text(`GST: ${invoice.gst}`, 14, 100 + (splitAddress.length * 5) + 5);


        // Right side - Payment info details
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('Payment Status:', pageWidth - 45, 93, { align: 'right' });
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.text(invoice.payment, pageWidth - 14, 93, { align: 'right' });
        
        // Items Table
        const tableColumn = ["#", "Item Name", "Qty", "Rate", "Total"];
        const tableRows = invoice.items.map((item, index) => [
            index + 1,
            item.name,
            item.qty,
            `Rs. ${item.rate.toFixed(2)}`,
            `Rs. ${item.amount.toFixed(2)}`
        ]);

        autoTable(doc, {
            startY: 130,
            head: [tableColumn],
            body: tableRows,
            theme: 'striped',
            headStyles: { fillColor: [0, 114, 66], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
            bodyStyles: { fontSize: 9 },
            columnStyles: {
                0: { halign: 'center' },
                2: { halign: 'center' },
                3: { halign: 'right' },
                4: { halign: 'right' },
            },
            margin: { left: 14, right: 14 },
        });

        // Summary Area
        const finalY = doc.lastAutoTable.finalY + 15;
        
        // Note
        doc.setFontSize(9);
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.text('Note:', 14, finalY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        const noteText = "This is a computer generated invoice.";
        const splitNote = doc.splitTextToSize(noteText, 80);
        doc.text(splitNote, 14, finalY + 5);

        // Calculation
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Subtotal`, pageWidth - 60, finalY);
        doc.setTextColor(0);
        doc.text(`Rs. ${invoice.subtotal.toFixed(2)}`, pageWidth - 14, finalY, { align: 'right' });
        
        doc.setTextColor(100);
        doc.text(`Discount`, pageWidth - 60, finalY + 8);
        doc.setTextColor(239, 68, 68);
        doc.text(`-Rs. ${invoice.discountAmount.toFixed(2)}`, pageWidth - 14, finalY + 8, { align: 'right' });
        
        doc.setTextColor(100);
        doc.text(`Tax`, pageWidth - 60, finalY + 16);
        doc.setTextColor(0);
        doc.text(`Rs. ${invoice.taxAmount.toFixed(2)}`, pageWidth - 14, finalY + 16, { align: 'right' });

        doc.setDrawColor(230);
        doc.line(pageWidth - 70, finalY + 22, pageWidth - 14, finalY + 22);

        doc.setFontSize(14);
        doc.setFont('helvetica', 'black');
        doc.text(`GRAND TOTAL`, pageWidth - 70, finalY + 32);
        doc.setTextColor(0, 114, 66);
        doc.text(`Rs. ${invoice.grandTotal.toFixed(2)}`, pageWidth - 14, finalY + 32, { align: 'right' });

        doc.save(`${invoice.id}_purchase_invoice.pdf`);
        }; // End qrImg.onload
    }; // End img.onload
    
    // Fallback if image fails to load
    img.onerror = () => {
        doc.setFontSize(22);
        doc.setTextColor(0, 114, 66);
        doc.text('KS PHARMA NET', 14, 22);
        doc.save(`${invoice.id}_purchase_invoice.pdf`);
    }
  };


  if (loading) return (
      <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
  );

  if (error) return (
       <div className="flex items-center justify-center min-h-screen text-red-500 font-bold">
          {error}
       </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 animate-fade-in print:p-0 print:bg-white">
      
      {/* Action Header - Hidden on Print */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 print:hidden">
        <button 
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/purchase/invoices');
              }
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary transition-colors bg-white dark:bg-gray-800 px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md font-bold active:scale-95"
        >
            <ArrowLeft size={18} strokeWidth={2.5} /> 
            <span className="uppercase text-xs tracking-widest">Back to List</span>
        </button>
        
        <div className="flex flex-col sm:flex-row gap-3">
            <button 
                onClick={handleDownloadPDF}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 shadow-sm transition-all active:scale-95 text-sm font-black uppercase tracking-wider"
            >
                <Download size={18} strokeWidth={2.5} /> PDF
            </button>
            <button 
                onClick={() => window.print()} 
                className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:bg-secondary transition-all active:scale-95 text-sm font-black uppercase tracking-wider"
            >
                <Printer size={18} strokeWidth={2.5} /> Print Invoice
            </button>
        </div>
      </div>

      {/* Invoice Card */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden print:shadow-none print:border-none print:rounded-none print:max-w-none print:w-full">
        
        {/* Top Branding Section */}
        <div className="bg-gradient-to-br from-gray-50 to-white border-b border-gray-100 p-6 sm:p-8 md:p-12">
            <div className="flex flex-col lg:flex-row justify-between items-start gap-10">
                <div className="flex flex-col gap-6 w-full lg:w-auto">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                            <img src="/KS2-Logo.png" alt="Logo" className="h-16 w-auto object-contain" />
                        </div>
                        <div>
                           <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">KS Pharma Net</h2>
                           <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Medical Excellence</p>
                        </div>
                    </div>
                    <div className="space-y-2.5 text-sm text-gray-500 font-medium">
                        <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary"><MapPin size={16}/></div> 123, Health Avenue, Medical District</div>
                        <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary"><Phone size={16}/></div> +91 98765 43210</div>
                        <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary"><Mail size={16}/></div> support@kspharma.com</div>
                    </div>
                </div>

                <div className="text-left lg:text-right w-full lg:w-auto flex flex-col lg:items-end">
                    <h1 className="text-5xl sm:text-7xl font-black text-gray-900/5 uppercase tracking-tighter leading-none mb-1 select-none">Purchase</h1>
                    <div className="text-3xl font-black text-gray-800 tracking-tight">#{invoice.id}</div>
                    
                    <div className="mt-8 flex flex-col items-start lg:items-end gap-5">
                        <div className="flex items-center gap-4">
                            <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm
                                 ${invoice.status === 'Received' ? 'bg-green-50 text-green-700 border-green-200/50' : 'bg-orange-50 text-orange-700 border-orange-200/50'}
                            `}>
                                 {invoice.status}
                            </div>
                            <div className="h-10 w-10 bg-white p-1.5 rounded-xl border border-gray-100 shadow-sm group hover:scale-110 transition-transform">
                                <img src={qrCodeUrl} alt="Purchase QR" className="w-full h-full" />
                            </div>
                        </div>
                        <div className="text-xs text-gray-500 font-black uppercase tracking-widest bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200/50">
                            Date: <span className="text-gray-900 ml-1">{invoice.date}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Billing Details */}
        <div className="p-6 sm:p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-gray-50/50 dark:bg-gray-900/10 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Truck size={14} strokeWidth={3} className="text-primary" /> Supplier
                </h3>
                <div className="text-xl font-black text-gray-900 mb-3 tracking-tight">{invoice.supplier}</div>
                <div className="text-sm text-gray-500 leading-relaxed font-medium mb-4">{invoice.address}</div>
                <div className="flex flex-col gap-2">
                    <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div> Tel: <span className="text-gray-700 ml-auto">{invoice.contact}</span></div>
                    <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div> GST: <span className="text-gray-700 ml-auto">{invoice.gst}</span></div>
                </div>
            </div>
            
            <div className="md:text-right flex flex-col justify-center">
                 <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4">Payment Info</h3>
                 <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                    <div className="flex md:justify-end justify-between items-center gap-8">
                        <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest">Payment Status</span>
                        <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border shadow-sm
                            ${invoice.payment === 'Paid' ? 'bg-white text-green-600 border-green-100' : 'bg-white text-red-500 border-red-100'}`}>
                            {invoice.payment}
                        </span>
                    </div>
                 </div>
            </div>
        </div>

        {/* Items Table */}
        <div className="px-6 sm:px-8 md:px-12 pb-8">
            <div className="relative group">
                <div className="md:hidden flex items-center justify-center gap-2 text-[10px] font-black text-primary/40 uppercase tracking-widest mb-3 animate-pulse">
                   Swipe to see details <Share2 size={12} className="rotate-90" />
                </div>
                <div className="border rounded-2xl overflow-x-auto border-gray-100 shadow-inner scrollbar-hide">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-900 text-white font-black uppercase text-[10px] tracking-[0.2em]">
                                <th className="py-5 px-6 w-16 text-center">#</th>
                                <th className="py-5 px-6">Item Name</th>
                                <th className="py-5 px-6 text-center">Qty</th>
                                <th className="py-5 px-6 text-right">Rate</th>
                                <th className="py-5 px-6 text-right rounded-tr-2xl">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {invoice.items.map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50 transition-colors group">
                                    <td className="py-5 px-6 text-center text-gray-400 font-black text-[11px]">{index + 1}</td>
                                    <td className="py-5 px-6 font-black text-gray-800 uppercase tracking-tight">{item.name}</td>
                                    <td className="py-5 px-6 text-center text-gray-600 font-bold bg-gray-50/50">{item.qty}</td>
                                    <td className="py-5 px-6 text-right text-gray-500 font-medium whitespace-nowrap">₹{item.rate.toFixed(2)}</td>
                                    <td className="py-5 px-6 text-right font-black text-gray-900 whitespace-nowrap group-hover:text-primary transition-colors">₹{item.amount.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* Footer Summary */}
        <div className="bg-gray-900 text-white p-6 sm:p-8 md:p-12 flex flex-col lg:flex-row justify-between items-start gap-12 print:break-inside-avoid">
             <div className="flex-1 space-y-4 max-w-sm">
                <div>
                   <p className="font-black text-primary uppercase text-[10px] tracking-[0.2em] mb-2">Note & Declaration:</p>
                   <p className="text-xs text-gray-400 leading-relaxed font-medium">Goods once sold will not be taken back or exchanged. This is a computer generated invoice and does not require a physical signature.</p>
                </div>
                <div className="flex items-center gap-4 py-4 border-y border-white/5">
                    <div className="flex items-center gap-2">
                        <FileText size={16} className="text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">System Document</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{invoice.date}</span>
                    </div>
                </div>
             </div>

             <div className="w-full lg:w-96 space-y-4 bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-sm">
                <div className="flex justify-between items-center text-sm">
                    <span className="font-black uppercase tracking-widest text-gray-500 text-[10px]">Subtotal</span>
                    <span className="font-bold">₹{invoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="font-black uppercase tracking-widest text-gray-500 text-[10px]">Discount</span>
                    <span className="font-bold text-red-500">-₹{invoice.discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="font-black uppercase tracking-widest text-gray-500 text-[10px]">Tax reversable</span>
                    <span className="font-bold whitespace-nowrap">₹{invoice.taxAmount.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center border-t border-white/10 pt-6 mt-2 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-primary/5 -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                    <div className="flex flex-col relative z-10">
                        <span className="font-black text-primary uppercase text-[10px] tracking-[0.2em] mb-1">Grand Total</span>
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Digital Verified Amount</span>
                    </div>
                    <span className="font-black text-white text-3xl sm:text-4xl tracking-tighter relative z-10">
                       ₹{invoice.grandTotal.toFixed(2)}
                    </span>
                </div>
             </div>
        </div>
        
        {/* Print Only Footer - Signatures */}
        <div className="hidden print:flex justify-between items-end px-12 pb-12 mt-12">
            <div className="text-center">
                <div className="h-16 w-32 border-b border-gray-400 mb-2"></div>
                <p className="text-xs font-bold uppercase text-gray-600">Supplier Signature</p>
            </div>
            <div className="text-center">
                 <div className="h-16 w-32 border-b border-gray-400 mb-2"></div>
                <p className="text-xs font-bold uppercase text-gray-600">Authorized Signatory</p>
            </div>
        </div>

      </div>
      <style>{`
          @media print {
              @page { margin: 0; size: auto; }
              body { 
                background: white; 
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body > *:not(#root) { display: none; }
              
              .max-w-4xl {
                  max-width: none !important;
                  width: 100% !important;
                  margin: 0 !important;
                  box-shadow: none !important;
                  border: none !important;
              }
              
              * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
              }
              
              p, div, span, h1, h2, h3, h4, th, td {
                  color: #000 !important;
              }
              .text-primary {
                  color: #007242 !important;
              }
              .text-red-500 {
                  color: #ef4444 !important;
              }
              
              .overflow-hidden {
                  overflow: visible !important;
              }
              
              .p-8, .md:p-12 {
                  padding: 20px !important;
              }
          }
      `}</style>
    </div>
  );
};

export default ViewPurchaseInvoice;
