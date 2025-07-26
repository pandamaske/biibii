'use client'

import React, { useState, useEffect } from 'react'
import { X, Calculator, AlertTriangle, Clock, Pill, Scale, Info } from 'lucide-react'
import TemperatureSelector from './TemperatureSelector'

interface MedicationEntryModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (medicationData: MedicationEntryData) => void
  babyWeight: number // in grams
  babyAgeWeeks: number
  initialData?: Partial<MedicationEntryData>
  isLoading?: boolean
}

export interface MedicationEntryData {
  name: string
  activeIngredient: string
  dosage: number
  unit: 'mg' | 'ml' | 'drops' | 'suppository'
  frequency: string
  duration: string
  startDate: Date
  endDate?: Date
  administrationRoute: 'oral' | 'rectal' | 'topical' | 'nasal'
  prescribedBy?: string
  reason: string
  temperature?: number
  weight: number // baby weight at time of prescription
  notes?: string
  reminders?: {
    times: string[]
    enabled: boolean
  }
}

// Pediatric medication database with dosage calculations
const PEDIATRIC_MEDICATIONS = {
  paracetamol: {
    name: 'Paracétamol (Doliprane)',
    activeIngredient: 'paracetamol',
    indications: ['fievre', 'douleur'],
    dosagePerKg: 15, // mg per kg per dose
    maxDailyDosage: 60, // mg per kg per day
    frequencyHours: 6,
    maxDoses: 4,
    minAgeWeeks: 0,
    routes: ['oral', 'rectal'],
    contraindications: ['insuffisance_hepatique', 'allergie_paracetamol'],
    sideEffects: ['rares_doses_normales'],
    forms: {
      oral: [
        { concentration: 24, unit: 'mg/ml', name: 'Suspension 2.4%' },
        { concentration: 100, unit: 'mg/ml', name: 'Suspension 10%' }
      ],
      rectal: [
        { concentration: 80, unit: 'mg', name: 'Suppositoire 80mg' },
        { concentration: 150, unit: 'mg', name: 'Suppositoire 150mg' },
        { concentration: 300, unit: 'mg', name: 'Suppositoire 300mg' }
      ]
    },
    warnings: [
      'Ne pas dépasser la dose maximale',
      'Respecter un intervalle minimum de 6h entre les prises',
      'Surveiller la température corporelle'
    ]
  },
  ibuprofen: {
    name: 'Ibuprofène (Advil, Nurofen)',
    activeIngredient: 'ibuprofen',
    indications: ['fievre', 'douleur', 'inflammation'],
    dosagePerKg: 10, // mg per kg per dose
    maxDailyDosage: 30, // mg per kg per day
    frequencyHours: 8,
    maxDoses: 3,
    minAgeWeeks: 12, // 3 months minimum
    routes: ['oral', 'rectal'],
    contraindications: ['age_moins_3_mois', 'asthme', 'ulcere_gastrique', 'insuffisance_renale'],
    sideEffects: ['troubles_digestifs', 'eruption_cutanee'],
    forms: {
      oral: [
        { concentration: 20, unit: 'mg/ml', name: 'Suspension 2%' },
        { concentration: 40, unit: 'mg/ml', name: 'Suspension 4%' }
      ],
      rectal: [
        { concentration: 60, unit: 'mg', name: 'Suppositoire 60mg' },
        { concentration: 125, unit: 'mg', name: 'Suppositoire 125mg' }
      ]
    },
    warnings: [
      'Interdit avant 3 mois',
      'À prendre avec des aliments',
      'Surveiller les signes digestifs'
    ]
  },
  vitaminD: {
    name: 'Vitamine D3 (Sterogyl, Zymad)',
    activeIngredient: 'cholecalciferol',
    indications: ['prevention_rachitisme', 'supplementation'],
    dosagePerKg: null, // Fixed dose, not weight-based
    fixedDose: 400, // UI per day
    maxDailyDosage: 1000,
    frequencyHours: 24,
    maxDoses: 1,
    minAgeWeeks: 2,
    routes: ['oral'],
    contraindications: ['hypercalcemie', 'lithiase_calcique'],
    sideEffects: ['rares_doses_normales'],
    forms: {
      oral: [
        { concentration: 200, unit: 'UI/drop', name: 'Gouttes 200 UI/goutte' },
        { concentration: 400, unit: 'UI/ml', name: 'Solution 400 UI/ml' }
      ]
    },
    warnings: [
      'Dose quotidienne recommandée',
      'Supplémentation systématique jusqu\'à 18 mois'
    ]
  },
  salbutamol: {
    name: 'Salbutamol (Ventoline)',
    activeIngredient: 'salbutamol',
    indications: ['bronchospasme', 'asthme', 'bronchiolite'],
    dosagePerKg: 0.15, // mg per kg per dose
    maxDailyDosage: 0.6, // mg per kg per day
    frequencyHours: 6,
    maxDoses: 4,
    minAgeWeeks: 0,
    routes: ['oral', 'nasal'],
    contraindications: ['hypersensibilite_salbutamol'],
    sideEffects: ['tremblements', 'tachycardie', 'irritabilite'],
    forms: {
      oral: [
        { concentration: 2, unit: 'mg/5ml', name: 'Sirop 2mg/5ml' }
      ],
      nasal: [
        { concentration: 100, unit: 'mcg/dose', name: 'Aérosol 100mcg/dose' }
      ]
    },
    warnings: [
      'Surveillance cardiaque si doses répétées',
      'Peut provoquer de l\'agitation'
    ]
  }
}

