'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useBabyTrackerStore } from '@/lib/store'
import { useLiveBabyData } from '@/hooks/useLiveBabyData'
import { 
  formatTime, 
  formatDuration, 
  formatRelativeTime, 
  formatTimeFromDate,  // ✅ NOUVEAU
  ensureDate,          // ✅ NOUVEAU
  getAgeInWeeks, 
  getRecommendedDailyMilk, 
  getRecommendedFeedingInterval,
  getRecommendedDailySleep
} from '@/lib/utils'
import { 
  Milk, Moon, Clock, AlertCircle, Baby, Heart, 
  TrendingUp, TrendingDown, Droplets, Thermometer,
  Calendar, Stethoscope, Plus, Zap, Target, Award
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'

export default function HomePage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [email, setEmail] = useState('')
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  
  const {
    currentBaby,
    userProfile,
    sleepTimer,
    feedingSession,
    initializeData,
    initializeProfile,
    updateUserProfile,
    isLoading
  } = useBabyTrackerStore()

  // Use live data hook for real-time SQL data
  const liveData = useLiveBabyData(15000) // Refresh every 15 seconds

  // Handle email submission
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || isSubmittingEmail) return
    
    setIsSubmittingEmail(true)
    
    try {
      // Store email for future lookups first
      if (typeof window !== 'undefined') {
        localStorage.setItem('user-email', email.trim())
      }
      
      // Call the user lookup/creation API directly
      const lookupResponse = await fetch('/api/user/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          oldUserData: {
            id: 'temp-user-' + Date.now()
          }
        }),
      })

      if (!lookupResponse.ok) {
        throw new Error('Failed to create user account')
      }

      const lookupResult = await lookupResponse.json()
      console.log('User lookup/creation result:', lookupResult)
      
      // If it's an existing user, show success and reload
      if (!lookupResult.isNewUser && lookupResult.user) {
        console.log('Existing user found, logging in...')
        setIsSuccess(true)
        
        // Reload page after success message
        setTimeout(() => {
          window.location.reload()
        }, 2000)
        return
      }
      
      // If it's a new user, create them in the database
      if (lookupResult.isNewUser) {
        console.log('Creating new user in database...')
        
        const userId = 'user-' + Date.now()
        const createUserResponse = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: userId,
            email: email.trim(),
            firstName: 'Utilisateur',
            lastName: 'Nouveau',
            preferredName: 'Utilisateur',
            avatar: '👩‍🦰',
            role: 'mother',
            timezone: 'Europe/Paris',
            language: 'fr'
          }),
        })

        if (!createUserResponse.ok) {
          const errorText = await createUserResponse.text()
          console.error('User creation failed:', createUserResponse.status, errorText)
          throw new Error(`Failed to create user: ${createUserResponse.status} - ${errorText}`)
        }

        const createdUser = await createUserResponse.json()
        console.log('User created successfully:', createdUser)

        // Create a default baby for the new user
        console.log('Creating default baby for new user...')
        const babyId = userId + '_baby_1'
        const createBabyResponse = await fetch('/api/babies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: babyId,
            name: 'Mon Bébé',
            birthDate: new Date().toISOString(),
            gender: 'other',
            weight: 3500,
            height: 50,
            avatar: '👶',
            userId: userId
          }),
        })

        if (!createBabyResponse.ok) {
          const errorText = await createBabyResponse.text()
          console.error('Baby creation failed:', createBabyResponse.status, errorText)
          throw new Error(`Failed to create baby: ${createBabyResponse.status} - ${errorText}`)
        }

        const createdBaby = await createBabyResponse.json()
        console.log('Baby created successfully:', createdBaby)

        // Verify user was created by trying to fetch it immediately
        const verifyResponse = await fetch(`/api/user/profile?email=${encodeURIComponent(email.trim())}`)
        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json()
          console.log('User creation verified:', verifyData.id)
        } else {
          console.warn('User verification failed after creation')
        }
      }
      
      // Re-initialize profile which will now load from database
      console.log('Re-initializing profile after user creation...')
      
      setTimeout(async () => {
        console.log('Calling initializeProfile after user creation')
        try {
          // Force a fresh profile load by calling the API directly
          const profileResponse = await fetch(`/api/user/profile?email=${encodeURIComponent(email.trim())}`)
          if (profileResponse.ok) {
            const profileData = await profileResponse.json()
            console.log('Direct profile load successful:', profileData)
            
            // Update the store directly with the fetched profile AND babies
            updateUserProfile({
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
              createdAt: new Date(profileData.createdAt),
              isEmailVerified: profileData.isEmailVerified || false,
              isPhoneVerified: profileData.isPhoneVerified || false
            })
            
            // Extract all entries from babies (same logic as in store)
            const allFeedingEntries: any[] = []
            const allSleepEntries: any[] = []
            const allDiaperEntries: any[] = []
            
            profileData.babies?.forEach((baby: any) => {
              // Process feeding entries
              baby.feedingEntries?.forEach((entry: any) => {
                allFeedingEntries.push({
                  id: entry.id,
                  babyId: baby.id,
                  kind: entry.type,
                  amount: entry.amount || undefined,
                  startTime: new Date(entry.startTime),
                  endTime: entry.endTime ? new Date(entry.endTime) : undefined,
                  duration: entry.duration || undefined,
                  mood: entry.mood || undefined,
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
                  quality: entry.quality || undefined,
                  type: entry.type || undefined,
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
                  type: entry.type,
                  amount: entry.amount || undefined,
                  color: entry.color || undefined,
                  notes: entry.notes || undefined
                })
              })
            })

            // Also update babies, currentBaby AND entries if they exist
            if (profileData.babies && profileData.babies.length > 0) {
              useBabyTrackerStore.setState({
                babies: profileData.babies,
                currentBaby: profileData.babies[0],
                // Load entries from database
                feedings: allFeedingEntries,
                sleeps: allSleepEntries,
                diapers: allDiaperEntries
              })
              console.log('Updated store with babies and entries:', {
                babies: profileData.babies.length,
                feedings: allFeedingEntries.length,
                sleeps: allSleepEntries.length,
                diapers: allDiaperEntries.length
              })
            }
            
            // Show success message
            setIsSuccess(true)
            
            // Refresh the page after showing success message
            setTimeout(() => {
              window.location.reload()
            }, 2000)
            
          } else {
            console.error('Failed to fetch profile after user creation')
            // Fall back to calling initializeProfile
            initializeProfile()
            setIsSubmittingEmail(false)
          }
          
          initializeData()
        } catch (error) {
          console.error('Error during profile initialization:', error)
          setIsSubmittingEmail(false)
        }
      }, 500)
    } catch (error) {
      console.error('Failed to create user profile:', error)
      setIsSubmittingEmail(false)
    }
  }

  // Initialize data and update current time
  useEffect(() => {
    // Clean up any old default user data from localStorage
    const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('user-email') : null
    if (storedEmail === 'nouveau.utilisateur@example.com') {
      console.log('Clearing old default user data')
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user-email')
        // Clear the entire babytracker storage to reset to clean state
        localStorage.removeItem('babytracker-storage')
        // Force page reload to start completely fresh
        window.location.reload()
      }
      return
    }
    
    // Check if there's a stored email and try to load profile
    const validStoredEmail = typeof window !== 'undefined' ? localStorage.getItem('user-email') : null
    if (validStoredEmail && validStoredEmail !== 'nouveau.utilisateur@example.com') {
      console.log('Found stored email, trying to load profile:', validStoredEmail)
      setEmail(validStoredEmail)
      // Initialize profile with the stored email
      initializeProfile(validStoredEmail)
    } else {
      console.log('No stored email found, will show email entry screen')
      // Initialize without email - this will set loading to false and profile to null
      initializeProfile()
    }
    
    initializeData()
    
    const timer = setInterval(() => setCurrentTime(new Date()), 30000) // ✅ Moins fréquent
    return () => clearInterval(timer)
  }, [initializeData, initializeProfile])

  // Show loading screen while checking for user profile
  if (isLoading) {
    return (
      <AppLayout 
        className="bg-gradient-to-b from-primary-400 to-white"
        currentPage="Chargement"
        showHeader={false}
      >
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-3xl p-8 shadow-2xl text-center animate-slide-up">
              <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <h1 className="text-2xl font-bold mb-2">PistacheTracker Pro</h1>
              <p className="text-gray-600">Chargement de votre profil...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  // If no user profile, show email entry screen
  if (!userProfile || !userProfile.email || userProfile.email === 'nouveau.utilisateur@example.com') {
    return (
      <AppLayout 
        className="bg-gradient-to-b from-primary-400 to-white"
        currentPage="Bienvenue"
        showHeader={false}
      >
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className={`bg-white rounded-3xl p-8 shadow-2xl text-center transition-all duration-500 ${
              isSuccess ? 'animate-pulse border-2 border-green-200 bg-green-50' : 'animate-slide-up'
            }`}>
              <div className="text-6xl mb-6 animate-gentle-bounce">{isSuccess ? '🎉' : '👶'}</div>
              <h1 className="text-3xl font-bold mb-2">
                {isSuccess ? 'Bienvenue!' : 'PistacheTracker Pro'}
              </h1>
              <p className="text-gray-600 mb-8">
                {isSuccess 
                  ? 'Connexion réussie! Nous chargeons vos données...' 
                  : 'Suivez facilement la croissance et le bien-être de votre bébé'
                }
              </p>
              
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium  mb-2 text-left">
                    Votre adresse email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemple@email.com"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
                    required
                    disabled={isSubmittingEmail}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={!email.trim() || isSubmittingEmail || isSuccess}
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-all disabled:cursor-not-allowed flex items-center justify-center space-x-2 ${
                    isSuccess 
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                      : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 disabled:opacity-50'
                  }`}
                >
                  {isSuccess ? (
                    <>
                      <div className="w-5 h-5 text-white">✓</div>
                      <span>Connexion réussie! Chargement...</span>
                    </>
                  ) : isSubmittingEmail ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Création en cours...</span>
                    </>
                  ) : (
                    <span>Commencer</span>
                  )}
                </button>
              </form>
              
              <p className="text-xs  mt-6">
                Votre email sera utilisé pour sauvegarder et synchroniser vos données
              </p>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  // If no baby, show welcome message
  if (!currentBaby) {
    return (
      <AppLayout 
        className="bg-gradient-to-b from-primary-400 to-white"
        currentPage="Bienvenue"
        showHeader={true}
      >
        <div className="p-6 space-y-8 animate-fade-in">
          <div className="text-center space-y-4">
            <p className="text-gray-600 text-lg">Créez le profil de votre bébé pour commencer</p>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-500 to-primary-600 rounded-3xl p-8 text-white shadow-large text-center card-hover">
            <div className="text-4xl mb-4 animate-gentle-bounce">👶</div>
            <h2 className="text-2xl font-bold mb-4">Bienvenue!</h2>
            <p className="text-emerald-100 mb-6">Commencez le suivi de votre bébé</p>
            <Link href="/profile" className="bg-white text-emerald-600 px-6 py-3 rounded-xl font-semibold hover:bg-emerald-50 transition inline-block">
              Créer un profil
            </Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Calculate data for current baby using live data
  const ageInWeeks = currentBaby ? getAgeInWeeks(currentBaby.birthDate) : 0
  const ageInMonths = Math.floor(ageInWeeks / 4.33)
  const ageInDays = Math.floor(ageInWeeks * 7)
  
  // Use live data from SQL instead of local store
  const todayFeedings = liveData.liveData.feedings
  const todaySleeps = liveData.liveData.sleeps
  const todayDiapers = liveData.liveData.diapers
  
  const totalMilk = liveData.liveData.stats.totalMilk
  const totalSleep = liveData.liveData.stats.totalSleepMinutes
  const recommendedMilk = currentBaby ? getRecommendedDailyMilk(currentBaby.weight, ageInWeeks) : 0
  const recommendedSleep = getRecommendedDailySleep(ageInWeeks) // minutes
  const recommendedInterval = getRecommendedFeedingInterval(ageInWeeks)
  
  const lastFeeding = liveData.liveData.stats.lastFeeding
  const timeSinceLastFeeding = liveData.liveData.stats.timeSinceLastFeeding
  
  // Calculate next feeding time from last feeding
  const nextFeedingTime = lastFeeding && timeSinceLastFeeding !== null
    ? new Date(new Date(lastFeeding.time).getTime() + recommendedInterval * 60 * 60 * 1000)
    : null
  const isLateForFeeding = nextFeedingTime && new Date() > nextFeedingTime

  // ✅ Enhanced KPI calculations
  const diaperStats = {
    total: todayDiapers.length,
    wet: todayDiapers.filter(d => d.type === 'wet' || d.type === 'mixed').length,
    soiled: todayDiapers.filter(d => d.type === 'soiled' || d.type === 'mixed').length,
    lastChange: todayDiapers.length > 0 ? todayDiapers[0] : null,
    timeSinceLastChange: todayDiapers.length > 0 
      ? Math.floor((new Date().getTime() - new Date((todayDiapers[0] as any).time || (todayDiapers[0] as any).timestamp).getTime()) / (1000 * 60))
      : null
  }

  const sleepStats = {
    total: totalSleep,
    sessions: todaySleeps.length,
    average: todaySleeps.length > 0 ? Math.floor(totalSleep / todaySleeps.length) : 0,
    longest: todaySleeps.reduce((max, sleep) => {
      if (!(sleep as any).endTime) return max
      const duration = Math.floor((new Date((sleep as any).endTime).getTime() - new Date((sleep as any).startTime).getTime()) / (1000 * 60))
      return Math.max(max, duration)
    }, 0),
    quality: todaySleeps.length > 0 
      ? todaySleeps.filter(s => s.quality === 'excellent' || s.quality === 'good').length / todaySleeps.length 
      : 0
  }

  const feedingStats = {
    total: totalMilk,
    sessions: todayFeedings.length,
    average: todayFeedings.length > 0 ? Math.floor(totalMilk / todayFeedings.length) : 0,
    progress: Math.min((totalMilk / recommendedMilk) * 100, 100),
    types: {
      biberon: todayFeedings.filter(f => f.kind === 'biberon').length,
      tetee: todayFeedings.filter(f => f.kind === 'tétée').length,
      solide: todayFeedings.filter(f => f.kind === 'solide').length
    }
  }

  // Growth tracking (basic - can be enhanced with historical data)
  const growthStats = {
    weight: currentBaby.weight,
    height: currentBaby.height,
    age: ageInDays,
    ageDisplay: ageInDays < 30 ? `${ageInDays} jours` : 
                ageInWeeks < 12 ? `${ageInWeeks} semaines` : 
                `${ageInMonths} mois`
  }

  return (     
    <AppLayout 
      className="bg-gradient-to-b from-primary-400 to-white"
      currentPage="PistacheTracker"
      showHeader={true}
    >
      <div className="p-6 space-y-8 animate-fade-in">
        {/* Live Data Loading/Error State */}
        {liveData.loading && (
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-3xl p-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-primary-700">Chargement des données en temps réel...</span>
            </div>
            <p className="text-xs text-primary-600 mt-1">Dernière mise à jour: {new Date(liveData.timestamp).toLocaleTimeString()}</p>
          </div>
        )}

        {liveData.error && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-3xl p-4 text-center border border-red-200">
            <div className="flex items-center justify-center space-x-2 text-red-700">
              <span>⚠️</span>
              <span>Erreur de synchronisation: {liveData.error}</span>
            </div>
            <button 
              onClick={liveData.refresh} 
              className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* ✅ Current Session Alert - CORRIGÉ */}
        {(sleepTimer.isRunning || feedingSession.isActive) && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-3xl p-6 shadow-large animate-slide-up">
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
              <div className="flex-1">
                {sleepTimer.isRunning && (
                  <div>
                    <h3 className="font-bold text-amber-800 flex items-center space-x-2">
                      <Moon className="w-5 h-5" />
                      <span>Sommeil en cours</span>
                    </h3>
                    <p className="text-amber-600">
                      Durée: {formatTime(sleepTimer.seconds)} • 
                      Depuis {formatTimeFromDate(sleepTimer.startTime)}
                    </p>
                  </div>
                )}
                
                {feedingSession.isActive && (
                  <div>
                    <h3 className="font-bold text-amber-800 flex items-center space-x-2">
                      <Milk className="w-5 h-5" />
                      <span>Repas en cours</span>
                    </h3>
                    <p className="text-amber-600">
                      {feedingSession.type} {feedingSession.amount > 0 && `${feedingSession.amount}ml`} • 
                      Durée: {formatTime(feedingSession.timerSeconds)}
                    </p>
                  </div>
                )}
              </div>
              
              <Link 
                href={sleepTimer.isRunning ? '/sleep' : '/feeding'}
                className="bg-amber-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-amber-600 transition"
              >
                Gérer
              </Link>
            </div>
          </div>
        )}

        {/* ✅ Feeding Alert - CORRIGÉ */}
        {!feedingSession.isActive && isLateForFeeding && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-3xl p-6 shadow-large animate-slide-up">
            <div className="flex items-center space-x-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <div className="flex-1">
                <h3 className="font-bold text-red-800">Repas en retard!</h3>
                <p className="text-red-600">
                  Dernière fois: {lastFeeding ? formatRelativeTime(lastFeeding.time) : 'Jamais'} • 
                  Recommandé toutes les {recommendedInterval}h
                </p>
              </div>
              <Link 
                href="/feeding"
                className="bg-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-600 transition"
              >
                Nourrir
              </Link>
            </div>
          </div>
        )}

        {/* Enhanced KPI Dashboard */}
        <div className="space-y-6">
          {/* Header with Baby Info */}
          <div className="glass-card rounded-3xl p-6 text-center shadow-large animate-slide-up">
            <div className="text-4xl mb-3 animate-gentle-bounce">{currentBaby.avatar}</div>
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-200">{currentBaby.name}</h2>
            <p className="text-primary-600 dark:text-primary-300">{growthStats.ageDisplay} • {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>

          {/* Quick Actions Row */}
          <div className="grid grid-cols-4 gap-3">
            <Link href="/feeding" className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-4 text-center hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105 shadow-medium">
              <Plus className="w-6 h-6 mx-auto mb-1" />
              <div className="text-sm font-semibold">Repas</div>
            </Link>
            <Link href="/sleep" className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl p-4 text-center hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-medium">
              <Moon className="w-6 h-6 mx-auto mb-1" />
              <div className="text-sm font-semibold">Sommeil</div>
            </Link>
            <Link href="/diaper" className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl p-4 text-center hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 shadow-medium">
              <Droplets className="w-6 h-6 mx-auto mb-1" />
              <div className="text-sm font-semibold">Couche</div>
            </Link>
            <Link href="/growth" className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl p-4 text-center hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105 shadow-medium">
              <TrendingUp className="w-6 h-6 mx-auto mb-1" />
              <div className="text-sm font-semibold">Mesure</div>
            </Link>
          </div>

          {/* Main KPI Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Feeding KPI */}
            <div className="glass-card rounded-3xl p-6 shadow-large card-hover">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-2">
                    <Milk className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-200">Nutrition</h3>
                    <p className="text-sm text-gray-500">{feedingStats.sessions} repas</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{feedingStats.total}ml</div>
                  <div className="text-sm text-gray-500">/{recommendedMilk}ml</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Progression</span>
                  <span className="font-semibold">{Math.round(feedingStats.progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${feedingStats.progress}%` }}
                  />
                </div>
                
                {feedingStats.sessions > 0 && (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Moyenne: {feedingStats.average}ml</span>
                    <span>Dernier: {timeSinceLastFeeding ? formatDuration(timeSinceLastFeeding) : 'N/A'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sleep KPI */}
            <div className="glass-card rounded-3xl p-6 shadow-large card-hover">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-2">
                    <Moon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-200">Sommeil</h3>
                    <p className="text-sm text-gray-500">{sleepStats.sessions} sessions</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600">{formatDuration(sleepStats.total)}</div>
                  <div className="text-sm text-gray-500">/{formatDuration(recommendedSleep)}</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Objectif</span>
                  <span className="font-semibold">{Math.round((sleepStats.total / recommendedSleep) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((sleepStats.total / recommendedSleep) * 100, 100)}%` }}
                  />
                </div>
                
                {sleepStats.sessions > 0 && (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Plus long: {formatDuration(sleepStats.longest)}</span>
                    <span>Qualité: {Math.round(sleepStats.quality * 100)}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Diaper KPI */}
            <div className="glass-card rounded-3xl p-6 shadow-large card-hover">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-2">
                    <Droplets className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-200">Couches</h3>
                    <p className="text-sm text-gray-500">Aujourd'hui</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">{diaperStats.total}</div>
                  <div className="text-sm text-gray-500">changes</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Pipi: {diaperStats.wet}</span>
                  <span>Caca: {diaperStats.soiled}</span>
                </div>
                
                {diaperStats.timeSinceLastChange !== null && (
                  <div className="text-xs text-gray-500 text-center">
                    Dernière change: {formatDuration(diaperStats.timeSinceLastChange)}
                  </div>
                )}
                
                {diaperStats.timeSinceLastChange && diaperStats.timeSinceLastChange > 180 && (
                  <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-2">
                    <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-300">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-xs">Peut nécessiter un change</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Growth KPI */}
            <div className="glass-card rounded-3xl p-6 shadow-large card-hover">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-100 dark:bg-orange-900/30 rounded-full p-2">
                    <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-200">Croissance</h3>
                    <p className="text-sm text-gray-500">{growthStats.ageDisplay}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-600">{(growthStats.weight / 1000).toFixed(1)}kg</div>
                  <div className="text-sm text-gray-500">{growthStats.height}cm</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                  <div className="text-center bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                    <div className="font-semibold">Poids</div>
                    <div>{(growthStats.weight / 1000).toFixed(1)}kg</div>
                  </div>
                  <div className="text-center bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                    <div className="font-semibold">Taille</div>
                    <div>{growthStats.height}cm</div>
                  </div>
                </div>
                
                <Link href="/growth" className="block text-center">
                  <div className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                    Voir courbes de croissance →
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Smart Insights & Recommendations */}
        <div className="glass-card rounded-3xl p-6 shadow-large border border-gray-100 dark:border-gray-700">
          <h3 className="font-bold mb-4 flex items-center space-x-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            <span>Aperçus intelligents</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Feeding insights */}
            {feedingStats.progress < 50 && (
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Nutrition</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Il reste {recommendedMilk - feedingStats.total}ml pour atteindre l'objectif quotidien
                    </p>
                  </div>
                </div>
              </div>
            )}

            {feedingStats.progress >= 100 && (
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-sm font-semibold text-green-800 dark:text-green-200">Objectif atteint!</p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Nutrition quotidienne complète ✨
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Sleep insights */}
            {sleepStats.total < recommendedSleep * 0.7 && (
              <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <Moon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <div>
                    <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">Sommeil</p>
                    <p className="text-xs text-purple-600 dark:text-purple-400">
                      Une sieste supplémentaire pourrait être bénéfique
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Diaper insights */}
            {diaperStats.timeSinceLastChange && diaperStats.timeSinceLastChange > 120 && (
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <Droplets className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-sm font-semibold text-green-800 dark:text-green-200">Couche</p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Vérifiez si un change est nécessaire
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Growth milestone */}
            {ageInWeeks % 4 === 0 && (
              <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  <div>
                    <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">Étape importante</p>
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      {currentBaby.name} a {ageInWeeks} semaines! Pensez à prendre des mesures
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Module Navigation */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/diaper" className="group">
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-3xl p-6 text-center card-hover relative overflow-hidden border border-green-200 dark:border-green-700">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform animate-float">💧</div>
              <h3 className="font-bold text-green-800 dark:text-green-200">Couches</h3>
              <p className="text-green-600 dark:text-green-400 text-sm mt-2">
                {diaperStats.total} changes aujourd'hui
              </p>
              <p className="text-green-500 dark:text-green-500 text-xs">
                Dernière: {diaperStats.timeSinceLastChange ? `${formatDuration(diaperStats.timeSinceLastChange)}` : 'N/A'}
              </p>
              
              {/* Status indicator */}
              <div className="absolute top-2 right-2">
                <div className={`w-3 h-3 rounded-full ${
                  diaperStats.timeSinceLastChange && diaperStats.timeSinceLastChange > 180 
                    ? 'bg-amber-500 animate-pulse' 
                    : 'bg-green-500'
                }`} />
              </div>
            </div>
          </Link>

          <Link href="/health" className="group">
            <div className="bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 rounded-3xl p-6 text-center card-hover relative overflow-hidden border border-red-200 dark:border-red-700">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform animate-float">🏥</div>
              <h3 className="font-bold text-red-800 dark:text-red-200">Santé</h3>
              <p className="text-red-600 dark:text-red-400 text-sm mt-2">
                Suivi médical
              </p>
              <p className="text-red-500 dark:text-red-500 text-xs">
                Vaccins • Croissance • Rdv
              </p>
            </div>
          </Link>

          <Link href="/checklist" className="group">
            <div className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 rounded-3xl p-6 text-center card-hover relative overflow-hidden border border-purple-200 dark:border-purple-700">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform animate-float">✅</div>
              <h3 className="font-bold text-purple-800 dark:text-purple-200">Checklist</h3>
              <p className="text-purple-600 dark:text-purple-400 text-sm mt-2">
                Routine quotidienne
              </p>
              <p className="text-purple-500 dark:text-purple-500 text-xs">
                {ageInWeeks < 12 ? 'Nouveau-né' : 'Développement'}
              </p>
            </div>
          </Link>

          <Link href="/profile" className="group">
            <div className="bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-900/30 dark:to-slate-900/30 rounded-3xl p-6 text-center card-hover relative overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform animate-float">👶</div>
              <h3 className="font-bold text-gray-800 dark:text-gray-200">Profil</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                {currentBaby.name}
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-xs">
                Paramètres • Famille
              </p>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        {(todayFeedings.length > 0 || todaySleeps.length > 0) && (
          <div className="glass-card rounded-3xl p-6 shadow-large border border-gray-100 animate-slide-up">
            <h3 className="font-bold mb-4 flex items-center space-x-2">
              <Clock className="w-5 h-5 " />
              <span>Activité récente</span>
            </h3>
            
            <div className="space-y-3">
              {/* Last feeding */}
              {lastFeeding && (
                <div className="flex items-center space-x-4 p-3 bg-primary-50 rounded-xl hover-lift">
                  <div className="bg-primary-100 rounded-full p-2">
                    <Milk className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      {lastFeeding.type} {lastFeeding.amount}ml
                    </p>
                    <p className="text-sm text-gray-400">
                      {formatRelativeTime(lastFeeding.time)}
                    </p>
                  </div>
                  <div className="text-lg">
                    {lastFeeding.mood === 'happy' ? '😊' : 
                     lastFeeding.mood === 'content' ? '😌' : '😰'}
                  </div>
                </div>
              )}
              
              {/* Last sleep */}
              {todaySleeps.length > 0 && (
                <div className="flex items-center space-x-4 p-3 bg-primary-50 rounded-xl hover-lift">
                  <div className="bg-primary-100 rounded-full p-2">
                    <Moon className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      {(todaySleeps[0] as any).type === 'night' ? 'Nuit' : 'Sieste'}
                      {(todaySleeps[0] as any).endTime && ` (${formatDuration(Math.floor((ensureDate((todaySleeps[0] as any).endTime)?.getTime() || 0 - ensureDate((todaySleeps[0] as any).startTime)?.getTime() || 0) / (1000 * 60)))})`}
                    </p>
                    <p className="text-sm text-gray-400">
                      {formatRelativeTime((todaySleeps[0] as any).startTime)}
                    </p>
                  </div>
                  <div className="text-lg">
                    {todaySleeps[0].quality === 'excellent' ? '😴' : 
                     todaySleeps[0].quality === 'good' ? '😊' : 
                     todaySleeps[0].quality === 'restless' ? '😅' : '😰'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="glass-card rounded-3xl p-6 shadow-large border border-gray-100">
          <h3 className="font-bold mb-4 flex items-center space-x-2">
            <Heart className="w-5 h-5 text-red-500" />
            <span>Résumé du jour</span>
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">{todayFeedings.length}</div>
              <div className="text-sm text-gray-400">Repas</div>
              <div className="text-xs ">
                Objectif: {Math.ceil(24 / recommendedInterval)} par jour
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">{todaySleeps.length}</div>
              <div className="text-sm text-gray-400">Sommeils</div>
              <div className="text-xs ">
                Total: {formatDuration(totalSleep)}
              </div>
            </div>
          </div>

          {/* Progress indicators */}
          <div className="mt-6 space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Nutrition</span>
                <span className="font-semibold">{Math.round((totalMilk / recommendedMilk) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary-600 to-primary-700 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min((totalMilk / recommendedMilk) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}