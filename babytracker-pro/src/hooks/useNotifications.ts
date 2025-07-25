// src/hooks/useNotifications.ts - Hook personnalisé pour les notifications
import { useCallback, useEffect } from 'react'
import { useBabyTrackerStore } from '@/lib/store'
import { NotificationService } from '@/lib/notificationService'

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

// src/components/NotificationTriggers.tsx - Composant pour déclencher des notifications depuis l'app
import React from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import { Bell, Milk, Moon, Baby, Trophy } from 'lucide-react'

export const NotificationTriggers = () => {
  const { 
    notifyFeedingTime, 
    notifySleepTime, 
    notifyDiaperChange, 
    notifyMilestone,
    createNotification 
  } = useNotifications()

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-800">Créer une notification</h3>
      
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={notifyFeedingTime}
          className="flex items-center space-x-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
        >
          <Milk className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Repas</span>
        </button>
        
        <button
          onClick={notifySleepTime}
          className="flex items-center space-x-2 p-3 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
        >
          <Moon className="w-5 h-5 text-purple-600" />
          <span className="text-sm font-medium text-purple-800">Sieste</span>
        </button>
        
        <button
          onClick={notifyDiaperChange}
          className="flex items-center space-x-2 p-3 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors"
        >
          <Baby className="w-5 h-5 text-primary-600" />
          <span className="text-sm font-medium text-primary-800 dark:text-primary-200">Couche</span>
        </button>
        
        <button
          onClick={() => notifyMilestone('Premier sourire ! 😊')}
          className="flex items-center space-x-2 p-3 bg-yellow-50 hover:bg-yellow-100 rounded-xl transition-colors"
        >
          <Trophy className="w-5 h-5 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-800">Milestone</span>
        </button>
      </div>
      
      {/* Notification personnalisée */}
      <button
        onClick={() => createNotification(
          'reminder',
          'Test de notification',
          'Ceci est une notification de test avec un message plus long pour voir comment ça s\'affiche',
          'medium',
          '/',
          '🧪'
        )}
        className="w-full p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-sm font-medium text-gray-700"
      >
        Notification de test
      </button>
    </div>
  )
}

// src/components/NotificationSettings.tsx - Paramètres des notifications
import React from 'react'
import { useNotifications } from '@/hooks/useNotifications'

export const NotificationSettings = () => {
  const { settings, updateSettings } = useNotifications()

  return (
    <div className="space-y-6 p-6 bg-white rounded-2xl border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800">Paramètres des notifications</h3>
      
      {/* Alertes */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-700">Types d'alertes</h4>
        
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={settings.enableFeedingAlerts}
            onChange={(e) => updateSettings({ enableFeedingAlerts: e.target.checked })}
            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700">Alertes de repas</span>
        </label>
        
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={settings.enableSleepAlerts}
            onChange={(e) => updateSettings({ enableSleepAlerts: e.target.checked })}
            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700">Alertes de sommeil</span>
        </label>
        
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={settings.enableMilestoneReminders}
            onChange={(e) => updateSettings({ enableMilestoneReminders: e.target.checked })}
            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700">Rappels de milestones</span>
        </label>
        
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={settings.enableHealthReminders}
            onChange={(e) => updateSettings({ enableHealthReminders: e.target.checked })}
            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700">Rappels santé</span>
        </label>
      </div>
      
      {/* Intervalle repas */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Intervalle entre repas (minutes)
        </label>
        <input
          type="number"
          value={settings.feedingIntervalMinutes}
          onChange={(e) => updateSettings({ feedingIntervalMinutes: parseInt(e.target.value) || 180 })}
          min="60"
          max="360"
          step="30"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
      
      {/* Heures de silence */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-700">Heures de silence</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Début</label>
            <input
              type="time"
              value={settings.quietHoursStart}
              onChange={(e) => updateSettings({ quietHoursStart: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 mb-1">Fin</label>
            <input
              type="time"
              value={settings.quietHoursEnd}
              onChange={(e) => updateSettings({ quietHoursEnd: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
        
        <p className="text-xs text-gray-500">
          Aucune notification ne sera envoyée pendant ces heures
        </p>
      </div>
    </div>
  )
}