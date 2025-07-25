'use client'

import { useState, useCallback } from 'react'
import { useBabyTrackerStore } from '@/lib/store'
import { UserProfile, AppSettings } from '@/lib/store'

export function useProfile() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { 
    userProfile, 
    appSettings, 
    familyMembers,
    updateUserProfile, 
    updateAppSettings,
    addFamilyMember,
    removeFamilyMember,
    exportUserData
  } = useBabyTrackerStore()

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    setIsLoading(true)
    setError(null)
    
    try {
      updateUserProfile(updates)
      // Here you could add API call to sync with backend
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API call
    } catch (err) {
      setError('Erreur lors de la mise à jour du profil')
    } finally {
      setIsLoading(false)
    }
  }, [updateUserProfile])

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    setIsLoading(true)
    setError(null)
    
    try {
      updateAppSettings(updates as any)
      // Here you could add API call to sync with backend
      await new Promise(resolve => setTimeout(resolve, 300)) // Simulate API call
    } catch (err) {
      setError('Erreur lors de la mise à jour des paramètres')
    } finally {
      setIsLoading(false)
    }
  }, [updateAppSettings])

  const inviteFamilyMember = useCallback(async (email: string, role: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const newMember = {
        id: Date.now().toString(),
        email,
        name: email.split('@')[0], // Extract name from email
        role: role as any,
        permissions: {
          viewData: true,
          addEntries: role === 'partner',
          editEntries: role === 'partner',
          manageSettings: false
        },
        inviteStatus: 'pending' as const,
        isActive: false
      }
      
      addFamilyMember(newMember)
      // Here you could send actual invitation email
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
    } catch (err) {
      setError('Erreur lors de l\'envoi de l\'invitation')
    } finally {
      setIsLoading(false)
    }
  }, [addFamilyMember])

  const exportData = useCallback(() => {
    const data = exportUserData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `babytracker-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [exportUserData])

  return {
    userProfile,
    appSettings,
    familyMembers,
    isLoading,
    error,
    updateProfile,
    updateSettings,
    inviteFamilyMember,
    removeFamilyMember,
    exportData
  }
}