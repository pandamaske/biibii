'use client'

import React from 'react'

const Growth: React.FC = () => {
  return (
    <section className="p-6 flex flex-col gap-8">
      <h1 className="text-4xl font-bold text-center">Croissance</h1>
      
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl p-8 text-white shadow-xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">📏 Suivi de croissance</h2>
          <p className="text-blue-100">Module en cours de développement</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="font-semibold mb-4 ">Fonctionnalités à venir :</h3>
        <ul className="space-y-2 ">
          <li>• Suivi du poids et de la taille</li>
          <li>• Courbes de croissance</li>
          <li>• Percentiles par âge</li>
          <li>• Historique des mesures</li>
        </ul>
      </div>
    </section>
  )
}

export default Growth