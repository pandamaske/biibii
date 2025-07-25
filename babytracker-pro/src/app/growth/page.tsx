'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useBabyTrackerStore } from '@/lib/store'
import { babyTrackerDB } from '@/lib/indexedDB'
import { formatRelativeTime, getAgeInWeeks, getAgeInMonths, getAgeInDays } from '@/lib/utils'
import { 
  Scale, TrendingUp, Plus, Baby, Trash2, Edit3, Save, X, Calendar,
  Activity, Target, AlertTriangle, Camera, Download, Eye,
  Brain, Heart, Ruler, BarChart3, LineChart, PieChart,
  Circle, Smile, Thermometer, Droplets, Moon
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import ClientOnly from '@/components/ClientOnly'

// ✅ Helper functions EXTERNES pour éviter les problèmes de hooks
const ensureDate = (value: any): Date | null => {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    return isNaN(date.getTime()) ? null : date
  }
  return null
}

const formatTimeFromDate = (date: any): string => {
  const validDate = ensureDate(date)
  if (!validDate) return '--:--'
  return validDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

// ✅ Données WHO/CDC pour percentiles (simplifiées)
const GROWTH_PERCENTILES = {
  weight: {
    0: { p3: 2500, p10: 2800, p25: 3100, p50: 3400, p75: 3700, p90: 4000, p97: 4300 },
    4: { p3: 3200, p10: 3600, p25: 4000, p50: 4500, p75: 5000, p90: 5500, p97: 6000 },
    8: { p3: 4000, p10: 4500, p25: 5000, p50: 5600, p75: 6200, p90: 6800, p97: 7400 },
    12: { p3: 4600, p10: 5200, p25: 5800, p50: 6400, p75: 7100, p90: 7800, p97: 8500 },
    24: { p3: 5800, p10: 6500, p25: 7200, p50: 8000, p75: 8800, p90: 9600, p97: 10500 },
    52: { p3: 7500, p10: 8400, p25: 9300, p50: 10200, p75: 11200, p90: 12200, p97: 13300 }
  },
  height: {
    0: { p3: 46, p10: 48, p25: 49, p50: 50, p75: 51, p90: 52, p97: 54 },
    4: { p3: 52, p10: 54, p25: 55, p50: 57, p75: 58, p90: 60, p97: 62 },
    8: { p3: 57, p10: 59, p25: 61, p50: 63, p75: 64, p90: 66, p97: 68 },
    12: { p3: 61, p10: 63, p25: 65, p50: 67, p75: 69, p90: 71, p97: 73 },
    24: { p3: 72, p10: 75, p25: 77, p50: 80, p75: 82, p90: 85, p97: 88 },
    52: { p3: 82, p10: 85, p25: 88, p50: 91, p75: 94, p90: 97, p97: 100 }
  }
}

// ✅ Timeline d'éruption dentaire (WHO/Académie Française de Pédiatrie)
const TEETH_TIMELINE = [
  { id: '11', name: 'Incisive centrale inf. gauche', normalAge: 6, minAge: 4, maxAge: 10, position: 'bottom-center-left' },
  { id: '21', name: 'Incisive centrale inf. droite', normalAge: 6, minAge: 4, maxAge: 10, position: 'bottom-center-right' },
  { id: '12', name: 'Incisive latérale inf. gauche', normalAge: 7, minAge: 5, maxAge: 11, position: 'bottom-lateral-left' },
  { id: '22', name: 'Incisive latérale inf. droite', normalAge: 7, minAge: 5, maxAge: 11, position: 'bottom-lateral-right' },
  { id: '51', name: 'Incisive centrale sup. gauche', normalAge: 8, minAge: 6, maxAge: 12, position: 'top-center-left' },
  { id: '61', name: 'Incisive centrale sup. droite', normalAge: 8, minAge: 6, maxAge: 12, position: 'top-center-right' },
  { id: '52', name: 'Incisive latérale sup. gauche', normalAge: 9, minAge: 7, maxAge: 13, position: 'top-lateral-left' },
  { id: '62', name: 'Incisive latérale sup. droite', normalAge: 9, minAge: 7, maxAge: 13, position: 'top-lateral-right' },
  { id: '13', name: 'Première molaire inf. gauche', normalAge: 14, minAge: 10, maxAge: 18, position: 'bottom-molar-left' },
  { id: '23', name: 'Première molaire inf. droite', normalAge: 14, minAge: 10, maxAge: 18, position: 'bottom-molar-right' },
  { id: '53', name: 'Première molaire sup. gauche', normalAge: 14, minAge: 10, maxAge: 18, position: 'top-molar-left' },
  { id: '63', name: 'Première molaire sup. droite', normalAge: 14, minAge: 10, maxAge: 18, position: 'top-molar-right' },
  { id: '14', name: 'Canine inf. gauche', normalAge: 16, minAge: 12, maxAge: 22, position: 'bottom-canine-left' },
  { id: '24', name: 'Canine inf. droite', normalAge: 16, minAge: 12, maxAge: 22, position: 'bottom-canine-right' },
  { id: '54', name: 'Canine sup. gauche', normalAge: 18, minAge: 14, maxAge: 24, position: 'top-canine-left' },
  { id: '64', name: 'Canine sup. droite', normalAge: 18, minAge: 14, maxAge: 24, position: 'top-canine-right' },
  { id: '15', name: 'Deuxième molaire inf. gauche', normalAge: 24, minAge: 18, maxAge: 30, position: 'bottom-molar2-left' },
  { id: '25', name: 'Deuxième molaire inf. droite', normalAge: 24, minAge: 18, maxAge: 30, position: 'bottom-molar2-right' },
  { id: '55', name: 'Deuxième molaire sup. gauche', normalAge: 24, minAge: 18, maxAge: 30, position: 'top-molar2-left' },
  { id: '65', name: 'Deuxième molaire sup. droite', normalAge: 24, minAge: 18, maxAge: 30, position: 'top-molar2-right' }
]

// ✅ Milestones physiques par âge
const PHYSICAL_MILESTONES = [
  { ageMonths: 1, milestone: 'Soulève la tête en position ventrale', category: 'moteur' },
  { ageMonths: 2, milestone: 'Suit les objets des yeux', category: 'visuel' },
  { ageMonths: 3, milestone: 'Sourire social', category: 'social' },
  { ageMonths: 4, milestone: 'Tient sa tête droite', category: 'moteur' },
  { ageMonths: 6, milestone: 'Se retourne', category: 'moteur' },
  { ageMonths: 6, milestone: 'Première dent possible', category: 'dentaire' },
  { ageMonths: 8, milestone: 'Position assise stable', category: 'moteur' },
  { ageMonths: 10, milestone: 'Rampe ou marche à 4 pattes', category: 'moteur' },
  { ageMonths: 12, milestone: 'Premiers pas', category: 'moteur' },
  { ageMonths: 12, milestone: 'Premier mot', category: 'langage' },
  { ageMonths: 18, milestone: 'Court', category: 'moteur' },
  { ageMonths: 24, milestone: 'Monte les escaliers', category: 'moteur' }
]

// ✅ Composant Schéma Dentaire Interactif
const TeethDiagram = ({ teethStatus, onToothClick, ageInMonths }: any) => {
  const getToothColor = (tooth: any) => {
    if (teethStatus[tooth.id]) return 'fill-white stroke-green-500 stroke-2'
    if (ageInMonths >= tooth.normalAge) return 'fill-yellow-100 stroke-yellow-500 stroke-2'
    if (ageInMonths >= (tooth.normalAge - 2)) return 'fill-blue-100 stroke-blue-500 stroke-1'
    return 'fill-gray-100 stroke-gray-300 stroke-1'
  }

  const getToothStatus = (tooth: any) => {
    if (teethStatus[tooth.id]) return 'Sortie ✅'
    if (ageInMonths >= tooth.normalAge) return 'En retard ⚠️'
    if (ageInMonths >= (tooth.normalAge - 2)) return 'Bientôt 🔄'
    return 'Pas encore ⏳'
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-6 border border-blue-200">
      <h3 className="text-lg font-bold text-center mb-4 text-primary-800 dark:text-primary-200">
        Schéma Dentaire ({Object.keys(teethStatus).length}/20 dents)
      </h3>
      
      <div className="relative w-80 h-48 mx-auto mb-4">
        {/* Bouche */}
        <svg viewBox="0 0 240 140" className="w-full h-full">
          {/* Contour de la bouche - forme plus réaliste */}
          <path 
            d="M50 70 Q120 30 190 70 Q120 110 50 70" 
            fill="rgba(255, 182, 193, 0.1)" 
            stroke="#f97316" 
            strokeWidth="2" 
          />
          
          {/* Gencives supérieures */}
          <path 
            d="M60 60 Q120 45 180 60 Q120 70 60 60" 
            fill="rgba(255, 182, 193, 0.3)" 
            stroke="#ff8b94" 
            strokeWidth="1" 
          />
          
          {/* Gencives inférieures */}
          <path 
            d="M60 80 Q120 70 180 80 Q120 95 60 80" 
            fill="rgba(255, 182, 193, 0.3)" 
            stroke="#ff8b94" 
            strokeWidth="1" 
          />
          
          {/* Ligne médiane */}
          <line x1="120" y1="35" x2="120" y2="105" stroke="#f97316" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
          
          {/* Dents du haut - formes réalistes */}
          {/* Incisives centrales supérieures */}
          {[
            { id: '51', x: 110, y: 50, type: 'incisor' }, 
            { id: '61', x: 130, y: 50, type: 'incisor' }
          ].map(tooth => {
            const toothData = TEETH_TIMELINE.find(t => t.id === tooth.id)
            return (
              <rect
                key={tooth.id}
                x={tooth.x - 4}
                y={tooth.y - 8}
                width="8"
                height="12"
                rx="2"
                className={`cursor-pointer transition-all duration-300 hover:scale-110 ${getToothColor(toothData)}`}
                onClick={() => onToothClick(toothData)}
              />
            )
          })}
          
          {/* Incisives latérales supérieures */}
          {[
            { id: '52', x: 96, y: 52, type: 'incisor' }, 
            { id: '62', x: 144, y: 52, type: 'incisor' }
          ].map(tooth => {
            const toothData = TEETH_TIMELINE.find(t => t.id === tooth.id)
            return (
              <rect
                key={tooth.id}
                x={tooth.x - 3}
                y={tooth.y - 7}
                width="6"
                height="10"
                rx="2"
                className={`cursor-pointer transition-all duration-300 hover:scale-110 ${getToothColor(toothData)}`}
                onClick={() => onToothClick(toothData)}
              />
            )
          })}
          
          {/* Premières molaires supérieures */}
          {[
            { id: '53', x: 82, y: 55, type: 'molar' }, 
            { id: '63', x: 158, y: 55, type: 'molar' }
          ].map(tooth => {
            const toothData = TEETH_TIMELINE.find(t => t.id === tooth.id)
            return (
              <rect
                key={tooth.id}
                x={tooth.x - 4}
                y={tooth.y - 6}
                width="8"
                height="8"
                rx="2"
                className={`cursor-pointer transition-all duration-300 hover:scale-110 ${getToothColor(toothData)}`}
                onClick={() => onToothClick(toothData)}
              />
            )
          })}
          
          {/* Canines supérieures */}
          {[
            { id: '54', x: 68, y: 58, type: 'canine' }, 
            { id: '64', x: 172, y: 58, type: 'canine' }
          ].map(tooth => {
            const toothData = TEETH_TIMELINE.find(t => t.id === tooth.id)
            return (
              <path
                key={tooth.id}
                d={`M${tooth.x-3} ${tooth.y} L${tooth.x} ${tooth.y-8} L${tooth.x+3} ${tooth.y} Q${tooth.x} ${tooth.y+6} ${tooth.x-3} ${tooth.y}`}
                className={`cursor-pointer transition-all duration-300 hover:scale-110 ${getToothColor(toothData)}`}
                onClick={() => onToothClick(toothData)}
              />
            )
          })}
          
          {/* Deuxièmes molaires supérieures */}
          {[
            { id: '55', x: 54, y: 62, type: 'molar' }, 
            { id: '65', x: 186, y: 62, type: 'molar' }
          ].map(tooth => {
            const toothData = TEETH_TIMELINE.find(t => t.id === tooth.id)
            return (
              <rect
                key={tooth.id}
                x={tooth.x - 4}
                y={tooth.y - 6}
                width="8"
                height="8"
                rx="2"
                className={`cursor-pointer transition-all duration-300 hover:scale-110 ${getToothColor(toothData)}`}
                onClick={() => onToothClick(toothData)}
              />
            )
          })}
          
          {/* Dents du bas - formes réalistes */}
          {/* Incisives centrales inférieures */}
          {[
            { id: '11', x: 110, y: 85, type: 'incisor' }, 
            { id: '21', x: 130, y: 85, type: 'incisor' }
          ].map(tooth => {
            const toothData = TEETH_TIMELINE.find(t => t.id === tooth.id)
            return (
              <rect
                key={tooth.id}
                x={tooth.x - 3}
                y={tooth.y - 6}
                width="6"
                height="10"
                rx="1"
                className={`cursor-pointer transition-all duration-300 hover:scale-110 ${getToothColor(toothData)}`}
                onClick={() => onToothClick(toothData)}
              />
            )
          })}
          
          {/* Incisives latérales inférieures */}
          {[
            { id: '12', x: 96, y: 83, type: 'incisor' }, 
            { id: '22', x: 144, y: 83, type: 'incisor' }
          ].map(tooth => {
            const toothData = TEETH_TIMELINE.find(t => t.id === tooth.id)
            return (
              <rect
                key={tooth.id}
                x={tooth.x - 3}
                y={tooth.y - 7}
                width="6"
                height="10"
                rx="1"
                className={`cursor-pointer transition-all duration-300 hover:scale-110 ${getToothColor(toothData)}`}
                onClick={() => onToothClick(toothData)}
              />
            )
          })}
          
          {/* Premières molaires inférieures */}
          {[
            { id: '13', x: 82, y: 80, type: 'molar' }, 
            { id: '23', x: 158, y: 80, type: 'molar' }
          ].map(tooth => {
            const toothData = TEETH_TIMELINE.find(t => t.id === tooth.id)
            return (
              <rect
                key={tooth.id}
                x={tooth.x - 4}
                y={tooth.y - 4}
                width="8"
                height="8"
                rx="2"
                className={`cursor-pointer transition-all duration-300 hover:scale-110 ${getToothColor(toothData)}`}
                onClick={() => onToothClick(toothData)}
              />
            )
          })}
          
          {/* Canines inférieures */}
          {[
            { id: '14', x: 68, y: 77, type: 'canine' }, 
            { id: '24', x: 172, y: 77, type: 'canine' }
          ].map(tooth => {
            const toothData = TEETH_TIMELINE.find(t => t.id === tooth.id)
            return (
              <path
                key={tooth.id}
                d={`M${tooth.x-3} ${tooth.y+6} L${tooth.x} ${tooth.y-2} L${tooth.x+3} ${tooth.y+6} Q${tooth.x} ${tooth.y+8} ${tooth.x-3} ${tooth.y+6}`}
                className={`cursor-pointer transition-all duration-300 hover:scale-110 ${getToothColor(toothData)}`}
                onClick={() => onToothClick(toothData)}
              />
            )
          })}
          
          {/* Deuxièmes molaires inférieures */}
          {[
            { id: '15', x: 54, y: 73, type: 'molar' }, 
            { id: '25', x: 186, y: 73, type: 'molar' }
          ].map(tooth => {
            const toothData = TEETH_TIMELINE.find(t => t.id === tooth.id)
            return (
              <rect
                key={tooth.id}
                x={tooth.x - 4}
                y={tooth.y - 4}
                width="8"
                height="8"
                rx="2"
                className={`cursor-pointer transition-all duration-300 hover:scale-110 ${getToothColor(toothData)}`}
                onClick={() => onToothClick(toothData)}
              />
            )
          })}
          
          {/* Labels pour identification */}
          <text x="30" y="65" fontSize="8" fill="#666" className="font-mono">HAUT</text>
          <text x="30" y="85" fontSize="8" fill="#666" className="font-mono">BAS</text>
        </svg>
      </div>
      
      {/* Légende */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-white border-2 border-green-500 rounded"></div>
            <span>Sortie ✅</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-100 border-2 border-yellow-500 rounded"></div>
            <span>En retard ⚠️</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-100 border border-blue-500 rounded"></div>
            <span>Bientôt 🔄</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
            <span>Pas encore ⏳</span>
          </div>
        </div>
        
        {/* Guide des formes */}
        <div className="text-xs  border-t pt-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">Types de dents:</span>
            <div className="flex space-x-3">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-3 bg-gray-300 rounded-sm"></div>
                <span>Incisives</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-gray-300 rounded"></div>
                <span>Molaires</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-0 h-0 border-l-2 border-r-2 border-b-3 border-transparent border-b-gray-300"></div>
                <span>Canines</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ✅ Composant Courbes de Croissance
const GrowthChart = ({ type, data, percentiles, currentValue, ageInWeeks }: any) => {
  const chartHeight = 200
  const chartWidth = 300
  
  const getPercentilePath = (percentile: number) => {
    const ages = [0, 4, 8, 12, 24, 52]
    let path = ''
    ages.forEach((age, index) => {
      const x = (age / 52) * chartWidth
      const value = percentiles[age][`p${percentile}`]
      const maxValue = Math.max(...ages.map(a => percentiles[a].p97))
      const y = chartHeight - (value / maxValue) * chartHeight
      path += index === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`
    })
    return path
  }

  const getCurrentPosition = () => {
    const x = (ageInWeeks / 52) * chartWidth
    const maxValue = Math.max(...[0, 4, 8, 12, 24, 52].map(a => percentiles[a].p97))
    const y = chartHeight - (currentValue / maxValue) * chartHeight
    return { x, y }
  }

  const currentPos = getCurrentPosition()

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-200">
      <h4 className="font-semibold mb-3">
        Courbe de {type === 'weight' ? 'Poids' : 'Taille'}
      </h4>
      
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-64">
        {/* Grille */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Courbes percentiles */}
        <path d={getPercentilePath(3)} stroke="#ef4444" strokeWidth="1" fill="none" strokeDasharray="2,2" />
        <path d={getPercentilePath(10)} stroke="#f97316" strokeWidth="1" fill="none" strokeDasharray="1,1" />
        <path d={getPercentilePath(25)} stroke="#eab308" strokeWidth="1" fill="none" />
        <path d={getPercentilePath(50)} stroke="#22c55e" strokeWidth="2" fill="none" />
        <path d={getPercentilePath(75)} stroke="#eab308" strokeWidth="1" fill="none" />
        <path d={getPercentilePath(90)} stroke="#f97316" strokeWidth="1" fill="none" strokeDasharray="1,1" />
        <path d={getPercentilePath(97)} stroke="#ef4444" strokeWidth="1" fill="none" strokeDasharray="2,2" />
        
        {/* Point actuel */}
        <circle cx={currentPos.x} cy={currentPos.y} r="4" fill="#6366f1" stroke="white" strokeWidth="2" />
      </svg>
      
      <div className="flex justify-between text-xs  mt-2">
        <span>0m</span>
        <span>3m</span>
        <span>6m</span>
        <span>12m</span>
      </div>
    </div>
  )
}

// ✅ Modal d'édition des mesures
const EditGrowthModal = ({ entry, isOpen, onClose, onSave }: any) => {
  const [editData, setEditData] = useState({
    date: '',
    weight: '',
    height: '',
    headCircumference: '',
    notes: ''
  })

  useEffect(() => {
    if (entry && isOpen) {
      const date = entry.date ? ensureDate(entry.date) || new Date() : new Date()
      setEditData({
        date: date.toISOString().slice(0, 10),
        weight: entry.weight?.toString() || '',
        height: entry.height?.toString() || '',
        headCircumference: entry.headCircumference?.toString() || '',
        notes: entry.notes || ''
      })
    }
  }, [entry, isOpen])

  const handleSave = useCallback(() => {
    if (!editData.date) return
    
    const updatedEntry = {
      ...entry,
      date: new Date(editData.date),
      weight: editData.weight ? parseInt(editData.weight) : undefined,
      height: editData.height ? parseInt(editData.height) : undefined,
      headCircumference: editData.headCircumference ? parseInt(editData.headCircumference) : undefined,
      notes: editData.notes
    }
    
    onSave(updatedEntry)
    onClose()
  }, [editData, entry, onSave, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-6 w-full max-w-md animate-slide-down">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
            Modifier les mesures
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 " />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium  mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Date des mesures
            </label>
            <input
              type="date"
              value={editData.date}
              onChange={(e) => setEditData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 border-2 border-transparent bg-gray-50 rounded-xl focus:border-primary-500 focus:bg-white transition-all duration-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium  mb-2">Poids (g)</label>
              <input
                type="number"
                value={editData.weight}
                onChange={(e) => setEditData(prev => ({ ...prev, weight: e.target.value }))}
                placeholder="Ex: 4500"
                className="w-full px-3 py-2 border-2 border-transparent bg-gray-50 rounded-xl focus:border-primary-500 focus:bg-white transition-all duration-300"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium  mb-2">Taille (cm)</label>
              <input
                type="number"
                value={editData.height}
                onChange={(e) => setEditData(prev => ({ ...prev, height: e.target.value }))}
                placeholder="Ex: 60"
                className="w-full px-3 py-2 border-2 border-transparent bg-gray-50 rounded-xl focus:border-primary-500 focus:bg-white transition-all duration-300"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium  mb-2">
              Périmètre crânien (cm)
            </label>
            <input
              type="number"
              value={editData.headCircumference}
              onChange={(e) => setEditData(prev => ({ ...prev, headCircumference: e.target.value }))}
              placeholder="Ex: 38"
              className="w-full px-3 py-2 border-2 border-transparent bg-gray-50 rounded-xl focus:border-primary-500 focus:bg-white transition-all duration-300"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium  mb-2">Notes</label>
            <textarea
              value={editData.notes}
              onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Contexte, observations..."
              rows={3}
              className="w-full px-3 py-2 border-2 border-transparent bg-gray-50 rounded-xl focus:border-primary-500 focus:bg-white transition-all duration-300 resize-none"
            />
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 bg-primary-500 text-white py-3 rounded-xl font-semibold hover:bg-primary-600 transition-all duration-300 flex items-center justify-center space-x-2 shadow-medium hover:scale-105"
          >
            <Save className="w-5 h-5" />
            <span>Sauvegarder</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-500 text-white py-3 rounded-xl font-semibold hover:bg-gray-600 transition-all duration-300 flex items-center justify-center space-x-2 shadow-medium hover:scale-105"
          >
            <X className="w-5 h-5" />
            <span>Annuler</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdvancedGrowthPage() {
  // ✅ TOUS les états d'abord
  const [showAddForm, setShowAddForm] = useState(false)
  const [newMeasurement, setNewMeasurement] = useState({
    weight: '', height: '', headCircumference: '', notes: ''
  })
  const [editingEntry, setEditingEntry] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [growthEntries, setGrowthEntries] = useState<any[]>([])
  const [teethStatus, setTeethStatus] = useState<Record<string, boolean>>({})
  const [selectedTooth, setSelectedTooth] = useState<any>(null)
  const [showTeethSymptoms, setShowTeethSymptoms] = useState(false)
  const [teethSymptoms, setTeethSymptoms] = useState({
    fever: false, drooling: false, irritability: false, sleepIssues: false
  })

  // ✅ Store hook
  const { 
    currentBaby, 
    updateBaby, 
    initializeData,
    initializeProfile,
    addGrowthEntry,
    updateGrowthEntry,
    removeGrowthEntry,
    getGrowthEntries
  } = useBabyTrackerStore()

  // ✅ TOUS les useEffect
  useEffect(() => {
    // Check for stored email and initialize profile from database
    const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('user-email') : null
    if (storedEmail && storedEmail !== 'nouveau.utilisateur@example.com') {
      console.log('Growth page: initializing profile for email:', storedEmail)
      initializeProfile(storedEmail)
    }
    initializeData()
  }, [initializeData, initializeProfile])

  useEffect(() => {
    if (currentBaby) {
      const entries = getGrowthEntries(currentBaby.id)
      setGrowthEntries(entries)
      
      // Add birth entry if no entries exist
      if (entries.length === 0) {
        const birthEntry = {
          id: Date.now().toString(),
          babyId: currentBaby.id,
          date: currentBaby.birthDate,
          weight: currentBaby.weight,
          height: currentBaby.height,
          notes: 'Mesures de naissance'
        }
        addGrowthEntry(birthEntry)
        setGrowthEntries([birthEntry])
      }
    }
  }, [currentBaby, getGrowthEntries, addGrowthEntry])

  // ✅ TOUS les useCallback
  const handleAddMeasurement = useCallback(async () => {
    if (!newMeasurement.weight && !newMeasurement.height) return

    const entry = {
      id: Date.now().toString(),
      babyId: currentBaby?.id || '',
      date: new Date(),
      weight: newMeasurement.weight ? parseInt(newMeasurement.weight) : undefined,
      height: newMeasurement.height ? parseInt(newMeasurement.height) : undefined,
      headCircumference: newMeasurement.headCircumference ? parseInt(newMeasurement.headCircumference) : undefined,
      notes: newMeasurement.notes || undefined
    }

    // Add to store
    addGrowthEntry(entry)
    
    // Enhanced logging to IndexedDB
    try {
      await babyTrackerDB.logActivity({
        id: `growth-${Date.now()}`,
        type: 'growth',
        action: 'measurement_added',
        babyId: entry.babyId,
        timestamp: new Date(),
        data: {
          weight: entry.weight,
          height: entry.height,
          headCircumference: entry.headCircumference,
          notes: entry.notes
        }
      })
    } catch (error) {
      console.warn('Failed to log activity to IndexedDB:', error)
    }
    
    // Update local state
    setGrowthEntries(prev => [...prev, entry])

    // Update baby's current measurements
    if (currentBaby) {
      const updates: any = {}
      if (entry.weight) updates.weight = entry.weight
      if (entry.height) updates.height = entry.height
      if (Object.keys(updates).length > 0) {
        updateBaby({ ...currentBaby, ...updates })
      }
    }

    setNewMeasurement({ weight: '', height: '', headCircumference: '', notes: '' })
    setShowAddForm(false)
  }, [newMeasurement, currentBaby, updateBaby, addGrowthEntry])

  const handleEditEntry = useCallback((entry: any) => {
    setEditingEntry(entry)
    setShowEditModal(true)
  }, [])

  const handleSaveEditedEntry = useCallback(async (updatedEntry: any) => {
    // Update in store
    updateGrowthEntry(updatedEntry.id, updatedEntry)
    
    // Enhanced logging to IndexedDB
    try {
      await babyTrackerDB.logActivity({
        id: `growth-edit-${Date.now()}`,
        type: 'growth',
        action: 'measurement_updated',
        babyId: updatedEntry.babyId,
        timestamp: new Date(),
        data: {
          entryId: updatedEntry.id,
          weight: updatedEntry.weight,
          height: updatedEntry.height,
          headCircumference: updatedEntry.headCircumference,
          notes: updatedEntry.notes
        }
      })
    } catch (error) {
      console.warn('Failed to log activity to IndexedDB:', error)
    }
    
    // Update local state
    setGrowthEntries(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e))
    
    // Update baby's current measurements if this is the latest entry
    if (currentBaby && updatedEntry.weight) {
      updateBaby({ ...currentBaby, weight: updatedEntry.weight, height: updatedEntry.height })
    }
  }, [currentBaby, updateBaby, updateGrowthEntry])

  const handleCloseModal = useCallback(() => {
    setShowEditModal(false)
    setEditingEntry(null)
  }, [])

  const handleToothClick = useCallback(async (tooth: any) => {
    const newStatus = !teethStatus[tooth.id]
    setSelectedTooth(tooth)
    setTeethStatus(prev => ({ ...prev, [tooth.id]: newStatus }))
    
    // Log tooth eruption activity (temporarily disabled)
    if (newStatus && currentBaby) {
      // try {
      //   await babyTrackerDB.logActivity({
      //     id: `tooth-${tooth.id}-${Date.now()}`,
      //     type: 'growth',
      //     action: 'tooth_erupted',
      //     babyId: currentBaby.id,
      //     timestamp: new Date(),
      //     data: {
      //       toothId: tooth.id,
      //       toothName: tooth.name,
      //       normalAge: tooth.normalAge,
      //       actualAge: getAgeInMonths(currentBaby.birthDate)
      //     }
      //   })
      // } catch (error) {
      //   console.warn('Failed to log tooth eruption to IndexedDB:', error)
      // }
    }
  }, [teethStatus, currentBaby])

  const calculateGrowthVelocity = useCallback(() => {
    if (growthEntries.length < 2) return null
    
    const sorted = [...growthEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const latest = sorted[sorted.length - 1]
    const previous = sorted[sorted.length - 2]
    
    if (!latest.weight || !previous.weight) return null
    
    const daysDiff = Math.abs(new Date(latest.date).getTime() - new Date(previous.date).getTime()) / (1000 * 60 * 60 * 24)
    const weightGain = latest.weight - previous.weight
    const dailyGain = weightGain / daysDiff
    
    return { totalGain: weightGain, dailyGain, period: Math.round(daysDiff) }
  }, [growthEntries])

  // ✅ useMemo pour calculs
  const calculations = useMemo(() => {
    if (!currentBaby) return null
    
    const ageInWeeks = getAgeInWeeks(currentBaby.birthDate)
    const ageInMonths = getAgeInMonths(currentBaby.birthDate)
    const ageInDays = getAgeInDays(currentBaby.birthDate)
    
    // Calcul percentiles
    const getPercentile = (value: number, type: 'weight' | 'height') => {
      const percentiles = GROWTH_PERCENTILES[type]
      const ages = Object.keys(percentiles).map(Number).sort((a, b) => a - b)
      const closestAge = ages.reduce((prev, curr) => 
        Math.abs(curr - ageInWeeks) < Math.abs(prev - ageInWeeks) ? curr : prev
      )
      
      const data = percentiles[closestAge as keyof typeof percentiles]
      
      if (value <= data.p3) return 3
      if (value <= data.p10) return 10
      if (value <= data.p25) return 25
      if (value <= data.p50) return 50
      if (value <= data.p75) return 75
      if (value <= data.p90) return 90
      return 97
    }

    const weightPercentile = getPercentile(currentBaby.weight, 'weight')
    const heightPercentile = getPercentile(currentBaby.height, 'height')
    
    // Prédiction taille adulte (formule de Tanner)
    const predictedHeight = currentBaby.gender === 'male' 
      ? (currentBaby.height * 1.08) + 8.5
      : (currentBaby.height * 1.08) + 5.7

    const velocity = calculateGrowthVelocity()
    
    return {
      ageInWeeks, ageInMonths, ageInDays,
      weightPercentile, heightPercentile,
      predictedHeight: Math.round(predictedHeight),
      velocity
    }
  }, [currentBaby, calculateGrowthVelocity])

  if (!currentBaby || !calculations) {
    return (
      <AppLayout currentPage="Croissance" showHeader={true}>
        <div className="p-6 text-center">
          <div className="glass-card rounded-3xl p-8 shadow-large">
            <Baby className="w-16 h-16 mx-auto  mb-4 animate-float" />
            <p className="text-gray-600">Créez d'abord le profil de votre bébé</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const { ageInWeeks, ageInMonths, ageInDays, weightPercentile, heightPercentile, predictedHeight, velocity } = calculations

  return (
    <AppLayout 
      className="bg-gradient-to-b from-primary-50 to-white"
      currentPage="Croissance"
      showHeader={true}
    >
      <div className="p-6 space-y-8">
        {/* ✅ Header avec métriques principales */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-3xl p-6 text-white shadow-large card-hover">
          <div className="text-center space-y-4">
            <p className="text-primary-100">
              {ageInMonths} mois • {ageInWeeks} semaines • {ageInDays} jours
            </p>
            
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
                <div className="text-3xl font-bold">{(currentBaby.weight / 1000).toFixed(1)}</div>
                <div className="text-primary-200 text-sm">kg</div>
                <div className="text-primary-100 text-xs">{weightPercentile}e percentile</div>
              </div>
              
              <div className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
                <div className="text-3xl font-bold">{currentBaby.height}</div>
                <div className="text-primary-200 text-sm">cm</div>
                <div className="text-primary-100 text-xs">{heightPercentile}e percentile</div>
              </div>
              
              <div className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
                <div className="text-3xl font-bold">{Object.keys(teethStatus).length}</div>
                <div className="text-primary-200 text-sm">dents</div>
                <div className="text-primary-100 text-xs">sur 20</div>
              </div>
              
              <div className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
                <div className="text-3xl font-bold">{predictedHeight}</div>
                <div className="text-primary-200 text-sm">cm</div>
                <div className="text-primary-100 text-xs">taille adulte</div>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Courbes de croissance WHO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GrowthChart 
            type="weight"
            data={growthEntries}
            percentiles={GROWTH_PERCENTILES.weight}
            currentValue={currentBaby.weight}
            ageInWeeks={ageInWeeks}
          />
          <GrowthChart 
            type="height"
            data={growthEntries}
            percentiles={GROWTH_PERCENTILES.height}
            currentValue={currentBaby.height}
            ageInWeeks={ageInWeeks}
          />
        </div>

        {/* ✅ Schéma dentaire interactif */}
        <TeethDiagram 
          teethStatus={teethStatus}
          onToothClick={handleToothClick}
          ageInMonths={ageInMonths}
        />

        {/* ✅ Indicateurs de croissance avancés */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card rounded-3xl p-6 shadow-large border border-gray-100">
            <h3 className="font-bold mb-4 flex items-center space-x-2">
              <Activity className="w-5 h-5 text-green-600" />
              <span>Vitesse de croissance</span>
            </h3>
            
            {velocity ? (
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    +{velocity.totalGain}g
                  </div>
                  <div className="text-sm text-gray-400">en {velocity.period} jours</div>
                </div>
                <div className="bg-green-50 rounded-xl p-3">
                  <div className="text-lg font-semibold text-green-800">
                    {velocity.dailyGain > 0 ? '+' : ''}{velocity.dailyGain.toFixed(1)}g/jour
                  </div>
                  <div className="text-sm text-green-600">
                    {velocity.dailyGain > 20 ? 'Excellente croissance' : 
                     velocity.dailyGain > 15 ? 'Bonne croissance' : 
                     velocity.dailyGain > 10 ? 'Croissance normale' : 'Croissance lente'}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center">
                Ajoutez plus de mesures pour calculer la vitesse
              </p>
            )}
          </div>

          <div className="glass-card rounded-3xl p-6 shadow-large border border-gray-100">
            <h3 className="font-bold mb-4 flex items-center space-x-2">
              <Target className="w-5 h-5 text-primary-600" />
              <span>Prédictions</span>
            </h3>
            
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-xl p-3">
                <div className="text-sm font-medium text-primary-800 dark:text-primary-200">Taille adulte estimée</div>
                <div className="text-xl font-bold text-primary-600">{predictedHeight} cm</div>
                <div className="text-xs text-primary-600">Formule de Tanner</div>
              </div>
              
              <div className="bg-purple-50 rounded-xl p-3">
                <div className="text-sm font-medium text-primary-800 dark:text-primary-200">Poids à 1 an</div>
                <div className="text-xl font-bold text-primary-600">
                  {(currentBaby.weight * 3 / 1000).toFixed(1)} kg
                </div>
                <div className="text-xs text-primary-600">Estimation pédiatrique</div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 shadow-large border border-gray-100">
            <h3 className="font-bold mb-4 flex items-center space-x-2">
              <Brain className="w-5 h-5 text-primary-600" />
              <span>Milestones</span>
            </h3>
            
            <div className="space-y-2">
              {PHYSICAL_MILESTONES
                .filter(m => Math.abs(m.ageMonths - ageInMonths) <= 1)
                .slice(0, 3)
                .map((milestone, index) => (
                  <div key={index} className={`p-2 rounded-lg text-sm ${
                    milestone.ageMonths <= ageInMonths 
                      ? 'bg-green-50 text-green-800' 
                      : 'bg-amber-50 text-amber-800'
                  }`}>
                    <div className="font-medium">{milestone.milestone}</div>
                    <div className="text-xs opacity-75">
                      {milestone.ageMonths}m • {milestone.category}
                      {milestone.ageMonths <= ageInMonths ? ' ✅' : ' ⏳'}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* ✅ Actions et formulaires */}
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-3xl p-6 font-semibold text-lg hover:from-primary-600 hover:to-primary-700 transition-all duration-300 transform hover:scale-105 shadow-large card-hover"
          >
            <Plus className="w-8 h-8 mx-auto mb-2 animate-gentle-bounce" />
            <div className="text-xl font-bold">Nouvelle mesure</div>
            <div className="text-sm opacity-80">Poids, taille, périmètre crânien</div>
          </button>
        ) : (
          <div className="glass-card rounded-3xl p-6 shadow-large border border-gray-200 animate-slide-up">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Scale className="w-5 h-5 text-primary-600" />
              <span className="gradient-text">Nouvelle mesure</span>
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium  mb-1">Poids (g)</label>
                  <input
                    type="number"
                    value={newMeasurement.weight}
                    onChange={(e) => setNewMeasurement(prev => ({ ...prev, weight: e.target.value }))}
                    placeholder="Ex: 4500"
                    className="w-full px-3 py-2 border-2 border-transparent bg-gray-50 rounded-xl focus:border-primary-500 focus:bg-white transition-all duration-300"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium  mb-1">Taille (cm)</label>
                  <input
                    type="number"
                    value={newMeasurement.height}
                    onChange={(e) => setNewMeasurement(prev => ({ ...prev, height: e.target.value }))}
                    placeholder="Ex: 60"
                    className="w-full px-3 py-2 border-2 border-transparent bg-gray-50 rounded-xl focus:border-primary-500 focus:bg-white transition-all duration-300"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium  mb-1">Périmètre crânien (cm)</label>
                <input
                  type="number"
                  value={newMeasurement.headCircumference}
                  onChange={(e) => setNewMeasurement(prev => ({ ...prev, headCircumference: e.target.value }))}
                  placeholder="Ex: 38"
                  className="w-full px-3 py-2 border-2 border-transparent bg-gray-50 rounded-xl focus:border-primary-500 focus:bg-white transition-all duration-300"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium  mb-1">Notes</label>
                <input
                  type="text"
                  value={newMeasurement.notes}
                  onChange={(e) => setNewMeasurement(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Ex: Visite chez le pédiatre"
                  className="w-full px-3 py-2 border-2 border-transparent bg-gray-50 rounded-xl focus:border-primary-500 focus:bg-white transition-all duration-300"
                />
              </div>
              
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={handleAddMeasurement}
                  disabled={!newMeasurement.weight && !newMeasurement.height}
                  className="flex-1 bg-primary-500 text-white py-3 rounded-xl font-semibold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 shadow-medium"
                >
                  Enregistrer
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setNewMeasurement({ weight: '', height: '', headCircumference: '', notes: '' })
                  }}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-xl font-semibold hover:bg-gray-600 transition-all duration-300 hover:scale-105 shadow-medium"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Historique des mesures */}
        <div className="glass-card rounded-3xl p-6 shadow-large border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 " />
              <span>Historique ({growthEntries.length})</span>
            </h3>
            
            <button className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-medium text-sm">
              <Download className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
          </div>

          {growthEntries.length === 0 ? (
            <div className="text-center py-8 ">
              <Scale className="w-12 h-12 mx-auto mb-4 opacity-30 animate-float" />
              <p className="font-medium">Aucune mesure enregistrée</p>
              <p className="text-sm">Ajoutez une première mesure ci-dessus</p>
            </div>
          ) : (
            <div className="space-y-3">
              {growthEntries
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all duration-300 hover-lift"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="bg-indigo-100 rounded-full p-3">
                        <Scale className="w-5 h-5 text-primary-600" />
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-4">
                          {entry.weight && (
                            <span className="font-medium text-gray-800">
                              {(entry.weight / 1000).toFixed(1)}kg
                            </span>
                          )}
                          {entry.height && (
                            <span className="font-medium text-gray-800">
                              {entry.height}cm
                            </span>
                          )}
                          {entry.headCircumference && (
                            <span className="text-sm text-gray-400">
                              PC: {entry.headCircumference}cm
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm ">
                          <ClientOnly fallback="--/--/----">
                            <span>{new Date(entry.date).toLocaleDateString('fr-FR')}</span>
                          </ClientOnly>
                          <ClientOnly fallback="--">
                            <span>{formatRelativeTime(entry.date)}</span>
                          </ClientOnly>
                        </div>
                        {entry.notes && (
                          <p className="text-xs  mt-1">{entry.notes}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleEditEntry(entry)}
                        className="text-primary-500 hover:text-primary-600 p-2 hover:bg-primary-50 rounded-lg transition-all duration-300 hover:scale-110"
                        title="Modifier"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={async () => {
                          // Log deletion activity
                          try {
                            await babyTrackerDB.logActivity({
                              id: `growth-delete-${Date.now()}`,
                              type: 'growth',
                              action: 'measurement_deleted',
                              babyId: entry.babyId,
                              timestamp: new Date(),
                              data: {
                                deletedEntryId: entry.id,
                                weight: entry.weight,
                                height: entry.height,
                                date: entry.date
                              }
                            })
                          } catch (error) {
                            console.warn('Failed to log activity to IndexedDB:', error)
                          }
                          
                          removeGrowthEntry(entry.id)
                          setGrowthEntries(prev => prev.filter(e => e.id !== entry.id))
                        }}
                        className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-all duration-300 hover:scale-110"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* ✅ Conseils personnalisés */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 animate-fade-in">
          <div className="flex items-start space-x-3">
            <Heart className="w-6 h-6 text-amber-600 mt-0.5 animate-gentle-bounce" />
            <div>
              <h4 className="font-semibold text-amber-800 mb-2">💡 Conseils personnalisés</h4>
              <div className="space-y-2 text-amber-700 text-sm">
                {weightPercentile < 10 && (
                  <p>• Poids sous le 10e percentile : consultez votre pédiatre pour évaluer la nutrition</p>
                )}
                {weightPercentile > 90 && (
                  <p>• Croissance rapide : assurez-vous d'une alimentation équilibrée</p>
                )}
                {ageInMonths >= 6 && Object.keys(teethStatus).length === 0 && (
                  <p>• Pas encore de dents à 6 mois : c'est normal, surveillez les signes de poussée</p>
                )}
                {velocity && velocity.dailyGain < 10 && (
                  <p>• Croissance ralentie : vérifiez l'apport calorique et consultez si persistant</p>
                )}
                <p>• Prochaine visite médicale recommandée : 
                  {ageInMonths < 2 ? ' dans 2 semaines' :
                   ageInMonths < 6 ? ' dans 1 mois' :
                   ageInMonths < 12 ? ' dans 2 mois' : ' dans 3 mois'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Modal d'édition */}
        <EditGrowthModal
          entry={editingEntry}
          isOpen={showEditModal}
          onClose={handleCloseModal}
          onSave={handleSaveEditedEntry}
        />
      </div>
    </AppLayout>
  )
}