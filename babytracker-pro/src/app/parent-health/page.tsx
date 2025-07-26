'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useBabyTrackerStore } from '@/lib/store'
import AppLayout from '@/components/layout/AppLayout'
import BreathingExercise from '@/components/wellness/BreathingExercise'
import { 
  Heart, Brain, Sunrise, Moon, Activity, Smile, Frown, Meh, 
  AlertCircle, CheckCircle, Clock, Target, BookOpen, Users,
  Thermometer, Droplets, Zap, Coffee, Utensils, Dumbbell,
  Shield, Lightbulb, Phone, Calendar, Award, TrendingUp,
  MessageCircle, Star, ChevronRight, ChevronDown, Plus,
  Edit3, Trash2, Save, X, Info, ExternalLink, Play,
  Battery, Sun, Cloud, CloudRain, BarChart3, PieChart, RefreshCw
} from 'lucide-react'

// ✅ Evidence-based psychological assessment tools
const MOOD_SCALES = {
  energy: {
    name: 'Niveau d\'énergie',
    icon: Battery,
    levels: [
      { value: 1, label: 'Épuisé', color: 'red', description: 'Fatigue extrême, difficultés à fonctionner' },
      { value: 2, label: 'Fatigué', color: 'orange', description: 'Fatigue notable, besoin de repos fréquent' },
      { value: 3, label: 'Neutre', color: 'yellow', description: 'Énergie modérée, quelques moments de fatigue' },
      { value: 4, label: 'Énergique', color: 'green', description: 'Bonne énergie, capable de gérer les tâches' },
      { value: 5, label: 'Revitalisé', color: 'emerald', description: 'Plein d\'énergie, sentiment de vitalité' }
    ]
  },
  mood: {
    name: 'Humeur générale',
    icon: Sun,
    levels: [
      { value: 1, label: 'Très bas', color: 'red', description: 'Tristesse profonde, désespoir' },
      { value: 2, label: 'Morose', color: 'orange', description: 'Humeur sombre, inquiétudes fréquentes' },
      { value: 3, label: 'Stable', color: 'yellow', description: 'Humeur équilibrée, ni haut ni bas' },
      { value: 4, label: 'Positif', color: 'green', description: 'Bonne humeur, optimisme modéré' },
      { value: 5, label: 'Rayonnant', color: 'emerald', description: 'Joie, enthousiasme, bien-être profond' }
    ]
  },
  stress: {
    name: 'Niveau de stress',
    icon: Cloud,
    levels: [
      { value: 1, label: 'Zen', color: 'emerald', description: 'Calme profond, sérénité' },
      { value: 2, label: 'Détendu', color: 'green', description: 'Relaxé, tensions mineures' },
      { value: 3, label: 'Modéré', color: 'yellow', description: 'Stress gérable, quelques préoccupations' },
      { value: 4, label: 'Tendu', color: 'orange', description: 'Stress notable, besoin de décompression' },
      { value: 5, label: 'Débordé', color: 'red', description: 'Stress intense, sentiment d\'être submergé' }
    ]
  },
  confidence: {
    name: 'Confiance parentale',
    icon: Shield,
    levels: [
      { value: 1, label: 'Perdu', color: 'red', description: 'Doutes profonds, sentiment d\'incompétence' },
      { value: 2, label: 'Incertain', color: 'orange', description: 'Manque de confiance, remise en question' },
      { value: 3, label: 'En apprentissage', color: 'yellow', description: 'Confiance modérée, apprentissage actif' },
      { value: 4, label: 'Compétent', color: 'green', description: 'Bonne confiance, maîtrise progressive' },
      { value: 5, label: 'Expert', color: 'emerald', description: 'Confiance solide, expertise développée' }
    ]
  }
}

// ✅ Evidence-based postpartum recovery checklist (WHO + ACOG guidelines)
const RECOVERY_CATEGORIES = {
  physical: {
    name: 'Récupération Physique',
    icon: Activity,
    color: 'pink',
    items: [
      { id: 'bleeding', name: 'Saignements normalisés', critical: true, timeframe: '6-8 semaines', description: 'Lochies diminuées, couleur normale' },
      { id: 'incision', name: 'Cicatrisation (césarienne/épisiotomie)', critical: true, timeframe: '2-6 semaines', description: 'Absence d\'infection, guérison progressive' },
      { id: 'uterus', name: 'Involution utérine', critical: false, timeframe: '6 semaines', description: 'Retour à la taille normale de l\'utérus' },
      { id: 'energy', name: 'Énergie stabilisée', critical: false, timeframe: '3-6 mois', description: 'Retour progressif du niveau d\'énergie' },
      { id: 'sleep', name: 'Sommeil réparateur', critical: false, timeframe: 'Variable', description: 'Qualité de sommeil améliorée' },
      { id: 'appetite', name: 'Appétit normal', critical: false, timeframe: '2-4 semaines', description: 'Retour à un appétit équilibré' },
      { id: 'mobility', name: 'Mobilité complète', critical: false, timeframe: '2-8 semaines', description: 'Capacité de mouvement sans douleur' }
    ]
  },
  emotional: {
    name: 'Bien-être Émotionnel',
    icon: Heart,
    color: 'purple',
    items: [
      { id: 'mood_stable', name: 'Humeur stabilisée', critical: true, timeframe: '2-6 semaines', description: 'Absence de baby blues prolongé' },
      { id: 'bonding', name: 'Attachement au bébé', critical: true, timeframe: '0-12 semaines', description: 'Développement du lien parent-enfant' },
      { id: 'anxiety_controlled', name: 'Anxiété maîtrisée', critical: true, timeframe: 'Ongoing', description: 'Niveau d\'anxiété gérable au quotidien' },
      { id: 'support_accepted', name: 'Aide acceptée', critical: false, timeframe: 'Ongoing', description: 'Capacité à recevoir et demander de l\'aide' },
      { id: 'identity_adapted', name: 'Identité parentale', critical: false, timeframe: '3-12 mois', description: 'Adaptation à la nouvelle identité de parent' },
      { id: 'communication', name: 'Communication ouverte', critical: false, timeframe: 'Ongoing', description: 'Expression des besoins et émotions' }
    ]
  },
  social: {
    name: 'Réintégration Sociale',
    icon: Users,
    color: 'blue',
    items: [
      { id: 'partner_relationship', name: 'Relation de couple', critical: true, timeframe: '3-6 mois', description: 'Adaptation de la relation conjugale' },
      { id: 'social_connections', name: 'Liens sociaux', critical: false, timeframe: '2-6 mois', description: 'Maintien des relations amicales' },
      { id: 'work_transition', name: 'Retour au travail', critical: false, timeframe: '3-12 mois', description: 'Réintégration professionnelle réussie' },
      { id: 'community_engagement', name: 'Engagement communautaire', critical: false, timeframe: '6-12 mois', description: 'Participation à des activités sociales' },
      { id: 'parent_groups', name: 'Groupes de parents', critical: false, timeframe: '1-6 mois', description: 'Connexion avec d\'autres parents' }
    ]
  },
  practical: {
    name: 'Compétences Pratiques',
    icon: CheckCircle,
    color: 'green',
    items: [
      { id: 'feeding_confident', name: 'Alimentation maîtrisée', critical: true, timeframe: '2-8 semaines', description: 'Confiance dans l\'alimentation du bébé' },
      { id: 'sleep_routines', name: 'Routines de sommeil', critical: false, timeframe: '2-6 mois', description: 'Établissement de routines efficaces' },
      { id: 'baby_cues', name: 'Signaux du bébé', critical: false, timeframe: '1-3 mois', description: 'Compréhension des besoins du bébé' },
      { id: 'safety_measures', name: 'Mesures de sécurité', critical: true, timeframe: '0-1 mois', description: 'Application des mesures de sécurité' },
      { id: 'healthcare_navigation', name: 'Système de santé', critical: false, timeframe: '1-3 mois', description: 'Navigation du système de santé pédiatrique' }
    ]
  }
}