const MedicationEntryModal: React.FC<MedicationEntryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  babyWeight,
  babyAgeWeeks,
  initialData,
  isLoading = false
}) => {
  const [selectedMedication, setSelectedMedication] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<MedicationEntryData>>({
    weight: babyWeight,
    administrationRoute: 'oral',
    startDate: new Date(),
    unit: 'mg'
  })
  
  const [calculatedDosage, setCalculatedDosage] = useState<{
    doseMg: number
    doseVolume?: number
    form?: any
    frequency: string
    maxDaily: number
  } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showDosageCalculator, setShowDosageCalculator] = useState(false)

  useEffect(() => {
    if (initialData) {
      const processedData = {
        ...initialData,
        startDate: initialData.startDate ? new Date(initialData.startDate) : new Date(),
        endDate: initialData.endDate ? new Date(initialData.endDate) : undefined,
      }
      setFormData(processedData)
      if (initialData.activeIngredient) {
        const medKey = Object.keys(PEDIATRIC_MEDICATIONS).find(key =>
          PEDIATRIC_MEDICATIONS[key as keyof typeof PEDIATRIC_MEDICATIONS].activeIngredient === initialData.activeIngredient
        )
        if (medKey) {
          setSelectedMedication(medKey)
        }
      }
    }
  }, [initialData])

  useEffect(() => {
    if (!isOpen) {
      setFormData({ weight: babyWeight, administrationRoute: 'oral', startDate: new Date(), unit: 'mg' })
      setSelectedMedication(null)
      setCalculatedDosage(null)
      setShowDosageCalculator(false)
      setErrors({})
    }
  }, [isOpen, babyWeight])

  const calculateDosage = (medicationKey: string, weight: number, route: string) => {
    const med = PEDIATRIC_MEDICATIONS[medicationKey as keyof typeof PEDIATRIC_MEDICATIONS]
    const weightKg = weight / 1000

    if (med.dosagePerKg) {
      const doseMg = med.dosagePerKg * weightKg
      const maxDaily = med.maxDailyDosage * weightKg
      
      // Find best form for this route and dosage
      const forms = med.forms[route as keyof typeof med.forms] || []
      let bestForm = forms[0]
      let doseVolume

      if (forms.length > 0) {
        if (med.activeIngredient === 'paracetamol' || med.activeIngredient === 'ibuprofen') {
          // For liquid medications, calculate volume
          if (bestForm.unit.includes('mg/ml')) {
            doseVolume = doseMg / bestForm.concentration
          }
        }
      }

      return {
        doseMg,
        doseVolume,
        form: bestForm,
        frequency: `Toutes les ${med.frequencyHours}h`,
        maxDaily
      }
    } else if ((med as any).fixedDose) {
      // Fixed dose medications like Vitamin D
      return {
        doseMg: (med as any).fixedDose,
        form: med.forms.oral?.[0],
        frequency: `1 fois par jour`,
        maxDaily: med.maxDailyDosage
      }
    }

    return null
  }

  const handleMedicationSelect = (medicationKey: string) => {
    setSelectedMedication(medicationKey)
    const med = PEDIATRIC_MEDICATIONS[medicationKey as keyof typeof PEDIATRIC_MEDICATIONS]
    
    setFormData(prev => ({
      ...prev,
      name: med.name,
      activeIngredient: med.activeIngredient,
      administrationRoute: med.routes[0] as any
    }))

    const dosage = calculateDosage(medicationKey, formData.weight || babyWeight, med.routes[0])
    setCalculatedDosage(dosage)
    setShowDosageCalculator(true)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name) newErrors.name = 'Nom du médicament requis'
    if (!formData.activeIngredient) newErrors.activeIngredient = 'Principe actif requis'
    if (!formData.dosage) newErrors.dosage = 'Dosage requis'
    if (!formData.unit) newErrors.unit = 'Unité requise'
    if (!formData.frequency) newErrors.frequency = 'Fréquence requise'
    if (!formData.duration) newErrors.duration = 'Durée du traitement requise'
    if (!formData.reason) newErrors.reason = 'Raison du traitement requise'
    if (!formData.startDate) newErrors.startDate = 'Date de début requise'

    // Check age restrictions
    if (selectedMedication && selectedMedication !== 'custom') {
      const med = PEDIATRIC_MEDICATIONS[selectedMedication as keyof typeof PEDIATRIC_MEDICATIONS]
      if (babyAgeWeeks < med.minAgeWeeks) {
        newErrors.age = `Ce médicament n'est pas autorisé avant ${Math.floor(med.minAgeWeeks / 4.33)} mois`
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm() || submitting) return
    
    setSubmitting(true)
    try {
      console.log('Form data before creating medicationData:', formData)

      const medicationData: MedicationEntryData = {
        name: formData.name!,
        activeIngredient: formData.activeIngredient!,
        dosage: formData.dosage!,
        unit: formData.unit!,
        frequency: formData.frequency!,
        duration: formData.duration!,
        startDate: formData.startDate!,
        endDate: formData.endDate,
        administrationRoute: formData.administrationRoute!,
        prescribedBy: formData.prescribedBy,
        reason: formData.reason!,
        temperature: formData.temperature,
        weight: formData.weight!,
        notes: formData.notes,
        reminders: formData.reminders
      }
      
      console.log('Medication data being passed to onSave:', medicationData)
      await onSave(medicationData)
    } catch (error) {
      console.error('Error submitting medication:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getFilteredMedications = () => {
    return Object.entries(PEDIATRIC_MEDICATIONS).filter(([key, med]) => {
      return babyAgeWeeks >= med.minAgeWeeks
    })
  }

  if (!isOpen) return null

  const weightKg = (formData.weight || babyWeight) / 1000
  const currentMed = selectedMedication ? PEDIATRIC_MEDICATIONS[selectedMedication as keyof typeof PEDIATRIC_MEDICATIONS] : null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {initialData ? 'Modifier le médicament' : 'Ajouter un médicament'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Âge: {Math.floor(babyAgeWeeks / 4.33)} mois • Poids: {weightKg.toFixed(1)} kg
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Medication Selection */}
          {!selectedMedication && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Sélectionner un médicament
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {getFilteredMedications().map(([key, med]) => (
                  <button
                    key={key}
                    onClick={() => handleMedicationSelect(key)}
                    className="text-left p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-300 dark:hover:border-blue-600"
                  >
                    <div className="flex items-start space-x-3">
                      <Pill className="w-5 h-5 text-blue-600 mt-1" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{med.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {med.activeIngredient} • {med.indications.join(', ')}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          Routes: {med.routes.join(', ')}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom Medication Option */}
              <button
                onClick={() => {
                  setSelectedMedication('custom')
                  setFormData(prev => ({ ...prev, name: '', activeIngredient: '' }))
                }}
                className="w-full text-left p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-300 dark:hover:border-blue-600"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 border-2 border-current rounded-full flex items-center justify-center">
                    <span className="text-xs">+</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700 dark:text-gray-300">Autre médicament</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Ajouter un médicament non listé
                    </div>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Medication Details & Dosage Calculator */}
          {selectedMedication && (
            <div className="space-y-6">
              {/* Selected Medication Info */}
              {currentMed && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{currentMed.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Indications: {currentMed.indications.join(', ')}
                      </div>
                      
                      {/* Contraindications */}
                      {currentMed.contraindications.length > 0 && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                          <div className="text-xs font-medium text-red-800 dark:text-red-200 flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Contre-indications:
                          </div>
                          <div className="text-xs text-red-700 dark:text-red-300">
                            {currentMed.contraindications.join(', ')}
                          </div>
                        </div>
                      )}

                      {/* Warnings */}
                      {currentMed.warnings.length > 0 && (
                        <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                          <div className="text-xs font-medium text-yellow-800 dark:text-yellow-200">⚠️ Avertissements:</div>
                          <ul className="text-xs text-yellow-700 dark:text-yellow-300 list-disc list-inside">
                            {currentMed.warnings.map((warning, idx) => (
                              <li key={idx}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <button
                        onClick={() => setSelectedMedication(null)}
                        className="text-xs text-blue-600 hover:text-blue-700 mt-2"
                      >
                        Changer de médicament
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Dosage Calculator */}
              {showDosageCalculator && calculatedDosage && currentMed && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <Calculator className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800 dark:text-green-200">Calcul de dosage pédiatrique</span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Poids</div>
                      <div className="font-medium">{weightKg.toFixed(1)} kg</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Dose recommandée</div>
                      <div className="font-medium">{calculatedDosage.doseMg.toFixed(1)} mg</div>
                    </div>
                    {calculatedDosage.doseVolume && (
                      <div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Volume</div>
                        <div className="font-medium">{calculatedDosage.doseVolume.toFixed(1)} ml</div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Fréquence</div>
                      <div className="font-medium">{calculatedDosage.frequency}</div>
                    </div>
                  </div>

                  {calculatedDosage.form && (
                    <div className="mt-3 p-2 bg-white dark:bg-gray-800 rounded border">
                      <div className="text-xs text-gray-600 dark:text-gray-400">Forme recommandée</div>
                      <div className="font-medium text-sm">{calculatedDosage.form.name}</div>
                      <div className="text-xs text-gray-500">{calculatedDosage.form.concentration} {calculatedDosage.form.unit}</div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        dosage: calculatedDosage.doseMg,
                        unit: calculatedDosage.doseVolume ? 'ml' : 'mg',
                        frequency: calculatedDosage.frequency
                      }))
                    }}
                    className="mt-3 text-xs text-green-700 hover:text-green-800 font-medium"
                  >
                    ✓ Utiliser ce dosage
                  </button>
                </div>
              )}

              {/* Temperature Selector (for fever medications) */}
              {currentMed && currentMed.indications.includes('fievre') && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Température actuelle</h4>
                  <TemperatureSelector
                    value={formData.temperature || 37.0}
                    onChange={(temp) => setFormData(prev => ({ ...prev, temperature: temp }))}
                    size="small"
                  />
                </div>
              )}

              {/* Medication Form */}
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nom du médicament *
                    </label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                      placeholder="Doliprane, Advil..."
                    />
                    {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Principe actif
                    </label>
                    <input
                      type="text"
                      value={formData.activeIngredient || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, activeIngredient: e.target.value }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                      placeholder="paracetamol, ibuprofène..."
                    />
                    {errors.activeIngredient && <p className="text-sm text-red-600 mt-1">{errors.activeIngredient}</p>}
                  </div>
                </div>

                {/* Dosage */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Dosage *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.dosage || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, dosage: parseFloat(e.target.value) }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    />
                    {errors.dosage && <p className="text-sm text-red-600 mt-1">{errors.dosage}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Unité
                    </label>
                    <select
                      value={formData.unit || 'mg'}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value as any }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    >
                      <option value="mg">mg</option>
                      <option value="ml">ml</option>
                      <option value="drops">gouttes</option>
                      <option value="suppository">suppositoire</option>
                    </select>
                    {errors.unit && <p className="text-sm text-red-600 mt-1">{errors.unit}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Voie d'administration
                    </label>
                    <select
                      value={formData.administrationRoute}
                      onChange={(e) => setFormData(prev => ({ ...prev, administrationRoute: e.target.value as any }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    >
                      <option value="oral">Orale</option>
                      <option value="rectal">Rectale</option>
                      <option value="topical">Cutanée</option>
                      <option value="nasal">Nasale</option>
                    </select>
                  </div>
                </div>

                {/* Frequency and Duration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fréquence *
                    </label>
                    <input
                      type="text"
                      value={formData.frequency || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                      placeholder="3 fois par jour, toutes les 6h..."
                    />
                    {errors.frequency && <p className="text-sm text-red-600 mt-1">{errors.frequency}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Durée du traitement *
                    </label>
                    <input
                      type="text"
                      value={formData.duration || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                      placeholder="3 jours, jusqu'à amélioration..."
                    />
                    {errors.duration && <p className="text-sm text-red-600 mt-1">{errors.duration}</p>}
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date de début *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.startDate && formData.startDate instanceof Date ? formData.startDate.toISOString().slice(0, 16) : ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    />
                    {errors.startDate && <p className="text-sm text-red-600 mt-1">{errors.startDate}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date de fin (optionnelle)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.endDate && formData.endDate instanceof Date ? formData.endDate.toISOString().slice(0, 16) : ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        endDate: e.target.value ? new Date(e.target.value) : undefined 
                      }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    />
                  </div>
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Raison du traitement *
                    </label>
                    <input
                      type="text"
                      value={formData.reason || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                      placeholder="Fièvre, douleur, prévention..."
                    />
                    {errors.reason && <p className="text-sm text-red-600 mt-1">{errors.reason}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Prescrit par
                    </label>
                    <input
                      type="text"
                      value={formData.prescribedBy || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, prescribedBy: e.target.value }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                      placeholder="Dr. Smith, Pharmacien..."
                    />
                  </div>
                </div>

                {/* Weight at time of prescription */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                    <Scale className="w-4 h-4" />
                    <span>Poids au moment de la prescription (g)</span>
                  </label>
                  <input
                    type="number"
                    value={formData.weight || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight: parseInt(e.target.value) }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  />
                </div>

                {/* Reminders */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enableReminders"
                      checked={formData.reminders?.enabled || false}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        reminders: {
                          ...prev.reminders,
                          enabled: e.target.checked,
                          times: prev.reminders?.times || []
                        }
                      }))}
                      className="rounded"
                    />
                    <label htmlFor="enableReminders" className="text-sm text-gray-700 dark:text-gray-300 flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>Activer les rappels</span>
                    </label>
                  </div>

                  {formData.reminders?.enabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Heures de prise (séparer par des virgules)
                      </label>
                      <input
                        type="text"
                        value={formData.reminders?.times?.join(', ') || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          reminders: {
                            ...prev.reminders!,
                            times: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                          }
                        }))}
                        placeholder="08:00, 14:00, 20:00"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                      />
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Instructions particulières, effets observés..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    rows={3}
                  />
                </div>
              </div>

              {errors.age && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{errors.age}</span>
                  </p>
                </div>
              )}
            </div>
          )}

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
              disabled={!selectedMedication || submitting || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {(submitting || isLoading) && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              )}
              {(submitting || isLoading) ? 'Enregistrement...' : (initialData ? 'Modifier' : 'Enregistrer')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MedicationEntryModal