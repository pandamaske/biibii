// ── src/lib/store.ts
'use client'

import { create } from 'zustand'
import { Baby, FeedingEntry, SleepEntry, DiaperEntry, Alert, ChecklistItem, DailyChecklist, TaskTemplate, GrowthEntry } from './types'

// ✅ Profile Types
export interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  avatar: string
  role: 'mother' | 'father' | 'guardian' | 'caregiver' | 'grandparent' | 'other'
  preferredName: string
  timezone: string
  language: 'fr' | 'en' | 'es' | 'de'
  emergencyContact?: {
    name: string
    relationship: string
    phone: string
    email?: string
  }
  createdAt: Date
  isEmailVerified: boolean
  isPhoneVerified: boolean
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto'
  colorScheme: 'green' | 'blue' | 'purple' | 'pink' | 'orange' | 'pistacchio'
  fontSize: 'small' | 'medium' | 'large'
  language: 'fr' | 'en' | 'es' | 'de'
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  timeFormat: '12h' | '24h'
  weightUnit: 'grams' | 'pounds'
  heightUnit: 'cm' | 'inches'
  temperatureUnit: 'celsius' | 'fahrenheit'
  volumeUnit: 'ml' | 'oz'
  notifications: {
    enabled: boolean
    feedingReminders: boolean
    feedingInterval: number
    sleepReminders: boolean
    sleepInsufficientThreshold: number
    sleepQualityMinimumHours: number
    diaperReminders: boolean
    healthAlerts: boolean
    quietHours: {
      enabled: boolean
      start: string
      end: string
    }
    pushNotifications: boolean
    emailNotifications: boolean
  }
  privacy: {
    dataSharing: boolean
    analytics: boolean
    faceIdUnlock: boolean
  }
  backup: {
    autoBackup: boolean
    backupFrequency: 'daily' | 'weekly' | 'monthly'
    cloudSync: boolean
  }
}

export interface FamilyMember {
  id: string
  email: string
  name: string
  role: 'partner' | 'grandparent' | 'caregiver' | 'family_friend'
  permissions: {
    viewData: boolean
    addEntries: boolean
    editEntries: boolean
    manageSettings: boolean
  }
  inviteStatus: 'pending' | 'accepted' | 'declined'
  joinedDate?: Date
  isActive: boolean
}

// ✅ Notification Types
export interface Notification {
  id: string
  type: 'feeding' | 'sleep' | 'diaper' | 'health' | 'milestone' | 'reminder'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  isRead: boolean
  createdAt: Date
  actionUrl?: string
  icon?: string
  babyId?: string
}

export interface NotificationSettings {
  enableFeedingAlerts: boolean
  feedingIntervalMinutes: number
  enableSleepAlerts: boolean
  sleepInsufficientThreshold: number // Percentage of recommended sleep (0.5 = 50%)
  sleepQualityMinimumHours: number // Minimum hours for a "quality" sleep session (6)
  enableMilestoneReminders: boolean
  enableHealthReminders: boolean
  quietHoursStart: string
  quietHoursEnd: string
}

// ✅ SERVICE DE NOTIFICATIONS intégré
class NotificationService {
  static generateFeedingNotifications(
    baby: Baby, 
    lastFeeding: FeedingEntry | null, 
    recommendedInterval: number
  ): Notification[] {
    const notifications: Notification[] = []
    
    if (!lastFeeding) {
      notifications.push({
        id: `feeding-first-${Date.now()}`,
        type: 'feeding',
        title: 'Premier repas',
        message: `Il est temps de nourrir ${baby.name}`,
        priority: 'medium',
        isRead: false,
        createdAt: new Date(),
        actionUrl: '/feeding',
        icon: '🍼',
        babyId: baby.id
      })
      return notifications
    }

    const now = new Date()
    const lastFeedingTime = new Date(lastFeeding.time)
    const timeSinceLastFeeding = (now.getTime() - lastFeedingTime.getTime()) / (1000 * 60) // minutes
    
    // Repas en retard
    if (timeSinceLastFeeding > recommendedInterval * 60) {
      const hoursLate = Math.floor((timeSinceLastFeeding - recommendedInterval * 60) / 60)
      notifications.push({
        id: `feeding-late-${Date.now()}`,
        type: 'feeding',
        title: 'Repas en retard !',
        message: `${baby.name} n'a pas mangé depuis ${Math.floor(timeSinceLastFeeding / 60)}h`,
        priority: hoursLate > 1 ? 'urgent' : 'high',
        isRead: false,
        createdAt: new Date(),
        actionUrl: '/feeding',
        icon: '🚨',
        babyId: baby.id
      })
    }
    // Rappel prochain repas (30min avant)
    else if (timeSinceLastFeeding > (recommendedInterval * 60 - 30)) {
      notifications.push({
        id: `feeding-soon-${Date.now()}`,
        type: 'feeding',
        title: 'Repas bientôt',
        message: `Préparez le repas de ${baby.name} dans 30min`,
        priority: 'low',
        isRead: false,
        createdAt: new Date(),
        actionUrl: '/feeding',
        icon: '⏰',
        babyId: baby.id
      })
    }

    return notifications
  }

  static generateSleepNotifications(
    baby: Baby,
    totalSleepToday: number,
    recommendedSleep: number,
    lastSleep: SleepEntry | null,
    settings: NotificationSettings
  ): Notification[] {
    const notifications: Notification[] = []
    
    // Improved sleep insufficiency logic - configurable and less invasive
    const currentHour = new Date().getHours()
    const sleepThreshold = recommendedSleep * settings.sleepInsufficientThreshold
    
    // Only show insufficient sleep alerts after 2pm and if sleep is really low
    // Also check if there's a long continuous sleep session which indicates good quality
    if (totalSleepToday < sleepThreshold && currentHour >= 14) {
      // Check for any long sleep sessions in the last 24 hours (including cross-day sessions)
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const hasLongSleep = lastSleep && lastSleep.endTime && 
        new Date(lastSleep.startTime) > last24Hours &&
        ((new Date(lastSleep.endTime).getTime() - new Date(lastSleep.startTime).getTime()) / (1000 * 60 * 60)) >= settings.sleepQualityMinimumHours
      
      // Don't alert if baby had a long quality sleep session in the last 24 hours
      if (!hasLongSleep) {
        notifications.push({
          id: `sleep-insufficient-${Date.now()}`,
          type: 'sleep',
          title: 'Sommeil insuffisant',
          message: `${baby.name} a dormi ${Math.floor(totalSleepToday / 60)}h sur ${Math.floor(recommendedSleep / 60)}h recommandées`,
          priority: 'low', // Reduced from 'medium' to 'low'
          isRead: false,
          createdAt: new Date(),
          actionUrl: '/sleep',
          icon: '😴',
          babyId: baby.id
        })
      }
    }

    // Pas de sieste depuis longtemps
    if (lastSleep) {
      const now = new Date()
      const lastSleepTime = new Date(lastSleep.startTime)
      const hoursSinceLastSleep = (now.getTime() - lastSleepTime.getTime()) / (1000 * 60 * 60)
      
      if (hoursSinceLastSleep > 4 && now.getHours() > 8 && now.getHours() < 20) {
        notifications.push({
          id: `sleep-needed-${Date.now()}`,
          type: 'sleep',
          title: 'Sieste recommandée',
          message: `${baby.name} n'a pas dormi depuis ${Math.floor(hoursSinceLastSleep)}h`,
          priority: 'medium',
          isRead: false,
          createdAt: new Date(),
          actionUrl: '/sleep',
          icon: '💤',
          babyId: baby.id
        })
      }
    }

    return notifications
  }

