import { prisma } from './prisma'
import { 
  VaccineEntry, 
  Appointment, 
  SymptomEntry, 
  MedicationEntry,
  DevelopmentalMilestone,
  HealthAlert 
} from './types'

export class HealthService {
  
  // ===== VACCINE MANAGEMENT =====
  
  static async getVaccineSchedule(babyId: string) {
    const vaccines = await prisma.vaccineEntry.findMany({
      where: { babyId },
      orderBy: { scheduledDate: 'asc' }
    })

    // Group by age groups for timeline display
    const grouped = vaccines.reduce((acc: any, vaccine) => {
      const group = vaccine.ageGroup || 'other'
      if (!acc[group]) acc[group] = []
      acc[group].push(vaccine)
      return acc
    }, {})

    return { vaccines, grouped }
  }

  static async createVaccineEntry(data: Partial<VaccineEntry>) {
    return await prisma.vaccineEntry.create({ data })
  }

  static async updateVaccineStatus(id: string, status: string, completedDate?: Date, location?: string, reactions?: string) {
    return await prisma.vaccineEntry.update({
      where: { id },
      data: {
        status,
        ...(completedDate && { completedDate }),
        ...(location && { location }),
        ...(reactions && { reactions })
      }
    })
  }

  static async getOverdueVaccines(babyId: string) {
    const now = new Date()
    return await prisma.vaccineEntry.findMany({
      where: {
        babyId,
        status: { in: ['due', 'overdue'] },
        scheduledDate: { lt: now }
      },
      orderBy: { scheduledDate: 'asc' }
    })
  }

  // ===== APPOINTMENT MANAGEMENT =====

  static async getAppointments(babyId: string, status?: string) {
    return await prisma.appointment.findMany({
      where: {
        babyId,
        ...(status && { status })
      },
      include: { provider: true },
      orderBy: { date: 'asc' }
    })
  }

  static async createAppointment(data: any) {
    return await prisma.appointment.create({
      data,
      include: { provider: true }
    })
  }

  static async getUpcomingAppointments(babyId: string) {
    const now = new Date()
    return await prisma.appointment.findMany({
      where: {
        babyId,
        status: 'scheduled',
        date: { gte: now }
      },
      include: { provider: true },
      orderBy: { date: 'asc' },
      take: 5
    })
  }

  // ===== SYMPTOM TRACKING =====

  static async getSymptomHistory(babyId: string, limit?: number) {
    return await prisma.symptomEntry.findMany({
      where: { babyId },
      include: {
        symptoms: true,
        photos: true,
        medications: true
      },
      orderBy: { date: 'desc' },
      ...(limit && { take: limit })
    })
  }

  static async createSymptomEntry(data: any) {
    const { symptoms, photos, medications, ...entryData } = data
    
    const entry = await prisma.symptomEntry.create({
      data: entryData
    })

    // Add related data
    if (symptoms?.length) {
      await prisma.symptom.createMany({
        data: symptoms.map((s: any) => ({ ...s, symptomEntryId: entry.id }))
      })
    }

    if (photos?.length) {
      await prisma.symptomPhoto.createMany({
        data: photos.map((p: any) => ({ ...p, symptomEntryId: entry.id }))
      })
    }

    if (medications?.length) {
      await prisma.medicationDose.createMany({
        data: medications.map((m: any) => ({ ...m, symptomEntryId: entry.id }))
      })
    }

    return await prisma.symptomEntry.findUnique({
      where: { id: entry.id },
      include: {
        symptoms: true,
        photos: true,
        medications: true
      }
    })
  }

  // ===== MEDICATION MANAGEMENT =====

  static async getActiveMedications(babyId: string) {
    const now = new Date()
    return await prisma.medicationEntry.findMany({
      where: {
        babyId,
        OR: [
          { endDate: null },
          { endDate: { gte: now } }
        ]
      },
      include: {
        medication: true,
        doses: {
          orderBy: { time: 'desc' },
          take: 5
        }
      },
      orderBy: { startDate: 'desc' }
    })
  }

  static async logMedicationDose(medicationEntryId: string, dosage: number, unit: string) {
    return await prisma.medicationDose.create({
      data: {
        medicationEntryId,
        dosage,
        unit,
        time: new Date()
      }
    })
  }

  static async calculateNextDose(medicationEntryId: string) {
    const medication = await prisma.medicationEntry.findUnique({
      where: { id: medicationEntryId },
      include: {
        doses: {
          orderBy: { time: 'desc' },
          take: 1
        }
      }
    })

    if (!medication) return null

    const lastDose = medication.doses[0]
    if (!lastDose) return new Date() // First dose

    // Simple frequency parsing - can be enhanced
    const frequencyHours = this.parseFrequency(medication.frequency)
    const nextDue = new Date(lastDose.time.getTime() + frequencyHours * 60 * 60 * 1000)
    
    return nextDue
  }

