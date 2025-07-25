'use client'

import { useState, useEffect, useCallback } from 'react'
import { useBabyTrackerStore } from '@/lib/store'
import { useLiveBabyData } from '@/hooks/useLiveBabyData'
import { formatTime, formatDuration, getAgeInWeeks, getRecommendedDailyMilk } from '@/lib/utils'
import { Milk, Square, Clock, Edit3, Trash2, Baby, X, Save, Calendar } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import ClientOnly from '@/components/ClientOnly'

// Quick amount buttons for fast entry
const QUICK_AMOUNTS = [120, 150, 180, 210, 240]

// Feeding types avec descriptions
const FEEDING_TYPES = [
  { value: 'biberon', emoji: '🍼', label: 'Biberon', description: 'Lait artificiel ou maternel', color: 'blue' },
  { value: 'tétée', emoji: '🤱', label: 'Tétée', description: 'Allaitement maternel', color: 'pink' },
  { value: 'solide', emoji: '🥄', label: 'Solide', description: 'Purée, compote...', color: 'green' }
] as const

// Mood options avec descriptions
const MOOD_OPTIONS = [
  { value: 'happy', emoji: '😊', label: 'Excellent', description: 'A très bien mangé', color: 'green' },
  { value: 'content', emoji: '😌', label: 'Normal', description: 'Repas standard', color: 'blue' },
  { value: 'difficult', emoji: '😰', label: 'Difficile', description: 'A eu du mal à manger', color: 'orange' }
] as const

// ✅ Helper functions HORS du composant pour éviter les problèmes de hooks
const ensureDate = (value: unknown): Date | null => {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    return isNaN(date.getTime()) ? null : date
  }
  return null
}

