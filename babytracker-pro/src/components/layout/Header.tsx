// src/components/layout/Header.tsx - Version mise à jour avec vraies notifications
'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Bell, ChevronDown, Settings, User, LogOut, Baby, HelpCircle, X } from 'lucide-react'
import { useBabyTrackerStore } from '@/lib/store'
import Link from 'next/link'
import { ThemeSwitch } from '@/components/ui/ThemeSwitch'

interface HeaderProps {
  currentPage: string
  className?: string
}

// ✅ ClientOnly pour éviter hydratation
const ClientOnly = ({ children, fallback = null }: { children: React.ReactNode, fallback?: React.ReactNode }) => {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  return isClient ? <>{children}</> : <>{fallback}</>
}

// ✅ Helper function locale
const calculateBabyAge = (birthDate: Date) => {
  const now = new Date()
  const birth = new Date(birthDate)
  const ageInWeeks = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 7))
  const ageInMonths = Math.floor(ageInWeeks / 4.33)
  return ageInMonths
}

// ✅ Composant Panel de notifications
const NotificationPanel = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    removeNotification,
    clearOldNotifications 
  } = useBabyTrackerStore()

  const handleNotificationClick = useCallback((notification: any) => {
    markAsRead(notification.id)
    if (notification.actionUrl) {
      // Navigation sera gérée par le Link
    }
  }, [markAsRead])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-50 dark:bg-red-950/20 dark:border-red-400'
      case 'high': return 'border-orange-500 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-400'
      case 'medium': return 'border-primary-500 bg-primary-50 dark:bg-primary-950/20 dark:border-primary-400'
      case 'low': return 'border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600'
      default: return 'border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600'
    }
  }

  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}j`
    if (hours > 0) return `${hours}h`
    if (minutes > 0) return `${minutes}min`
    return 'Maintenant'
  }

  if (!isOpen) return null

  return (
    <div className="absolute right-0 top-16 w-80 max-h-96 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden animate-slide-down">
      {/* Header du panel */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80">
        <div className="flex items-center justify-between">
          <h3 className="font-bold dark:text-gray-200">Notifications ({notifications.length})</h3>
          <div className="flex items-center space-x-2">
            {notifications.some(n => !n.isRead) && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                Tout lire
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 " />
            </button>
          </div>
        </div>
      </div>

      {/* Liste des notifications */}
      <div className="max-h-64 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center ">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium dark:text-gray-400">Aucune notification</p>
            <p className="text-sm dark:text-gray-500">Vous êtes à jour ! 🎉</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {notifications.slice(0, 10).map((notification) => {
              const NotificationContent = notification.actionUrl ? Link : 'div'
              const contentProps = notification.actionUrl 
                ? { href: notification.actionUrl as any, onClick: () => handleNotificationClick(notification) }
                : { onClick: () => handleNotificationClick(notification) }

              return (
                <NotificationContent
                  key={notification.id}
                  {...(contentProps as any)}
                  className={`block p-3 rounded-2xl border-l-4 transition-all duration-300 hover:scale-102 cursor-pointer ${
                    getPriorityColor(notification.priority)
                  } ${!notification.isRead ? 'font-medium' : 'opacity-75'}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-lg mt-0.5">{notification.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-sm font-medium truncate ${
                          notification.priority === 'urgent' ? 'text-red-800' :
                          notification.priority === 'high' ? 'text-orange-800' :
                          notification.priority === 'medium' ? 'text-primary-800' :
                          'text-gray-800'
                        }`}>
                          {notification.title}
                        </h4>
                        <span className="text-xs  ml-2">
                          {getTimeAgo(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs  mt-1">
                        {notification.message}
                      </p>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        removeNotification(notification.id)
                      }}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </NotificationContent>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer avec actions */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80">
          <div className="flex justify-between text-xs">
            <button
              onClick={clearOldNotifications}
              className="text-gray-500 hover:text-gray-700"
            >
              Effacer lues
            </button>
            <span className="text-gray-500">
              {notifications.filter(n => !n.isRead).length} non lues
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Header({ currentPage, className = '' }: HeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  
  const { 
    currentBaby, 
    notifications, 
    unreadCount,
    generateNotifications,
    getUnreadCount,
    userProfile
  } = useBabyTrackerStore()

  // ✅ Générer les notifications à intervalles réguliers
  useEffect(() => {
    // Générer au montage
    generateNotifications()
    
    // Puis toutes les 5 minutes
    const interval = setInterval(() => {
      generateNotifications()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [generateNotifications])

  // ✅ Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (isProfileOpen && !target.closest('[data-profile-dropdown]')) {
        setIsProfileOpen(false)
      }
      if (isNotificationOpen && !target.closest('[data-notification-panel]')) {
        setIsNotificationOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isProfileOpen, isNotificationOpen])

  // ✅ Optimized handlers
  const handleNotificationClick = useCallback(() => {
    setIsNotificationOpen(prev => !prev)
    setIsProfileOpen(false) // Fermer l'autre dropdown
  }, [])

  const handleProfileToggle = useCallback(() => {
    setIsProfileOpen(prev => !prev)
    setIsNotificationOpen(false) // Fermer l'autre dropdown
  }, [])

  const handleProfileAction = useCallback((action: string) => {
    setIsProfileOpen(false)
    // TODO: Implémenter les actions (profil, paramètres, déconnexion)
    console.log(`Action: ${action}`)
  }, [])

  // ✅ User data
  const userData = {
    name: userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'Utilisateur',
    avatar: userProfile?.avatar || '👩‍🦰',
    babyName: currentBaby?.name || 'Bébé',
    babyAge: ''
  }

  return (
    <header className={`sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 theme-forest:bg-forest-600/90 theme-pistacchio:bg-forest-600/90 border-b border-white/20 dark:border-gray-700/50 theme-forest:border-mint-400/10 theme-pistacchio:border-mint-400/10 shadow-lg ${className}`}>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* ✅ Logo + Page Title + Theme Switch */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-110">
              <Baby className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-400 dark:to-primary-500 bg-clip-text text-transparent">
                  {currentPage}
                </h1>
                <ThemeSwitch />
              </div>
              {currentBaby && (
                <ClientOnly fallback={<p className="text-sm text-gray-400">{userData.babyName}</p>}>
                  <p className="text-sm  dark:text-gray-400">
                    {userData.babyName} • {calculateBabyAge(currentBaby.birthDate)} mois
                  </p>
                </ClientOnly>
              )}
            </div>
          </div>

          {/* ✅ Right Side: Notifications + Avatar */}
          <div className="flex items-center space-x-3">
            {/* Notifications Bell avec vraies données */}
            <div className="relative" data-notification-panel>
              <ClientOnly fallback={
                <button className="relative p-2 hover:bg-primary-50 rounded-xl transition-all duration-300 transform hover:scale-110">
                  <Bell className="w-6 h-6  dark:text-gray-400" />
                </button>
              }>
                <button 
                  onClick={handleNotificationClick}
                  className="relative p-2 hover:bg-primary-50 rounded-xl transition-all duration-300 transform hover:scale-110"
                  aria-label="Notifications"
                >
                  <Bell className="w-6 h-6  dark:text-gray-400" />
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
                      <span className="text-xs font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    </div>
                  )}
                </button>

                {/* Panel de notifications */}
                <NotificationPanel 
                  isOpen={isNotificationOpen} 
                  onClose={() => setIsNotificationOpen(false)} 
                />
              </ClientOnly>
            </div>

            {/* User Profile Dropdown */}
            <div className="relative" data-profile-dropdown>
              <button 
                onClick={handleProfileToggle}
                className="flex items-center space-x-2 p-2 hover:bg-primary-50 rounded-2xl transition-all duration-300 transform hover:scale-105"
                aria-label="Menu utilisateur"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-primary-400 to-primary-500 rounded-2xl flex items-center justify-center text-white text-lg shadow-lg">
                  {userData.avatar}
                </div>
                <ChevronDown className={`w-4 h-4  dark:text-gray-400 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* ✅ Profile Dropdown Menu */}
              <ClientOnly>
                {isProfileOpen && (
                  <div className="absolute right-0 top-16 w-64 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-6 animate-slide-down">
                    {/* User Info */}
                    <div className="text-center mb-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-primary-400 to-primary-500 rounded-3xl flex items-center justify-center text-white text-2xl mx-auto mb-3 shadow-lg">
                        {userData.avatar}
                      </div>
                      <h3 className="font-bold dark:text-gray-200">{userData.name}</h3>
                      <ClientOnly fallback={<p className="text-sm text-gray-400">Parent</p>}>
                        <p className="text-sm  dark:text-gray-400">
                          {currentBaby ? `${userProfile?.role === 'mother' ? 'Maman' : userProfile?.role === 'father' ? 'Papa' : userProfile?.role === 'guardian' ? 'Tuteur/Tutrice' : userProfile?.role === 'grandparent' ? 'Grand-parent' : 'Parent'} de ${userData.babyName}` : 'Parent'}
                        </p>
                      </ClientOnly>
                    </div>
                    
                    {/* Menu Actions */}
                    <div className="space-y-2">
<Link 
  href="/profile"
  onClick={() => {
    handleProfileAction('profile')
    setIsProfileOpen(false)
  }}
  className="w-full flex items-center space-x-3 p-3 hover:bg-primary-50 rounded-2xl transition-all duration-300 text-left"
>
  <User className="w-5 h-5 " />
  <span className="text-gray-700">Mon Profil</span>
</Link>
                      <button 
                        onClick={() => handleProfileAction('settings')}
                        className="w-full flex items-center space-x-3 p-3 hover:bg-primary-50 rounded-2xl transition-all duration-300 text-left"
                      >
                        <Settings className="w-5 h-5 " />
                        <span className="text-gray-700">Paramètres</span>
                      </button>
                      
                      <button 
                        onClick={() => handleProfileAction('help')}
                        className="w-full flex items-center space-x-3 p-3 hover:bg-primary-50 rounded-2xl transition-all duration-300 text-left"
                      >
                        <HelpCircle className="w-5 h-5 " />
                        <span className="text-gray-700">Aide</span>
                      </button>
                      
                      <hr className="border-gray-200 my-2" />
                      
                      <button 
                        onClick={() => handleProfileAction('logout')}
                        className="w-full flex items-center space-x-3 p-3 hover:bg-red-50 rounded-2xl transition-all duration-300 text-left"
                      >
                        <LogOut className="w-5 h-5 text-red-500" />
                        <span className="text-red-600">Déconnexion</span>
                      </button>
                    </div>
                  </div>
                )}
              </ClientOnly>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}