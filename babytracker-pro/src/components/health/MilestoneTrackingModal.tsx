'use client'

import React, { useState, useEffect } from 'react'
import { X, CheckCircle, Clock, AlertTriangle, Star, Target, Brain, Heart, Users } from 'lucide-react'

interface MilestoneTrackingModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (milestoneData: MilestoneData) => void
  babyBirthDate: Date
  currentMilestones?: MilestoneData[]
  initialData?: Partial<MilestoneData>
  isLoading?: boolean
}

export interface MilestoneData {
  category: 'motor' | 'language' | 'cognitive' | 'social' | 'adaptive'
  milestone: string
  description: string
  expectedAgeRange: {
    minWeeks: number
    maxWeeks: number
    minMonths: number
    maxMonths: number
  }
  achieved: boolean
  achievedDate?: Date
  notes?: string
  concernLevel?: 'none' | 'mild' | 'moderate' | 'significant'
  nextSteps?: string[]
  parentObservations?: string
}

// Comprehensive pediatric milestone database based on WHO, Denver II, and Bayley scales
const MILESTONE_DATABASE = {
  motor: {
    name: 'Motricité',
    icon: Target,
    color: 'blue',
    milestones: [
      // 0-3 months
      {
        id: 'head-control',
        milestone: 'Contrôle de la tête',
        description: 'Tient sa tête droite en position verticale pendant quelques secondes',
        minWeeks: 8, maxWeeks: 16,
        concernThreshold: 20,
        nextSteps: ['Encourage tummy time', 'Support head during play'],
        redFlags: ['Floppy head after 4 months', 'Unable to lift head during tummy time at 3 months']
      },
      {
        id: 'rolls-back-to-front',
        milestone: 'Se retourne dos-ventre',
        description: 'Se retourne du dos vers le ventre de manière intentionnelle',
        minWeeks: 12, maxWeeks: 24,
        concernThreshold: 28,
        nextSteps: ['Practice supervised tummy time', 'Place toys to encourage rolling'],
        redFlags: ['No rolling by 6 months', 'Persistent asymmetric movements']
      },
      {
        id: 'sits-without-support',
        milestone: 'S\'assoit sans soutien',
        description: 'Peut s\'asseoir sans appui pendant au moins 30 secondes',
        minWeeks: 20, maxWeeks: 32,
        concernThreshold: 36,
        nextSteps: ['Practice supported sitting', 'Use pillows for safety'],
        redFlags: ['Cannot sit with support by 8 months', 'Falls backward frequently after 9 months']
      },
      {
        id: 'crawls',
        milestone: 'Rampe ou fait du quatre pattes',
        description: 'Se déplace en rampant ou en faisant du quatre pattes',
        minWeeks: 24, maxWeeks: 40,
        concernThreshold: 44,
        nextSteps: ['Create safe crawling space', 'Place toys just out of reach'],
        redFlags: ['No crawling by 12 months', 'Asymmetric crawling pattern']
      },
      {
        id: 'pulls-to-stand',
        milestone: 'Se met debout en se tirant',
        description: 'Se tire pour se mettre debout en s\'aidant des meubles',
        minWeeks: 32, maxWeeks: 48,
        concernThreshold: 52,
        nextSteps: ['Provide stable furniture for pulling up', 'Baby-proof sharp edges'],
        redFlags: ['No pulling to stand by 15 months', 'Unable to bear weight on legs']
      },
      {
        id: 'walks-independently',
        milestone: 'Marche de manière indépendante',
        description: 'Fait plusieurs pas seul sans soutien',
        minWeeks: 40, maxWeeks: 64,
        concernThreshold: 72,
        nextSteps: ['Encourage bare feet walking', 'Create safe walking paths'],
        redFlags: ['No independent walking by 18 months', 'Persistent toe walking after 2 years']
      }
    ]
  },
  language: {
    name: 'Langage',
    icon: Heart,
    color: 'pink',
    milestones: [
      {
        id: 'social-smile',
        milestone: 'Premier sourire social',
        description: 'Sourit en réponse aux interactions sociales',
        minWeeks: 4, maxWeeks: 12,
        concernThreshold: 16,
        nextSteps: ['Make eye contact during interactions', 'Use exaggerated facial expressions'],
        redFlags: ['No social smile by 4 months', 'No eye contact by 3 months']
      },
      {
        id: 'coos-and-laughs',
        milestone: 'Gazouillements et rires',
        description: 'Produit des sons comme "aah", "ooh" et rit aux éclats',
        minWeeks: 8, maxWeeks: 20,
        concernThreshold: 24,
        nextSteps: ['Talk and sing to baby frequently', 'Respond to baby\'s vocalizations'],
        redFlags: ['No vocalizations by 6 months', 'Loss of previously acquired sounds']
      },
      {
        id: 'babbling',
        milestone: 'Babillage',
        description: 'Produit des syllabes comme "ba-ba", "da-da", "ma-ma"',
        minWeeks: 20, maxWeeks: 36,
        concernThreshold: 40,
        nextSteps: ['Repeat baby\'s sounds back', 'Name objects during daily activities'],
        redFlags: ['No babbling by 10 months', 'No consonant sounds by 12 months']
      },
      {
        id: 'first-word',
        milestone: 'Premier mot',
        description: 'Dit son premier mot avec intention (souvent "mama" ou "papa")',
        minWeeks: 36, maxWeeks: 56,
        concernThreshold: 64,
        nextSteps: ['Celebrate and repeat first words', 'Read books together daily'],
        redFlags: ['No words by 16 months', 'No attempt to communicate by 15 months']
      },
      {
        id: 'two-word-phrases',
        milestone: 'Phrases de deux mots',
        description: 'Combine deux mots pour former des phrases simples',
        minWeeks: 72, maxWeeks: 104,
        concernThreshold: 112,
        nextSteps: ['Expand on child\'s utterances', 'Use simple, clear sentences'],
        redFlags: ['No two-word phrases by 2.5 years', 'Vocabulary less than 50 words by 2 years']
      }
    ]
  },
  cognitive: {
    name: 'Cognitif',
    icon: Brain,
    color: 'purple',
    milestones: [
      {
        id: 'tracks-objects',
        milestone: 'Suit des objets du regard',
        description: 'Suit des objets en mouvement avec les yeux de droite à gauche',
        minWeeks: 6, maxWeeks: 16,
        concernThreshold: 20,
        nextSteps: ['Move colorful toys slowly in front of baby', 'Use high-contrast patterns'],
        redFlags: ['No visual tracking by 4 months', 'Does not focus on faces']
      },
      {
        id: 'object-permanence',
        milestone: 'Permanence de l\'objet',
        description: 'Comprend qu\'un objet existe même quand il ne le voit pas',
        minWeeks: 32, maxWeeks: 48,
        concernThreshold: 52,
        nextSteps: ['Play peek-a-boo games', 'Hide toys partially and encourage finding'],
        redFlags: ['No search for hidden objects by 12 months', 'No interest in cause-and-effect toys']
      },
      {
        id: 'imitates-actions',
        milestone: 'Imite les actions',
        description: 'Copie les gestes et actions simples des adultes',
        minWeeks: 36, maxWeeks: 56,
        concernThreshold: 64,
        nextSteps: ['Demonstrate simple actions repeatedly', 'Clap hands and encourage imitation'],
        redFlags: ['No imitation by 15 months', 'No pointing or gesture use by 16 months']
      },
      {
        id: 'solves-simple-problems',
        milestone: 'Résout des problèmes simples',
        description: 'Utilise des objets comme outils pour atteindre des buts',
        minWeeks: 48, maxWeeks: 72,
        concernThreshold: 80,
        nextSteps: ['Provide puzzles and stacking toys', 'Demonstrate problem-solving strategies'],
        redFlags: ['No functional play by 18 months', 'No understanding of simple instructions by 2 years']
      }
    ]
  },
  social: {
    name: 'Social-Émotionnel',
    icon: Users,
    color: 'green',
    milestones: [
      {
        id: 'recognizes-faces',
        milestone: 'Reconnaît les visages familiers',
        description: 'Montre une préférence pour les visages familiers vs inconnus',
        minWeeks: 8, maxWeeks: 24,
        concernThreshold: 28,
        nextSteps: ['Spend quality face-to-face time', 'Talk to baby during care routines'],
        redFlags: ['No preference for familiar faces by 6 months', 'Avoids eye contact consistently']
      },
      {
        id: 'stranger-anxiety',
        milestone: 'Anxiété face aux étrangers',
        description: 'Montre de la méfiance ou de la peur face aux personnes inconnues',
        minWeeks: 24, maxWeeks: 40,
        concernThreshold: 44,
        nextSteps: ['Gradual introduction to new people', 'Stay close during new encounters'],
        redFlags: ['No stranger awareness by 10 months', 'Extreme fear of all new people after 2 years']
      },
      {
        id: 'separation-anxiety',
        milestone: 'Anxiété de séparation',
        description: 'Exprime de la détresse quand séparé des parents principaux',
        minWeeks: 32, maxWeeks: 52,
        concernThreshold: 56,
        nextSteps: ['Practice short separations', 'Maintain consistent goodbye routines'],
        redFlags: ['No attachment behaviors by 12 months', 'Severe separation anxiety after 3 years']
      },
      {
        id: 'parallel-play',
        milestone: 'Jeu en parallèle',
        description: 'Joue à côté d\'autres enfants sans interagir directement',
        minWeeks: 64, maxWeeks: 104,
        concernThreshold: 112,
        nextSteps: ['Arrange playdates with peers', 'Model sharing and turn-taking'],
        redFlags: ['No interest in other children by 2.5 years', 'Aggressive behavior with peers consistently']
      }
    ]
  },
  adaptive: {
    name: 'Adaptatif',
    icon: Star,
    color: 'yellow',
    milestones: [
      {
        id: 'self-feeding-finger-foods',
        milestone: 'Mange avec les doigts',
        description: 'Prend de petits morceaux de nourriture et les porte à la bouche',
        minWeeks: 32, maxWeeks: 48,
        concernThreshold: 52,
        nextSteps: ['Offer appropriate finger foods', 'Let baby explore textures'],
        redFlags: ['Cannot pick up small objects by 12 months', 'Refuses all solid foods by 15 months']
      },
      {
        id: 'drinks-from-cup',
        milestone: 'Boit dans un gobelet',
        description: 'Peut boire dans un gobelet avec de l\'aide ou un gobelet à bec',
        minWeeks: 40, maxWeeks: 64,
        concernThreshold: 72,
        nextSteps: ['Practice with sippy cup', 'Demonstrate drinking motion'],
        redFlags: ['Cannot hold cup by 18 months', 'Refuses all liquids except bottle after 2 years']
      },
      {
        id: 'indicates-wet-diaper',
        milestone: 'Indique couche souillée',
        description: 'Montre ou communique quand la couche est mouillée ou sale',
        minWeeks: 64, maxWeeks: 112,
        concernThreshold: 120,
        nextSteps: ['Point out diaper changes', 'Use words like "wet" and "dry"'],
        redFlags: ['No awareness of bodily functions by 3 years', 'No communication of needs by 2.5 years']
      },
      {
        id: 'helps-with-dressing',
        milestone: 'Aide à l\'habillage',
        description: 'Coopère en tendant les bras/jambes ou en retirant chaussettes/chapeaux',
        minWeeks: 48, maxWeeks: 80,
        concernThreshold: 88,
        nextSteps: ['Encourage participation in dressing', 'Choose clothes with large openings'],
        redFlags: ['No cooperation with dressing by 20 months', 'Cannot remove any clothing by 2.5 years']
      }
    ]
  }
}

