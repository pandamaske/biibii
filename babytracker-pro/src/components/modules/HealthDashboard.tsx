'use client'

import { useState, useEffect } from 'react'
import { 
  Heart, 
  Thermometer, 
  Pill, 
  Phone, 
  AlertTriangle,
  Stethoscope,
  Syringe,
  Brain,
  User,
  ShieldAlert,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Edit3,
  X,
  Menu
} from 'lucide-react'
import {
  VaccineEntryModal,
  MedicationEntryModal,
  SymptomAssessmentModal,
  MilestoneTrackingModal,
  TemperatureSelector,
  type VaccineEntryData,
  type MedicationEntryData,
  type SymptomAssessmentData,
  type MilestoneData
} from '@/components/health'
import { VaccineScheduleCalculator } from '@/lib/vaccineSchedules'

interface HealthDashboardProps {
  babyId: string
}

const HealthDashboard = ({ babyId }: HealthDashboardProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'vaccines' | 'symptoms' | 'medications' | 'milestones' | 'postpartum' | 'emergency'>('overview')
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [showQuickNav, setShowQuickNav] = useState(false)
  const [healthData, setHealthData] = useState<any>({
    vaccines: [],
    appointments: [],
    symptoms: [],
    medications: [],
    milestones: [],
    providers: [],
    summary: null
  })
  const [babyInfo, setBabyInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Modal states
  const [showVaccineModal, setShowVaccineModal] = useState(false)
  const [showMedicationModal, setShowMedicationModal] = useState(false)
  const [showSymptomModal, setShowSymptomModal] = useState(false)
  const [showMilestoneModal, setShowMilestoneModal] = useState(false)
  const [showTemperatureLogger, setShowTemperatureLogger] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  const healthTabs = [
    { id: 'overview' as const, icon: Heart, label: 'Vue d\'ensemble' },
    { id: 'vaccines' as const, icon: Syringe, label: 'Vaccins' },
    { id: 'symptoms' as const, icon: Stethoscope, label: 'Symptômes' },
    { id: 'medications' as const, icon: Pill, label: 'Médicaments' },
    { id: 'milestones' as const, icon: Brain, label: 'Développement' },
    { id: 'postpartum' as const, icon: User, label: 'Parent' },
    { id: 'emergency' as const, icon: ShieldAlert, label: 'Urgence' },
  ]

  const quickActions = [
    { icon: Thermometer, label: 'Température', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400', action: 'logTemperature' },
    { icon: Pill, label: 'Médicament', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', action: 'giveMedication' },
    { icon: Plus, label: 'Symptôme', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400', action: 'logSymptom' },
    { icon: Phone, label: 'Appeler', color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400', action: 'callDoctor' },
  ]

  // Load health data
  useEffect(() => {
    const loadHealthData = async () => {
      try {
        setLoading(true)
        
        const [babyRes, vaccinesRes, appointmentsRes, symptomsRes, medicationsRes, milestonesRes, providersRes] = await Promise.all([
          fetch(`/api/babies/${babyId}`),
          fetch(`/api/health/vaccines?babyId=${babyId}`),
          fetch(`/api/health/appointments?babyId=${babyId}`),
          fetch(`/api/health/symptoms?babyId=${babyId}&limit=5`),
          fetch(`/api/health/medications?babyId=${babyId}&active=true`),
          fetch(`/api/health/milestones?babyId=${babyId}`),
          fetch('/api/health/providers')
        ])

        const [baby, vaccines, appointments, symptoms, medications, milestones, providers] = await Promise.all([
          babyRes.ok ? babyRes.json() : null,
          vaccinesRes.ok ? vaccinesRes.json() : [],
          appointmentsRes.ok ? appointmentsRes.json() : [],
          symptomsRes.ok ? symptomsRes.json() : [],
          medicationsRes.ok ? medicationsRes.json() : [],
          milestonesRes.ok ? milestonesRes.json() : [],
          providersRes.ok ? providersRes.json() : []
        ])

        setBabyInfo(baby)
        setHealthData({
          vaccines: Array.isArray(vaccines) ? vaccines : [],
          appointments: Array.isArray(appointments) ? appointments : [],
          symptoms: Array.isArray(symptoms) ? symptoms : [],
          medications: Array.isArray(medications) ? medications : [],
          milestones: Array.isArray(milestones) ? milestones : [],
          providers: Array.isArray(providers) ? providers : []
        })
      } catch (error) {
        console.error('Error loading health data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (babyId) {
      loadHealthData()
    }
  }, [babyId])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const currentTabIndex = healthTabs.findIndex(tab => tab.id === activeTab)
      
      if (event.key === 'ArrowLeft' && currentTabIndex > 0) {
        setActiveTab(healthTabs[currentTabIndex - 1].id)
      } else if (event.key === 'ArrowRight' && currentTabIndex < healthTabs.length - 1) {
        setActiveTab(healthTabs[currentTabIndex + 1].id)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTab])

  // Close quick nav when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showQuickNav && !target.closest('[data-quick-nav]')) {
        setShowQuickNav(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showQuickNav])

  // Swipe gesture handling
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    
    const currentTabIndex = healthTabs.findIndex(tab => tab.id === activeTab)
    
    if (isLeftSwipe && currentTabIndex < healthTabs.length - 1) {
      setActiveTab(healthTabs[currentTabIndex + 1].id)
    } else if (isRightSwipe && currentTabIndex > 0) {
      setActiveTab(healthTabs[currentTabIndex - 1].id)
    }
  }

  const handleQuickAction = async (action: string) => {
    switch (action) {
      case 'logTemperature':
        setShowTemperatureLogger(true)
        break
      case 'giveMedication':
        setEditingItem(null)
        setShowMedicationModal(true)
        break
      case 'logSymptom':
        setEditingItem(null)
        setShowSymptomModal(true)
        break
      case 'callDoctor':
        // Show doctor contact options - switch to emergency tab
        setActiveTab('emergency')
        break
    }
  }

  // Data save handlers
  const handleSaveVaccine = async (vaccineData: VaccineEntryData) => {
    try {
      setSaving(true)
      const response = await fetch('/api/health/vaccines', {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...vaccineData,
          babyId,
          ...(editingItem && { id: editingItem.id })
        })
      })

      if (response.ok) {
        // Reload vaccines data
        const vaccinesRes = await fetch(`/api/health/vaccines?babyId=${babyId}`)
        const vaccines = vaccinesRes.ok ? await vaccinesRes.json() : []
        setHealthData(prev => ({ ...prev, vaccines: Array.isArray(vaccines) ? vaccines : [] }))
        
        setShowVaccineModal(false)
        setEditingItem(null)
      }
    } catch (error) {
      console.error('Error saving vaccine:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveMedication = async (medicationData: MedicationEntryData) => {
    try {
      setSaving(true)
      const response = await fetch('/api/health/medications', {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...medicationData,
          babyId,
          ...(editingItem && { id: editingItem.id })
        })
      })

      if (response.ok) {
        // Reload medications data
        const medicationsRes = await fetch(`/api/health/medications?babyId=${babyId}`)
        const medications = medicationsRes.ok ? await medicationsRes.json() : []
        setHealthData(prev => ({ ...prev, medications: Array.isArray(medications) ? medications : [] }))
        
        setShowMedicationModal(false)
        setEditingItem(null)
      }
    } catch (error) {
      console.error('Error saving medication:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSymptom = async (symptomData: SymptomAssessmentData) => {
    try {
      setSaving(true)
      const response = await fetch('/api/health/symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...symptomData,
          babyId
        })
      })

      if (response.ok) {
        // Reload symptoms data
        const symptomsRes = await fetch(`/api/health/symptoms?babyId=${babyId}&limit=5`)
        const symptoms = symptomsRes.ok ? await symptomsRes.json() : []
        setHealthData(prev => ({ ...prev, symptoms: Array.isArray(symptoms) ? symptoms : [] }))
        
        setShowSymptomModal(false)
      }
    } catch (error) {
      console.error('Error saving symptom:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveMilestone = async (milestoneData: MilestoneData) => {
    try {
      setSaving(true)
      const response = await fetch('/api/health/milestones', {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...milestoneData,
          babyId,
          ...(editingItem && { id: editingItem.id })
        })
      })

      if (response.ok) {
        // Reload milestones data
        const milestonesRes = await fetch(`/api/health/milestones?babyId=${babyId}`)
        const milestones = milestonesRes.ok ? await milestonesRes.json() : []
        setHealthData(prev => ({ ...prev, milestones: Array.isArray(milestones) ? milestones : [] }))
        
        setShowMilestoneModal(false)
        setEditingItem(null)
      }
    } catch (error) {
      console.error('Error saving milestone:', error)
    } finally {
      setSaving(false)
    }
  }

  const HealthOverview = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            État de santé général
          </h3>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">
              En bonne santé
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Dernière visite
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {(healthData.appointments || []).length > 0 
                ? new Date((healthData.appointments || [])[0].date).toLocaleDateString('fr-FR')
                : 'Aucune'
              }
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {(healthData.appointments || []).length > 0 
                ? (healthData.appointments || [])[0].provider?.name
                : 'Programmer une visite'
              }
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Vaccins à jour
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {(healthData.vaccines || []).filter((v: any) => v.status === 'completed').length} / {(healthData.vaccines || []).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {(healthData.vaccines || []).filter((v: any) => v.status === 'due' || v.status === 'overdue').length} en attente
            </div>
          </div>
        </div>

        {/* Vaccine Alert */}
        {(healthData.vaccines || []).filter((v: any) => v.status === 'due' || v.status === 'overdue').length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                  Vaccins en attente
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                  {(healthData.vaccines || []).filter((v: any) => v.status === 'due' || v.status === 'overdue').length} vaccin(s) à programmer
                </p>
                <button 
                  onClick={() => setActiveTab('vaccines')}
                  className="text-sm font-medium text-yellow-800 dark:text-yellow-200 bg-yellow-100 dark:bg-yellow-900/50 px-3 py-1 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/70 transition-colors"
                >
                  Voir les vaccins
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleQuickAction(action.action)}
              className={`flex flex-col items-center p-3 rounded-xl transition-all duration-200 hover:scale-105 ${action.color}`}
            >
              <action.icon className="w-6 h-6 mb-2" />
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Activité récente
        </h3>
        
        <div className="space-y-3">
          {/* Recent symptoms */}
          {(healthData.symptoms || []).slice(0, 2).map((symptom: any) => (
            <div key={symptom.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <Stethoscope className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {symptom.symptoms?.map((s: any) => s.name).join(', ') || 'Symptômes'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(symptom.date).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>
              <button className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                Voir
              </button>
            </div>
          ))}

          {/* Recent milestones */}
          {(healthData.milestones || []).filter((m: any) => m.achieved).slice(0, 2).map((milestone: any) => (
            <div key={milestone.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {milestone.milestone}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {milestone.achievedDate ? new Date(milestone.achievedDate).toLocaleDateString('fr-FR') : 'Récemment'}
                  </div>
                </div>
              </div>
              <span className="text-xs bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400 px-2 py-1 rounded-full font-medium flex items-center">
                <CheckCircle className="w-3 h-3 mr-1" />
                Accompli
              </span>
            </div>
          ))}

          {(healthData.symptoms || []).length === 0 && (healthData.milestones || []).filter((m: any) => m.achieved).length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <Heart className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Aucune activité récente</p>
              <p className="text-sm">Les nouvelles entrées apparaîtront ici</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const VaccineTracker = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Suivi des vaccinations
        </h3>
        <div className="flex space-x-2">
          <button 
            onClick={() => {
              setEditingItem(null)
              setShowVaccineModal(true)
            }}
            className="text-sm bg-blue-600 text-white px-3 py-1 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" />
            Ajouter vaccin
          </button>
          <button className="text-sm bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 px-3 py-1 rounded-lg font-medium">
            Exporter PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Chargement des vaccins...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(healthData.vaccines || []).length > 0 ? (
            (healthData.vaccines || []).map((vaccine: any) => (
              <div key={vaccine.id} className={`p-4 rounded-xl border-2 ${
                vaccine.status === 'completed' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' :
                vaccine.status === 'overdue' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' :
                vaccine.status === 'due' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800' :
                'bg-gray-50 border-gray-200 dark:bg-gray-700/50 dark:border-gray-600'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {vaccine.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {vaccine.ageGroup} - {vaccine.scheduledDate ? new Date(vaccine.scheduledDate).toLocaleDateString('fr-FR') : 'Non programmé'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {vaccine.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-600" />}
                    {vaccine.status === 'overdue' && <XCircle className="w-5 h-5 text-red-600" />}
                    {vaccine.status === 'due' && <Clock className="w-5 h-5 text-yellow-600" />}
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      vaccine.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' :
                      vaccine.status === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200' :
                      vaccine.status === 'due' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {vaccine.status === 'completed' ? 'Fait' :
                       vaccine.status === 'overdue' ? 'En retard' :
                       vaccine.status === 'due' ? 'À faire' : 'Prévu'}
                    </span>
                    <button
                      onClick={() => {
                        setEditingItem(vaccine)
                        setShowVaccineModal(true)
                      }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <Edit3 className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
              <Syringe className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Aucun vaccin enregistré</p>
              <p className="text-sm">Ajoutez le calendrier vaccinal de votre bébé</p>
              <button 
                onClick={() => {
                  setEditingItem(null)
                  setShowVaccineModal(true)
                }}
                className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                Ajouter des vaccins
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <HealthOverview />
      case 'vaccines':
        return <VaccineTracker />
      case 'symptoms':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Suivi des symptômes
              </h3>
              <button 
                onClick={() => {
                  setEditingItem(null)
                  setShowSymptomModal(true)
                }}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau symptôme
              </button>
            </div>
            {(healthData.symptoms || []).length > 0 ? (
              <div className="space-y-4">
                {(healthData.symptoms || []).map((symptom: any) => (
                  <div key={symptom.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {symptom.symptoms?.map((s: any) => s.name).join(', ') || 'Symptômes'}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {new Date(symptom.date).toLocaleDateString('fr-FR')}
                          {symptom.temperature && ` • Température: ${symptom.temperature}°C`}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        symptom.urgencyLevel === 'emergency' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200' :
                        symptom.urgencyLevel === 'urgent' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                      }`}>
                        {symptom.urgencyLevel === 'emergency' ? 'Urgence' :
                         symptom.urgencyLevel === 'urgent' ? 'Urgent' : 'Routine'}
                      </span>
                    </div>
                    {symptom.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{symptom.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                <Stethoscope className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Aucun symptôme enregistré</p>
                <p className="text-sm">Cliquez sur "Nouveau symptôme" pour commencer</p>
              </div>
            )}
          </div>
        )
      case 'medications':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Gestion des médicaments
              </h3>
              <button 
                onClick={() => {
                  setEditingItem(null)
                  setShowMedicationModal(true)
                }}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau médicament
              </button>
            </div>
            {(healthData.medications || []).length > 0 ? (
              <div className="space-y-4">
                {(healthData.medications || []).map((medication: any) => (
                  <div key={medication.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {medication.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {medication.dosage} {medication.unit} • {medication.frequency}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Début: {new Date(medication.startDate).toLocaleDateString('fr-FR')}
                          {medication.endDate && ` • Fin: ${new Date(medication.endDate).toLocaleDateString('fr-FR')}`}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          medication.endDate && new Date(medication.endDate) < new Date() 
                            ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                        }`}>
                          {medication.endDate && new Date(medication.endDate) < new Date() ? 'Terminé' : 'Actif'}
                        </span>
                        <button
                          onClick={() => {
                            setEditingItem(medication)
                            setShowMedicationModal(true)
                          }}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          <Edit3 className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                    {medication.reason && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Raison:</span> {medication.reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                <Pill className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Aucun médicament enregistré</p>
                <p className="text-sm">Cliquez sur "Nouveau médicament" pour commencer</p>
              </div>
            )}
          </div>
        )
      case 'milestones':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Étapes de développement
              </h3>
              <button 
                onClick={() => {
                  setEditingItem(null)
                  setShowMilestoneModal(true)
                }}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Évaluer étape
              </button>
            </div>
            {(healthData.milestones || []).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['motor', 'cognitive', 'language', 'social', 'adaptive'].map(category => {
                  const categoryMilestones = (healthData.milestones || []).filter((m: any) => m.category === category)
                  const achievedCount = categoryMilestones.filter((m: any) => m.achieved).length
                  const progress = categoryMilestones.length > 0 ? (achievedCount / categoryMilestones.length) * 100 : 0
                  
                  return (
                    <div key={category} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                          {category === 'motor' ? 'Moteur' :
                           category === 'cognitive' ? 'Cognitif' :
                           category === 'language' ? 'Langage' :
                           category === 'social' ? 'Social' :
                           'Adaptatif'}
                        </h4>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {achievedCount}/{categoryMilestones.length}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Aucune étape de développement enregistrée</p>
                <p className="text-sm mb-4">Commencez à suivre le développement de votre bébé</p>
                <button 
                  onClick={() => {
                    setEditingItem(null)
                    setShowMilestoneModal(true)
                  }}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  Évaluer première étape
                </button>
              </div>
            )}
          </div>
        )
      case 'postpartum':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Santé post-partum
            </h3>
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
              <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Module post-partum en développement</p>
            </div>
          </div>
        )
      case 'emergency':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Urgences & Sécurité
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <button className="flex items-center p-4 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-xl transition-colors">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mr-4">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-red-700 dark:text-red-300">
                    Urgences - 15
                  </div>
                  <div className="text-sm text-red-600 dark:text-red-400">
                    Appel d'urgence
                  </div>
                </div>
              </button>

              {(healthData.providers || []).filter((p: any) => p.type === 'pediatrician').map((provider: any) => (
                <button key={provider.id} className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-xl transition-colors">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-blue-700 dark:text-blue-300">
                      {provider.name}
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      {provider.phone}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  // Temperature Logger Modal Component
  const TemperatureLoggerModal = () => {
    if (!showTemperatureLogger) return null
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Prendre la température
            </h3>
            <button 
              onClick={() => setShowTemperatureLogger(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <TemperatureSelector
            value={37.0}
            onChange={(temp) => {
              // Here you could save the temperature reading
              console.log('Temperature recorded:', temp)
            }}
            size="large"
          />
          
          <div className="flex justify-end space-x-3 mt-6">
            <button 
              onClick={() => setShowTemperatureLogger(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button 
              onClick={() => {
                // Save temperature and maybe open symptom modal
                setShowTemperatureLogger(false)
                setShowSymptomModal(true)
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Enregistrer et ajouter symptômes
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Loading overlay component
  const LoadingOverlay = () => {
    if (!saving) return null
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Enregistrement en cours...
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Veuillez patienter pendant la sauvegarde
          </p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="space-y-6 relative" 
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Enhanced Tab Navigation */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-sm border border-gray-100 dark:border-gray-700" data-quick-nav>
        {/* Floating menu button */}
        <button
          onClick={() => setShowQuickNav(!showQuickNav)}
          className="absolute -top-2 -right-2 w-8 h-8 bg-primary-500 hover:bg-primary-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 z-20"
        >
          <Menu className="w-4 h-4" />
        </button>
        
        <div className="flex overflow-x-auto space-x-1 scrollbar-hide">
          {healthTabs.map((tab) => {
            const isActive = activeTab === tab.id
            
            // Calculate badge counts for different tabs
            let badgeCount = 0
            let badgeColor = 'bg-red-500'
            
            if (tab.id === 'vaccines') {
              badgeCount = (healthData.vaccines || []).filter((v: any) => v.status === 'due' || v.status === 'overdue').length
              badgeColor = badgeCount > 0 ? 'bg-yellow-500' : 'bg-green-500'
            } else if (tab.id === 'symptoms') {
              badgeCount = (healthData.symptoms || []).filter((s: any) => s.urgencyLevel === 'emergency' || s.urgencyLevel === 'urgent').length
              badgeColor = 'bg-red-500'
            } else if (tab.id === 'medications') {
              badgeCount = (healthData.medications || []).filter((m: any) => !m.endDate || new Date(m.endDate) > new Date()).length
              badgeColor = 'bg-blue-500'
            }
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center space-x-2 px-3 py-2 rounded-xl whitespace-nowrap transition-all duration-200 flex-shrink-0 group ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-md scale-105'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <tab.icon className={`w-4 h-4 transition-all duration-200 ${
                  isActive 
                    ? 'text-white' 
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                }`} />
                <span className="text-sm font-medium">{tab.label}</span>
                
                {/* Badge indicator */}
                {badgeCount > 0 && (
                  <div className={`absolute -top-1 -right-1 ${badgeColor} text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 shadow-sm`}>
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </div>
                )}
                
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
          {healthTabs.map((tab, index) => (
            <div 
              key={tab.id}
              className={`w-2 h-1 rounded-full transition-all duration-300 ${
                activeTab === tab.id 
                  ? 'bg-primary-500 w-8' 
                  : 'bg-gray-200 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>
        
        {/* Quick navigation helper */}
        {showQuickNav && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-3 z-10">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 text-center">
              Navigation rapide
            </div>
            <div className="grid grid-cols-3 gap-2">
              {healthTabs.slice(0, 6).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setShowQuickNav(false)
                  }}
                  className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mb-1" />
                  <span className="text-xs">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {renderTabContent()}

      {/* Loading Overlay */}
      <LoadingOverlay />
      
      {/* Modals */}
      <TemperatureLoggerModal />
      
      {showVaccineModal && babyInfo && (
        <VaccineEntryModal
          isOpen={showVaccineModal}
          onClose={() => {
            if (!saving) {
              setShowVaccineModal(false)
              setEditingItem(null)
            }
          }}
          onSave={handleSaveVaccine}
          babyBirthDate={new Date(babyInfo.birthDate)}
          currentVaccines={(healthData.vaccines || []).map((v: any) => v.name)}
          initialData={editingItem}
          isLoading={saving}
        />
      )}

      {showMedicationModal && babyInfo && (
        <MedicationEntryModal
          isOpen={showMedicationModal}
          onClose={() => {
            if (!saving) {
              setShowMedicationModal(false)
              setEditingItem(null)
            }
          }}
          onSave={handleSaveMedication}
          babyWeight={babyInfo.weight || 5000}
          babyAgeWeeks={babyInfo.birthDate ? 
            Math.floor((Date.now() - new Date(babyInfo.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 7)) : 0
          }
          initialData={editingItem}
          isLoading={saving}
        />
      )}

      {showSymptomModal && babyInfo && (
        <SymptomAssessmentModal
          isOpen={showSymptomModal}
          onClose={() => {
            if (!saving) {
              setShowSymptomModal(false)
            }
          }}
          onSave={handleSaveSymptom}
          babyAgeWeeks={babyInfo.birthDate ? 
            Math.floor((Date.now() - new Date(babyInfo.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 7)) : 0
          }
          isLoading={saving}
        />
      )}

      {showMilestoneModal && babyInfo && (
        <MilestoneTrackingModal
          isOpen={showMilestoneModal}
          onClose={() => {
            if (!saving) {
              setShowMilestoneModal(false)
              setEditingItem(null)
            }
          }}
          onSave={handleSaveMilestone}
          babyBirthDate={new Date(babyInfo.birthDate)}
          currentMilestones={healthData.milestones || []}
          initialData={editingItem}
          isLoading={saving}
        />
      )}
    </div>
  )
}

export default HealthDashboard