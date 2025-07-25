'use client'

import React, { useState } from 'react'

const Sleep: React.FC = () => {
  const [timer, setTimer] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  return (
    <section className="p-6 flex flex-col gap-8">
      <h1 className="text-4xl font-bold text-center">Module Sommeil</h1>

      <div className="flex flex-wrap gap-6 justify-center">
        <button 
          className="w-40 h-40 rounded-2xl bg-purple-500 text-white text-2xl font-semibold flex flex-col items-center justify-center hover:bg-purple-600 active:scale-95 transition"
          onClick={() => setIsRunning(!isRunning)}
        >
          {isRunning ? '⏸️' : '▶️'}<br />
          {isRunning ? 'Pause' : 'Démarrer'}
        </button>

        <button 
          className="w-40 h-40 rounded-2xl bg-purple-500 text-white text-2xl font-semibold flex flex-col items-center justify-center hover:bg-purple-600 active:scale-95 transition"
          onClick={() => {
            setTimer(0)
            setIsRunning(false)
          }}
        >
          🔄<br />
          Reset
        </button>
      </div>

      <div className="text-center">
        <p className="text-6xl font-mono font-bold text-purple-700">
          {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
        </p>
        <p className="text-gray-600 mt-2">Temps de sommeil</p>
      </div>

      <div className="max-w-xl mx-auto w-full">
        <p className="text-center  mt-12">
          Module sommeil - Version simplifiée en cours de développement
        </p>
      </div>
    </section>
  )
}

export default Sleep