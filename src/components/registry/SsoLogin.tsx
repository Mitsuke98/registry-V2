import React from 'react';
import { Shield, User as UserIcon } from 'lucide-react';
import { useRegistry } from '@/data/RegistryContext';
import type { User } from '@/data/types';

export const SsoLogin: React.FC = () => {
  const { setCurrentUser, usersList } = useRegistry();

  const handleSignIn = (user: User) => {
    setCurrentUser(user);
  };

  // Only list active users
  const activeUsers = usersList.filter(u => u.active);

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gray-50 p-4 select-none">
      <div className="w-full max-w-[400px] space-y-6">
        
        {/* Logo and Header */}
        <div className="flex flex-col items-center space-y-2 text-center select-none">
          <div className="w-12 h-12 rounded bg-primary text-primary-foreground flex items-center justify-center font-black text-xl shadow-sm">
            AN
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-800 mt-3">Agent Nexus</h1>
          <p className="text-xs text-gray-500 font-medium">Sign in with Single Sign-On (SSO)</p>
        </div>

        {/* Identity Card Container */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 space-y-4">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center select-none">
            Select User Identity
          </div>
          
          <div className="space-y-2">
            {activeUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSignIn(user)}
                className="w-full text-left flex items-center gap-3.5 p-3 rounded border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 cursor-pointer group transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-gray-150 text-gray-700 flex items-center justify-center font-bold text-xs select-none group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                  {user.initials}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-gray-800 truncate group-hover:text-primary transition-colors">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-gray-400 truncate mt-0.5 font-mono-custom">{user.email}</div>
                  
                  <div className="flex items-center gap-1.5 mt-1">
                    {user.role === 'super_admin' ? (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 rounded-full">
                        <Shield className="w-2.5 h-2.5" />
                        Super Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 rounded-full">
                        <UserIcon className="w-2.5 h-2.5" />
                        End User
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footnote */}
        <div className="text-center text-[10px] text-gray-400 px-4 leading-relaxed">
          Deactivated users are hidden from this portal. Authenticated sessions are kept in-memory; a hard refresh signs out.
        </div>
      </div>
    </div>
  );
};
