'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useBabyTrackerStore } from '@/lib/store'

interface SleepEntry {
  id: string
  babyId: string
  startTime: Date
  endTime?: Date
  duration?: number
  quality?: string
  type?: string
  location?: string
  notes?: string
}

interface UseHistoricalSleepsReturn {
  sleeps: SleepEntry[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useHistoricalSleeps(
  startDate?: Date,
  endDate?: Date,
  limit = 100
): UseHistoricalSleepsReturn {
  const [sleeps, setSleeps] = useState<SleepEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { currentBaby, userProfile } = useBabyTrackerStore()

  const fetchSleeps = useCallback(async () => {
    console.log('🔍 fetchSleeps called with:', {
      currentBabyId: currentBaby?.id,
      userEmail: userProfile?.email,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      limit
    })

    if (!currentBaby?.id || !userProfile?.email) {
      console.log('❌ Missing required data:', { currentBaby: !!currentBaby, userProfile: !!userProfile })
      setSleeps([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        email: userProfile.email,
        type: 'sleep',
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
        throw new Error(`Failed to fetch sleep entries: ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log('📊 API Response data:', data)
      
      // Transform the data to match our SleepEntry interface
      const transformedSleeps = data.entries.map((entry: Record<string, unknown>) => ({
        ...entry,
        startTime: new Date(entry.startTime),
        endTime: entry.endTime ? new Date(entry.endTime) : undefined
      }))

      console.log('✅ Transformed sleeps:', transformedSleeps.length, 'entries')
      setSleeps(transformedSleeps)
    } catch (err) {
      console.error('❌ Error fetching historical sleep data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch sleep data')
      setSleeps([])
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
    fetchSleeps()
  }, [fetchSleeps])

  return {
    sleeps,
    loading,
    error,
    refetch: fetchSleeps
  }
}

// Helper hook for getting sleep data for specific time ranges
export function useWeeklySleeps(weekOffset = 0): UseHistoricalSleepsReturn {
  const { weekStart, weekEnd } = useMemo(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + (weekOffset * 7))
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return { weekStart: start, weekEnd: end }
  }, [weekOffset])

  return useHistoricalSleeps(weekStart, weekEnd, 200)
}

export function useMonthlySleeps(monthOffset = 0): UseHistoricalSleepsReturn {
  const { monthStart, monthEnd } = useMemo(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0)
    end.setHours(23, 59, 59, 999)
    return { monthStart: start, monthEnd: end }
  }, [monthOffset])

  return useHistoricalSleeps(monthStart, monthEnd, 500)
}

// Hook for analytics - gets last 30 days of data
export function useSleepAnalytics(): UseHistoricalSleepsReturn {
  const { startDate, endDate } = useMemo(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 30)
    return { startDate: start, endDate: end }
  }, [])

  return useHistoricalSleeps(startDate, endDate, 1000)
}