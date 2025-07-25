'use client'

import React, { useState, useEffect } from 'react'
import { X, AlertTriangle, Thermometer, Clock, Phone, FileText, Activity } from 'lucide-react'
import TemperatureSelector from './TemperatureSelector'

interface SymptomAssessmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (symptomData: SymptomAssessmentData) => void
  babyAgeWeeks: number
  initialData?: Partial<SymptomAssessmentData>
  isLoading?: boolean
}

export interface SymptomAssessmentData {
  date: Date
  temperature?: number
  symptoms: SymptomDetail[]
  generalBehavior: {
    feeding: 'normal' | 'reduced' | 'refused' | 'increased'
    sleeping: 'normal' | 'restless' | 'excessive' | 'difficulty'
    crying: 'normal' | 'increased' | 'inconsolable' | 'weak'
    activity: 'normal' | 'reduced' | 'listless' | 'hyperactive'
  }
  physicalExam: {
    skinColor: 'normal' | 'pale' | 'flushed' | 'mottled' | 'jaundice'
    breathing: 'normal' | 'fast' | 'labored' | 'wheezing' | 'grunting'
    hydration: 'normal' | 'mild_dehydration' | 'moderate_dehydration' | 'severe_dehydration'
  }
  urgencyLevel: 'routine' | 'urgent' | 'emergency'
  doctorContacted: boolean
  doctorAdvice?: string
  notes?: string
  followUp?: {
    required: boolean
    timeframe?: string
    instructions?: string
  }
}

interface SymptomDetail {
  name: string
  category: 'respiratory' | 'digestive' | 'fever' | 'skin' | 'behavioral' | 'neurological' | 'other'
  severity: 'mild' | 'moderate' | 'severe'
  duration: string
  description?: string
  onset: 'sudden' | 'gradual'
  frequency?: 'constant' | 'intermittent' | 'occasional'
}

// Clinical symptom database with pediatric-specific assessments
const SYMPTOM_CATEGORIES = {
  respiratory: {
    name: 'Respiratoire',
    symptoms: [
      { name: 'Toux', urgency: 'moderate', description: 'Toux sèche ou grasse' },
      { name: 'Congestion nasale', urgency: 'mild', description: 'Nez bouché, écoulement' },
      { name: 'Respiration rapide', urgency: 'urgent', description: 'Fréquence respiratoire élevée' },
      { name: 'Respiration difficile', urgency: 'emergency', description: 'Dyspnée, tirage' },
      { name: 'Sifflements', urgency: 'urgent', description: 'Respiration sifflante' },
      { name: 'Apnée', urgency: 'emergency', description: 'Pauses respiratoires' }
    ]
  },
  digestive: {
    name: 'Digestif',
    symptoms: [
      { name: 'Vomissements', urgency: 'moderate', description: 'Régurgitations, vomissements en jet' },
      { name: 'Diarrhée', urgency: 'moderate', description: 'Selles liquides, fréquentes' },
      { name: 'Constipation', urgency: 'mild', description: 'Selles rares ou difficiles' },
      { name: 'Refus de boire', urgency: 'urgent', description: 'Ne veut pas téter/boire' },
      { name: 'Ballonnements', urgency: 'mild', description: 'Ventre gonflé, dur' },
      { name: 'Coliques', urgency: 'mild', description: 'Pleurs intenses, jambes repliées' }
    ]
  },
  fever: {
    name: 'Fièvre et température',
    symptoms: [
      { name: 'Fièvre', urgency: 'moderate', description: 'Température >37.5°C' },
      { name: 'Hypothermie', urgency: 'emergency', description: 'Température <36°C' },
      { name: 'Frissons', urgency: 'mild', description: 'Tremblements, chair de poule' },
      { name: 'Transpiration', urgency: 'mild', description: 'Sueurs, moiteur' }
    ]
  },
  skin: {
    name: 'Cutané',
    symptoms: [
      { name: 'Éruption cutanée', urgency: 'moderate', description: 'Boutons, plaques, rougeurs' },
      { name: 'Jaunisse', urgency: 'urgent', description: 'Coloration jaune de la peau' },
      { name: 'Pâleur', urgency: 'urgent', description: 'Teint pâle, lèvres décolorées' },
      { name: 'Cyanose', urgency: 'emergency', description: 'Coloration bleue/violette' },
      { name: 'Marbrures', urgency: 'urgent', description: 'Peau marbrée, tachetée' },
      { name: 'Sécheresse', urgency: 'mild', description: 'Peau sèche, desquamation' }
    ]
  },
  behavioral: {
    name: 'Comportement',
    symptoms: [
      { name: 'Irritabilité', urgency: 'mild', description: 'Pleurs fréquents, agitation' },
      { name: 'Léthargie', urgency: 'urgent', description: 'Apathie, manque de réactivité' },
      { name: 'Troubles du sommeil', urgency: 'mild', description: 'Difficulté à dormir ou sommeil excessif' },
      { name: 'Changement d\'appétit', urgency: 'mild', description: 'Mange plus ou moins que d\'habitude' },
      { name: 'Pleurs inconsolables', urgency: 'moderate', description: 'Pleurs intenses, difficiles à calmer' }
    ]
  },
  neurological: {
    name: 'Neurologique',
    symptoms: [
      { name: 'Convulsions', urgency: 'emergency', description: 'Mouvements anormaux, perte de conscience' },
      { name: 'Somnolence excessive', urgency: 'urgent', description: 'Difficulté à réveiller' },
      { name: 'Fontanelle bombée', urgency: 'emergency', description: 'Fontanelle tendue, bombée' },
      { name: 'Fontanelle creusée', urgency: 'urgent', description: 'Fontanelle enfoncée' },
      { name: 'Rigidité de la nuque', urgency: 'emergency', description: 'Nuque raide, difficile à fléchir' },
      { name: 'Trémulations', urgency: 'moderate', description: 'Tremblements fins' }
    ]
  }
}

