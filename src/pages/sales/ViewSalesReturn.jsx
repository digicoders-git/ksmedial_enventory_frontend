import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Download, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import KS2Logo from '/KS2-Logo.png'; 
import api from '../../api/axios';

const ViewSalesReturn = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [returnNote, setReturnNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReturnData = async () => {
        try {
            const { data } = await api.get(`/sales/returns/${id}`);
            if (data.success) {
                const ret = data.saleReturn;
                const sale = ret.saleId || {};
                const customer = sale.customerId || {};
                
                // Calculate Tax Breakup
                const taxBreakup = {};
                let totalTaxable = 0;
                let totalGst = 0;
                
                const items = ret.items.map(i => {
                    const product = i.productId || {};
                    const rate = i.price || 0;
                    const qty = i.quantity || 0;
                    const gstPercent = i.tax || product.tax || 12;
                    
                    const amountWithoutTax = rate * qty;
                    const gstAmount = (amountWithoutTax * gstPercent) / 100;
                    const amountWithTax = amountWithoutTax + gstAmount;
                    
                    if (!taxBreakup[gstPercent]) {
                        taxBreakup[gstPercent] = { taxable: 0, gst: 0 };
                    }
                    taxBreakup[gstPercent].taxable += amountWithoutTax;
                    taxBreakup[gstPercent].gst += gstAmount;
                    
                    totalTaxable += amountWithoutTax;
                    totalGst += gstAmount;

                    return {
                        skuId: product.sku || product.barcode || (product._id ? product._id.slice(-6).toUpperCase() : 'N/A'),
                        skuName: i.name || product.name || 'Unknown Item',
                        batch: i.batchNumber || product.batchNumber || 'N/A',
                        expiry: product.expiryDate || 'N/A',
                        qty: qty,
                        mrp: product.sellingPrice || i.price || 0,
                        rate: rate,
                        gstPercent: gstPercent,
                        amountWithoutTax: amountWithoutTax,
                        amountWithTax: amountWithTax,
                        invoiceNumber: ret.invoiceNumber
                    };
                });

                setReturnNote({
                    id: ret.returnNumber,
                    date: new Date(ret.createdAt).toLocaleDateString(),
                    customer: {
                        name: ret.customerName || customer.name || 'Walk-in Customer',
                        address: customer.address || 'N/A',
                        phone: customer.phone || 'N/A',
                        gst: customer.gstNumber || 'N/A'
                    },
                    items: items,
                    taxBreakup: taxBreakup,
                    totalTaxable: totalTaxable,
                    totalGst: totalGst,
                    totalAmount: ret.totalAmount,
                    reason: ret.reason || 'N/A',
                    invoiceFile: ret.invoiceFile,
                    shop: data.shop || {
                        shopName: 'KS Pharma Net Solutions Pvt. Ltd.',
                        address: '123, Health Avenue, Medical District',
                        contactNumber: '+91 98765 43210',
                        email: 'support@kspharma.com'
                    }
                });
            } else {
                setError("Sales Return not found");
            }
        } catch (err) {
            setError("Failed to load Sales Return details");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (id) fetchReturnData();
  }, [id]);

  const handleDownloadPDF = async () => {
      const input = document.getElementById('credit-note-content');
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
          pdf.save(`CreditNote_${returnNote.id}.pdf`);
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
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 font-semibold shadow-sm text-sm">
                <Download size={16} /> PDF
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold shadow-sm text-sm">
                <Printer size={16} /> Print
            </button>
            {returnNote.invoiceFile && (
                <a
                    href={`${api.defaults.baseURL?.replace('/api','') || ''}${returnNote.invoiceFile}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold shadow-sm text-sm"
                >
                    <FileText size={16} /> View Attachment
                </a>
            )}
        </div>
      </div>

      {/* A4 Sheet */}
      <div id="credit-note-content" className="w-[210mm] min-h-[297mm] mx-auto bg-white p-6 shadow-xl print:shadow-none print:w-full print:p-4 text-[10px] leading-tight border border-black print:border-none box-border relative">
          
          {/* Header */}
          <div className="text-center mb-4">
              <div className="font-bold text-xs uppercase tracking-wide mb-1">SALES RETURN MEMO (CREDIT NOTE)</div>
              <div className="flex items-center justify-center gap-3 mb-2">
                   <img src={KS2Logo} alt="Logo" className="h-10 object-contain" />
              </div>
              <h1 className="text-lg font-bold uppercase">{returnNote.shop.shopName}</h1>
              <div className="text-[9px] mt-1 space-y-0.5">
                  <div>{returnNote.shop.address}</div>
                  <div><strong>Phone:</strong> {returnNote.shop.contactNumber} | <strong>Email:</strong> {returnNote.shop.email}</div>
                  {returnNote.shop.gstNumber && <div><strong>GST No.:</strong> {returnNote.shop.gstNumber}</div>}
              </div>
          </div>

          <div className="mb-4">
             <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                     <div className="font-bold">Return Number : <span className="font-normal">{returnNote.id}</span></div>
                     <div className="font-bold">Return Date : <span className="font-normal">{returnNote.date}</span></div>
                     <div className="font-bold">Original Invoice : <span className="font-normal">{returnNote.items[0]?.invoiceNumber || 'N/A'}</span></div>
                 </div>
                 <div className="text-right">
                    <div className="inline-block p-1 px-3 border border-red-500 text-red-600 font-bold uppercase rounded-md">
                        {returnNote.reason}
                    </div>
                 </div>
             </div>
             <div className="mt-3 p-2 bg-gray-50 border border-gray-100 rounded">
                 <div className="font-bold border-b border-gray-200 pb-1 mb-1 uppercase text-[9px]">Customer Details</div>
                 <div className="font-bold">Name : <span className="font-normal">{returnNote.customer.name}</span></div>
                 <div className="font-bold">Address : <span className="font-normal">{returnNote.customer.address}</span></div>
                 <div className="font-bold">Phone : <span className="font-normal">{returnNote.customer.phone}</span></div>
                 {returnNote.customer.gst !== 'N/A' && <div className="font-bold">GST No : <span className="font-normal">{returnNote.customer.gst}</span></div>}
             </div>
          </div>
          
          <div className="border-t border-black mb-1"></div>
          
          {/* Items Table */}
          <table className="w-full border-collapse border border-black mb-4">
              <thead>
                  <tr className="bg-gray-100 text-[8px] font-bold text-center">
                      <th className="border border-black p-1 w-[4%]">Sr.No.</th>
                      <th className="border border-black p-1 w-[12%]">SKU ID</th>
                      <th className="border border-black p-1 w-[25%] text-left">Item Description</th>
                      <th className="border border-black p-1 w-[10%]">Batch</th>
                      <th className="border border-black p-1 w-[8%]">Exp.</th>
                      <th className="border border-black p-1 w-[6%]">Qty</th>
                      <th className="border border-black p-1 w-[8%] text-right">MRP</th>
                      <th className="border border-black p-1 w-[10%] text-right">Rate</th>
                      <th className="border border-black p-1 w-[5%]">GST%</th>
                      <th className="border border-black p-1 w-[12%] text-right">Amount</th>
                  </tr>
              </thead>
              <tbody>
                  {returnNote.items.map((item, idx) => (
                      <tr key={idx} className="text-[9px]">
                          <td className="border border-black p-1 text-center">{idx + 1}</td>
                          <td className="border border-black p-1 text-center">{item.skuId}</td>
                          <td className="border border-black p-1 text-left">{item.skuName}</td>
                          <td className="border border-black p-1 text-center">{item.batch}</td>
                          <td className="border border-black p-1 text-center">
                              {item.expiry !== 'N/A' ? new Date(item.expiry).toLocaleDateString('en-GB', { month: '2-digit', year: '2-digit' }) : '-'}
                          </td>
                          <td className="border border-black p-1 text-center font-bold">{item.qty}</td>
                          <td className="border border-black p-1 text-right">{item.mrp.toFixed(2)}</td>
                          <td className="border border-black p-1 text-right">{item.rate.toFixed(2)}</td>
                          <td className="border border-black p-1 text-center">{item.gstPercent}</td>
                          <td className="border border-black p-1 text-right font-bold">{item.amountWithTax.toFixed(2)}</td>
                      </tr>
                  ))}
              </tbody>
          </table>

          {/* Footer - Tax Breakup & Summaries */}
          <div className="flex border border-black text-[9px]">
              {/* Tax Breakup Table */}
              <div className="w-[60%] border-r border-black">
                  <table className="w-full text-center border-collapse">
                      <thead>
                          <tr className="border-b border-black font-bold bg-gray-50">
                              <th className="border-r border-black p-1 text-left px-2">GST %</th>
                              <th className="border-r border-black p-1 text-right px-2">Taxable Value</th>
                              <th className="border-r border-black p-1 text-right px-2">CGST</th>
                              <th className="border-r border-black p-1 text-right px-2">SGST</th>
                              <th className="p-1 px-2 text-right">Total Tax</th>
                          </tr>
                      </thead>
                      <tbody>
                          {Object.entries(returnNote.taxBreakup).map(([rate, data]) => (
                            <tr key={rate} className="border-b border-black last:border-0">
                                <td className="border-r border-black p-1 text-left px-2 font-bold">{rate}%</td>
                                <td className="border-r border-black p-1 text-right px-2">{data.taxable.toFixed(2)}</td>
                                <td className="border-r border-black p-1 text-right px-2">{(data.gst / 2).toFixed(2)}</td>
                                <td className="border-r border-black p-1 text-right px-2">{(data.gst / 2).toFixed(2)}</td>
                                <td className="p-1 text-right px-2 font-bold">{data.gst.toFixed(2)}</td>
                            </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
              
              {/* Grand Totals */}
              <div className="w-[40%] bg-white">
                   <div className="flex justify-between p-1.5 px-3 border-b border-gray-100">
                       <span className="text-gray-600">Total Taxable Amount:</span>
                       <span className="font-bold">₹{returnNote.totalTaxable.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between p-1.5 px-3 border-b border-gray-100">
                       <span className="text-gray-600">Total GST Amount:</span>
                       <span className="font-bold">₹{returnNote.totalGst.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between p-2 px-3 bg-red-50 font-black text-red-700 text-xs mt-auto">
                       <span className="uppercase">Net Refund Amount:</span>
                       <span>₹{Math.round(returnNote.totalAmount).toLocaleString()}</span>
                   </div>
                   <div className="p-1 text-[8px] text-gray-400 text-center italic">
                       (Amount in words: {returnNote.totalAmount.toFixed(0)} only)
                   </div>
              </div>
          </div>
          
          <div className="mt-8 flex justify-between px-10">
              <div className="text-center">
                  <div className="h-12 border-b border-black w-32 mb-1"></div>
                  <div className="font-bold text-[9px] uppercase">Customer's Signature</div>
              </div>
              <div className="text-center">
                  <div className="font-bold text-[8px] mb-8">For {returnNote.shop.shopName}</div>
                  <div className="h-0 border-b border-black w-40 mb-1"></div>
                  <div className="font-bold text-[9px] uppercase">Authorized Signatory</div>
              </div>
          </div>

          {/* Declaration */}
          <div className="absolute bottom-6 left-6 right-6 text-[7px] text-gray-400 border-t border-gray-100 pt-2 flex justify-between">
              <span>This is a computer generated document and does not require a physical signature.</span>
              <span>Page 1 of 1</span>
          </div>

      </div>

      <style>{`
          @media print {
              @page { margin: 5mm; }
              body { background: white; }
              #credit-note-content { 
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

export default ViewSalesReturn;
