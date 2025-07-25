'use client'

import { AppLayout } from '@/components/layout'
import HealthDashboard from '@/components/modules/HealthDashboard'

export default function HealthPage() {
  // For now, using a hardcoded baby ID - in a real app this would come from user context/auth
  // Using the ID from the sample baby we created
  const babyId = "user-1753219621644_baby_1"

  return (
    <AppLayout>
      <div className="p-4 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Santé
            </h1>
          </div>

          <HealthDashboard babyId={babyId} />
        </div>
      </div>
    </AppLayout>
  )
}