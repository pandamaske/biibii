'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useBabyTrackerStore } from '@/lib/store'
import { formatDuration, formatTime, getAgeInWeeks } from '@/lib/utils'
import { AlertCircle, Milk, Moon, Baby, Heart, Bell, Clock } from 'lucide-react'
import Button from '@/components/ui/Button'

const Dashboard = () => {
  const router = useRouter()
  const { 
    currentBaby, 
    sleepTimer, 
    feedingSession, 
    feedings, 
    sleeps, 
    diapers,
    alerts 
  } = useBabyTrackerStore()

  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (!currentBaby) return null

  const ageInWeeks = getAgeInWeeks(currentBaby.birthDate)
  
  // Calculs pour les données du jour
  const todayFeedings = feedings.filter(f => 
    new Date(f.startTime).toDateString() === new Date().toDateString()
  )
  const todaySleeps = sleeps.filter(s => 
    new Date(s.startTime).toDateString() === new Date().toDateString()
  )
  const todayDiapers = diapers.filter(d => 
    new Date(d.time).toDateString() === new Date().toDateString()
  )

  const totalMilk = todayFeedings.reduce((sum, f) => sum + (f.amount || 0), 0)
  const totalSleep = todaySleeps.reduce((sum, s) => {
    if (!s.endTime) return sum
    return sum + Math.floor((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / (1000 * 60))
  }, 0)

  // Protocoles selon l'âge
  const getProtocol = (ageWeeks: number) => {
    if (ageWeeks <= 4) return { dailyMilk: Math.round(currentBaby.weight / 1000 * 150), interval: 3 }
    if (ageWeeks <= 12) return { dailyMilk: Math.round(currentBaby.weight / 1000 * 150), interval: 3.5 }
    return { dailyMilk: Math.round(currentBaby.weight / 1000 * 140), interval: 4 }
  }

  const protocol = getProtocol(ageInWeeks)

  // Calcul du prochain repas
  const getNextFeeding = () => {
    if (todayFeedings.length === 0) return { isLate: true, hours: 0, minutes: 0 }
    
    const lastFeeding = todayFeedings[todayFeedings.length - 1]
    const lastFeedTime = new Date(lastFeeding.time)
    const nextFeedTime = new Date(lastFeedTime.getTime() + protocol.interval * 60 * 60 * 1000)
    const diff = nextFeedTime.getTime() - currentTime.getTime()
    
    return {
      isLate: diff < 0,
      hours: Math.floor(Math.abs(diff) / (1000 * 60 * 60)),
      minutes: Math.floor((Math.abs(diff) % (1000 * 60 * 60)) / (1000 * 60))
    }
  }

  const nextFeeding = getNextFeeding()

  return (
    <div className="space-y-6 p-4 bg-gradient-to-b from-emerald-50 to-white min-h-screen">
      {/* Header bébé avec style naturel */}
      <div className="bg-gradient-to-r from-emerald-500 via-emerald-500 to-emerald-600 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 rounded-full p-3">
              <span className="text-3xl">{currentBaby.avatar}</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold">{currentBaby.name}</h2>
              <p className="text-emerald-100">{Math.floor(ageInWeeks / 4)} mois ({ageInWeeks} semaines)</p>
            </div>
          </div>
          <div className="text-right bg-white/10 rounded-2xl p-3">
            <p className="text-emerald-100 text-sm">Aujourd'hui</p>
            <p className="text-white font-medium">{currentTime.toLocaleDateString('fr-FR')}</p>
            <p className="text-xs text-emerald-200">{currentTime.toLocaleTimeString('fr-FR')}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-emerald-200 text-xs">Lait</p>
            <p className="text-lg font-bold">{totalMilk}ml</p>
            <p className="text-xs text-emerald-300">/{protocol.dailyMilk}ml</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-emerald-200 text-xs">Sommeil</p>
            <p className="text-lg font-bold">{formatDuration(totalSleep)}</p>
            <p className="text-xs text-emerald-300">{todaySleeps.length} sessions</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-emerald-200 text-xs">Couches</p>
            <p className="text-lg font-bold">{todayDiapers.length}</p>
            <p className="text-xs text-emerald-300">changes</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-emerald-200 text-xs">Poids</p>
            <p className="text-lg font-bold">{(currentBaby.weight / 1000).toFixed(1)}kg</p>
            <p className="text-xs text-emerald-300">{currentBaby.height}cm</p>
          </div>
        </div>
      </div>

      {/* Alerte prochain repas */}
      <div className={`${nextFeeding.isLate ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'} border-2 rounded-2xl p-6 shadow-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`${nextFeeding.isLate ? 'bg-red-500' : 'bg-amber-500'} rounded-full p-3`}>
              <Milk className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className={`text-xl font-semibold ${nextFeeding.isLate ? 'text-red-800' : 'text-amber-800'}`}>
                {nextFeeding.isLate ? '⚠️ Repas en retard!' : 'Prochain repas'}
              </h3>
              <p className={`text-lg ${nextFeeding.isLate ? 'text-red-600' : 'text-amber-600'}`}>
                {nextFeeding.isLate ? 'Immédiatement' : `Dans ${nextFeeding.hours}h ${nextFeeding.minutes}m`}
              </p>
              <p className="text-sm text-gray-400">
                Recommandation: toutes les {protocol.interval}h
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Dernière fois</p>
            <p className={`text-xl font-semibold ${nextFeeding.isLate ? 'text-red-800' : 'text-amber-800'}`}>
              {todayFeedings.length > 0 
                ? new Date(todayFeedings[todayFeedings.length - 1].startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                : 'Aucun'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-2 gap-6">
        <button 
          onClick={() => router.push('/feeding')}
          className="bg-white border-2 border-blue-200 rounded-2xl p-8 hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          <div className="flex flex-col items-center space-y-3">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full p-4 shadow-lg">
              <Milk className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold">Nouveau repas</p>
              <p className="text-gray-600">Saisie rapide</p>
              <p className="text-sm text-blue-600 mt-1">📱 Optimisé tactile</p>
            </div>
          </div>
        </button>
        
        <button 
          onClick={() => router.push('/sleep')}
          className="bg-white border-2 border-purple-200 rounded-2xl p-8 hover:bg-purple-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          <div className="flex flex-col items-center space-y-3">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full p-4 shadow-lg">
              <Moon className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold">Nouveau sommeil</p>
              <p className="text-gray-600">Timer intégré</p>
              <p className="text-sm text-purple-600 mt-1">⏰ Suivi temps réel</p>
            </div>
          </div>
        </button>
      </div>

      {/* Session en cours */}
      {(sleepTimer.isRunning || feedingSession.isTimerRunning) && (
        <div className="bg-gradient-to-r from-emerald-50 to-primary-50 border-2 border-dashed border-emerald-300 rounded-2xl p-6 shadow-lg">
          <h3 className="font-semibold mb-4 text-emerald-800 flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span>Session en cours</span>
          </h3>
          
          {sleepTimer.isRunning && (
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 rounded-full p-3">
                  <Moon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-purple-800">Sommeil en cours</p>
                  <p className="text-sm text-gray-400">
                    Depuis {sleepTimer.startTime?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-purple-700 font-mono">{formatTime(sleepTimer.seconds)}</p>
                <Button 
                  variant="primary"
                  size="sm"
                  onClick={() => router.push('/sleep')}
                >
                  Gérer
                </Button>
              </div>
            </div>
          )}
          
          {feedingSession.isTimerRunning && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 rounded-full p-3">
                  <Milk className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-blue-800">
                    {feedingSession.type} {feedingSession.amount && `(${feedingSession.amount}ml)`}
                  </p>
                  <p className="text-sm text-gray-400">Repas en cours</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-700 font-mono">{formatTime(feedingSession.timerSeconds)}</p>
                <Button 
                  variant="primary"
                  size="sm"
                  onClick={() => router.push('/feeding')}
                >
                  Gérer
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Résumé quotidien */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h3 className="font-semibold mb-4  flex items-center space-x-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          <span>Activité récente</span>
        </h3>
        
        <div className="space-y-3">
          {/* Derniers événements */}
          {todayFeedings.slice(-2).map((feed, index) => (
            <div key={index} className="flex items-center space-x-4 p-3 bg-blue-50 rounded-xl">
              <div className="bg-blue-100 rounded-full p-2">
                <Milk className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">{feed.kind} {feed.amount}ml</p>
                <p className="text-sm text-gray-400">
                  {new Date(feed.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${
                feed.mood === 'happy' ? 'bg-primary-500' : 
                feed.mood === 'content' ? 'bg-blue-500' : 'bg-yellow-500'
              }`}></div>
            </div>
          ))}
          
          {todaySleeps.slice(-1).map((sleep, index) => (
            <div key={index} className="flex items-center space-x-4 p-3 bg-purple-50 rounded-xl">
              <div className="bg-purple-100 rounded-full p-2">
                <Moon className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">
                  Sommeil {sleep.endTime ? formatDuration(Math.floor((new Date(sleep.endTime).getTime() - new Date(sleep.startTime).getTime()) / (1000 * 60))) : 'en cours'}
                </p>
                <p className="text-sm text-gray-400">
                  {new Date(sleep.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  {sleep.endTime && ` - ${new Date(sleep.endTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
                </p>
              </div>
            </div>
          ))}
          
          {todayDiapers.slice(-1).map((diaper, index) => (
            <div key={index} className="flex items-center space-x-4 p-3 bg-amber-50 rounded-xl">
              <div className="bg-amber-100 rounded-full p-2">
                <Baby className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">Couche {diaper.type}</p>
                <p className="text-sm text-gray-400">
                  {new Date(diaper.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-emerald-100">
          <h4 className="font-semibold mb-3  flex items-center space-x-2">
            <Milk className="w-4 h-4 text-emerald-600" />
            <span>Nutrition</span>
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Objectif</span>
              <span className="font-semibold">{protocol.dailyMilk}ml</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Consommé</span>
              <span className="font-semibold text-emerald-600">{totalMilk}ml</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${Math.min((totalMilk / protocol.dailyMilk) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-purple-100">
          <h4 className="font-semibold mb-3  flex items-center space-x-2">
            <Moon className="w-4 h-4 text-purple-600" />
            <span>Repos</span>
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Sessions</span>
              <span className="font-semibold">{todaySleeps.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total</span>
              <span className="font-semibold text-purple-600">{formatDuration(totalSleep)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-3 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${Math.min((totalSleep / (15 * 60)) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard