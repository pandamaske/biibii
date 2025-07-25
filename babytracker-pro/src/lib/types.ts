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

export type DiaperType = 'wet' | 'soiled' | 'mixed'
export type DiaperAmount = 'light' | 'normal' | 'heavy'
export type DiaperColor = 'yellow' | 'brown' | 'green' | 'other'

export interface DiaperEntry {
  id: string
  babyId: string
  time: Date
  type: DiaperType
  amount: DiaperAmount
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

// src/lib/notificationService.ts - Service pour gérer les notifications
import { Notification, Baby, Feeding, Sleep } from './types'

export class NotificationService {
  
  // ✅ Génération automatique de notifications basées sur les données
  static generateFeedingNotifications(
    baby: Baby, 
    lastFeeding: Feeding | null, 
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

  // ✅ Notifications de sommeil
  static generateSleepNotifications(
    baby: Baby,
    totalSleepToday: number,
    recommendedSleep: number,
    lastSleep: Sleep | null
  ): Notification[] {
    const notifications: Notification[] = []
    
    // Pas assez dormi
    if (totalSleepToday < recommendedSleep * 0.7) {
      notifications.push({
        id: `sleep-insufficient-${Date.now()}`,
        type: 'sleep',
        title: 'Sommeil insuffisant',
        message: `${baby.name} a dormi ${Math.floor(totalSleepToday / 60)}h sur ${Math.floor(recommendedSleep / 60)}h recommandées`,
        priority: 'medium',
        isRead: false,
        createdAt: new Date(),
        actionUrl: '/sleep',
        icon: '😴',
        babyId: baby.id
      })
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

  // ✅ Notifications de santé et milestones
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

  // ✅ Génération de toutes les notifications
  static generateAllNotifications(
    baby: Baby,
    lastFeeding: any,
    lastSleep: any,
    totalSleepToday: number,
    recommendedInterval: number,
    recommendedSleep: number,
    settings: NotificationSettings
  ): Notification[] {
    let allNotifications: Notification[] = []

    // Vérifier les heures de silence
    if (!this.isQuietTime(settings)) {
      if (settings.enableFeedingAlerts) {
        allNotifications.push(...this.generateFeedingNotifications(baby, lastFeeding, recommendedInterval))
      }
      
      if (settings.enableSleepAlerts) {
        allNotifications.push(...this.generateSleepNotifications(baby, totalSleepToday, recommendedSleep, lastSleep))
      }
      
      if (settings.enableHealthReminders || settings.enableMilestoneReminders) {
        allNotifications.push(...this.generateHealthNotifications(baby))
      }
    }

    return allNotifications
  }

  // ✅ Vérifier si on est en heures de silence
  static isQuietTime(settings: NotificationSettings): boolean {
    const now = new Date()
    const currentTime = now.getHours() * 100 + now.getMinutes()
    const quietStart = parseInt(settings.quietHoursStart.replace(':', ''))
    const quietEnd = parseInt(settings.quietHoursEnd.replace(':', ''))
    
    if (quietStart > quietEnd) {
      // Nuit (ex: 22:00 - 07:00)
      return currentTime >= quietStart || currentTime <= quietEnd
    } else {
      // Jour (ex: 12:00 - 14:00)
      return currentTime >= quietStart && currentTime <= quietEnd
    }
  }
}

// src/lib/store.ts - Ajouter à votre store Zustand existant

interface NotificationStore {
  notifications: Notification[]
  notificationSettings: NotificationSettings
  unreadCount: number
  
  // Actions
  addNotification: (notification: Notification) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearOldNotifications: () => void
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void
  generateNotifications: () => void
  getUnreadCount: () => number
}

// À ajouter dans votre store existant (useBabyTrackerStore)
const notificationSlice = {
  notifications: [] as Notification[],
  notificationSettings: {
    enableFeedingAlerts: true,
    feedingIntervalMinutes: 180, // 3 heures
    enableSleepAlerts: true,
    enableMilestoneReminders: true,
    enableHealthReminders: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00'
  } as NotificationSettings,
  unreadCount: 0,

  addNotification: (notification: Notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    })),

  markAsRead: (id: string) =>
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

  removeNotification: (id: string) =>
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
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const filteredNotifications = state.notifications.filter(
        n => new Date(n.createdAt) > oneDayAgo
      )
      return {
        notifications: filteredNotifications,
        unreadCount: filteredNotifications.filter(n => !n.isRead).length
      }
    }),

  updateNotificationSettings: (settings: Partial<NotificationSettings>) =>
    set((state) => ({
      notificationSettings: { ...state.notificationSettings, ...settings }
    })),