  static generateHealthNotifications(baby: Baby): Notification[] {
    const notifications: Notification[] = []
    const now = new Date()
    const birthDate = new Date(baby.birthDate)
    const ageInDays = Math.floor((now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24))
    const ageInWeeks = Math.floor(ageInDays / 7)

    // Rappels de visite médicale
    const visitWeeks = [1, 2, 4, 8, 12, 16, 24, 36, 52]
    if (visitWeeks.includes(ageInWeeks)) {
      notifications.push({
        id: `health-visit-${ageInWeeks}`,
        type: 'health',
        title: 'Visite médicale',
        message: `Pensez à prendre RDV pour la visite des ${ageInWeeks} semaines`,
        priority: 'medium',
        isRead: false,
        createdAt: new Date(),
        icon: '🏥',
        babyId: baby.id
      })
    }

    // Milestones de développement
    const milestones = [
      { weeks: 6, title: 'Premiers sourires', message: 'Bébé commence à sourire en réponse' },
      { weeks: 12, title: 'Tient sa tête', message: 'Bébé devrait tenir sa tête droite' },
      { weeks: 16, title: 'Suit des yeux', message: 'Bébé suit les objets du regard' },
      { weeks: 24, title: 'Première dent', message: 'Les premières dents peuvent apparaître' },
      { weeks: 36, title: 'Position assise', message: 'Bébé peut s\'asseoir avec aide' }
    ]

    const currentMilestone = milestones.find(m => m.weeks === ageInWeeks)
    if (currentMilestone) {
      notifications.push({
        id: `milestone-${ageInWeeks}`,
        type: 'milestone',
        title: currentMilestone.title,
        message: currentMilestone.message,
        priority: 'low',
        isRead: false,
        createdAt: new Date(),
        icon: '🎉',
        babyId: baby.id
      })
    }

    return notifications
  }

  static isQuietTime(settings: NotificationSettings): boolean {
    const now = new Date()
    const currentTime = now.getHours() * 100 + now.getMinutes()
    const quietStart = parseInt(settings.quietHoursStart.replace(':', ''))
    const quietEnd = parseInt(settings.quietHoursEnd.replace(':', ''))
    
    if (quietStart > quietEnd) {
      return currentTime >= quietStart || currentTime <= quietEnd
    } else {
      return currentTime >= quietStart && currentTime <= quietEnd
    }
  }

  static generateAllNotifications(
    baby: Baby,
    lastFeeding: FeedingEntry | null,
    lastSleep: SleepEntry | null,
    totalSleepToday: number,
    recommendedInterval: number,
    recommendedSleep: number,
    settings: NotificationSettings,
    appSettings?: AppSettings
  ): Notification[] {
    let allNotifications: Notification[] = []

    if (!this.isQuietTime(settings)) {
      if (settings.enableFeedingAlerts) {
        allNotifications.push(...this.generateFeedingNotifications(baby, lastFeeding, recommendedInterval))
      }
      
      if (settings.enableSleepAlerts) {
        // Bridge AppSettings to NotificationSettings for sleep alerts
        const bridgedSettings = {
          ...settings,
          sleepInsufficientThreshold: appSettings?.notifications?.sleepInsufficientThreshold || 0.5,
          sleepQualityMinimumHours: appSettings?.notifications?.sleepQualityMinimumHours || 6
        }
        allNotifications.push(...this.generateSleepNotifications(baby, totalSleepToday, recommendedSleep, lastSleep, bridgedSettings))
      }
      
      if (settings.enableHealthReminders || settings.enableMilestoneReminders) {
        allNotifications.push(...this.generateHealthNotifications(baby))
      }
    }

    return allNotifications
  }
}

// ✅ Fonctions utilitaires pour les recommandations
function getRecommendedFeedingInterval(ageInWeeks: number): number {
  if (ageInWeeks < 4) return 2 // 2 heures
  if (ageInWeeks < 12) return 3 // 3 heures
  if (ageInWeeks < 24) return 4 // 4 heures
  return 4 // 4 heures
}

function getRecommendedDailySleep(ageInWeeks: number): number {
  if (ageInWeeks < 4) return 16 * 60 // 16 heures en minutes
  if (ageInWeeks < 12) return 14 * 60 // 14 heures
  if (ageInWeeks < 24) return 12 * 60 // 12 heures
  return 11 * 60 // 11 heures
}

function getAgeInWeeks(birthDate: Date): number {
  const now = new Date()
  const birth = new Date(birthDate)
  return Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 7))
}

// ✅ MAIN INTERFACE
interface BabyTrackerState {
  // Baby data
  currentBaby: Baby | null
  babies: Baby[]
  
  // Real-time sessions
  sleepTimer: {
    isRunning: boolean
    seconds: number
    startTime: Date | null
    sessionId: string | null
  }
  
  feedingSession: {
    isActive: boolean
    type: 'biberon' | 'tétée' | 'solide' | null
    amount: number
    startTime: Date | null
    timerSeconds: number
    sessionId: string | null
  }
  
  // Data storage
  feedings: FeedingEntry[]
  sleeps: SleepEntry[]
  diapers: DiaperEntry[]
  growth: GrowthEntry[]
  alerts: Alert[]
  
  // ✅ Notifications
  notifications: Notification[]
  notificationSettings: NotificationSettings
  unreadCount: number
  
  // ✅ Profile Data
  userProfile: UserProfile | null
  appSettings: AppSettings | null
  familyMembers: FamilyMember[]
  isLoading: boolean
  
  // ✅ Checklist Data
  checklists: DailyChecklist[]
  templates: TaskTemplate[]
  streaks: {
    current: number
    best: number
    lastCompletedDate: Date | null
  }
  
  // Settings (legacy)
  settings: {
    notifications: boolean
    darkMode: boolean
    defaultBottleAmount: number
    feedingInterval: number // hours
  }
  
  // ✅ Baby Management Actions
  setCurrentBaby: (baby: Baby | null) => void
  addBaby: (baby: Baby) => void
  updateBaby: (baby: Baby) => void
  
  // ✅ Feeding Actions
  addFeeding: (feeding: FeedingEntry) => void
  removeFeeding: (feedingId: string) => void
  updateFeeding: (feedingId: string, updates: Partial<FeedingEntry>) => void
  startFeedingSession: (type: 'biberon' | 'tétée' | 'solide', amount?: number) => void
  endFeedingSession: (mood: 'happy' | 'content' | 'difficult') => void
  updateFeedingSession: (updates: Partial<BabyTrackerState['feedingSession']>) => void
  
  // ✅ Sleep Actions
  addSleep: (sleep: SleepEntry) => void
  removeSleep: (sleepId: string) => void
  updateSleep: (sleepId: string, updates: Partial<SleepEntry>) => void
  startSleepTimer: () => void
  endSleepTimer: (quality: 'excellent' | 'good' | 'restless' | 'difficult') => void
  updateSleepTimer: (updates: Partial<BabyTrackerState['sleepTimer']>) => void
  
  // ✅ Diaper Actions
  addDiaper: (diaper: DiaperEntry) => void
  removeDiaper: (diaperId: string) => void
  
  // ✅ Growth Actions
  addGrowthEntry: (entry: GrowthEntry) => void
  updateGrowthEntry: (entryId: string, updates: Partial<GrowthEntry>) => void
  removeGrowthEntry: (entryId: string) => void
  getGrowthEntries: (babyId: string) => GrowthEntry[]
  
