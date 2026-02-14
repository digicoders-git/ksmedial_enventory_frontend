import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../../api/axios';
import { QRCodeCanvas } from 'qrcode.react';

// Utility to convert number to words (Simplified for Indian Currency)
const numberToWords = (num) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const format = (n) => {
        if (n < 20) return a[n];
        const digit = n % 10;
        if (n < 100) return b[Math.floor(n / 10)] + (digit ? '-' + a[digit] : ' ');
        if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 === 0 ? '' : 'and ' + format(n % 100));
        return format(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? format(n % 1000) : '');
    };
    
    if (num === 0) return "Zero ";
    return "Rupees " + format(Math.floor(num)) + "Only"; 
};

const ViewPurchaseOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/purchase-orders/${id}`);
            if (data) {
                // If the backend returns the order directly or wrapped
                const orderData = data.order || data; 
                
                // Fetch Supplier details if needed (assuming partial details in order)
                // For now, we rely on what's in the order object or what we can display
                
                setOrder(orderData);
            }
        } catch (error) {
            console.error("Error fetching order:", error);
        } finally {
            setLoading(false);
        }
    };
    fetchOrder();
  }, [id]);

  const handleDownloadCSV = () => {
        if (!order) return;
        const csvRows = [];
        // Header
        csvRows.push("SR,Product Name,SKU,Supplier,Quantity");
        
        order.items.forEach((item, idx) => {
            const supplierName = item.supplier?.name || '-';
            const sku = item.product?.sku || '-';
            const row = [
                idx + 1,
                `"${item.medicineName.replace(/"/g, '""')}"`, // Escape quotes
                `"${sku.replace(/"/g, '""')}"`,
                `"${supplierName.replace(/"/g, '""')}"`,
                item.quantity
            ];
            csvRows.push(row.join(","));
        });

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `PO_${order.poNumber}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
  };

  const handleDownloadPDF = async () => {
      const input = document.getElementById('invoice-content');
      if (!input) return;

      try {
          const clone = input.cloneNode(true);
          clone.style.width = '210mm'; 
          clone.style.minHeight = '297mm';
          clone.style.position = 'absolute';
          clone.style.left = '-9999px';
          clone.style.top = '0';
          clone.style.background = 'white';
          clone.style.color = 'black';
          
          document.body.appendChild(clone);

          const canvas = await html2canvas(clone, { 
              scale: 3, 
              useCORS: true, 
              logging: false,
              backgroundColor: '#ffffff'
          });

          document.body.removeChild(clone);

          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`PO_${order.poNumber}.pdf`);
      } catch (err) {
          console.error("PDF generation failed:", err);
      }
  };

  if (loading || !order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Determine Supplier Name - Handle "Multiple Suppliers" logic for display if needed
  // Since we consolidated to single PO, the supplierName might be "Multiple Suppliers" 
  // or a specific supplier if all items match. 
  // However, users asked for "Proper" invoice. 
  // If it is multiple suppliers, we just show "Multiple Suppliers" in Sold By, 
  // or we list them per item (which we are doing in items table column usually, 
  // but for a formal PO invoice, usually it goes to ONE supplier).
  // Given the previous requirement of "Single PO ID regardless of number of suppliers",
  // this implies an internal PO. 
  // If distinct suppliers, it's an internal consolidation.
  const supplierName = order.supplierName || 'Unknown Supplier';
  
  // Calculate Totals
  const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = order.totalAmount || 0;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans print:p-0 print:bg-white text-black">
      
      {/* Action Header - Hidden on Print */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
        <button onClick={() => navigate('/purchase/orders')} className="flex items-center gap-2 text-gray-600 hover:text-black font-semibold">
            <ArrowLeft size={18} /> Back Lists
        </button>
        <div className="flex gap-2">
            <button onClick={handleDownloadCSV} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 font-semibold shadow-sm text-sm">
                <FileSpreadsheet size={16} /> CSV
            </button>
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 font-semibold shadow-sm text-sm">
                <Download size={16} /> PDF
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-[#007242] text-white rounded hover:bg-[#005a34] font-semibold shadow-sm text-sm">
                <Printer size={16} /> Print
            </button>
        </div>
      </div>

      <div className="flex justify-center">
        {/* --- PO INVOICE VIEW --- */}
        <div id="invoice-content" className="w-[210mm] min-h-[297mm] bg-white shadow-lg print:shadow-none print:w-full text-[10px] leading-tight text-black border border-black print:border-none p-2 box-border">
            
            {/* Header Title */}
            <div className="border border-black border-collapse">
                <div className="border-b border-black text-center font-bold py-1.5 bg-gray-50 text-sm">
                    PURCHASE ORDER
                </div>

                {/* Top Section */}
                <div className="flex border-b border-black">
                    {/* Supplier Details (Sold By Equivalent) */}
                    <div className="w-[40%] border-r border-black p-2 flex flex-col justify-between">
                        <div>
                            <div className="font-bold mb-1 uppercase tracking-wider text-[9px] text-gray-600">Supplier</div>
                            <div className="font-bold text-sm mb-1">{supplierName}</div>
                            {/* If we had full supplier address in PO object, we'd show it here. 
                                Since we might not have it populated fully, we show safe defaults or fetched data if available. 
                            */}
                            {order.supplierId && typeof order.supplierId === 'object' ? (
                                <>
                                    <div>{order.supplierId.address}</div> 
                                    <div>Ph: {order.supplierId.phone}</div>
                                    <div>GST: {order.supplierId.gstNumber}</div>
                                </>
                            ) : (
                                <div className="italic text-gray-500">Supplier details on file</div>
                            )}
                        </div>
                    </div>

                    {/* Buyer Details (Sold To - Us) */}
                    <div className="w-[35%] border-r border-black p-2 flex flex-col justify-between">
                        <div>
                            <div className="font-bold mb-1 uppercase tracking-wider text-[9px] text-gray-600">Bill To</div>
                            <div className="flex items-start gap-2 mb-2">
                                <img src="/KS2-Logo.png" alt="Logo" className="h-6 object-contain" />
                                <div className="font-bold text-sm">KS Pharma Net Solutions Pvt. Ltd.</div>
                            </div>
                            <div>123, Health Avenue, Okhla Industrial Area</div>
                            <div>Phase-I, New Delhi-110020</div>
                            <div className="mt-1"><span className="font-bold">GST:</span> 09AAAFCD7691C1ZH</div>
                            <div><span className="font-bold">Contact:</span> 011-41666666</div>
                        </div>
                    </div>

                    {/* PO Details */}
                    <div className="w-[25%] p-2 flex flex-col justify-start">
                        <div>
                            <div className="font-bold text-lg mb-1">{order.poNumber}</div>
                            <div className="font-bold">Date: {new Date(order.poDate).toLocaleDateString()}</div>
                            <div className="font-bold mt-1">Exp. Delivery: {order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : 'N/A'}</div>
                            <div className="mt-4 flex flex-col items-center">
                                <div className="w-20 h-20 bg-white p-1 border">
                                    <QRCodeCanvas value={`PO:${order.poNumber}|Amt:${totalAmount}`} size={70} style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
                                </div>
                                <div className="text-[8px] text-center mt-1 font-bold">PO QR Code</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="border-b border-black min-h-[500px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-black bg-gray-50 text-[8px] uppercase tracking-tighter">
                                <th className="border-r border-black px-1 py-1 w-[4%] text-center">SR</th>
                                <th className="border-r border-black px-1 py-1 w-[36%]">Product Name</th>
                                <th className="border-r border-black px-1 py-1 w-[15%]">Supplier (Item)</th>
                                <th className="border-r border-black px-1 py-1 w-[10%] text-center">Qty</th>
                                <th className="border-r border-black px-1 py-1 w-[10%] text-right">Rate</th>
                                <th className="border-r border-black px-1 py-1 w-[10%] text-right">GST %</th>
                                <th className="px-1 py-1 w-[15%] text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="text-[9px]">
                            {order.items.map((item, idx) => (
                                <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                    <td className="border-r border-black px-1 py-1 text-center">{idx + 1}</td>
                                    <td className="border-r border-black px-1 py-1 font-semibold">
                                        {item.medicineName}
                                        {item.product?.sku && <span className="block text-[8px] text-gray-500">SKU: {item.product.sku}</span>}
                                    </td>
                                    <td className="border-r border-black px-1 py-1 truncate max-w-[100px] text-[8px]">
                                        {item.supplier?.name || '-'}
                                    </td>
                                    <td className="border-r border-black px-1 py-1 text-center font-bold">{item.quantity}</td>
                                    <td className="border-r border-black px-1 py-1 text-right">{item.purchaseRate.toFixed(2)}</td>
                                    <td className="border-r border-black px-1 py-1 text-right">{item.gst || 0}%</td>
                                    <td className="px-1 py-1 text-right font-bold">{item.totalAmount.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer Section */}
                <div className="flex border-b border-black">
                    <div className="w-[60%] border-r border-black flex flex-col p-2">
                        <div className="text-[9px] flex-1">
                            <div className="font-bold mb-1">*All Values in (Rs)</div>
                            <div className="mb-1">Amount in Words:</div>
                            <div className="italic mb-2 capitalize font-bold">{numberToWords(totalAmount)}</div>
                            
                            <div className="mt-4 border-t border-gray-300 pt-2">
                                <div className="font-bold">Instructions / Notes:</div>
                                <div className="text-[9px] italic">{order.notes || 'No specific instructions.'}</div>
                            </div>
                        </div>
                    </div>

                    <div className="w-[40%] flex flex-col">
                        <div className="flex-1">
                            <div className="flex justify-between px-2 py-1 border-b border-gray-200">
                                <span>TOTAL QUANTITY:</span>
                                <span className="font-bold">{totalQty}</span>
                            </div>
                            <div className="flex justify-between px-2 py-3 bg-gray-100 font-bold text-lg">
                                <span>TOTAL AMOUNT:</span>
                                <span>₹{totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Footer */}
                <div className="flex items-end p-2 border-t border-black">
                    <div className="w-[50%]">
                        <div className="text-[8px] text-gray-500 mb-4">
                            This is a computer generated Purchase Order.
                        </div>
                    </div>
                    <div className="w-[50%] flex flex-col items-end text-center">
                        <div className="font-bold text-[10px] mb-8">For KS Pharma Net</div>
                        <div className="border-t border-black w-32"></div>
                        <div className="text-[8px] font-bold mt-1">Authorized Signatory</div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    
      <style>{`
          @media print {
              @page { margin: 0; }
              body { 
                  margin: 0; 
                  padding: 0; 
                  background: white; 
                  -webkit-print-color-adjust: exact; 
              }
              #invoice-content { 
                  margin: 0 auto; 
                  box-shadow: none;
                  border: none !important;
                  width: 100% !important;
                  height: auto !important;
              }
              .border { border-color: black !important; }
              .bg-gray-100 { background-color: #f3f4f6 !important; }
              .print:hidden { display: none !important; }
          }
      `}</style>
    </div>
  );
};

export default ViewPurchaseOrder;
