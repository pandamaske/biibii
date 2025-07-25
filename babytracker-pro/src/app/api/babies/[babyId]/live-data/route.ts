// API route for live baby data - always fetches fresh from database
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ babyId: string }> }
) {
  try {
    const { babyId } = await params
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('email')
    
    if (!userEmail) {
      return NextResponse.json({ 
        error: 'User email parameter is required' 
      }, { status: 400 })
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify the baby belongs to this user
    const baby = await prisma.baby.findFirst({
      where: {
        id: babyId,
        userId: user.id
      }
    })

    if (!baby) {
      return NextResponse.json({ error: 'Baby not found' }, { status: 404 })
    }

    // Get today's date range
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfDay = new Date(startOfDay)
    endOfDay.setDate(startOfDay.getDate() + 1)

    // Fetch today's data in parallel for better performance
    const [feedingEntries, sleepEntries, diaperEntries] = await Promise.all([
      // Today's feeding entries
      prisma.feedingEntry.findMany({
        where: {
          babyId,
          userId: user.id,
          startTime: {
            gte: startOfDay,
            lt: endOfDay
          }
        },
        orderBy: { startTime: 'desc' }
      }),

      // Today's sleep entries
      prisma.sleepEntry.findMany({
        where: {
          babyId,
          userId: user.id,
          startTime: {
            gte: startOfDay,
            lt: endOfDay
          }
        },
        orderBy: { startTime: 'desc' }
      }),

      // Today's diaper entries
      prisma.diaperEntry.findMany({
        where: {
          babyId,
          userId: user.id,
          time: {
            gte: startOfDay,
            lt: endOfDay
          }
        },
        orderBy: { time: 'desc' }
      })
    ])

    // Calculate live statistics
    const totalMilk = feedingEntries
      .filter((f: any) => f.type === 'biberon')
      .reduce((sum: number, f: any) => sum + (f.amount || 0), 0)

    const totalSleepMinutes = sleepEntries
      .filter((s: any) => s.endTime)
      .reduce((sum: number, s: any) => {
        const start = new Date(s.startTime).getTime()
        const end = new Date(s.endTime!).getTime()
        return sum + Math.floor((end - start) / (1000 * 60))
      }, 0)

    // Get last feeding for feeding interval calculation
    const lastFeeding = feedingEntries.length > 0 ? feedingEntries[0] : null
    const timeSinceLastFeeding = lastFeeding 
      ? Math.floor((now.getTime() - new Date(lastFeeding.startTime).getTime()) / (1000 * 60))
      : null

    // Get baby info with fresh data
    const babyInfo = await prisma.baby.findUnique({
      where: { id: babyId },
      select: {
        id: true,
        name: true,
        birthDate: true,
        weight: true,
        height: true,
        avatar: true,
        gender: true
      }
    })

    return NextResponse.json({
      baby: babyInfo,
      liveData: {
        feedings: feedingEntries.map((entry: any) => ({
          id: entry.id,
          babyId: entry.babyId,
          kind: entry.type,
          amount: entry.amount,
          startTime: entry.startTime,
          endTime: entry.endTime,
          duration: entry.duration,
          mood: entry.mood,
          notes: entry.notes
        })),
        sleeps: sleepEntries.map((entry: any) => ({
          id: entry.id,
          babyId: entry.babyId,
          startTime: entry.startTime,
          endTime: entry.endTime,
          duration: entry.duration,
          quality: entry.quality,
          type: entry.type,
          location: entry.location,
          notes: entry.notes
        })),
        diapers: diaperEntries.map((entry: any) => ({
          id: entry.id,
          babyId: entry.babyId,
          time: entry.time,
          timestamp: entry.time, // Also add timestamp alias for compatibility
          type: entry.type,
          wetness: entry.wetness,
          stool: entry.stool,
          diaper: entry.diaper,
          mood: entry.mood,
          changedBy: entry.changedBy,
          notes: entry.notes,
          // Legacy fields for backward compatibility
          amount: entry.amount,
          color: entry.color
        })),
        stats: {
          totalMilk,
          totalSleepMinutes,
          feedingCount: feedingEntries.length,
          sleepCount: sleepEntries.length,
          diaperCount: diaperEntries.length,
          timeSinceLastFeeding,
          lastFeeding: lastFeeding ? {
            time: lastFeeding.startTime,
            amount: lastFeeding.amount,
            type: lastFeeding.type,
            mood: lastFeeding.mood
          } : null
        }
      },
      timestamp: now.toISOString()
    })
  } catch (error) {
    console.error('Error fetching live baby data:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}