  // ✅ Alert Actions
  addAlert: (alert: Alert) => void
  removeAlert: (alertId: string) => void
  clearAllAlerts: () => void
  
  // ✅ Notification Actions
  addNotification: (notification: Notification) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearOldNotifications: () => void
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void
  generateNotifications: () => void
  getUnreadCount: () => number
  
  // ✅ Profile Actions
  updateUserProfile: (profile: Partial<UserProfile>) => void
  updateAppSettings: (settings: Partial<AppSettings>) => void
  addFamilyMember: (member: FamilyMember) => void
  removeFamilyMember: (memberId: string) => void
  updateFamilyMemberPermissions: (memberId: string, permissions: Partial<FamilyMember['permissions']>) => void
  initializeProfile: (email?: string) => Promise<void>
  exportUserData: () => any
  
  // ✅ Checklist Actions
  addChecklist: (checklist: DailyChecklist) => void
  updateTask: (checklistId: string, taskId: string, updates: Partial<ChecklistItem>) => void
  addCustomTask: (checklistId: string, task: ChecklistItem) => void
  deleteTask: (checklistId: string, taskId: string) => void
  applyTemplate: (checklistId: string, template: TaskTemplate) => void
  updateStreak: (completed: boolean) => void
  
  // ✅ Settings Actions
  updateSettings: (settings: Partial<BabyTrackerState['settings']>) => Promise<void>
  
  // ✅ Utility Actions
  getTodayFeedings: () => FeedingEntry[]
  getTodaySleeps: () => SleepEntry[]
  getTodayDiapers: () => DiaperEntry[]
  getLastFeeding: () => FeedingEntry | null
  getNextFeedingTime: () => Date | null
  getTotalDailyMilk: () => number
  getTotalDailySleep: () => number
  initializeData: () => void
}

// ✅ Helper functions
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function generateBabyId(userId: string, existingBabies: Baby[]): string {
  // Count existing babies for this user to determine the next number
  const userBabies = existingBabies.filter(baby => baby.id.startsWith(userId + '_baby_'))
  const babyNumber = userBabies.length + 1
  return `${userId}_baby_${babyNumber}`
}

