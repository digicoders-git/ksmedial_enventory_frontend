import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Mail, Printer, ArrowLeft, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import KS2Logo from '/KS2-Logo.png'; 

const ViewSalesReturn = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [returnNote, setReturnNote] = useState(null);

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
        const tableColumn = ["#", "Item Name", "Ret Qty", "Rate", "Tax", "Total"];
        const tableRows = returnNote.items.map((item, index) => [
            index + 1,
            item.name,
            item.qty,
            `Rs. ${item.rate.toFixed(2)}`,
            `${item.tax}%`,
            `Rs. ${(item.qty * item.rate * (1 + item.tax/100)).toFixed(2)}`
        ]);

        autoTable(doc, {
            startY: 125,
            head: [tableColumn],
            body: tableRows,
            theme: 'striped',
            headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
            bodyStyles: { fontSize: 9 },
            columnStyles: {
                0: { halign: 'center' },
                2: { halign: 'center' },
                3: { halign: 'right' },
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
    
    // Fallback if image fails to load
    img.onerror = () => {
        doc.setFontSize(22);
        doc.setTextColor(220, 38, 38);
        doc.text('KS PHARMA NET', 14, 22);
        doc.save(`${returnNote.id}_credit_note.pdf`);
    }
  };

  useEffect(() => {
    // Mock Fetch - Simulate fetching return data
    setTimeout(() => {
        setReturnNote({
            id: id || 'RET-2024-001',
            date: '2024-01-28',
            originalInvoiceId: 'INV-2024-001',
            customer: 'Rahul Sharma',
            contact: '+91 98765 43210',
            address: 'Sector 45, Near City Hospital, Mumbai, Maharashtra - 400001',
            reason: 'Expired Medicine',
            status: 'Refunded',
            items: [
                { name: 'Dolo 650mg Tablet', qty: 2, rate: 30, tax: 18 },
                { name: 'Azithral 500mg', qty: 1, rate: 120, tax: 18 },
            ],
            subtotal: 180,
            taxAmount: 32.4,
            refundAmount: 212.4
        });
    }, 500);
  }, [id]);

  if (!returnNote) return (
      <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 animate-fade-in print:p-0 print:bg-white">
      
      {/* Action Header - Hidden on Print */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm hover:shadow-md"
        >
            <ArrowLeft size={18} /> Back to List
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
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:shadow-lg hover:bg-red-700 transition-all"
            >
                <Printer size={18} /> Print Credit Note
            </button>
        </div>
      </div>

      {/* Invoice Card */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden print:shadow-none print:border-none print:rounded-none print:max-w-none print:w-full">
        
        {/* Top Branding Section */}
        <div className="bg-gradient-to-r from-red-50 to-white border-b border-gray-100 p-8 md:p-12">
            <div className="flex flex-col md:flex-row justify-between items-start gap-8">
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
                    <h1 className="text-4xl font-black text-red-500 uppercase tracking-tight leading-none mb-2">Credit Note</h1>
                    <div className="text-xl font-bold text-gray-800">#{returnNote.id}</div>
                    <div className="text-sm text-gray-500 mt-1">Ref Invoice: <span className="font-bold text-gray-900">{returnNote.originalInvoiceId}</span></div>
                    
                    <div className="mt-6 flex flex-col items-end gap-2">
                        <div className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase border border-red-100 inline-block">
                             {returnNote.status}
                        </div>
                        <div className="text-sm text-gray-500 font-medium">
                            Date: <span className="text-gray-900 font-bold">{returnNote.date}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Details Section */}
        <div className="p-8 md:p-12 grid md:grid-cols-2 gap-12">
            <div>
                <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-4">Customer Details</h3>
                <div className="text-lg font-bold text-gray-900 mb-2">{returnNote.customer}</div>
                <div className="text-sm text-gray-500 leading-relaxed max-w-xs">{returnNote.address}</div>
                <div className="mt-3 text-sm font-medium text-gray-700">Tel: {returnNote.contact}</div>
            </div>
            
            <div className="md:text-right">
                 <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-4">Return Reason</h3>
                 <div className="text-sm font-medium text-gray-800 bg-gray-50 p-3 rounded-lg inline-block border border-gray-200">
                    "{returnNote.reason}"
                 </div>
            </div>
        </div>

        {/* Items Table */}
        <div className="px-8 md:px-12 pb-8">
            <div className="border rounded-xl overflow-hidden border-gray-200">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-900 font-bold uppercase text-xs tracking-wider">
                            <th className="py-4 px-6 w-16 text-center">#</th>
                            <th className="py-4 px-6 w-1/3">Item Name</th>
                            <th className="py-4 px-6 text-center">Returned Qty</th>
                            <th className="py-4 px-6 text-right">Rate</th>
                            <th className="py-4 px-6 text-right">Tax</th>
                            <th className="py-4 px-6 text-right">Total Refund</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {returnNote.items.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                <td className="py-4 px-6 text-center text-gray-500 font-medium">{index + 1}</td>
                                <td className="py-4 px-6 font-semibold text-gray-800">{item.name}</td>
                                <td className="py-4 px-6 text-center text-gray-600 font-medium">{item.qty}</td>
                                <td className="py-4 px-6 text-right text-gray-600">₹{item.rate.toFixed(2)}</td>
                                <td className="py-4 px-6 text-right text-xs text-gray-500 flex flex-col items-end gap-1">
                                    <span>{item.tax}% GST</span>
                                    <span className="text-gray-400">₹{((item.qty * item.rate * item.tax)/100).toFixed(2)}</span>
                                </td>
                                <td className="py-4 px-6 text-right font-bold text-red-600">- ₹{(item.qty * item.rate * (1 + item.tax/100)).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Footer Summary */}
        <div className="bg-gray-50 p-8 md:p-12 flex flex-col md:flex-row justify-end items-start gap-12 print:break-inside-avoid">
             <div className="flex-1 text-xs text-gray-500 space-y-2 max-w-sm">
                <p className="font-bold text-gray-900 text-sm">Declaration:</p>
                <p>We declare that this credit note shows the actual price of the goods returned and that all particulars are true and correct.</p>
             </div>

             <div className="w-full md:w-80 space-y-4">
                <div className="flex justify-between text-sm text-gray-600">
                    <span className="font-medium">Subtotal (Refund)</span>
                    <span>₹{returnNote.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                    <span className="font-medium">Reversed Tax</span>
                    <span>₹{returnNote.taxAmount.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between border-t border-gray-200 pt-4 mt-2">
                    <div className="flex flex-col">
                        <span className="font-black text-gray-900 text-lg">Total Refund</span>
                        <span className="text-xs text-gray-500 font-normal">Credited to customer account</span>
                    </div>
                    <span className="font-black text-red-600 text-2xl">- ₹{returnNote.refundAmount.toFixed(2)}</span>
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
