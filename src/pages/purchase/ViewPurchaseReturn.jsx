import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import KS2Logo from '/KS2-Logo.png'; 
import api from '../../api/axios';

const ViewPurchaseReturn = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [returnNote, setReturnNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for auto-print param
  const autoPrint = searchParams.get('autoPrint') === 'true';

  useEffect(() => {
    const fetchReturn = async () => {
        try {
            const { data } = await api.get(`/purchase-returns/${id}`);
            if (data.success) {
                const r = data.purchaseReturn;
                
                // Calculate Tax Breakup
                const taxBreakup = {};
                let totalTaxable = 0;
                let totalGst = 0;
                
                const items = r.items.map(i => {
                    const product = i.productId || {};
                    const rate = i.purchasePrice || 0;
                    const qty = i.returnQuantity || 0;
                    const gstPercent = product.tax || 12; // Default if missing
                    
                    // Calculations
                    // Assuming purchasePrice is "Cost Per Unit Without Tax" based on typical B2B logic, 
                    // or if it includes tax, we need to reverse calc. 
                    // Usually in DB purchasePrice is unit cost. 
                    // Let's assume rate = taxable unit price.
                    
                    const amountWithoutTax = rate * qty;
                    const gstAmount = (amountWithoutTax * gstPercent) / 100;
                    const amountWithTax = amountWithoutTax + gstAmount;
                    
                    // Update Breakdown
                    if (!taxBreakup[gstPercent]) {
                        taxBreakup[gstPercent] = { taxable: 0, gst: 0 };
                    }
                    taxBreakup[gstPercent].taxable += amountWithoutTax;
                    taxBreakup[gstPercent].gst += gstAmount;
                    
                    totalTaxable += amountWithoutTax;
                    totalGst += gstAmount;

                    return {
                        skuId: product.sku || (product._id ? product._id.slice(-6).toUpperCase() : 'N/A'),
                        skuName: product.name || 'Unknown Item',
                        batch: i.batchNumber || 'N/A',
                        expiry: product.expiry || 'N/A', // Purchase return item might not have specific expiry stored, fallback to product
                        qty: qty,
                        mrp: product.mrp || 0,
                        discount: 0, // Not typically stored in return unless specified
                        costPerUnit: rate,
                        gstPercent: gstPercent,
                        amountWithoutTax: amountWithoutTax,
                        amountWithTax: amountWithTax,
                        reason: r.reason || 'N/A',
                        invoiceNumber: r.purchaseId?.invoiceNumber || 'N/A'
                    };
                });

                setReturnNote({
                    id: r.returnNumber,
                    date: new Date(r.createdAt).toLocaleDateString(),
                    supplier: {
                        name: r.supplierId?.name || 'Unknown Supplier',
                        address: r.supplierId?.address || 'N/A',
                        gst: r.supplierId?.gstNumber || 'N/A',
                        dl: r.supplierId?.drugLicenseNumber || 'N/A'
                    },
                    items: items,
                    taxBreakup: taxBreakup,
                    totalTaxable: totalTaxable,
                    totalGst: totalGst,
                    totalAmount: r.totalAmount, // Should match calculated amountWithTax total
                    company: {
                        name: 'KS Pharma Net Solutions Pvt. Ltd.',
                        gst: '09AAAFCD7691C1ZH',
                        dl: '20,RLF20UP2025001485,21B,WLF21B',
                        address: '123, Health Avenue, Okhla Industrial Area, Phase-I, New Delhi-110020'
                    }
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

  useEffect(() => {
    if (!loading && returnNote && autoPrint) {
        setTimeout(() => {
            window.print();
        }, 1000);
    }
  }, [loading, returnNote, autoPrint]);

  const handleDownloadPDF = async () => {
      const input = document.getElementById('debit-note-content');
      if (!input) return;

      try {
          const clone = input.cloneNode(true);
          clone.style.width = '210mm'; 
          clone.style.minHeight = '297mm'; 
          clone.style.position = 'absolute';
          clone.style.left = '-9999px';
          clone.style.top = '0';
          clone.style.background = 'white';
          document.body.appendChild(clone);

          const canvas = await html2canvas(clone, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
          document.body.removeChild(clone);

          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`DebitNote_${returnNote.id}.pdf`);
      } catch (err) {
          console.error("PDF generation failed:", err);
      }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div></div>;
  if (error) return <div className="text-center text-red-500 mt-20 font-bold">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white text-black font-sans">
      
      {/* Header Actions */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-black font-semibold">
            <ArrowLeft size={18} /> Back
        </button>
        <div className="flex gap-2">
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 font-semibold shadow-sm">
                <Download size={16} /> PDF
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold shadow-sm">
                <Printer size={16} /> Print
            </button>
        </div>
      </div>

      {/* A4 Sheet */}
      <div id="debit-note-content" className="w-[210mm] min-h-[297mm] mx-auto bg-white p-6 shadow-xl print:shadow-none print:w-full print:p-4 text-[10px] leading-tight border border-black print:border-none box-border relative">
          
          {/* Header */}
          <div className="text-center mb-4">
              <div className="font-bold text-xs uppercase tracking-wide mb-1">PURCHASE RETURN MEMO</div>
              <div className="flex items-center justify-center gap-3 mb-2">
                   {/* Logo Placeholder - assuming same logo as invoice */}
                   <img src={KS2Logo} alt="Logo" className="h-10 object-contain" />
              </div>
              <h1 className="text-lg font-bold uppercase">{returnNote.company.name}</h1>
              <div className="text-[9px] mt-1">
                  <div><strong>GST No.:</strong> {returnNote.company.gst}</div>
                  <div><strong>DL No.:</strong> {returnNote.company.dl}</div>
                  <div>{returnNote.company.address}</div>
              </div>
          </div>

          <div className="mb-4">
             <div className="grid grid-cols-2 gap-4">
                 <div>
                     <div className="font-bold">Purchase Return Number : <span className="font-normal">{returnNote.id}</span></div>
                     <div className="font-bold">Purchase Return Date : <span className="font-normal">{returnNote.date}</span></div>
                 </div>
             </div>
             <div className="mt-2">
                 <div className="font-bold">Supplier Name : <span className="font-normal">{returnNote.supplier.name}</span></div>
                 <div className="font-bold">Address : <span className="font-normal">{returnNote.supplier.address}</span></div>
                 <div className="font-bold">GST No : <span className="font-normal">{returnNote.supplier.gst}</span></div>
                 <div className="font-bold">DL No : <span className="font-normal">{returnNote.supplier.dl}</span></div>
             </div>
          </div>
          
          <div className="border-t border-black mb-1"></div>
          
          {/* Items Table */}
          <table className="w-full border-collapse border border-black mb-4">
              <thead>
                  <tr className="bg-gray-100 text-[8px] font-bold text-center">
                      <th className="border border-black p-1 w-[3%]">Sr. No.</th>
                      <th className="border border-black p-1 w-[8%]">SKU ID</th>
                      <th className="border border-black p-1 w-[15%] text-left">SKU Name</th>
                      <th className="border border-black p-1 w-[8%]">Batch No.</th>
                      <th className="border border-black p-1 w-[6%]">Expiry Date</th>
                      <th className="border border-black p-1 w-[5%]">Qty</th>
                      <th className="border border-black p-1 w-[6%] text-right">MRP</th>
                      <th className="border border-black p-1 w-[5%]">Dis% to Supplier</th>
                      <th className="border border-black p-1 w-[8%] text-right">Cost Per Unit Without Tax</th>
                      <th className="border border-black p-1 w-[4%]">GST%</th>
                      <th className="border border-black p-1 w-[8%] text-right">Amount Without Tax</th>
                      <th className="border border-black p-1 w-[8%] text-right">Amount With Tax</th>
                      <th className="border border-black p-1 w-[5%]">TCS%</th>
                      <th className="border border-black p-1 w-[5%]">Amount With TCS</th>
                      <th className="border border-black p-1 w-[8%]">Reason</th>
                      <th className="border border-black p-1 w-[8%]">Invoice Number</th>
                  </tr>
              </thead>
              <tbody>
                  {returnNote.items.map((item, idx) => (
                      <tr key={idx} className="text-[9px]">
                          <td className="border border-black p-1 text-center">{idx + 1}</td>
                          <td className="border border-black p-1 text-center">{item.skuId}</td>
                          <td className="border border-black p-1 text-left">{item.skuName}</td>
                          <td className="border border-black p-1 text-center">{item.batch}</td>
                          <td className="border border-black p-1 text-center">{item.expiry !== 'N/A' ? new Date(item.expiry).toLocaleDateString() : '-'}</td>
                          <td className="border border-black p-1 text-center">{item.qty}</td>
                          <td className="border border-black p-1 text-right">{item.mrp.toFixed(2)}</td>
                          <td className="border border-black p-1 text-center">{item.discount}</td>
                          <td className="border border-black p-1 text-right">{item.costPerUnit.toFixed(2)}</td>
                          <td className="border border-black p-1 text-center">{item.gstPercent}</td>
                          <td className="border border-black p-1 text-right">{item.amountWithoutTax.toFixed(2)}</td>
                          <td className="border border-black p-1 text-right">{item.amountWithTax.toFixed(2)}</td>
                          <td className="border border-black p-1 text-center">0.0</td>
                          <td className="border border-black p-1 text-center">{item.amountWithTax.toFixed(2)}</td>
                          <td className="border border-black p-1 text-center text-[8px] leading-tight">{item.reason}</td>
                          <td className="border border-black p-1 text-center">{item.invoiceNumber}</td>
                      </tr>
                  ))}
                  {/* Empty rows filler if needed, but usually not strictly required unless fixed height */}
              </tbody>
          </table>

          {/* Footer - Tax Breakup & Summaries */}
          <div className="flex border border-black text-[9px]">
              {/* Tax Breakup Table */}
              <div className="w-[65%] border-r border-black">
                  <table className="w-full text-center border-collapse">
                      <thead>
                          <tr className="border-b border-black font-bold bg-gray-50">
                              <th className="border-r border-black p-1 text-left px-2">GST %</th>
                              <th className="border-r border-black p-1 text-left px-2">TAXABLE</th>
                              <th className="border-r border-black p-1 text-left px-2">CGST</th>
                              <th className="border-r border-black p-1 text-left px-2">SGST</th>
                              <th className="p-1 px-2 text-left">IGST</th>
                          </tr>
                      </thead>
                      <tbody>
                          {Object.entries(returnNote.taxBreakup).map(([rate, data]) => (
                            <tr key={rate} className="border-b border-black last:border-0 hover:bg-gray-50">
                                <td className="border-r border-black p-1 text-left px-2 font-bold">{rate}%</td>
                                <td className="border-r border-black p-1 text-left px-2">{data.taxable.toFixed(2)}</td>
                                <td className="border-r border-black p-1 text-left px-2">{(data.gst / 2).toFixed(2)}</td>
                                <td className="border-r border-black p-1 text-left px-2">{(data.gst / 2).toFixed(2)}</td>
                                <td className="p-1 text-left px-2">0.00</td>
                            </tr>
                          ))}
                           {/* Empty rows to fill space matching the image look approximately */}
                           <tr className="border-b border-black h-4"><td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td></td></tr>
                      </tbody>
                  </table>
              </div>
              
              {/* Grand Totals */}
              <div className="w-[35%]">
                   <div className="flex justify-between p-1 px-2">
                       <span className="text-gray-600">Taxable Amount:</span>
                       <span className="font-bold">{returnNote.totalTaxable.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between p-1 px-2">
                       <span className="text-gray-600">GST:</span>
                       <span className="font-bold">{returnNote.totalGst.toFixed(2)}</span>
                   </div>
                    <div className="flex justify-between p-1 px-2 border-b border-gray-200">
                       <span className="text-gray-600">Amount With Tax:</span>
                       <span className="font-bold">{(returnNote.totalTaxable + returnNote.totalGst).toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between p-1 px-2">
                       <span className="text-gray-600">Total TCS:</span>
                       <span className="font-bold">0.0</span>
                   </div>
                   <div className="flex justify-between p-1 px-2">
                       <span className="text-gray-600">Amount With TCS:</span>
                       <span className="font-bold">{(returnNote.totalTaxable + returnNote.totalGst).toFixed(2)}</span>
                   </div>
                   
                   <div className="flex justify-between p-2 mt-2 bg-gray-100 font-bold border-t border-black text-xs">
                       <span>Invoice Total:</span>
                       <span>{Math.round(returnNote.totalAmount).toLocaleString()}</span>
                   </div>
              </div>
          </div>
          
          <div className="mt-8 flex justify-between px-4">
              <div className="text-center">
                  <div className="h-10 border-b border-black w-32 mb-1"></div>
                  <div className="font-bold">Checked By</div>
              </div>
              <div className="text-center">
                  <div className="h-10 border-b border-black w-32 mb-1"></div>
                  <div className="font-bold">Authorized Signatory</div>
              </div>
          </div>

      </div>

      <style>{`
          @media print {
              @page { margin: 10mm; }
              body { background: white; }
              #debit-note-content { 
                  margin: 0;
                  box-shadow: none;
                  border: none;
                  width: 100%;
              }
              button { display: none; }
          }
      `}</style>
    </div>
  );
};

export default ViewPurchaseReturn;
