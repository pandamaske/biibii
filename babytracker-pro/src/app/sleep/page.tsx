'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useBabyTrackerStore } from '@/lib/store'
import { useLiveBabyData } from '@/hooks/useLiveBabyData'
import { useWeeklySleeps, useSleepAnalytics } from '@/hooks/useHistoricalSleeps'
import { formatTime, formatDuration, getAgeInWeeks, getRecommendedDailySleep } from '@/lib/utils'
import { Moon, Play, Square, Clock, Sun, Bed, Star, AlertCircle, Baby, Trash2, Edit3, Save, X, Calendar } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'

// Sleep quality options with descriptions
const SLEEP_QUALITIES = [
  { value: 'excellent', emoji: '😴', label: 'Excellent', description: 'Sommeil profond et paisible', color: 'green' },
  { value: 'good', emoji: '😊', label: 'Bon', description: 'Sommeil normal et reposant', color: 'blue' },
  { value: 'restless', emoji: '😅', label: 'Agité', description: 'Sommeil léger avec réveils', color: 'yellow' },
  { value: 'difficult', emoji: '😰', label: 'Difficile', description: 'Nombreux réveils', color: 'red' }
] as const

// ✅ Modal d'édition d'une entrée de sommeil
const EditSleepModal = ({ sleep, isOpen, onClose, onSave }: {
  sleep: any
  isOpen: boolean
  onClose: () => void
  onSave: (updatedSleep: any) => void
}) => {
  const [editData, setEditData] = useState({
    startTime: '',
    endTime: '',
    quality: sleep?.quality || 'good',
    type: sleep?.type || 'nap',
    notes: sleep?.notes || ''
  })

  // ✅ Initialiser le formulaire quand le modal s'ouvre
  useEffect(() => {
    if (sleep && isOpen) {
      console.log('📝 Initializing edit form with sleep data:', sleep)
      const startDate = sleep.startTime ? new Date(sleep.startTime) : new Date()
      const endDate = sleep.endTime ? new Date(sleep.endTime) : null
      
      // Helper function to format date for datetime-local input (local timezone)
      const formatForInput = (date: Date) => {
        const offset = date.getTimezoneOffset() * 60000
        const localTime = new Date(date.getTime() - offset)
        return localTime.toISOString().slice(0, 16)
      }
      
      const formData = {
        startTime: formatForInput(startDate),
        endTime: endDate ? formatForInput(endDate) : '',
        quality: sleep.quality,
        type: sleep.type,
        notes: sleep.notes || ''
      }
      
      console.log('📝 Setting form data:', formData)
      setEditData(formData)
    }
  }, [sleep, isOpen])

  const handleSave = () => {
    if (!editData.startTime) return

    console.log('💾 Preparing to save with edit data:', editData)
    
    const updatedSleep = {
      ...sleep,
      startTime: new Date(editData.startTime),
      endTime: editData.endTime ? new Date(editData.endTime) : null,
      quality: editData.quality,
      type: editData.type,
      notes: editData.notes
    }

    console.log('💾 Final updated sleep object:', updatedSleep)
    onSave(updatedSleep)
    onClose()
  }

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEditData({
        startTime: '',
        endTime: '',
        quality: 'good',
        type: 'nap',
        notes: ''
      })
    }
  }, [isOpen])

  if (!isOpen || !sleep) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-6 w-full max-w-md animate-slide-down">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent dark:text-gray-200">
            Modifier le sommeil
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5  dark:text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Date et heure de début */}
          <div>
            <label className="block text-sm font-medium  dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Début du sommeil
            </label>
            <input
              type="datetime-local"
              value={editData.startTime}
              onChange={(e) => setEditData(prev => ({ ...prev, startTime: e.target.value }))}
              className="w-full px-3 py-2 border-2 border-transparent bg-gray-50 dark:bg-gray-700 dark:text-gray-200 rounded-xl focus:border-primary-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-300"
            />
          </div>

          {/* Date et heure de fin */}
          <div>
            <label className="block text-sm font-medium  dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Fin du sommeil
            </label>
            <input
              type="datetime-local"
              value={editData.endTime}
              onChange={(e) => setEditData(prev => ({ ...prev, endTime: e.target.value }))}
              className="w-full px-3 py-2 border-2 border-transparent bg-gray-50 dark:bg-gray-700 dark:text-gray-200 rounded-xl focus:border-primary-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-300"
            />
            <p className="text-xs  dark:text-gray-400 mt-1">
              Laissez vide si le sommeil est en cours
            </p>
          </div>

          {/* Type de sommeil */}
          <div>
            <label className="block text-sm font-medium  dark:text-gray-300 mb-2">
              Type de sommeil
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setEditData(prev => ({ ...prev, type: 'nap' }))}
                className={`p-3 rounded-xl border-2 transition-all duration-300 ${
                  editData.type === 'nap'
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-200'
                    : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700  dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <Sun className="w-5 h-5 mx-auto mb-1" />
                <div className="text-sm font-medium">Sieste</div>
              </button>
              <button
                onClick={() => setEditData(prev => ({ ...prev, type: 'night' }))}
                className={`p-3 rounded-xl border-2 transition-all duration-300 ${
                  editData.type === 'night'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-primary-800 dark:text-indigo-200'
                    : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700  dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <Moon className="w-5 h-5 mx-auto mb-1" />
                <div className="text-sm font-medium">Nuit</div>
              </button>
            </div>
          </div>

          {/* Qualité du sommeil */}
          <div>
            <label className="block text-sm font-medium  dark:text-gray-300 mb-2">
              Qualité du sommeil
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SLEEP_QUALITIES.map(quality => {
                const isSelected = editData.quality === quality.value
                const selectedClasses = {
                  green: 'border-green-500 bg-green-50 dark:bg-green-900/30',
                  blue: 'border-blue-500 bg-blue-50 dark:bg-blue-900/30',
                  yellow: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30',
                  red: 'border-red-500 bg-red-50 dark:bg-red-900/30',
                  gray: 'border-gray-500 bg-gray-50 dark:bg-gray-900/30'
                }
                
                return (
                <button
                  key={quality.value}
                  onClick={() => setEditData(prev => ({ ...prev, quality: quality.value }))}
                  className={`p-3 rounded-xl border-2 transition-all duration-300 ${
                    isSelected
                      ? selectedClasses[quality.color as keyof typeof selectedClasses] || selectedClasses.gray
                      : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="text-xl mb-1">{quality.emoji}</div>
                  <div className="text-xs font-medium">{quality.label}</div>
                </button>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium  dark:text-gray-300 mb-2">
              Notes (optionnel)
            </label>
            <textarea
              value={editData.notes}
              onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Commentaires sur ce sommeil..."
              rows={3}
              className="w-full px-3 py-2 border-2 border-transparent bg-gray-50 dark:bg-gray-700 dark:text-gray-200 rounded-xl focus:border-primary-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-300 resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 bg-primary-500 text-white py-3 rounded-xl font-semibold hover:bg-primary-600 transition-all duration-300 flex items-center justify-center space-x-2 shadow-medium hover:scale-105"
          >
            <Save className="w-5 h-5" />
            <span>Sauvegarder</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-500 text-white py-3 rounded-xl font-semibold hover:bg-gray-600 transition-all duration-300 flex items-center justify-center space-x-2 shadow-medium hover:scale-105"
          >
            <X className="w-5 h-5" />
            <span>Annuler</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper function to get sleep timestamp
const getSleepTimestamp = (sleep: any): Date => {
  return new Date(sleep.startTime)
}

// Weekly Sleep View Component
function WeeklySleepView({ sleeps, loading, error }: { sleeps: any[], loading?: boolean, error?: string | null }) {
  if (loading) {
    return (
      <div className="glass-card backdrop-blur-sm rounded-3xl p-6 shadow-large">
        <h3 className="font-bold mb-4">Vue hebdomadaire</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <span className="ml-3 text-gray-600">Chargement des données...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-card backdrop-blur-sm rounded-3xl p-6 shadow-large">
        <h3 className="font-bold mb-4">Vue hebdomadaire</h3>
        <div className="text-center py-8">
          <p className="text-red-600 mb-2">Erreur lors du chargement</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  const weeklyStats = useMemo(() => {
    const now = new Date()
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
    
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      
      const daySleeps = sleeps.filter(s => {
        const sleepDate = getSleepTimestamp(s)
        return sleepDate.toDateString() === date.toDateString()
      })
      
      const totalDuration = daySleeps.reduce((sum, sleep) => {
        if (sleep.endTime) {
          const duration = (new Date(sleep.endTime).getTime() - new Date(sleep.startTime).getTime()) / (1000 * 60)
          return sum + duration
        }
        return sum
      }, 0)
      
      return {
        date,
        total: daySleeps.length,
        duration: totalDuration,
        quality: daySleeps.filter(s => s.quality === 'excellent' || s.quality === 'good').length
      }
    })
    
    return days
  }, [sleeps])

  const weekTotal = weeklyStats.reduce((sum, day) => sum + day.total, 0)
  const weekTotalDuration = weeklyStats.reduce((sum, day) => sum + day.duration, 0)

  return (
    <div className="space-y-6">
      <div className="glass-card backdrop-blur-sm rounded-3xl p-6 shadow-large">
        <h3 className="font-bold mb-4">Vue hebdomadaire</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-300">{weekTotal}</div>
            <div className="text-sm text-gray-400">Sessions totales</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-300">{Math.round(weekTotalDuration / 60)}h</div>
            <div className="text-sm text-gray-400">Durée totale</div>
          </div>
        </div>
        
        <div className="space-y-3">
          {weeklyStats.map((day, index) => (
            <div key={`week-day-${index}-${day.date.getTime()}`} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="font-medium text-gray-700 dark:text-gray-300">
                {day.date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
              </div>
              <div className="flex space-x-4 text-sm">
                <span className="text-primary-600 dark:text-primary-400">{day.total} sessions</span>
                <span className="text-gray-600 dark:text-gray-400">{Math.round(day.duration)} min</span>
                <span className="text-green-600 dark:text-green-400">{day.quality} qualité</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Sleep Insights View Component
function SleepInsightsView({ sleeps, loading, error }: { sleeps: any[], loading?: boolean, error?: string | null }) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-card backdrop-blur-sm rounded-3xl p-6 shadow-large">
          <h3 className="font-bold mb-4">Analyses et Recommandations</h3>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <span className="ml-3 text-gray-600">Analyse des données...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="glass-card backdrop-blur-sm rounded-3xl p-6 shadow-large">
          <h3 className="font-bold mb-4">Analyses et Recommandations</h3>
          <div className="text-center py-8">
            <p className="text-red-600 mb-2">Erreur lors du chargement</p>
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  const insights = useMemo(() => {
    const completedSleeps = sleeps.filter(s => s.endTime)
    
    if (completedSleeps.length === 0) {
      return {
        averageDaily: 0,
        qualityRate: 0,
        longestSleep: 0,
        patterns: [],
        recommendations: ['Commencez à enregistrer des sessions de sommeil pour obtenir des analyses personnalisées.']
      }
    }

    // Calculate average daily sleep
    const totalDuration = completedSleeps.reduce((sum, sleep) => {
      const duration = (new Date(sleep.endTime).getTime() - new Date(sleep.startTime).getTime()) / (1000 * 60)
      return sum + duration
    }, 0)
    
    const uniqueDays = new Set(completedSleeps.map(s => getSleepTimestamp(s).toDateString())).size
    const averageDaily = uniqueDays > 0 ? Math.round(totalDuration / uniqueDays) : 0

    // Quality analysis
    const qualitySleeps = completedSleeps.filter(s => s.quality === 'excellent' || s.quality === 'good').length
    const qualityRate = Math.round((qualitySleeps / completedSleeps.length) * 100)

    // Longest sleep
    const longestSleep = Math.max(...completedSleeps.map(s => {
      return (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / (1000 * 60)
    }))

    // Generate recommendations
    const recommendations = []
    if (averageDaily < 480) { // Less than 8 hours
      recommendations.push('Votre bébé dort moins que recommandé. Essayez d\'établir une routine de sommeil.')
    }
    if (qualityRate < 70) {
      recommendations.push('La qualité du sommeil peut être améliorée. Vérifiez l\'environnement de sommeil.')
    }
    if (longestSleep < 120) {
      recommendations.push('Les sessions de sommeil semblent courtes. Considérez des siestes plus longues.')
    }
    if (recommendations.length === 0) {
      recommendations.push('Excellent travail ! Votre bébé a de bonnes habitudes de sommeil.')
    }

    return {
      averageDaily,
      qualityRate,
      longestSleep,
      patterns: [],
      recommendations
    }
  }, [sleeps])

  return (
    <div className="space-y-6">
      <div className="glass-card backdrop-blur-sm rounded-3xl p-6 shadow-large">
        <h3 className="font-bold mb-4 flex items-center space-x-2">
          <Moon className="w-5 h-5 text-primary-600" />
          <span>Analyses et Recommandations</span>
        </h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-primary-50 dark:bg-primary-900/30 rounded-2xl">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-300">{Math.round(insights.averageDaily / 60)}h {insights.averageDaily % 60}min</div>
            <div className="text-sm text-gray-400">Moyenne quotidienne</div>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-2xl">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{insights.qualityRate}%</div>
            <div className="text-sm text-gray-400">Qualité de sommeil</div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-2xl p-4 mb-4">
          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Plus long sommeil</h4>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {Math.round(insights.longestSleep / 60)}h {Math.round(insights.longestSleep % 60)}min
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/30 rounded-2xl p-4">
          <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-3">Recommandations</h4>
          <ul className="space-y-2">
            {insights.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-amber-600 dark:text-amber-400 mt-1">•</span>
                <span className="text-amber-700 dark:text-amber-300 text-sm">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function SleepPage() {
  // ✅ Helper functions pour gérer les dates de façon sécurisée
  const ensureDate = (value: any): Date | null => {
    if (!value) return null
    if (value instanceof Date) return value
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value)
      return isNaN(date.getTime()) ? null : date
    }
    return null
  }

  const formatTimeFromDate = (date: any): string => {
    const validDate = ensureDate(date)
    if (!validDate) return '--:--'
    return validDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  const safeFormatRelativeTime = (dateValue: any): string => {
    const validDate = ensureDate(dateValue)
    if (!validDate) return 'il y a longtemps'
    
    const now = new Date()
    const diffMs = now.getTime() - validDate.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMinutes < 1) return 'à l\'instant'
    if (diffMinutes < 60) return `il y a ${diffMinutes}min`
    if (diffHours < 24) return `il y a ${diffHours}h`
    if (diffDays < 7) return `il y a ${diffDays}j`
    return validDate.toLocaleDateString('fr-FR')
  }

  const [timer, setTimer] = useState(0)
  const [showQualitySelection, setShowQualitySelection] = useState(false)
  const [editingSleep, setEditingSleep] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [viewMode, setViewMode] = useState<'today' | 'week' | 'insights'>('today')

  const {
    currentBaby,
    sleepTimer,
    startSleepTimer,
    endSleepTimer,
    updateSleepTimer,
    removeSleep,
    addSleep,
    updateSleep,
    initializeData,
    initializeProfile
  } = useBabyTrackerStore()

  // ✅ Live data hook for real-time SQL data
  const liveData = useLiveBabyData(15000) // Refresh every 15 seconds
  
  // ✅ Historical data hooks for weekly and analytics views
  const weeklyData = useWeeklySleeps()
  const analyticsData = useSleepAnalytics()

  // Initialize data on mount
  useEffect(() => {
    // Check for stored email and initialize profile from database
    const storedEmail = localStorage.getItem('user-email')
    if (storedEmail && storedEmail !== 'nouveau.utilisateur@example.com') {
      console.log('Sleep page: initializing profile for email:', storedEmail)
      initializeProfile(storedEmail)
    }
    initializeData()
  }, [initializeData, initializeProfile])

  // Real-time timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (sleepTimer.isRunning) {
      interval = setInterval(() => {
        setTimer(prev => {
          const newTime = prev + 1
          updateSleepTimer({ seconds: newTime })
          return newTime
        })
      }, 1000)
    } else {
      setTimer(0)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [sleepTimer.isRunning, updateSleepTimer])

  // Sync timer with store
  useEffect(() => {
    setTimer(sleepTimer.seconds)
  }, [sleepTimer.seconds])

  if (!currentBaby) {
    return (
      <AppLayout>
        <div className="p-6 text-center">
          <h1 className="text-4xl font-bold mb-8 gradient-text">Sommeil</h1>
          <div className="glass-card rounded-3xl p-8 shadow-large border border-gray-100 dark:border-gray-700">
            <Baby className="w-16 h-16 mx-auto  dark:text-gray-500 mb-4 animate-float" />
            <p className="text-gray-600 dark:text-gray-400">Créez d'abord le profil de votre bébé</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const ageInWeeks = getAgeInWeeks(currentBaby.birthDate)
  const todaySleeps = liveData.liveData.sleeps || []
  const totalSleep = liveData.liveData.stats.totalSleepMinutes || 0
  const recommendedSleep = getRecommendedDailySleep(ageInWeeks)

  // Calculate sleep statistics
  const sleepSessions = todaySleeps.length
  const averageSleepDuration = sleepSessions > 0 ? Math.round(totalSleep / sleepSessions) : 0
  const longestSleep = todaySleeps.reduce((max, sleep) => {
    if (!sleep.endTime) return max
    const startDate = ensureDate(sleep.startTime)
    const endDate = ensureDate(sleep.endTime)
    if (!startDate || !endDate) return max
    const duration = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60))
    return Math.max(max, duration)
  }, 0)

  // Handle starting sleep
  const handleStartSleep = () => {
    startSleepTimer()
    setTimer(0)
  }

  // Handle ending sleep with quality
  const handleEndSleep = (quality: 'excellent' | 'good' | 'restless' | 'difficult') => {
    endSleepTimer(quality)
    setTimer(0)
    setShowQualitySelection(false)
    
    // ✅ Force refresh live data immediately
    setTimeout(() => liveData.refresh(), 100)
    
    // ✅ Also trigger global refresh event
    window.dispatchEvent(new CustomEvent('refresh-live-data'))
  }

  // Handle quick nap (preset duration)
  const handleQuickNap = (minutes: number) => {
    const now = new Date()
    const startTime = new Date(now.getTime() - minutes * 60 * 1000)
    
    addSleep({
      id: Date.now().toString(),
      babyId: currentBaby.id,
      startTime,
      endTime: now,
      quality: 'good',
      type: 'nap',
      notes: `Sieste de ${minutes}min (ajout rapide)`
    })
    
    // ✅ Force refresh live data immediately after quick nap
    setTimeout(() => liveData.refresh(), 100)
    window.dispatchEvent(new CustomEvent('refresh-live-data'))
  }

  // ✅ Handle edit sleep
  const handleEditSleep = (sleep: any) => {
    console.log('🔧 Opening edit modal for sleep:', sleep)
    setEditingSleep(sleep)
    setShowEditModal(true)
  }

  // ✅ Handle save edited sleep
  const handleSaveEditedSleep = (updatedSleep: any) => {
    console.log('💾 Saving updated sleep:', updatedSleep)
    updateSleep(updatedSleep.id, {
      startTime: updatedSleep.startTime,
      endTime: updatedSleep.endTime,
      quality: updatedSleep.quality,
      type: updatedSleep.type,
      notes: updatedSleep.notes
    })
    
    // ✅ Force refresh live data immediately after update
    setTimeout(() => liveData.refresh(), 100)
    window.dispatchEvent(new CustomEvent('refresh-live-data'))
    
    // Close modal after successful update
    setShowEditModal(false)
    setEditingSleep(null)
  }

  // Get color for sleep quality
  const getQualityColor = (quality: string) => {
    const qualityObj = SLEEP_QUALITIES.find(q => q.value === quality)
    return qualityObj?.color || 'gray'
  }

  return (
    <AppLayout 
      className="bg-gradient-to-b from-primary-400 to-white"
      currentPage="Sommeil"
      showHeader={true}
    >
      <div className="p-6 space-y-8">
        {/* Active Sleep Session */}
        {sleepTimer.isRunning && (
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 border-2 border-purple-200 dark:border-purple-700 rounded-3xl p-6 shadow-large animate-slide-up">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <Moon className="w-8 h-8 text-primary-600 dark:text-primary-400 animate-gentle-bounce" />
                <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-200">Sommeil en cours</h2>
              </div>
              
              <div className="text-5xl font-mono font-bold text-primary-600 dark:text-primary-400 py-4 animate-fade-in">
                {formatTime(timer)}
              </div>
              
              <p className="text-purple-500 dark:text-purple-400 text-sm">
                Commencé à {sleepTimer.startTime ? new Date(sleepTimer.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </p>
              
              <div className="flex items-center justify-center space-x-2 text-primary-600 dark:text-primary-400 text-sm">
                <Clock className="w-4 h-4" />
                <span>
                  {timer < 30 * 60 ? 'Endormissement...' :
                   timer < 120 * 60 ? 'Sieste en cours' :
                   'Sommeil long en cours'}
                </span>
              </div>
              
              {/* End sleep button */}
              <button
                onClick={() => setShowQualitySelection(true)}
                className="bg-purple-500 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-purple-600 transition-all duration-300 transform hover:scale-105 shadow-large card-hover"
              >
                <Square className="w-6 h-6 mx-auto mb-2" />
                Terminer le sommeil
              </button>
            </div>
          </div>
        )}

        {/* Sleep Quality Selection */}
        {showQualitySelection && (
          <div className="glass-card rounded-3xl p-6 shadow-large border-2 border-purple-200 dark:border-purple-700 animate-slide-up">
            <h3 className="text-xl font-bold text-center mb-6 gradient-text dark:text-gray-200">
              Comment s'est passé le sommeil ?
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              {SLEEP_QUALITIES.map(quality => (
                <button
                  key={quality.value}
                  onClick={() => handleEndSleep(quality.value)}
                  className={`p-4 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 card-hover ${
                    quality.color === 'green' ? 'border-primary-200 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-900/50' :
                    quality.color === 'blue' ? 'border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50' :
                    quality.color === 'yellow' ? 'border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/50' :
                    'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50'
                  }`}
                >
                  <div className="text-3xl mb-2 animate-gentle-bounce">{quality.emoji}</div>
                  <div className={`font-semibold mb-1 ${
                    quality.color === 'green' ? 'text-primary-800 dark:text-primary-200' :
                    quality.color === 'blue' ? 'text-primary-800 dark:text-blue-200' :
                    quality.color === 'yellow' ? 'text-yellow-800 dark:text-yellow-200' :
                    'text-red-800 dark:text-red-200'
                  }`}>
                    {quality.label}
                  </div>
                  <div className={`text-xs ${
                    quality.color === 'green' ? 'text-primary-600 dark:text-primary-400' :
                    quality.color === 'blue' ? 'text-primary-600 dark:text-blue-400' :
                    quality.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>
                    {quality.description}
                  </div>
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowQualitySelection(false)}
              className="w-full mt-4 py-3  dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl"
            >
              Annuler
            </button>
          </div>
        )}

        {/* Daily Sleep Summary */}
        {!sleepTimer.isRunning && !showQualitySelection && (
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-3xl p-6 text-white shadow-large card-hover">
            <div className="text-center space-y-4">
              <Moon className="w-8 h-8 mx-auto animate-float" />
              <h2 className="text-2xl font-bold">Aujourd'hui</h2>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
                  <div className="text-3xl font-bold">{formatDuration(totalSleep)}</div>
                  <div className="text-purple-100 text-sm">Total</div>
                </div>
                
                <div className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
                  <div className="text-3xl font-bold">{sleepSessions}</div>
                  <div className="text-purple-100 text-sm">Sessions</div>
                </div>
                
                <div className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
                  <div className="text-3xl font-bold">{formatDuration(recommendedSleep)}</div>
                  <div className="text-purple-100 text-sm">Objectif</div>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Progression du jour</span>
                  <span>{Math.round((totalSleep / recommendedSleep) * 100)}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3 backdrop-blur-sm">
                  <div 
                    className="bg-white h-3 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                    style={{ width: `${Math.min((totalSleep / recommendedSleep) * 100, 100)}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                  </div>
                </div>
              </div>
              
              {averageSleepDuration > 0 && (
                <p className="text-purple-100 text-sm">
                  Durée moyenne: {formatDuration(averageSleepDuration)} • Plus long: {formatDuration(longestSleep)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Sleep Action Buttons */}
        {!sleepTimer.isRunning && !showQualitySelection && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold dark:text-gray-200 text-center">Actions rapides</h3>
            
            {/* Main sleep timer button */}
            <button
              onClick={handleStartSleep}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-3xl p-8 font-semibold text-xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-large card-hover"
            >
              <Play className="w-12 h-12 mx-auto mb-4 animate-gentle-bounce" />
              <div className="text-2xl font-bold mb-2">Démarrer le sommeil</div>
              <div className="text-sm opacity-80">Timer en temps réel</div>
            </button>
            
            {/* Quick nap buttons */}
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => handleQuickNap(15)}
                className="bg-gradient-to-r from-emerald-50 to-primary-50 dark:from-emerald-900/30 dark:to-primary-900/30 border border-emerald-200 dark:border-emerald-700 rounded-2xl p-4 card-hover"
              >
                <Clock className="w-6 h-6 mx-auto mb-2 animate-float dark:text-gray-300" />
                <div className="text-lg font-bold dark:text-gray-200">15min</div>
                <div className="text-xs opacity-80 dark:text-gray-400">Micro-sieste</div>
              </button>
              
              <button
                onClick={() => handleQuickNap(30)}
                className="bg-gradient-to-r from-emerald-50 to-primary-50 dark:from-emerald-900/30 dark:to-primary-900/30 border border-emerald-200 dark:border-emerald-700 rounded-2xl p-4 card-hover"
              >
                <Sun className="w-6 h-6 mx-auto mb-2 animate-float dark:text-gray-300" />
                <div className="text-lg font-bold dark:text-gray-200">30min</div>
                <div className="text-xs opacity-80 dark:text-gray-400">Sieste courte</div>
              </button>
              
              <button
                onClick={() => handleQuickNap(60)}
                className="bg-gradient-to-r from-emerald-50 to-primary-50 dark:from-emerald-900/30 dark:to-primary-900/30 border border-emerald-200 dark:border-emerald-700 rounded-2xl p-4 card-hover"
              >
                <Bed className="w-6 h-6 mx-auto mb-2 animate-float dark:text-gray-300" />
                <div className="text-lg font-bold dark:text-gray-200">1h</div>
                <div className="text-xs opacity-80 dark:text-gray-400">Sieste longue</div>
              </button>
            </div>
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="flex items-center justify-center space-x-2 mb-6">
          <button
            onClick={() => setViewMode('today')}
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
              viewMode === 'today' 
                ? 'bg-primary-500 text-white shadow-lg' 
                : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
              viewMode === 'week' 
                ? 'bg-primary-500 text-white shadow-lg' 
                : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Semaine
          </button>
          <button
            onClick={() => setViewMode('insights')}
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
              viewMode === 'insights' 
                ? 'bg-primary-500 text-white shadow-lg' 
                : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Analyses
          </button>
        </div>

        {/* Today's Sleep History */}
        {viewMode === 'today' && (
          <div>
            <div className="glass-card rounded-3xl p-6 shadow-large border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold dark:text-gray-200 flex items-center space-x-2">
              <Clock className="w-5 h-5  dark:text-gray-400" />
              <span>Aujourd'hui ({sleepSessions})</span>
            </h3>
            
            {totalSleep > 0 && (
              <div className="text-sm  dark:text-gray-400 font-medium">
                Total: {formatDuration(totalSleep)}
              </div>
            )}
          </div>

          {todaySleeps.length === 0 ? (
            <div className="text-center py-8  dark:text-gray-400">
              <Moon className="w-12 h-12 mx-auto mb-4 opacity-30 animate-float" />
              <p className="font-medium">Aucun sommeil enregistré aujourd'hui</p>
              <p className="text-sm">Démarrez un timer ou ajoutez une sieste rapide</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaySleeps
                .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                .map((sleep) => {
                  const startDate = ensureDate(sleep.startTime)
                  const endDate = ensureDate(sleep.endTime)
                  const duration = startDate && endDate 
                    ? Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60))
                    : 0
                  const qualityColor = getQualityColor(sleep.quality)
                  const qualityObj = SLEEP_QUALITIES.find(q => q.value === sleep.quality)
                  
                  return (
                    <div
                      key={sleep.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 hover-lift"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`rounded-full p-3 ${
                          sleep.type === 'night' ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-cyan-100 dark:bg-cyan-900/30'
                        }`}>
                          {sleep.type === 'night' ? (
                            <Moon className="w-5 h-5 text-primary-600" />
                          ) : (
                            <Sun className="w-5 h-5 text-cyan-600" />
                          )}
                        </div>
                        
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200">
                            {sleep.type === 'night' ? 'Nuit' : 'Sieste'}
                            {duration > 0 && ` • ${formatDuration(duration)}`}
                          </p>
                          <div className="flex items-center space-x-4 text-sm  dark:text-gray-400">
                            <span>{formatTimeFromDate(sleep.startTime)}</span>
                            {sleep.endTime && (
                              <span>- {formatTimeFromDate(sleep.endTime)}</span>
                            )}
                            <span>{safeFormatRelativeTime(sleep.startTime)}</span>
                          </div>
                          {sleep.notes && (
                            <p className="text-xs  dark:text-gray-500 mt-1">{sleep.notes}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {/* Quality indicator */}
                        <div className="text-center">
                          <div className="text-2xl filter drop-shadow-sm">{qualityObj?.emoji || '😐'}</div>
                          <div className={`text-xs font-medium ${
                            qualityColor === 'green' ? 'text-primary-600 dark:text-primary-400' :
                            qualityColor === 'blue' ? 'text-primary-600 dark:text-blue-400' :
                            qualityColor === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {qualityObj?.label || 'Normal'}
                          </div>
                        </div>
                        
                        {/* ✅ Edit button */}
                        <button
                          onClick={() => handleEditSleep(sleep)}
                          className="text-primary-500 hover:text-primary-600 p-2 hover:bg-primary-50 rounded-lg transition-all duration-300 hover:scale-110"
                          title="Modifier"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        
                        {/* Delete button */}
                        <button
                          onClick={() => {
                            removeSleep(sleep.id)
                            
                            // ✅ Force refresh live data immediately
                            setTimeout(() => liveData.refresh(), 100)
                            
                            // ✅ Also trigger global refresh event
                            window.dispatchEvent(new CustomEvent('refresh-live-data'))
                          }}
                          className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-all duration-300 hover:scale-110"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
            </div>

            {/* Sleep Analytics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/30 dark:to-blue-900/30 border border-cyan-200 dark:border-cyan-700 rounded-2xl p-4 card-hover">
            <h4 className="font-semibold text-cyan-800 dark:text-cyan-200 mb-2">Durée moyenne</h4>
            <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
              {formatDuration(averageSleepDuration)}
            </div>
            <p className="text-cyan-600 dark:text-cyan-400 text-sm">
              Par session ({sleepSessions} aujourd'hui)
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 border border-purple-200 dark:border-purple-700 rounded-2xl p-4 card-hover">
            <h4 className="font-semibold text-primary-800 dark:text-primary-200 mb-2">Plus long sommeil</h4>
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {formatDuration(longestSleep)}
            </div>
            <p className="text-primary-600 dark:text-primary-400 text-sm">
              {longestSleep >= 120 ? 'Excellent!' : 'Continuez comme ça'}
            </p>
          </div>
        </div>

        {/* Sleep Tips */}
        {totalSleep < recommendedSleep * 0.7 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border-2 border-amber-200 dark:border-amber-700 rounded-2xl p-4 animate-fade-in">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 animate-gentle-bounce" />
              <div>
                <h4 className="font-semibold text-amber-800 dark:text-amber-200">Conseil sommeil</h4>
                <p className="text-amber-700 dark:text-amber-300 text-sm">
                  Votre bébé a dormi {formatDuration(totalSleep)} aujourd'hui. 
                  L'objectif est de {formatDuration(recommendedSleep)} pour son âge.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sleep Achievement */}
        {totalSleep >= recommendedSleep && (
          <div className="bg-gradient-to-r from-primary-50 to-emerald-50 dark:from-primary-900/30 dark:to-emerald-900/30 border-2 border-primary-200 dark:border-primary-700 rounded-2xl p-4 animate-fade-in">
            <div className="flex items-center space-x-3">
              <Star className="w-6 h-6 text-primary-600 dark:text-primary-400 animate-gentle-bounce" />
              <div>
                <h4 className="font-semibold text-primary-800 dark:text-primary-200">🎉 Objectif atteint !</h4>
                <p className="text-primary-700 dark:text-primary-300 text-sm">
                  Excellent ! Votre bébé a atteint son objectif de sommeil quotidien.
                </p>
              </div>
            </div>
          </div>
        )}
          </div>
        )}

        {/* Weekly View */}
        {viewMode === 'week' && (
          <WeeklySleepView sleeps={weeklyData.sleeps} loading={weeklyData.loading} error={weeklyData.error} />
        )}

        {/* Insights View */}
        {viewMode === 'insights' && (
          <SleepInsightsView sleeps={analyticsData.sleeps} loading={analyticsData.loading} error={analyticsData.error} />
        )}

        {/* ✅ Edit Sleep Modal */}
        <EditSleepModal
          sleep={editingSleep}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setEditingSleep(null)
          }}
          onSave={handleSaveEditedSleep}
        />
      </div>
    </AppLayout>
  )
}