  generateNotifications: () =>
    set((state) => {
      if (!state.currentBaby) return state

      const lastFeeding = state.getLastFeeding()
      const lastSleep = state.getTodaySleeps()[0] || null
      const totalSleepToday = state.getTotalDailySleep()
      const recommendedInterval = getRecommendedFeedingInterval(getAgeInWeeks(state.currentBaby.birthDate))
      const recommendedSleep = getRecommendedDailySleep(getAgeInWeeks(state.currentBaby.birthDate))

      const newNotifications = NotificationService.generateAllNotifications(
        state.currentBaby,
        lastFeeding,
        lastSleep,
        totalSleepToday,
        recommendedInterval,
        recommendedSleep,
        state.notificationSettings
      )

      // Éviter les doublons
      const existingIds = state.notifications.map(n => n.id)
      const uniqueNewNotifications = newNotifications.filter(n => !existingIds.includes(n.id))

      return {
        notifications: [...uniqueNewNotifications, ...state.notifications],
        unreadCount: state.unreadCount + uniqueNewNotifications.length
      }
    }),

  getUnreadCount: () => get().unreadCount
}


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
  colorScheme: 'green' | 'blue' | 'purple' | 'pink' | 'orange'
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

// ===== HEALTH MODULE INTERFACES =====

export interface HealthSummary {
  lastCheckup: Date
  nextAppointment: Date
  vaccinesUpToDate: boolean
  concernsCount: number
  growthPercentile: number
  developmentOnTrack: boolean
}

// Medical Records & Appointments
export interface HealthcareProvider {
  id: string
  name: string
  type: 'pediatrician' | 'emergency' | 'specialist' | 'urgent_care'
  phone: string
  email?: string
  address?: string
  hours?: string
  distance?: string
  nextAvailable?: string
}

export interface EmergencyContact {
  id: string
  name: string
  relationship: string
  phone: string
  email?: string
  isDefault: boolean
}

export interface InsuranceDetails {
  provider: string
  memberId: string
  groupNumber: string
  copay: string
  deductible?: string
  effectiveDate: Date
  expirationDate?: Date
}

export interface Appointment {
  id: string
  babyId: string
  providerId: string
  type: string
  date: Date
  duration: number
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
  notes?: string
  reminders: Date[]
}

export interface MedicalRecord {
  appointments: Appointment[]
  providers: HealthcareProvider[]
  insuranceInfo: InsuranceDetails
  emergencyContacts: EmergencyContact[]
}

// Vaccination System
export interface VaccineEntry {
  id: string
  name: string
  status: 'completed' | 'due' | 'upcoming' | 'overdue'
  scheduledDate?: Date
  completedDate?: Date
  location?: string
  batchNumber?: string
  reactions?: string
  notes?: string
}

export interface VaccineGroup {
  age: string
  ageInMonths: number
  vaccines: VaccineEntry[]
  isCurrent?: boolean
}

export interface VaccineDue {
  vaccineId: string
  name: string
  dueDate: Date
  isUrgent: boolean
}

export interface VaccineSchedule {
  vaccines: VaccineEntry[]
  schedule: VaccineGroup[]
  upcomingDue: VaccineDue[]
  travelVaccines?: VaccineEntry[]
}

// Symptoms & Illness Tracking
export interface Symptom {
  id: string
  name: string
  category: 'fever' | 'digestive' | 'respiratory' | 'skin' | 'behavioral' | 'other'
  severity: 'mild' | 'moderate' | 'severe'
  icon?: string
}

export interface SymptomPhoto {
  id: string
  url: string
  bodyPart: string
  notes?: string
  timestamp: Date
}

export interface MedicationDose {
  medicationId: string
  dosage: number
  unit: 'ml' | 'mg' | 'drops'
  time: Date
}

export interface SymptomEntry {
  id: string
  babyId: string
  date: Date
  symptoms: Symptom[]
  temperature?: number
  temperatureUnit: 'celsius' | 'fahrenheit'
  photos?: SymptomPhoto[]
  medications: MedicationDose[]
  notes: string
  doctorContacted: boolean
  followUpRequired?: boolean
}

// Medication Management
export interface Medication {
  id: string
  name: string
  type: 'pain_reliever' | 'antibiotic' | 'vitamin' | 'prescription' | 'other'
  activeIngredient: string
  concentration: string
  form: 'liquid' | 'tablet' | 'drops' | 'suppository'
}

