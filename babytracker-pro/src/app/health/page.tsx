'use client'

import { AppLayout } from '@/components/layout'
import HealthDashboard from '@/components/modules/HealthDashboard'

export default function HealthPage() {
  // For now, using a hardcoded baby ID - in a real app this would come from user context/auth
  // Using the ID from the sample baby we created
  const babyId = "user-1753219621644_baby_1"

  return (
    <AppLayout currentPage="Santé" showHeader={true}>
      <div className="p-4 pb-24">
        <div className="max-w-4xl mx-auto">
          <HealthDashboard babyId={babyId} />
        </div>
      </div>
    </AppLayout>
  )
}