function isToday(date: Date): boolean {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

function ensureDate(value: any): Date {
  if (value instanceof Date) return value
  if (typeof value === 'string') return new Date(value)
  return new Date()
}

// ✅ MAIN STORE IMPLEMENTATION
export const useBabyTrackerStore = create<BabyTrackerState>()((set, get) => ({
      // ✅ Initial state
      currentBaby: null,
      babies: [],
      
      sleepTimer: {
        isRunning: false,
        seconds: 0,
        startTime: null,
        sessionId: null,
      },
      
      feedingSession: {
        isActive: false,
        type: null,
        amount: 0,
        startTime: null,
        timerSeconds: 0,
        sessionId: null,
      },
      
      feedings: [],
      sleeps: [],
      diapers: [],
      growth: [],
      alerts: [],
      
      // ✅ Notifications initial state
      notifications: [],
      notificationSettings: {
        enableFeedingAlerts: true,
        feedingIntervalMinutes: 180, // 3 heures
        enableSleepAlerts: true,
        sleepInsufficientThreshold: 0.5, // 50% of recommended sleep
        sleepQualityMinimumHours: 6, // 6+ hours considered quality sleep
        enableMilestoneReminders: true,
        enableHealthReminders: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00'
      },
      unreadCount: 0,
      
      // ✅ Profile initial state
      userProfile: null,
      appSettings: null,
      familyMembers: [],
      isLoading: false,
      
      // ✅ Checklist initial state
      checklists: [],
      templates: [],
      streaks: {
        current: 0,
        best: 0,
        lastCompletedDate: null
      },
      
      settings: {
        notifications: true,
        darkMode: false,
        defaultBottleAmount: 150,
        feedingInterval: 3, // hours
      },
      
      // ✅ Baby Management Actions
      setCurrentBaby: (baby) => set({ currentBaby: baby }),
      
      addBaby: (baby) => set((state) => {
        // Ensure baby has proper ID if not provided
        let babyWithId = baby
        if (!baby.id || !baby.id.includes('_baby_')) {
          const userId = state.userProfile?.id || getTempUserId()
          babyWithId = {
            ...baby,
            id: generateBabyId(userId, state.babies)
          }
        }

        // Sync with database
        if (typeof window !== 'undefined') {
          const babyData = {
            ...babyWithId,
            userId: state.userProfile?.id || getTempUserId()
          }
          syncWithAPI.createBaby(babyData).catch(error => {
            console.error('Failed to sync baby to database:', error)
          })
        }

        return {
          babies: [...state.babies, babyWithId],
          currentBaby: state.currentBaby || babyWithId,
        }
      }),
      
      updateBaby: (baby) => set((state) => {
        // Sync with database
        if (typeof window !== 'undefined') {
          const babyData = {
            ...baby,
            userId: state.userProfile?.id || getTempUserId()
          }
          syncWithAPI.createBaby(babyData).catch(error => {
            console.error('Failed to sync baby update to database:', error)
          })
        }

        return {
          babies: state.babies.map(b => b.id === baby.id ? baby : b),
          currentBaby: state.currentBaby?.id === baby.id ? baby : state.currentBaby,
        }
      }),
      
      // ✅ Feeding Actions
      addFeeding: (feeding) => set((state) => {
        // Sync with database
        if (typeof window !== 'undefined' && state.currentBaby) {
          syncWithAPI.createFeedingEntry(state.currentBaby.id, feeding)
            .then(() => {
              // Trigger live data refresh after successful sync
              window.dispatchEvent(new CustomEvent('refresh-live-data'))
            })
            .catch(error => {
              console.error('Failed to sync feeding entry to database:', error)
            })
        }

        return {
          feedings: [...state.feedings, feeding],
        }
      }),
      
      removeFeeding: (feedingId) => set((state) => {
        // Remove from local state first
        const newState = {
          feedings: state.feedings.filter(f => f.id !== feedingId)
        }

        // Sync deletion with database
        if (state.currentBaby && typeof window !== 'undefined') {
          syncWithAPI.deleteFeedingEntry(state.currentBaby.id, feedingId).catch(error => {
            console.error('Failed to sync feeding deletion:', error)
          })
        }

        return newState
      }),
      
      updateFeeding: (feedingId, updates) => set((state) => {
        // Update local state first
        const updatedFeedings = state.feedings.map(f => 
          f.id === feedingId ? { ...f, ...updates } : f
        )

        // Sync with database
        if (state.currentBaby && typeof window !== 'undefined') {
          const updatedFeeding = updatedFeedings.find(f => f.id === feedingId)
          if (updatedFeeding) {
            console.log('Syncing feeding update to database:', updatedFeeding)
            syncWithAPI.updateFeedingEntry(state.currentBaby.id, feedingId, updatedFeeding)
              .then(() => {
                console.log('Feeding entry update synced successfully')
                // Trigger live data refresh after successful sync
                window.dispatchEvent(new CustomEvent('refresh-live-data'))
              })
              .catch(error => {
                console.error('Failed to sync feeding update to database:', error)
              })
          }
        }

        return {
          feedings: updatedFeedings,
        }
      }),
      
      startFeedingSession: (type, amount = 0) => set((state) => {
        const sessionId = generateId()
        return {
          feedingSession: {
            isActive: true,
            type,
            amount,
            startTime: new Date(),
            timerSeconds: 0,
            sessionId,
          }
        }
      }),
      
      endFeedingSession: (mood) => set((state) => {
        if (!state.feedingSession.isActive || !state.currentBaby || !state.feedingSession.startTime) {
          return state
        }
        
        const feeding: FeedingEntry = {
          id: generateId(),
          babyId: state.currentBaby.id,
          kind: state.feedingSession.type!,
          amount: state.feedingSession.amount || undefined,
          duration: state.feedingSession.timerSeconds,
          startTime: state.feedingSession.startTime,
          mood,
        }

        // Sync with database (optional - don't block UI)
        if (typeof window !== 'undefined') {
          syncWithAPI.createFeedingEntry(state.currentBaby.id, feeding)
            .then(() => {
              // Trigger live data refresh after successful sync
              window.dispatchEvent(new CustomEvent('refresh-live-data'))
            })
            .catch(error => {
              console.warn('Failed to sync feeding entry to database (continuing offline):', error)
            })
        }
        
        return {
          feedings: [...state.feedings, feeding],
          feedingSession: {
            isActive: false,
            type: null,
            amount: 0,
            startTime: null,
            timerSeconds: 0,
            sessionId: null,
          }
        }
      }),
      
      updateFeedingSession: (updates) => set((state) => ({
        feedingSession: { ...state.feedingSession, ...updates }
      })),
      
      // ✅ Sleep Actions
      addSleep: (sleep) => set((state) => {
        // Sync with database
        if (typeof window !== 'undefined' && state.currentBaby) {
          syncWithAPI.createSleepEntry(state.currentBaby.id, sleep)
            .then(() => {
              // Trigger live data refresh after successful sync
              window.dispatchEvent(new CustomEvent('refresh-live-data'))
            })
            .catch(error => {
              console.error('Failed to sync sleep entry to database:', error)
            })
        }

        return {
          sleeps: [...state.sleeps, sleep],
        }
      }),
      
      removeSleep: (sleepId) => set((state) => {
        // Remove from local state first
        const newState = {
          sleeps: state.sleeps.filter(s => s.id !== sleepId)
        }

        // Sync deletion with database
        if (state.currentBaby && typeof window !== 'undefined') {
          syncWithAPI.deleteSleepEntry(state.currentBaby.id, sleepId).catch(error => {
            console.error('Failed to sync sleep deletion:', error)
          })
        }

        return newState
      }),
      
      updateSleep: (sleepId, updates) => {
        const state = useBabyTrackerStore.getState()
        if (!state.currentBaby) {
          console.log('No current baby, skipping sleep update')
          return
        }

        // Update local state
        set((state) => ({
          sleeps: state.sleeps.map(s => 
            s.id === sleepId ? { ...s, ...updates } : s
          ),
        }))

        // Sync to database
        const updatedSleep = state.sleeps.find(s => s.id === sleepId)
        if (updatedSleep) {
          const sleepWithUpdates = { ...updatedSleep, ...updates }
          syncWithAPI.updateSleepEntry(state.currentBaby.id, sleepId, sleepWithUpdates)
            .catch(error => {
              console.error('Failed to sync sleep update to database:', error)
              // Could add error handling here, like showing a notification
            })
        }
      },
      
      startSleepTimer: () => set((state) => {
        const sessionId = generateId()
        return {
          sleepTimer: {
            isRunning: true,
            seconds: 0,
            startTime: new Date(),
            sessionId,
          }
        }
      }),
      
      endSleepTimer: (quality) => set((state) => {
        if (!state.sleepTimer.isRunning || !state.currentBaby || !state.sleepTimer.startTime) {
          return state
        }
        
        const endTime = new Date()
        const startTime = ensureDate(state.sleepTimer.startTime)
        const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60))
        
        const sleep: SleepEntry = {
          id: generateId(),
          babyId: state.currentBaby.id,
          startTime: startTime,
          endTime: endTime,
          duration: durationMinutes,
          quality,
          type: durationMinutes > 120 ? 'night' : 'nap',
          notes: `Durée: ${durationMinutes}min`,
        }

        // Sync with database
        if (typeof window !== 'undefined') {
          syncWithAPI.createSleepEntry(state.currentBaby.id, sleep).catch(error => {
            console.error('Failed to sync sleep entry to database:', error)
          })
        }
        
        return {
          sleeps: [...state.sleeps, sleep],
          sleepTimer: {
            isRunning: false,
            seconds: 0,
            startTime: null,
            sessionId: null,
          }
        }
      }),
      
      updateSleepTimer: (updates) => set((state) => ({
        sleepTimer: { 
          ...state.sleepTimer, 
          ...updates,
          startTime: updates.startTime ? ensureDate(updates.startTime) : state.sleepTimer.startTime
        }
      })),
      
      // ✅ Diaper Actions
      addDiaper: (diaper) => set((state) => {
        // Sync with database
        if (typeof window !== 'undefined' && state.currentBaby) {
          syncWithAPI.createDiaperEntry(state.currentBaby.id, diaper)
            .then(() => {
              // Trigger live data refresh after successful sync
              window.dispatchEvent(new CustomEvent('refresh-live-data'))
            })
            .catch(error => {
              console.error('Failed to sync diaper entry to database:', error)
            })
        }

        return {
          diapers: [...state.diapers, diaper],
        }
      }),
      
      removeDiaper: (diaperId) => set((state) => {
        // Remove from local state first
        const newState = {
          diapers: state.diapers.filter(d => d.id !== diaperId)
        }

        // Sync deletion with database
        if (state.currentBaby && typeof window !== 'undefined') {
          syncWithAPI.deleteDiaperEntry(state.currentBaby.id, diaperId).catch(error => {
            console.error('Failed to sync diaper deletion:', error)
          })
        }

        return newState
      }),
      
      // ✅ Growth Actions
      addGrowthEntry: (entry) => {
        const state = useBabyTrackerStore.getState()
        if (!state.currentBaby) {
          console.log('No current baby, skipping growth entry')
          return
        }

        // Add to local state immediately
        set((state) => ({
          growth: [...state.growth, entry],
        }))

        // Sync to database
        syncWithAPI.createGrowthEntry(state.currentBaby.id, entry)
          .catch(error => {
            console.error('Failed to sync growth entry to database:', error)
            // Could add error handling here, like showing a notification
          })
      },
      
      updateGrowthEntry: (entryId, updates) => {
        const state = useBabyTrackerStore.getState()
        if (!state.currentBaby) {
          console.log('No current baby, skipping growth entry update')
          return
        }

        // Update local state
        set((state) => ({
          growth: state.growth.map(g => 
            g.id === entryId ? { ...g, ...updates } : g
          ),
        }))

        // Sync to database
        const updatedEntry = state.growth.find(g => g.id === entryId)
        if (updatedEntry) {
          const entryWithUpdates = { ...updatedEntry, ...updates }
          syncWithAPI.updateGrowthEntry(state.currentBaby.id, entryId, entryWithUpdates)
            .catch(error => {
              console.error('Failed to sync growth update to database:', error)
              // Could add error handling here, like showing a notification
            })
        }
      },
      
      removeGrowthEntry: (entryId) => {
        const state = useBabyTrackerStore.getState()
        if (!state.currentBaby) {
          console.log('No current baby, skipping growth entry deletion')
          return
        }

        // Remove from local state
        set((state) => ({
          growth: state.growth.filter(g => g.id !== entryId),
        }))

        // Sync to database
        syncWithAPI.deleteGrowthEntry(state.currentBaby.id, entryId)
          .catch(error => {
            console.error('Failed to delete growth entry from database:', error)
            // Could add error handling here, like showing a notification
          })
      },
      
      getGrowthEntries: (babyId) => {
        const state = get()
        return state.growth.filter(g => g.babyId === babyId)
      },
      
      // ✅ Alert Actions
      addAlert: (alert) => set((state) => ({
        alerts: [...state.alerts, alert],
      })),
      
      removeAlert: (alertId) => set((state) => ({
        alerts: state.alerts.filter(a => a.id !== alertId),
      })),
      
      clearAllAlerts: () => set({ alerts: [] }),
      
      // ✅ Notification Actions
      addNotification: (notification) =>
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + 1
        })),

      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map(n => 
            n.id === id ? { ...n, isRead: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1)
        })),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, isRead: true })),
          unreadCount: 0
        })),

      removeNotification: (id) =>
        set((state) => {
          const notification = state.notifications.find(n => n.id === id)
          return {
            notifications: state.notifications.filter(n => n.id !== id),
            unreadCount: notification && !notification.isRead 
              ? Math.max(0, state.unreadCount - 1) 
              : state.unreadCount
          }
        }),

      clearOldNotifications: () =>
        set((state) => {
          // Clear all read notifications
          const filteredNotifications = state.notifications.filter(n => !n.isRead)
          
          return {
            notifications: filteredNotifications,
            unreadCount: filteredNotifications.length
          }
        }),

      updateNotificationSettings: (settings) =>
        set((state) => ({
          notificationSettings: { ...state.notificationSettings, ...settings }
        })),

      generateNotifications: () =>
        set((state) => {
          if (!state.currentBaby) return state

          const lastFeeding = state.getLastFeeding()
          const lastSleep = state.getTodaySleeps()[0] || null
          const totalSleepToday = state.getTotalDailySleep()
          const ageInWeeks = getAgeInWeeks(state.currentBaby.birthDate)
          const recommendedInterval = getRecommendedFeedingInterval(ageInWeeks)
          const recommendedSleep = getRecommendedDailySleep(ageInWeeks)

          const newNotifications = NotificationService.generateAllNotifications(
            state.currentBaby,
            lastFeeding,
            lastSleep,
            totalSleepToday,
            recommendedInterval,
            recommendedSleep,
            state.notificationSettings,
            state.appSettings
          )

          // Éviter les doublons
          const existingIds = state.notifications.map(n => n.id)
          const uniqueNewNotifications = newNotifications.filter(n => !existingIds.includes(n.id))

          return {
            notifications: [...uniqueNewNotifications, ...state.notifications],
            unreadCount: state.unreadCount + uniqueNewNotifications.length
          }
        }),

      getUnreadCount: () => get().unreadCount,
      
      // ✅ Profile Actions
      updateUserProfile: (profileUpdates) => set((state) => {
        const oldEmail = state.userProfile?.email
        const newEmail = profileUpdates.email
        
        // If email is changing, trigger user lookup and data migration
        if (typeof window !== 'undefined' && newEmail && oldEmail !== newEmail) {
          console.log('Email changing from', oldEmail, 'to', newEmail)
          
          // Re-initialize user data with new email after profile update
          setTimeout(() => {
            syncWithAPI.ensureUserExists().then(() => {
              console.log('User lookup completed after email change')
            }).catch(error => {
              console.error('Failed to lookup user after email change:', error)
            })
          }, 100)
        } else if (typeof window !== 'undefined' && state.userProfile) {
          // Regular profile sync for non-email changes - include user ID
          const updatesWithId = {
            ...profileUpdates,
            id: state.userProfile.id
          }
          syncWithAPI.updateProfile(updatesWithId).catch(error => {
            console.error('Failed to sync profile to database:', error)
          })
        }

        return {
          userProfile: state.userProfile ? { ...state.userProfile, ...profileUpdates } : null
        }
      }),
      
      updateAppSettings: (settingsUpdates) => set((state) => ({
        appSettings: state.appSettings ? { ...state.appSettings, ...settingsUpdates } : null
      })),
      
      addFamilyMember: (member) => set((state) => ({
        familyMembers: [...state.familyMembers, member]
      })),
      
      removeFamilyMember: (memberId) => set((state) => ({
        familyMembers: state.familyMembers.filter(m => m.id !== memberId)
      })),
      
      updateFamilyMemberPermissions: (memberId, permissionUpdates) => set((state) => ({
        familyMembers: state.familyMembers.map(member =>
          member.id === memberId
            ? { ...member, permissions: { ...member.permissions, ...permissionUpdates } }
            : member
        )
      })),
      
      initializeProfile: async (email?: string) => {
        const state = useBabyTrackerStore.getState()
        
        // Skip if we already have a profile with the same email
        if (state.userProfile && state.userProfile.email === email) {
          console.log('Profile already loaded for this email, skipping initialization')
          return
        }
        
        // Email is required for all operations
        if (!email) {
          console.log('No email provided - cannot initialize profile from database')
          // Set loading state to false but keep profile as null
          useBabyTrackerStore.setState({
            userProfile: null,
            currentBaby: null,
            appSettings: null,
            isLoading: false
          })
          return
        }
        
        // Set loading state
        useBabyTrackerStore.setState({ isLoading: true })
        
        try {
          console.log('Initializing profile from database for email:', email)
            
          let fetchUrl = '/api/user/profile'
          fetchUrl += `?email=${encodeURIComponent(email)}`
            
            console.log('Fetching profile from:', fetchUrl)
            const response = await fetch(fetchUrl)
          
          if (response.ok) {
            const profileData = await response.json()
            console.log('Loaded profile from database:', profileData)
            
            // Extract all entries from babies
            const allFeedingEntries: FeedingEntry[] = []
            const allSleepEntries: SleepEntry[] = []
            const allDiaperEntries: DiaperEntry[] = []
            const allGrowthEntries: GrowthEntry[] = []
            
            profileData.babies?.forEach((baby: any) => {
              // Process feeding entries
              baby.feedingEntries?.forEach((entry: any) => {
                allFeedingEntries.push({
                  id: entry.id,
                  babyId: baby.id,
                  kind: entry.type as 'biberon' | 'tétée' | 'solide',
                  amount: entry.amount || undefined,
                  startTime: new Date(entry.startTime),
                  endTime: entry.endTime ? new Date(entry.endTime) : undefined,
                  duration: entry.duration || undefined,
                  mood: entry.mood as 'happy' | 'content' | 'difficult' || undefined,
                  notes: entry.notes || undefined
                })
              })
              
              // Process sleep entries
              baby.sleepEntries?.forEach((entry: any) => {
                allSleepEntries.push({
                  id: entry.id,
                  babyId: baby.id,
                  startTime: new Date(entry.startTime),
                  endTime: entry.endTime ? new Date(entry.endTime) : undefined,
                  quality: entry.quality as 'excellent' | 'good' | 'restless' | 'difficult' || undefined,
                  type: entry.type as 'night' | 'nap' || undefined,
                  location: entry.location || undefined,
                  notes: entry.notes || undefined
                })
              })
              
              // Process diaper entries
              baby.diaperEntries?.forEach((entry: any) => {
                allDiaperEntries.push({
                  id: entry.id,
                  babyId: baby.id,
                  time: new Date(entry.time),
                  type: entry.type as 'wet' | 'dirty' | 'both',
                  amount: entry.amount as 'small' | 'medium' | 'large' || undefined,
                  color: entry.color || undefined,
                  notes: entry.notes || undefined
                })
              })
              
              // Process growth entries
              baby.growthEntries?.forEach((entry: any) => {
                allGrowthEntries.push({
                  id: entry.id,
                  babyId: baby.id,
                  date: new Date(entry.date),
                  weight: entry.weight || undefined,
                  height: entry.height || undefined,
                  headCircumference: entry.headCirc || undefined,
                  notes: entry.notes || undefined
                })
              })
            })
            
            console.log('Extracted entries from database:', {
              feedings: allFeedingEntries.length,
              sleeps: allSleepEntries.length,
              diapers: allDiaperEntries.length,
              growth: allGrowthEntries.length
            })

            // Load user settings from database
            let userSettings = null
            try {
              const settingsResponse = await fetch(`/api/user/settings?userId=${profileData.id}`)
              if (settingsResponse.ok) {
                userSettings = await settingsResponse.json()
              }
            } catch (error) {
              console.warn('Failed to load user settings:', error)
            }

            // Update store with database data INCLUDING entries
            useBabyTrackerStore.setState({
              userProfile: {
                id: profileData.id,
                firstName: profileData.firstName,
                lastName: profileData.lastName,
                email: profileData.email,
                phone: profileData.phone,
                avatar: profileData.avatar || '👩‍🦰',
                role: profileData.role || 'mother',
                preferredName: profileData.preferredName || profileData.firstName,
                timezone: profileData.timezone || 'Europe/Paris',
                language: profileData.language || 'fr',
                emergencyContact: profileData.emergencyContact,
                createdAt: new Date(profileData.createdAt),
                isEmailVerified: profileData.isEmailVerified || false,
                isPhoneVerified: profileData.isPhoneVerified || false
              },
              babies: profileData.babies || [],
              currentBaby: profileData.babies?.[0] || null,
              appSettings: userSettings || {
                theme: 'light',
                colorScheme: 'green',
                fontSize: 'medium',
                language: 'fr',
                dateFormat: 'DD/MM/YYYY',
                timeFormat: '24h',
                weightUnit: 'grams',
                heightUnit: 'cm',
                temperatureUnit: 'celsius',
                volumeUnit: 'ml',
                notifications: {
                  enabled: true,
                  feedingReminders: true,
                  feedingInterval: 180,
                  sleepReminders: true,
                  sleepInsufficientThreshold: 0.5,
                  sleepQualityMinimumHours: 6,
                  diaperReminders: true,
                  healthAlerts: true,
                  quietHours: {
                    enabled: false,
                    start: '22:00',
                    end: '06:00'
                  },
                  pushNotifications: true,
                  emailNotifications: false
                },
                privacy: {
                  dataSharing: false,
                  analytics: false,
                  faceIdUnlock: false
                },
                backup: {
                  autoBackup: true,
                  backupFrequency: 'daily',
                  cloudSync: false
                }
              },
              // Load entries from database
              feedings: allFeedingEntries,
              sleeps: allSleepEntries,
              diapers: allDiaperEntries,
              growth: allGrowthEntries,
              isLoading: false
            })
            return
          } else if (response.status === 404) {
            console.log('User not found in database (404) - clearing stored email')
            // Clear the stored email since the profile doesn't exist in database
            if (typeof window !== 'undefined') {
              localStorage.removeItem('user-email')
            }
            useBabyTrackerStore.setState({
              userProfile: null,
              currentBaby: null,
              appSettings: null,
              isLoading: false
            })
            return
          } else {
            // Real error occurred
            const errorText = await response.text()
            console.error('API error:', response.status, errorText)
            throw new Error(`API error: ${response.status} ${errorText}`)
          }
        } catch (error) {
          console.error('Failed to load profile from database:', error)
          useBabyTrackerStore.setState({
            userProfile: null,
            currentBaby: null,
            appSettings: null,
            isLoading: false
          })
        }
      },
      
      exportUserData: () => {
        const state = get()
        return {
          userProfile: state.userProfile,
          babies: state.babies,
          feedings: state.feedings,
          sleeps: state.sleeps,
          diapers: state.diapers,
          checklists: state.checklists,
          familyMembers: state.familyMembers,
          appSettings: state.appSettings,
          notifications: state.notifications,
          exportDate: new Date(),
          version: '2.1.0'
        }
      },
      
      // ✅ Checklist Actions
      addChecklist: (checklist) => set((state) => ({
        checklists: [...state.checklists, checklist]
      })),
      
      updateTask: (checklistId, taskId, updates) => set((state) => ({
        checklists: state.checklists.map(checklist =>
          checklist.id === checklistId
            ? {
                ...checklist,
                items: checklist.items.map(task =>
                  task.id === taskId ? { ...task, ...updates } : task
                )
              }
            : checklist
        )
      })),
      
      addCustomTask: (checklistId, task) => set((state) => ({
        checklists: state.checklists.map(checklist =>
          checklist.id === checklistId
            ? {
                ...checklist,
                items: [...checklist.items, task]
              }
            : checklist
        )
      })),
      
      deleteTask: (checklistId, taskId) => set((state) => ({
        checklists: state.checklists.map(checklist =>
          checklist.id === checklistId
            ? {
                ...checklist,
                items: checklist.items.filter(task => task.id !== taskId)
              }
            : checklist
        )
      })),
      
      applyTemplate: (checklistId, template) => set((state) => {
        const templateTasks = template.items.map((item, index) => ({
          ...item,
          id: `${Date.now()}-${index}`,
          completed: false,
          completedAt: undefined
        }))
        
        return {
          checklists: state.checklists.map(checklist =>
            checklist.id === checklistId
              ? {
                  ...checklist,
                  items: [...checklist.items, ...templateTasks]
                }
              : checklist
          )
        }
      }),
      
      updateStreak: (completed) => set((state) => {
        const today = new Date()
        const lastCompleted = state.streaks.lastCompletedDate
        
        if (completed) {
          // Check if it's a consecutive day
          const isConsecutive = lastCompleted && 
            Math.abs(today.getTime() - lastCompleted.getTime()) <= 24 * 60 * 60 * 1000
          
          const newCurrent = isConsecutive ? state.streaks.current + 1 : 1
          const newBest = Math.max(state.streaks.best, newCurrent)
          
          return {
            streaks: {
              current: newCurrent,
              best: newBest,
              lastCompletedDate: today
            }
          }
        } else {
          // Reset current streak if not completed
          return {
            streaks: {
              ...state.streaks,
              current: 0
            }
          }
        }
      }),
      
      // ✅ Settings Actions
      updateSettings: async (newSettings) => {
        const state = get()
        
        // Update local state first
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        }))
        
        // Save to database if user is logged in
        if (state.userProfile?.id) {
          try {
            const response = await fetch('/api/user/settings', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: state.userProfile.id,
                ...newSettings
              })
            })
            
            if (!response.ok) {
              console.error('Failed to save settings to database')
            }
          } catch (error) {
            console.error('Error saving settings:', error)
          }
        }
      },
      
      // ✅ Utility Functions
      getTodayFeedings: () => {
        const state = get()
        return state.feedings.filter(f => 
          f.babyId === state.currentBaby?.id && isToday(ensureDate(f.startTime))
        )
      },
      
      getTodaySleeps: () => {
        const state = get()
        return state.sleeps.filter(s => 
          s.babyId === state.currentBaby?.id && isToday(ensureDate(s.startTime))
        )
      },
      
      getTodayDiapers: () => {
        const state = get()
        return state.diapers.filter(d => 
          d.babyId === state.currentBaby?.id && isToday(ensureDate(d.time))
        )
      },
      
      getLastFeeding: () => {
        const state = get()
        const todayFeedings = state.getTodayFeedings()
        return todayFeedings.length > 0 
          ? todayFeedings.sort((a, b) => ensureDate(b.startTime).getTime() - ensureDate(a.startTime).getTime())[0]
          : null
      },
      
      getNextFeedingTime: () => {
        const state = get()
        const lastFeeding = state.getLastFeeding()
        if (!lastFeeding) return new Date()
        
        const lastTime = ensureDate(lastFeeding.time)
        const nextTime = new Date(lastTime.getTime() + state.settings.feedingInterval * 60 * 60 * 1000)
        return nextTime
      },
      
      getTotalDailyMilk: () => {
        const state = get()
        return state.getTodayFeedings()
          .filter(f => f.kind === 'biberon')
          .reduce((total, f) => total + (f.amount || 0), 0)
      },
      
      getTotalDailySleep: () => {
        const state = get()
        const today = new Date()
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
        
        // Get sleep sessions that overlap with today (including cross-day sessions)
        const relevantSleeps = state.sleeps.filter(s => {
          if (s.babyId !== state.currentBaby?.id) return false
          if (!s.endTime) return false
          
          const start = ensureDate(s.startTime)
          const end = ensureDate(s.endTime)
          
          // Include if sleep overlaps with today at all
          return start < endOfToday && end > startOfToday
        })
        
        return relevantSleeps.reduce((total, s) => {
          const start = ensureDate(s.startTime)
          const end = ensureDate(s.endTime!)
          
          // Calculate only the portion that falls within today
          const sleepStart = start < startOfToday ? startOfToday : start
          const sleepEnd = end > endOfToday ? endOfToday : end
          
          if (sleepEnd > sleepStart) {
            return total + Math.floor((sleepEnd.getTime() - sleepStart.getTime()) / (1000 * 60))
          }
          return total
        }, 0)
      },
      
      initializeData: () => {
        // Data initialization is now handled by initializeProfile
        // which loads everything from the database
        console.log('initializeData called - data loading handled by initializeProfile')
      }
    }))

