import React from 'react';
import { Asterisk, User, Shield } from 'lucide-react';
import { useRegistry } from '@/data/RegistryContext';

export const SsoLogin: React.FC = () => {
  const { setCurrentUser } = useRegistry();

  const handleSignIn = (name: string, initials: string, role: 'end_user' | 'super_admin') => {
    setCurrentUser({ name, initials, role });
  };

  const users: { name: string; initials: string; role: 'end_user' | 'super_admin'; roleLabel: string }[] = [
    { name: 'Alex Vance', initials: 'AV', role: 'end_user', roleLabel: 'End User' },
    { name: 'Jordan Blake', initials: 'JB', role: 'super_admin', roleLabel: 'Super Admin' }
  ];

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-radial from-muted/50 to-background p-4 select-none">
      <div className="w-full max-w-[420px] space-y-6">
        {/* Logo and Header */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="size-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20 animate-pulse">
            <Asterisk className="size-8 stroke-[2.5]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground mt-4">Registry</h1>
          <p className="text-sm text-muted-foreground font-medium">Sign in with Single Sign-On (SSO)</p>
        </div>

        {/* Identity Card Container */}
        <div className="bg-card border border-border rounded-2xl shadow-xl p-6 space-y-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
            Select an Identity
          </div>
          <div className="space-y-3">
            {users.map((user) => (
              <button
                key={user.name}
                onClick={() => handleSignIn(user.name, user.initials, user.role)}
                className="w-full text-left flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/30 hover:bg-primary/5 hover:border-primary cursor-pointer group transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm tracking-wider transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  {user.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground truncate group-hover:text-primary">
                    {user.name}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    {user.role === 'super_admin' ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                        <Shield className="size-3" />
                        {user.roleLabel}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
                        <User className="size-3" />
                        {user.roleLabel}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Muted SSO footnote */}
        <div className="text-center text-[11px] text-muted-foreground/80 px-4 leading-relaxed">
          This is a simulated authentication portal for demo purposes. Switching personas allows testing role-specific features.
        </div>
      </div>
    </div>
  );
};
