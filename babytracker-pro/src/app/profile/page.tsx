'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  User, Baby, Settings, Bell, Users, Shield, Download, 
  Camera, Edit2, Save, X, Plus, Trash2, Phone, Mail,
  Globe, Palette, Volume2, Moon, Sun, Smartphone, 
  Heart, Calendar, Weight, Ruler, Thermometer, 
  ChevronRight, ChevronDown, AlertTriangle, CheckCircle2,
  Clock, MapPin, Stethoscope, FileText, Eye, EyeOff,
  Upload, RotateCcw, Zap, Star, Award, Target
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { useBabyTrackerStore } from '@/lib/store'
import { useTheme } from '@/contexts/ThemeContext'
import { formatAge, getAgeInWeeks, ensureDate } from '@/lib/utils'


// Enhanced user profile types
interface UserProfile {
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

interface AppSettings {
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

interface FamilyMember {
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

export default function ProfilePage() {
  // States
  const [activeSection, setActiveSection] = useState<string>('profile')
  const [isEditing, setIsEditing] = useState(false)
  // ❌ REMOVE: const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  // ❌ REMOVE: const [appSettings, setAppSettings] = useState<AppSettings | null>(null)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)

  // ✅ CHANGED: Get profile data from store
  const { 
    currentBaby, 
    babies, 
    initializeData, 
    updateBaby,
    userProfile,
    appSettings,
    updateUserProfile,
    updateAppSettings,
    initializeProfile,
    isLoading
  } = useBabyTrackerStore()

  useEffect(() => {
    // Get email from localStorage (set by homepage)
    const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('user-email') : null
    
    if (storedEmail) {
      console.log('Profile page loading for email:', storedEmail)
      initializeProfile(storedEmail)
    } else {
      console.log('No email found, redirecting to homepage')
      window.location.href = '/'
      return
    }
    
    initializeData()
  }, [initializeData, initializeProfile])

 useEffect(() => {
    if (familyMembers.length === 0) {
      const sampleFamily: FamilyMember[] = [
        {
          id: 'family-1',
          email: 'pierre.martin@email.com',
          name: 'Pierre Martin',
          role: 'partner',
          permissions: {
            viewData: true,
            addEntries: true,
            editEntries: true,
            manageSettings: false
          },
          inviteStatus: 'accepted',
          joinedDate: new Date('2024-01-20'),
          isActive: true
        }
      ]
      setFamilyMembers(sampleFamily)
    }
  }, [familyMembers.length])

  // Statistics from current data
  const userStats = useMemo(() => {
    if (!currentBaby) return null

    const birthDate = ensureDate(currentBaby.birthDate)
    const daysSinceBirth = birthDate ? Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24)) : 0
    // These would come from your actual store data
    const totalEntries = 156 // feedingEntries + sleepEntries + diaperEntries
    const streakDays = 12 // consecutive days of tracking
    const completionRate = 89 // percentage of daily goals met

    return {
      daysSinceBirth,
      totalEntries,
      streakDays,
      completionRate
    }
  }, [currentBaby])

  // Available avatars
  const avatarOptions = [
    '👩‍🦰', '👨‍🦰', '👩', '👨', '👩‍🦱', '👨‍🦱', '👩‍🦳', '👨‍🦳',
    '👩‍🦲', '👨‍🦲', '🧑', '👵', '👴', '👶', '🤱', '🤰'
  ]

  // Color scheme options
  const colorSchemes = [
    { value: 'green', name: 'Vert Nature', primary: 'bg-green-500', secondary: 'bg-green-100' },
    { value: 'blue', name: 'Bleu Ocean', primary: 'bg-blue-500', secondary: 'bg-blue-100' },
    { value: 'purple', name: 'Violet Doux', primary: 'bg-purple-500', secondary: 'bg-purple-100' },
    { value: 'pink', name: 'Rose Tendre', primary: 'bg-pink-500', secondary: 'bg-pink-100' },
    { value: 'orange', name: 'Orange Chaleureux', primary: 'bg-orange-500', secondary: 'bg-orange-100' },
    { value: 'pistacchio', name: 'Pistacchio Forêt 🌲', primary: 'bg-emerald-600', secondary: 'bg-emerald-100' }
  ]

  // Menu sections
  const menuSections = [
    {
      id: 'profile',
      title: 'Profil Personnel',
      icon: User,
      description: 'Informations personnelles et contact'
    },
    {
      id: 'baby',
      title: 'Profil Bébé',
      icon: Baby,
      description: 'Informations sur votre bébé'
    },
    {
      id: 'settings',
      title: 'Préférences',
      icon: Settings,
      description: 'Thème, unités, langue'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      description: 'Rappels et alertes'
    },
    {
      id: 'family',
      title: 'Famille',
      icon: Users,
      description: 'Partage et permissions'
    },
    {
      id: 'privacy',
      title: 'Confidentialité',
      icon: Shield,
      description: 'Sécurité et sauvegarde'
    }
  ]

