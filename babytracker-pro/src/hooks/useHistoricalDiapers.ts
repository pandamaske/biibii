'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useBabyTrackerStore } from '@/lib/store'

interface DiaperEntry {
  id: string
  babyId: string
  time: Date
  type: 'wet' | 'soiled' | 'mixed' | 'dry'
  wetness?: Record<string, unknown>
  stool?: Record<string, unknown>
  diaper?: Record<string, unknown>
  mood?: string
  changedBy?: string
  notes?: string
  amount?: string
  color?: string
}

interface UseHistoricalDiapersReturn {
  diapers: DiaperEntry[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useHistoricalDiapers(
  startDate?: Date,
  endDate?: Date,
  limit = 100
): UseHistoricalDiapersReturn {
  const [diapers, setDiapers] = useState<DiaperEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { currentBaby, userProfile } = useBabyTrackerStore()

  const fetchDiapers = useCallback(async () => {
    console.log('🔍 fetchDiapers called with:', {
      currentBabyId: currentBaby?.id,
      userEmail: userProfile?.email,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      limit
    })

    if (!currentBaby?.id || !userProfile?.email) {
      console.log('❌ Missing required data:', { currentBaby: !!currentBaby, userProfile: !!userProfile })
      setDiapers([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        email: userProfile.email,
        type: 'diaper',
        limit: limit.toString()
      })

      if (startDate) {
        params.append('startDate', startDate.toISOString())
      }
      if (endDate) {
        params.append('endDate', endDate.toISOString())
      }

      const url = `/api/babies/${currentBaby.id}/entries?${params}`
      console.log('🌐 Fetching from URL:', url)

      const response = await fetch(url)
      
      console.log('📡 Response status:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error:', errorText)
        throw new Error(`Failed to fetch diaper entries: ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log('📊 API Response data:', data)
      
      // Transform the data to match our DiaperEntry interface
      const transformedDiapers = data.entries.map((entry: Record<string, unknown>) => ({
        ...entry,
        time: new Date(entry.time),
        timestamp: new Date(entry.time) // For backward compatibility
      }))

      console.log('✅ Transformed diapers:', transformedDiapers.length, 'entries')
      setDiapers(transformedDiapers)
    } catch (err) {
      console.error('❌ Error fetching historical diaper data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch diaper data')
      setDiapers([])
    } finally {
      setLoading(false)
    }
  }, [
    currentBaby?.id, 
    userProfile?.email, 
    startDate?.toISOString(), 
    endDate?.toISOString(), 
    limit
  ])

  useEffect(() => {
    fetchDiapers()
  }, [fetchDiapers])

  return {
    diapers,
    loading,
    error,
    refetch: fetchDiapers
  }
}

// Helper hook for getting diaper data for specific time ranges
export function useWeeklyDiapers(weekOffset = 0): UseHistoricalDiapersReturn {
  const { weekStart, weekEnd } = useMemo(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + (weekOffset * 7))
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return { weekStart: start, weekEnd: end }
  }, [weekOffset])

  return useHistoricalDiapers(weekStart, weekEnd, 200)
}

export function useMonthlyDiapers(monthOffset = 0): UseHistoricalDiapersReturn {
  const { monthStart, monthEnd } = useMemo(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0)
    end.setHours(23, 59, 59, 999)
    return { monthStart: start, monthEnd: end }
  }, [monthOffset])

  return useHistoricalDiapers(monthStart, monthEnd, 500)
}

// Hook for analytics - gets last 30 days of data
export function useDiaperAnalytics(): UseHistoricalDiapersReturn {
  const { startDate, endDate } = useMemo(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 30)
    return { startDate: start, endDate: end }
  }, [])

  return useHistoricalDiapers(startDate, endDate, 1000)
}