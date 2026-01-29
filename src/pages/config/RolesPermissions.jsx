import React, { useState, useEffect } from 'react';
import { Shield, Lock, Users, Edit2, Trash2, Plus, CheckCircle, XCircle, Save } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../api/axios';

const MODULES = [
    { name: 'Inventory', key: 'Inventory' },
    { name: 'Sales / Billing', key: 'Sales' },
    { name: 'Customers', key: 'Customers' },
    { name: 'Suppliers', key: 'Suppliers' },
    { name: 'Doctors', key: 'Doctors' },
    { name: 'Reports', key: 'Reports' },
    { name: 'Settings', key: 'Settings' },
];

const RolesPermissions = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRole, setSelectedRole] = useState(null);
    const [matrix, setMatrix] = useState([]); // Array of permission objects matching MODULES

    // Fetch Roles
    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/roles');
            if (data.success) {
                setRoles(data.roles);
                // Select first role by default if available and none selected, 
                // but usually better to let user select or select the one being edited.
                if (data.roles.length > 0 && !selectedRole) {
                     handleSelectRole(data.roles[0]);
                } else if (selectedRole) {
                    // Refresh selected role data if it exists
                    const updated = data.roles.find(r => r._id === selectedRole._id);
                    if (updated) handleSelectRole(updated);
                }
            }
        } catch (error) {
            console.error("Error fetching roles:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectRole = (role) => {
        setSelectedRole(role);
        // Map backend permissions to UI Matrix
        // If backend has permissions for a module, use them. Else default false.
        const currentPerms = role.permissions || [];
        
        const newMatrix = MODULES.map(mod => {
            const existing = currentPerms.find(p => p.module === mod.key);
            return {
                module: mod.key,
                name: mod.name,
                view: existing ? existing.view : false,
                create: existing ? existing.create : false,
                edit: existing ? existing.edit : false,
                delete: existing ? existing.delete : false
            };
        });
        setMatrix(newMatrix);
    };

    const handleAddRole = () => {
        Swal.fire({
            title: 'Create New Role',
            input: 'text',
            inputPlaceholder: 'Role Name (e.g. Accountant)',
            showCancelButton: true,
            confirmButtonText: 'Create',
            confirmButtonColor: '#007242'
        }).then(async (result) => {
            if (result.isConfirmed && result.value) {
                try {
                    const { data } = await api.post('/roles', { name: result.value, description: 'Custom Role' });
                    if (data.success) {
                        Swal.fire('Success', 'Role created', 'success');
                        fetchRoles(); // Refresh list
                    }
                } catch (error) {
                    Swal.fire('Error', error.response?.data?.message || 'Failed to create role', 'error');
                }
            }
        });
    };

    const handleDeleteRole = (id) => {
        Swal.fire({
            title: 'Delete Role?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await api.delete(`/roles/${id}`);
                    Swal.fire('Deleted!', 'The role has been deleted.', 'success');
                    setSelectedRole(null); // Clear selection
                    fetchRoles();
                } catch (error) {
                    Swal.fire('Error', 'Failed to delete role', 'error');
                }
            }
        });
    };

    const handleEditRoleName = (role) => {
        Swal.fire({
            title: 'Edit Role Name',
            input: 'text',
            inputValue: role.name,
            showCancelButton: true,
            confirmButtonText: 'Update',
            confirmButtonColor: '#007242'
        }).then(async (result) => {
            if (result.isConfirmed && result.value) {
                try {
                    await api.put(`/roles/${role._id}`, { name: result.value });
                    Swal.fire('Updated!', 'Role name has been updated.', 'success');
                    fetchRoles();
                } catch (error) {
                    Swal.fire('Error', 'Failed to update role', 'error');
                }
            }
        });
    };

    const togglePermission = (moduleKey, action) => {
        if (!selectedRole) return;
        setMatrix(prev => prev.map(item => {
            if (item.module === moduleKey) {
                return { ...item, [action]: !item[action] };
            }
            return item;
        }));
    };

    const handleSavePermissions = async () => {
        if (!selectedRole) return;
        try {
            // Convert matrix back to backend schema
            const permissions = matrix.map(m => ({
                module: m.module,
                view: m.view,
                create: m.create,
                edit: m.edit,
                delete: m.delete
            }));

            const { data } = await api.put(`/roles/${selectedRole._id}`, { permissions });
            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Saved',
                    text: 'Permissions updated successfully',
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchRoles(); // Refresh to ensure sync
            }
        } catch (error) {
            Swal.fire('Error', 'Failed to save permissions', 'error');
        }
    };

    if (loading && roles.length === 0) {
         return (
            <div className="flex items-center justify-center p-20 min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up max-w-6xl mx-auto space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Shield className="text-primary" /> Roles & Permissions
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage user access levels and security policies.</p>
                </div>
                <button 
                    onClick={handleAddRole}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-secondary flex items-center gap-2 shadow-md transition-colors"
                >
                    <Plus size={16} /> New Role
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Role List */}
                <div className="lg:col-span-1 space-y-4">
                    {roles.length === 0 && (
                        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 text-center text-gray-500 text-sm">
                            No roles found. Create one to get started.
                        </div>
                    )}
                    {roles.map((role) => (
                        <div 
                            key={role._id} 
                            onClick={() => handleSelectRole(role)}
                            className={`p-5 rounded-2xl shadow-sm border transition-all cursor-pointer group relative overflow-hidden
                                ${selectedRole && selectedRole._id === role._id 
                                    ? 'bg-white dark:bg-gray-800 border-primary ring-1 ring-primary' 
                                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-primary/50 dark:hover:border-primary/50'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className={`font-bold transition-colors ${selectedRole && selectedRole._id === role._id ? 'text-primary' : 'text-gray-800 dark:text-white group-hover:text-primary'}`}>{role.name}</h3>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleEditRoleName(role); }}
                                        className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1 rounded"
                                        title="Edit Role Name"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeleteRole(role._id); }}
                                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded"
                                        title="Delete Role"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{role.description || 'Custom Role'}</p>
                            
                            {/* Visual indicator of permission count */}
                            <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
                                <Shield size={14} /> {role.permissions?.length || 0} Modules Configured
                            </div>
                        </div>
                    ))}
                </div>

                {/* Permission Matrix */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors flex flex-col min-h-[500px]">
                    {selectedRole ? (
                        <>
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800">
                                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    Configure: <span className="text-primary">{selectedRole.name}</span>
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Define access privileges for each module.</p>
                            </div>
                            
                            <div className="overflow-x-auto flex-1">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold border-b border-gray-100 dark:border-gray-700">
                                        <tr>
                                            <th className="px-6 py-4">Module</th>
                                            <th className="px-6 py-4 text-center">View</th>
                                            <th className="px-6 py-4 text-center">Create</th>
                                            <th className="px-6 py-4 text-center">Edit</th>
                                            <th className="px-6 py-4 text-center">Delete</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                        {matrix.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-gray-700 dark:text-gray-200">{row.name}</td>
                                                {['view', 'create', 'edit', 'delete'].map((action) => (
                                                    <td key={action} className="px-6 py-4 text-center">
                                                        <button 
                                                            onClick={() => togglePermission(row.module, action)}
                                                            className={`p-2 rounded-lg transition-all transform active:scale-95 ${row[action] 
                                                                ? 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 ring-1 ring-green-100 dark:ring-green-900' 
                                                                : 'text-gray-300 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                                        >
                                                            {row[action] ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                                        </button>
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-6 bg-gray-50 dark:bg-gray-900/50 flex justify-end border-t border-gray-100 dark:border-gray-700">
                                <button 
                                    onClick={handleSavePermissions}
                                    className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-secondary active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <Save size={16} /> Save Permissions
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center flex-1 p-10 text-center text-gray-400">
                            <Shield size={48} className="mb-4 text-gray-300 dark:text-gray-600" />
                            <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400">No Role Selected</h3>
                            <p className="text-sm mt-2 max-w-xs mx-auto">Select a role from the list on the left to configure its permissions.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default RolesPermissions;