const MilestoneTrackingModal: React.FC<MilestoneTrackingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  babyBirthDate,
  currentMilestones = [],
  initialData,
  isLoading = false
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedMilestone, setSelectedMilestone] = useState<any>(null)
  const [formData, setFormData] = useState<Partial<MilestoneData>>({
    achieved: false,
    concernLevel: 'none'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Calculate baby's current age
  const currentAgeWeeks = Math.floor((Date.now() - babyBirthDate.getTime()) / (1000 * 60 * 60 * 24 * 7))
  const currentAgeMonths = Math.floor(currentAgeWeeks / 4.33)

  useEffect(() => {
    if (initialData) {
      const processedData = {
        ...initialData,
        achievedDate: initialData.achievedDate ? new Date(initialData.achievedDate) : undefined,
      }
      setFormData(processedData)
      if (initialData.category && initialData.milestone) {
        const category = MILESTONE_DATABASE[initialData.category]
        const milestone = category?.milestones.find(m => m.milestone === initialData.milestone)
        if (milestone) {
          setSelectedCategory(initialData.category)
          setSelectedMilestone(milestone)
        }
      }
    }
  }, [initialData])

  useEffect(() => {
    if (!isOpen) {
      setFormData({ achieved: false, concernLevel: 'none' })
      setSelectedCategory(null)
      setSelectedMilestone(null)
      setErrors({})
    }
  }, [isOpen])

  const getAgeAppropriatenessMilestones = (categoryKey: string) => {
    const category = MILESTONE_DATABASE[categoryKey as keyof typeof MILESTONE_DATABASE]
    return category.milestones.map(milestone => {
      const minMonths = Math.floor(milestone.minWeeks / 4.33)
      const maxMonths = Math.floor(milestone.maxWeeks / 4.33)
      const concernMonths = Math.floor(milestone.concernThreshold / 4.33)
      
      let status = 'upcoming'
      let priority = 'low'
      
      // Check if already achieved
      const existingMilestone = currentMilestones.find(m => 
        m.milestone === milestone.milestone && m.category === categoryKey
      )
      
      if (existingMilestone?.achieved) {
        status = 'achieved'
        priority = 'low'
      } else if (currentAgeWeeks >= milestone.concernThreshold) {
        status = 'delayed'
        priority = 'high'
      } else if (currentAgeWeeks >= milestone.maxWeeks) {
        status = 'overdue'
        priority = 'high'
      } else if (currentAgeWeeks >= milestone.minWeeks) {
        status = 'due'
        priority = 'medium'
      } else if (currentAgeWeeks >= milestone.minWeeks - 8) { // 2 months before
        status = 'approaching'
        priority = 'low'
      }

      return {
        ...milestone,
        minMonths,
        maxMonths,
        concernMonths,
        status,
        priority,
        existingMilestone
      }
    })
  }

  const getConcernLevel = (milestone: any): 'none' | 'mild' | 'moderate' | 'significant' => {
    if (currentAgeWeeks < milestone.minWeeks) return 'none'
    if (currentAgeWeeks <= milestone.maxWeeks) return 'none'
    if (currentAgeWeeks <= milestone.concernThreshold) return 'mild'
    if (currentAgeWeeks <= milestone.concernThreshold + 8) return 'moderate'
    return 'significant'
  }

  const handleMilestoneSelect = (categoryKey: string, milestone: any) => {
    setSelectedCategory(categoryKey)
    setSelectedMilestone(milestone)
    
    const concernLevel = getConcernLevel(milestone)
    
    setFormData({
      category: categoryKey as any,
      milestone: milestone.milestone,
      description: milestone.description,
      expectedAgeRange: {
        minWeeks: milestone.minWeeks,
        maxWeeks: milestone.maxWeeks,
        minMonths: milestone.minMonths,
        maxMonths: milestone.maxMonths
      },
      achieved: milestone.existingMilestone?.achieved || false,
      achievedDate: milestone.existingMilestone?.achievedDate,
      concernLevel: concernLevel,
      nextSteps: milestone.nextSteps,
      notes: milestone.existingMilestone?.notes || '',
      parentObservations: milestone.existingMilestone?.parentObservations || ''
    })
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (formData.achieved && !formData.achievedDate) {
      newErrors.achievedDate = 'Date d\'acquisition requise'
    }
    
    if (formData.concernLevel === 'significant' && !formData.notes) {
      newErrors.notes = 'Notes requises pour un retard significatif'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm() || !selectedMilestone || submitting) return
    
    setSubmitting(true)
    try {
    
    const milestoneData: MilestoneData = {
      category: formData.category!,
      milestone: formData.milestone!,
      description: formData.description!,
      expectedAgeRange: formData.expectedAgeRange!,
      achieved: formData.achieved!,
      achievedDate: formData.achievedDate,
      notes: formData.notes,
      concernLevel: formData.concernLevel,
      nextSteps: formData.nextSteps,
      parentObservations: formData.parentObservations
    }
    
      await onSave(milestoneData)
    } catch (error) {
      console.error('Error submitting milestone:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'achieved': return 'green'
      case 'due': return 'blue'
      case 'approaching': return 'yellow'
      case 'overdue': return 'orange'
      case 'delayed': return 'red'
      default: return 'gray'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'achieved': return 'Acquis'
      case 'due': return 'Attendu'
      case 'approaching': return 'Bientôt'
      case 'overdue': return 'En retard'
      case 'delayed': return 'Retard significatif'
      case 'upcoming': return 'À venir'
      default: return status
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Suivi des acquisitions développementales
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Âge: {currentAgeMonths} mois ({currentAgeWeeks} semaines) • Né(e) le {babyBirthDate.toLocaleDateString()}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Category Selection or Milestone View */}
          {!selectedMilestone ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Domaines de développement
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(MILESTONE_DATABASE).map(([key, category]) => {
                    const milestones = getAgeAppropriatenessMilestones(key)
                    const achievedCount = milestones.filter(m => m.status === 'achieved').length
                    const dueCount = milestones.filter(m => ['due', 'overdue', 'delayed'].includes(m.status)).length
                    const CategoryIcon = category.icon
                    
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedCategory(key)}
                        className={`p-4 border-2 rounded-xl hover:shadow-lg transition-all ${
                          selectedCategory === key 
                            ? `border-${category.color}-400 bg-${category.color}-50 dark:bg-${category.color}-900/20`
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          <CategoryIcon className={`w-6 h-6 text-${category.color}-600`} />
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {category.name}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <div>✓ {achievedCount} acquis</div>
                          {dueCount > 0 && <div>⏳ {dueCount} à évaluer</div>}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Milestone List for Selected Category */}
              {selectedCategory && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {MILESTONE_DATABASE[selectedCategory as keyof typeof MILESTONE_DATABASE].name} - Étapes de développement
                    </h4>
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="text-sm text-gray-600 hover:text-gray-700"
                    >
                      Retour aux catégories
                    </button>
                  </div>

                  <div className="grid gap-3">
                    {getAgeAppropriatenessMilestones(selectedCategory).map((milestone, index) => {
                      const statusColor = getStatusColor(milestone.status)
                      
                      return (
                        <button
                          key={index}
                          onClick={() => handleMilestoneSelect(selectedCategory, milestone)}
                          disabled={milestone.status === 'upcoming' && currentAgeWeeks < milestone.minWeeks - 8}
                          className={`w-full text-left p-4 border-2 rounded-lg hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            milestone.status === 'achieved' 
                              ? 'border-green-200 bg-green-50 dark:bg-green-900/20' :
                            milestone.status === 'delayed'
                              ? 'border-red-200 bg-red-50 dark:bg-red-900/20' :
                            milestone.status === 'overdue'
                              ? 'border-orange-200 bg-orange-50 dark:bg-orange-900/20' :
                            milestone.status === 'due'
                              ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/20' :
                              'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                {milestone.status === 'achieved' && (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                )}
                                {milestone.status === 'delayed' && (
                                  <AlertTriangle className="w-5 h-5 text-red-600" />
                                )}
                                {['due', 'overdue'].includes(milestone.status) && (
                                  <Clock className="w-5 h-5 text-orange-600" />
                                )}
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {milestone.milestone}
                                </span>
                              </div>
                              
                              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {milestone.description}
                              </div>
                              
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Âge attendu: {milestone.minMonths}-{milestone.maxMonths} mois
                                {milestone.status === 'achieved' && milestone.existingMilestone?.achievedDate && (
                                  <span className="ml-2 text-green-600">
                                    (Acquis le {milestone.existingMilestone.achievedDate.toLocaleDateString()})
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="ml-3">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                statusColor === 'green' ? 'bg-green-100 text-green-700' :
                                statusColor === 'red' ? 'bg-red-100 text-red-700' :
                                statusColor === 'orange' ? 'bg-orange-100 text-orange-700' :
                                statusColor === 'blue' ? 'bg-blue-100 text-blue-700' :
                                statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {getStatusLabel(milestone.status)}
                              </span>
                            </div>
                          </div>

                          {/* Red flags warning */}
                          {milestone.status === 'delayed' && milestone.redFlags && (
                            <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                              <div className="text-xs text-red-800 dark:text-red-200 font-medium">
                                ⚠️ Signaux d'alarme:
                              </div>
                              <div className="text-xs text-red-700 dark:text-red-300">
                                {milestone.redFlags.join(' • ')}
                              </div>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Milestone Detail Form */
            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg bg-${MILESTONE_DATABASE[formData.category!].color}-100`}>
                  {React.createElement(MILESTONE_DATABASE[formData.category!].icon, {
                    className: `w-6 h-6 text-${MILESTONE_DATABASE[formData.category!].color}-600`
                  })}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {formData.milestone}
                    </h4>
                    <button
                      onClick={() => setSelectedMilestone(null)}
                      className="text-sm text-gray-600 hover:text-gray-700"
                    >
                      Retour
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {formData.description}
                  </p>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Âge attendu: {formData.expectedAgeRange?.minMonths}-{formData.expectedAgeRange?.maxMonths} mois
                    • Catégorie: {MILESTONE_DATABASE[formData.category!].name}
                  </div>
                </div>
              </div>

              {/* Concern Level Assessment */}
              {formData.concernLevel !== 'none' && (
                <div className={`p-4 rounded-lg border-2 ${
                  formData.concernLevel === 'significant' ? 'border-red-200 bg-red-50 dark:bg-red-900/20' :
                  formData.concernLevel === 'moderate' ? 'border-orange-200 bg-orange-50 dark:bg-orange-900/20' :
                  'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className={`w-5 h-5 ${
                      formData.concernLevel === 'significant' ? 'text-red-600' :
                      formData.concernLevel === 'moderate' ? 'text-orange-600' :
                      'text-yellow-600'
                    }`} />
                    <span className="font-medium">
                      {formData.concernLevel === 'significant' ? 'Retard significatif détecté' :
                       formData.concernLevel === 'moderate' ? 'Retard modéré' :
                       'Léger retard'}
                    </span>
                  </div>
                  <p className="text-sm">
                    {formData.concernLevel === 'significant' 
                      ? 'Il est recommandé de consulter un pédiatre ou spécialiste du développement.'
                      : formData.concernLevel === 'moderate'
                      ? 'Surveiller de près et encourager les activités de stimulation.'
                      : 'Chaque enfant évolue à son rythme, continuer les stimulations.'
                    }
                  </p>
                </div>
              )}

              {/* Achievement Status */}
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.achieved}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      achieved: e.target.checked,
                      achievedDate: e.target.checked ? prev.achievedDate || new Date() : undefined
                    }))}
                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    Cette étape est acquise
                  </span>
                </label>
              </div>

              {/* Achievement Date */}
              {formData.achieved && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date d'acquisition *
                  </label>
                  <input
                    type="date"
                    value={formData.achievedDate && formData.achievedDate instanceof Date ? formData.achievedDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      achievedDate: new Date(e.target.value) 
                    }))}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  />
                  {errors.achievedDate && (
                    <p className="text-sm text-red-600 mt-1">{errors.achievedDate}</p>
                  )}
                </div>
              )}

              {/* Parent Observations */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Observations des parents
                </label>
                <textarea
                  value={formData.parentObservations || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, parentObservations: e.target.value }))}
                  placeholder="Décrivez ce que vous avez observé chez votre enfant..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  rows={3}
                />
              </div>

              {/* Next Steps Suggestions */}
              {formData.nextSteps && formData.nextSteps.length > 0 && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                    💡 Suggestions pour encourager le développement:
                  </h5>
                  <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    {formData.nextSteps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes complémentaires
                  {formData.concernLevel === 'significant' && (
                    <span className="text-red-600 ml-1">*</span>
                  )}
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notes sur le contexte, les difficultés observées, les progrès..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  rows={4}
                />
                {errors.notes && (
                  <p className="text-sm text-red-600 mt-1">{errors.notes}</p>
                )}
              </div>

              {/* Professional Consultation Recommendation */}
              {formData.concernLevel === 'significant' && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
                    <div>
                      <div className="font-bold text-red-800 dark:text-red-200">
                        Consultation recommandée
                      </div>
                      <div className="text-sm text-red-700 dark:text-red-300 mt-1">
                        Il est conseillé de discuter de ce retard avec votre pédiatre. 
                        Une évaluation par un spécialiste du développement pourrait être bénéfique 
                        pour identifier les stratégies d'accompagnement les plus adaptées.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setSelectedMilestone(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Retour
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || isLoading}
                  className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${
                    formData.concernLevel === 'significant' 
                      ? 'bg-red-600 hover:bg-red-700'
                      : formData.achieved
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {(submitting || isLoading) && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  )}
                  {(submitting || isLoading) ? 'Enregistrement...' : (formData.achieved ? 'Marquer comme acquis' : 'Enregistrer l\'évaluation')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MilestoneTrackingModal