// Emergency red flags that require immediate medical attention
const EMERGENCY_RED_FLAGS = [
  'Convulsions',
  'Apnée', 
  'Respiration difficile',
  'Cyanose',
  'Fontanelle bombée',
  'Rigidité de la nuque',
  'Léthargie',
  'Hypothermie',
  'Pâleur'
]

const SymptomAssessmentModal: React.FC<SymptomAssessmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  babyAgeWeeks,
  initialData,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<Partial<SymptomAssessmentData>>({
    date: new Date(),
    symptoms: [],
    generalBehavior: {
      feeding: 'normal',
      sleeping: 'normal',
      crying: 'normal',
      activity: 'normal'
    },
    physicalExam: {
      skinColor: 'normal',
      breathing: 'normal',
      hydration: 'normal'
    },
    urgencyLevel: 'routine',
    doctorContacted: false
  })
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showUrgencyAlert, setShowUrgencyAlert] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (initialData) {
      const processedData = {
        ...initialData,
        date: initialData.date ? new Date(initialData.date) : new Date(),
      }
      setFormData(processedData)
    }
  }, [initialData])

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        date: new Date(),
        symptoms: [],
        generalBehavior: {
          feeding: 'normal',
          sleeping: 'normal',
          crying: 'normal',
          activity: 'normal'
        },
        physicalExam: {
          skinColor: 'normal',
          breathing: 'normal',
          hydration: 'normal'
        },
        urgencyLevel: 'routine',
        doctorContacted: false
      })
      setSelectedCategory(null)
      setShowUrgencyAlert(false)
      setErrors({})
    }
  }, [isOpen])

  // Automatically calculate urgency based on symptoms and findings
  useEffect(() => {
    let maxUrgency = 'routine'
    const symptoms = formData.symptoms || []
    
    // Check for emergency symptoms
    const hasEmergencySymptom = symptoms.some(s => EMERGENCY_RED_FLAGS.includes(s.name))
    if (hasEmergencySymptom) {
      maxUrgency = 'emergency'
    }
    
    // Check for severe symptoms
    const hasSevereSymptom = symptoms.some(s => s.severity === 'severe')
    if (hasSevereSymptom && maxUrgency === 'routine') {
      maxUrgency = 'urgent'
    }
    
    // Check temperature
    if (formData.temperature) {
      if (babyAgeWeeks < 12 && formData.temperature >= 38.0) { // Fever in <3 months
        maxUrgency = 'emergency'
      } else if (formData.temperature >= 39.5) { // High fever
        maxUrgency = 'urgent'
      } else if (formData.temperature < 36.0) { // Hypothermia
        maxUrgency = 'emergency'
      }
    }
    
    // Check physical exam findings
    const physicalExam = formData.physicalExam
    if (physicalExam?.skinColor === 'pale' || physicalExam?.breathing === 'labored') {
      maxUrgency = 'urgent'
    }
    
    if (maxUrgency !== formData.urgencyLevel) {
      setFormData(prev => ({ ...prev, urgencyLevel: maxUrgency as any }))
      if (maxUrgency === 'emergency') {
        setShowUrgencyAlert(true)
      }
    }
  }, [formData.symptoms, formData.temperature, formData.physicalExam, babyAgeWeeks])

  const addSymptom = (categoryKey: string, symptomName: string) => {
    const category = SYMPTOM_CATEGORIES[categoryKey as keyof typeof SYMPTOM_CATEGORIES]
    const symptomTemplate = category.symptoms.find(s => s.name === symptomName)
    
    if (!symptomTemplate) return
    
    const newSymptom: SymptomDetail = {
      name: symptomName,
      category: categoryKey as any,
      severity: 'mild',
      duration: '',
      onset: 'gradual',
      frequency: 'constant'
    }
    
    setFormData(prev => ({
      ...prev,
      symptoms: [...(prev.symptoms || []), newSymptom]
    }))
    
    setSelectedCategory(null)
  }

  const updateSymptom = (index: number, updates: Partial<SymptomDetail>) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms?.map((s, i) => i === index ? { ...s, ...updates } : s) || []
    }))
  }

  const removeSymptom = (index: number) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms?.filter((_, i) => i !== index) || []
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.symptoms || formData.symptoms.length === 0) {
      newErrors.symptoms = 'Au moins un symptôme doit être renseigné'
    }
    
    formData.symptoms?.forEach((symptom, index) => {
      if (!symptom.duration.trim()) {
        newErrors[`symptom_${index}_duration`] = 'Durée requise'
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm() || submitting) return
    
    setSubmitting(true)
    try {
    
    const symptomData: SymptomAssessmentData = {
      date: formData.date!,
      temperature: formData.temperature,
      symptoms: formData.symptoms!,
      generalBehavior: formData.generalBehavior!,
      physicalExam: formData.physicalExam!,
      urgencyLevel: formData.urgencyLevel!,
      doctorContacted: formData.doctorContacted!,
      doctorAdvice: formData.doctorAdvice,
      notes: formData.notes,
      followUp: formData.followUp
    }
    
      await onSave(symptomData)
    } catch (error) {
      console.error('Error submitting symptom:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'emergency': return 'red'
      case 'urgent': return 'orange'
      default: return 'green'
    }
  }

  const getUrgencyIcon = (level: string) => {
    switch (level) {
      case 'emergency': return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'urgent': return <Clock className="w-5 h-5 text-orange-600" />
      default: return <Activity className="w-5 h-5 text-green-600" />
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Évaluation des symptômes
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Âge: {Math.floor(babyAgeWeeks / 4.33)} mois ({babyAgeWeeks} semaines)
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Emergency Alert */}
          {showUrgencyAlert && formData.urgencyLevel === 'emergency' && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold text-red-800 dark:text-red-200">⚠️ URGENCE MÉDICALE DÉTECTÉE</div>
                  <div className="text-sm text-red-700 dark:text-red-300 mt-1">
                    Les symptômes indiquent un besoin de consultation médicale immédiate.
                    Contactez les services d'urgence (15 ou 112) ou rendez-vous aux urgences.
                  </div>
                  <button
                    onClick={() => setShowUrgencyAlert(false)}
                    className="text-xs text-red-600 hover:text-red-700 mt-2 underline"
                  >
                    J'ai pris connaissance
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Date and Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date et heure d'observation
            </label>
            <input
              type="datetime-local"
              value={formData.date && formData.date instanceof Date ? formData.date.toISOString().slice(0, 16) : ''}
              onChange={(e) => setFormData(prev => ({ ...prev, date: new Date(e.target.value) }))}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            />
          </div>

          {/* Temperature */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center space-x-2">
              <Thermometer className="w-5 h-5" />
              <span>Température corporelle</span>
            </h4>
            <TemperatureSelector
              value={formData.temperature || 37.0}
              onChange={(temp) => setFormData(prev => ({ ...prev, temperature: temp }))}
              size="medium"
            />
          </div>

          {/* Symptoms Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Symptômes observés</h4>
              <button
                onClick={() => setSelectedCategory('select')}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Ajouter un symptôme
              </button>
            </div>

            {/* Symptom Category Selection */}
            {selectedCategory === 'select' && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Choisir une catégorie</h5>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(SYMPTOM_CATEGORIES).map(([key, category]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedCategory(key)}
                      className="p-2 text-left border border-gray-200 dark:border-gray-600 rounded hover:border-blue-300 dark:hover:border-blue-600"
                    >
                      <div className="text-sm font-medium">{category.name}</div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="mt-2 text-xs text-gray-600 hover:text-gray-700"
                >
                  Annuler
                </button>
              </div>
            )}

            {/* Individual Category Symptom Selection */}
            {selectedCategory && selectedCategory !== 'select' && SYMPTOM_CATEGORIES[selectedCategory as keyof typeof SYMPTOM_CATEGORIES] && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                  {SYMPTOM_CATEGORIES[selectedCategory as keyof typeof SYMPTOM_CATEGORIES].name}
                </h5>
                <div className="space-y-2">
                  {SYMPTOM_CATEGORIES[selectedCategory as keyof typeof SYMPTOM_CATEGORIES].symptoms.map(symptom => (
                    <button
                      key={symptom.name}
                      onClick={() => addSymptom(selectedCategory, symptom.name)}
                      disabled={formData.symptoms?.some(s => s.name === symptom.name)}
                      className="w-full text-left p-3 border border-gray-200 dark:border-gray-600 rounded hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{symptom.name}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">{symptom.description}</div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          symptom.urgency === 'emergency' ? 'bg-red-100 text-red-700' :
                          symptom.urgency === 'urgent' ? 'bg-orange-100 text-orange-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {symptom.urgency === 'emergency' ? 'Urgence' : symptom.urgency === 'urgent' ? 'Urgent' : 'Surveillé'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="mt-2 text-xs text-gray-600 hover:text-gray-700"
                >
                  Retour
                </button>
              </div>
            )}

            {/* Selected Symptoms List */}
            <div className="space-y-3">
              {formData.symptoms?.map((symptom, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{symptom.name}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{SYMPTOM_CATEGORIES[symptom.category].name}</div>
                    </div>
                    <button
                      onClick={() => removeSymptom(index)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Sévérité
                      </label>
                      <select
                        value={symptom.severity}
                        onChange={(e) => updateSymptom(index, { severity: e.target.value as any })}
                        className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                      >
                        <option value="mild">Légère</option>
                        <option value="moderate">Modérée</option>
                        <option value="severe">Sévère</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Début
                      </label>
                      <select
                        value={symptom.onset}
                        onChange={(e) => updateSymptom(index, { onset: e.target.value as any })}
                        className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                      >
                        <option value="sudden">Brutal</option>
                        <option value="gradual">Progressif</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fréquence
                      </label>
                      <select
                        value={symptom.frequency}
                        onChange={(e) => updateSymptom(index, { frequency: e.target.value as any })}
                        className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                      >
                        <option value="constant">Constant</option>
                        <option value="intermittent">Intermittent</option>
                        <option value="occasional">Occasionnel</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Durée *
                      </label>
                      <input
                        type="text"
                        value={symptom.duration}
                        onChange={(e) => updateSymptom(index, { duration: e.target.value })}
                        placeholder="2h, depuis ce matin, 3 jours..."
                        className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                      />
                      {errors[`symptom_${index}_duration`] && (
                        <p className="text-xs text-red-600 mt-1">{errors[`symptom_${index}_duration`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={symptom.description || ''}
                        onChange={(e) => updateSymptom(index, { description: e.target.value })}
                        placeholder="Détails supplémentaires..."
                        className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {errors.symptoms && (
              <p className="text-sm text-red-600">{errors.symptoms}</p>
            )}
          </div>

          {/* General Behavior Assessment */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Comportement général</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries({
                feeding: { label: 'Alimentation', options: [
                  { value: 'normal', label: 'Normal' },
                  { value: 'reduced', label: 'Diminué' },
                  { value: 'refused', label: 'Refus' },
                  { value: 'increased', label: 'Augmenté' }
                ]},
                sleeping: { label: 'Sommeil', options: [
                  { value: 'normal', label: 'Normal' },
                  { value: 'restless', label: 'Agité' },
                  { value: 'excessive', label: 'Excessif' },
                  { value: 'difficulty', label: 'Difficile' }
                ]},
                crying: { label: 'Pleurs', options: [
                  { value: 'normal', label: 'Normaux' },
                  { value: 'increased', label: 'Augmentés' },
                  { value: 'inconsolable', label: 'Inconsolables' },
                  { value: 'weak', label: 'Faibles' }
                ]},
                activity: { label: 'Activité', options: [
                  { value: 'normal', label: 'Normale' },
                  { value: 'reduced', label: 'Réduite' },
                  { value: 'listless', label: 'Apathique' },
                  { value: 'hyperactive', label: 'Hyperactif' }
                ]}
              }).map(([key, config]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {config.label}
                  </label>
                  <select
                    value={formData.generalBehavior?.[key as keyof typeof formData.generalBehavior] || 'normal'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      generalBehavior: {
                        ...prev.generalBehavior!,
                        [key]: e.target.value
                      }
                    }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                  >
                    {config.options.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Physical Examination */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Examen physique</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries({
                skinColor: { label: 'Couleur de la peau', options: [
                  { value: 'normal', label: 'Normale' },
                  { value: 'pale', label: 'Pâle' },
                  { value: 'flushed', label: 'Rouge' },
                  { value: 'mottled', label: 'Marbrée' },
                  { value: 'jaundice', label: 'Jaunâtre' }
                ]},
                breathing: { label: 'Respiration', options: [
                  { value: 'normal', label: 'Normale' },
                  { value: 'fast', label: 'Rapide' },
                  { value: 'labored', label: 'Difficile' },
                  { value: 'wheezing', label: 'Sifflante' },
                  { value: 'grunting', label: 'Geignante' }
                ]},
                hydration: { label: 'Hydratation', options: [
                  { value: 'normal', label: 'Normale' },
                  { value: 'mild_dehydration', label: 'Légère déshydratation' },
                  { value: 'moderate_dehydration', label: 'Déshydratation modérée' },
                  { value: 'severe_dehydration', label: 'Déshydratation sévère' }
                ]}
              }).map(([key, config]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {config.label}
                  </label>
                  <select
                    value={formData.physicalExam?.[key as keyof typeof formData.physicalExam] || 'normal'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      physicalExam: {
                        ...prev.physicalExam!,
                        [key]: e.target.value
                      }
                    }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                  >
                    {config.options.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Urgency Level (Auto-calculated) */}
          <div className="p-4 border rounded-lg" style={{ 
            borderColor: `var(--${getUrgencyColor(formData.urgencyLevel!)}-200)`,
            backgroundColor: `var(--${getUrgencyColor(formData.urgencyLevel!)}-50)`
          }}>
            <div className="flex items-center space-x-2 mb-2">
              {getUrgencyIcon(formData.urgencyLevel!)}
              <span className="font-medium">
                Niveau d'urgence: {
                  formData.urgencyLevel === 'emergency' ? 'URGENCE' :
                  formData.urgencyLevel === 'urgent' ? 'Urgent' : 'Routine'
                }
              </span>
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {formData.urgencyLevel === 'emergency' ? 
                'Consultation médicale immédiate recommandée' :
                formData.urgencyLevel === 'urgent' ?
                'Consultation médicale dans les prochaines heures' :
                'Surveillance, consultation si aggravation'
              }
            </div>
          </div>

          {/* Doctor Contact */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="doctorContacted"
                checked={formData.doctorContacted}
                onChange={(e) => setFormData(prev => ({ ...prev, doctorContacted: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="doctorContacted" className="text-sm text-gray-700 dark:text-gray-300 flex items-center space-x-1">
                <Phone className="w-4 h-4" />
                <span>Médecin contacté</span>
              </label>
            </div>

            {formData.doctorContacted && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Conseils du médecin
                </label>
                <textarea
                  value={formData.doctorAdvice || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, doctorAdvice: e.target.value }))}
                  placeholder="Instructions reçues du médecin..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  rows={3}
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-1">
              <FileText className="w-4 h-4" />
              <span>Notes complémentaires</span>
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Observations, évolution, contexte..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              rows={4}
            />
          </div>

          {/* Follow-up */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="followUpRequired"
                checked={formData.followUp?.required || false}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  followUp: { ...prev.followUp, required: e.target.checked }
                }))}
                className="rounded"
              />
              <label htmlFor="followUpRequired" className="text-sm text-gray-700 dark:text-gray-300">
                Suivi nécessaire
              </label>
            </div>

            {formData.followUp?.required && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Délai de suivi
                  </label>
                  <input
                    type="text"
                    value={formData.followUp?.timeframe || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      followUp: { ...prev.followUp!, timeframe: e.target.value }
                    }))}
                    placeholder="24h, 3 jours, 1 semaine..."
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Instructions
                  </label>
                  <input
                    type="text"
                    value={formData.followUp?.instructions || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      followUp: { ...prev.followUp!, instructions: e.target.value }
                    }))}
                    placeholder="Surveiller température, revoir si..."
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || isLoading}
              className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${
                formData.urgencyLevel === 'emergency' ? 'bg-red-600 hover:bg-red-700' :
                formData.urgencyLevel === 'urgent' ? 'bg-orange-600 hover:bg-orange-700' :
                'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {(submitting || isLoading) && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              )}
              {(submitting || isLoading) ? 'Enregistrement...' : 'Enregistrer l\'évaluation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SymptomAssessmentModal