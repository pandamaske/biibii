'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  CheckCircle2, Circle, Baby, Clock, Plus, Edit2, Trash2, 
  MessageSquare, ChevronDown, TrendingUp,
  Flame, Trophy, Sparkles, X
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { useBabyTrackerStore } from '@/lib/store'
import { getAgeInWeeks, getAgeInMonths } from '@/lib/utils'

// Enhanced types
interface ChecklistItem {
  id: string
  title: string
  description?: string
  category: 'feeding' | 'sleep' | 'hygiene' | 'health' | 'development' | 'custom'
  frequency: 'daily' | 'weekly' | 'monthly' | 'asneeded' | 'custom'
  customFrequency?: {
    type: 'days' | 'weeks' | 'specific'
    value: number | string[]
  }
  priority: 'low' | 'medium' | 'high'
  ageRange?: [number, number]
  icon: string
  completed: boolean
  completedAt?: Date
  completedBy?: string
  reminderTime?: string
  notes?: string
  attachments?: string[]
  streak?: number
  lastCompletedDate?: Date
  isCustom?: boolean
  tags?: string[]
}

interface TaskTemplate {
  id: string
  name: string
  description: string
  items: Omit<ChecklistItem, 'id' | 'completed' | 'completedAt'>[]
  ageRange: [number, number]
  category: string
}

interface CategoryItem {
  id: string
  name: string
  icon: string
  color: string
}

// Task templates library
const TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: 'newborn-essentials',
    name: 'Essentiels nouveau-né',
    description: 'Tâches critiques pour les premières semaines',
    ageRange: [0, 4],
    category: 'health',
    items: [
      { title: 'Vérifier la température', priority: 'high', category: 'health', frequency: 'daily', icon: '🌡️' },
      { title: 'Nettoyer le cordon', priority: 'high', category: 'hygiene', frequency: 'daily', icon: '🧼' }
    ]
  },
  {
    id: 'sleep-routine',
    name: 'Routine sommeil',
    description: 'Établir de bonnes habitudes de sommeil',
    ageRange: [2, 12],
    category: 'sleep',
    items: [
      { title: 'Bain du soir', priority: 'medium', category: 'hygiene', frequency: 'daily', icon: '🛁', reminderTime: '19:00' },
      { title: 'Histoire du soir', priority: 'low', category: 'development', frequency: 'daily', icon: '📚', reminderTime: '19:30' }
    ]
  }
]

