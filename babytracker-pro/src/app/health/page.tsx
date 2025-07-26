'use client'
import { useBabyTrackerStore } from '@/lib/store'
import { AppLayout } from '@/components/layout'
import HealthDashboard from '@/components/modules/HealthDashboard'



  

export default function HealthPage() {
  // For now, using a hardcoded baby ID - in a real app this would come from user context/auth
  // Using the ID from the sample baby we created
  const {
    currentBaby,
    initializeData,
    initializeProfile
  } = useBabyTrackerStore()
  
  const babyId = currentBaby?.id

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