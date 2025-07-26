'use client'

import { useEffect } from 'react'
import { useBabyTrackerStore } from '@/lib/store'

export default function DataInitializer() {
  const { initializeProfile, initializeData } = useBabyTrackerStore()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const storedEmail = localStorage.getItem('user-email')
    if (storedEmail === 'nouveau.utilisateur@example.com') {
      localStorage.removeItem('user-email')
      localStorage.removeItem('babytracker-storage')
      window.location.reload()
      return
    }

    if (storedEmail) {
      initializeProfile(storedEmail)
    }
    initializeData()
  }, [initializeProfile, initializeData])

  return null
}
