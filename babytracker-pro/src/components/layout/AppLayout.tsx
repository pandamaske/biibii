// src/components/layout/AppLayout.tsx
'use client'

import React from 'react'
import Header from '@/components/layout/Header'
import Navigation from '@/components/layout/Navigation'

interface AppLayoutProps {
  children: React.ReactNode
  className?: string
  currentPage?: string
  showHeader?: boolean
}

const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  className = '', 
  currentPage = 'BabyTracker',
  showHeader = true 
}) => {
  return (
  //<main className={`min-h-screen bg-gradient-to-b from-slate-50 to-white ${className}`}>
      <main>
      {/* ✅ Header Glassmorphism */}
      {showHeader && (
        <Header 
          currentPage={currentPage}
          className="animate-slide-down"
        />
      )}

      {/* ✅ Main Content with proper spacing */}
      <div className={`mx-auto ${showHeader ? 'pt-0' : 'pt-6'} pb-20`}>
        {children}
      </div>

      {/* ✅ Footer Navigation (unchanged) */}
      <Navigation />
    </main>
  )
}

export default AppLayout