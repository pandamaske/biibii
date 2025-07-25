'use client'

import React, { useState, useRef, useEffect } from 'react'
import { AlertTriangle, Thermometer, Info } from 'lucide-react'

interface TemperatureSelectorProps {
  value: number
  onChange: (temperature: number) => void
  unit?: 'celsius' | 'fahrenheit'
  size?: 'small' | 'medium' | 'large'
}

const TemperatureSelector: React.FC<TemperatureSelectorProps> = ({
  value,
  onChange,
  unit = 'celsius',
  size = 'medium'
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  
  // Medical temperature ranges in Celsius
  const tempRanges = {
    hypothermic: { min: 30, max: 35.9, color: '#3B82F6', label: 'Hypothermie' },
    normal: { min: 36, max: 37.4, color: '#10B981', label: 'Normal' },
    lowFever: { min: 37.5, max: 38.4, color: '#F59E0B', label: 'Fièvre légère' },
    fever: { min: 38.5, max: 39.4, color: '#F97316', label: 'Fièvre' },
    highFever: { min: 39.5, max: 40.9, color: '#EF4444', label: 'Fièvre élevée' },
    hyperthermia: { min: 41, max: 44, color: '#DC2626', label: 'Hyperthermie' }
  }

  // Convert Celsius to Fahrenheit if needed
  const convertTemp = (celsius: number) => {
    return unit === 'fahrenheit' ? (celsius * 9/5) + 32 : celsius
  }

  const convertTocelsius = (temp: number) => {
    return unit === 'fahrenheit' ? (temp - 32) * 5/9 : temp
  }

  // Get temperature range info
  const getTempRangeInfo = (temp: number) => {
    for (const [key, range] of Object.entries(tempRanges)) {
      if (temp >= range.min && temp <= range.max) {
        return { ...range, key }
      }
    }
    return tempRanges.hyperthermia // Default to highest range if above all
  }

  // Size configurations
  const sizeConfig = {
    small: { radius: 80, strokeWidth: 12, fontSize: 14 },
    medium: { radius: 100, strokeWidth: 16, fontSize: 16 },
    large: { radius: 120, strokeWidth: 20, fontSize: 18 }
  }

  const config = sizeConfig[size]
  const center = config.radius + 20
  const circumference = 2 * Math.PI * config.radius

  // Temperature range (30°C to 44°C)
  const minTemp = 30
  const maxTemp = 44
  const tempRange = maxTemp - minTemp

  // Convert temperature to angle (0° at top, clockwise)
  const tempToAngle = (temp: number) => {
    const normalizedTemp = Math.max(minTemp, Math.min(maxTemp, temp))
    const ratio = (normalizedTemp - minTemp) / tempRange
    return ratio * 300 - 150 // 300° arc, starting from -150°
  }

  // Convert angle to temperature
  const angleToTemp = (angle: number) => {
    const normalizedAngle = Math.max(-150, Math.min(150, angle))
    const ratio = (normalizedAngle + 150) / 300
    return minTemp + (ratio * tempRange)
  }

  // Get coordinates for angle
  const getCoordinatesFromAngle = (angle: number, radius: number) => {
    const radian = (angle * Math.PI) / 180
    return {
      x: center + radius * Math.sin(radian),
      y: center - radius * Math.cos(radian)
    }
  }

  // Handle mouse/touch events
  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging) return

    const svg = svgRef.current
    if (!svg) return

    const rect = svg.getBoundingClientRect()
    const centerX = rect.left + center
    const centerY = rect.top + center

    const x = event.clientX - centerX
    const y = event.clientY - centerY

    let angle = Math.atan2(x, -y) * (180 / Math.PI)
    
    // Constrain to the valid range
    if (angle < -150) angle = -150
    if (angle > 150) angle = 150

    const newTemp = angleToTemp(angle)
    onChange(Math.round(newTemp * 10) / 10) // Round to 1 decimal place
  }

  const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    setIsDragging(true)
    handlePointerMove(event)
  }

  const handlePointerUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    const handleGlobalPointerUp = () => setIsDragging(false)
    document.addEventListener('pointerup', handleGlobalPointerUp)
    return () => document.removeEventListener('pointerup', handleGlobalPointerUp)
  }, [])

  // Create temperature range arcs
  const createTempRangeArcs = () => {
    return Object.entries(tempRanges).map(([key, range]) => {
      const startAngle = tempToAngle(range.min)
      const endAngle = tempToAngle(range.max)
      
      const startCoords = getCoordinatesFromAngle(startAngle, config.radius)
      const endCoords = getCoordinatesFromAngle(endAngle, config.radius)
      
      const largeArcFlag = Math.abs(endAngle - startAngle) > 180 ? 1 : 0
      
      return (
        <path
          key={key}
          d={`M ${startCoords.x} ${startCoords.y} A ${config.radius} ${config.radius} 0 ${largeArcFlag} 1 ${endCoords.x} ${endCoords.y}`}
          stroke={range.color}
          strokeWidth={config.strokeWidth}
          fill="none"
          strokeLinecap="round"
        />
      )
    })
  }

  // Current temperature info
  const currentTempInfo = getTempRangeInfo(value)
  const currentAngle = tempToAngle(value)
  const knobPosition = getCoordinatesFromAngle(currentAngle, config.radius)

  // Create graduation marks
  const graduations = []
  for (let temp = minTemp; temp <= maxTemp; temp += 1) {
    const angle = tempToAngle(temp)
    const isMainGrad = temp % 2 === 0
    const outerRadius = config.radius + (isMainGrad ? 8 : 4)
    const innerRadius = config.radius - 2
    
    const outerPos = getCoordinatesFromAngle(angle, outerRadius)
    const innerPos = getCoordinatesFromAngle(angle, innerRadius)
    
    graduations.push(
      <line
        key={temp}
        x1={innerPos.x}
        y1={innerPos.y}
        x2={outerPos.x}
        y2={outerPos.y}
        stroke="#6B7280"
        strokeWidth={isMainGrad ? 2 : 1}
      />
    )
    
    // Add temperature labels for main graduations
    if (isMainGrad) {
      const labelRadius = config.radius + 20
      const labelPos = getCoordinatesFromAngle(angle, labelRadius)
      graduations.push(
        <text
          key={`label-${temp}`}
          x={labelPos.x}
          y={labelPos.y}
          textAnchor="middle"
          alignmentBaseline="middle"
          fontSize={10}
          fill="#6B7280"
          className="font-medium"
        >
          {temp}
        </text>
      )
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Temperature Display */}
      <div className={`text-center p-4 rounded-xl ${currentTempInfo.key === 'normal' ? 'bg-green-50 dark:bg-green-900/20' : 
        currentTempInfo.key === 'lowFever' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
        ['fever', 'highFever', 'hyperthermia'].includes(currentTempInfo.key) ? 'bg-red-50 dark:bg-red-900/20' :
        'bg-blue-50 dark:bg-blue-900/20'}`}>
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Thermometer className={`w-5 h-5 ${currentTempInfo.key === 'normal' ? 'text-green-600' : 
            currentTempInfo.key === 'lowFever' ? 'text-yellow-600' :
            ['fever', 'highFever', 'hyperthermia'].includes(currentTempInfo.key) ? 'text-red-600' :
            'text-blue-600'}`} />
          <span className={`text-2xl font-bold ${currentTempInfo.key === 'normal' ? 'text-green-700 dark:text-green-300' : 
            currentTempInfo.key === 'lowFever' ? 'text-yellow-700 dark:text-yellow-300' :
            ['fever', 'highFever', 'hyperthermia'].includes(currentTempInfo.key) ? 'text-red-700 dark:text-red-300' :
            'text-blue-700 dark:text-blue-300'}`}>
            {convertTemp(value).toFixed(1)}°{unit === 'celsius' ? 'C' : 'F'}
          </span>
        </div>
        <div className={`text-sm font-medium ${currentTempInfo.key === 'normal' ? 'text-green-600 dark:text-green-400' : 
          currentTempInfo.key === 'lowFever' ? 'text-yellow-600 dark:text-yellow-400' :
          ['fever', 'highFever', 'hyperthermia'].includes(currentTempInfo.key) ? 'text-red-600 dark:text-red-400' :
          'text-blue-600 dark:text-blue-400'}`}>
          {currentTempInfo.label}
        </div>
        
        {/* Warning for dangerous temperatures */}
        {['highFever', 'hyperthermia'].includes(currentTempInfo.key) && (
          <div className="flex items-center justify-center space-x-1 mt-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-medium">Consultez immédiatement un médecin</span>
          </div>
        )}
      </div>

      {/* Radial Temperature Selector */}
      <div className="relative">
        <svg
          ref={svgRef}
          width={center * 2}
          height={center * 2}
          className="cursor-pointer select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ touchAction: 'none' }}
        >
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={config.radius}
            stroke="#E5E7EB"
            strokeWidth={config.strokeWidth}
            fill="none"
          />

          {/* Temperature range arcs */}
          {createTempRangeArcs()}

          {/* Graduations */}
          {graduations}

          {/* Current temperature knob */}
          <circle
            cx={knobPosition.x}
            cy={knobPosition.y}
            r={8}
            fill={currentTempInfo.color}
            stroke="white"
            strokeWidth={3}
            className="drop-shadow-lg"
          />

          {/* Center temperature display */}
          <circle
            cx={center}
            cy={center}
            r={30}
            fill="white"
            stroke="#E5E7EB"
            strokeWidth={2}
            className="drop-shadow-sm"
          />
          <text
            x={center}
            y={center - 2}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize={config.fontSize}
            fill={currentTempInfo.color}
            className="font-bold"
          >
            {convertTemp(value).toFixed(1)}°
          </text>
        </svg>
      </div>

      {/* Medical Guidelines */}
      <div className="w-full max-w-md">
        <div className="flex items-center space-x-2 mb-3">
          <Info className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Guides médicaux
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2 text-xs">
          <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
            <span>Normal (nourrisson)</span>
            <span className="font-medium">36.0-37.4°C</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
            <span>Fièvre légère</span>
            <span className="font-medium">37.5-38.4°C</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
            <span>Fièvre modérée</span>
            <span className="font-medium">38.5-39.4°C</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
            <span>Fièvre élevée</span>
            <span className="font-medium">≥39.5°C</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TemperatureSelector