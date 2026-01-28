import React, { useState } from 'react';
import { Shield, Lock, Users, Edit2, Trash2, Plus, CheckCircle, XCircle } from 'lucide-react';
import Swal from 'sweetalert2';

const RolesPermissions = () => {
    // Mock Data
    const [roles, setRoles] = useState([
        { id: 1, name: 'Super Admin', users: 1, desc: 'Full access to all modules' },
        { id: 2, name: 'Pharmacist', users: 3, desc: 'Billing, Inventory, and Customers' },
        { id: 3, name: 'Clerk', users: 2, desc: 'Billing Only' },
    ]);

    const handleAddRole = () => {
        Swal.fire({
            title: 'Create New Role',
            input: 'text',
            inputPlaceholder: 'Role Name (e.g. Accountant)',
            showCancelButton: true,
            confirmButtonText: 'Create',
            confirmButtonColor: '#007242'
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                setRoles([...roles, { id: roles.length + 1, name: result.value, users: 0, desc: 'Custom Role' }]);
                Swal.fire('Success', 'Role created', 'success');
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
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                setRoles(roles.filter(role => role.id !== id));
                Swal.fire('Deleted!', 'The role has been deleted.', 'success');
            }
        });
    };

    const handleEditRole = (role) => {
        Swal.fire({
            title: 'Edit Role Name',
            input: 'text',
            inputValue: role.name,
            showCancelButton: true,
            confirmButtonText: 'Update',
            confirmButtonColor: '#007242'
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                setRoles(roles.map(r => r.id === role.id ? { ...r, name: result.value } : r));
                Swal.fire('Updated!', 'Role name has been updated.', 'success');
            }
        });
    };

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
                    {roles.map((role) => (
                        <div key={role.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer group hover:border-primary/50 dark:hover:border-primary/50">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-gray-800 dark:text-white group-hover:text-primary transition-colors">{role.name}</h3>
                                {role.id === 1 ? (
                                    <Lock size={16} className="text-gray-400" />
                                ) : (
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleEditRole(role); }}
                                            className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1 rounded"
                                            title="Edit Role"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDeleteRole(role.id); }}
                                            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded"
                                            title="Delete Role"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{role.desc}</p>
                            <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
                                <Users size={14} /> {role.users} Active Users
                            </div>
                        </div>
                    ))}
                </div>

                {/* Permission Matrix (Mock for Visuals) */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                        <h3 className="font-bold text-gray-800 dark:text-white">Permission Matrix: Pharmacist</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Configure what this role can and cannot do.</p>
                    </div>
                    
                    <div className="overflow-x-auto">
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
                                {[
                                    { name: 'Inventory', view: true, create: true, edit: true, delete: false },
                                    { name: 'Sales / Billing', view: true, create: true, edit: true, delete: true },
                                    { name: 'Customers', view: true, create: true, edit: true, delete: false },
                                    { name: 'Reports', view: true, create: false, edit: false, delete: false },
                                    { name: 'Settings', view: false, create: false, edit: false, delete: false },
                                ].map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-700 dark:text-gray-200">{row.name}</td>
                                        {['view', 'create', 'edit', 'delete'].map((action) => (
                                            <td key={action} className="px-6 py-4 text-center">
                                                <button className={`p-1 rounded transition-colors ${row[action] ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'}`}>
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
                        <button className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-md hover:bg-secondary transition-colors">
                            Save Permissions
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default RolesPermissions;
