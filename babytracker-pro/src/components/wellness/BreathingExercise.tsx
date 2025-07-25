'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Play, Pause, RotateCcw, X, Volume2, VolumeX } from 'lucide-react'

interface BreathingExerciseProps {
  isOpen: boolean
  onClose: () => void
  type?: 'stress' | 'sleep' | 'energy' | 'anxiety'
}

const BREATHING_PATTERNS = {
  stress: {
    name: 'Respiration Anti-stress',
    description: 'Technique 4-7-8 pour réduire le stress et l\'anxiété',
    inhale: 4,
    hold: 7,
    exhale: 8,
    cycles: 4,
    color: 'blue'
  },
  sleep: {
    name: 'Respiration Sommeil',
    description: 'Respiration profonde pour favoriser l\'endormissement',
    inhale: 4,
    hold: 4,
    exhale: 6,
    cycles: 6,
    color: 'purple'
  },
  energy: {
    name: 'Respiration Énergisante',
    description: 'Respiration dynamique pour augmenter l\'énergie',
    inhale: 3,
    hold: 2,
    exhale: 3,
    cycles: 8,
    color: 'orange'
  },
  anxiety: {
    name: 'Respiration Apaisante',
    description: 'Technique box breathing pour calmer l\'anxiété',
    inhale: 4,
    hold: 4,
    exhale: 4,
    cycles: 5,
    color: 'green'
  }
}

export default function BreathingExercise({ isOpen, onClose, type = 'stress' }: BreathingExerciseProps) {
  const pattern = BREATHING_PATTERNS[type]
  const [isActive, setIsActive] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale')
  const [currentCycle, setCurrentCycle] = useState(0)
  const [timeLeft, setTimeLeft] = useState(pattern.inhale)
  const [totalProgress, setTotalProgress] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setIsActive(false)
      setCurrentPhase('inhale')
      setCurrentCycle(0)
      setTimeLeft(pattern.inhale)
      setTotalProgress(0)
    }
  }, [isOpen, pattern.inhale])

  // Main breathing timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive && currentCycle < pattern.cycles) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Move to next phase
            if (currentPhase === 'inhale') {
              setCurrentPhase('hold')
              if (soundEnabled) {
                // Play hold sound
                playTone(200, 0.1)
              }
              return pattern.hold
            } else if (currentPhase === 'hold') {
              setCurrentPhase('exhale')
              if (soundEnabled) {
                // Play exhale sound
                playTone(150, 0.1)
              }
              return pattern.exhale
            } else {
              // Complete cycle
              setCurrentCycle(c => c + 1)
              setCurrentPhase('inhale')
              if (soundEnabled) {
                // Play inhale sound
                playTone(250, 0.1)
              }
              return pattern.inhale
            }
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, currentPhase, currentCycle, pattern, soundEnabled])

  // Calculate progress
  useEffect(() => {
    const totalPhases = pattern.cycles * 3 // inhale, hold, exhale
    const completedPhases = currentCycle * 3 + 
      (currentPhase === 'hold' ? 1 : currentPhase === 'exhale' ? 2 : 0)
    setTotalProgress((completedPhases / totalPhases) * 100)
  }, [currentCycle, currentPhase, pattern.cycles])

  // Complete exercise
  useEffect(() => {
    if (currentCycle >= pattern.cycles && isActive) {
      setIsActive(false)
      if (soundEnabled) {
        // Play completion sound
        playTone(300, 0.3)
        setTimeout(() => playTone(400, 0.3), 300)
      }
    }
  }, [currentCycle, pattern.cycles, isActive, soundEnabled])

  const playTone = (frequency: number, duration: number) => {
    if (!soundEnabled) return
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = frequency
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + duration)
    } catch (error) {
      console.log('Audio not supported')
    }
  }

  const handleStart = () => {
    setIsActive(true)
    if (soundEnabled) {
      playTone(250, 0.1)
    }
  }

  const handlePause = () => {
    setIsActive(false)
  }

  const handleReset = () => {
    setIsActive(false)
    setCurrentPhase('inhale')
    setCurrentCycle(0)
    setTimeLeft(pattern.inhale)
    setTotalProgress(0)
  }

  const getPhaseText = () => {
    switch (currentPhase) {
      case 'inhale': return 'Inspirez'
      case 'hold': return 'Retenez'
      case 'exhale': return 'Expirez'
    }
  }

  const getPhaseColor = () => {
    switch (currentPhase) {
      case 'inhale': return 'bg-green-500'
      case 'hold': return 'bg-yellow-500'
      case 'exhale': return 'bg-blue-500'
    }
  }

  const isCompleted = currentCycle >= pattern.cycles

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-8 w-full max-w-md animate-slide-down">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            {pattern.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-8 text-center">
          {pattern.description}
        </p>

        {/* Breathing circle */}
        <div className="relative w-48 h-48 mx-auto mb-8">
          {/* Progress ring */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-gray-200 dark:text-gray-600"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeDasharray={`${totalProgress * 2.83} 283`}
              className={`text-${pattern.color}-500 transition-all duration-1000`}
            />
          </svg>
          
          {/* Breathing circle */}
          <div 
            className={`absolute inset-4 rounded-full flex items-center justify-center transition-all duration-1000 ${getPhaseColor()}`}
            style={{
              transform: currentPhase === 'inhale' ? 'scale(1.2)' : 
                        currentPhase === 'hold' ? 'scale(1.2)' : 'scale(0.8)'
            }}
          >
            <div className="text-center text-white">
              <div className="text-2xl font-bold mb-1">{timeLeft}</div>
              <div className="text-sm">{getPhaseText()}</div>
            </div>
          </div>
        </div>

        {/* Progress info */}
        <div className="text-center mb-6">
          <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Cycle {currentCycle + 1} / {pattern.cycles}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {Math.round(totalProgress)}% terminé
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-4 mb-4">
          {!isActive && !isCompleted && (
            <button
              onClick={handleStart}
              className={`bg-${pattern.color}-500 text-white p-3 rounded-full hover:bg-${pattern.color}-600 transition-colors`}
            >
              <Play className="w-6 h-6" />
            </button>
          )}
          
          {isActive && (
            <button
              onClick={handlePause}
              className="bg-gray-500 text-white p-3 rounded-full hover:bg-gray-600 transition-colors"
            >
              <Pause className="w-6 h-6" />
            </button>
          )}
          
          <button
            onClick={handleReset}
            className="bg-gray-300 text-gray-700 p-3 rounded-full hover:bg-gray-400 transition-colors"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-3 rounded-full transition-colors ${
              soundEnabled 
                ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </button>
        </div>

        {/* Completion message */}
        {isCompleted && (
          <div className="text-center p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="text-green-800 font-semibold mb-2">
              🎉 Exercice terminé !
            </div>
            <div className="text-green-600 text-sm">
              Prenez un moment pour ressentir les bienfaits de cette respiration
            </div>
          </div>
        )}

        {/* Instructions */}
        {!isActive && !isCompleted && (
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center space-y-1">
            <div>Inspirez pendant {pattern.inhale}s</div>
            <div>Retenez pendant {pattern.hold}s</div>
            <div>Expirez pendant {pattern.exhale}s</div>
          </div>
        )}
      </div>
    </div>
  )
}