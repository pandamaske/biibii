'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Profile page error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-400 to-white dark:to-gray-900 flex items-center justify-center p-6">
      <div className="glass-card rounded-3xl p-8 shadow-large text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        
        <h2 className="text-2xl font-bold dark:text-gray-200 mb-4">
          Erreur de chargement
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Une erreur s'est produite lors du chargement de votre profil. 
          Veuillez réessayer.
        </p>
        
        <button
          onClick={reset}
          className="w-full bg-purple-500 text-white py-3 rounded-xl font-semibold hover:bg-purple-600 transition-colors flex items-center justify-center space-x-2"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Réessayer</span>
        </button>
      </div>
    </div>
  )
}
