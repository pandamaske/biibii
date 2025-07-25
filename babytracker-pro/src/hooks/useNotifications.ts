// src/hooks/useNotifications.ts - Hook personnalisé pour les notifications
import { useCallback, useEffect } from 'react'
import { useBabyTrackerStore } from '@/lib/store'
// import { NotificationService } from '@/lib/notificationService'

export const useNotifications = () => {
  const {
    notifications,
    unreadCount,
    notificationSettings,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearOldNotifications,
    updateNotificationSettings,
    generateNotifications,
    currentBaby,
    getLastFeeding,
    getTodaySleeps,
    getTotalDailySleep
  } = useBabyTrackerStore()

  // ✅ Générer une notification manuelle
  const createNotification = useCallback((
    type: 'feeding' | 'sleep' | 'diaper' | 'health' | 'milestone' | 'reminder',
    title: string,
    message: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
    actionUrl?: string,
    icon?: string
  ) => {
    const notification = {
      id: `manual-${Date.now()}`,
      type,
      title,
      message,
      priority,
      isRead: false,
      createdAt: new Date(),
      actionUrl,
      icon,
      babyId: currentBaby?.id
    }
    addNotification(notification)
  }, [addNotification, currentBaby])

  // ✅ Créer des notifications spécifiques
  const notifyFeedingTime = useCallback(() => {
    createNotification(
      'feeding',
      'Heure du repas !',
      `Il est temps de nourrir ${currentBaby?.name}`,
      'high',
      '/feeding',
      '🍼'
    )
  }, [createNotification, currentBaby])

  const notifySleepTime = useCallback(() => {
    createNotification(
      'sleep',
      'Heure de la sieste',
      `${currentBaby?.name} semble fatigué(e)`,
      'medium',
      '/sleep',
      '😴'
    )
  }, [createNotification, currentBaby])

  const notifyDiaperChange = useCallback(() => {
    createNotification(
      'diaper',
      'Change de couche',
      'Pensez à vérifier la couche',
      'low',
      undefined,
      '👶'
    )
  }, [createNotification])

  const notifyMilestone = useCallback((milestone: string) => {
    createNotification(
      'milestone',
      'Nouveau milestone !',
      milestone,
      'low',
      '/growth',
      '🎉'
    )
  }, [createNotification])

  // ✅ Auto-génération des notifications
  useEffect(() => {
    if (!currentBaby) return

    // Générer immédiatement
    generateNotifications()

    // Puis à intervalles réguliers
    const interval = setInterval(() => {
      generateNotifications()
    }, 5 * 60 * 1000) // Toutes les 5 minutes

    return () => clearInterval(interval)
  }, [currentBaby, generateNotifications])

  // ✅ Nettoyage automatique des anciennes notifications
  useEffect(() => {
    const cleanup = setInterval(() => {
      clearOldNotifications()
    }, 60 * 60 * 1000) // Toutes les heures

    return () => clearInterval(cleanup)
  }, [clearOldNotifications])

  return {
    // États
    notifications,
    unreadCount,
    settings: notificationSettings,
    
    // Actions de base
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearOldNotifications,
    updateSettings: updateNotificationSettings,
    
    // Création de notifications
    createNotification,
    notifyFeedingTime,
    notifySleepTime,
    notifyDiaperChange,
    notifyMilestone,
    
    // Génération automatique
    generateNotifications
  }
}