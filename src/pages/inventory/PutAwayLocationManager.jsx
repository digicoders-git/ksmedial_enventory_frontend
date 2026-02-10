import { useState, useEffect } from 'react';
import { Search, Save, Upload, Package, Filter, Plus, FileText, Download, Printer, Edit, Trash2, QrCode, XCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import api from '../../api/axios';


const LocationMaster = () => {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        keyword: '',
        category: '',
        status: ''
    });
    
    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [pageSize, setPageSize] = useState(25);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [formData, setFormData] = useState({

        category: 'Picking',
        aisle: '',
        rack: '',
        shelf: '',
        bin: '',
        partition: '0',
        status: 'Active',
        temperatureType: 'Normal'
    });

    useEffect(() => {
        fetchLocations();
    }, [page, pageSize]);

    const fetchLocations = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('pageNumber', page);
            params.append('pageSize', pageSize);
            if (filters.keyword) params.append('keyword', filters.keyword);
            if (filters.category) params.append('category', filters.category);
            if (filters.status) params.append('status', filters.status);

            const { data } = await api.get(`/locations?${params.toString()}`);
            if (data.success) {
                setLocations(data.locations);
                setTotalPages(data.pages);
                setTotalRecords(data.total);
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Failed to fetch locations', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSearch = () => {
        setPage(1);
        fetchLocations();
    };
    
    const handleDownloadCSV = () => {
        if (locations.length === 0) return;
        
        const csvRows = [];
        // Header
        csvRows.push(['Location Code', 'Category', 'Aisle', 'Rack', 'Shelf', 'Bin', 'Partition', 'Status', 'Temperature']);
        
        locations.forEach(loc => {
            csvRows.push([
                loc.locationCode,
                loc.category,
                loc.aisle,
                loc.rack,
                loc.shelf,
                loc.bin,
                loc.partition,
                loc.status,
                loc.temperatureType
            ]);
        });
        
        const csvString = Papa.unparse(csvRows);
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `Location_Master_${new Date().toLocaleDateString()}.csv`);
    };

    const handleCSVUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                if (results.errors.length) {
                    Swal.fire('Error', 'CSV Parse Error', 'error');
                    return;
                }

                const bulkData = results.data.map(row => ({

                    category: row['Category'] || 'Picking',
                    aisle: row['Aisle'],
                    rack: row['Rack'],
                    shelf: row['Shelf'],
                    bin: row['Bin'],
                    partition: row['Partition'] || '0',
                    status: row['Status'] || 'Active',
                    temperatureType: row['Temperature'] || 'Normal'
                })).filter(l => l.aisle && l.rack && l.shelf && l.bin);

                if (bulkData.length === 0) {
                     Swal.fire('Warning', 'No valid rows found. Headers required: Aisle, Rack, Shelf, Bin', 'warning');
                     return;
                }

                try {
                    const { data } = await api.post('/locations/bulk', { locations: bulkData });
                    if (data.success) {
                        Swal.fire('Success', `Created: ${data.created}, Errors: ${data.errors.length}`, 'success');
                        fetchLocations();
                    }
                } catch (error) {
                    console.error("Bulk upload error:", error);
                    Swal.fire('Error', 'Bulk upload failed', 'error');
                }
                e.target.value = '';
            }
        });
    };

    const handleDownloadSampleCSV = () => {
        const sampleData = [
            {

                Category: 'Picking',
                Aisle: 'A1',
                Rack: 'R01',
                Shelf: 'S1',
                Bin: 'B01',
                Partition: '0',
                Status: 'Active',
                Temperature: 'Normal'
            },
            {

                Category: 'Reserve',
                Aisle: 'B2',
                Rack: 'R05',
                Shelf: 'S3',
                Bin: 'B10',
                Partition: '1',
                Status: 'Active',
                Temperature: 'Cold'
            }
        ];
        
        const csvString = Papa.unparse(sampleData);
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, 'sample_location_upload.csv');
    };

    const handleDelete = async (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const { data } = await api.delete(`/locations/${id}`);
                    if (data.success) {
                        Swal.fire('Deleted!', 'Location has been deleted.', 'success');
                        fetchLocations();
                    }
                } catch (error) {
                    Swal.fire('Error', 'Failed to delete location', 'error');
                }
            }
        });
    };

    const [printLocation, setPrintLocation] = useState(null);

    const handlePrintQR = (loc) => {
        setPrintLocation(loc);
    };

    const handlePrintCanvas = () => {
        const printContent = document.getElementById('qr-print-area');
        const win = window.open('', '', 'width=600,height=600');
        win.document.write(`
          <html>
            <head>
              <title>Print Location QR</title>
              <style>
                body { font-family: 'Inter', sans-serif; text-align: center; padding: 20px; }
                .qr-container { border: 2px dashed #000; padding: 20px; display: inline-block; border-radius: 12px; }
                h1 { margin: 0 0 5px 0; font-size: 20px; font-weight: 900; color: #000; letter-spacing: -0.5px; }
                p { margin: 2px 0; font-size: 12px; color: #333; font-weight: 500; text-transform: uppercase; }
                .meta { font-size: 10px; color: #666; margin-top: 5px; }
                img { max-width: 100%; display: block; margin: 0 auto; }
              </style>
            </head>
            <body>
              <div class="qr-container">
                ${printContent.innerHTML}
              </div>
              <script>
                setTimeout(() => { window.print(); window.close(); }, 500);
              </script>
            </body>
          </html>
        `);
        win.document.close();
    };

    const handleEdit = (loc) => {
        setCurrentLocation(loc);
        setFormData({

            category: loc.category,
            aisle: loc.aisle,
            rack: loc.rack,
            shelf: loc.shelf,
            bin: loc.bin,
            partition: loc.partition,
            status: loc.status,
            temperatureType: loc.temperatureType
        });
        setShowModal(true);
    };

    const handleCreate = () => {
        setCurrentLocation(null);
        setFormData({

            category: 'Picking',
            aisle: '',
            rack: '',
            shelf: '',
            bin: '',
            partition: '0',
            status: 'Active',
            temperatureType: 'Normal'
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentLocation) {
                await api.put(`/locations/${currentLocation._id}`, formData);
                Swal.fire('Success', 'Location updated', 'success');
            } else {
                await api.post('/locations', formData);
                Swal.fire('Success', 'Location created', 'success');
            }
            setShowModal(false);
            fetchLocations();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Operation failed', 'error');
        }
    };

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen space-y-6">
            <div className="flex justify-between items-center">
                 <h1 className="text-2xl font-black text-gray-800 dark:text-white">Location Master</h1>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row items-center gap-4">
                <span className="text-sm font-bold text-gray-500">Filter results:</span>
                <input 
                    name="keyword"
                    value={filters.keyword}
                    onChange={handleFilterChange}
                    placeholder="Search location name"
                    className="px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary w-full md:w-64 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <select name="category" value={filters.category} onChange={handleFilterChange} className="px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none w-full md:w-auto">
                    <option value="">Category</option>
                    <option value="Picking">Picking</option>
                    <option value="Reserve">Reserve</option>
                </select>
                <select name="status" value={filters.status} onChange={handleFilterChange} className="px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none w-full md:w-auto">
                    <option value="">Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                </select>
                <button onClick={handleSearch} className="px-6 py-2 bg-cyan-500 text-white font-bold rounded-lg text-sm hover:bg-cyan-600 transition-colors w-full md:w-auto">
                    Fetch Record
                </button>
            </div>

            {/* Stats & Actions */}
            <div className="flex flex-col xl:flex-row justify-between items-center gap-4">
                <div className="text-gray-500 text-sm">
                    Showing {(page - 1) * pageSize} - {Math.min(page * pageSize, totalRecords)} of {totalRecords} locations
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 mr-4">
                        <span className="text-xs font-bold text-gray-500">Records per page</span>
                        <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="border rounded px-2 py-1 text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                             <option value={25}>25</option>
                             <option value={50}>50</option>
                             <option value={100}>100</option>
                        </select>
                    </div>

                    <button onClick={handleCreate} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center gap-1.5">
                        <Plus size={16} /> Create
                    </button>
                    
                    <div className="relative">
                        <input type="file" accept=".csv" onChange={handleCSVUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <button className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-all flex items-center gap-1.5">
                            <Upload size={16} /> Upload CSV
                        </button>
                    </div>

                    <button onClick={handleDownloadSampleCSV} className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-all flex items-center gap-1.5">
                        <FileText size={16} /> Sample CSV
                    </button>
                    
                     <button onClick={handleDownloadCSV} className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-all flex items-center gap-1.5">
                        <Download size={16} /> Export
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-sky-900 text-white uppercase font-bold">
                            <tr>
                                <th className="p-3 w-8"><input type="checkbox" /></th>
                                <th className="p-3">ID</th>

                                <th className="p-3">Location Name</th>
                                <th className="p-3">Category</th>
                                <th className="p-3">Aisle</th>
                                <th className="p-3">Rack</th>
                                <th className="p-3">Shelf</th>
                                <th className="p-3">Bin</th>
                                <th className="p-3">Partition</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Temperature Type</th>
                                <th className="p-3 text-center">QR</th>
                                <th className="p-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan="13" className="p-8 text-center">Loading...</td></tr>
                            ) : locations.length === 0 ? (
                                <tr><td colSpan="13" className="p-8 text-center text-gray-500">No locations found</td></tr>
                            ) : (
                                locations.map(loc => (
                                    <tr key={loc._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                        <td className="p-3"><input type="checkbox" /></td>
                                        <td className="p-3 font-mono text-gray-500">{loc._id.slice(-6)}</td>

                                        <td className="p-3 font-bold text-gray-800 dark:text-gray-200">{loc.locationCode}</td>
                                        <td className="p-3">{loc.category}</td>
                                        <td className="p-3">{loc.aisle}</td>
                                        <td className="p-3">{loc.rack}</td>
                                        <td className="p-3">{loc.shelf}</td>
                                        <td className="p-3">{loc.bin}</td>
                                        <td className="p-3">{loc.partition}</td>
                                        <td className="p-3">{loc.status}</td>
                                        <td className="p-3">{loc.temperatureType}</td>
                                        <td className="p-3 text-center">
                                            <button onClick={() => handlePrintQR(loc)} className="text-purple-500 hover:text-purple-700 p-1 hover:bg-purple-50 rounded" title="View/Print QR">
                                                <QrCode size={16} />
                                            </button>
                                        </td>
                                        <td className="p-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleEdit(loc)} className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 rounded" title="Edit">
                                                    <Edit size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(loc._id)} className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded" title="Delete">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 pb-8">
                    <button 
                        onClick={() => setPage(p => Math.max(1, p - 1))} 
                        disabled={page === 1}
                        className="px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="px-3 py-1 text-sm flex items-center">Page {page} of {totalPages}</span>
                    <button 
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                        disabled={page === totalPages}
                        className="px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold dark:text-white">{currentLocation ? 'Edit Location' : 'Create New Location'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
                                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                    <option value="Picking">Picking</option>
                                    <option value="Reserve">Reserve</option>
                                    <option value="Bulk">Bulk</option>
                                </select>
                            </div>
                            
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Aisle</label>
                                <input value={formData.aisle} onChange={(e) => setFormData({...formData, aisle: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Rack</label>
                                <input value={formData.rack} onChange={(e) => setFormData({...formData, rack: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                            </div>
                            
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Shelf</label>
                                <input value={formData.shelf} onChange={(e) => setFormData({...formData, shelf: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Bin</label>
                                <input value={formData.bin} onChange={(e) => setFormData({...formData, bin: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                            </div>
                             <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Partition</label>
                                <input value={formData.partition} onChange={(e) => setFormData({...formData, partition: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>
                            
                             <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                             <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Temp Type</label>
                                <select value={formData.temperatureType} onChange={(e) => setFormData({...formData, temperatureType: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                    <option value="Normal">Normal</option>
                                    <option value="Cold">Cold</option>
                                </select>
                            </div>

                            <div className="col-span-2 pt-4 flex gap-3 justify-end">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 text-gray-500 hover:text-gray-700 font-bold">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-cyan-500 text-white font-bold rounded-lg hover:bg-cyan-600 shadow-md">
                                    {currentLocation ? 'Update Location' : 'Create Location'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Print QR Modal */}
            {printLocation && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Location QR Code</h3>
                            <button onClick={() => setPrintLocation(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <XCircle size={24} />
                            </button>
                        </div>
                        
                        <div id="qr-print-area" className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border-2 border-dashed border-gray-200">
                             <h1 className="text-xl font-black text-black mb-1">{printLocation.locationCode}</h1>
                             <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(printLocation.locationCode)}`}
                                alt="Location QR Code"
                                className="w-[180px] h-[180px]"
                             />
                             <p className="mt-2 font-bold uppercase">{printLocation.category} Zone</p>

                        </div>

                        <div className="mt-6 flex justify-center gap-3">
                             <button onClick={() => setPrintLocation(null)} className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-700">Close</button>
                             <button onClick={handlePrintCanvas} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-sm shadow-lg flex items-center gap-2">
                                <Printer size={16} /> Print Label
                             </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationMaster;
