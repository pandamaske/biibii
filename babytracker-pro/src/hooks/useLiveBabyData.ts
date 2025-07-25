'use client'

import { useState, useEffect, useCallback } from 'react'
import { useBabyTrackerStore } from '@/lib/store'

interface LiveBabyData {
  baby: {
    id: string
    name: string
    birthDate: string
    weight: number
    height: number
    avatar: string
    gender: string
  } | null
  liveData: {
    feedings: Record<string, unknown>[]
    sleeps: Record<string, unknown>[]
    diapers: Record<string, unknown>[]
    stats: {
      totalMilk: number
      totalSleepMinutes: number
      feedingCount: number
      sleepCount: number
      diaperCount: number
      timeSinceLastFeeding: number | null
      lastFeeding: {
        time: string
        amount: number
        type: string
        mood: string
      } | null
    }
  }
  timestamp: string
  loading: boolean
  error: string | null
}

export function useLiveBabyData(refreshInterval: number = 30000) {
  const { currentBaby, userProfile } = useBabyTrackerStore()
  const [data, setData] = useState<LiveBabyData>({
    baby: null,
    liveData: {
      feedings: [],
      sleeps: [],
      diapers: [],
      stats: {
        totalMilk: 0,
        totalSleepMinutes: 0,
        feedingCount: 0,
        sleepCount: 0,
        diaperCount: 0,
        timeSinceLastFeeding: null,
        lastFeeding: null
      }
    },
    timestamp: new Date().toISOString(),
    loading: true,
    error: null
  })

  const fetchLiveData = useCallback(async () => {
    if (!currentBaby || !userProfile?.email) {
      setData(prev => ({ ...prev, loading: false, error: 'Missing baby or user info' }))
      return
    }

    try {
      setData(prev => ({ ...prev, loading: true, error: null }))
      
      const response = await fetch(
        `/api/babies/${currentBaby.id}/live-data?email=${encodeURIComponent(userProfile.email)}`,
        {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch live data: ${response.status}`)
      }

      const liveData = await response.json()
      
      setData({
        baby: liveData.baby,
        liveData: liveData.liveData,
        timestamp: liveData.timestamp,
        loading: false,
        error: null
      })

      console.log('Live data updated:', {
        feedings: liveData.liveData.feedings.length,
        sleeps: liveData.liveData.sleeps.length,
        diapers: liveData.liveData.diapers.length,
        timestamp: liveData.timestamp
      })

    } catch (error) {
      console.error('Error fetching live baby data:', error)
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
    }
  }, [currentBaby, userProfile])

  // Initial fetch and setup interval
  useEffect(() => {
    fetchLiveData()

    const interval = setInterval(fetchLiveData, refreshInterval)
    
    // Listen for manual refresh events
    const handleRefreshEvent = () => {
      console.log('🔄 Live data refresh triggered by event')
      fetchLiveData()
    }
    
    window.addEventListener('refresh-live-data', handleRefreshEvent)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('refresh-live-data', handleRefreshEvent)
    }
  }, [fetchLiveData, refreshInterval])

  // Expose manual refresh function
  const refresh = useCallback(() => {
    fetchLiveData()
  }, [fetchLiveData])

  return {
    ...data,
    refresh
  }
}