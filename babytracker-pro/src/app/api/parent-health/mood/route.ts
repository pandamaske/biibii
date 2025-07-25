import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userEmail, energy, mood, stress, confidence, notes, sleepHours, stressFactors, positiveMoments } = body

    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 })
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get or create parent health profile
    let parentProfile = await prisma.parentHealthProfile.findUnique({
      where: { userId: user.id }
    })

    if (!parentProfile) {
      // Create a basic profile if it doesn't exist
      parentProfile = await prisma.parentHealthProfile.create({
        data: {
          userId: user.id,
          deliveryType: 'vaginal', // Default - can be updated later
          deliveryDate: new Date(), // Default - can be updated later
        }
      })
    }

    // Get or create today's mental health tracking entry
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    let mentalHealthTracking = await prisma.mentalHealthTracking.findFirst({
      where: {
        parentProfileId: parentProfile.id,
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    if (!mentalHealthTracking) {
      mentalHealthTracking = await prisma.mentalHealthTracking.create({
        data: {
          parentProfileId: parentProfile.id,
          date: today,
          anxietyLevel: stress || 3,
          riskLevel: (mood <= 2 && energy <= 2) ? 'high' : 
                    (mood <= 3 || energy <= 3) ? 'moderate' : 'low'
        }
      })
    } else {
      // Update existing entry
      mentalHealthTracking = await prisma.mentalHealthTracking.update({
        where: { id: mentalHealthTracking.id },
        data: {
          anxietyLevel: stress || 3,
          riskLevel: (mood <= 2 && energy <= 2) ? 'high' : 
                    (mood <= 3 || energy <= 3) ? 'moderate' : 'low'
        }
      })
    }

    // Create or update today's mood entry
    let moodEntry = await prisma.moodEntry.findFirst({
      where: {
        mentalHealthTrackingId: mentalHealthTracking.id,
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    const moodData = {
      mentalHealthTrackingId: mentalHealthTracking.id,
      date: new Date(),
      mood: mood === 5 ? 'excellent' : 
            mood === 4 ? 'good' : 
            mood === 3 ? 'okay' : 
            mood === 2 ? 'low' : 'very_low',
      anxietyLevel: stress || 3,
      stressFactors: stressFactors || [],
      copingStrategies: positiveMoments || [],
      notes: notes || ''
    }

    if (moodEntry) {
      moodEntry = await prisma.moodEntry.update({
        where: { id: moodEntry.id },
        data: moodData
      })
    } else {
      moodEntry = await prisma.moodEntry.create({
        data: moodData
      })
    }

    // Create physical recovery entry for today
    let physicalRecovery = await prisma.physicalRecovery.findFirst({
      where: {
        parentProfileId: parentProfile.id,
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    const physicalData = {
      parentProfileId: parentProfile.id,
      date: new Date(),
      energyLevel: energy || 3,
      sleepQuality: sleepHours >= 7 ? 'good' : 
                   sleepHours >= 5 ? 'poor' : 'terrible',
      painLevel: Math.max(1, 11 - energy), // Inverse correlation
      lochia: 'moderate' // Default value
    }

    if (physicalRecovery) {
      physicalRecovery = await prisma.physicalRecovery.update({
        where: { id: physicalRecovery.id },
        data: physicalData
      })
    } else {
      physicalRecovery = await prisma.physicalRecovery.create({
        data: physicalData
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        moodEntry,
        mentalHealthTracking,
        physicalRecovery
      }
    })

  } catch (error) {
    console.error('Error saving mood data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userEmail = searchParams.get('userEmail')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 })
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get parent health profile
    const parentProfile = await prisma.parentHealthProfile.findUnique({
      where: { userId: user.id },
      include: {
        mentalHealth: {
          include: {
            moodEntries: true
          },
          where: startDate && endDate ? {
            date: {
              gte: new Date(startDate),
              lte: new Date(endDate)
            }
          } : undefined,
          orderBy: { date: 'desc' }
        },
        recoveryData: {
          where: startDate && endDate ? {
            date: {
              gte: new Date(startDate),
              lte: new Date(endDate)
            }
          } : undefined,
          orderBy: { date: 'desc' }
        }
      }
    })

    if (!parentProfile) {
      return NextResponse.json({ 
        data: {
          mentalHealth: [],
          recoveryData: []
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: parentProfile
    })

  } catch (error) {
    console.error('Error fetching mood data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}