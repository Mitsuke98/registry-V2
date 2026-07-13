import React from 'react';
import { RoleShell } from '@/components/registry/Primitives';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <RoleShell>{children}</RoleShell>;
};
