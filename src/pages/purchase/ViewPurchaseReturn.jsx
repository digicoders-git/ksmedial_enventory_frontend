import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Phone, Mail, Printer, ArrowLeft, Download, FileText, Calendar, Truck, AlertOctagon } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import KS2Logo from '/KS2-Logo.png'; 
import api from '../../api/axios';

const ViewPurchaseReturn = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [returnNote, setReturnNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loading && returnNote && searchParams.get('autoPrint') === 'true') {
        setTimeout(() => {
            window.print();
        }, 500); 
    }
  }, [loading, returnNote, searchParams]);

  // Generate QR Data for scanning - JSON format for better scannability
  const qrData = returnNote ? JSON.stringify({
    type: "PURCHASE_RETURN",
    company: "KS Pharma Net",
    returnNo: returnNote.id,
    refInvoice: returnNote.invoiceRef,
    date: returnNote.date,
    supplier: returnNote.supplier,
    refundAmount: returnNote.totalAmount.toFixed(2),
    verified: true
  }) : '';

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;

  useEffect(() => {
    const fetchReturn = async () => {
        try {
            const { data } = await api.get(`/purchase-returns/${id}`);
            if (data.success) {
                const r = data.purchaseReturn;
                setReturnNote({
                    id: r.returnNumber,
                    date: new Date(r.createdAt).toLocaleDateString(),
                    supplier: r.supplierId?.name || 'Unknown Supplier',
                    contact: r.supplierId?.phone || 'N/A',
                    address: r.supplierId?.address || 'N/A',
                    gst: r.supplierId?.gstNumber || 'N/A',
                    status: 'Returned', // Debit Notes are generally treated as Final/Returned
                    invoiceRef: r.purchaseId?.invoiceNumber || 'N/A', 
                    items: r.items.map(i => ({
                         name: i.productId?.name || 'Unknown Item', 
                         batch: i.batchNumber,
                         qty: i.returnQuantity,
                         rate: i.purchasePrice,
                         amount: i.amount
                    })),
                    totalAmount: r.totalAmount,
                    reason: r.reason || 'N/A'
                });
            } else {
                setError("Debit Note not found");
            }
        } catch (err) {
            setError("Failed to load Debit Note");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if(id) fetchReturn();
  }, [id]);


  const handleDownloadPDF = () => {
    if (!returnNote) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // -- HEADER LOGO & INFO --
    const img = new Image();
    img.src = KS2Logo;
    
    img.onload = () => {
        // Add QR Code to PDF
        const qrImg = new Image();
        qrImg.crossOrigin = "anonymous";
        qrImg.src = qrCodeUrl;

        qrImg.onload = () => {
            doc.addImage(img, 'PNG', 14, 10, 45, 20);

            // QR Code in Top Right corner of PDF - Clean without any text overlay
            doc.addImage(qrImg, 'PNG', pageWidth - 44, 45, 30, 30);

        // Company Details
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

        // -- DEBIT NOTE TITLE --
        doc.setFontSize(36);
        doc.setTextColor(230, 230, 230); // Light gray watermark style
        doc.setFont('helvetica', 'bold');
        doc.text('DEBIT NOTE', pageWidth - 14, 25, { align: 'right' });
        
        doc.setFontSize(16);
        doc.setTextColor(239, 68, 68); // Red for Debit Note emphasis
        doc.text(`#${returnNote.id}`, pageWidth - 14, 38, { align: 'right' });
        
        // Ref Invoice - Moved below QR code to avoid overlap
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Ref Invoice: ${returnNote.invoiceRef}`, pageWidth - 14, 82, { align: 'right' });
        doc.text(`Date: ${returnNote.date}`, pageWidth - 14, 88, { align: 'right' });

        doc.setDrawColor(245);
        doc.line(14, 65, pageWidth - 14, 65);

        // -- SUPPLIER INFO --
        doc.setFontSize(8);
        doc.setTextColor(160);
        doc.setFont('helvetica', 'bold');
        doc.text('TO SUPPLIER', 14, 75);

        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(returnNote.supplier, 14, 83);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.setFont('helvetica', 'normal');
        const splitAddress = doc.splitTextToSize(returnNote.address, 90);
        doc.text(splitAddress, 14, 90);
        
        // Adjust Y based on address length
        let currentY = 90 + (splitAddress.length * 5); 
        doc.text(`Tel: ${returnNote.contact}`, 14, currentY);
        doc.text(`GST: ${returnNote.gst}`, 14, currentY + 5);

        // -- ITEMS TABLE --
        const tableColumn = ["#", "Item Name", "Batch", "Return Qty", "Rate", "Total"];
        const tableRows = returnNote.items.map((item, index) => [
            index + 1,
            item.name,
            item.batch || '-',
            item.qty,
            `Rs. ${item.rate.toFixed(2)}`,
            `Rs. ${item.amount.toFixed(2)}`
        ]);

        autoTable(doc, {
            startY: currentY + 15,
            head: [tableColumn],
            body: tableRows,
            theme: 'striped',
            headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' }, // Red header for Debit Note
            bodyStyles: { fontSize: 9 },
            columnStyles: {
                0: { halign: 'center' },
                3: { halign: 'center' },
                4: { halign: 'right' },
                5: { halign: 'right' },
            },
            margin: { left: 14, right: 14 },
        });

        // -- SUMMARY --
        const finalY = doc.lastAutoTable.finalY + 15;
        
        // Reason
        doc.setFontSize(9);
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.text('Reason for Return:', 14, finalY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        const reasonText = returnNote.reason;
        const splitReason = doc.splitTextToSize(reasonText, 100);
        doc.text(splitReason, 14, finalY + 5);

        // Totals
        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.text(`TOTAL REFUND AMOUNT`, pageWidth - 95, finalY);
        doc.setTextColor(220, 38, 38); 
        doc.setFontSize(14);
        doc.text(`Rs. ${returnNote.totalAmount.toFixed(2)}`, pageWidth - 14, finalY, { align: 'right' });

        doc.save(`${returnNote.id}_debit_note.pdf`);
        }; // End qrImg.onload
    }; // End img.onload
    
    // Fallback if image fails
    img.onerror = () => {
        doc.setFontSize(22);
        doc.setTextColor(0);
        doc.text('KS PHARMA NET', 14, 22);
        doc.save(`${returnNote.id}_debit_note.pdf`);
    }
  };


  if (loading) return (
      <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
  );

  if (error) return (
       <div className="flex items-center justify-center min-h-screen text-red-500 font-bold bg-gray-50">
          <div className="text-center">
              <AlertOctagon size={48} className="mx-auto mb-4 opacity-50"/>
              <p>{error}</p>
              <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 underline text-sm">Go Back</button>
          </div>
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
                navigate('/purchase/return');
              }
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300 hover:text-red-600 transition-colors bg-white dark:bg-gray-800 px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md font-bold active:scale-95"
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
                className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl shadow-lg shadow-red-200 hover:shadow-red-300 hover:bg-red-700 transition-all active:scale-95 text-sm font-black uppercase tracking-wider"
            >
                <Printer size={18} strokeWidth={2.5} /> Print Debit Note
            </button>
        </div>
      </div>

      {/* Invoice Card */}
      <div id="printable-content" className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden print:shadow-none print:border-none print:rounded-none print:max-w-none print:w-full">
        
        {/* Top Branding Section */}
        <div className="bg-gradient-to-br from-red-50 to-white border-b border-gray-100 p-6 sm:p-8 md:p-12 relative overflow-hidden print:p-8">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none select-none print:opacity-5">
                <FileText size={400} />
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-start gap-10 relative z-10">
                <div className="flex flex-col gap-6 w-full lg:w-auto">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                            <img src="/KS2-Logo.png" alt="Logo" className="h-16 w-auto object-contain" />
                        </div>
                        <div>
                           <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">KS Pharma Net</h2>
                           <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">Medical Excellence</p>
                        </div>
                    </div>
                    <div className="space-y-2.5 text-sm text-gray-500 font-medium">
                        <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500"><MapPin size={16}/></div> 123, Health Avenue, Medical District</div>
                        <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500"><Phone size={16}/></div> +91 98765 43210</div>
                        <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500"><Mail size={16}/></div> support@kspharma.com</div>
                    </div>
                </div>

                <div className="text-left lg:text-right w-full lg:w-auto flex flex-col lg:items-end">
                    <h1 className="text-5xl sm:text-7xl font-black text-gray-900/5 uppercase tracking-tighter leading-none mb-1 select-none print:text-4xl">Debit Note</h1>
                    <div className="text-3xl font-black text-red-600 tracking-tight">#{returnNote.id}</div>
                    
                    <div className="mt-8 flex flex-col items-start lg:items-end gap-5">
                        <div className="flex items-center gap-4">
                            <div className="px-4 py-1.5 rounded-xl bg-red-50 text-red-700 border border-red-100 text-[10px] font-black uppercase tracking-widest shadow-sm print:border-red-500 print:text-red-600">
                                 Return Verified
                            </div>
                            <div className="h-12 w-12 bg-white p-1.5 rounded-xl border border-gray-100 shadow-sm group hover:scale-110 transition-transform">
                                <img src={qrCodeUrl} alt="Return QR" className="w-full h-full" />
                            </div>
                        </div>
                        <div className="flex flex-col lg:items-end gap-1.5">
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200/50">
                                Date: <span className="text-gray-900 ml-1">{returnNote.date}</span>
                            </div>
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200/50">
                                Ref Invoice: <span className="text-gray-900 ml-1">{returnNote.invoiceRef}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Details Section */}
        <div className="p-6 sm:p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-10 print:p-8 print:gap-8">
            <div className="bg-gray-50/50 dark:bg-gray-900/10 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Truck size={14} strokeWidth={3} className="text-red-500" /> To Supplier
                </h3>
                <div className="text-xl font-black text-gray-900 mb-3 tracking-tight">{returnNote.supplier}</div>
                <div className="text-sm text-gray-500 leading-relaxed font-medium mb-4">{returnNote.address}</div>
                <div className="flex flex-col gap-2">
                    <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-500/40"></div> Tel: <span className="text-gray-700 ml-auto">{returnNote.contact}</span></div>
                    <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-500/40"></div> GST: <span className="text-gray-700 ml-auto">{returnNote.gst}</span></div>
                </div>
            </div>
            
            <div className="md:text-right flex flex-col justify-center">
                 <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4">Ref & Reason</h3>
                 <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-right">
                    <p className="text-[11px] font-black text-red-400 uppercase tracking-widest mb-1">Return Reason</p>
                    <p className="text-sm font-black text-red-600 tracking-tight leading-relaxed">"{returnNote.reason}"</p>
                 </div>
            </div>
        </div>

        {/* Items Table */}
        <div className="px-6 sm:px-8 md:px-12 pb-8 print:px-8">
            <div className="relative group">
                <div className="md:hidden flex items-center justify-center gap-2 text-[10px] font-black text-red-500/40 uppercase tracking-widest mb-3 animate-pulse">
                   Swipe to see details <FileText size={12} className="rotate-90" />
                </div>
                <div className="border rounded-2xl overflow-x-auto border-gray-100 shadow-inner scrollbar-hide print:border-black">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-900 text-white font-black uppercase text-[10px] tracking-[0.2em] print:bg-gray-100 print:text-black">
                                <th className="py-5 px-6 w-16 text-center">#</th>
                                <th className="py-5 px-6">Item Name</th>
                                <th className="py-5 px-6 text-center">Batch</th>
                                <th className="py-5 px-6 text-center">Ret. Qty</th>
                                <th className="py-5 px-6 text-right">Rate</th>
                                <th className="py-5 px-6 text-right rounded-tr-2xl">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 print:divide-gray-300">
                            {returnNote.items.map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50 transition-colors group print:bg-white">
                                    <td className="py-5 px-6 text-center text-gray-400 font-black text-[11px] print:text-black">{index + 1}</td>
                                    <td className="py-5 px-6 font-black text-gray-800 uppercase tracking-tight print:text-black">{item.name}</td>
                                    <td className="py-5 px-6 text-center text-gray-600 font-mono text-[11px] bg-gray-50/50 print:text-black">{item.batch || '-'}</td>
                                    <td className="py-5 px-6 text-center text-red-600 font-black print:text-black">{item.qty}</td>
                                    <td className="py-5 px-6 text-right text-gray-500 font-medium print:text-black">₹{item.rate.toFixed(2)}</td>
                                    <td className="py-5 px-6 text-right font-black text-gray-900 print:text-black group-hover:text-red-600 transition-colors">₹{item.amount.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* Footer Summary */}
        <div className="bg-gray-900 text-white p-6 sm:p-8 md:p-12 flex flex-col lg:flex-row justify-between items-start gap-12 print:break-inside-avoid print:bg-white print:p-8 print:text-black">
             <div className="flex-1 space-y-4 max-w-sm">
                <div>
                   <p className="font-black text-red-500 uppercase text-[10px] tracking-[0.2em] mb-2">Note & Declaration:</p>
                   <p className="text-xs text-gray-400 leading-relaxed font-medium print:text-gray-600">This debit note acknowledges the return of goods. The amount will be adjusted against future invoices or refunded as per agreement. This is a computer generated document.</p>
                </div>
                <div className="flex items-center gap-4 py-4 border-y border-white/5 print:border-gray-200">
                    <div className="flex items-center gap-2">
                        <FileText size={16} className="text-red-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Debit Note</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-red-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{returnNote.date}</span>
                    </div>
                </div>
             </div>

             <div className="w-full lg:w-96 space-y-4 bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-sm print:bg-white print:border-black">
                <div className="flex justify-between items-center border-t border-white/10 pt-6 mt-2 relative overflow-hidden group print:border-black">
                    <div className="absolute inset-0 bg-red-500/5 -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                    <div className="flex flex-col relative z-10">
                        <span className="font-black text-red-500 uppercase text-[10px] tracking-[0.2em] mb-1">Total Refund</span>
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Credited to Account</span>
                    </div>
                    <span className="font-black text-red-500 text-3xl sm:text-4xl tracking-tighter relative z-10">
                       ₹{returnNote.totalAmount.toFixed(2)}
                    </span>
                </div>
             </div>
        </div>
        
        {/* Print Only Footer - Signatures */}
        <div className="hidden print:flex justify-between items-end px-12 pb-12 mt-12">
            <div className="text-center">
                <div className="h-16 w-32 border-b border-gray-400 mb-2"></div>
                <p className="text-xs font-bold uppercase text-gray-600">Checking Officer</p>
            </div>
            <div className="text-center">
                 <div className="h-16 w-32 border-b border-gray-400 mb-2"></div>
                <p className="text-xs font-bold uppercase text-gray-600">Authorized Signatory</p>
            </div>
        </div>

      </div>
      <style>{`
          @media print {
              body * {
                visibility: hidden;
              }
              #printable-content, #printable-content * {
                visibility: visible;
              }
              #printable-content {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 0;
                background: white;
              }
              @page { size: auto;  margin: 0mm; }
              
              /* Ensure backgrounds print */
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
          }
      `}</style>
    </div>
  );
};

export default ViewPurchaseReturn;
