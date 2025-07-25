'use client'

import React, { useState, useEffect } from 'react'
import { X, Calendar, MapPin, AlertTriangle, CheckCircle, Clock, Info } from 'lucide-react'
import { VaccineScheduleCalculator, VACCINE_SCHEDULES, type VaccineScheduleEntry } from '@/lib/vaccineSchedules'

interface VaccineEntryModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (vaccineData: VaccineEntryData) => void
  babyBirthDate: Date
  currentVaccines?: string[]
  initialData?: Partial<VaccineEntryData>
  isLoading?: boolean
}

export interface VaccineEntryData {
  vaccineId: string
  name: string
  status: 'scheduled' | 'completed' | 'skipped' | 'delayed'
  scheduledDate: Date
  completedDate?: Date
  location?: string
  batchNumber?: string
  administeredBy?: string
  notes?: string
  reactions?: {
    type: 'none' | 'mild' | 'moderate' | 'severe'
    symptoms?: string[]
    notes?: string
  }
  nextDueDate?: Date
}

const VaccineEntryModal: React.FC<VaccineEntryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  babyBirthDate,
  currentVaccines = [],
  initialData,
  isLoading = false
}) => {
  const [selectedVaccine, setSelectedVaccine] = useState<VaccineScheduleEntry | null>(null)
  const [formData, setFormData] = useState<Partial<VaccineEntryData>>({
    status: 'scheduled',
    reactions: { type: 'none' }
  })
  
  const [showReactionForm, setShowReactionForm] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Calculate baby's current age and get relevant vaccines
  const currentAgeWeeks = VaccineScheduleCalculator.calculateAgeInWeeks(babyBirthDate)
  const dueVaccines = VaccineScheduleCalculator.getDueVaccines(currentAgeWeeks)
  const overdueVaccines = VaccineScheduleCalculator.getOverdueVaccines(currentAgeWeeks)
  const upcomingVaccines = VaccineScheduleCalculator.getUpcomingVaccines(currentAgeWeeks, 12)

  // Get missed vaccines for catch-up
  const catchUpVaccines = VaccineScheduleCalculator.getCatchUpSchedule(babyBirthDate, currentVaccines)

  useEffect(() => {
    if (initialData) {
      const processedData = {
        ...initialData,
        scheduledDate: initialData.scheduledDate ? new Date(initialData.scheduledDate) : undefined,
        completedDate: initialData.completedDate ? new Date(initialData.completedDate) : undefined,
        nextDueDate: initialData.nextDueDate ? new Date(initialData.nextDueDate) : undefined,
      }
      setFormData(processedData)
      if (initialData.vaccineId) {
        const vaccine = VACCINE_SCHEDULES.find(v => v.id === initialData.vaccineId)
        if (vaccine) setSelectedVaccine(vaccine)
      }
    }
  }, [initialData])

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setFormData({ status: 'scheduled', reactions: { type: 'none' } })
      setSelectedVaccine(null)
      setShowReactionForm(false)
      setErrors({})
    }
  }, [isOpen])

  const handleVaccineSelect = (vaccine: VaccineScheduleEntry) => {
    setSelectedVaccine(vaccine)
    setFormData(prev => ({
      ...prev,
      vaccineId: vaccine.id,
      name: vaccine.name,
      scheduledDate: new Date(Date.now() + (vaccine.ageInWeeks - currentAgeWeeks) * 7 * 24 * 60 * 60 * 1000)
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!selectedVaccine) {
      newErrors.vaccine = 'Veuillez sélectionner un vaccin'
    }

    if (!formData.scheduledDate) {
      newErrors.scheduledDate = 'Date prévue requise'
    }

    if (formData.status === 'completed' && !formData.completedDate) {
      newErrors.completedDate = 'Date de vaccination requise pour un vaccin complété'
    }

    if (formData.status === 'completed' && !formData.location) {
      newErrors.location = 'Lieu de vaccination requis'
    }

    if (formData.status === 'completed' && formData.reactions?.type === 'severe' && !formData.reactions?.notes) {
      newErrors.reactionNotes = 'Veuillez détailler les réactions sévères'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm() || !selectedVaccine || submitting) return
    
    setSubmitting(true)
    try {

    // Calculate next due date if this is a series
    let nextDueDate: Date | undefined
    if (formData.status === 'completed' && selectedVaccine.doseNumber < selectedVaccine.totalDoses) {
      const nextVaccineInSeries = VACCINE_SCHEDULES.find(v => 
        v.abbreviation === selectedVaccine.abbreviation && 
        v.doseNumber === selectedVaccine.doseNumber + 1
      )
      if (nextVaccineInSeries && selectedVaccine.minimumInterval) {
        nextDueDate = new Date(
          (formData.completedDate || new Date()).getTime() + 
          selectedVaccine.minimumInterval * 7 * 24 * 60 * 60 * 1000
        )
      }
    }

    const vaccineData: VaccineEntryData = {
      vaccineId: selectedVaccine.id,
      name: selectedVaccine.name,
      status: formData.status || 'scheduled',
      scheduledDate: formData.scheduledDate!,
      completedDate: formData.completedDate,
      location: formData.location,
      batchNumber: formData.batchNumber,
      administeredBy: formData.administeredBy,
      notes: formData.notes,
      reactions: formData.reactions,
      nextDueDate
    }

      await onSave(vaccineData)
    } catch (error) {
      console.error('Error submitting vaccine:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getVaccinesByCategory = () => {
    const categories = {
      overdue: overdueVaccines.filter(v => !currentVaccines.includes(v.id)),
      due: dueVaccines.filter(v => !currentVaccines.includes(v.id)),
      catchup: catchUpVaccines.filter(v => !currentVaccines.includes(v.id)),
      upcoming: upcomingVaccines.filter(v => !currentVaccines.includes(v.id))
    }
    return categories
  }

  const categories = getVaccinesByCategory()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {initialData ? 'Modifier le vaccin' : 'Ajouter un vaccin'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Âge actuel: {Math.floor(currentAgeWeeks / 4.33)} mois ({currentAgeWeeks} semaines)
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Vaccine Selection */}
          {!selectedVaccine && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Sélectionner un vaccin
              </h3>

              {/* Overdue Vaccines */}
              {categories.overdue.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-600">Vaccins en retard</span>
                  </div>
                  {categories.overdue.map(vaccine => (
                    <button
                      key={vaccine.id}
                      onClick={() => handleVaccineSelect(vaccine)}
                      className="w-full text-left p-3 border-2 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 rounded-lg hover:border-red-300 dark:hover:border-red-700"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{vaccine.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{vaccine.description}</div>
                          <div className="text-xs text-red-600 mt-1">Prévu à {vaccine.ageLabel}</div>
                        </div>
                        <span className="text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-1 rounded">
                          {vaccine.urgency === 'critical' ? 'URGENT' : 'Retard'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Due Vaccines */}
              {categories.due.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-600">Vaccins dus</span>
                  </div>
                  {categories.due.map(vaccine => (
                    <button
                      key={vaccine.id}
                      onClick={() => handleVaccineSelect(vaccine)}
                      className="w-full text-left p-3 border-2 border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800 rounded-lg hover:border-orange-300 dark:hover:border-orange-700"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{vaccine.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{vaccine.description}</div>
                          <div className="text-xs text-orange-600 mt-1">Prévu à {vaccine.ageLabel}</div>
                        </div>
                        <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-2 py-1 rounded">
                          {vaccine.category === 'mandatory' ? 'Obligatoire' : 'Recommandé'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Upcoming Vaccines */}
              {categories.upcoming.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">Vaccins à venir</span>
                  </div>
                  {categories.upcoming.map(vaccine => (
                    <button
                      key={vaccine.id}
                      onClick={() => handleVaccineSelect(vaccine)}
                      className="w-full text-left p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-300 dark:hover:border-blue-600"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{vaccine.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{vaccine.description}</div>
                          <div className="text-xs text-blue-600 mt-1">Prévu à {vaccine.ageLabel}</div>
                        </div>
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                          Dans {vaccine.ageInWeeks - currentAgeWeeks}s
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Selected Vaccine Details */}
          {selectedVaccine && (
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{selectedVaccine.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedVaccine.description}</div>
                  <div className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                    Dose {selectedVaccine.doseNumber} sur {selectedVaccine.totalDoses} • {selectedVaccine.ageLabel}
                  </div>
                  
                  {/* Protection Against */}
                  <div className="mt-2">
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Protection contre:</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {selectedVaccine.protectionAgainst.join(', ')}
                    </div>
                  </div>

                  {/* Contraindications Warning */}
                  {selectedVaccine.contraindications.length > 0 && (
                    <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                      <div className="text-xs font-medium text-yellow-800 dark:text-yellow-200">⚠️ Contre-indications:</div>
                      <div className="text-xs text-yellow-700 dark:text-yellow-300">
                        {selectedVaccine.contraindications.join(', ')}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setSelectedVaccine(null)}
                    className="text-xs text-blue-600 hover:text-blue-700 mt-2"
                  >
                    Changer de vaccin
                  </button>
                </div>
              </div>

              {/* Vaccine Entry Form */}
              <div className="space-y-4">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Statut *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'scheduled', label: 'Prévu', icon: Calendar },
                      { value: 'completed', label: 'Fait', icon: CheckCircle },
                      { value: 'delayed', label: 'Reporté', icon: Clock },
                      { value: 'skipped', label: 'Non fait', icon: X }
                    ].map(status => (
                      <button
                        key={status.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, status: status.value as any }))}
                        className={`p-3 border-2 rounded-lg flex items-center space-x-2 ${
                          formData.status === status.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <status.icon className="w-4 h-4" />
                        <span className="text-sm">{status.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scheduled Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date prévue *
                  </label>
                  <input
                    type="date"
                    value={formData.scheduledDate && formData.scheduledDate instanceof Date ? formData.scheduledDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      scheduledDate: new Date(e.target.value) 
                    }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  />
                  {errors.scheduledDate && (
                    <p className="text-sm text-red-600 mt-1">{errors.scheduledDate}</p>
                  )}
                </div>

                {/* Completed Date (if status is completed) */}
                {formData.status === 'completed' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date de vaccination *
                    </label>
                    <input
                      type="date"
                      value={formData.completedDate && formData.completedDate instanceof Date ? formData.completedDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        completedDate: new Date(e.target.value) 
                      }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    />
                    {errors.completedDate && (
                      <p className="text-sm text-red-600 mt-1">{errors.completedDate}</p>
                    )}
                  </div>
                )}

                {/* Location (if completed) */}
                {formData.status === 'completed' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Lieu de vaccination *
                    </label>
                    <input
                      type="text"
                      value={formData.location || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Cabinet Dr. Smith, Hôpital..."
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    />
                    {errors.location && (
                      <p className="text-sm text-red-600 mt-1">{errors.location}</p>
                    )}
                  </div>
                )}

                {/* Additional fields for completed vaccines */}
                {formData.status === 'completed' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Numéro de lot
                        </label>
                        <input
                          type="text"
                          value={formData.batchNumber || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Administré par
                        </label>
                        <input
                          type="text"
                          value={formData.administeredBy || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, administeredBy: e.target.value }))}
                          placeholder="Dr. Smith, IDE Marie..."
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                        />
                      </div>
                    </div>

                    {/* Reaction Assessment */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Réactions post-vaccination
                      </label>
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {[
                          { value: 'none', label: 'Aucune', color: 'green' },
                          { value: 'mild', label: 'Légère', color: 'yellow' },
                          { value: 'moderate', label: 'Modérée', color: 'orange' },
                          { value: 'severe', label: 'Sévère', color: 'red' }
                        ].map(reaction => (
                          <button
                            key={reaction.value}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                reactions: { ...prev.reactions, type: reaction.value as any }
                              }))
                              setShowReactionForm(reaction.value !== 'none')
                            }}
                            className={`p-2 border-2 rounded-lg text-xs ${
                              formData.reactions?.type === reaction.value
                                ? `border-${reaction.color}-500 bg-${reaction.color}-50 text-${reaction.color}-700`
                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {reaction.label}
                          </button>
                        ))}
                      </div>

                      {showReactionForm && formData.reactions?.type !== 'none' && (
                        <div className="space-y-3 p-3 border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Symptômes observés
                            </label>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {['Fièvre', 'Rougeur', 'Gonflement', 'Douleur', 'Irritabilité', 'Vomissements', 'Diarrhée', 'Éruption'].map(symptom => (
                                <label key={symptom} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    onChange={(e) => {
                                      const symptoms = formData.reactions?.symptoms || []
                                      if (e.target.checked) {
                                        setFormData(prev => ({
                                          ...prev,
                                          reactions: {
                                            ...prev.reactions!,
                                            symptoms: [...symptoms, symptom]
                                          }
                                        }))
                                      } else {
                                        setFormData(prev => ({
                                          ...prev,
                                          reactions: {
                                            ...prev.reactions!,
                                            symptoms: symptoms.filter(s => s !== symptom)
                                          }
                                        }))
                                      }
                                    }}
                                    className="mr-2"
                                  />
                                  {symptom}
                                </label>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Notes sur les réactions
                            </label>
                            <textarea
                              value={formData.reactions?.notes || ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                reactions: { ...prev.reactions!, notes: e.target.value }
                              }))}
                              placeholder="Décrivez les réactions observées..."
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-xs"
                              rows={2}
                            />
                            {errors.reactionNotes && (
                              <p className="text-xs text-red-600 mt-1">{errors.reactionNotes}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Notes additionnelles..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    rows={3}
                  />
                </div>
              </div>
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
              disabled={!selectedVaccine || submitting || isLoading}
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

export default VaccineEntryModal