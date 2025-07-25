// ── src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Baby, FeedingEntry, SleepEntry } from './types'

// Tailwind utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date utilities
export function ensureDate(value: any): Date {
  if (value instanceof Date) return value
  if (typeof value === 'string') return new Date(value)
  if (typeof value === 'number') return new Date(value)
  return new Date()
}

export function isToday(date: Date | string): boolean {
  const today = new Date()
  const compareDate = ensureDate(date)
  return compareDate.toDateString() === today.toDateString()
}

export function isYesterday(date: Date | string): boolean {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const compareDate = ensureDate(date)
  return compareDate.toDateString() === yesterday.toDateString()
}

export function getDaysDifference(date1: Date | string, date2: Date | string = new Date()): number {
  const d1 = ensureDate(date1)
  const d2 = ensureDate(date2)
  const timeDiff = Math.abs(d2.getTime() - d1.getTime())
  return Math.floor(timeDiff / (1000 * 60 * 60 * 24))
}

// Age calculations
export function getAgeInDays(birthDate: Date | string): number {
  return getDaysDifference(birthDate)
}

export function getAgeInWeeks(birthDate: Date | string): number {
  return Math.floor(getAgeInDays(birthDate) / 7)
}

export function getAgeInMonths(birthDate: Date | string): number {
  const birth = ensureDate(birthDate)
  const now = new Date()
  let months = (now.getFullYear() - birth.getFullYear()) * 12
  months += now.getMonth() - birth.getMonth()
  
  // Ajuster si le jour n'est pas encore atteint ce mois-ci
  if (now.getDate() < birth.getDate()) {
    months--
  }
  
  return Math.max(0, months)
}

export function formatAge(birthDate: Date | string): string {
  const days = getAgeInDays(birthDate)
  const weeks = getAgeInWeeks(birthDate)
  const months = getAgeInMonths(birthDate)
  
  if (days < 14) {
    return `${days} jour${days > 1 ? 's' : ''}`
  } else if (weeks < 12) {
    return `${weeks} semaine${weeks > 1 ? 's' : ''}`
  } else {
    const remainingWeeks = weeks - (months * 4)
    if (remainingWeeks > 0) {
      return `${months} mois ${remainingWeeks} semaine${remainingWeeks > 1 ? 's' : ''}`
    }
    return `${months} mois`
  }
}