  private static parseFrequency(frequency: string): number {
    // Parse frequency strings like "every 4 hours", "twice daily", etc.
    const hourMatches = frequency.match(/(\d+)\s*hour/i)
    if (hourMatches) return parseInt(hourMatches[1])
    
    if (frequency.includes('daily') || frequency.includes('day')) {
      if (frequency.includes('twice') || frequency.includes('2')) return 12
      if (frequency.includes('thrice') || frequency.includes('3')) return 8
      if (frequency.includes('four') || frequency.includes('4')) return 6
      return 24 // once daily
    }
    
    return 6 // Default to 6 hours if can't parse
  }

  // ===== MILESTONE TRACKING =====

  static async getMilestones(babyId: string, category?: string) {
    return await prisma.developmentalMilestone.findMany({
      where: {
        babyId,
        ...(category && { category })
      },
      orderBy: { minWeeks: 'asc' }
    })
  }

  static async markMilestoneAchieved(id: string, photos?: string[], notes?: string) {
    return await prisma.developmentalMilestone.update({
      where: { id },
      data: {
        achieved: true,
        achievedDate: new Date(),
        ...(photos && { photos }),
        ...(notes && { notes })
      }
    })
  }

  static async getMilestonesForAge(babyId: string, ageInWeeks: number) {
    return await prisma.developmentalMilestone.findMany({
      where: {
        babyId,
        minWeeks: { lte: ageInWeeks },
        maxWeeks: { gte: ageInWeeks }
      },
      orderBy: { category: 'asc' }
    })
  }

  // ===== HEALTH ALERTS =====

  static async generateHealthAlerts(babyId: string) {
    const alerts: any[] = []
    
    // Check overdue vaccines
    const overdueVaccines = await this.getOverdueVaccines(babyId)
    if (overdueVaccines.length > 0) {
      alerts.push({
        babyId,
        type: 'vaccine_due',
        severity: 'urgent',
        title: 'Vaccins en retard',
        message: `${overdueVaccines.length} vaccin(s) en retard`,
        actionRequired: true
      })
    }

    // Check upcoming appointments
    const upcomingAppointments = await this.getUpcomingAppointments(babyId)
    for (const appointment of upcomingAppointments) {
      const daysDiff = Math.ceil((appointment.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      if (daysDiff <= 3 && daysDiff > 0) {
        alerts.push({
          babyId,
          type: 'appointment_reminder',
          severity: 'info',
          title: 'Rendez-vous à venir',
          message: `${appointment.type} avec ${appointment.provider.name} dans ${daysDiff} jour(s)`,
          dueDate: appointment.date
        })
      }
    }

    // Check medication reminders
    const activeMedications = await this.getActiveMedications(babyId)
    for (const medication of activeMedications) {
      const nextDose = await this.calculateNextDose(medication.id)
      if (nextDose && nextDose <= new Date()) {
        alerts.push({
          babyId,
          type: 'medication_reminder',
          severity: 'warning',
          title: 'Médicament à donner',
          message: `Il est temps de donner ${medication.medication.name}`,
          actionRequired: true
        })
      }
    }

    return alerts
  }

  static async createHealthAlert(data: any) {
    return await prisma.healthAlert.create({ data })
  }

  static async getHealthAlerts(babyId: string, unreadOnly = false) {
    return await prisma.healthAlert.findMany({
      where: {
        babyId,
        ...(unreadOnly && { isRead: false })
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  static async markAlertRead(id: string) {
    return await prisma.healthAlert.update({
      where: { id },
      data: { isRead: true }
    })
  }

  // ===== HEALTH SUMMARY =====

  static async getHealthSummary(babyId: string) {
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Get recent activity
    const [
      recentSymptoms,
      upcomingAppointments,
      overdueVaccines,
      recentMilestones,
      unreadAlerts
    ] = await Promise.all([
      prisma.symptomEntry.findMany({
        where: { babyId, date: { gte: oneWeekAgo } },
        include: { symptoms: true }
      }),
      this.getUpcomingAppointments(babyId),
      this.getOverdueVaccines(babyId),
      prisma.developmentalMilestone.findMany({
        where: { 
          babyId, 
          achieved: true,
          achievedDate: { gte: oneWeekAgo }
        }
      }),
      this.getHealthAlerts(babyId, true)
    ])

    return {
      recentSymptoms: recentSymptoms.length,
      upcomingAppointments: upcomingAppointments.length,
      overdueVaccines: overdueVaccines.length,
      recentMilestones: recentMilestones.length,
      unreadAlerts: unreadAlerts.length,
      lastUpdate: now
    }
  }
}