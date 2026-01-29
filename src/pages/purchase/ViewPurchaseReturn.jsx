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
        // Logo
        doc.addImage(img, 'PNG', 14, 10, 45, 20);

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
        
        // Ref Invoice
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Ref Invoice: ${returnNote.invoiceRef}`, pageWidth - 14, 48, { align: 'right' });
        doc.text(`Date: ${returnNote.date}`, pageWidth - 14, 54, { align: 'right' });

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
    };
    
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
      <div className="max-w-4xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <button 
            onClick={() => navigate('/purchase/return')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm hover:shadow-md"
        >
            <ArrowLeft size={18} /> Back to Returns
        </button>
        
        <div className="flex gap-2">
            <button 
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm transition-all"
            >
                <Download size={18} /> Download PDF
            </button>
            <button 
                onClick={() => window.print()} 
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:shadow-lg hover:bg-red-700 transition-all font-medium"
            >
                <Printer size={18} /> Print Debit Note
            </button>
        </div>
      </div>

      {/* Invoice Card */}
      <div id="printable-content" className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden print:shadow-none print:border-none print:rounded-none print:max-w-none print:w-full">
        
        {/* Top Branding Section */}
        <div className="bg-gradient-to-r from-red-50/50 to-white border-b border-gray-100 p-8 md:p-12 relative overflow-hidden print:p-8">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none select-none print:opacity-5">
                <FileText size={400} />
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start gap-8 relative z-10">
                <div className="flex flex-col gap-4">
                    <img src="/KS2-Logo.png" alt="Logo" className="h-20 w-auto object-contain" />
                    <div className="space-y-1.5 text-sm text-gray-500">
                        <h2 className="text-xl font-bold text-gray-900">KS Pharma Net</h2>
                        <div className="flex items-center gap-2"><MapPin size={14} className="text-red-500"/> 123, Health Avenue, Medical District</div>
                        <div className="flex items-center gap-2"><Phone size={14} className="text-red-500"/> +91 98765 43210</div>
                        <div className="flex items-center gap-2"><Mail size={14} className="text-red-500"/> support@kspharma.com</div>
                    </div>
                </div>

                <div className="text-right w-full md:w-auto">
                    <h1 className="text-5xl font-black text-gray-900/10 uppercase tracking-tight leading-none mb-2 print:text-4xl">Debit Note</h1>
                    <div className="text-3xl font-bold text-red-600">#{returnNote.id}</div>
                    
                    <div className="mt-6 flex flex-col items-end gap-2">
                         <div className="px-3 py-1 rounded-lg bg-red-50 text-red-700 border border-red-100 text-xs font-bold uppercase inline-block print:border-red-500 print:text-red-600">
                             Return
                        </div>
                        <div className="text-sm text-gray-500 font-medium">
                            Date: <span className="text-gray-900 font-bold">{returnNote.date}</span>
                        </div>
                        <div className="text-sm text-gray-500 font-medium">
                            Ref Invoice: <span className="text-gray-900 font-bold">{returnNote.invoiceRef}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Details Section */}
        <div className="p-8 md:p-12 grid md:grid-cols-2 gap-12 print:p-8 print:gap-8">
            <div>
                <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-4 flex items-center gap-2">
                    <Truck size={14} /> To Supplier
                </h3>
                <div className="text-lg font-bold text-gray-900 mb-2">{returnNote.supplier}</div>
                <div className="text-sm text-gray-500 leading-relaxed max-w-xs">{returnNote.address}</div>
                <div className="mt-3 text-sm font-medium text-gray-700">Tel: {returnNote.contact}</div>
                <div className="text-sm font-medium text-gray-700">GST: {returnNote.gst}</div>
            </div>
            
            <div className="md:text-right">
                 <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-4">Terms & Reason</h3>
                 <div className="space-y-2 text-sm max-w-xs ml-auto text-right">
                    <p className="text-gray-600 italic">"{returnNote.reason}"</p>
                 </div>
            </div>
        </div>

        {/* Items Table */}
        <div className="px-8 md:px-12 pb-8 print:px-8">
            <div className="border rounded-xl overflow-hidden border-gray-200 print:border-black">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-900 font-bold uppercase text-xs tracking-wider print:bg-gray-100 print:text-black">
                            <th className="py-4 px-6 w-16 text-center">#</th>
                            <th className="py-4 px-6 w-1/3">Item Name</th>
                            <th className="py-4 px-6 text-center">Batch</th>
                            <th className="py-4 px-6 text-center">Ret. Qty</th>
                            <th className="py-4 px-6 text-right">Rate</th>
                            <th className="py-4 px-6 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 print:divide-gray-300">
                        {returnNote.items.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50/50 transition-colors print:bg-white">
                                <td className="py-4 px-6 text-center text-gray-500 font-medium print:text-black">{index + 1}</td>
                                <td className="py-4 px-6 font-semibold text-gray-800 print:text-black">{item.name}</td>
                                <td className="py-4 px-6 text-center text-gray-600 font-mono text-xs print:text-black">{item.batch || '-'}</td>
                                <td className="py-4 px-6 text-center text-red-600 font-bold print:text-black">{item.qty}</td>
                                <td className="py-4 px-6 text-right text-gray-600 print:text-black">₹{item.rate.toFixed(2)}</td>
                                <td className="py-4 px-6 text-right font-bold text-gray-900 print:text-black">₹{item.amount.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Footer Summary */}
        <div className="bg-gray-50 p-8 md:p-12 flex flex-col md:flex-row justify-end items-center gap-12 print:break-inside-avoid print:bg-white print:p-8">
             <div className="flex-1 text-xs text-gray-400 space-y-2 max-w-sm print:text-gray-600">
                <p>Note: This debit note acknowledges the return of goods. The amount will be adjusted against future invoices or refunded as per agreement.</p>
             </div>

             <div className="w-full md:w-80 space-y-4">
                <div className="flex justify-between border-t border-gray-200 pt-4 mt-2 print:border-black">
                    <div className="flex flex-col">
                        <span className="font-black text-gray-900 text-lg print:text-black">Total Refund</span>
                        <span className="text-xs text-gray-500 font-normal print:text-gray-600">Credited to Account</span>
                    </div>
                    <span className="font-black text-red-600 text-2xl print:text-black">₹{returnNote.totalAmount.toFixed(2)}</span>
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