// Time formatting
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours > 0) {
    return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`
  }
  return `${mins}min`
}

export function formatShortDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours > 0) {
    return `${hours}h${mins.toString().padStart(2, '0')}`
  }
  return `${mins}min`
}

// Feeding utilities
export function getRecommendedDailyMilk(weightInGrams: number, ageInWeeks: number): number {
  // Recommandations générales (à adapter selon les conseils médicaux)
  const weightInKg = weightInGrams / 1000
  
  if (ageInWeeks <= 4) {
    return Math.round(weightInKg * 150) // 150ml/kg pour nouveau-nés
  } else if (ageInWeeks <= 12) {
    return Math.round(weightInKg * 150)
  } else if (ageInWeeks <= 24) {
    return Math.round(weightInKg * 120) // Moins avec diversification
  } else {
    return Math.round(weightInKg * 100)
  }
}

export function getRecommendedFeedingInterval(ageInWeeks: number): number {
  // Retourne l'intervalle en heures
  if (ageInWeeks <= 4) {
    return 2.5 // Toutes les 2h30
  } else if (ageInWeeks <= 12) {
    return 3 // Toutes les 3h
  } else if (ageInWeeks <= 24) {
    return 3.5 // Toutes les 3h30
  } else {
    return 4 // Toutes les 4h
  }
}

export function getNextFeedingTime(lastFeeding: FeedingEntry | null, intervalHours: number): Date {
  if (!lastFeeding) {
    return new Date() // Si pas de dernier repas, maintenant
  }
  
  const lastTime = ensureDate((lastFeeding as any).time)
  return new Date(lastTime.getTime() + intervalHours * 60 * 60 * 1000)
}

export function isLateForFeeding(lastFeeding: FeedingEntry | null, intervalHours: number): boolean {
  if (!lastFeeding) return true
  
  const nextTime = getNextFeedingTime(lastFeeding, intervalHours)
  return new Date() > nextTime
}

export function getTimeSinceLastFeeding(lastFeeding: FeedingEntry | null): string {
  if (!lastFeeding) return 'Aucun repas enregistré'
  
  const now = new Date()
  const lastTime = ensureDate((lastFeeding as any).time)
  const diffMinutes = Math.floor((now.getTime() - lastTime.getTime()) / (1000 * 60))
  
  return formatDuration(diffMinutes)
}

// Sleep utilities
export function getSleepDuration(sleep: SleepEntry): number {
  if (!sleep.endTime) return 0
  
  const start = ensureDate(sleep.startTime)
  const end = ensureDate(sleep.endTime)
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60)) // minutes
}

export function getTotalDailySleep(sleeps: SleepEntry[]): number {
  return sleeps
    .filter(s => s.endTime && isToday(s.startTime))
    .reduce((total, s) => total + getSleepDuration(s), 0)
}

export function getRecommendedDailySleep(ageInWeeks: number): number {
  // Minutes de sommeil recommandées par jour
  if (ageInWeeks <= 4) {
    return 16 * 60 // 16h pour nouveau-nés
  } else if (ageInWeeks <= 12) {
    return 15 * 60 // 15h
  } else if (ageInWeeks <= 24) {
    return 14 * 60 // 14h
  } else if (ageInWeeks <= 52) {
    return 13 * 60 // 13h
  } else {
    return 12 * 60 // 12h
  }
}

// Growth utilities
export function calculatePercentile(value: number, percentiles: number[]): number {
  // Calcul approximatif du percentile
  for (let i = 0; i < percentiles.length; i++) {
    if (value <= percentiles[i]) {
      return (i / (percentiles.length - 1)) * 100
    }
  }
  return 100
}

export function getGrowthStatus(currentWeight: number, previousWeight: number, days: number): 'gaining' | 'stable' | 'losing' {
  const dailyChange = (currentWeight - previousWeight) / days
  
  if (dailyChange > 20) return 'gaining' // > 20g/jour
  if (dailyChange < -10) return 'losing' // Perte
  return 'stable'
}

// Mood and quality helpers
export function getMoodEmoji(mood: 'happy' | 'content' | 'difficult'): string {
  switch (mood) {
    case 'happy': return '😊'
    case 'content': return '😌'
    case 'difficult': return '😰'
    default: return '😐'
  }
}

export function getQualityEmoji(quality: 'excellent' | 'good' | 'restless' | 'difficult'): string {
  switch (quality) {
    case 'excellent': return '😴'
    case 'good': return '😊'
    case 'restless': return '😅'
    case 'difficult': return '😰'
    default: return '😐'
  }
}

export function getQualityColor(quality: 'excellent' | 'good' | 'restless' | 'difficult'): string {
  switch (quality) {
    case 'excellent': return 'text-primary-600'
    case 'good': return 'text-blue-600'
    case 'restless': return 'text-yellow-600'
    case 'difficult': return 'text-red-600'
    default: return 'text-gray-600'
  }
}

// Data validation
export function validateBaby(baby: Partial<Baby>): string[] {
  const errors: string[] = []
  
  if (!baby.name || baby.name.trim().length === 0) {
    errors.push('Le nom est requis')
  }
  
  if (!baby.birthDate || isNaN(ensureDate(baby.birthDate).getTime())) {
    errors.push('Date de naissance invalide')
  }
  
  if (!baby.weight || baby.weight <= 0) {
    errors.push('Le poids doit être positif')
  }
  
  if (!baby.height || baby.height <= 0) {
    errors.push('La taille doit être positive')
  }
  
  return errors
}

// Local storage helpers
export function safeLocalStorage() {
  if (typeof window === 'undefined') return null
  
  try {
    return window.localStorage
  } catch {
    return null
  }
}

// Random ID generator
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Array utilities
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const group = String(item[key])
    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

export function sortByDate<T>(array: T[], dateKey: keyof T, descending = true): T[] {
  return [...array].sort((a, b) => {
    const dateA = ensureDate(a[dateKey] as any).getTime()
    const dateB = ensureDate(b[dateKey] as any).getTime()
    return descending ? dateB - dateA : dateA - dateB
  })
}

// UI utilities
export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const compareDate = ensureDate(date)
  const diffMinutes = Math.floor((now.getTime() - compareDate.getTime()) / (1000 * 60))
  
  if (diffMinutes < 1) return 'À l\'instant'
  if (diffMinutes < 60) return `Il y a ${diffMinutes}min`
  
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `Il y a ${diffHours}h`
  
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`
  
  return compareDate.toLocaleDateString('fr-FR')
}

// ✅ AJOUTER ces fonctions dans votre src/lib/utils.ts existant

// Fonctions de gestion des dates pour éviter les erreurs d'hydratation

export function formatTimeFromDate(date: any, options = { hour: '2-digit', minute: '2-digit' } as const): string {
  const validDate = ensureDate(date)
  if (!validDate) return '--:--'
  return validDate.toLocaleTimeString('fr-FR', options)
}

// ✅ Fonction pour convertir n'importe quelle valeur de date de façon sécurisée
export function safeFormatRelativeTime(dateValue: any): string {
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

// ✅ Version sécurisée de formatRelativeTime si elle existe déjà
export function formatRelativeTimeSafe(dateValue: any): string {
  return safeFormatRelativeTime(dateValue)
}

export function formatUserRole(role: string): string {
  switch (role) {
    case 'mother': return 'Maman'
    case 'father': return 'Papa'
    case 'guardian': return 'Tuteur/Tutrice'
    case 'caregiver': return 'Garde d\'enfant'
    case 'grandparent': return 'Grand-parent'
    case 'other': return 'Autre'
    default: return role
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/
  return phoneRegex.test(phone)
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function calculateDataUsage(data: any): number {
  return new Blob([JSON.stringify(data)]).size
}