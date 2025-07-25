'use client'

import { useCallback } from 'react'

// Simple hook to trigger data refreshes across the app
export function useDataRefresh() {
  const refreshData = useCallback(() => {
    // Dispatch custom event to notify all live data hooks to refresh
    window.dispatchEvent(new CustomEvent('refresh-live-data'))
    console.log('🔄 Data refresh triggered')
  }, [])

  return { refreshData }
}