export default function EnhancedChecklistPage() {
  // States
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [showCompleted, setShowCompleted] = useState(true)
  const [showAddTask, setShowAddTask] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [editingTask, setEditingTask] = useState<ChecklistItem | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'timeline'>('list')
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'all'>('today')
  
  // Streak tracking
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)

  // Get current baby from store
  const { currentBaby, initializeData, initializeProfile } = useBabyTrackerStore()

  useEffect(() => {
    // Check for stored email and initialize profile from database
    const storedEmail = localStorage.getItem('user-email')
    if (storedEmail && storedEmail !== 'nouveau.utilisateur@example.com') {
      console.log('Checklist page: initializing profile for email:', storedEmail)
      initializeProfile(storedEmail)
    }
    initializeData()
  }, [initializeData, initializeProfile])

  const ageInWeeks = currentBaby ? getAgeInWeeks(currentBaby.birthDate) : 0

  // Categories with colors - MOVED BEFORE stats useMemo
  const categories = [
    { id: 'all', name: 'Tout', icon: '📋', color: 'gray' },
    { id: 'feeding', name: 'Repas', icon: '🍼', color: 'blue' },
    { id: 'sleep', name: 'Sommeil', icon: '😴', color: 'purple' },
    { id: 'hygiene', name: 'Hygiène', icon: '🛁', color: 'cyan' },
    { id: 'health', name: 'Santé', icon: '🏥', color: 'red' },
    { id: 'development', name: 'Éveil', icon: '🧸', color: 'green' },
    { id: 'custom', name: 'Personnel', icon: '⭐', color: 'amber' }
  ]

  // Initialize with age-appropriate tasks
  useEffect(() => {
    if (!currentBaby) return
    
    const defaultTasks: ChecklistItem[] = [
      {
        id: '1',
        title: 'Biberon du matin',
        description: 'Premier repas de la journée',
        category: 'feeding',
        frequency: 'daily',
        priority: 'high',
        icon: '🍼',
        completed: false,
        reminderTime: '07:00',
        streak: 5
      },
      {
        id: '2',
        title: 'Temps sur le ventre',
        description: '15 minutes réparties dans la journée',
        category: 'development',
        frequency: 'daily',
        priority: 'medium',
        icon: '🤸',
        completed: false,
        tags: ['motricité', 'éveil']
      },
      {
        id: '3',
        title: 'Vitamines D',
        description: 'Dose quotidienne',
        category: 'health',
        frequency: 'daily',
        priority: 'high',
        icon: '💊',
        completed: false,
        reminderTime: '09:00'
      }
    ]
    setChecklist(defaultTasks)
    calculateStreak(defaultTasks)
  }, [currentBaby])

  // Calculate completion stats
  const stats = useMemo(() => {
    const todayTasks = checklist.filter(task => {
      if (dateFilter === 'all') return true
      if (dateFilter === 'today') return task.frequency === 'daily'
      if (dateFilter === 'week') return ['daily', 'weekly'].includes(task.frequency)
      return true
    })

    const completed = todayTasks.filter(t => t.completed).length
    const total = todayTasks.length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

    // Category breakdown
    const categoryStats = categories.slice(1).map(cat => {
      const catTasks = todayTasks.filter(t => t.category === cat.id)
      const catCompleted = catTasks.filter(t => t.completed).length
      return {
        ...cat,
        completed: catCompleted,
        total: catTasks.length,
        percentage: catTasks.length > 0 ? Math.round((catCompleted / catTasks.length) * 100) : 0
      }
    })

    return { completed, total, percentage, categoryStats }
  }, [checklist, dateFilter, categories])

  // Toggle task completion
  const toggleTask = useCallback((taskId: string) => {
    setChecklist(prev => {
      const updated = prev.map(task => {
        if (task.id === taskId) {
          const completed = !task.completed
          return {
            ...task,
            completed,
            completedAt: completed ? new Date() : undefined,
            completedBy: completed ? 'Maman' : undefined,
            lastCompletedDate: completed ? new Date() : task.lastCompletedDate,
            streak: completed ? (task.streak || 0) + 1 : Math.max(0, (task.streak || 0) - 1)
          }
        }
        return task
      })
      calculateStreak(updated)
      return updated
    })
  }, [])

  // Calculate streak
  const calculateStreak = (tasks: ChecklistItem[]) => {
    const dailyTasks = tasks.filter(t => t.frequency === 'daily')
    const allCompleted = dailyTasks.length > 0 && dailyTasks.every(t => t.completed)
    
    if (allCompleted) {
      setStreak(prev => {
        const newStreak = prev + 1
        setBestStreak(current => Math.max(current, newStreak))
        return newStreak
      })
    }
  }

  // Add custom task
  const addCustomTask = (task: Omit<ChecklistItem, 'id' | 'completed'>) => {
    const newTask: ChecklistItem = {
      ...task,
      id: Date.now().toString(),
      completed: false,
      isCustom: true
    }
    setChecklist(prev => [...prev, newTask])
    setShowAddTask(false)
  }

  // Delete task
  const deleteTask = (taskId: string) => {
    setChecklist(prev => prev.filter(t => t.id !== taskId))
  }

  // Apply template
  const applyTemplate = (template: TaskTemplate) => {
    const newTasks: ChecklistItem[] = template.items.map((item, index) => ({
      ...item,
      id: `${Date.now()}-${index}`,
      completed: false
    }))
    setChecklist(prev => [...prev, ...newTasks])
    setShowTemplates(false)
  }

  // Get filtered tasks
  const filteredTasks = useMemo(() => {
    let tasks = checklist

    // Category filter
    if (selectedCategory !== 'all') {
      tasks = tasks.filter(t => t.category === selectedCategory)
    }

    // Priority filter
    if (selectedPriority !== 'all') {
      tasks = tasks.filter(t => t.priority === selectedPriority)
    }

    // Completed filter
    if (!showCompleted) {
      tasks = tasks.filter(t => !t.completed)
    }

    // Date filter
    if (dateFilter === 'today') {
      tasks = tasks.filter(t => t.frequency === 'daily')
    } else if (dateFilter === 'week') {
      tasks = tasks.filter(t => ['daily', 'weekly'].includes(t.frequency))
    }

    // Sort by priority and completion
    return tasks.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }, [checklist, selectedCategory, selectedPriority, showCompleted, dateFilter])

  // Group tasks by time
  const tasksByTime = useMemo(() => {
    const morning = filteredTasks.filter(t => {
      const time = t.reminderTime
      return time && time >= '05:00' && time < '12:00'
    })
    const afternoon = filteredTasks.filter(t => {
      const time = t.reminderTime
      return time && time >= '12:00' && time < '18:00'
    })
    const evening = filteredTasks.filter(t => {
      const time = t.reminderTime
      return time && time >= '18:00' && time < '22:00'
    })
    const noTime = filteredTasks.filter(t => !t.reminderTime)

    return { morning, afternoon, evening, noTime }
  }, [filteredTasks])

  if (!currentBaby) {
    return (
      <AppLayout 
        className="bg-gradient-to-b from-primary-400 to-white"
        currentPage="Checklist"
        showHeader={true}
      >
        <div className="p-6 text-center">
          <div className="glass-card rounded-3xl p-8 shadow-large">
            <Baby className="w-16 h-16 mx-auto  mb-4 animate-float" />
            <p className="text-gray-600">Créez d&apos;abord le profil de votre bébé</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout 
      className="bg-gradient-to-b from-primary-400 to-white"
      currentPage="Checklist"
      showHeader={true}
    >
      <div className="p-6 pb-24 space-y-6 animate-fade-in">
        {/* Enhanced Header with Stats */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-3xl p-6 text-white shadow-large animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div>
            </div>
            
            {/* Streak Badge */}
            {streak > 0 && (
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2 flex items-center space-x-2">
                <Flame className="w-5 h-5 text-orange-300" />
                <span className="font-bold">{streak} jours</span>
              </div>
            )}
          </div>

          {/* Progress Ring */}
          <div className="flex items-center justify-center my-6">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="white"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${stats.percentage * 3.52} 352`}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{stats.percentage}%</span>
                <span className="text-xs text-primary-100">Complété</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{stats.completed}</div>
              <div className="text-xs text-primary-100">Terminées</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{stats.total - stats.completed}</div>
              <div className="text-xs text-primary-100">Restantes</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{bestStreak}</div>
              <div className="text-xs text-primary-100">Record</div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="glass-card backdrop-blur-sm rounded-3xl p-4 shadow-large animate-slide-up">
          {/* View Mode Tabs */}
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${
                viewMode === 'list' 
                  ? 'bg-primary-500 text-white shadow-lg' 
                  : 'bg-gray-100 '
              }`}
            >
              Liste
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${
                viewMode === 'grid' 
                  ? 'bg-primary-500 text-white shadow-lg' 
                  : 'bg-gray-100 '
              }`}
            >
              Grille
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${
                viewMode === 'timeline' 
                  ? 'bg-primary-500 text-white shadow-lg' 
                  : 'bg-gray-100 '
              }`}
            >
              Timeline
            </button>
          </div>

          {/* Date Filter */}
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setDateFilter('today')}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                dateFilter === 'today' 
                  ? 'bg-primary-100 text-primary-700 border-2 border-primary-300' 
                  : 'bg-gray-50 '
              }`}
            >
              Aujourd&apos;hui
            </button>
            <button
              onClick={() => setDateFilter('week')}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                dateFilter === 'week' 
                  ? 'bg-primary-100 text-primary-700 border-2 border-primary-300' 
                  : 'bg-gray-50 '
              }`}
            >
              Cette semaine
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                dateFilter === 'all' 
                  ? 'bg-primary-100 text-primary-700 border-2 border-primary-300' 
                  : 'bg-gray-50 '
              }`}
            >
              Toutes
            </button>
          </div>

          {/* Category Filter - Horizontal Scroll */}
          <div className="overflow-x-auto pb-2 mb-3">
            <div className="flex space-x-2 min-w-max">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-primary-500 text-white shadow-lg scale-105'
                      : 'bg-gray-100 '
                  }`}
                >
                  <span className="mr-2">{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedPriority('all')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedPriority === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 '
                }`}
              >
                Toutes
              </button>
              <button
                onClick={() => setSelectedPriority('high')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedPriority === 'high' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-600'
                }`}
              >
                Urgent
              </button>
              <button
                onClick={() => setSelectedPriority('medium')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedPriority === 'medium' ? 'bg-yellow-500 text-white' : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                Moyen
              </button>
              <button
                onClick={() => setSelectedPriority('low')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedPriority === 'low' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700'
                }`}
              >
                Faible
              </button>
            </div>

            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="text-xs  font-medium"
            >
              {showCompleted ? 'Masquer' : 'Afficher'} terminées
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowAddTask(true)}
            className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 rounded-2xl font-medium shadow-large flex items-center justify-center space-x-2 hover:scale-105 transition-transform"
          >
            <Plus className="w-5 h-5" />
            <span>Nouvelle tâche</span>
          </button>
          
          <button
            onClick={() => setShowTemplates(true)}
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 rounded-2xl font-medium shadow-large flex items-center justify-center space-x-2 hover:scale-105 transition-transform"
          >
            <Sparkles className="w-5 h-5" />
            <span>Templates</span>
          </button>
        </div>

        {/* Task Views */}
        {viewMode === 'list' && (
          <div className="space-y-3">
            {filteredTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onEdit={setEditingTask}
                onDelete={deleteTask}
              />
            ))}
          </div>
        )}

        {viewMode === 'grid' && (
          <div className="grid grid-cols-2 gap-3">
            {filteredTasks.map(task => (
              <TaskGridCard
                key={task.id}
                task={task}
                onToggle={toggleTask}
              />
            ))}
          </div>
        )}

        {viewMode === 'timeline' && (
          <TimelineView
            tasks={tasksByTime}
            onToggle={toggleTask}
            onEdit={setEditingTask}
          />
        )}

        {/* Empty State */}
        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">Aucune tâche trouvée</p>
            <p className="text-gray-400 text-sm">Ajoutez une nouvelle tâche ou changez les filtres</p>
          </div>
        )}

        {/* Category Progress */}
        <div className="glass-card backdrop-blur-sm rounded-3xl p-4 shadow-large">
          <h3 className="font-bold mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-primary-600" />
            Progression par catégorie
          </h3>
          
          <div className="space-y-3">
            {stats.categoryStats.map(cat => (
              <div key={cat.id} className="flex items-center space-x-3">
                <div className="text-2xl w-10 text-center">{cat.icon}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium ">{cat.name}</span>
                    <span className="text-xs ">{cat.completed}/{cat.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        cat.color === 'blue' ? 'bg-blue-500' :
                        cat.color === 'purple' ? 'bg-purple-500' :
                        cat.color === 'cyan' ? 'bg-cyan-500' :
                        cat.color === 'red' ? 'bg-red-500' :
                        cat.color === 'green' ? 'bg-green-500' :
                        'bg-amber-500'
                      }`}
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
                <div className="text-sm font-bold ">
                  {cat.percentage}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        {stats.percentage === 100 && (
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl p-6 text-white shadow-large animate-fade-in">
            <div className="text-center">
              <Trophy className="w-16 h-16 mx-auto mb-3 animate-gentle-bounce" />
              <h3 className="text-2xl font-bold mb-2">Journée parfaite ! 🎉</h3>
              <p className="text-yellow-100">
                Toutes les tâches sont complétées ! Votre dévouement est exemplaire.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <AddTaskModal
          onClose={() => setShowAddTask(false)}
          onAdd={addCustomTask}
          categories={categories}
        />
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <TemplatesModal
          templates={TASK_TEMPLATES.filter(t => 
            ageInWeeks >= t.ageRange[0] && ageInWeeks <= t.ageRange[1]
          )}
          onClose={() => setShowTemplates(false)}
          onApply={applyTemplate}
        />
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={(updated) => {
            setChecklist(prev => prev.map(t => t.id === updated.id ? updated : t))
            setEditingTask(null)
          }}
          categories={categories}
        />
      )}
    </AppLayout>
  )
}

