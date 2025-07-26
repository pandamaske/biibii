'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  Droplets, Coffee, Waves, CircleDot, Clock, Calendar, Baby, 
  Plus, Edit2, Trash2, AlertTriangle, TrendingUp, TrendingDown,
  RotateCcw, Target, Award, Heart, CheckCircle2, X, Save,
  Camera, MessageSquare, Settings, HelpCircle, Shield
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { useBabyTrackerStore } from '@/lib/store'
import { useLiveBabyData } from '@/hooks/useLiveBabyData'
import { useWeeklyDiapers, useDiaperAnalytics } from '@/hooks/useHistoricalDiapers'
import { getAgeInWeeks, formatRelativeTime, formatTime } from '@/lib/utils'
import { formatISO } from 'date-fns'
import { ensureDate } from '@/lib/utils'   // already exists
import { DiaperEntry, DiaperAmount } from '@/lib/types'

const timeFR = (v: unknown) => {
  const d = ensureDate(v)
  return d
    ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '--:--'
}

// Helper function to get timestamp from either timestamp or time field
const getDiaperTimestamp = (diaper: Record<string, unknown>): Date => {
  return ensureDate(diaper.timestamp || diaper.time)
}

// Enhanced diaper types for comprehensive tracking (using imported DiaperEntry from types.ts)
interface LocalDiaperEntry {
  id: string
  babyId: string
  timestamp: Date
  type: 'wet' | 'soiled' | 'mixed' | 'dry'
  
  // Wetness details
  wetness?: {
    level: 'light' | 'moderate' | 'heavy' | 'soaked'
    color: 'clear' | 'light_yellow' | 'dark_yellow' | 'orange'
  }
  
  // Stool details
  stool?: {
    consistency: 'liquid' | 'soft' | 'formed' | 'hard'
    color: 'yellow' | 'brown' | 'green' | 'black' | 'red' | 'white'
    amount: 'small' | 'medium' | 'large'
    texture: 'smooth' | 'seedy' | 'mucous' | 'bloody'
  }
  
  // Additional info
  diaper: {
    size: 'newborn' | 'size1' | 'size2' | 'size3' | 'size4' | 'size5' | 'size6'
    leaked: boolean
    rash: boolean
  }
  
  notes?: string
  mood: 'comfortable' | 'fussy' | 'crying'
  changedBy?: string
}

interface HealthAlert {
  id: string
  type: 'hydration' | 'stool_color' | 'frequency' | 'rash'
  severity: 'info' | 'warning' | 'urgent'
  title: string
  message: string
  timestamp: Date
}

export default function DiaperPage() {
  // States
  const [showDetailedEntry, setShowDetailedEntry] = useState(false)
  const [editingDiaper, setEditingDiaper] = useState<LocalDiaperEntry | null>(null)
  const [selectedType, setSelectedType] = useState<'wet' | 'soiled' | 'mixed' | 'dry' | null>(null)
  const [viewMode, setViewMode] = useState<'today' | 'week' | 'insights'>('today')
  const [healthAlerts, setHealthAlerts] = useState<HealthAlert[]>([])

  // Get current baby from store
 const { 
  currentBaby,
  userProfile,
  addDiaper,         // ✅ Get from store (already exists)
  removeDiaper,      // ✅ Get from store (already exists)
  initializeData,
  initializeProfile
} = useBabyTrackerStore()

  // ✅ Live data hook for real-time SQL data
  const liveData = useLiveBabyData(15000) // Refresh every 15 seconds
  
  // ✅ Historical data hooks for weekly and analytics views
  const weeklyData = useWeeklyDiapers()
  const analyticsData = useDiaperAnalytics()

  // Debug logging
  console.log('🔍 Diaper Page Debug:', {
    currentBaby: currentBaby?.id,
    currentBabyName: currentBaby?.name,
    userEmail: userProfile?.email,
    weeklyDataLoading: weeklyData.loading,
    weeklyDataError: weeklyData.error,
    weeklyDataCount: weeklyData.diapers.length,
    analyticsDataCount: analyticsData.diapers.length
  })




  const ageInWeeks = currentBaby ? getAgeInWeeks(currentBaby.birthDate) : 0

 
  // Calculate daily stats
  const todayStats = useMemo(() => {
    const today = new Date()
    const todayDiapers = liveData.liveData.diapers || []

    const wetCount = todayDiapers.filter(d => d.type === 'wet' || d.type === 'mixed').length
    const stoolCount = todayDiapers.filter(d => d.type === 'soiled' || d.type === 'mixed').length
    const totalChanges = todayDiapers.length
    const leaks = todayDiapers.filter(d => (d.diaper as { leaked?: boolean })?.leaked || false).length
    const rashes = todayDiapers.filter(d => (d.diaper as { rash?: boolean })?.rash || false).length

    // Calculate time since last change
    const lastChange = todayDiapers.length > 0 
      ? Math.max(...todayDiapers.map(d => getDiaperTimestamp(d).getTime()))
      : null
    
    const hoursSinceLastChange = lastChange 
      ? Math.floor((Date.now() - lastChange) / (1000 * 60 * 60))
      : null

    // Health status calculation
    const lastWet = todayDiapers
      .filter(d => d.type === 'wet' || d.type === 'mixed')
      .sort((a, b) => getDiaperTimestamp(b).getTime() - getDiaperTimestamp(a).getTime())[0]
    
    const hoursSinceLastWet = lastWet 
      ? Math.floor((Date.now() - getDiaperTimestamp(lastWet).getTime()) / (1000 * 60 * 60))
      : 24

    const hydrationStatus = hoursSinceLastWet < 3 ? 'good' : hoursSinceLastWet < 6 ? 'monitor' : 'concern'
    
    return {
      totalChanges,
      wetCount,
      stoolCount,
      leaks,
      rashes,
      hoursSinceLastChange,
      hoursSinceLastWet,
      hydrationStatus,
      lastChange: lastChange ? new Date(lastChange) : null
    }
  }, [liveData.liveData.diapers])

  // Generate health alerts
  const generateHealthAlerts = useCallback((diaperEntries: LocalDiaperEntry[]) => {
    const alerts: HealthAlert[] = []
    
    // Check for dehydration
    if (todayStats.hoursSinceLastWet >= 6) {
      alerts.push({
        id: 'dehydration-warning',
        type: 'hydration',
        severity: 'urgent',
        title: 'Risque de déshydratation',
        message: `Aucune couche mouillée depuis ${todayStats.hoursSinceLastWet}h`,
        timestamp: new Date()
      })
    }

    // Check for concerning stool colors
    const recentStools = diaperEntries
      .filter(d => (d.type === 'soiled' || d.type === 'mixed') && d.stool)
      .slice(0, 3)
    
    const concerningColors = recentStools.filter(d => 
      d.stool?.color === 'black' || d.stool?.color === 'red' || d.stool?.color === 'white'
    )
    
    if (concerningColors.length > 0) {
      alerts.push({
        id: 'stool-color-concern',
        type: 'stool_color',
        severity: 'warning',
        title: 'Couleur de selle préoccupante',
        message: 'Consultez votre pédiatre rapidement',
        timestamp: new Date()
      })
    }

    // Check for frequent changes (possible diarrhea)
    if (todayStats.stoolCount >= 6) {
      alerts.push({
        id: 'frequent-stools',
        type: 'frequency',
        severity: 'warning',
        title: 'Selles fréquentes',
        message: `${todayStats.stoolCount} selles aujourd'hui - possible diarrhée`,
        timestamp: new Date()
      })
    }

    setHealthAlerts(alerts)
  }, [todayStats.hoursSinceLastWet, todayStats.stoolCount])



  
  // Quick entry function


// ✅ Removed automatic sample data creation to prevent duplicate entries


// ✅ 4. UPDATE quickAddDiaper function:
const quickAddDiaper = useCallback((type: 'wet' | 'soiled' | 'mixed' | 'dry') => {
  if (!currentBaby) return

  // Skip 'dry' type as it's not supported in the store DiaperType
  if (type === 'dry') return

  const newDiaper: DiaperEntry = {
    id: `diaper-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    babyId: currentBaby.id,
    time: new Date(),
    type: type as 'wet' | 'soiled' | 'mixed',
    amount: 'normal' as DiaperAmount,
    notes: ''
  }

  // Set color based on type
  if (type === 'soiled' || type === 'mixed') {
    newDiaper.color = 'yellow'
  }

  addDiaper(newDiaper) // ✅ Use store function
  
  // Create LocalDiaperEntry for health alerts
  const localDiaper: LocalDiaperEntry = {
    id: newDiaper.id,
    babyId: newDiaper.babyId,
    timestamp: newDiaper.time,
    type: type,
    diaper: { size: 'size1', leaked: false, rash: false },
    mood: 'comfortable',
    changedBy: 'Maman'
  }
  generateHealthAlerts([localDiaper, ...(liveData.liveData.diapers || []).map(d => d as any)])
  
  // ✅ Force refresh live data immediately
  setTimeout(() => liveData.refresh(), 100)
  
  // ✅ Also trigger global refresh event
  window.dispatchEvent(new CustomEvent('refresh-live-data'))
}, [currentBaby, liveData, generateHealthAlerts, addDiaper])


  // Delete diaper
  const deleteDiaper = useCallback((id: string) => {
    removeDiaper(id) // ✅ Use store function
    
    // ✅ Force refresh live data immediately
    setTimeout(() => liveData.refresh(), 100)
  }, [removeDiaper, liveData])

  if (!currentBaby) {
    return (
      <AppLayout 
        className="bg-gradient-to-b from-primary-400 to-white"
        currentPage="Couches"
        showHeader={true}
      >
        <div className="p-6 text-center">
          <div className="glass-card rounded-3xl p-8 shadow-large">
            <Baby className="w-16 h-16 mx-auto  mb-4 animate-float" />
            <p className="text-gray-600">Créez d'abord le profil de votre bébé</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout 
      className="bg-gradient-to-b from-primary-400 to-white"
      currentPage="Couches"
      showHeader={true}
    >
      <div className="p-6 pb-24 space-y-6 animate-fade-in">
        {/* Header with Health Status */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-3xl p-6 text-white shadow-large animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Suivi des couches</h2>
              <p className="text-primary-100">
                Dernière: {todayStats.lastChange ? formatRelativeTime(todayStats.lastChange) : 'Aucune'}
              </p>
            </div>
            
            {/* Hydration Status */}
            <div className={`px-4 py-2 rounded-2xl ${
              todayStats.hydrationStatus === 'good' ? 'bg-green-500/20' :
              todayStats.hydrationStatus === 'monitor' ? 'bg-yellow-500/20' :
              'bg-red-500/20'
            }`}>
              <div className="text-center">
                <div className="text-2xl">
                  {todayStats.hydrationStatus === 'good' ? '💧' :
                   todayStats.hydrationStatus === 'monitor' ? '⚠️' : '🚨'}
                </div>
                <div className="text-xs text-white/80">Hydratation</div>
              </div>
            </div>
          </div>

          {/* Daily Stats */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{todayStats.totalChanges}</div>
              <div className="text-xs text-primary-100">Total</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{todayStats.wetCount}</div>
              <div className="text-xs text-primary-100">Pipi</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{todayStats.stoolCount}</div>
              <div className="text-xs text-primary-100">Caca</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{todayStats.leaks}</div>
              <div className="text-xs text-primary-100">Fuites</div>
            </div>
          </div>
        </div>

        {/* Health Alerts */}
        {healthAlerts.length > 0 && (
          <div className="space-y-3">
            {healthAlerts.map(alert => (
              <div key={alert.id} className={`glass-card rounded-2xl p-4 shadow-medium border-l-4 ${
                alert.severity === 'urgent' ? 'border-red-500 bg-red-50/50' :
                alert.severity === 'warning' ? 'border-yellow-500 bg-yellow-50/50' :
                'border-primary-500 bg-primary-50/50'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">
                    {alert.severity === 'urgent' ? '🚨' :
                     alert.severity === 'warning' ? '⚠️' : 'ℹ️'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold">{alert.title}</h3>
                    <p className="text-sm text-gray-400">{alert.message}</p>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-4 h-4 " />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Entry Buttons */}
        <div className="glass-card backdrop-blur-sm rounded-3xl p-6 shadow-large animate-slide-up">
          <h3 className="font-bold mb-4 flex items-center">
            <Plus className="w-5 h-5 mr-2 text-primary-600" />
            Ajout rapide
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => quickAddDiaper('wet')}
              className="bg-gradient-to-r from-primary-500 to-primary-500 text-white p-4 rounded-2xl font-medium shadow-large flex flex-col items-center space-y-2 hover:scale-105 transition-transform"
            >
              <Droplets className="w-8 h-8" />
              <span>Pipi</span>
            </button>
            
            <button
              onClick={() => quickAddDiaper('soiled')}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 rounded-2xl font-medium shadow-large flex flex-col items-center space-y-2 hover:scale-105 transition-transform"
            >
              <Coffee className="w-8 h-8" />
              <span>Caca</span>
            </button>
            
            <button
              onClick={() => quickAddDiaper('mixed')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-2xl font-medium shadow-large flex flex-col items-center space-y-2 hover:scale-105 transition-transform"
            >
              <Waves className="w-8 h-8" />
              <span>Mixte</span>
            </button>
            
            <button
              onClick={() => quickAddDiaper('dry')}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-2xl font-medium shadow-large flex flex-col items-center space-y-2 hover:scale-105 transition-transform"
            >
              <CircleDot className="w-8 h-8" />
              <span>Sèche</span>
            </button>
          </div>
          
          <button
            onClick={() => setShowDetailedEntry(true)}
            className="w-full mt-4 bg-gray-100  py-3 rounded-2xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
          >
            <Edit2 className="w-5 h-5" />
            <span>Ajout détaillé</span>
          </button>
        </div>

        {/* View Mode Selector */}
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('today')}
            className={`flex-1 py-3 px-4 rounded-2xl font-medium transition-all ${
              viewMode === 'today' 
                ? 'bg-primary-500 text-white shadow-lg' 
                : 'bg-gray-100 '
            }`}
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`flex-1 py-3 px-4 rounded-2xl font-medium transition-all ${
              viewMode === 'week' 
                ? 'bg-primary-500 text-white shadow-lg' 
                : 'bg-gray-100 '
            }`}
          >
            Semaine
          </button>
          <button
            onClick={() => setViewMode('insights')}
            className={`flex-1 py-3 px-4 rounded-2xl font-medium transition-all ${
              viewMode === 'insights' 
                ? 'bg-primary-500 text-white shadow-lg' 
                : 'bg-gray-100 '
            }`}
          >
            Analyse
          </button>
        </div>

        {/* Content based on view mode */}
        {viewMode === 'today' && (
          <div className="space-y-3">
            <h3 className="font-bold flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-primary-600" />
              Aujourd'hui ({todayStats.totalChanges} changes)
            </h3>
            
            {(liveData.liveData.diapers || []).filter(d => {
              const today = new Date()
              return getDiaperTimestamp(d).toDateString() === today.toDateString()
            }).map(diaper => (
              <DiaperCard
                key={String(diaper.id)}
                diaper={diaper as any}
                onEdit={(d: any) => setEditingDiaper(d)}
                onDelete={deleteDiaper}
              />
            ))}
            
            {todayStats.totalChanges === 0 && (
              <div className="text-center py-12">
                <Baby className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">Aucune couche changée aujourd'hui</p>
                <p className="text-gray-400 text-sm">Utilisez les boutons ci-dessus pour commencer</p>
              </div>
            )}
          </div>
        )}

        {viewMode === 'week' && (
          <WeeklyView diapers={weeklyData.diapers as any} loading={weeklyData.loading} error={weeklyData.error} />
        )}

        {viewMode === 'insights' && (
          <InsightsView diapers={analyticsData.diapers as any} ageInWeeks={ageInWeeks} loading={analyticsData.loading} error={analyticsData.error} />
        )}

        {/* Timeline for today */}
        {viewMode === 'today' && todayStats.totalChanges > 0 && (
          <TimelineView diapers={(liveData.liveData.diapers || []).filter(d => {
            const today = new Date()
            return getDiaperTimestamp(d).toDateString() === today.toDateString()
          }) as any} />
        )}
      </div>

      {/* Detailed Entry Modal */}
      {showDetailedEntry && (
        <DetailedEntryModal
          onClose={() => setShowDetailedEntry(false)}
         onSave={(diaper) => {
  addDiaper(diaper) // ✅ Use store function
  setShowDetailedEntry(false)
  generateHealthAlerts([diaper as any, ...(liveData.liveData.diapers || []).map((d: any) => d)])
  
  // ✅ Force refresh live data immediately
  setTimeout(() => liveData.refresh(), 100)
  
  // ✅ Also trigger global refresh event
  window.dispatchEvent(new CustomEvent('refresh-live-data'))
}}
          currentBaby={currentBaby as any}
        />
      )}

      {/* Edit Modal */}
      {editingDiaper && (
        <DetailedEntryModal
          diaper={editingDiaper as any}
          onClose={() => setEditingDiaper(null)}
          onSave={(updated) => {
  removeDiaper(updated.id)
  addDiaper(updated)
  setEditingDiaper(null)
  generateHealthAlerts((liveData.liveData.diapers || []).map((d: any) => d.id === updated.id ? updated : d) as any)
  
  // ✅ Force refresh live data immediately
  setTimeout(() => liveData.refresh(), 100)
  
  // ✅ Also trigger global refresh event
  window.dispatchEvent(new CustomEvent('refresh-live-data'))
}}
          currentBaby={currentBaby as any}
        />
      )}
    </AppLayout>
  )
}

// Diaper Card Component
function DiaperCard({ diaper, onEdit, onDelete }: {
  diaper: DiaperEntry
  onEdit: (diaper: DiaperEntry) => void
  onDelete: (id: string) => void
}) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'wet': return '💧'
      case 'soiled': return '💩'
      case 'mixed': return '🌊'
      case 'dry': return '✨'
      default: return '🔄'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'wet': return 'border-primary-300 bg-primary-50'
      case 'soiled': return 'border-amber-300 bg-amber-50'
      case 'mixed': return 'border-purple-300 bg-purple-50'
      case 'dry': return 'border-green-300 bg-green-50'
      default: return 'border-gray-300 bg-gray-50'
    }
  }

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'comfortable': return '😊'
      case 'fussy': return '😤'
      case 'crying': return '😭'
      default: return '😐'
    }
  }

  return (
    <div className={`glass-card rounded-2xl p-4 shadow-medium border-2 transition-all hover-lift ${getTypeColor(diaper.type)}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="text-3xl">{getTypeIcon(diaper.type)}</div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h4 className="font-medium text-gray-800 capitalize">
                {diaper.type === 'wet' ? 'Pipi' :
                 diaper.type === 'soiled' ? 'Caca' :
                 diaper.type === 'mixed' ? 'Mixte' : 'Sèche'}
              </h4>
              <span className="text-2xl">{getMoodEmoji((diaper as any).mood || 'comfortable')}</span>
            </div>
            
            <div className="text-sm  space-y-1">
              <p className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {timeFR(getDiaperTimestamp(diaper as any))}
              </p>
              
              {(diaper as any).changedBy && (
                <p>Changé par: {(diaper as any).changedBy}</p>
              )}
              
              {(diaper as any).stool && (
                <p>Couleur: {(diaper as any).stool.color}, Consistance: {(diaper as any).stool.consistency}</p>
              )}
              
              {(diaper as any).wetness && (
                <p>Niveau: {(diaper as any).wetness.level}, Couleur: {(diaper as any).wetness.color}</p>
              )}
              
              {((diaper as any).diaper?.leaked || (diaper as any).diaper?.rash) && (
                <div className="flex space-x-2">
                  {(diaper as any).diaper?.leaked && <span className="text-red-600">💦 Fuite</span>}
                  {(diaper as any).diaper?.rash && <span className="text-orange-600">🔴 Rougeur</span>}
                </div>
              )}
              
              {diaper.notes && (
                <p className="text-xs bg-gray-100 rounded-lg p-2 mt-2">
                  <MessageSquare className="w-3 h-3 inline mr-1" />
                  {diaper.notes}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex space-x-1">
          <button
            onClick={() => onEdit(diaper)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4 " />
          </button>
          <button
            onClick={() => onDelete(diaper.id)}
            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Weekly View Component
function WeeklyView({ diapers, loading, error }: { diapers: DiaperEntry[], loading?: boolean, error?: string | null }) {
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
    console.log('📊 WeeklyView - calculating stats with diapers:', diapers.length, 'entries')
    console.log('📊 WeeklyView - diapers data:', diapers)
    
    const now = new Date()
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
    
    console.log('📅 WeeklyView - week range:', weekStart.toDateString(), 'to', new Date(weekStart.getTime() + 6*24*60*60*1000).toDateString())
    
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      
      const dayDiapers = diapers.filter(d => {
        const diaperDate = getDiaperTimestamp(d as any)
        const matches = diaperDate.toDateString() === date.toDateString()
        if (matches) {
          console.log(`📊 Found diaper for ${date.toDateString()}:`, d)
        }
        return matches
      })
      
      console.log(`📊 ${date.toDateString()}: ${dayDiapers.length} diapers`)
      
      return {
        date,
        total: dayDiapers.length,
        wet: dayDiapers.filter(d => d.type === 'wet' || d.type === 'mixed').length,
        soiled: dayDiapers.filter(d => d.type === 'soiled' || d.type === 'mixed').length,
        leaks: dayDiapers.filter(d => (d as any).diaper?.leaked || false).length
      }
    })
    
    return days
  }, [diapers])

  const weekTotal = weeklyStats.reduce((sum, day) => sum + day.total, 0)
  const weekAverage = Math.round(weekTotal / 7)

  return (
    <div className="space-y-6">
      <div className="glass-card backdrop-blur-sm rounded-3xl p-6 shadow-large">
        <h3 className="font-bold mb-4">Vue hebdomadaire</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-300">{weekTotal}</div>
            <div className="text-sm text-gray-400">Total semaine</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-300">{weekAverage}</div>
            <div className="text-sm text-gray-400">Moyenne/jour</div>
          </div>
        </div>
        
        <div className="space-y-3">
          {weeklyStats.map((day, index) => (
            <div key={`week-day-${index}-${day.date.getTime()}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="font-medium ">
                {day.date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
              </div>
              <div className="flex space-x-4 text-sm">
                <span className="text-primary-600">💧 {day.wet}</span>
                <span className="text-amber-600">💩 {day.soiled}</span>
                <span className="text-gray-600">Total: {day.total}</span>
                {day.leaks > 0 && <span className="text-red-600">💦 {day.leaks}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Insights View Component
function InsightsView({ diapers, ageInWeeks, loading, error }: { diapers: DiaperEntry[], ageInWeeks: number, loading?: boolean, error?: string | null }) {
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
    const recentDiapers = diapers.slice(0, 20) // Last 20 changes
    
    // Pattern analysis
    const hourlyPattern = Array.from({ length: 24 }, (_, hour) => {
      const count = recentDiapers.filter(d => getDiaperTimestamp(d as any).getHours() === hour).length
      return { hour, count }
    })
    
    // Most active hours
    const mostActiveHours = hourlyPattern
      .filter(h => h.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
    
    // Stool color analysis
    const stoolColors = recentDiapers
      .filter(d => (d as any).stool)
      .reduce((acc, d) => {
        const color = (d as any).stool!.color
        acc[color] = (acc[color] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    
    // Health recommendations based on age
    const recommendations = []
    if (ageInWeeks < 4) {
      recommendations.push("Les nouveau-nés ont 8-12 couches mouillées par jour")
      recommendations.push("Les selles peuvent être fréquentes (après chaque repas)")
    } else if (ageInWeeks < 24) {
      recommendations.push("6-8 couches mouillées par jour sont normales")
      recommendations.push("La couleur des selles peut varier avec l'alimentation")
    }
    
    return {
      hourlyPattern,
      mostActiveHours,
      stoolColors,
      recommendations,
      averageDaily: Math.round(recentDiapers.length / 7),
      leakRate: Math.round((recentDiapers.filter(d => (d as any).diaper?.leaked || false).length / recentDiapers.length) * 100)
    }
  }, [diapers, ageInWeeks])

  return (
    <div className="space-y-6">
      {/* Pattern Analysis */}
      <div className="glass-card backdrop-blur-sm rounded-3xl p-6 shadow-large">
        <h3 className="font-bold mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-primary-600" />
          Analyse des patterns
        </h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-primary-50 rounded-2xl">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-300">{insights.averageDaily}</div>
            <div className="text-sm text-gray-400">Couches/jour</div>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-2xl">
            <div className="text-2xl font-bold text-amber-600">{insights.leakRate}%</div>
            <div className="text-sm text-gray-400">Taux de fuite</div>
          </div>
        </div>
        
        {insights.mostActiveHours.length > 0 && (
          <div>
            <h4 className="font-semibold  mb-3">Heures les plus actives</h4>
            <div className="space-y-2">
              {insights.mostActiveHours.map(({ hour, count }, index) => (
                <div key={`active-hour-${hour}-${index}`} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="font-medium">{hour}h - {hour + 1}h</span>
                  <span className="text-primary-600 font-bold">{count} changes</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Health Insights */}
      <div className="glass-card backdrop-blur-sm rounded-3xl p-6 shadow-large">
        <h3 className="font-bold mb-4 flex items-center">
          <Heart className="w-5 h-5 mr-2 text-red-500" />
          Santé et développement
        </h3>
        
        {/* Stool Color Distribution */}
        {Object.keys(insights.stoolColors).length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold  mb-3">Couleurs des selles récentes</h4>
            <div className="space-y-2">
              {Object.entries(insights.stoolColors).map(([color, count], index) => (
                <div key={`stool-color-${color}-${index}`} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded-full ${
                      color === 'yellow' ? 'bg-yellow-400' :
                      color === 'brown' ? 'bg-amber-600' :
                      color === 'green' ? 'bg-green-500' :
                      color === 'black' ? 'bg-black' :
                      color === 'red' ? 'bg-red-500' :
                      'bg-gray-300'
                    }`}></div>
                    <span className="capitalize">{color}</span>
                  </div>
                  <span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Age-based Recommendations */}
        <div>
          <h4 className="font-semibold  mb-3">Recommandations pour {ageInWeeks} semaines</h4>
          <div className="space-y-2">
            {insights.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start space-x-2 p-3 bg-green-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-400">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* When to Contact Doctor */}
      <div className="glass-card backdrop-blur-sm rounded-3xl p-6 shadow-large border-2 border-red-200">
        <h3 className="font-bold text-red-700 mb-4 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          Quand contacter le pédiatre
        </h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
            <span>Aucune couche mouillée depuis plus de 6 heures</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
            <span>Selles noires, blanches ou avec du sang</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
            <span>Diarrhée persistante (plus de 6 selles liquides/jour)</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
            <span>Éruption cutanée sévère ou qui s'aggrave</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Timeline View Component
function TimelineView({ diapers }: { diapers: DiaperEntry[] }) {
  const sortedDiapers = [...diapers].sort((a, b) => 
    getDiaperTimestamp(a as any).getTime() - getDiaperTimestamp(b as any).getTime()
  )

  return (
    <div className="glass-card backdrop-blur-sm rounded-3xl p-6 shadow-large">
      <h3 className="font-bold mb-4 flex items-center">
        <Clock className="w-5 h-5 mr-2 text-primary-600" />
        Timeline d'aujourd'hui
      </h3>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-500 to-primary-500"></div>
        
        <div className="space-y-4">
          {sortedDiapers.map((diaper, index) => (
            <div key={`timeline-${diaper.id}-${index}`} className="relative flex items-center space-x-4">
              {/* Timeline dot */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg z-10 ${
                diaper.type === 'wet' ? 'bg-primary-500' :
                diaper.type === 'soiled' ? 'bg-amber-500' :
                diaper.type === 'mixed' ? 'bg-purple-500' :
                'bg-green-500'
              }`}>
                {diaper.type === 'wet' ? '💧' :
                 diaper.type === 'soiled' ? '💩' :
                 diaper.type === 'mixed' ? '🌊' : '✨'}
              </div>
              
              {/* Content */}
              <div className="flex-1 bg-gray-50 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">
                    {timeFR(getDiaperTimestamp(diaper as any))}
                  </span>
                  <span className="text-sm  capitalize">
                    {diaper.type === 'wet' ? 'Pipi' :
                     diaper.type === 'soiled' ? 'Caca' :
                     diaper.type === 'mixed' ? 'Mixte' : 'Sèche'}
                  </span>
                </div>
                
                {diaper.notes && (
                  <p className="text-xs  mt-1">{diaper.notes}</p>
                )}
                
                {((diaper as any).diaper?.leaked || (diaper as any).diaper?.rash) && (
                  <div className="flex space-x-2 mt-1">
                    {(diaper as any).diaper?.leaked && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                        Fuite
                      </span>
                    )}
                    {(diaper as any).diaper?.rash && (
                      <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                        Rougeur
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Detailed Entry Modal Component
function DetailedEntryModal({ diaper, onClose, onSave, currentBaby }: {
  diaper?: DiaperEntry
  onClose: () => void
  onSave: (diaper: DiaperEntry) => void
  currentBaby: Record<string, unknown> | null
}) {
  const [formData, setFormData] = useState<Partial<DiaperEntry>>(() => {
    if (diaper) {
      return {
        ...diaper,
        timestamp: ensureDate((diaper as any).timestamp || diaper.time) || new Date(),
        diaper: (diaper as any).diaper || { size: 'size1', leaked: false, rash: false }
      }
    }
    return {
      type: 'wet',
      timestamp: new Date(),
      diaper: {
        size: 'size1',
        leaked: false,
        rash: false
      },
      mood: 'comfortable',
      changedBy: 'Maman'
    }
  })

  const handleSave = () => {
    if (!currentBaby) return

    const newDiaper: any = {
      id: diaper?.id || `diaper-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      babyId: (currentBaby as any).id,
      time: (formData as any).timestamp || new Date(),
      type: formData.type || 'wet',
      notes: formData.notes,
      // Extended fields that don't exist in base DiaperEntry interface
      diaper: (formData as any).diaper || { size: 'size1', leaked: false, rash: false },
      mood: (formData as any).mood || 'comfortable',
      changedBy: (formData as any).changedBy || 'Maman',
      wetness: (formData as any).wetness,
      stool: (formData as any).stool
    }

    onSave(newDiaper)
  }

  const stoolColors = [
    { value: 'yellow', label: 'Jaune', color: 'bg-yellow-400' },
    { value: 'brown', label: 'Marron', color: 'bg-amber-600' },
    { value: 'green', label: 'Vert', color: 'bg-green-500' },
    { value: 'black', label: 'Noir', color: 'bg-black' },
    { value: 'red', label: 'Rouge', color: 'bg-red-500' },
    { value: 'white', label: 'Blanc', color: 'bg-gray-300' }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-down">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">
            {diaper ? 'Modifier' : 'Nouvelle'} couche
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">


{/* Date & heure du change */}
<div>
  <label className="block text-xs  mb-2">
    Date et heure
  </label>

  <input
  type="datetime-local"
  value={(ensureDate((formData as any).timestamp) || new Date()).toISOString().slice(0,16)}   // "YYYY-MM-DDTHH:mm"
  onChange={e =>
    setFormData(prev => ({
      ...prev,
      timestamp: new Date(e.target.value)
    } as any))
  }
  className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl
             focus:border-primary-500 focus:outline-none"
/>
</div>


          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium  mb-3">
              Type de couche
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'wet', label: 'Pipi', icon: '💧', color: 'border-primary-500' },
                { value: 'soiled', label: 'Caca', icon: '💩', color: 'border-amber-500' },
                { value: 'mixed', label: 'Mixte', icon: '🌊', color: 'border-purple-500' },
                { value: 'dry', label: 'Sèche', icon: '✨', color: 'border-green-500' }
              ].map(type => (
                <button
                  key={type.value}
                  onClick={() => setFormData(prev => ({ ...prev, type: type.value } as any))}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    formData.type === type.value ? `${type.color} bg-gray-50` : 'border-gray-200'
                  }`}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="text-sm font-medium">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Wetness Details */}
          {(formData.type === 'wet' || formData.type === 'mixed') && (
            <div>
              <label className="block text-sm font-medium  mb-3">
                Détails pipi
              </label>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs  mb-2">Niveau</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['light', 'moderate', 'heavy', 'soaked'].map(level => (
                      <button
                        key={level}
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          wetness: { ...(prev as any).wetness, level: level }
                        } as any))}
                        className={`p-2 text-xs rounded-lg border transition-all ${
                          (formData as any).wetness?.level === level 
                            ? 'border-primary-500 bg-primary-50' 
                            : 'border-gray-200'
                        }`}
                      >
                        {level === 'light' ? 'Léger' :
                         level === 'moderate' ? 'Modéré' :
                         level === 'heavy' ? 'Lourd' : 'Trempé'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs  mb-2">Couleur</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
    { value: 'yellow', label: 'Jaune', color: 'bg-yellow-400' },
    { value: 'light_brown', label: 'Marron clair', color: 'bg-amber-500' },
    { value: 'brown', label: 'Marron', color: 'bg-amber-700' },
    { value: 'dark_brown', label: 'Marron foncé', color: 'bg-amber-900' },
    { value: 'light_green', label: 'Vert clair', color: 'bg-green-400' },
    { value: 'green', label: 'Vert', color: 'bg-green-600' },
    { value: 'dark_green', label: 'Vert foncé', color: 'bg-green-800' },
    { value: 'black', label: 'Noir', color: 'bg-black' },
    { value: 'red', label: 'Rouge', color: 'bg-red-500' }
                    ].map(color => (
                      <button
                        key={color.value}
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          wetness: { ...(prev as any).wetness, color: color.value }
                        } as any))}
                        className={`p-2 text-xs rounded-lg border transition-all ${
                          (formData as any).wetness?.color === color.value 
                            ? 'border-primary-500 ring-2 ring-primary-200' 
                            : 'border-gray-200'
                        }`}
                      >
                        <div className={`w-full h-6 rounded ${color.color} mb-1`}></div>
                        {color.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stool Details */}
          {(formData.type === 'soiled' || formData.type === 'mixed') && (
            <div>
              <label className="block text-sm font-medium  mb-3">
                Détails caca
              </label>
              
              <div className="space-y-4">
                {/* Color */}
                <div>
                  <label className="block text-xs  mb-2">Couleur</label>
                  <div className="grid grid-cols-3 gap-2">
                    {stoolColors.map(color => (
                      <button
                        key={color.value}
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          stool: { ...(prev as any).stool, color: color.value }
                        } as any))}
                        className={`p-2 text-xs rounded-lg border transition-all ${
                          (formData as any).stool?.color === color.value 
                            ? 'border-amber-500 ring-2 ring-amber-200' 
                            : 'border-gray-200'
                        }`}
                      >
                        <div className={`w-full h-6 rounded ${color.color} mb-1`}></div>
                        {color.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Consistency */}
                <div>
                  <label className="block text-xs  mb-2">Consistance</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['liquid', 'soft', 'formed', 'hard'].map(consistency => (
                      <button
                        key={consistency}
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          stool: { ...(prev as any).stool, consistency: consistency }
                        } as any))}
                        className={`p-2 text-xs rounded-lg border transition-all ${
                          (formData as any).stool?.consistency === consistency 
                            ? 'border-amber-500 bg-amber-50' 
                            : 'border-gray-200'
                        }`}
                      >
                        {consistency === 'liquid' ? 'Liquide' :
                         consistency === 'soft' ? 'Mou' :
                         consistency === 'formed' ? 'Formé' : 'Dur'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs  mb-2">Quantité</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['small', 'medium', 'large'].map(amount => (
                      <button
                        key={amount}
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          stool: { ...(prev as any).stool, amount: amount }
                        } as any))}
                        className={`p-2 text-xs rounded-lg border transition-all ${
                          (formData as any).stool?.amount === amount 
                            ? 'border-amber-500 bg-amber-50' 
                            : 'border-gray-200'
                        }`}
                      >
                        {amount === 'small' ? 'Petit' :
                         amount === 'medium' ? 'Moyen' : 'Gros'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium  mb-2">
                Informations supplémentaires
              </label>
              
              <div className="space-y-3">
                {/* Diaper Size */}
                <div>
                  <label className="block text-xs  mb-2">Taille couche</label>
                  <select
                    value={(formData as any).diaper?.size || 'size1'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      diaper: { ...(prev as any).diaper, size: e.target.value }
                    } as any))}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none"
                  >
                    <option value="newborn">Nouveau-né</option>
                    <option value="size1">Taille 1</option>
                    <option value="size2">Taille 2</option>
                    <option value="size3">Taille 3</option>
                    <option value="size4">Taille 4</option>
                    <option value="size5">Taille 5</option>
                    <option value="size6">Taille 6</option>
                  </select>
                </div>

                {/* Leaked and Rash */}
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center space-x-2 p-3 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={(formData as any).diaper?.leaked || false}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        diaper: { ...(prev as any).diaper, leaked: e.target.checked }
                      } as any))}
                      className="w-4 h-4 text-primary-600"
                    />
                    <span className="text-sm">💦 Fuite</span>
                  </label>
                  
                  <label className="flex items-center space-x-2 p-3 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={(formData as any).diaper?.rash || false}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        diaper: { ...(prev as any).diaper, rash: e.target.checked }
                      } as any))}
                      className="w-4 h-4 text-primary-600"
                    />
                    <span className="text-sm">🔴 Rougeur</span>
                  </label>
                </div>

                {/* Mood */}
                <div>
                  <label className="block text-xs  mb-2">Humeur</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'comfortable', label: 'Confortable', emoji: '😊' },
                      { value: 'fussy', label: 'Grognon', emoji: '😤' },
                      { value: 'crying', label: 'Pleurs', emoji: '😭' }
                    ].map(mood => (
                      <button
                        key={mood.value}
                        onClick={() => setFormData(prev => ({ ...prev, mood: mood.value } as any))}
                        className={`p-2 text-xs rounded-lg border transition-all ${
                          (formData as any).mood === mood.value 
                            ? 'border-primary-500 bg-primary-50' 
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="text-lg mb-1">{mood.emoji}</div>
                        {mood.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Changed By */}
                <div>
                  <label className="block text-xs  mb-2">Changé par</label>
                  <input
                    type="text"
                    value={(formData as any).changedBy || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, changedBy: e.target.value } as any))}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none"
                    placeholder="Nom de la personne"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs  mb-2">Notes</label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none resize-none"
                    rows={3}
                    placeholder="Observations particulières..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 bg-primary-500 text-white py-3 rounded-xl font-semibold hover:bg-primary-600 transition-all flex items-center justify-center space-x-2"
          >
            <Save className="w-5 h-5" />
            <span>Sauvegarder</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200  py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}