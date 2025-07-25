'use client'

import { useState } from 'react'
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
  XCircle
} from 'lucide-react'

interface HealthModuleProps {
  babyId?: string
}

const HealthModule = ({ babyId }: HealthModuleProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'vaccines' | 'symptoms' | 'medications' | 'milestones' | 'postpartum' | 'emergency'>('overview')

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
    { icon: Thermometer, label: 'Température', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
    { icon: Pill, label: 'Médicament', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    { icon: Phone, label: 'Appeler', color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
    { icon: AlertTriangle, label: 'Urgence', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
  ]

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

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Dernière visite
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              15 déc. 2024
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Dr. Smith
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Prochain RDV
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              1 févr. 2025
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Visite 4 mois
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                Vaccins dus dans 3 jours
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                5 vaccins programmés pour le 20 janv.: DTaP, Hib, IPV, PCV13, RV
              </p>
              <button className="text-sm font-medium text-yellow-800 dark:text-yellow-200 bg-yellow-100 dark:bg-yellow-900/50 px-3 py-1 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/70 transition-colors">
                Programmer un rendez-vous
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action, index) => (
            <button
              key={index}
              className={`flex flex-col items-center p-3 rounded-xl transition-all duration-200 hover:scale-105 ${action.color}`}
            >
              <action.icon className="w-6 h-6 mb-2" />
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Activité récente
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Syringe className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Rappel vaccins 4 mois
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Dans 3 jours
                </div>
              </div>
            </div>
            <span className="text-xs bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 px-2 py-1 rounded-full font-medium">
              À venir
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Premier sourire social
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  Il y a 2 jours
                </div>
              </div>
            </div>
            <span className="text-xs bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400 px-2 py-1 rounded-full font-medium flex items-center">
              <CheckCircle className="w-3 h-3 mr-1" />
              Accompli
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Visite pédiatre - Dr. Smith
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  15 déc. 2024
                </div>
              </div>
            </div>
            <span className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 px-2 py-1 rounded-full font-medium">
              Terminé
            </span>
          </div>
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
        <button className="text-sm bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 px-3 py-1 rounded-lg font-medium">
          Exporter PDF
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-green-800 dark:text-green-200">
              Naissance
            </h4>
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-green-700 dark:text-green-300">Hépatite B</span>
              <span className="text-green-600 dark:text-green-400 font-medium">15 août 2024</span>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-green-800 dark:text-green-200">
              2 mois
            </h4>
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="space-y-2 text-sm">
            {['DTaP', 'Hib', 'IPV', 'PCV13', 'RV'].map((vaccine) => (
              <div key={vaccine} className="flex justify-between">
                <span className="text-green-700 dark:text-green-300">{vaccine}</span>
                <span className="text-green-600 dark:text-green-400 font-medium">15 oct. 2024</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200">
              4 mois - À venir
            </h4>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                Dans 3 jours
              </span>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            {['DTaP', 'Hib', 'IPV', 'PCV13', 'RV'].map((vaccine) => (
              <div key={vaccine} className="flex justify-between">
                <span className="text-blue-700 dark:text-blue-300">{vaccine}</span>
                <span className="text-blue-600 dark:text-blue-400 font-medium">Prévu 20 janv.</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
              Programmer le rendez-vous
            </button>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-700 dark:text-gray-300">
              6 mois
            </h4>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Prochainement
            </span>
          </div>
          <div className="space-y-2 text-sm">
            {['DTaP', 'Hib', 'PCV13', 'RV', 'Influenza'].map((vaccine) => (
              <div key={vaccine} className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{vaccine}</span>
                <span className="text-gray-500 dark:text-gray-500">À venir</span>
              </div>
            ))}
          </div>
        </div>
      </div>
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Suivi des symptômes
            </h3>
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
              <Stethoscope className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Le module de suivi des symptômes sera bientôt disponible.</p>
            </div>
          </div>
        )
      case 'medications':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Gestion des médicaments
            </h3>
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
              <Pill className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Le module de gestion des médicaments sera bientôt disponible.</p>
            </div>
          </div>
        )
      case 'milestones':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Étapes de développement
            </h3>
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
              <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Le module d'étapes de développement sera bientôt disponible.</p>
            </div>
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
              <p>Le module de santé post-partum sera bientôt disponible.</p>
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

              <button className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-xl transition-colors">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-blue-700 dark:text-blue-300">
                    Dr. Smith
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    Pédiatre - Disponible
                  </div>
                </div>
              </button>

              <button className="flex items-center p-4 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 rounded-xl transition-colors">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mr-4">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-orange-700 dark:text-orange-300">
                    Centre antipoison
                  </div>
                  <div className="text-sm text-orange-600 dark:text-orange-400">
                    01 40 05 48 48
                  </div>
                </div>
              </button>

              <button className="flex items-center p-4 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 rounded-xl transition-colors">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-4">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-green-700 dark:text-green-300">
                    Urgences pédiatriques
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    24h/7j - 0.8 km
                  </div>
                </div>
              </button>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Guides premiers secours
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { title: 'RCP nourrisson', duration: '3 min', type: 'Vidéo' },
                  { title: 'Étouffement', type: 'Interactif' },
                  { title: 'Gestion fièvre', type: 'Article' },
                  { title: 'Réactions allergiques', type: 'Checklist' },
                ].map((guide, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {guide.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {guide.type} {guide.duration && `• ${guide.duration}`}
                      </div>
                    </div>
                    <button className="text-primary-600 dark:text-primary-400 text-sm font-medium">
                      Ouvrir
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex overflow-x-auto space-x-2 pb-2">
        {healthTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            } border border-gray-200 dark:border-gray-700`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="text-sm font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {renderTabContent()}
    </div>
  )
}

export default HealthModule