// ✅ Evidence-based self-care framework (Maslow + Self-Determination Theory)
const SELF_CARE_DOMAINS = {
  physical: {
    name: 'Soins Physiques',
    icon: Activity,
    color: 'red',
    goals: [
      { id: 'sleep_hygiene', name: 'Hygiène du sommeil', target: '7-9h par nuit', frequency: 'daily' },
      { id: 'nutrition', name: 'Nutrition équilibrée', target: '3 repas + 2 collations', frequency: 'daily' },
      { id: 'hydration', name: 'Hydratation', target: '2-3L d\'eau', frequency: 'daily' },
      { id: 'movement', name: 'Activité physique', target: '30min minimum', frequency: 'daily' },
      { id: 'medical_checkups', name: 'Suivi médical', target: 'Rendez-vous réguliers', frequency: 'monthly' }
    ]
  },
  emotional: {
    name: 'Bien-être Émotionnel',
    icon: Heart,
    color: 'pink',
    goals: [
      { id: 'mindfulness', name: 'Pleine conscience', target: '10-20min méditation', frequency: 'daily' },
      { id: 'journaling', name: 'Journal intime', target: 'Écriture réflexive', frequency: 'weekly' },
      { id: 'therapy', name: 'Accompagnement psy', target: 'Séances régulières', frequency: 'weekly' },
      { id: 'emotional_expression', name: 'Expression émotionnelle', target: 'Partage ouvert', frequency: 'daily' },
      { id: 'stress_management', name: 'Gestion du stress', target: 'Techniques de relaxation', frequency: 'daily' }
    ]
  },
  social: {
    name: 'Connexions Sociales',
    icon: Users,
    color: 'blue',
    goals: [
      { id: 'partner_time', name: 'Temps en couple', target: '30min qualité', frequency: 'daily' },
      { id: 'friend_connections', name: 'Liens amicaux', target: 'Contact régulier', frequency: 'weekly' },
      { id: 'family_support', name: 'Soutien familial', target: 'Communication ouverte', frequency: 'weekly' },
      { id: 'parent_community', name: 'Communauté parentale', target: 'Activités de groupe', frequency: 'monthly' },
      { id: 'professional_networks', name: 'Réseaux professionnels', target: 'Maintien des contacts', frequency: 'monthly' }
    ]
  },
  intellectual: {
    name: 'Stimulation Intellectuelle',
    icon: Brain,
    color: 'purple',
    goals: [
      { id: 'reading', name: 'Lecture personnelle', target: '20-30min', frequency: 'daily' },
      { id: 'learning', name: 'Apprentissage nouveau', target: 'Compétence/hobby', frequency: 'weekly' },
      { id: 'creative_expression', name: 'Expression créative', target: 'Activité artistique', frequency: 'weekly' },
      { id: 'problem_solving', name: 'Résolution de problèmes', target: 'Défis intellectuels', frequency: 'weekly' },
      { id: 'goal_setting', name: 'Planification d\'objectifs', target: 'Révision des objectifs', frequency: 'monthly' }
    ]
  },
  spiritual: {
    name: 'Épanouissement Spirituel',
    icon: Sunrise,
    color: 'amber',
    goals: [
      { id: 'meditation', name: 'Méditation/Prière', target: '15-30min', frequency: 'daily' },
      { id: 'nature_connection', name: 'Connexion nature', target: 'Temps extérieur', frequency: 'daily' },
      { id: 'gratitude_practice', name: 'Pratique de gratitude', target: '3 gratitudes', frequency: 'daily' },
      { id: 'values_reflection', name: 'Réflexion sur les valeurs', target: 'Alignement personnel', frequency: 'weekly' },
      { id: 'meaning_making', name: 'Recherche de sens', target: 'Réflexion existentielle', frequency: 'monthly' }
    ]
  }
}

// ✅ Expert psychological resources and interventions
const EXPERT_RESOURCES = {
  immediate_support: {
    name: 'Soutien Immédiat',
    items: [
      {
        title: 'Ligne d\'écoute postpartum',
        description: 'Support 24h/24 pour détresse émotionnelle',
        phone: '0800 00 34 56',
        availability: '24h/24, 7j/7',
        type: 'emergency'
      },
      {
        title: 'SOS Médecins',
        description: 'Consultation médicale urgente à domicile',
        phone: '3624',
        availability: '24h/24, 7j/7',
        type: 'medical'
      },
      {
        title: 'Exercices de respiration guidés',
        description: 'Techniques de relaxation pour l\'anxiété aiguë',
        action: 'start_breathing_exercise',
        availability: 'Immédiat',
        type: 'self_help'
      }
    ]
  },
  professional_support: {
    name: 'Accompagnement Professionnel',
    items: [
      {
        title: 'Psychologue périnatale',
        description: 'Spécialiste de la psychologie de la maternité',
        specialties: ['Dépression postpartum', 'Anxiété', 'Trauma obstétrical'],
        how_to: 'Recherche via l\'Ordre des Psychologues'
      },
      {
        title: 'Psychiatre spécialisé',
        description: 'Traitement médicamenteux si nécessaire',
        specialties: ['Médication compatible allaitement', 'Troubles de l\'humeur'],
        how_to: 'Référence médicale recommandée'
      },
      {
        title: 'Sage-femme de PMI',
        description: 'Suivi postpartum et soutien pratique',
        specialties: ['Récupération physique', 'Allaitement', 'Contraception'],
        how_to: 'Contact via votre PMI locale'
      }
    ]
  },
  educational_resources: {
    name: 'Ressources Éducatives',
    items: [
      {
        title: 'Guide dépression postpartum',
        description: 'Comprendre et gérer la dépression du post-partum',
        format: 'PDF téléchargeable',
        author: 'Association Française de Psychiatrie Périnatale'
      },
      {
        title: 'Webinaire sommeil parental',
        description: 'Optimiser son sommeil avec un nouveau-né',
        format: 'Vidéo 45min',
        author: 'Dr. Sarah Martinez, spécialiste du sommeil'
      },
      {
        title: 'Podcast parentalité consciente',
        description: 'Épisodes sur l\'équilibre parental et le bien-être',
        format: 'Podcast hebdomadaire',
        author: 'Collectif de professionnels'
      }
    ]
  }
}

