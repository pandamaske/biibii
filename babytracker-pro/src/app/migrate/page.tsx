'use client'

import React, { useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Database, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function MigratePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleMigration = async () => {
    setIsLoading(true)
    setResult(null)
    setError(null)

    try {
      const response = await fetch('/api/migrate-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: 'migrate-my-data-2025'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Migration failed')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Migration error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AppLayout 
      className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20"
      currentPage="Migration"
      showHeader={true}
    >
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Database className="w-16 h-16 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Data Migration
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Import your exported data to the production database
          </p>
        </div>

        {/* Migration Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
          {!result && !error && (
            <>
              <div className="text-center mb-6">
                <Upload className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Ready to Migrate Data
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  This will import all your local data to the production database.
                  The process includes users, babies, feeding entries, sleep entries, 
                  diaper entries, growth entries, health data, and activity logs.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <h3 className="font-medium text-yellow-800">Important Notes</h3>
                    <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                      <li>• This operation will update existing records with the same IDs</li>
                      <li>• Make sure your database-export.json file is in the project root</li>
                      <li>• The process may take a few minutes to complete</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                onClick={handleMigration}
                disabled={isLoading}
                className="w-full bg-blue-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Running Migration...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>Start Migration</span>
                  </>
                )}
              </button>
            </>
          )}

          {/* Success Result */}
          {result && result.success && (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-600 mb-4">
                Migration Completed Successfully! 🎉
              </h2>
              
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                <h3 className="font-semibold text-green-800 mb-4">Migration Results:</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{result.results.users}</div>
                    <div className="text-green-700">Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{result.results.babies}</div>
                    <div className="text-green-700">Babies</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{result.results.feedingEntries}</div>
                    <div className="text-green-700">Feeding Entries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{result.results.sleepEntries}</div>
                    <div className="text-green-700">Sleep Entries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{result.results.diaperEntries}</div>
                    <div className="text-green-700">Diaper Entries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{result.results.growthEntries}</div>
                    <div className="text-green-700">Growth Entries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{result.results.vaccineEntries}</div>
                    <div className="text-green-700">Vaccines</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{result.results.symptomEntries}</div>
                    <div className="text-green-700">Symptoms</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{result.results.activityLogs}</div>
                    <div className="text-green-700">Activity Logs</div>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your data has been successfully imported to the production database. 
                You can now use the application with all your existing data.
              </p>

              <button
                onClick={() => window.location.href = '/'}
                className="bg-blue-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-600 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          )}

          {/* Error Result */}
          {error && (
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-red-600 mb-4">
                Migration Failed
              </h2>
              
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                <p className="text-red-700">{error}</p>
              </div>

              <button
                onClick={() => {
                  setError(null)
                  setResult(null)
                }}
                className="bg-red-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-red-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}