const formatTimeFromDate = (date: unknown): string => {
  const validDate = ensureDate(date)
  if (!validDate) return '--:--'
  return validDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

const safeFormatRelativeTime = (dateValue: unknown): string => {
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

// ✅ Modal d'édition d'une entrée de repas
const EditFeedingModal = ({ feeding, isOpen, onClose, onSave }: {
  feeding: Record<string, unknown>
  isOpen: boolean
  onClose: () => void
  onSave: (updatedFeeding: Record<string, unknown>) => void
}) => {
  const [editData, setEditData] = useState({
    startTime: '',
    kind: 'biberon' as const,
    amount: '',
    duration: '',
    mood: 'content' as const,
    notes: ''
  })

  // ✅ Initialiser le formulaire
  useEffect(() => {
    if (feeding && isOpen) {
      console.log('Initializing edit modal with feeding:', feeding)
      const startDate = feeding.startTime ? ensureDate(feeding.startTime) || new Date() : new Date()
      
      const initialData = {
        startTime: startDate.toISOString().slice(0, 16),
        kind: feeding.kind || 'biberon',
        amount: feeding.amount?.toString() || '',
        duration: Math.floor((feeding.duration || 0) / 60).toString(),
        mood: feeding.mood || 'content',
        notes: feeding.notes || ''
      }
      
      console.log('Setting edit data to:', initialData)
      setEditData(initialData)
    }
  }, [feeding, isOpen])

  const handleSave = useCallback(() => {
    if (!editData.startTime) return

    console.log('Edit modal saving with data:', editData)

    const updatedFeeding = {
      ...feeding,
      startTime: new Date(editData.startTime),
      kind: editData.kind,
      amount: editData.amount ? parseInt(editData.amount) : undefined,
      duration: editData.duration ? parseInt(editData.duration) * 60 : 0,
      mood: editData.mood,
      notes: editData.notes
    }

    console.log('Updated feeding object:', updatedFeeding)
    onSave(updatedFeeding)
    onClose()
  }, [editData, feeding, onSave, onClose])

  if (!isOpen || !feeding) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-6 w-full max-w-md animate-slide-down">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold dark:text-gray-200">
            Modifier le repas
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5  dark:text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Date et heure */}
          <div>
            <label className="block text-sm font-medium  dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Date et heure du repas
            </label>
            <input
              type="datetime-local"
              value={editData.startTime}
              onChange={(e) => setEditData(prev => ({ ...prev, startTime: e.target.value }))}
              className="w-full px-3 py-2 border-2 border-transparent bg-gray-50 dark:bg-gray-700 dark:text-gray-200 rounded-xl focus:border-primary-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-300"
            />
          </div>

          {/* Type de repas */}
          <div>
            <label className="block text-sm font-medium  dark:text-gray-300 mb-2">
              Type de repas
            </label>
            <div className="grid grid-cols-3 gap-2">
              {FEEDING_TYPES.map(type => {
                const isSelected = editData.kind === type.value
                return (
                  <button
                    key={type.value}
                    onClick={() => {
                      console.log('Type button clicked:', type.value, 'current:', editData.kind)
                      setEditData(prev => ({ ...prev, kind: type.value }))
                    }}
                    className={`p-3 rounded-xl border-2 transition-all duration-300 ${
                      isSelected
                        ? type.color === 'blue' 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : type.color === 'pink' 
                          ? 'border-pink-500 bg-pink-50 text-pink-700'
                          : 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600  dark:text-gray-300'
                    }`}
                  >
                    <div className="text-xl mb-1">{type.emoji}</div>
                    <div className="text-xs font-medium">{type.label}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quantité */}
          {editData.kind !== 'tétée' && (
            <div>
              <label className="block text-sm font-medium  dark:text-gray-300 mb-2">
                Quantité (ml)
              </label>
              <input
                type="number"
                value={editData.amount}
                onChange={(e) => setEditData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="Ex: 150"
                className="w-full px-3 py-2 border-2 border-transparent bg-gray-50 dark:bg-gray-700 dark:text-gray-200 rounded-xl focus:border-primary-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-300"
              />
            </div>
          )}

          {/* Durée */}
          <div>
            <label className="block text-sm font-medium  dark:text-gray-300 mb-2">
              Durée (minutes)
            </label>
            <input
              type="number"
              value={editData.duration}
              onChange={(e) => setEditData(prev => ({ ...prev, duration: e.target.value }))}
              placeholder="Ex: 15"
              className="w-full px-3 py-2 border-2 border-transparent bg-gray-50 dark:bg-gray-700 dark:text-gray-200 rounded-xl focus:border-primary-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-300"
            />
          </div>

          {/* Humeur */}
          <div>
            <label className="block text-sm font-medium  dark:text-gray-300 mb-2">
              Comment ça s'est passé ?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {MOOD_OPTIONS.map(mood => {
                const isMoodSelected = editData.mood === mood.value
                return (
                  <button
                    key={mood.value}
                    onClick={() => setEditData(prev => ({ ...prev, mood: mood.value }))}
                    className={`p-3 rounded-xl border-2 transition-all duration-300 ${
                      isMoodSelected
                        ? mood.color === 'green'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : mood.color === 'blue'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600  dark:text-gray-300'
                    }`}
                  >
                    <div className="text-xl mb-1">{mood.emoji}</div>
                    <div className="text-xs font-medium">{mood.label}</div>
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
              placeholder="Commentaires sur ce repas..."
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

export default function FeedingPage() {
  // ✅ TOUS les états d'abord, dans un ordre fixe
  const [customAmount, setCustomAmount] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [timer, setTimer] = useState(0)
  const [editingFeeding, setEditingFeeding] = useState<Record<string, unknown> | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  // ✅ Store hook (for session management only)
  const {
    currentBaby,
    feedingSession,
    startFeedingSession,
    endFeedingSession,
    updateFeedingSession,
    removeFeeding,
    updateFeeding,
    initializeData,
    initializeProfile
  } = useBabyTrackerStore()

  // ✅ Live data hook for real-time SQL data (faster refresh for feeding page)
  const liveData = useLiveBabyData(5000) // Refresh every 5 seconds for better responsiveness

  // ✅ TOUS les useEffect d'abord
  useEffect(() => {
    // Check for stored email and initialize profile from database
    const storedEmail = localStorage.getItem('user-email')
    if (storedEmail && storedEmail !== 'nouveau.utilisateur@example.com') {
      console.log('Feeding page: initializing profile for email:', storedEmail)
      initializeProfile(storedEmail)
    }
    initializeData()
  }, [initializeData, initializeProfile])

  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (feedingSession.isActive) {
      setTimer(feedingSession.timerSeconds)
      
      interval = setInterval(() => {
        setTimer(prev => {
          const newTime = prev + 1
          // Update the feeding session timer in the store as well
          updateFeedingSession({ timerSeconds: newTime })
          return newTime
        })
      }, 1000)
    } else {
      setTimer(0)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [feedingSession.isActive, feedingSession.timerSeconds])

  // ✅ TOUS les useCallback ensuite, dans un ordre fixe
  const handleQuickFeed = useCallback((amount: number, type: 'biberon' | 'tétée' = 'biberon') => {
    startFeedingSession(type, amount)
    setTimer(0)
  }, [])

  const handleCustomFeed = useCallback((type: 'biberon' | 'tétée' | 'solide' = 'biberon') => {
    const amount = parseInt(customAmount)
    if (amount > 0 || type === 'tétée' || type === 'solide') {
      startFeedingSession(type, amount > 0 ? amount : 0)
      setCustomAmount('')
      setShowCustomInput(false)
      setTimer(0)
    }
  }, [customAmount])

  const handleEndFeed = useCallback((mood: 'happy' | 'content' | 'difficult') => {
    endFeedingSession(mood)
    setTimer(0)
    
    // ✅ Force immediate refresh (store function already triggers refresh-live-data)
    liveData.refresh() // Immediate call
    setTimeout(() => liveData.refresh(), 100) // Follow-up
  }, [liveData])

  const handleEditFeeding = useCallback((feeding: Record<string, unknown>) => {
    setEditingFeeding(feeding)
    setShowEditModal(true)
  }, [])

  const handleSaveEditedFeeding = useCallback((updatedFeeding: Record<string, unknown>) => {
    console.log('Saving edited feeding:', updatedFeeding)
    updateFeeding(updatedFeeding.id, {
      startTime: updatedFeeding.startTime,
      kind: updatedFeeding.kind,
      amount: updatedFeeding.amount,
      duration: updatedFeeding.duration,
      mood: updatedFeeding.mood,
      notes: updatedFeeding.notes
    })
    
    // ✅ Force immediate refresh (store function already triggers refresh-live-data)
    liveData.refresh() // Immediate call
    setTimeout(() => liveData.refresh(), 100) // Follow-up
    console.log('Live data refreshed after editing')
  }, [liveData])

  const handleCloseModal = useCallback(() => {
    setShowEditModal(false)
    setEditingFeeding(null)
  }, [])

  // ✅ Direct calculations instead of useMemo to ensure reactivity
  const calculations = (() => {
    if (!currentBaby) return null
    
    const ageInWeeks = getAgeInWeeks(currentBaby.birthDate)
    const todayFeedings = liveData.liveData.feedings || []
    const totalMilk = liveData.liveData.stats.totalMilk || 0
    const recommendedMilk = getRecommendedDailyMilk(currentBaby.weight, ageInWeeks)
    const lastFeeding = liveData.liveData.stats.lastFeeding

    return {
      ageInWeeks,
      todayFeedings,
      totalMilk,
      recommendedMilk,
      lastFeeding
    }
  })()

  if (!currentBaby) {
    return (
      <AppLayout 
        currentPage="Repas"
        showHeader={true}
      >
        <div className="p-6 text-center">
          <div className="glass-card rounded-3xl p-8 shadow-large border border-gray-100 dark:border-gray-700">
            <Baby className="w-16 h-16 mx-auto  dark:text-gray-500 mb-4 animate-float" />
            <p className="text-gray-600 dark:text-gray-400">Créez d'abord le profil de votre bébé</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!calculations) return null

  const { todayFeedings, totalMilk, recommendedMilk, lastFeeding } = calculations

  return (
    <AppLayout 
      className="bg-gradient-to-b from-primary-400 to-white"
      currentPage="Repas"
      showHeader={true}
    >
      <div className="p-6 space-y-8">
        {/* Active Feeding Session */}
        {feedingSession.isActive && (
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 border-2 border-blue-200 dark:border-blue-700 rounded-3xl p-6 shadow-large animate-slide-up">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                {/* Dynamic icon based on type */}
                {feedingSession.type === 'biberon' ? (
                  <Milk className="w-8 h-8 text-blue-600 animate-gentle-bounce" />
                ) : feedingSession.type === 'tétée' ? (
                  <Baby className="w-8 h-8 text-pink-600 animate-gentle-bounce" />
                ) : (
                  <span className="w-8 h-8 text-green-600 animate-gentle-bounce">🥄</span>
                )}
                <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-200">
                  {feedingSession.type === 'biberon' ? 'Biberon' : feedingSession.type === 'tétée' ? 'Tétée' : 'Repas solide'} en cours
                </h2>
              </div>
              
              {/* Type selector during active session */}
              <div className="flex justify-center space-x-2 mb-4">
                <p className="text-sm  dark:text-gray-300 mr-2">Type:</p>
                {FEEDING_TYPES.map(type => {
                  const isActive = feedingSession.type === type.value
                  return (
                    <button
                      key={type.value}
                      onClick={() => {
                        console.log('Active session type changed:', type.value, 'from:', feedingSession.type)
                        updateFeedingSession({ type: type.value })
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                        isActive
                          ? type.color === 'blue'
                            ? 'bg-blue-500 text-white shadow-medium'
                            : type.color === 'pink'
                            ? 'bg-pink-500 text-white shadow-medium'
                            : 'bg-green-500 text-white shadow-medium'
                          : type.color === 'blue'
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : type.color === 'pink'
                          ? 'bg-pink-100 text-pink-700 hover:bg-pink-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      <span className="mr-1">{type.emoji}</span>
                      {type.label}
                    </button>
                  )
                })}
              </div>
              
              {feedingSession.amount > 0 && (
                <p className="text-primary-600 dark:text-primary-300 text-lg font-semibold">
                  {feedingSession.amount}ml
                </p>
              )}
              
              <ClientOnly fallback={<div className="text-5xl font-mono text-primary-600 py-4">00:00</div>}>
                <div className="text-5xl font-mono font-bold text-primary-600 dark:text-primary-300 py-4 animate-fade-in">
                  {formatTime(timer)}
                </div>
              </ClientOnly>
              
              <ClientOnly fallback={<p className="text-blue-500 text-sm">Chargement...</p>}>
                <p className="text-blue-500 dark:text-blue-400 text-sm">
                  Commencé à {formatTimeFromDate(feedingSession.startTime)}
                </p>
              </ClientOnly>
              
              {/* End feeding buttons */}
              <div className="grid grid-cols-3 gap-3 mt-6">
                <button
                  onClick={() => handleEndFeed('happy')}
                  className="bg-primary-500 text-white py-3 px-4 rounded-2xl font-semibold hover:bg-primary-600 transition-all duration-300 transform hover:scale-105 shadow-medium card-hover"
                >
                  <div className="text-2xl mb-1">😊</div>
                  <div className="text-sm">Excellent</div>
                </button>
                
                <button
                  onClick={() => handleEndFeed('content')}
                  className="bg-blue-500 text-white py-3 px-4 rounded-2xl font-semibold hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 shadow-medium card-hover"
                >
                  <div className="text-2xl mb-1">😌</div>
                  <div className="text-sm">Normal</div>
                </button>
                
                <button
                  onClick={() => handleEndFeed('difficult')}
                  className="bg-orange-500 text-white py-3 px-4 rounded-2xl font-semibold hover:bg-orange-600 transition-all duration-300 transform hover:scale-105 shadow-medium card-hover"
                >
                  <div className="text-2xl mb-1">😰</div>
                  <div className="text-sm">Difficile</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Daily Summary */}
        {!feedingSession.isActive && (
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-3xl p-6 text-white shadow-large card-hover">
            <div className="text-center space-y-4">
              <Milk className="w-8 h-8 mx-auto animate-float" />
              <h2 className="text-2xl font-bold">Aujourd'hui</h2>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
                  <div className="text-3xl font-bold">{totalMilk}ml</div>
                  <div className="text-blue-100 text-sm">Consommé</div>
                </div>
                
                <div className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
                  <div className="text-3xl font-bold">{todayFeedings.length}</div>
                  <div className="text-blue-100 text-sm">Repas</div>
                </div>
                
                <div className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
                  <div className="text-3xl font-bold">{recommendedMilk}ml</div>
                  <div className="text-blue-100 text-sm">Objectif</div>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Progression du jour</span>
                  <span>{Math.round((totalMilk / recommendedMilk) * 100)}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3 backdrop-blur-sm">
                  <div 
                    className="bg-white h-3 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                    style={{ width: `${Math.min((totalMilk / recommendedMilk) * 100, 100)}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                  </div>
                </div>
              </div>
              
              {lastFeeding && (
                <ClientOnly fallback={<p className="text-blue-100 text-sm">Chargement...</p>}>
                  <p className="text-blue-100 text-sm">
                    Dernière fois: {safeFormatRelativeTime(lastFeeding.time)}
                  </p>
                </ClientOnly>
              )}
            </div>
          </div>
        )}

        {/* Quick Action Buttons */}
        {!feedingSession.isActive && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold dark:text-gray-200 text-center">Nouveau repas</h3>
            
            {/* Type Selection */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {FEEDING_TYPES.map(type => (
                <div key={type.value} className="space-y-3">
                  <div className={`p-4 rounded-2xl border-2 text-center ${
                    type.color === 'blue'
                      ? 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-700'
                      : type.color === 'pink'
                      ? 'bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/30 dark:to-pink-800/30 border-pink-200 dark:border-pink-700'
                      : 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-700'
                  }`}>
                    <div className="text-3xl mb-2">{type.emoji}</div>
                    <div className="font-semibold dark:text-gray-200">{type.label}</div>
                    <div className="text-xs  dark:text-gray-400">{type.description}</div>
                  </div>
                  
                  {/* Quick amounts for each type */}
                  {type.value === 'biberon' && (
                    <div className="space-y-2">
                      {QUICK_AMOUNTS.map(amount => (
                        <button
                          key={amount}
                          onClick={() => handleQuickFeed(amount, 'biberon')}
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl py-3 font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-medium"
                        >
                          {amount}ml
                        </button>
                      ))}
                      <button
                        onClick={() => setShowCustomInput(true)}
                        className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl py-3 font-semibold hover:from-gray-600 hover:to-gray-700 transition-all duration-300 transform hover:scale-105 shadow-medium"
                      >
                        Autre quantité
                      </button>
                    </div>
                  )}
                  
                  {type.value === 'tétée' && (
                    <button
                      onClick={() => handleQuickFeed(0, 'tétée')}
                      className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl py-3 font-semibold hover:from-pink-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-medium"
                    >
                      Commencer
                    </button>
                  )}
                  
                  {type.value === 'solide' && (
                    <button
                      onClick={() => handleQuickFeed(0, 'solide')}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl py-3 font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-medium"
                    >
                      Commencer
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Amount Input */}
        {showCustomInput && (
          <div className="glass-card rounded-3xl p-6 shadow-large border border-gray-200 dark:border-gray-700 animate-slide-up">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Quantité personnalisée (biberon)</h3>
            <div className="flex space-x-3">
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Quantité en ml"
                className="flex-1 px-4 py-3 border-2 border-transparent bg-gray-50 dark:bg-gray-700 dark:text-gray-200 rounded-xl focus:border-primary-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-300 focus:shadow-medium focus:-translate-y-0.5"
                autoFocus
              />
              <button
                onClick={() => handleCustomFeed('biberon')}
                disabled={!customAmount || parseInt(customAmount) <= 0}
                className="bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 shadow-medium"
              >
                OK
              </button>
              <button
                onClick={() => {
                  setShowCustomInput(false)
                  setCustomAmount('')
                }}
                className="bg-gray-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-600 transition-all duration-300 hover:scale-105 shadow-medium"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Today's Feeding History */}
        <div className="glass-card rounded-3xl p-6 shadow-large border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold dark:text-gray-200 flex items-center space-x-2">
              <Clock className="w-5 h-5  dark:text-gray-400" />
              <span>Aujourd'hui ({todayFeedings.length})</span>
            </h3>
            
            {todayFeedings.length > 0 && (
              <div className="text-sm  dark:text-gray-400 font-medium">
                Total: {totalMilk}ml
              </div>
            )}
          </div>

          {todayFeedings.length === 0 ? (
            <div className="text-center py-8  dark:text-gray-400">
              <Milk className="w-12 h-12 mx-auto mb-4 opacity-30 animate-float" />
              <p className="font-medium">Aucun repas enregistré aujourd'hui</p>
              <p className="text-sm">Commencez par ajouter un biberon ci-dessus</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayFeedings
                .sort((a, b) => (ensureDate(b.startTime)?.getTime() || 0) - (ensureDate(a.startTime)?.getTime() || 0))
                .map((feeding) => (
                  <div
                    key={feeding.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-300 hover-lift"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`rounded-full p-3 ${
                        feeding.kind === 'biberon' ? 'bg-blue-100' : 
                        feeding.kind === 'tétée' ? 'bg-pink-100' : 'bg-primary-100'
                      }`}>
                        {feeding.kind === 'biberon' ? (
                          <Milk className="w-5 h-5 text-primary-600" />
                        ) : feeding.kind === 'tétée' ? (
                          <Baby className="w-5 h-5 text-pink-600" />
                        ) : (
                          <span className="w-5 h-5 text-primary-600">🥄</span>
                        )}
                      </div>
                      
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">
                          {feeding.kind === 'biberon' ? 'Biberon' : 
                           feeding.kind === 'tétée' ? 'Tétée' : 'Solide'}
                          {feeding.amount && ` • ${feeding.amount}ml`}
                        </p>
                        <div className="flex items-center space-x-4 text-sm  dark:text-gray-400">
                          <ClientOnly fallback="--:--">
                            <span>{formatTimeFromDate(feeding.startTime)}</span>
                          </ClientOnly>
                          {feeding.duration > 0 && (
                            <span>Durée: {formatDuration(Math.floor(feeding.duration / 60))}</span>
                          )}
                          <ClientOnly fallback="--">
                            <span>{safeFormatRelativeTime(feeding.startTime)}</span>
                          </ClientOnly>
                        </div>
                        {feeding.notes && (
                          <p className="text-xs  dark:text-gray-500 mt-1">{feeding.notes}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {/* Mood indicator */}
                      <div className="text-2xl filter drop-shadow-sm">
                        {feeding.mood === 'happy' ? '😊' : 
                         feeding.mood === 'content' ? '😌' : '😰'}
                      </div>
                      
                      {/* Edit button */}
                      <button
                        onClick={() => handleEditFeeding(feeding)}
                        className="text-primary-500 hover:text-primary-600 p-2 hover:bg-primary-50 rounded-lg transition-all duration-300 hover:scale-110"
                        title="Modifier"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      
                      {/* Delete button */}
                      <button
                        onClick={() => {
                          removeFeeding(feeding.id)
                          
                          // ✅ Force refresh live data immediately after deletion
                          liveData.refresh() // Immediate call
                          setTimeout(() => liveData.refresh(), 100) // Follow-up
                        }}
                        className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-all duration-300 hover:scale-110"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-emerald-50 to-primary-50 dark:from-emerald-900/30 dark:to-primary-900/30 border border-emerald-200 dark:border-emerald-700 rounded-2xl p-4 card-hover">
            <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-2">Moyenne par repas</h4>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {todayFeedings.length > 0 
                ? Math.round(totalMilk / todayFeedings.length)
                : 0
              }ml
            </div>
            <p className="text-emerald-600 dark:text-emerald-400 text-sm">
              {todayFeedings.length} repas aujourd'hui
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 border border-blue-200 dark:border-blue-700 rounded-2xl p-4 card-hover">
            <h4 className="font-semibold text-primary-800 dark:text-primary-300 mb-2">Prochain repas</h4>
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              <ClientOnly fallback="--">
                {(() => {
                  if (!lastFeeding || !lastFeeding.time) {
                    return 'Maintenant'
                  }
                  
                  console.log('Last feeding data:', lastFeeding)
                  const lastFeedingDate = ensureDate(lastFeeding.time) // Fixed: use 'time' instead of 'startTime'
                  console.log('Parsed last feeding date:', lastFeedingDate)
                  
                  if (!lastFeedingDate) {
                    return 'Maintenant'
                  }
                  
                  const nextFeedingTime = new Date(lastFeedingDate.getTime() + 3 * 60 * 60 * 1000)
                  console.log('Next feeding time calculated:', nextFeedingTime)
                  
                  const now = new Date()
                  if (nextFeedingTime <= now) {
                    return 'Maintenant'
                  }
                  
                  return safeFormatRelativeTime(nextFeedingTime)
                })()}
              </ClientOnly>
            </div>
            <p className="text-primary-600 dark:text-primary-400 text-sm">
              Recommandé toutes les 3h
            </p>
          </div>
        </div>

        {/* Nutrition Progress */}
        <div className="glass-card rounded-3xl p-6 shadow-large border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold dark:text-gray-200 mb-4 flex items-center space-x-2">
            <Milk className="w-5 h-5 text-primary-600" />
            <span>Progression Nutritionnelle</span>
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Objectif journalier</span>
              <span className="font-semibold text-2xl text-gray-800 dark:text-gray-200">{Math.round((totalMilk / recommendedMilk) * 100)}%</span>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-primary-600 to-primary-700 h-4 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                style={{ width: `${Math.min((totalMilk / recommendedMilk) * 100, 100)}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
              </div>
            </div>
            
            <div className="flex justify-between text-sm  dark:text-gray-400">
              <span>{totalMilk}ml consommé</span>
              <span>{recommendedMilk}ml recommandé</span>
            </div>
            
            {totalMilk >= recommendedMilk && (
              <div className="bg-primary-100 dark:bg-primary-900/30 border border-primary-300 dark:border-primary-700 rounded-lg p-3 animate-fade-in">
                <p className="text-primary-800 dark:text-primary-200 text-sm font-medium flex items-center space-x-2">
                  <span>🎉</span>
                  <span>Objectif journalier atteint ! Excellent travail !</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Edit Feeding Modal */}
        <EditFeedingModal
          feeding={editingFeeding}
          isOpen={showEditModal}
          onClose={handleCloseModal}
          onSave={handleSaveEditedFeeding}
        />
      </div>
    </AppLayout>
  )
}