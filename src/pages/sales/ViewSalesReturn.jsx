import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Mail, Printer, ArrowLeft, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import KS2Logo from '/KS2-Logo.png'; 
import api from '../../api/axios';
import Swal from 'sweetalert2';

const ViewSalesReturn = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [returnNote, setReturnNote] = useState(null);

  // QR Code Logic
  const qrData = returnNote ? encodeURIComponent(`
SALES RETURN (CREDIT NOTE)
-------------------------------
Return No: ${returnNote.id}
Ref Invoice: ${returnNote.originalInvoiceId}
Date: ${returnNote.date}
Customer: ${returnNote.customer}
Refund Amount: Rs. ${returnNote.refundAmount.toFixed(2)}
Status: ${returnNote.status}
-------------------------------
KS Pharma Net - Authorized Document
  `.trim()) : '';

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}`;

  const handleDownloadPDF = () => {
    if (!returnNote) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Helper to add Logo
    const img = new Image();
    img.src = KS2Logo;
    
    img.onload = () => {
        // Logo
        doc.addImage(img, 'PNG', 14, 10, 45, 20);

        // QR Code for PDF
        const qrImg = new Image();
        qrImg.crossOrigin = "anonymous";
        qrImg.src = qrCodeUrl;

        qrImg.onload = () => {
            // QR in top right
            doc.addImage(qrImg, 'PNG', pageWidth - 44, 45, 30, 30);
            doc.setFontSize(7);
            doc.setTextColor(150);
            doc.text('VERIFY RETURN', pageWidth - 29, 78, { align: 'center' });

            // Company Info
            doc.setFontSize(11);
            doc.setTextColor(0);
            doc.setFont('helvetica', 'bold');
            doc.text(returnNote.shop?.shopName || 'KS Pharma Net', 14, 40);
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text(returnNote.shop?.address || '123, Health Avenue, Medical District', 14, 46);
            doc.text(`Phone: ${returnNote.shop?.contactNumber || '+91 98765 43210'}`, 14, 51);
            doc.text(`Email: ${returnNote.shop?.email || 'support@kspharma.com'}`, 14, 56);

            // Credit Note Header
            doc.setFontSize(32);
            doc.setTextColor(220, 38, 38); // Red-600
            doc.setFont('helvetica', 'bold');
            doc.text('CREDIT NOTE', pageWidth - 14, 25, { align: 'right' });
            
            doc.setFontSize(16);
            doc.setTextColor(0);
            doc.text(`#${returnNote.id}`, pageWidth - 14, 38, { align: 'right' });

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text('Ref Invoice: ', pageWidth - 45, 45, { align: 'right' });
            doc.setTextColor(0);
            doc.setFont('helvetica', 'bold');
            doc.text(returnNote.originalInvoiceId, pageWidth - 14, 45, { align: 'right' });
            
            // Status Badge
            const statusX = pageWidth - 35;
            const statusY = 52;
            doc.setDrawColor(254, 242, 242);
            doc.setFillColor(254, 242, 242);
            doc.roundedRect(statusX, statusY, 21, 6, 1, 1, 'FD');
            doc.setTextColor(185, 28, 28);
            doc.setFontSize(8);
            doc.text(returnNote.status.toUpperCase(), statusX + 10.5, statusY + 4.2, { align: 'center' });

            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.setFont('helvetica', 'normal');
            doc.text(`Date: ${returnNote.date}`, pageWidth - 14, 65, { align: 'right' });

            doc.setDrawColor(245);
            doc.line(14, 75, pageWidth - 14, 75);

            // Details Row
            doc.setFontSize(8);
            doc.setTextColor(160);
            doc.setFont('helvetica', 'bold');
            doc.text('CUSTOMER DETAILS', 14, 85);
            doc.text('RETURN REASON', pageWidth - 14, 85, { align: 'right' });

            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.text(returnNote.customer, 14, 93);
            
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.setFont('helvetica', 'normal');
            const splitAddress = doc.splitTextToSize(returnNote.address, 70);
            doc.text(splitAddress, 14, 100);
            doc.text(`Tel: ${returnNote.contact}`, 14, 100 + (splitAddress.length * 5));

            // Right side - Reason Box
            const reasonY = 93;
            const reasonText = `"${returnNote.reason}"`;
            const reasonWidth = doc.getTextWidth(reasonText) + 10;
            doc.setDrawColor(230);
            doc.setFillColor(250, 250, 250);
            doc.roundedRect(pageWidth - reasonWidth - 14, reasonY - 5, reasonWidth, 10, 1, 1, 'FD');
            doc.setTextColor(50);
            doc.text(reasonText, pageWidth - 14 - (reasonWidth/2), reasonY + 1.5, { align: 'center' });

            // Items Table
            const tableColumn = ["#", "Item Name", "Rate", "Ret Qty", "Tax", "Total"];
            const tableRows = returnNote.items.map((item, index) => [
                index + 1,
                item.name,
                `Rs. ${item.rate.toFixed(2)}`,
                item.qty,
                `${item.tax}%`,
                `Rs. ${(item.qty * item.rate * (1 + item.tax/100)).toFixed(2)}`
            ]);

            autoTable(doc, {
                startY: 125,
                head: [tableColumn],
                body: tableRows,
                theme: 'striped',
                headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold', halign: 'center' },
                bodyStyles: { fontSize: 9 },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 10 },
                    1: { halign: 'left' },
                    2: { halign: 'right' },
                    3: { halign: 'center' },
                    4: { halign: 'right' },
                    5: { halign: 'right' },
                },
                margin: { left: 14, right: 14 },
            });

            // Summary Area
            const finalY = doc.lastAutoTable.finalY + 15;
            
            // Note
            doc.setFontSize(9);
            doc.setTextColor(0);
            doc.setFont('helvetica', 'bold');
            doc.text('Declaration:', 14, finalY);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100);
            const declaration = "We declare that this credit note shows the actual price of the goods returned and that all particulars are true and correct.";
            const splitDecl = doc.splitTextToSize(declaration, 80);
            doc.text(splitDecl, 14, finalY + 5);

            // Calculation
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Subtotal (Refund)`, pageWidth - 65, finalY);
            doc.setTextColor(0);
            doc.text(`Rs. ${returnNote.subtotal.toFixed(2)}`, pageWidth - 14, finalY, { align: 'right' });
            
            doc.setTextColor(100);
            doc.text(`Reversed Tax`, pageWidth - 65, finalY + 8);
            doc.setTextColor(0);
            doc.text(`Rs. ${returnNote.taxAmount.toFixed(2)}`, pageWidth - 14, finalY + 8, { align: 'right' });

            doc.setDrawColor(230);
            doc.line(pageWidth - 75, finalY + 14, pageWidth - 14, finalY + 14);

            doc.setFontSize(14);
            doc.setFont('helvetica', 'black');
            doc.setTextColor(185, 28, 28); // Red-700
            doc.text(`TOTAL REFUND`, pageWidth - 75, finalY + 24);
            doc.text(`- Rs. ${returnNote.refundAmount.toFixed(2)}`, pageWidth - 14, finalY + 24, { align: 'right' });

            // Signature Lines
            const sigY = 265;
            doc.setDrawColor(150);
            doc.line(30, sigY, 80, sigY);
            doc.line(pageWidth - 80, sigY, pageWidth - 30, sigY);
            
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.setFont('helvetica', 'bold');
            doc.text('Customer Signature', 55, sigY + 5, { align: 'center' });
            doc.text('Authorized Signatory', pageWidth - 55, sigY + 5, { align: 'center' });

            doc.save(`${returnNote.id}_credit_note.pdf`);
        };
    };
    
    // Fallback if image fails to load
    img.onerror = () => {
        doc.setFontSize(22);
        doc.setTextColor(220, 38, 38);
        doc.text('KS PHARMA NET', 14, 22);
        doc.save(`${returnNote.id}_credit_note.pdf`);
    }
  };

  useEffect(() => {
    const fetchReturnData = async () => {
        try {
            const { data } = await api.get(`/sales/returns/${id}`);
            if (data.success) {
                const ret = data.saleReturn;
                const sale = ret.saleId;
                
                // Populate returnNote with real data
                setReturnNote({
                    id: ret.returnNumber,
                    dbId: ret._id,
                    date: new Date(ret.createdAt).toLocaleDateString(),
                    originalInvoiceId: ret.invoiceNumber,
                    customer: ret.customerName || 'Walk-in',
                    contact: sale?.customerId?.phone || 'N/A',
                    address: sale?.customerId?.address || 'N/A',
                    reason: ret.reason || 'Not specified',
                    status: ret.status,
                    items: ret.items.map(item => ({
                        name: item.name,
                        qty: item.quantity,
                        rate: item.price,
                        tax: item.productId?.tax || 18,
                        subtotal: item.subtotal
                    })),
                    subtotal: ret.items.reduce((acc, item) => acc + (item.price * item.quantity), 0),
                    taxAmount: ret.totalAmount - ret.items.reduce((acc, item) => acc + (item.price * item.quantity), 0),
                    refundAmount: ret.totalAmount,
                    shop: data.shop
                });
            }
        } catch (error) {
            console.error("Error fetching return details:", error);
            Swal.fire('Error', 'Failed to load return details', 'error');
        }
    };

    if (id) fetchReturnData();
  }, [id]);

  if (!returnNote) return (
      <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 animate-fade-in print:p-0 print:bg-white">
      
      {/* Action Header - Hidden on Print */}
      <div className="max-w-4xl mx-auto mb-8 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
        <button 
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/sales/return');
              }
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300 hover:text-red-500 transition-colors bg-white dark:bg-gray-800 px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md font-bold active:scale-95"
        >
            <ArrowLeft size={18} strokeWidth={2.5} />
            <span className="uppercase text-xs tracking-widest">Back to List</span>
        </button>
        
        <div className="flex gap-3 w-full sm:w-auto">
            <button 
                onClick={handleDownloadPDF}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-all font-bold active:scale-95"
            >
                <Download size={18} strokeWidth={2.5} />
                <span className="uppercase text-xs tracking-widest">PDF</span>
            </button>
            <button 
                onClick={() => window.print()} 
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-red-600 text-white rounded-xl shadow-lg shadow-red-200 hover:shadow-red-300 hover:bg-red-700 transition-all font-black active:scale-95"
            >
                <Printer size={18} strokeWidth={3} />
                <span className="uppercase text-xs tracking-widest">Print Note</span>
            </button>
        </div>
      </div>

      {/* Invoice Card */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden print:shadow-none print:border-none print:rounded-none print:max-w-none print:w-full">
        
        {/* Top Branding Section */}
        <div className="bg-gradient-to-br from-red-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-100 dark:border-gray-700 p-6 md:p-12">
            <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
                <div className="flex flex-col gap-6 w-full lg:w-1/2">
                    <div className="bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm w-fit">
                        <img src="/KS2-Logo.png" alt="Logo" className="h-16 md:h-20 w-auto object-contain" />
                    </div>
                    <div className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{returnNote.shop?.shopName || 'KS Pharma Net'}</h2>
                        <div className="flex items-start gap-3">
                            <MapPin size={16} className="text-red-500 shrink-0 mt-0.5"/>
                            <span className="font-medium text-gray-600 dark:text-gray-300">{returnNote.shop?.address || '123, Health Avenue, Medical District'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone size={16} className="text-red-500 shrink-0"/>
                            <span className="font-bold text-gray-800 dark:text-gray-200">{returnNote.shop?.contactNumber || '+91 98765 43210'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Mail size={16} className="text-red-500 shrink-0"/>
                            <span className="font-medium">{returnNote.shop?.email || 'support@kspharma.com'}</span>
                        </div>
                    </div>
                </div>

                <div className="text-left lg:text-right w-full lg:w-auto lg:pt-0 pt-8 border-t lg:border-t-0 border-gray-100 dark:border-gray-700">
                    <h1 className="text-6xl md:text-8xl font-black text-red-500/5 dark:text-red-400/5 uppercase tracking-tighter leading-none mb-1 -mt-2 lg:block hidden">Return</h1>
                    <div className="flex flex-col lg:items-end">
                        <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-2">Credit Note No.</span>
                        <div className="text-3xl font-black text-gray-800 dark:text-white leading-none">#{returnNote.id}</div>
                        <div className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-widest">Ref: {returnNote.originalInvoiceId}</div>
                    </div>
                    
                    <div className="mt-8 flex flex-col lg:items-end gap-6">
                        <div className="flex flex-col lg:items-end">
                            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Scan & Verify</span>
                            <div className="bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg ring-4 ring-red-500/5">
                                <img src={qrCodeUrl} alt="Return QR" className="w-20 h-20 md:w-24 md:h-24 mix-blend-multiply dark:mix-blend-normal rounded-lg" />
                            </div>
                        </div>
                        <div className="flex flex-col lg:items-end gap-2">
                            <div className="px-4 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100 dark:border-red-900/30 shadow-sm">
                                 {returnNote.status}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 font-bold whitespace-nowrap">
                                ISSUED: <span className="text-gray-900 dark:text-white">{returnNote.date}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Details Section */}
        <div className="p-6 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div>
                <h3 className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-[0.2em] mb-4">Customer Details</h3>
                <div className="text-2xl font-black text-gray-900 dark:text-white mb-2">{returnNote.customer}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                    {returnNote.address}
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-200">
                    <Phone size={16} className="text-red-500" />
                    <span>{returnNote.contact}</span>
                </div>
            </div>
            
            <div className="lg:text-right pt-8 lg:pt-0 border-t lg:border-t-0 border-gray-100 dark:border-gray-700">
                 <h3 className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-[0.2em] mb-4">Return Reason</h3>
                 <div className="p-4 bg-red-50/50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30 inline-block max-w-md">
                    <p className="text-sm font-black text-red-800 dark:text-red-400 italic leading-relaxed">
                        "{returnNote.reason}"
                    </p>
                 </div>
            </div>
        </div>

        {/* Items Table */}
        <div className="px-6 md:px-12 pb-8 pt-8">
            <div className="border rounded-2xl overflow-hidden border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[700px] lg:min-w-0">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-200 font-black uppercase text-[10px] tracking-widest">
                                <th className="py-5 px-6 w-16 text-center">#</th>
                                <th className="py-5 px-6">Item Name</th>
                                <th className="py-5 px-6 text-center">Qty</th>
                                <th className="py-5 px-6 text-right">Rate</th>
                                <th className="py-5 px-6 text-right">Tax (GST)</th>
                                <th className="py-5 px-6 text-right">Total Refund</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {returnNote.items.map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                                    <td className="py-5 px-6 text-center text-gray-400 font-black italic">{index + 1}</td>
                                    <td className="py-5 px-6">
                                        <div className="font-bold text-gray-900 dark:text-white text-base">{item.name}</div>
                                        <div className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-0.5">HSN: 3004 / Returned Item</div>
                                    </td>
                                    <td className="py-5 px-6 text-center">
                                        <span className="bg-red-50 dark:bg-red-900/30 px-3 py-1 rounded-lg text-xs font-black text-red-700 dark:text-red-400">
                                            {item.qty < 10 ? `0${item.qty}` : item.qty}
                                        </span>
                                    </td>
                                    <td className="py-5 px-6 text-right font-bold text-gray-700 dark:text-gray-300">₹{item.rate.toFixed(2)}</td>
                                    <td className="py-5 px-6 text-right">
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{item.tax}% GST</span>
                                            <span className="font-bold text-gray-500 text-xs">₹{((item.qty * item.rate * item.tax)/100).toFixed(2)}</span>
                                        </div>
                                    </td>
                                    <td className="py-5 px-6 text-right">
                                        <span className="font-black text-red-600 dark:text-red-400 text-base">- ₹{(item.qty * item.rate * (1 + item.tax/100)).toFixed(2)}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Mobile Helper Text */}
            <p className="lg:hidden text-center text-[10px] text-gray-400 font-black uppercase tracking-widest mt-4 animate-pulse">
                ← Swipe to see full details →
            </p>
        </div>

        {/* Footer Summary */}
        <div className="bg-gray-50 dark:bg-gray-850 p-6 md:p-12 flex flex-col md:flex-row justify-end items-start gap-12 print:break-inside-avoid">
             <div className="flex-1 text-[10px] text-gray-400 dark:text-gray-500 space-y-3 max-w-sm uppercase tracking-widest leading-loose">
                <p className="font-black text-gray-900 dark:text-white text-xs">Declaration:</p>
                <p>We declare that this credit note shows the actual price of the goods returned and that all particulars are true and correct. This is a computer generated document.</p>
             </div>

             <div className="w-full md:w-80 space-y-6">
                <div className="space-y-3">
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest text-gray-400">
                        <span>Subtotal (Refund)</span>
                        <span className="text-gray-700 dark:text-gray-300">₹{returnNote.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest text-gray-400">
                        <span>Reversed Tax</span>
                        <span className="text-gray-700 dark:text-gray-300">₹{returnNote.taxAmount.toFixed(2)}</span>
                    </div>
                </div>
                
                <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-6 mt-4">
                    <div className="flex flex-col">
                        <span className="font-black text-gray-900 dark:text-white text-base uppercase tracking-tighter">Total Refund</span>
                        <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Credited to Account</span>
                    </div>
                    <span className="font-black text-red-600 dark:text-red-500 text-3xl tracking-tighter">- ₹{returnNote.refundAmount.toFixed(2)}</span>
                </div>
             </div>
        </div>
        
        {/* Print Only Footer - Signatures */}
        <div className="hidden print:flex justify-between items-end px-12 pb-12 mt-12">
            <div className="text-center">
                <div className="h-16 w-32 border-b border-gray-400 mb-2"></div>
                <p className="text-xs font-bold uppercase text-gray-600">Customer Signature</p>
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
              .text-red-500, .text-red-600, .text-red-700 {
                  color: #dc2626 !important;
              }
              .bg-red-50 {
                   background-color: #fef2f2 !important;
              }
              .overflow-hidden {
                  overflow: visible !important;
              }
              .p-8, .md\\:p-12 {
                  padding: 20px !important;
              }
          }
      `}</style>
    </div>
  );
};

export default ViewSalesReturn;