// Task Card Component
function TaskCard({ task, onToggle, onEdit, onDelete }: {
  task: ChecklistItem
  onToggle: (id: string) => void
  onEdit: (task: ChecklistItem) => void
  onDelete: (id: string) => void
}) {
  const [showActions, setShowActions] = useState(false)

  const priorityColors = {
    high: 'border-red-300 bg-red-50',
    medium: 'border-yellow-300 bg-yellow-50',
    low: 'border-green-300 bg-green-50'
  }

  const categoryColors = {
    feeding: 'bg-blue-100 text-blue-700',
    sleep: 'bg-purple-100 text-purple-700',
    hygiene: 'bg-cyan-100 text-cyan-700',
    health: 'bg-red-100 text-red-700',
    development: 'bg-green-100 text-green-700',
    custom: 'bg-amber-100 text-amber-700'
  }

  return (
    <div className={`relative glass-card rounded-2xl p-4 shadow-medium border-2 transition-all hover-lift ${
      task.completed 
        ? 'border-green-300 bg-green-50/50 opacity-75' 
        : priorityColors[task.priority]
    }`}>
      <div className="flex items-start space-x-3">
        <button
          onClick={() => onToggle(task.id)}
          className="mt-0.5 flex-shrink-0"
        >
          {task.completed ? (
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          ) : (
            <Circle className="w-6 h-6  hover:text-green-500 transition-colors" />
          )}
        </button>

        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={`font-medium text-gray-800 ${task.completed ? 'line-through' : ''}`}>
                <span className="mr-2">{task.icon}</span>
                {task.title}
              </h4>
              
              {task.description && (
                <p className="text-sm  mt-1">{task.description}</p>
              )}

              <div className="flex items-center space-x-3 mt-2">
                <span className={`text-xs px-2 py-1 rounded-lg font-medium ${categoryColors[task.category]}`}>
                  {task.category}
                </span>
                
                {task.reminderTime && (
                  <span className="text-xs  flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {task.reminderTime}
                  </span>
                )}
                
                {task.streak && task.streak > 0 && (
                  <span className="text-xs text-orange-600 flex items-center font-medium">
                    <Flame className="w-3 h-3 mr-1" />
                    {task.streak} jours
                  </span>
                )}

                {task.completedAt && (
                  <span className="text-xs text-green-600">
                    ✓ {new Date(task.completedAt).toLocaleTimeString('fr-FR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                )}
              </div>

              {task.notes && (
                <div className="mt-2 text-xs  bg-gray-100 rounded-lg p-2">
                  <MessageSquare className="w-3 h-3 inline mr-1" />
                  {task.notes}
                </div>
              )}

              {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {task.tags.map(tag => (
                    <span key={tag} className="text-xs bg-gray-200  px-2 py-0.5 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ChevronDown className={`w-4 h-4  transition-transform ${
                showActions ? 'rotate-180' : ''
              }`} />
            </button>
          </div>

          {showActions && (
            <div className="absolute right-4 top-12 bg-white rounded-xl shadow-xl border border-gray-200 p-1 z-10">
              <button
                onClick={() => {
                  onEdit(task)
                  setShowActions(false)
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 rounded-lg text-sm"
              >
                <Edit2 className="w-4 h-4 " />
                <span>Modifier</span>
              </button>
              
              {task.isCustom && (
                <button
                  onClick={() => {
                    onDelete(task.id)
                    setShowActions(false)
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-red-50 rounded-lg text-sm text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Supprimer</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Grid Card Component
function TaskGridCard({ task, onToggle }: {
  task: ChecklistItem
  onToggle: (id: string) => void
}) {
  return (
    <button
      onClick={() => onToggle(task.id)}
      className={`relative glass-card rounded-2xl p-4 shadow-medium border-2 transition-all hover:scale-105 ${
        task.completed 
          ? 'border-green-300 bg-green-50/50' 
          : 'border-gray-200 hover:border-green-300'
      }`}
    >
      <div className="text-3xl mb-2 text-center">{task.icon}</div>
      <h4 className={`text-sm font-medium text-center ${
        task.completed ? 'text-green-700 line-through' : 'text-gray-800'
      }`}>
        {task.title}
      </h4>
      
      {task.streak && task.streak > 0 && (
        <div className="absolute top-2 right-2 bg-orange-100 text-orange-600 rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold">
          {task.streak}
        </div>
      )}
      
      <div className="absolute bottom-2 right-2">
        {task.completed ? (
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        ) : (
          <Circle className="w-5 h-5 text-gray-300" />
        )}
      </div>
    </button>
  )
}

// Timeline View Component
function TimelineView({ tasks, onToggle, onEdit }: {
  tasks: { morning: ChecklistItem[], afternoon: ChecklistItem[], evening: ChecklistItem[], noTime: ChecklistItem[] }
  onToggle: (id: string) => void
  onEdit: (task: ChecklistItem) => void
}) {
  const timeSlots = [
    { key: 'morning', label: 'Matin', icon: '🌅', tasks: tasks.morning },
    { key: 'afternoon', label: 'Après-midi', icon: '☀️', tasks: tasks.afternoon },
    { key: 'evening', label: 'Soir', icon: '🌙', tasks: tasks.evening },
    { key: 'noTime', label: 'Toute la journée', icon: '📅', tasks: tasks.noTime }
  ]

  return (
    <div className="space-y-6">
      {timeSlots.map(slot => (
        <div key={slot.key} className="glass-card backdrop-blur-sm rounded-2xl p-4 shadow-large">
          <h3 className="font-semibold mb-3 flex items-center">
            <span className="text-2xl mr-2">{slot.icon}</span>
            {slot.label}
            <span className="ml-auto text-sm ">
              {slot.tasks.filter(t => t.completed).length}/{slot.tasks.length}
            </span>
          </h3>
          
          {slot.tasks.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Aucune tâche</p>
          ) : (
            <div className="space-y-2">
              {slot.tasks.map(task => (
                <div key={task.id} className="flex items-center space-x-3 p-2">
                  <button onClick={() => onToggle(task.id)}>
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <Circle className="w-5 h-5 " />
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span>{task.icon}</span>
                      <span className={`text-sm font-medium ${
                        task.completed ? 'text-gray-500 line-through' : 'text-gray-800'
                      }`}>
                        {task.title}
                      </span>
                      {task.reminderTime && (
                        <span className="text-xs ">{task.reminderTime}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// Add Task Modal
function AddTaskModal({ onClose, onAdd, categories }: {
  onClose: () => void
  onAdd: (task: Omit<ChecklistItem, 'id' | 'completed'>) => void
  categories: CategoryItem[]
}) {
  const [task, setTask] = useState({
    title: '',
    description: '',
    category: 'custom' as ChecklistItem['category'],
    frequency: 'daily' as ChecklistItem['frequency'],
    priority: 'medium' as ChecklistItem['priority'],
    icon: '⭐',
    reminderTime: '',
    notes: '',
    tags: [] as string[]
  })

  const handleSubmit = () => {
    if (!task.title) return
    onAdd(task)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-down">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Nouvelle tâche</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium  mb-2">
              Titre *
            </label>
            <input
              type="text"
              value={task.title}
              onChange={(e) => setTask(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
              placeholder="Ex: Donner les vitamines"
            />
          </div>

          <div>
            <label className="block text-sm font-medium  mb-2">
              Description
            </label>
            <textarea
              value={task.description}
              onChange={(e) => setTask(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none resize-none"
              rows={2}
              placeholder="Détails supplémentaires..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium  mb-2">
                Catégorie
              </label>
              <select
                value={task.category}
                onChange={(e) => setTask(prev => ({ ...prev, category: e.target.value as ChecklistItem['category'] }))}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
              >
                {categories.slice(1).map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium  mb-2">
                Fréquence
              </label>
              <select
                value={task.frequency}
                onChange={(e) => setTask(prev => ({ ...prev, frequency: e.target.value as ChecklistItem['frequency'] }))}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
              >
                <option value="daily">Quotidien</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="monthly">Mensuel</option>
                <option value="asneeded">Au besoin</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium  mb-2">
                Priorité
              </label>
              <select
                value={task.priority}
                onChange={(e) => setTask(prev => ({ ...prev, priority: e.target.value as ChecklistItem['priority'] }))}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
              >
                <option value="high">Haute</option>
                <option value="medium">Moyenne</option>
                <option value="low">Faible</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium  mb-2">
                Rappel
              </label>
              <input
                type="time"
                value={task.reminderTime}
                onChange={(e) => setTask(prev => ({ ...prev, reminderTime: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium  mb-2">
              Icône
            </label>
            <div className="flex flex-wrap gap-2">
              {['⭐', '💊', '🍼', '🛁', '📚', '🎯', '🏥', '🧸'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => setTask(prev => ({ ...prev, icon: emoji }))}
                  className={`text-2xl p-2 rounded-xl border-2 transition-all ${
                    task.icon === emoji 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={handleSubmit}
            disabled={!task.title}
            className="flex-1 bg-primary-500 text-white py-3 rounded-xl font-semibold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Ajouter
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200  py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}

// Templates Modal
function TemplatesModal({ templates, onClose, onApply }: {
  templates: TaskTemplate[]
  onClose: () => void
  onApply: (template: TaskTemplate) => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto animate-slide-down">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Templates de tâches</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {templates.map(template => (
            <div key={template.id} className="bg-gray-50 rounded-2xl p-4 hover:bg-gray-100 transition-colors">
              <h4 className="font-semibold mb-2">{template.name}</h4>
              <p className="text-sm  mb-3">{template.description}</p>
              
              <div className="space-y-1 mb-3">
                {template.items.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="text-xs  flex items-center">
                    <span className="mr-2">{item.icon}</span>
                    {item.title}
                  </div>
                ))}
                {template.items.length > 3 && (
                  <p className="text-xs ">
                    +{template.items.length - 3} autres tâches
                  </p>
                )}
              </div>
              
              <button
                onClick={() => onApply(template)}
                className="w-full bg-purple-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-purple-600 transition-colors"
              >
                Utiliser ce template
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Edit Task Modal
function EditTaskModal({ task, onClose, onSave, categories }: {
  task: ChecklistItem
  onClose: () => void
  onSave: (task: ChecklistItem) => void
  categories: CategoryItem[]
}) {
  const [editedTask, setEditedTask] = useState(task)

  const handleSave = () => {
    onSave(editedTask)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-down">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Modifier la tâche</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium  mb-2">
              Titre
            </label>
            <input
              type="text"
              value={editedTask.title}
              onChange={(e) => setEditedTask(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium  mb-2">
              Notes
            </label>
            <textarea
              value={editedTask.notes || ''}
              onChange={(e) => setEditedTask(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none resize-none"
              rows={3}
              placeholder="Ajouter des notes..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium  mb-2">
              Priorité
            </label>
            <select
              value={editedTask.priority}
              onChange={(e) => setEditedTask(prev => ({ ...prev, priority: e.target.value as ChecklistItem['priority'] }))}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
            >
              <option value="high">Haute</option>
              <option value="medium">Moyenne</option>
              <option value="low">Faible</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium  mb-2">
              Rappel
            </label>
            <input
              type="time"
              value={editedTask.reminderTime || ''}
              onChange={(e) => setEditedTask(prev => ({ ...prev, reminderTime: e.target.value }))}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 bg-primary-500 text-white py-3 rounded-xl font-semibold hover:bg-primary-600 transition-all"
          >
            Sauvegarder
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200  py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}