  if (isLoading || (!userProfile && isLoading)) {
    return (
      <AppLayout 
        className="bg-gradient-to-b from-primary-500 to-primary-400"
        currentPage="Mon Profil"
        showHeader={true}
      >
        <div className="p-6 text-center">
          <div className="glass-card rounded-3xl p-8 shadow-large">
            <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement du profil...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  // If not loading but no profile found, show error or redirect
  if (!userProfile || !currentBaby || !appSettings) {
    return (
      <AppLayout 
        className="bg-gradient-to-b from-primary-500 to-primary-400"
        currentPage="Mon Profil"
        showHeader={true}
      >
        <div className="p-6 text-center">
          <div className="glass-card rounded-3xl p-8 shadow-large">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <p className="text-gray-600 mb-4">Profil non trouvé</p>
            <p className="text-gray-500 text-sm">Veuillez vérifier votre connexion et réessayer</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout 
      className="bg-gradient-to-b from-primary-500 to-primary-400"
      currentPage="Mon Profil"
      showHeader={true}
    >
      <div className="p-6 pb-24 space-y-6 animate-fade-in">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-500 rounded-3xl p-6 text-white shadow-large">
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center text-4xl">
                {userProfile.avatar}
              </div>
              {userProfile.isEmailVerified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
            
                Bonjour {userProfile.firstName} ! 👋
          
              <p className="text-amber-100 mb-2">
                {userProfile.role === 'mother' ? 'Maman' : 
                 userProfile.role === 'father' ? 'Papa' : 
                 userProfile.role} de {currentBaby.name}
              </p>
              <div className="flex items-center space-x-2 text-sm text-amber-100">
                <Calendar className="w-4 h-4" />
                <span>Membre depuis {ensureDate(userProfile.createdAt)?.toLocaleDateString('fr-FR') || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          {userStats && (
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
                <div className="text-2xl font-bold">{userStats.daysSinceBirth}</div>
                <div className="text-xs text-amber-100">Jours</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
                <div className="text-2xl font-bold">{userStats.totalEntries}</div>
                <div className="text-xs text-amber-100">Entrées</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
                <div className="text-2xl font-bold">{userStats.streakDays}</div>
                <div className="text-xs text-amber-100">Série</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
                <div className="text-2xl font-bold">{userStats.completionRate}%</div>
                <div className="text-xs text-amber-100">Objectifs</div>
              </div>
            </div>
          )}
        </div>

        {/* Menu Sections */}
        <div className="space-y-3">
          {menuSections.map(section => {
            const Icon = section.icon
            const isActive = activeSection === section.id
            
            return (
              <div key={section.id}>
                <button
                  onClick={() => setActiveSection(isActive ? '' : section.id)}
                  className={`w-full glass-card backdrop-blur-sm rounded-2xl p-4 shadow-medium transition-all hover-lift ${
                    isActive ? 'border-2 border-amber-300 bg-amber-50/50' : 'border border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        isActive ? 'bg-amber-500 text-white' : 'bg-gray-100 '
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold">{section.title}</h3>
                        <p className="text-sm text-gray-400">{section.description}</p>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5  transition-transform ${
                      isActive ? 'rotate-180' : ''
                    }`} />
                  </div>
                </button>

                {/* Section Content */}
                {isActive && (
                  <div className="mt-3 animate-slide-down">
                       {section.id === 'profile' && (
                      <ProfileSection 
                        userProfile={userProfile}
                        updateUserProfile={updateUserProfile}
                        avatarOptions={avatarOptions}
                        isEditing={isEditing}
                        setIsEditing={setIsEditing}
                      />
                    )}
                    
 
                    
                    {section.id === 'baby' && (
                      <BabySection
                        baby={currentBaby}
                        babies={babies}
                        onUpdateBaby={updateBaby}
                      />
                    )}

                    {section.id === 'settings' && (
                      <SettingsSection 
                        settings={appSettings}
                        updateSettings={updateAppSettings}
                        colorSchemes={colorSchemes}
                      />
                    )}
                    
                    {section.id === 'notifications' && (
                      <NotificationsSection 
                        settings={appSettings}
                        updateSettings={updateAppSettings}
                      />
                    )}
                    
                    {section.id === 'family' && (
                      <FamilySection 
                        familyMembers={familyMembers}
                        setFamilyMembers={setFamilyMembers}
                        showInviteModal={showInviteModal}
                        setShowInviteModal={setShowInviteModal}
                      />
                    )}
                    
                    {section.id === 'privacy' && (
                      <PrivacySection 
                        settings={appSettings}
                        setSettings={updateAppSettings}
                        showDeleteConfirm={showDeleteConfirm}
                        setShowDeleteConfirm={setShowDeleteConfirm}
                      />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Achievement Section */}
        <div className="glass-card backdrop-blur-sm rounded-3xl p-6 shadow-large">
          <h3 className="font-bold mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2 text-yellow-500" />
            Vos accomplissements
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-yellow-50 rounded-2xl p-4 text-center">
              <div className="text-3xl mb-2">🏆</div>
              <div className="font-bold text-yellow-700">Suivi Régulier</div>
              <div className="text-xs text-yellow-600">12 jours consécutifs</div>
            </div>
            
            <div className="bg-blue-50 rounded-2xl p-4 text-center">
              <div className="text-3xl mb-2">📊</div>
              <div className="font-bold text-blue-700">Data Champion</div>
              <div className="text-xs text-primary-600">Plus de 150 entrées</div>
            </div>
            
            <div className="bg-green-50 rounded-2xl p-4 text-center">
              <div className="text-3xl mb-2">💪</div>
              <div className="font-bold text-green-700">Super Parent</div>
              <div className="text-xs text-green-600">89% d'objectifs atteints</div>
            </div>
            
            <div className="bg-amber-50 rounded-2xl p-4 text-center border-2 border-dashed border-amber-300">
              <div className="text-3xl mb-2">🔒</div>
              <div className="font-bold text-amber-700">Prochaine</div>
              <div className="text-xs text-amber-600">Semaine parfaite</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4 rounded-2xl font-medium shadow-large flex items-center justify-center space-x-2 hover:scale-105 transition-transform">
            <Download className="w-5 h-5" />
            <span>Exporter mes données</span>
          </button>
          
          <button className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-2xl font-medium shadow-large flex items-center justify-center space-x-2 hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
            <span>Inviter famille</span>
          </button>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteModal 
          onClose={() => setShowInviteModal(false)}
          onInvite={(email, role) => {
            // Handle invite logic
            setShowInviteModal(false)
          }}
        />
      )}
    </AppLayout>
  )
}

// Profile Section Component
function ProfileSection({ userProfile, updateUserProfile, avatarOptions, isEditing, setIsEditing }: {
  userProfile: UserProfile | null
  updateUserProfile: (profile: Partial<UserProfile>) => void
  avatarOptions: string[]
  isEditing: boolean
  setIsEditing: (editing: boolean) => void
}) {
  const [editForm, setEditForm] = useState(userProfile || {
    id: 'user-1',
    firstName: '',
    lastName: '',
    email: '',
    avatar: '👩‍🦰',
    role: 'mother' as const,
    preferredName: '',
    timezone: 'Europe/Paris',
    language: 'fr' as const,
    createdAt: new Date(),
    isEmailVerified: false,
    isPhoneVerified: false
  })

  // Add this useEffect
  useEffect(() => {
    if (userProfile) {
      setEditForm(userProfile)
    }
  }, [userProfile])

  const handleSave = () => {
    console.log('Saving profile:', editForm)
    updateUserProfile(editForm)
    console.log('Profile saved to store')
    setIsEditing(false)
  }

  // Add safety check
  if (!userProfile) {
    return (
      <div className="glass-card backdrop-blur-sm rounded-2xl p-6 shadow-medium">
        <div className="text-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    )
  }


  return (
    <div className="glass-card backdrop-blur-sm rounded-2xl p-6 shadow-medium">
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-semibold">Informations personnelles</h4>
        <button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors"
        >
          {isEditing ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
          <span>{isEditing ? 'Sauvegarder' : 'Modifier'}</span>
        </button>
      </div>

      {isEditing ? (
        <div className="space-y-4">
          {/* Avatar Selection */}
          <div>
            <label className="block text-sm font-medium  mb-2">Avatar</label>
            <div className="grid grid-cols-8 gap-2">
              {avatarOptions.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => setEditForm(prev => ({ ...prev, avatar: emoji }))}
                  className={`w-12 h-12 rounded-xl text-2xl transition-all ${
                    editForm.avatar === emoji 
                      ? 'bg-amber-100 border-2 border-amber-500 scale-110' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium  mb-2">Prénom</label>
              <input
                type="text"
                value={editForm.firstName}
                onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium  mb-2">Nom</label>
              <input
                type="text"
                value={editForm.lastName}
                onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <label className="block text-sm font-medium  mb-2">Email</label>
            <input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium  mb-2">Téléphone</label>
            <input
              type="tel"
              value={editForm.phone || ''}
              onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium  mb-2">Rôle</label>
            <select
              value={editForm.role}
              onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value as any }))}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none"
            >
              <option value="mother">Maman</option>
              <option value="father">Papa</option>
              <option value="guardian">Tuteur/Tutrice</option>
              <option value="caregiver">Garde d'enfant</option>
              <option value="grandparent">Grand-parent</option>
              <option value="other">Autre</option>
            </select>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Display Mode */}
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
            <div className="text-4xl">{userProfile.avatar}</div>
            <div>
              <h5 className="font-medium text-gray-800">
                {userProfile.firstName} {userProfile.lastName}
              </h5>
              <p className="text-sm  capitalize">
                {userProfile.role === 'mother' ? 'Maman' : 
                 userProfile.role === 'father' ? 'Papa' : 
                 userProfile.role}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 " />
              <span className="text-gray-700">{userProfile.email}</span>
              {userProfile.isEmailVerified && (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              )}
            </div>
            
            {userProfile.phone && (
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 " />
                <span className="text-gray-700">{userProfile.phone}</span>
                {!userProfile.isPhoneVerified && (
                  <button className="text-xs text-primary-600 hover:underline">Vérifier</button>
                )}
              </div>
            )}

            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 " />
              <span className="text-gray-700 font-mono text-sm">{userProfile.id}</span>
              <span className="text-xs ">ID utilisateur</span>
            </div>

            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
              <div className="text-xs font-medium text-blue-700 mb-1">🔑 Identifiant principal</div>
              <div className="text-sm text-primary-600">
                Votre email <strong>{userProfile.email}</strong> est votre identifiant unique. 
                Changer votre email récupérera automatiquement vos données.
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          {userProfile.emergencyContact && (
            <div className="mt-6 p-4 bg-red-50 rounded-xl border-2 border-red-200">
              <h5 className="font-medium text-red-700 mb-2 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Contact d'urgence
              </h5>
              <div className="text-sm text-red-600">
                <p>{userProfile.emergencyContact.name} ({userProfile.emergencyContact.relationship})</p>
                <p>{userProfile.emergencyContact.phone}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Baby Section Component
function BabySection({ baby, babies, onUpdateBaby }: {
  baby: any
  babies: any[]
  onUpdateBaby: (baby: any) => void
}) {
 const [isEditingBaby, setIsEditingBaby] = useState(false)
  const [babyForm, setBabyForm] = useState(() => ({
    ...baby,
    birthDate: ensureDate(baby?.birthDate) || new Date()
  }))

  // ✅ ADD: Update form when baby prop changes
  useEffect(() => {
    if (baby) {
      setBabyForm({
        ...baby,
        birthDate: ensureDate(baby.birthDate) || new Date()
      })
    }
  }, [baby])

  // ✅ ADD: Safety check for null baby
  if (!baby) {
    return (
      <div className="glass-card backdrop-blur-sm rounded-2xl p-6 shadow-medium">
        <div className="text-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du profil bébé...</p>
        </div>
      </div>
    )
  }
  
  const handleSaveBaby = () => {
    console.log('Saving baby:', babyForm) // 🔍 Debug log
    onUpdateBaby(babyForm)
    console.log('Baby saved to store') // 🔍 Debug log
    setIsEditingBaby(false)
  }

  return (
    <div className="glass-card backdrop-blur-sm rounded-2xl p-6 shadow-medium">
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-semibold">Profil de {baby.name}</h4>
        <button
          onClick={() => isEditingBaby ? handleSaveBaby() : setIsEditingBaby(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors"
        >
          {isEditingBaby ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
          <span>{isEditingBaby ? 'Sauvegarder' : 'Modifier'}</span>
        </button>
      </div>

      {isEditingBaby ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium  mb-2">Nom du bébé</label>
            <input
              type="text"
              value={babyForm.name}
              onChange={(e) => setBabyForm((prev: any) => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium  mb-2">Date de naissance</label>
            <input
              type="date"
              value={ensureDate(babyForm.birthDate)?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : new Date()
                setBabyForm((prev: any) => ({ ...prev, birthDate: isNaN(date.getTime()) ? new Date() : date }))
              }}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium  mb-2">Poids actuel (g)</label>
              <input
                type="number"
                value={babyForm.weight}
                onChange={(e) => setBabyForm((prev: any) => ({ ...prev, weight: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium  mb-2">Taille actuelle (cm)</label>
              <input
                type="number"
                value={babyForm.height}
                onChange={(e) => setBabyForm((prev: any) => ({ ...prev, height: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium  mb-2">Genre</label>
            <select
              value={babyForm.gender}
              onChange={(e) => setBabyForm((prev: any) => ({ ...prev, gender: e.target.value }))}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none"
            >
              <option value="male">Garçon</option>
              <option value="female">Fille</option>
              <option value="other">Autre</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium  mb-2">Avatar</label>
            <div className="grid grid-cols-8 gap-2">
              {['👶', '🍼', '🧸', '🎈', '⭐', '🌙', '☀️', '🌈', '🦄', '🐣', '🐻', '🦁', '🐰', '🐸', '🐯', '🐵'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => setBabyForm((prev: any) => ({ ...prev, avatar: emoji }))}
                  className={`w-12 h-12 rounded-xl text-2xl transition-all ${
                    babyForm.avatar === emoji 
                      ? 'bg-amber-100 border-2 border-amber-500 scale-110' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Baby Info Display */}
          <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-pink-50 to-blue-50 rounded-xl">
            <div className="text-4xl">{baby.avatar}</div>
            <div>
              <h5 className="font-medium text-gray-800 text-lg">{baby.name}</h5>
              <p className="text-sm text-gray-400">{formatAge(baby.birthDate)}</p>
              <p className="text-xs ">
                Né(e) le {ensureDate(baby.birthDate)?.toLocaleDateString('fr-FR') || 'N/A'}
              </p>
              <div className="flex items-center space-x-3 mt-2">
                <Baby className="w-4 h-4 " />
                <span className="text-gray-700 font-mono text-xs">{baby.id}</span>
                <span className="text-xs ">ID bébé</span>
              </div>
            </div>
          </div>

          {/* Current Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <Weight className="w-6 h-6 mx-auto mb-2 text-primary-600" />
              <div className="text-2xl font-bold text-blue-700">{baby.weight}g</div>
              <div className="text-xs text-primary-600">Poids actuel</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <Ruler className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-700">{baby.height}cm</div>
              <div className="text-xs text-green-600">Taille actuelle</div>
            </div>
          </div>

          {/* Health Info */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <h6 className="font-medium  mb-2 flex items-center">
              <Heart className="w-4 h-4 mr-2 text-red-500" />
              Informations santé
            </h6>
            <div className="text-sm  space-y-1">
              <p>Genre: {baby.gender === 'male' ? 'Garçon' : baby.gender === 'female' ? 'Fille' : 'Autre'}</p>
              <p>Âge: {getAgeInWeeks(baby.birthDate)} semaines</p>
              <button className="text-amber-600 hover:underline text-xs">
                + Ajouter informations médicales
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Settings Section Component
function SettingsSection({ settings, updateSettings, colorSchemes }: {
  settings: AppSettings | null
  updateSettings: (settings: Partial<AppSettings>) => void
  colorSchemes: any[]
}) {
  const { theme, colorScheme, fontSize, setTheme, setColorScheme, setFontSize } = useTheme()

  if (!settings) {
    return <div className="text-center py-8">Chargement des paramètres...</div>
  }

  const updateSetting = async (key: string, value: any) => {
    await updateSettings({ [key]: value })
  }

  return (
    <div className="space-y-4">
      {/* Theme Selection */}
      <div className="glass-card backdrop-blur-sm rounded-2xl p-6 shadow-medium">
        <h4 className="font-semibold mb-4 flex items-center">
          <Palette className="w-5 h-5 mr-2 text-amber-600" />
          Apparence
        </h4>
        
        <div className="space-y-4">
          {/* Color Scheme */}
          <div>
            <label className="block text-sm font-medium  mb-3">Couleur principale</label>
            <div className="grid grid-cols-2 gap-3">
              {colorSchemes.map(scheme => (
                <button
                  key={scheme.value}
                  onClick={() => setColorScheme(scheme.value)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    colorScheme === scheme.value 
                      ? 'border-primary-500 ring-2 ring-primary-200 bg-primary-50 dark:bg-primary-900 dark:border-primary-400' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full ${scheme.primary}`}></div>
                    <span className="text-sm font-medium">{scheme.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Theme Mode */}
          <div>
            <label className="block text-sm font-medium  mb-3">Mode d'affichage</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'light', label: 'Clair', icon: Sun },
                { value: 'dark', label: 'Sombre', icon: Moon },
                { value: 'auto', label: 'Auto', icon: Smartphone }
              ].map(themeOption => {
                const Icon = themeOption.icon
                return (
                  <button
                    key={themeOption.value}
                    onClick={() => setTheme(themeOption.value as 'light' | 'dark' | 'auto')}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      theme === themeOption.value 
                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200 dark:bg-primary-900 dark:border-primary-400' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mx-auto mb-1 ${
                      theme === themeOption.value 
                        ? 'text-primary-600 dark:text-primary-400' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`} />
                    <div className={`text-xs font-medium ${
                      theme === themeOption.value 
                        ? 'text-primary-700 dark:text-primary-300' 
                        : 'text-gray-600 dark:text-gray-300'
                    }`}>{themeOption.label}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-sm font-medium  mb-3">Taille du texte</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'small', label: 'Petit' },
                { value: 'medium', label: 'Moyen' },
                { value: 'large', label: 'Grand' }
              ].map(size => (
                <button
                  key={size.value}
                  onClick={() => setFontSize(size.value)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    fontSize === size.value 
                      ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200 dark:bg-primary-900 dark:border-primary-400' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className={`font-medium ${
                    size.value === 'small' ? 'text-sm' :
                    size.value === 'large' ? 'text-lg' : 'text-base'
                  }`}>
                    {size.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Language & Region */}
      <div className="glass-card backdrop-blur-sm rounded-2xl p-6 shadow-medium">
        <h4 className="font-semibold mb-4 flex items-center">
          <Globe className="w-5 h-5 mr-2 text-primary-600" />
          Langue et région
        </h4>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium  mb-2">Langue</label>
              <select
                value={settings.language}
                onChange={(e) => updateSetting('language', e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="de">Deutsch</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium  mb-2">Format heure</label>
              <select
                value={settings.timeFormat}
                onChange={(e) => updateSetting('timeFormat', e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none"
              >
                <option value="24h">24 heures</option>
                <option value="12h">12 heures (AM/PM)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium  mb-2">Format de date</label>
            <select
              value={settings.dateFormat}
              onChange={(e) => updateSetting('dateFormat', e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>
      </div>

      {/* Units */}
      <div className="glass-card backdrop-blur-sm rounded-2xl p-6 shadow-medium">
        <h4 className="font-semibold mb-4 flex items-center">
          <Ruler className="w-5 h-5 mr-2 text-green-600" />
          Unités de mesure
        </h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium  mb-2">Poids</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'grams', label: 'Grammes' },
                { value: 'pounds', label: 'Livres' }
              ].map(unit => (
                <button
                  key={unit.value}
                  onClick={() => updateSetting('weightUnit', unit.value)}
                  className={`p-2 rounded-lg border text-sm transition-all ${
                    settings.weightUnit === unit.value 
                      ? 'border-amber-500 bg-amber-50' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {unit.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium  mb-2">Taille</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'cm', label: 'Centimètres' },
                { value: 'inches', label: 'Pouces' }
              ].map(unit => (
                <button
                  key={unit.value}
                  onClick={() => updateSetting('heightUnit', unit.value)}
                  className={`p-2 rounded-lg border text-sm transition-all ${
                    settings.heightUnit === unit.value 
                      ? 'border-amber-500 bg-amber-50' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {unit.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium  mb-2">Volume</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'ml', label: 'Millilitres' },
                { value: 'oz', label: 'Onces' }
              ].map(unit => (
                <button
                  key={unit.value}
                  onClick={() => updateSetting('volumeUnit', unit.value)}
                  className={`p-2 rounded-lg border text-sm transition-all ${
                    settings.volumeUnit === unit.value 
                      ? 'border-amber-500 bg-amber-50' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {unit.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium  mb-2">Température</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'celsius', label: '°C' },
                { value: 'fahrenheit', label: '°F' }
              ].map(unit => (
                <button
                  key={unit.value}
                  onClick={() => updateSetting('temperatureUnit', unit.value)}
                  className={`p-2 rounded-lg border text-sm transition-all ${
                    settings.temperatureUnit === unit.value 
                      ? 'border-amber-500 bg-amber-50' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {unit.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Notifications Section Component
function NotificationsSection({ settings, updateSettings }: {
  settings: AppSettings | null
  updateSettings: (settings: Partial<AppSettings>) => void
}) {
  if (!settings) return <div>Chargement...</div>

  const updateNotificationSetting = (key: string, value: any) => {
    console.log('updateNotificationSetting called:', key, value)
    console.log('Current settings.notifications:', settings.notifications)
    updateSettings({
      notifications: {
        ...settings.notifications,
        [key]: value
      }
    })
  }

  const updateQuietHours = (key: string, value: any) => {
    updateSettings({
      notifications: {
        ...settings.notifications,
        quietHours: {
          ...settings.notifications.quietHours,
          [key]: value
        }
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* General Notifications */}
      <div className="glass-card backdrop-blur-sm rounded-2xl p-6 shadow-medium">
        <h4 className="font-semibold mb-4 flex items-center">
          <Bell className="w-5 h-5 mr-2 text-yellow-600" />
          Notifications générales
        </h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium ">Activer les notifications</div>
              <div className="text-sm text-gray-400">Recevoir toutes les notifications</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.enabled}
                onChange={(e) => updateNotificationSetting('enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium ">Notifications push</div>
              <div className="text-sm text-gray-400">Sur votre appareil</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.pushNotifications}
                onChange={(e) => updateNotificationSetting('pushNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium ">Notifications email</div>
              <div className="text-sm text-gray-400">Rapports hebdomadaires</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.emailNotifications}
                onChange={(e) => updateNotificationSetting('emailNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Specific Notifications */}
      <div className="glass-card backdrop-blur-sm rounded-2xl p-6 shadow-medium">
        <h4 className="font-semibold mb-4">Rappels spécifiques</h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium  flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                Rappels repas
              </div>
              <div className="text-sm text-gray-400">Toutes les {settings.notifications.feedingInterval} minutes</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.feedingReminders}
                onChange={(e) => updateNotificationSetting('feedingReminders', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium  flex items-center">
                <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
                Rappels sommeil
              </div>
              <div className="text-sm text-gray-400">Heure de la sieste et du coucher</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.sleepReminders}
                onChange={(e) => updateNotificationSetting('sleepReminders', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          {/* Advanced Sleep Settings */}
          {settings.notifications.sleepReminders && (
            <div className="ml-6 p-4 bg-amber-50 rounded-xl space-y-4">
              <style jsx>{`
                input[type="range"]::-webkit-slider-thumb {
                  appearance: none;
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  background: #f59e0b;
                  cursor: pointer;
                  border: 2px solid #fff;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                input[type="range"]::-moz-range-thumb {
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  background: #f59e0b;
                  cursor: pointer;
                  border: 2px solid #fff;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
              `}</style>
              <h5 className="font-medium text-amber-800 text-sm">Paramètres avancés du sommeil</h5>
              
              <div>
                <label className="block text-sm font-medium  mb-2">
                  Seuil d'alerte sommeil insuffisant: {Math.round((settings.notifications.sleepInsufficientThreshold || 0.5) * 100)}%
                </label>
                <input
                  type="range"
                  min="30"
                  max="80"
                  step="5"
                  value={(settings.notifications.sleepInsufficientThreshold || 0.5) * 100}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value) / 100
                    console.log('Updating sleepInsufficientThreshold:', newValue)
                    updateNotificationSetting('sleepInsufficientThreshold', newValue)
                  }}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
                  style={{
                    background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${((settings.notifications.sleepInsufficientThreshold || 0.5) * 100 - 30) / 50 * 100}%, #e5e7eb ${((settings.notifications.sleepInsufficientThreshold || 0.5) * 100 - 30) / 50 * 100}%, #e5e7eb 100%)`
                  }}
                />
                <div className="text-xs  mt-1">
                  Alerte quand le sommeil est en dessous de {Math.round((settings.notifications.sleepInsufficientThreshold || 0.5) * 100)}% du temps recommandé
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium  mb-2">
                  Durée minimum pour un "bon sommeil": {settings.notifications.sleepQualityMinimumHours || 6}h
                </label>
                <input
                  type="range"
                  min="4"
                  max="10"
                  step="1"
                  value={settings.notifications.sleepQualityMinimumHours || 6}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value)
                    console.log('Updating sleepQualityMinimumHours:', newValue)
                    updateNotificationSetting('sleepQualityMinimumHours', newValue)
                  }}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
                  style={{
                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${((settings.notifications.sleepQualityMinimumHours || 6) - 4) / 6 * 100}%, #e5e7eb ${((settings.notifications.sleepQualityMinimumHours || 6) - 4) / 6 * 100}%, #e5e7eb 100%)`
                  }}
                />
                <div className="text-xs  mt-1">
                  Pas d'alerte si bébé a eu au moins {settings.notifications.sleepQualityMinimumHours || 6}h de sommeil continu dans les 24h
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium  flex items-center">
                <div className="w-2 h-2 bg-cyan-500 rounded-full mr-2"></div>
                Rappels couches
              </div>
              <div className="text-sm text-gray-400">Changement de couche</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.diaperReminders}
                onChange={(e) => updateNotificationSetting('diaperReminders', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium  flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                Alertes santé
              </div>
              <div className="text-sm text-gray-400">Situations importantes</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.healthAlerts}
                onChange={(e) => updateNotificationSetting('healthAlerts', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="glass-card backdrop-blur-sm rounded-2xl p-6 shadow-medium">
        <h4 className="font-semibold mb-4 flex items-center">
          <Moon className="w-5 h-5 mr-2 text-primary-600" />
          Heures de silence
        </h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium ">Activer les heures de silence</div>
              <div className="text-sm text-gray-400">Pas de notifications pendant ces heures</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.quietHours.enabled}
                onChange={(e) => updateQuietHours('enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          {settings.notifications.quietHours.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium  mb-2">Début</label>
                <input
                  type="time"
                  value={settings.notifications.quietHours.start}
                  onChange={(e) => updateQuietHours('start', e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium  mb-2">Fin</label>
                <input
                  type="time"
                  value={settings.notifications.quietHours.end}
                  onChange={(e) => updateQuietHours('end', e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Test Notification */}
      <div className="glass-card backdrop-blur-sm rounded-2xl p-6 shadow-medium">
        <button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 rounded-xl font-medium shadow-large flex items-center justify-center space-x-2 hover:scale-105 transition-transform">
          <Volume2 className="w-5 h-5" />
          <span>Tester les notifications</span>
        </button>
      </div>
    </div>
  )
}

// Family Section Component
function FamilySection({ familyMembers, setFamilyMembers, showInviteModal, setShowInviteModal }: {
  familyMembers: FamilyMember[]
  setFamilyMembers: (members: FamilyMember[]) => void
  showInviteModal: boolean
  setShowInviteModal: (show: boolean) => void
}) {
  const removeFamilyMember = (id: string) => {
    setFamilyMembers(familyMembers.filter(m => m.id !== id))
  }

  const togglePermission = (memberId: string, permission: string) => {
    setFamilyMembers(familyMembers.map(member => 
      member.id === memberId 
        ? {
            ...member,
            permissions: {
              ...member.permissions,
              [permission]: !(member.permissions as any)[permission]
            }
          }
        : member
    ))
  }

  return (
    <div className="space-y-4">
      {/* Family Members List */}
      <div className="glass-card backdrop-blur-sm rounded-2xl p-6 shadow-medium">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold flex items-center">
            <Users className="w-5 h-5 mr-2 text-green-600" />
            Membres de la famille ({familyMembers.length})
          </h4>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Inviter</span>
          </button>
        </div>

        <div className="space-y-3">
          {familyMembers.map(member => (
            <div key={member.id} className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                    member.role === 'partner' ? 'bg-pink-500' :
                    member.role === 'grandparent' ? 'bg-amber-500' :
                    member.role === 'caregiver' ? 'bg-blue-500' :
                    'bg-gray-500'
                  }`}>
                    {member.role === 'partner' ? '💑' :
                     member.role === 'grandparent' ? '👴' :
                     member.role === 'caregiver' ? '👩‍⚕️' : '👤'}
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-800">{member.name}</h5>
                    <p className="text-sm  capitalize">{member.role}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    member.inviteStatus === 'accepted' ? 'bg-green-100 text-green-700' :
                    member.inviteStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {member.inviteStatus === 'accepted' ? 'Actif' :
                     member.inviteStatus === 'pending' ? 'En attente' : 'Refusé'}
                  </span>
                  
                  <button
                    onClick={() => removeFamilyMember(member.id)}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-2">
                <h6 className="text-sm font-medium ">Permissions:</h6>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(member.permissions).map(([permission, enabled]) => (
                    <label key={permission} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() => togglePermission(member.id, permission)}
                        className="w-4 h-4 text-green-600"
                      />
                      <span className="text-gray-600 capitalize">
                        {permission === 'viewData' ? 'Voir les données' :
                         permission === 'addEntries' ? 'Ajouter des entrées' :
                         permission === 'editEntries' ? 'Modifier les entrées' :
                         'Gérer les paramètres'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {familyMembers.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">Aucun membre de famille invité</p>
              <p className="text-gray-400 text-sm">Invitez votre partenaire ou famille pour partager les données</p>
            </div>
          )}
        </div>
      </div>

      {/* Sharing Settings */}
      <div className="glass-card backdrop-blur-sm rounded-2xl p-6 shadow-medium">
        <h4 className="font-semibold mb-4">Paramètres de partage</h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium ">Partage automatique</div>
              <div className="text-sm text-gray-400">Nouvelles données partagées automatiquement</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium ">Partager les photos</div>
              <div className="text-sm text-gray-400">Photos et images dans les entrées</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium ">Partager les rapports</div>
              <div className="text-sm text-gray-400">Rapports hebdomadaires et analyses</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

// Privacy Section Component
function PrivacySection({ settings, setSettings, showDeleteConfirm, setShowDeleteConfirm }: {
  settings: AppSettings
  setSettings: (settings: Partial<AppSettings>) => void
  showDeleteConfirm: boolean
  setShowDeleteConfirm: (show: boolean) => void
}) {
  const updatePrivacySetting = (key: string, value: any) => {
    setSettings({
      privacy: {
        ...settings.privacy,
        [key]: value
      }
    })
  }

  const updateBackupSetting = (key: string, value: any) => {
    setSettings({
      backup: {
        ...settings.backup,
        [key]: value
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Privacy Settings */}
      <div className="glass-card backdrop-blur-sm rounded-2xl p-6 shadow-medium">
        <h4 className="font-semibold mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2 text-primary-600" />
          Confidentialité et sécurité
        </h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium ">Déverrouillage Face ID</div>
              <div className="text-sm text-gray-400">Utiliser Face ID pour ouvrir l'app</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.privacy.faceIdUnlock}
                onChange={(e) => updatePrivacySetting('faceIdUnlock', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium ">Partage de données anonymes</div>
              <div className="text-sm text-gray-400">Aider à améliorer l'application</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.privacy.dataSharing}
                onChange={(e) => updatePrivacySetting('dataSharing', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium ">Données d'utilisation</div>
              <div className="text-sm text-gray-400">Analytics et amélioration UX</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.privacy.analytics}
                onChange={(e) => updatePrivacySetting('analytics', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Backup Settings */}
      <div className="glass-card backdrop-blur-sm rounded-2xl p-6 shadow-medium">
        <h4 className="font-semibold mb-4 flex items-center">
          <Upload className="w-5 h-5 mr-2 text-green-600" />
          Sauvegarde et synchronisation
        </h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium ">Sauvegarde automatique</div>
              <div className="text-sm text-gray-400">Sauvegarder automatiquement vos données</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.backup.autoBackup}
                onChange={(e) => updateBackupSetting('autoBackup', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium ">Synchronisation cloud</div>
              <div className="text-sm text-gray-400">Synchroniser entre appareils</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.backup.cloudSync}
                onChange={(e) => updateBackupSetting('cloudSync', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium  mb-2">Fréquence de sauvegarde</label>
            <select
              value={settings.backup.backupFrequency}
              onChange={(e) => updateBackupSetting('backupFrequency', e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
            >
              <option value="daily">Quotidienne</option>
              <option value="weekly">Hebdomadaire</option>
              <option value="monthly">Mensuelle</option>
            </select>
          </div>

          <div className="p-4 bg-green-50 rounded-xl">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-700">Dernière sauvegarde</span>
            </div>
            <p className="text-sm text-green-600">Il y a 2 heures - Tout est à jour</p>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="glass-card backdrop-blur-sm rounded-2xl p-6 shadow-medium">
        <h4 className="font-semibold mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-amber-600" />
          Gestion des données
        </h4>
        
        <div className="space-y-3">
          <button className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium shadow-medium flex items-center justify-center space-x-2 hover:bg-blue-600 transition-colors">
            <Download className="w-5 h-5" />
            <span>Exporter toutes mes données</span>
          </button>

          <button className="w-full bg-green-500 text-white py-3 rounded-xl font-medium shadow-medium flex items-center justify-center space-x-2 hover:bg-green-600 transition-colors">
            <Upload className="w-5 h-5" />
            <span>Importer des données</span>
          </button>

          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full bg-red-500 text-white py-3 rounded-xl font-medium shadow-medium flex items-center justify-center space-x-2 hover:bg-red-600 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            <span>Supprimer mon compte</span>
          </button>
        </div>
      </div>

      {/* App Info */}
      <div className="glass-card backdrop-blur-sm rounded-2xl p-6 shadow-medium">
        <h4 className="font-semibold mb-4">Informations de l'application</h4>
        
        <div className="space-y-3 text-sm ">
          <div className="flex justify-between">
            <span>Version</span>
            <span className="font-medium">2.1.0</span>
          </div>
          <div className="flex justify-between">
            <span>Dernière mise à jour</span>
            <span className="font-medium">15 janvier 2024</span>
          </div>
          <div className="flex justify-between">
            <span>Stockage utilisé</span>
            <span className="font-medium">45.2 MB</span>
          </div>
          
          <div className="pt-3 border-t border-gray-200">
            <button className="text-amber-600 hover:underline">Conditions d'utilisation</button>
            <span className="mx-2">•</span>
            <button className="text-amber-600 hover:underline">Politique de confidentialité</button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm animate-slide-down">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supprimer le compte</h3>
              <p className="text-gray-600 mb-6">
                Cette action est irréversible. Toutes vos données seront définitivement supprimées.
              </p>
              
              <div className="space-y-3">
                <button className="w-full bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors">
                  Oui, supprimer définitivement
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full bg-gray-200  py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Invite Modal Component
function InviteModal({ onClose, onInvite }: {
  onClose: () => void
  onInvite: (email: string, role: string) => void
}) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('partner')

  const handleInvite = () => {
    if (email) {
      onInvite(email, role)
      setEmail('')
      setRole('partner')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md animate-slide-down">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Inviter un membre</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium  mb-2">
              Adresse email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
              placeholder="exemple@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium  mb-2">
              Rôle
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
            >
              <option value="partner">Partenaire</option>
              <option value="grandparent">Grand-parent</option>
              <option value="caregiver">Garde d'enfant</option>
              <option value="family_friend">Ami de la famille</option>
            </select>
          </div>

          <div className="p-4 bg-blue-50 rounded-xl">
            <h4 className="font-medium text-blue-700 mb-2">Permissions par défaut:</h4>
            <ul className="text-sm text-primary-600 space-y-1">
              <li>• Voir toutes les données</li>
              <li>• Ajouter de nouvelles entrées</li>
              <li>• Modifier ses propres entrées</li>
            </ul>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={handleInvite}
            disabled={!email}
            className="flex-1 bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Envoyer l'invitation
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