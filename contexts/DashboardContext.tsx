import React, { createContext, useContext, ReactNode } from 'react';

// Using 'any' temporarily to speed up the massive migration. 
// Can be typed properly in a future strict-typing phase.
const DashboardContext = createContext<any>(null);

export function DashboardProvider({ children, value }: { children: ReactNode, value: any }) {
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
