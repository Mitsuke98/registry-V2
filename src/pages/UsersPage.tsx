import React, { useState } from 'react';
import { useRegistry } from '@/data/RegistryContext';
import { SmartTable } from '@/components/registry/Primitives';
import { Plus, Edit, Shield, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';

export const UsersPage: React.FC = () => {
  const { usersList, createUser, updateUser, setUserStatus, currentUser } = useRegistry();

  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  // Form Fields State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'end_user' | 'super_admin'>('end_user');

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error('Name and email are required.');
      return;
    }

    const initials = name.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2);

    createUser({
      name: name.trim(),
      email: email.trim(),
      initials,
      role
    });

    setIsOpen(false);
    setName('');
    setEmail('');
    setRole('end_user');
    toast.success('User created successfully.');
  };

  const handleEditUserClick = (user: any) => {
    setSelectedUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setIsEditOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const initials = name.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2);
    updateUser(selectedUser.id, {
      name: name.trim(),
      email: email.trim(),
      initials
    });

    setIsEditOpen(false);
    setSelectedUser(null);
    setName('');
    setEmail('');
    toast.success('User updated successfully.');
  };

  const handleToggleStatus = (userId: string, userActive: boolean, userName: string) => {
    if (userId === currentUser?.id) {
      toast.error('You cannot deactivate your own admin session.');
      return;
    }
    setUserStatus(userId, !userActive);
    toast.success(`${userName} is now ${userActive ? 'deactivated' : 'activated'}.`);
  };

  const columns = [
    {
      key: 'name',
      header: 'Name & Initials',
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-700 text-xs shrink-0 select-none">
            {row.initials}
          </div>
          <div>
            <span className="font-semibold text-gray-800 block">{row.name}</span>
            <span className="text-[10px] text-gray-400 font-mono-custom">{row.email}</span>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Assigned Role',
      render: (row: any) => (
        <div className="flex items-center gap-1">
          {row.role === 'super_admin' ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full select-none">
              <Shield className="w-3 h-3 text-amber-600" />
              Super Admin
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full select-none">
              <UserIcon className="w-3 h-3 text-blue-600" />
              End User
            </span>
          )}
        </div>
      )
    },
    {
      key: 'active',
      header: 'Status',
      render: (row: any) => (
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border select-none ${
          row.active 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {row.active ? 'ACTIVE' : 'DEACTIVATED'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Console Actions',
      render: (row: any) => (
        <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => handleEditUserClick(row)}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold border border-gray-250 bg-white text-gray-700 hover:bg-gray-50 rounded cursor-pointer"
          >
            <Edit className="w-3 h-3" />
            Edit
          </button>
          
          <button
            onClick={() => handleToggleStatus(row.id, row.active, row.name)}
            disabled={row.id === currentUser?.id}
            className={`px-2 py-1 text-[10px] font-bold border rounded cursor-pointer ${
              row.id === currentUser?.id
                ? 'opacity-35 cursor-not-allowed border-gray-200 text-gray-400 bg-gray-50'
                : row.active
                  ? 'border-red-200 text-red-700 bg-red-50 hover:bg-red-100'
                  : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
            }`}
          >
            {row.active ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6 select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-800">User Directory</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage permissions, deactivate users, and provision platform creator roles.</p>
        </div>
        
        <button 
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded bg-primary text-primary-foreground hover:opacity-90 cursor-pointer focus:outline-none"
        >
          <Plus className="w-3.5 h-3.5" />
          Create User
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-4">
        <SmartTable 
          data={usersList}
          columns={columns}
          externalToolbar={true}
        />
      </div>

      {/* CREATE USER DIALOG */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md bg-white rounded-lg shadow-floating border border-gray-200 overflow-hidden z-50">
            <form onSubmit={handleCreateUser}>
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-gray-55">
                <h3 className="text-sm font-semibold text-gray-800">New User Account</h3>
                <button type="button" onClick={() => setIsOpen(false)} className="text-gray-400 font-bold hover:text-gray-600">✕</button>
              </div>

              <div className="p-4 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Full Name *</label>
                  <input 
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    placeholder="e.g. Priyan Nair"
                    className="w-full px-2.5 py-1.5 border border-gray-250 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Email Address *</label>
                  <input 
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="e.g. priya@infoorigin.com"
                    className="w-full px-2.5 py-1.5 border border-gray-250 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Platform Role *</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-gray-250 rounded bg-white text-gray-700 cursor-pointer focus:outline-none font-semibold"
                  >
                    <option value="end_user">End User / Creator</option>
                    <option value="super_admin">Super Admin / Auditor</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50 text-xs font-semibold">
                <button type="button" onClick={() => setIsOpen(false)} className="px-3.5 py-1.5 border border-gray-200 rounded bg-white text-gray-700 hover:bg-gray-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 rounded bg-primary text-primary-foreground hover:opacity-90 cursor-pointer">Provision User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER DIALOG */}
      {isEditOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md bg-white rounded-lg shadow-floating border border-gray-200 overflow-hidden z-50">
            <form onSubmit={handleSaveUser}>
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-gray-55">
                <h3 className="text-sm font-semibold text-gray-800">Edit User Details</h3>
                <button type="button" onClick={() => { setIsEditOpen(false); setSelectedUser(null); }} className="text-gray-400 font-bold hover:text-gray-600">✕</button>
              </div>

              <div className="p-4 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Full Name *</label>
                  <input 
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 border border-gray-250 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Email Address *</label>
                  <input 
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 border border-gray-250 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Platform Role *</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-gray-250 rounded bg-white text-gray-700 cursor-pointer focus:outline-none font-semibold"
                  >
                    <option value="end_user">End User / Creator</option>
                    <option value="super_admin">Super Admin / Auditor</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-gray-55 text-xs font-semibold">
                <button type="button" onClick={() => { setIsEditOpen(false); setSelectedUser(null); }} className="px-3.5 py-1.5 border border-gray-200 rounded bg-white text-gray-700 hover:bg-gray-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 rounded bg-primary text-primary-foreground hover:opacity-90 cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