// ✅ Email-based user identification system
const getUserIdentifier = () => {
  if (typeof window !== 'undefined') {
    const store = useBabyTrackerStore.getState()
    const userProfile = store.userProfile
    
    // If we have a user profile, use the actual user ID
    if (userProfile && userProfile.id) {
      return userProfile.id
    }
    
    // Return null if no user profile available - should not happen with SQL database approach
    return null
  }
  return null
}

// ✅ Legacy function for backward compatibility
const getTempUserId = getUserIdentifier

// ✅ API sync functions
const syncWithAPI = {
  async ensureUserExists() {
    try {
      const store = useBabyTrackerStore.getState()
      const profile = store.userProfile
      
      if (!profile || !profile.email) {
        console.log('No user profile in store yet, skipping user creation')
        return null
      }

      console.log('Looking up user by email:', profile.email)

      // Use email-based lookup first
      const lookupResponse = await fetch('/api/user/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: profile.email,
          oldUserData: {
            id: getTempUserId()
          }
        }),
      })

      if (!lookupResponse.ok) {
        throw new Error('Failed to lookup user')
      }

      const lookupResult = await lookupResponse.json()
      
      if (lookupResult.user) {
        console.log('Found existing user or updated email:', lookupResult.user.id)
        return lookupResult.user
      }

      // If no existing user, create new one
      console.log('Creating new user with email:', profile.email)

      const userId = getTempUserId()
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: userId,
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          avatar: profile.avatar,
          role: profile.role,
          preferredName: profile.preferredName,
          timezone: profile.timezone,
          language: profile.language,
          phone: profile.phone
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('User creation failed:', response.status, errorText)
        throw new Error(`Failed to ensure user exists: ${response.status} ${errorText}`)
      }
      
      const result = await response.json()
      console.log('User created/updated successfully:', result)
      return result
    } catch (error) {
      console.error('Error ensuring user exists:', error)
      throw error
    }
  },

  async ensureBabyExists(babyId: string, babyData?: any) {
    try {
      // Ensure user exists first - this MUST succeed before proceeding
      console.log('Ensuring user exists before creating baby...')
      const userResult = await this.ensureUserExists()
      if (!userResult) {
        console.log('No user profile available, skipping baby sync')
        return null
      }
      console.log('User exists, now creating/updating baby...')
      
      // Then check if baby exists by trying to create/update it
      const store = useBabyTrackerStore.getState()
      const baby = babyData || store.babies.find(b => b.id === babyId) || store.currentBaby
      
      if (!baby) {
        console.error('Baby data not found for ID:', babyId, 'Available babies:', store.babies)
        throw new Error('Baby data not found')
      }

      const userId = getTempUserId()
      console.log('Creating/updating baby:', babyId, 'for user:', userId)

      const response = await fetch('/api/babies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: babyId,
          name: baby.name,
          birthDate: baby.birthDate,
          gender: baby.gender,
          weight: baby.weight,
          height: baby.height,
          avatar: baby.avatar,
          userId: userId
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Baby creation failed:', response.status, errorText)
        throw new Error(`Failed to ensure baby exists: ${response.status} ${errorText}`)
      }
      
      const result = await response.json()
      console.log('Baby created/updated successfully:', result)
      return result
    } catch (error) {
      console.error('Error ensuring baby exists:', error)
      throw error
    }
  },

  async createFeedingEntry(babyId: string, feedingData: any) {
    try {
      // Ensure baby exists first
      const babyResult = await this.ensureBabyExists(babyId)
      if (!babyResult) {
        console.log('No user profile available, skipping feeding entry sync')
        return null
      }
      
      const response = await fetch(`/api/babies/${babyId}/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: getTempUserId(),
          type: feedingData.kind,
          amount: feedingData.amount,
          startTime: feedingData.startTime,
          endTime: feedingData.endTime,
          duration: feedingData.duration,
          mood: feedingData.mood,
          notes: feedingData.notes
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to sync feeding entry')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error syncing feeding entry:', error)
      throw error
    }
  },

  async updateFeedingEntry(babyId: string, entryId: string, feedingData: any) {
    try {
      // Get user email for authentication
      const storedEmail = localStorage.getItem('user-email')
      if (!storedEmail) {
        console.log('No user email available, skipping feeding entry update')
        return null
      }

      const response = await fetch(`/api/babies/${babyId}/entries`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entryId: entryId,
          userEmail: storedEmail,
          type: 'feeding',
          kind: feedingData.kind,
          amount: feedingData.amount,
          startTime: feedingData.startTime,
          endTime: feedingData.endTime,
          duration: feedingData.duration,
          mood: feedingData.mood,
          notes: feedingData.notes
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to update feeding entry:', response.status, errorText)
        throw new Error(`Failed to update feeding entry: ${response.status} - ${errorText}`)
      }
      
      console.log('Feeding entry updated successfully in database')
      return await response.json()
    } catch (error) {
      console.error('Error updating feeding entry:', error)
      throw error
    }
  },

  async createSleepEntry(babyId: string, sleepData: any) {
    try {
      // Ensure baby exists first
      const babyResult = await this.ensureBabyExists(babyId)
      if (!babyResult) {
        console.log('No user profile available, skipping sleep entry sync')
        return null
      }
      
      const response = await fetch(`/api/babies/${babyId}/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: getTempUserId(),
          type: 'sleep',
          startTime: sleepData.startTime,
          endTime: sleepData.endTime,
          duration: sleepData.duration,
          quality: sleepData.quality,
          sleepType: sleepData.type,
          location: sleepData.location,
          notes: sleepData.notes
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to sync sleep entry')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error syncing sleep entry:', error)
      throw error
    }
  },

  async createDiaperEntry(babyId: string, diaperData: any) {
    try {
      // Ensure baby exists first
      const babyResult = await this.ensureBabyExists(babyId)
      if (!babyResult) {
        console.log('No user profile available, skipping diaper entry sync')
        return null
      }
      
      const response = await fetch(`/api/babies/${babyId}/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: getTempUserId(),
          type: 'diaper',
          time: diaperData.timestamp || diaperData.time,
          diaperType: diaperData.type,
          
          // Enhanced fields
          wetness: diaperData.wetness,
          stool: diaperData.stool,
          diaper: diaperData.diaper,
          mood: diaperData.mood,
          changedBy: diaperData.changedBy,
          notes: diaperData.notes,
          
          // Legacy fields for backward compatibility
          amount: diaperData.amount,
          color: diaperData.color
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to sync diaper entry')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error syncing diaper entry:', error)
      throw error
    }
  },

  async updateProfile(profileData: any) {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      })
      
      if (!response.ok) {
        throw new Error('Failed to sync profile')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error syncing profile:', error)
      throw error
    }
  },

  async createUser(userData: any) {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create user')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  },

  async createBaby(babyData: any) {
    try {
      const response = await fetch('/api/babies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(babyData),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create baby')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error creating baby:', error)
      throw error
    }
  },

  async deleteFeedingEntry(babyId: string, entryId: string) {
    try {
      const store = useBabyTrackerStore.getState()
      const userEmail = store.userProfile?.email
      
      if (!userEmail) {
        console.log('No user email available, skipping feeding deletion sync')
        return null
      }

      console.log('Attempting to delete feeding entry:', { babyId, entryId, userEmail })

      const response = await fetch(`/api/babies/${babyId}/entries?entryId=${entryId}&type=feeding&email=${encodeURIComponent(userEmail)}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Delete feeding API error:', response.status, errorText)
        throw new Error(`Failed to delete feeding entry: ${response.status} - ${errorText}`)
      }
      
      console.log('Feeding entry deleted from database:', entryId)
      return await response.json()
    } catch (error) {
      console.error('Error deleting feeding entry from database:', error)
      throw error
    }
  },

  async deleteSleepEntry(babyId: string, entryId: string) {
    try {
      const store = useBabyTrackerStore.getState()
      const userEmail = store.userProfile?.email
      
      if (!userEmail) {
        console.log('No user email available, skipping sleep deletion sync')
        return null
      }

      const response = await fetch(`/api/babies/${babyId}/entries?entryId=${entryId}&type=sleep&email=${encodeURIComponent(userEmail)}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Delete sleep API error:', response.status, errorText)
        throw new Error(`Failed to delete sleep entry: ${response.status} - ${errorText}`)
      }
      
      console.log('Sleep entry deleted from database:', entryId)
      return await response.json()
    } catch (error) {
      console.error('Error deleting sleep entry from database:', error)
      throw error
    }
  },

  async deleteDiaperEntry(babyId: string, entryId: string) {
    try {
      const store = useBabyTrackerStore.getState()
      const userEmail = store.userProfile?.email
      
      if (!userEmail) {
        console.log('No user email available, skipping diaper deletion sync')
        return null
      }

      const response = await fetch(`/api/babies/${babyId}/entries?entryId=${entryId}&type=diaper&email=${encodeURIComponent(userEmail)}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Delete diaper API error:', response.status, errorText)
        throw new Error(`Failed to delete diaper entry: ${response.status} - ${errorText}`)
      }
      
      console.log('Diaper entry deleted from database:', entryId)
      return await response.json()
    } catch (error) {
      console.error('Error deleting diaper entry from database:', error)
      throw error
    }
  },

  async updateSleepEntry(babyId: string, entryId: string, sleepData: any) {
    try {
      // Get user email for authentication
      const storedEmail = localStorage.getItem('user-email')
      if (!storedEmail) {
        console.log('No user email available, skipping sleep entry update')
        return null
      }

      const response = await fetch(`/api/babies/${babyId}/entries`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entryId: entryId,
          userEmail: storedEmail,
          type: 'sleep',
          startTime: sleepData.startTime,
          endTime: sleepData.endTime,
          duration: sleepData.duration,
          quality: sleepData.quality,
          sleepType: sleepData.type,
          location: sleepData.location,
          notes: sleepData.notes
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to update sleep entry:', response.status, errorText)
        throw new Error(`Failed to update sleep entry: ${response.status} - ${errorText}`)
      }
      
      console.log('Sleep entry updated successfully in database')
      return await response.json()
    } catch (error) {
      console.error('Error updating sleep entry:', error)
      throw error
    }
  },

  async createGrowthEntry(babyId: string, growthData: any) {
    try {
      // Ensure baby exists first
      const babyResult = await this.ensureBabyExists(babyId)
      if (!babyResult) {
        console.log('No user profile available, skipping growth entry sync')
        return null
      }
      
      const response = await fetch(`/api/babies/${babyId}/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'growth',
          date: growthData.date,
          weight: growthData.weight,
          height: growthData.height,
          headCircumference: growthData.headCircumference,
          notes: growthData.notes
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Growth entry API error:', response.status, errorText)
        throw new Error(`Failed to create growth entry: ${response.status} - ${errorText}`)
      }
      
      console.log('Growth entry saved to database:', growthData)
      return await response.json()
    } catch (error) {
      console.error('Error saving growth entry to database:', error)
      throw error
    }
  },

  async updateGrowthEntry(babyId: string, entryId: string, growthData: any) {
    try {
      // Get user email for authentication
      const storedEmail = localStorage.getItem('user-email')
      if (!storedEmail) {
        console.log('No user email available, skipping growth entry update')
        return null
      }

      const response = await fetch(`/api/babies/${babyId}/entries`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entryId: entryId,
          userEmail: storedEmail,
          type: 'growth',
          date: growthData.date,
          weight: growthData.weight,
          height: growthData.height,
          headCircumference: growthData.headCircumference,
          notes: growthData.notes
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to update growth entry:', response.status, errorText)
        throw new Error(`Failed to update growth entry: ${response.status} - ${errorText}`)
      }
      
      console.log('Growth entry updated successfully in database')
      return await response.json()
    } catch (error) {
      console.error('Error updating growth entry:', error)
      throw error
    }
  },

  async deleteGrowthEntry(babyId: string, entryId: string) {
    try {
      // Get user email for authentication
      const storedEmail = localStorage.getItem('user-email')
      if (!storedEmail) {
        console.log('No user email available, skipping growth entry deletion')
        return null
      }

      const response = await fetch(`/api/babies/${babyId}/entries?entryId=${entryId}&type=growth&email=${encodeURIComponent(storedEmail)}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Delete growth API error:', response.status, errorText)
        throw new Error(`Failed to delete growth entry: ${response.status} - ${errorText}`)
      }
      
      console.log('Growth entry deleted from database:', entryId)
      return await response.json()
    } catch (error) {
      console.error('Error deleting growth entry from database:', error)
      throw error
    }
  }
}

// ✅ Initialize store on creation
if (typeof window !== 'undefined') {
  useBabyTrackerStore.getState().initializeData()
}

// ✅ Export helper functions for external use
export { 
  generateId, 
  isToday, 
  ensureDate, 
  getRecommendedFeedingInterval, 
  getRecommendedDailySleep, 
  getAgeInWeeks,
  NotificationService 
}