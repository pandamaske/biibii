// ── src/lib/types.ts

export interface Baby {
  id: string
  name: string
  birthDate: Date
  weight: number // en grammes
  height: number // en cm
  avatar: string // emoji ou URL
  gender: 'male' | 'female' | 'other'
}

export type FeedingKind = 'biberon' | 'tétée' | 'solide' | 'snack'

export interface FeedingEntry {
  id: string
  babyId: string
  kind: FeedingKind
  amount?: number        // mL pour liquides, g pour solides
  duration: number       // secondes (pour tétées principalement)
  startTime: Date
  mood: 'happy' | 'content' | 'difficult'
  notes?: string
}

export type SleepQuality = 'excellent' | 'good' | 'restless' | 'difficult'
export type SleepType = 'night' | 'nap'

export interface SleepEntry {
  id: string
  babyId: string
  startTime: Date
  endTime?: Date
  quality: SleepQuality
  type: SleepType
  notes?: string
  location?: 'bed' | 'stroller' | 'arms' | 'car' // où a dormi bébé
}

export type DiaperType = 'wet' | 'soiled' | 'mixed' | 'dry'
export type DiaperAmount = 'light' | 'normal' | 'heavy'
export type DiaperColor = 'yellow' | 'brown' | 'green' | 'other'

export interface DiaperEntry {
  id: string
  babyId: string
  time: Date
  type: DiaperType
  amount?: DiaperAmount
  color?: DiaperColor
  notes?: string
}

export type AlertType = 'feeding' | 'sleep' | 'diaper' | 'health' | 'growth'
export type AlertLevel = 'info' | 'warning' | 'urgent'

export interface Alert {
  id: string
  type: AlertType
  level: AlertLevel
  title: string
  message: string
  icon: string
  action?: () => void
  createdAt: Date
  isRead?: boolean
  expiresAt?: Date
}

// Statistiques et rapports
export interface DailyStats {
  date: Date
  totalFeedings: number
  totalMilk: number // mL
  totalSleep: number // minutes
  totalDiapers: number
  averageFeedingInterval: number // minutes
  longestSleep: number // minutes
  mood: 'excellent' | 'good' | 'difficult' // humeur générale de la journée
}

export interface WeeklyStats {
  weekStart: Date
  dailyStats: DailyStats[]
  weeklyAverages: {
    feedingsPerDay: number
    milkPerDay: number
    sleepPerDay: number
    diapersPerDay: number
  }
  trends: {
    feeding: 'increasing' | 'stable' | 'decreasing'
    sleep: 'improving' | 'stable' | 'declining'
    weight: 'gaining' | 'stable' | 'losing'
  }
}

// Paramètres et préférences
export interface UserSettings {
  notifications: {
    enabled: boolean
    feedingReminders: boolean
    sleepTracking: boolean
    diaper: boolean
    growth: boolean
  }
  feeding: {
    defaultBottleAmount: number
    defaultInterval: number // heures
    units: 'ml' | 'oz'
  }
  display: {
    darkMode: boolean
    language: 'fr' | 'en'
    timeFormat: '12h' | '24h'
  }
  privacy: {
    dataSharing: boolean
    analytics: boolean
  }
}

// Croissance
export interface GrowthEntry {
  id: string
  babyId: string
  date: Date
  weight?: number // grammes
  height?: number // cm
  headCircumference?: number // cm
  notes?: string
}

export interface GrowthPercentile {
  age: number // en jours
  weight: {
    p3: number
    p10: number
    p25: number
    p50: number
    p75: number
    p90: number
    p97: number
  }
  height: {
    p3: number
    p10: number
    p25: number
    p50: number
    p75: number
    p90: number
    p97: number
  }
}

// Tâches et checklist
export interface ChecklistItem {
  id: string
  title: string
  description?: string
  category: 'feeding' | 'sleep' | 'hygiene' | 'health' | 'development'
  frequency: 'daily' | 'weekly' | 'monthly' | 'asneeded'
  ageRange?: [number, number] // en semaines
  icon: string
  completed: boolean
  completedAt?: Date
}

export interface DailyChecklist {
  date: Date
  babyId: string
  items: ChecklistItem[]
  completionRate: number // pourcentage
}

// Timer et sessions
export interface TimerSession {
  id: string
  type: 'feeding' | 'sleep' | 'tummytime' | 'play'
  startTime: Date
  endTime?: Date
  isActive: boolean
  notes?: string
}

// Milestones et développement
export interface Milestone {
  id: string
  title: string
  description: string
  category: 'motor' | 'language' | 'social' | 'cognitive'
  expectedAge: number // en semaines
  achieved: boolean
  achievedAt?: Date
  notes?: string
}

// Export/Import
export interface DataExport {
  version: string
  exportDate: Date
  baby: Baby
  feedings: FeedingEntry[]
  sleeps: SleepEntry[]
  diapers: DiaperEntry[]
  growth: GrowthEntry[]
  checklists: DailyChecklist[]
  milestones: Milestone[]
  settings: UserSettings
}

// Utilitaires
export type DateRange = {
  start: Date
  end: Date
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'

export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

// src/lib/types.ts - Ajouter ces types aux types existants

export interface Notification {
  id: string
  type: 'feeding' | 'sleep' | 'diaper' | 'health' | 'milestone' | 'reminder'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  isRead: boolean
  createdAt: Date
  actionUrl?: string // Pour navigation
  icon?: string
  babyId?: string
}

export interface NotificationSettings {
  enableFeedingAlerts: boolean
  feedingIntervalMinutes: number
  enableSleepAlerts: boolean
  enableMilestoneReminders: boolean
  enableHealthReminders: boolean
  quietHoursStart: string // "22:00"
  quietHoursEnd: string   // "07:00"
}