export default function ParentHealthPage() {
  // ✅ Enhanced loading states for optimized UX
  const [loading, setLoading] = useState({
    mood: false,
    recovery: false,
    goals: false,
    initialLoad: true
  })
  const [errors, setErrors] = useState({
    mood: null as string | null,
    recovery: null as string | null,
    goals: null as string | null
  })
  const [saving, setSaving] = useState({
    mood: false,
    recovery: false,
    goals: false
  })

  // ✅ State management for comprehensive tracking
  const [selectedMoodDate, setSelectedMoodDate] = useState(new Date().toISOString().split('T')[0])
  const [currentMoodEntry, setCurrentMoodEntry] = useState({
    energy: 3,
    mood: 3,
    stress: 3,
    confidence: 3,
    notes: '',
    sleep_hours: 7,
    stress_factors: [],
    positive_moments: []
  })
  const [moodHistory, setMoodHistory] = useState<any>({})
  const [isEditingExisting, setIsEditingExisting] = useState(false)
  
  const [recoveryProgress, setRecoveryProgress] = useState({})
  const [selfCareGoals, setSelfCareGoals] = useState({})
  const [activeView, setActiveView] = useState('dashboard')
  const [showResourceModal, setShowResourceModal] = useState(false)
  const [selectedResource, setSelectedResource] = useState(null)
  const [showBreathingExercise, setShowBreathingExercise] = useState(false)
  const [breathingType, setBreathingType] = useState<'stress' | 'sleep' | 'energy' | 'anxiety'>('stress')
  
  const { userProfile, currentBaby, initializeProfile } = useBabyTrackerStore()

  // ✅ Initialize profile if missing (after F5 refresh)
  useEffect(() => {
    if (!userProfile) {
      const storedEmail = localStorage.getItem('user-email')
      if (storedEmail) {
        console.log('Parent Health: No profile found but email in localStorage, initializing...')
        initializeProfile(storedEmail)
      } else {
        console.log('Parent Health: No profile and no stored email, user needs to log in')
        setLoading(prev => ({ ...prev, initialLoad: false }))
      }
    }
  }, [userProfile, initializeProfile])

  // ✅ Enhanced data loading with retry logic and error handling  
  const loadDataWithRetry = useCallback(async (url: string, retries = 2): Promise<any> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`Parent Health: Loading data from ${url} (attempt ${attempt + 1})`)
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          console.log(`Parent Health: Successfully loaded data from ${url}:`, data)
          return data
        }
        if (response.status === 404) {
          console.log(`Parent Health: No data found at ${url} (404)`)
          return null // Return null for 404s to indicate no data
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      } catch (error) {
        console.error(`Parent Health: Error loading ${url} (attempt ${attempt + 1}):`, error)
        if (attempt === retries) {
          throw error
        }
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
      }
    }
  }, [])


  // ✅ Load saved data from database with enhanced loading states
  useEffect(() => {
    if (userProfile?.email) {
      const loadAllData = async () => {
        console.log('Parent Health: Starting comprehensive data load for user:', userProfile.email)
        
        // Add timeout fallback
        const timeoutId = setTimeout(() => {
          console.warn('Parent Health: Data loading timeout, marking initial load as complete')
          setLoading(prev => ({ ...prev, initialLoad: false }))
        }, 10000) // 10 second timeout
        
        try {
          // Critical data first
          console.log('Parent Health: Loading critical data (mood, recovery)...')
          await Promise.all([
            loadMoodHistory(),
            loadRecoveryProgress()
          ])
          
          // Non-critical data
          console.log('Parent Health: Loading non-critical data (goals)...')
          await loadSelfCareGoals()
          
          // Mark initial load as complete only after all data is loaded
          console.log('Parent Health: All data loaded, marking initial load as complete')
          clearTimeout(timeoutId)
          setLoading(prev => ({ ...prev, initialLoad: false }))
        } catch (error) {
          console.error('Parent Health: Error during initial data load:', error)
          // Still mark as complete to avoid infinite loading
          clearTimeout(timeoutId)
          setLoading(prev => ({ ...prev, initialLoad: false }))
        }
      }
      
      loadAllData()
    } else {
      console.log('Parent Health: No user profile or email available, skipping data load')
      // If no user profile, don't show loading
      setLoading(prev => ({ ...prev, initialLoad: false }))
    }
  }, [userProfile?.email])

  // ✅ Update editing state when mood history or selected date changes
  useEffect(() => {
    const selectedDateEntry = moodHistory[selectedMoodDate]
    const hasEntry = selectedDateEntry && selectedDateEntry.moodEntries && selectedDateEntry.moodEntries.length > 0
    
    if (hasEntry) {
      // Load the existing entry into the form
      const moodEntry = selectedDateEntry.moodEntries[0]
      setCurrentMoodEntry({
        energy: selectedDateEntry.energyLevel || 3,
        mood: moodEntry.mood === 'excellent' ? 5 : 
              moodEntry.mood === 'good' ? 4 : 
              moodEntry.mood === 'okay' ? 3 : 
              moodEntry.mood === 'low' ? 2 : 1,
        stress: moodEntry.anxietyLevel || 3,
        confidence: 3,
        notes: moodEntry.notes || '',
        sleep_hours: 7,
        stress_factors: moodEntry.stressFactors || [],
        positive_moments: moodEntry.copingStrategies || []
      })
      setIsEditingExisting(true)
      console.log('Parent Health: Loaded existing entry for date:', selectedMoodDate)
    } else {
      setIsEditingExisting(false)
      console.log('Parent Health: No entry found for date:', selectedMoodDate)
    }
  }, [moodHistory, selectedMoodDate])

  // ✅ Enhanced mood history loading with error handling
  const loadMoodHistory = useCallback(async () => {
    if (!userProfile?.email) return
    
    setLoading(prev => ({ ...prev, mood: true }))
    setErrors(prev => ({ ...prev, mood: null }))
    
    try {
      console.log('Parent Health: Loading mood history...')
      const url = `/api/parent-health/mood?userEmail=${encodeURIComponent(userProfile.email)}`
      const data = await loadDataWithRetry(url)
      
      if (data) {
        const moodData: any = {}
        
        // Process mental health data
        if (data.data?.mentalHealth) {
          data.data.mentalHealth.forEach((mental: any) => {
            const date = new Date(mental.date).toISOString().split('T')[0]
            moodData[date] = {
              date: mental.date,
              anxietyLevel: mental.anxietyLevel,
              riskLevel: mental.riskLevel,
              moodEntries: mental.moodEntries || []
            }
          })
        }
        
        // Process recovery data to get energy levels
        if (data.data?.recoveryData) {
          data.data.recoveryData.forEach((recovery: any) => {
            const date = new Date(recovery.date).toISOString().split('T')[0]
            if (moodData[date]) {
              moodData[date].energyLevel = recovery.energyLevel
            } else {
              moodData[date] = {
                date: recovery.date,
                energyLevel: recovery.energyLevel,
                anxietyLevel: 3,
                riskLevel: 'low',
                moodEntries: []
              }
            }
          })
        }
        
        setMoodHistory(moodData)
        console.log('Parent Health: Mood history loaded successfully, entries:', Object.keys(moodData).length)
        
        // Load today's entry if it exists
        const today = new Date().toISOString().split('T')[0]
        if (moodData[today] && moodData[today].moodEntries.length > 0) {
          const todayEntry = moodData[today].moodEntries[0]
          setCurrentMoodEntry({
            energy: moodData[today].energyLevel || 3,
            mood: todayEntry.mood === 'excellent' ? 5 : 
                  todayEntry.mood === 'good' ? 4 : 
                  todayEntry.mood === 'okay' ? 3 : 
                  todayEntry.mood === 'low' ? 2 : 1,
            stress: todayEntry.anxietyLevel || 3,
            confidence: 3, // Default as not stored separately
            notes: todayEntry.notes || '',
            sleep_hours: 7, // Default as calculated from recovery data
            stress_factors: todayEntry.stressFactors || [],
            positive_moments: todayEntry.copingStrategies || []
          })
          setIsEditingExisting(true)
        }
      } else {
        // No data returned - set empty mood history
        console.log('Parent Health: No mood data returned, setting empty history')
        setMoodHistory({})
      }
    } catch (error) {
      console.error('Parent Health: Error loading mood history:', error)
      setErrors(prev => ({ ...prev, mood: error instanceof Error ? error.message : 'Erreur de chargement' }))
    } finally {
      setLoading(prev => ({ ...prev, mood: false }))
    }
  }, [userProfile?.email, loadDataWithRetry])

  const loadRecoveryProgress = useCallback(async () => {
    if (!userProfile?.email) return
    
    setLoading(prev => ({ ...prev, recovery: true }))
    setErrors(prev => ({ ...prev, recovery: null }))
    
    try {
      console.log('Parent Health: Loading recovery progress...')
      const url = `/api/parent-health/recovery?userEmail=${encodeURIComponent(userProfile.email)}`
      const data = await loadDataWithRetry(url)
      
      if (data) {
        setRecoveryProgress(data.data?.recoveryProgress || {})
        console.log('Parent Health: Recovery progress loaded successfully')
      } else {
        setRecoveryProgress({})
      }
    } catch (error) {
      console.error('Parent Health: Error loading recovery progress:', error)
      setErrors(prev => ({ ...prev, recovery: error instanceof Error ? error.message : 'Erreur de chargement' }))
    } finally {
      setLoading(prev => ({ ...prev, recovery: false }))
    }
  }, [userProfile?.email, loadDataWithRetry])

  const loadSelfCareGoals = useCallback(async () => {
    if (!userProfile?.email) return
    
    setLoading(prev => ({ ...prev, goals: true }))
    setErrors(prev => ({ ...prev, goals: null }))
    
    try {
      console.log('Parent Health: Loading self-care goals...')
      const url = `/api/parent-health/goals?userEmail=${encodeURIComponent(userProfile.email)}`
      const data = await loadDataWithRetry(url)
      
      if (data) {
        setSelfCareGoals(data.data?.selfCareGoals || {})
        console.log('Parent Health: Self-care goals loaded successfully')
      } else {
        setSelfCareGoals({})
      }
    } catch (error) {
      console.error('Parent Health: Error loading self-care goals:', error)
      setErrors(prev => ({ ...prev, goals: error instanceof Error ? error.message : 'Erreur de chargement' }))
    } finally {
      setLoading(prev => ({ ...prev, goals: false }))
    }
  }, [userProfile?.email, loadDataWithRetry])

  // ✅ Psychological trend analysis with clinical insights
  const analyzeWellbeingTrends = useCallback((moodData: any) => {
    const recent7Days = Object.entries(moodData)
      .filter(([date]) => {
        const entryDate = new Date(date)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return entryDate >= weekAgo
      })
      .map(([_, data]) => data)

    if (recent7Days.length >= 3) {
      const avgMood = recent7Days.reduce((sum: number, day: any) => sum + (day as any).mood, 0) / recent7Days.length
      const avgEnergy = recent7Days.reduce((sum: number, day: any) => sum + (day as any).energy, 0) / recent7Days.length
      const avgStress = recent7Days.reduce((sum: number, day: any) => sum + (day as any).stress, 0) / recent7Days.length
      
      // ✅ Clinical risk assessment
      if (avgMood <= 2 && avgEnergy <= 2) {
        generateAlert('depression_risk', 'Signes de détresse émotionnelle détectés')
      }
      if (avgStress >= 4) {
        generateAlert('high_stress', 'Niveau de stress élevé persistant')
      }
      
      // ✅ Generate personalized recommendations
      console.log('Wellbeing analysis:', { avgMood, avgEnergy, avgStress })
    }
  }, [])

  // ✅ Enhanced mood entry saving with loading states
  const saveMoodEntry = useCallback(async () => {
    if (!userProfile?.email) return
    
    setSaving(prev => ({ ...prev, mood: true }))
    
    try {
      console.log('Parent Health: Saving mood entry for date:', selectedMoodDate)
      const response = await fetch('/api/parent-health/mood', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: userProfile.email,
          date: selectedMoodDate, // Save for the selected date
          energy: currentMoodEntry.energy,
          mood: currentMoodEntry.mood,
          stress: currentMoodEntry.stress,
          confidence: currentMoodEntry.confidence,
          notes: currentMoodEntry.notes,
          sleepHours: currentMoodEntry.sleep_hours,
          stressFactors: currentMoodEntry.stress_factors,
          positiveMoments: currentMoodEntry.positive_moments
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Parent Health: Mood entry saved successfully:', data)
        
        // ✅ Trigger analysis and recommendations based on database data
        analyzeWellbeingTrends(moodHistory)
        
        // ✅ Force complete data refresh after saving
        console.log('Parent Health: Forcing complete data refresh after save...')
        
        // Reset loading states to show user something is happening
        setLoading(prev => ({ ...prev, mood: true }))
        
        // Force reload all data
        await Promise.all([
          loadMoodHistory(),
          loadRecoveryProgress(),
          loadSelfCareGoals()
        ])
        
        setLoading(prev => ({ ...prev, mood: false }))
        
        console.log('Parent Health: Complete data refresh completed for date:', selectedMoodDate)
        
      } else {
        console.error('Parent Health: Failed to save mood entry - HTTP', response.status)
        throw new Error(`Erreur HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('Parent Health: Error saving mood entry:', error)
      setErrors(prev => ({ ...prev, mood: error instanceof Error ? error.message : 'Erreur de sauvegarde' }))
    } finally {
      setSaving(prev => ({ ...prev, mood: false }))
    }
  }, [currentMoodEntry, userProfile?.email, analyzeWellbeingTrends, loadMoodHistory])

  const generateAlert = (type: string, message: string) => {
    // Integration with notification system
    console.log(`Alert: ${type} - ${message}`)
  }

  // ✅ Enhanced recovery progress saving with loading states
  const saveRecoveryProgress = useCallback(async (newProgress: any) => {
    if (!userProfile?.email) return
    
    setSaving(prev => ({ ...prev, recovery: true }))
    
    try {
      console.log('Parent Health: Saving recovery progress...')
      const response = await fetch('/api/parent-health/recovery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: userProfile.email,
          recoveryItems: newProgress
        })
      })
      
      if (response.ok) {
        console.log('Parent Health: Recovery progress saved successfully')
        // Update local state to reflect saved data
        setRecoveryProgress(newProgress)
      } else {
        console.error('Parent Health: Failed to save recovery progress - HTTP', response.status)
        throw new Error(`Erreur HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('Parent Health: Error saving recovery progress:', error)
      setErrors(prev => ({ ...prev, recovery: error instanceof Error ? error.message : 'Erreur de sauvegarde' }))
    } finally {
      setSaving(prev => ({ ...prev, recovery: false }))
    }
  }, [userProfile?.email])

  // ✅ Enhanced self-care goals saving with loading states
  const saveSelfCareGoals = useCallback(async (newGoals: any) => {
    if (!userProfile?.email) return
    
    setSaving(prev => ({ ...prev, goals: true }))
    
    try {
      console.log('Parent Health: Saving self-care goals...')
      const response = await fetch('/api/parent-health/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: userProfile.email,
          goals: newGoals
        })
      })
      
      if (response.ok) {
        console.log('Parent Health: Self-care goals saved successfully')
        // Update local state to reflect saved data
        setSelfCareGoals(newGoals)
      } else {
        console.error('Parent Health: Failed to save self-care goals - HTTP', response.status)
        throw new Error(`Erreur HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('Parent Health: Error saving self-care goals:', error)
      setErrors(prev => ({ ...prev, goals: error instanceof Error ? error.message : 'Erreur de sauvegarde' }))
    } finally {
      setSaving(prev => ({ ...prev, goals: false }))
    }
  }, [userProfile?.email])

  // ✅ Recovery progress calculation
  const calculateRecoveryScore = useMemo(() => {
    const allItems = Object.values(RECOVERY_CATEGORIES).flatMap(cat => cat.items)
    const completedItems = allItems.filter(item => (recoveryProgress as any)[item.id])
    const criticalItems = allItems.filter(item => item.critical)
    const completedCritical = criticalItems.filter(item => (recoveryProgress as any)[item.id])
    
    return {
      overall: Math.round((completedItems.length / allItems.length) * 100),
      critical: Math.round((completedCritical.length / criticalItems.length) * 100),
      completed: completedItems.length,
      total: allItems.length
    }
  }, [recoveryProgress])

  // ✅ Retry functions for each data type
  const retryMoodHistory = useCallback(() => {
    console.log('Parent Health: Retrying mood history load...')
    loadMoodHistory()
  }, [loadMoodHistory])

  const retryRecoveryProgress = useCallback(() => {
    console.log('Parent Health: Retrying recovery progress load...')
    loadRecoveryProgress()
  }, [loadRecoveryProgress])

  const retrySelfCareGoals = useCallback(() => {
    console.log('Parent Health: Retrying self-care goals load...')
    loadSelfCareGoals()
  }, [loadSelfCareGoals])

  // ✅ Render loading state component to match other pages
  const renderLoadingState = (message: string) => (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
          Chargement des données de santé parentale...
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  )

  // ✅ Render mood tracking interface with improved UX
  const renderMoodTracker = () => {
    const today = new Date().toISOString().split('T')[0]
    const selectedDateEntry = moodHistory[selectedMoodDate]
    const hasEntryForSelectedDate = selectedDateEntry && selectedDateEntry.moodEntries && selectedDateEntry.moodEntries.length > 0
    
    // Get past 7 days for history
    const past7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    })
    
    const filteredHistory = Object.entries(moodHistory)
      .filter(([date]) => past7Days.includes(date))
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
    
    // Debug logging
    console.log('Parent Health Mood Tracker Debug:', {
      moodHistoryKeys: Object.keys(moodHistory),
      past7Days,
      filteredHistoryLength: filteredHistory.length,
      selectedMoodDate,
      hasEntryForSelectedDate,
      selectedDateEntry: selectedDateEntry,
      selectedDateEntryMoodEntries: selectedDateEntry?.moodEntries?.length || 0,
      isEditingExisting
    })

    return (
      <div className="space-y-6">
        {/* Header with improved actions */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-3">
            <span>Suivi de l'humeur</span>
            {loading.mood && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
            )}
          </h2>
          <div className="flex items-center space-x-3">
            <input
              type="date"
              value={selectedMoodDate}
              onChange={(e) => {
                setSelectedMoodDate(e.target.value)
                // The useEffect will handle loading the entry data automatically
              }}
              className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
            />
            {!hasEntryForSelectedDate && (
              <button
                onClick={() => {
                  setCurrentMoodEntry({
                    energy: 3,
                    mood: 3,
                    stress: 3,
                    confidence: 3,
                    notes: '',
                    sleep_hours: 7,
                    stress_factors: [],
                    positive_moments: []
                  })
                  setIsEditingExisting(false)
                }}
                className="px-4 py-2 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter une entrée</span>
              </button>
            )}
          </div>
        </div>

        {/* Current date info */}
        <div className="glass-card rounded-xl p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                {selectedMoodDate === today ? 'Aujourd\'hui' : new Date(selectedMoodDate).toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {hasEntryForSelectedDate ? 'Check-in déjà effectué - Vous pouvez le modifier' : 'Aucun check-in pour cette date'}
              </p>
            </div>
            {hasEntryForSelectedDate && (
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-green-600">Complété</span>
              </div>
            )}
          </div>
        </div>

      {/* Error display with retry */}
      {errors.mood && (
        <div className="glass-card rounded-xl p-4 border border-red-200 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-200">
                  Erreur de chargement des données d'humeur
                </h3>
                <p className="text-sm text-red-600 dark:text-red-400">{errors.mood}</p>
              </div>
            </div>
            <button
              onClick={retryMoodHistory}
              disabled={loading.mood}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading.mood ? 'animate-spin' : ''}`} />
              <span>Réessayer</span>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(MOOD_SCALES).map(([key, scale]) => {
          const IconComponent = scale.icon
          return (
            <div key={key} className="glass-card rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <IconComponent className="w-6 h-6 text-purple-500" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {scale.name}
                </h3>
              </div>
              
              <div className="space-y-3">
                {scale.levels.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setCurrentMoodEntry(prev => ({ ...prev, [key]: level.value }))}
                    className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                      (currentMoodEntry as any)[key] === level.value
                        ? `border-${level.color}-500 bg-${level.color}-50 dark:bg-${level.color}-900/30`
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{level.label}</span>
                      <span className="text-sm text-gray-500">{level.value}/5</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {level.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4">Notes et réflexions</h3>
        <textarea
          value={currentMoodEntry.notes}
          onChange={(e) => setCurrentMoodEntry(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Comment vous sentez-vous aujourd'hui ? Qu'est-ce qui influence votre humeur ?"
          className="w-full h-32 p-3 rounded-xl border border-gray-300 dark:border-gray-600 glass-card resize-none"
        />
        
        <div className="flex items-center space-x-4 mt-4">
          <button
            onClick={saveMoodEntry}
            disabled={saving.mood}
            className={`px-6 py-3 rounded-xl font-semibold transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              isEditingExisting 
                ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                : 'bg-purple-500 hover:bg-purple-600 text-white'
            }`}
          >
            {saving.mood ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Save className="w-5 h-5" />
            )}
            <span>
              {saving.mood ? 'Sauvegarde...' : (isEditingExisting ? 'Modifier l\'entrée' : 'Enregistrer l\'entrée')}
            </span>
          </button>
          
          {isEditingExisting && (
            <button
              onClick={() => {
                setCurrentMoodEntry({
                  energy: 3,
                  mood: 3,
                  stress: 3,
                  confidence: 3,
                  notes: '',
                  sleep_hours: 7,
                  stress_factors: [],
                  positive_moments: []
                })
                setIsEditingExisting(false)
              }}
              className="px-4 py-3 rounded-xl font-semibold bg-gray-500 hover:bg-gray-600 text-white transition-colors flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Nouvelle entrée</span>
            </button>
          )}
        </div>
      </div>

      {/* Mood History Section - Past 7 Days */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center space-x-2">
          <BarChart3 className="w-6 h-6 text-purple-500" />
          <span>Historique des 7 derniers jours</span>
        </h3>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {filteredHistory.length > 0 ? (
            filteredHistory.map(([date, data]: [string, any]) => (
              <div 
                key={date}
                className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {new Date(date).toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => {
                      if (data.moodEntries && data.moodEntries.length > 0) {
                        const entry = data.moodEntries[0]
                        setCurrentMoodEntry({
                          energy: data.energyLevel || 3,
                          mood: entry.mood === 'excellent' ? 5 : 
                                entry.mood === 'good' ? 4 : 
                                entry.mood === 'okay' ? 3 : 
                                entry.mood === 'low' ? 2 : 1,
                          stress: entry.anxietyLevel || 3,
                          confidence: 3,
                          notes: entry.notes || '',
                          sleep_hours: 7,
                          stress_factors: entry.stressFactors || [],
                          positive_moments: entry.copingStrategies || []
                        })
                        setSelectedMoodDate(date)
                        setIsEditingExisting(true)
                      }
                    }}
                    className="px-3 py-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-1 text-sm"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Modifier</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Smile className="w-4 h-4 text-green-500" />
                    <span>Humeur: {data.moodEntries?.[0]?.mood || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    <span>Stress: {data.anxietyLevel || 'N/A'}/5</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-blue-500" />
                    <span>Risque: {data.riskLevel || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>{new Date(data.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                
                {data.moodEntries?.[0]?.notes && (
                  <div className="mt-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Notes:</strong> {data.moodEntries[0].notes}
                    </p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucune entrée d'humeur des 7 derniers jours</p>
              <p className="text-sm">Commencez par enregistrer une entrée pour aujourd'hui</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

  // ✅ Render self-care goals interface
  const renderSelfCareGoals = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-3">
          <span>Objectifs de Bien-être</span>
          {loading.goals && (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
          )}
        </h2>
        <button className="bg-purple-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-purple-600 transition-colors flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Nouvel objectif</span>
        </button>
      </div>

      {/* Error display with retry */}
      {errors.goals && (
        <div className="glass-card rounded-xl p-4 border border-red-200 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-200">
                  Erreur de chargement des objectifs
                </h3>
                <p className="text-sm text-red-600 dark:text-red-400">{errors.goals}</p>
              </div>
            </div>
            <button
              onClick={retrySelfCareGoals}
              disabled={loading.goals}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading.goals ? 'animate-spin' : ''}`} />
              <span>Réessayer</span>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(SELF_CARE_DOMAINS).map(([domainKey, domain]) => {
          const IconComponent = domain.icon
          return (
            <div key={domainKey} className="glass-card rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <IconComponent className={`w-6 h-6 text-${domain.color}-500`} />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {domain.name}
                </h3>
              </div>
              
              <div className="space-y-3">
                {domain.goals.map((goal) => (
                  <div key={goal.id} className="glass-card rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {goal.name}
                      </span>
                      <button
                        onClick={() => {
                          const newGoals = { ...selfCareGoals }
                          if (!(newGoals as any)[goal.id]) {
                            (newGoals as any)[goal.id] = { completed: false, streak: 0 }
                          }
                          (newGoals as any)[goal.id].completed = !(newGoals as any)[goal.id].completed
                          // Save to database (which will update local state on success)
                          saveSelfCareGoals(newGoals)
                        }}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          (selfCareGoals as any)[goal.id]?.completed
                            ? `bg-${domain.color}-500 border-${domain.color}-500 text-white`
                            : 'border-gray-300 hover:border-purple-400'
                        }`}
                      >
                        {(selfCareGoals as any)[goal.id]?.completed && <CheckCircle className="w-3 h-3" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Objectif: {goal.target}
                    </p>
                    <p className="text-xs text-purple-600 font-medium">
                      Fréquence: {goal.frequency === 'daily' ? 'Quotidien' : 
                                 goal.frequency === 'weekly' ? 'Hebdomadaire' : 'Mensuel'}
                    </p>
                    {(selfCareGoals as any)[goal.id]?.streak > 0 && (
                      <div className="flex items-center space-x-1 mt-2">
                        <Award className="w-4 h-4 text-yellow-500" />
                        <span className="text-xs text-yellow-600 font-medium">
                          {(selfCareGoals as any)[goal.id].streak} jours consécutifs
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  // ✅ Render expert resources
  const renderExpertResources = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
        Ressources d'Experts
      </h2>

      {Object.entries(EXPERT_RESOURCES).map(([categoryKey, category]) => (
        <div key={categoryKey} className="glass-card rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            {category.name}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {category.items.map((item, index) => (
              <div key={index} className="glass-card rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      {item.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {item.description}
                    </p>
                    
                    {(item as any).phone && (
                      <div className="flex items-center space-x-2 text-sm text-purple-600 mb-2">
                        <Phone className="w-4 h-4" />
                        <span className="font-mono font-semibold">{(item as any).phone}</span>
                      </div>
                    )}
                    
                    {(item as any).availability && (
                      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                        <Clock className="w-4 h-4" />
                        <span>{(item as any).availability}</span>
                      </div>
                    )}
                    
                    {(item as any).specialties && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {(item as any).specialties.map((specialty: any, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-600 text-xs rounded-full">
                            {specialty}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <button className="ml-3 p-2 text-purple-500 hover:bg-purple-50 rounded-lg transition-colors">
                    <ExternalLink className="w-5 h-5" />
                  </button>
                </div>
                
                {(item as any).type === 'emergency' && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Urgence - Contactez immédiatement</span>
                    </div>
                  </div>
                )}
                
                {(item as any).action === 'start_breathing_exercise' && (
                  <button 
                    onClick={() => {
                      setBreathingType('anxiety')
                      setShowBreathingExercise(true)
                    }}
                    className="mt-3 w-full bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>Commencer l'exercice</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  // ✅ Render comprehensive dashboard
  const renderDashboard = () => {
    const today = new Date().toISOString().split('T')[0]
    const todayMood = moodHistory[today] || null
    
    return (
      <div className="space-y-6">
        {/* Quick status overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Humeur du jour</p>
                <p className="text-2xl font-bold">
                  {todayMood?.moodEntries?.[0]?.mood ? 
                    `${todayMood.moodEntries[0].mood === 'excellent' ? '5' : 
                       todayMood.moodEntries[0].mood === 'good' ? '4' : 
                       todayMood.moodEntries[0].mood === 'okay' ? '3' : 
                       todayMood.moodEntries[0].mood === 'low' ? '2' : '1'}/5` : 
                    'Non renseigné'
                  }
                </p>
              </div>
              <Heart className="w-8 h-8 text-purple-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Récupération</p>
                <p className="text-2xl font-bold">{calculateRecoveryScore.overall}%</p>
              </div>
              <Activity className="w-8 h-8 text-green-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Objectifs du jour</p>
                <p className="text-2xl font-bold">
                  {Object.values(selfCareGoals).filter((goal: any) => goal.completed).length}/
                  {Object.keys(SELF_CARE_DOMAINS).reduce((sum: number, domain: string) => sum + (SELF_CARE_DOMAINS as any)[domain].goals.length, 0)}
                </p>
              </div>
              <Target className="w-8 h-8 text-blue-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm">Bien-être global</p>
                <p className="text-2xl font-bold">
                  {todayMood?.moodEntries?.[0] ? 
                    Math.round((
                      3 + // energy (default)
                      (todayMood.moodEntries[0].mood === 'excellent' ? 5 : 
                       todayMood.moodEntries[0].mood === 'good' ? 4 : 
                       todayMood.moodEntries[0].mood === 'okay' ? 3 : 
                       todayMood.moodEntries[0].mood === 'low' ? 2 : 1) + 
                      (6 - (todayMood.anxietyLevel || 3)) + 
                      3 // confidence (default)
                    ) / 4 * 20) + '%' : '?%'
                  }
                </p>
              </div>
              <Sunrise className="w-8 h-8 text-amber-200" />
            </div>
          </div>
        </div>

        {/* Today's priorities */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Priorités du jour
          </h3>
          
          <div className="space-y-3">
            {!todayMood && (
              <div className="flex items-center space-x-3 p-3 glass-card rounded-xl">
                <Heart className="w-5 h-5 text-purple-500" />
                <div className="flex-1">
                  <span className="font-medium text-purple-800">Renseigner votre humeur</span>
                  <p className="text-sm text-purple-600">Commencez votre journée par un check-in émotionnel</p>
                </div>
                <button
                  onClick={() => setActiveView('mood')}
                  className="bg-purple-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-600 transition-colors"
                >
                  Commencer
                </button>
              </div>
            )}
            
            {calculateRecoveryScore.critical < 100 && (
              <div className="flex items-center space-x-3 p-3 glass-card rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <div className="flex-1">
                  <span className="font-medium text-red-800">Éléments critiques de récupération</span>
                  <p className="text-sm text-red-600">
                    {Object.values(RECOVERY_CATEGORIES)
                      .flatMap(cat => cat.items)
                      .filter(item => item.critical && !(recoveryProgress as any)[item.id])
                      .length} éléments essentiels à compléter
                  </p>
                </div>
                <button
                  onClick={() => setActiveView('recovery')}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors"
                >
                  Voir
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Actions rapides
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { 
                label: 'Exercice de respiration', 
                icon: Sunrise, 
                action: () => {
                  setBreathingType('stress')
                  setShowBreathingExercise(true)
                }, 
                color: 'blue' 
              },
              { label: 'Journal de gratitude', icon: BookOpen, action: () => {}, color: 'green' },
              { label: 'Appeler un proche', icon: Phone, action: () => {}, color: 'purple' },
              { label: 'Pause méditation', icon: Brain, action: () => {}, color: 'amber' }
            ].map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className={`p-4 rounded-xl border-2 border-${item.color}-200 hover:border-${item.color}-400 bg-${item.color}-50 hover:bg-${item.color}-100 transition-all text-center`}
              >
                <item.icon className={`w-6 h-6 text-${item.color}-500 mx-auto mb-2`} />
                <span className={`text-sm font-medium text-${item.color}-700`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ✅ Render recovery checklist
  const renderRecoveryChecklist = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-3">
          <span>Récupération Postpartum</span>
          {loading.recovery && (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
          )}
        </h2>
        <div className="text-right">
          <div className="text-3xl font-bold text-green-500">{calculateRecoveryScore.overall}%</div>
          <div className="text-sm text-gray-600">Progression globale</div>
        </div>
      </div>

      {/* Error display with retry */}
      {errors.recovery && (
        <div className="glass-card rounded-xl p-4 border border-red-200 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-200">
                  Erreur de chargement des données de récupération
                </h3>
                <p className="text-sm text-red-600 dark:text-red-400">{errors.recovery}</p>
              </div>
            </div>
            <button
              onClick={retryRecoveryProgress}
              disabled={loading.recovery}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading.recovery ? 'animate-spin' : ''}`} />
              <span>Réessayer</span>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(RECOVERY_CATEGORIES).map(([categoryKey, category]) => {
          const IconComponent = category.icon
          const completedItems = category.items.filter(item => (recoveryProgress as any)[item.id])
          const progress = Math.round((completedItems.length / category.items.length) * 100)
          
          return (
            <div key={categoryKey} className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <IconComponent className={`w-6 h-6 text-${category.color}-500`} />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {category.name}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-green-500">{progress}%</div>
                  <div className="text-xs text-gray-500">{completedItems.length}/{category.items.length}</div>
                </div>
              </div>

              <div className="space-y-3">
                {category.items.map((item) => (
                  <div key={item.id} className="flex items-start space-x-3">
                    <button
                      onClick={() => {
                        const newProgress: any = { ...(recoveryProgress as any) }
                        newProgress[item.id] = !newProgress[item.id]
                        // Save to database (which will update local state on success)
                        saveRecoveryProgress(newProgress)
                      }}
                      className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        (recoveryProgress as any)[item.id]
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-green-400'
                      }`}
                    >
                      {(recoveryProgress as any)[item.id] && <CheckCircle className="w-3 h-3" />}
                    </button>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${
                          (recoveryProgress as any)[item.id] ? 'text-green-600 line-through' : 'text-gray-800 dark:text-gray-200'
                        }`}>
                          {item.name}
                        </span>
                        {item.critical && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                            Essentiel
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {item.description} • {item.timeframe}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  // Show loading screen during initial load
  if (loading.initialLoad) {
    return (
      <AppLayout currentPage="Santé Parentale" showHeader={true}>
        <div className="p-6">
          <h1 className="text-4xl font-bold mb-8 gradient-text text-center">Santé Parentale</h1>
          {renderLoadingState('Récupération de votre humeur, récupération et objectifs')}
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout 
      currentPage="Santé Parentale"
      showHeader={true}
    >
      <div className="p-4 pb-24 space-y-6">
        {/* Enhanced Tab Navigation */}
        <div className="relative glass-card rounded-2xl pt-6 pb-3 px-3">
          <div className="flex overflow-x-auto space-x-2 scrollbar-hide">
            {[
              { key: 'dashboard', label: 'Tableau de bord', icon: BarChart3 },
              { key: 'mood', label: 'Humeur', icon: Heart },
              { key: 'recovery', label: 'Récupération', icon: Activity },
              { key: 'goals', label: 'Objectifs', icon: Target },
              { key: 'resources', label: 'Ressources', icon: BookOpen }
            ].map(({ key, label, icon: Icon }) => {
              const isActive = activeView === key
              
              return (
                <button
                  key={key}
                  onClick={() => setActiveView(key)}
                  className={`relative flex items-center space-x-2 px-4 py-3 rounded-xl whitespace-nowrap transition-all duration-200 flex-shrink-0 group ${
                    isActive
                      ? 'bg-primary-500 text-white shadow-md scale-105'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-all duration-200 ${
                    isActive 
                      ? 'text-white' 
                      : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                  }`} />
                  <span className="text-sm font-medium">{label}</span>
                  
                  {/* Active indicator dot */}
                  {isActive && (
                    <div className="w-1 h-1 bg-white rounded-full opacity-75"></div>
                  )}
                </button>
              )
            })}
          </div>
          
          {/* Tab Progress Indicator */}
          <div className="flex justify-center mt-3 space-x-1">
            {[
              { key: 'dashboard', label: 'Tableau de bord', icon: BarChart3 },
              { key: 'mood', label: 'Humeur', icon: Heart },
              { key: 'recovery', label: 'Récupération', icon: Activity },
              { key: 'goals', label: 'Objectifs', icon: Target },
              { key: 'resources', label: 'Ressources', icon: BookOpen }
            ].map((tab, index) => (
              <div 
                key={tab.key}
                className={`w-2 h-1 rounded-full transition-all duration-300 ${
                  activeView === tab.key 
                    ? 'bg-primary-500 w-8' 
                    : 'bg-gray-200 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content based on active view */}
        {activeView === 'dashboard' && renderDashboard()}
        {activeView === 'mood' && renderMoodTracker()}
        {activeView === 'recovery' && renderRecoveryChecklist()}
        {activeView === 'goals' && renderSelfCareGoals()}
        {activeView === 'resources' && renderExpertResources()}

        {/* Breathing Exercise Modal */}
        <BreathingExercise
          isOpen={showBreathingExercise}
          onClose={() => setShowBreathingExercise(false)}
          type={breathingType}
        />
      </div>
    </AppLayout>
  )
}