export interface MedicationEntry {
  id: string
  babyId: string
  medication: Medication
  dosage: number
  unit: 'ml' | 'mg' | 'drops'
  frequency: string
  startDate: Date
  endDate?: Date
  remainingDoses: number
  sideEffects?: string[]
  prescribedBy?: string
  notes?: string
}

export interface DosageCalculation {
  dosage: string
  frequency: string
  maxDaily: string
  nextDue: string
  safetyAlerts: string[]
}

// Developmental Milestones
export type MilestoneCategory = 'motor' | 'cognitive' | 'language' | 'social' | 'adaptive'

export interface AgeRange {
  minWeeks: number
  maxWeeks: number
}

export interface DevelopmentalMilestone {
  id: string
  babyId: string
  category: MilestoneCategory
  milestone: string
  description: string
  typicalAge: AgeRange
  achieved: boolean
  achievedDate?: Date
  photos?: string[]
  video?: string
  notes?: string
  concerns?: string[]
}

export interface MilestoneActivity {
  id: string
  name: string
  description: string
  category: MilestoneCategory
  ageRange: AgeRange
}

// Postpartum Parent Health
export interface ParentHealthProfile {
  id: string
  parentId: string
  deliveryType: 'vaginal' | 'cesarean'
  deliveryDate: Date
  complications?: string[]
  currentConditions?: string[]
}

export interface PhysicalRecovery {
  cSectionHealing?: boolean
  lochia: 'heavy' | 'moderate' | 'light' | 'none'
  painLevel: number // 1-10 scale
  energyLevel: number // 1-10 scale
  sleepQuality: 'excellent' | 'good' | 'poor' | 'terrible'
}

export interface BreastfeedingHealth {
  nippleHealth: 'healthy' | 'sore' | 'cracked' | 'bleeding' | 'healing'
  supplyLevel: 'oversupply' | 'adequate' | 'low' | 'very_low'
  pumpOutput?: number[] // ml per session
  supplements?: string[]
  concerns?: string[]
  mastitisRisk: boolean
}

export interface MentalHealthTracking {
  edpsScore?: number // Edinburgh Postnatal Depression Scale
  anxietyLevel: number // 1-10 scale
  moodEntries: MoodEntry[]
  riskLevel: 'low' | 'moderate' | 'high'
  supportResources: SupportResource[]
}

export interface MoodEntry {
  id: string
  date: Date
  mood: 'excellent' | 'good' | 'okay' | 'low' | 'very_low'
  anxietyLevel: number
  stressFactors?: string[]
  copingStrategies?: string[]
  notes?: string
}

export interface SupportResource {
  id: string
  type: 'therapy' | 'support_group' | 'emergency' | 'online' | 'book'
  name: string
  contact?: string
  url?: string
  description?: string
}

export interface PostpartumHealth {
  parentProfile: ParentHealthProfile
  physicalRecovery: PhysicalRecovery
  mentalHealth: MentalHealthTracking
  breastfeedingHealth?: BreastfeedingHealth
}

// Emergency & Safety
export interface FirstAidGuide {
  id: string
  title: string
  type: 'video' | 'interactive' | 'article' | 'checklist'
  duration?: string
  content: string
  steps?: string[]
  emergencyNumber?: string
}

export interface SafetyChecklistItem {
  id: string
  title: string
  category: 'crib_safety' | 'home_safety' | 'car_safety' | 'water_safety'
  ageRange: AgeRange
  checked: boolean
  priority: 'high' | 'medium' | 'low'
  instructions?: string
}

export interface ProductRecall {
  id: string
  productName: string
  brand: string
  modelNumber: string
  severity: 'high' | 'medium' | 'low'
  description: string
  actionRequired: string
  recallDate: Date
  url?: string
}

export interface EmergencyFeatures {
  emergencyContacts: EmergencyContact[]
  firstAid: FirstAidGuide[]
  poisonControl: string
  healthcareDirections: string
  safetyChecklists: SafetyChecklistItem[]
  recalls: ProductRecall[]
}

// Health Page Layout
export interface HealthTab {
  id: 'overview' | 'vaccines' | 'symptoms' | 'medications' | 'milestones' | 'postpartum' | 'emergency'
  icon: string
  label: string
}

export interface QuickHealthAction {
  icon: string
  label: string
  action: string
  color?: string
}

// Health Alerts & Notifications
export interface HealthAlert {
  id: string
  type: 'vaccine_due' | 'appointment_reminder' | 'medication_reminder' | 'milestone_check' | 'emergency'
  severity: 'info' | 'warning' | 'urgent'
  title: string
  message: string
  dueDate?: Date
  actionRequired?: boolean
  babyId: string
  createdAt: Date
}
