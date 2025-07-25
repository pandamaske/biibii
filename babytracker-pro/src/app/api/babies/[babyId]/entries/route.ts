// API route for baby entries (feeding, sleep, diaper)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'



export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ babyId: string }> }
) {
  try {
    const { babyId } = await params
    const body = await req.json()
    const { userId, type } = body

    let entry
    let action

    if (type === 'feeding' || type === 'biberon' || type === 'tétée' || type === 'solide') {
      // Feeding entry
      const { amount, startTime, endTime, duration, mood, notes } = body
      
      // Validate dates
      const feedingStartTime = new Date(startTime)
      if (isNaN(feedingStartTime.getTime())) {
        return NextResponse.json({ error: 'Invalid startTime format' }, { status: 400 })
      }
      
      const feedingEndTime = endTime ? new Date(endTime) : null
      if (endTime && isNaN(feedingEndTime?.getTime() ?? 0)) {
        return NextResponse.json({ error: 'Invalid endTime format' }, { status: 400 })
      }
      
      entry = await prisma.feedingEntry.create({
        data: {
          babyId: babyId,
          userId,
          type: type === 'feeding' ? body.feedingType || 'biberon' : type,
          amount: amount || null,
          startTime: feedingStartTime,
          endTime: feedingEndTime,
          duration: duration || null,
          mood: mood || null,
          notes: notes || null,
        },
      })
      action = 'feeding_created'
    } else if (type === 'sleep') {
      // Sleep entry
      const { startTime, endTime, duration, quality, sleepType, location, notes } = body
      
      // Validate dates
      const sleepStartTime = new Date(startTime)
      if (isNaN(sleepStartTime.getTime())) {
        return NextResponse.json({ error: 'Invalid startTime format' }, { status: 400 })
      }
      
      const sleepEndTime = endTime ? new Date(endTime) : null
      if (endTime && isNaN(sleepEndTime?.getTime() ?? 0)) {
        return NextResponse.json({ error: 'Invalid endTime format' }, { status: 400 })
      }
      
      entry = await prisma.sleepEntry.create({
        data: {
          babyId: babyId,
          userId,
          startTime: sleepStartTime,
          endTime: sleepEndTime,
          duration: duration || null,
          quality: quality || null,
          type: sleepType || null,
          location: location || null,
          notes: notes || null,
        },
      })
      action = 'sleep_created'
    } else if (type === 'diaper') {
      // Diaper entry with enhanced fields
      const { time, diaperType, wetness, stool, diaper, mood, changedBy, notes, amount, color } = body
      
      // Validate time is a valid date
      const diaperTime = new Date(time)
      if (isNaN(diaperTime.getTime())) {
        return NextResponse.json({ error: 'Invalid time format' }, { status: 400 })
      }
      
      entry = await prisma.diaperEntry.create({
        data: {
          babyId: babyId,
          userId,
          time: diaperTime,
          type: diaperType,
          
          // Enhanced fields
          wetness: wetness || null,
          stool: stool || null,
          diaper: diaper || null,
          mood: mood || null,
          changedBy: changedBy || null,
          notes: notes || null,
          
          // Legacy fields for backward compatibility
          amount: amount || null,
          color: color || null,
        },
      })
      action = 'diaper_created'
    } else if (type === 'growth') {
      // Growth entry
      const { date, weight, height, headCircumference, notes } = body
      
      // Validate date is a valid date
      const growthDate = new Date(date)
      if (isNaN(growthDate.getTime())) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
      }
      
      entry = await prisma.growthEntry.create({
        data: {
          babyId: babyId,
          date: growthDate,
          weight: weight ? parseInt(weight) : null,
          height: height ? parseInt(height) : null,
          headCirc: headCircumference ? parseInt(headCircumference) : null,
          notes: notes || null,
        },
      })
      action = 'growth_created'
    } else {
      return NextResponse.json({ error: 'Invalid entry type' }, { status: 400 })
    }

    // Log activity (only if userId is provided)
    if (userId) {
      await prisma.activityLog.create({
        data: {
          userId,
          babyId: babyId,
          action,
          data: { id: entry.id, type },
        },
      })
    }

    return NextResponse.json({ success: true, entry })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ babyId: string }> }
) {
  try {
    const { babyId } = await params
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('email')
    
    // Email is required for all entry lookups
    if (!userEmail) {
      return NextResponse.json({ 
        error: 'User email parameter is required for entry lookup' 
      }, { status: 400 })
    }

    // Find the user by email to get their ID
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const entryType = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '100')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    // Build date filter
    const dateFilter: { gte?: Date; lte?: Date } = {}
    if (startDate) dateFilter.gte = new Date(startDate)
    if (endDate) dateFilter.lte = new Date(endDate)

    const entries = []
    let total = 0

    if (!entryType || entryType === 'feeding') {
      const feedingEntries = await prisma.feedingEntry.findMany({
        where: {
          babyId,
          userId: user.id,
          ...(Object.keys(dateFilter).length > 0 && { startTime: dateFilter })
        },
        orderBy: { startTime: 'desc' },
        skip,
        take: limit
      })
      entries.push(...feedingEntries.map((entry: any) => ({ ...entry, type: 'feeding' })))
    }

    if (!entryType || entryType === 'sleep') {
      const sleepEntries = await prisma.sleepEntry.findMany({
        where: {
          babyId,
          userId: user.id,
          ...(Object.keys(dateFilter).length > 0 && { startTime: dateFilter })
        },
        orderBy: { startTime: 'desc' },
        skip,
        take: limit
      })
      entries.push(...sleepEntries.map((entry: any) => ({ ...entry, type: 'sleep' })))
    }

    if (!entryType || entryType === 'diaper') {
      const diaperEntries = await prisma.diaperEntry.findMany({
        where: {
          babyId,
          userId: user.id,
          ...(Object.keys(dateFilter).length > 0 && { time: dateFilter })
        },
        orderBy: { time: 'desc' },
        skip,
        take: limit
      })
      entries.push(...diaperEntries.map((entry: any) => ({ ...entry, type: 'diaper' })))
    }

    if (!entryType || entryType === 'growth') {
      const growthEntries = await prisma.growthEntry.findMany({
        where: {
          babyId,
          ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit
      })
      entries.push(...growthEntries.map((entry: any) => ({ ...entry, type: 'growth' })))
    }

entries.sort((a, b) => {
  const timeA = 'startTime' in a ? a.startTime : ('date' in a ? a.date : a.time)
  const timeB = 'startTime' in b ? b.startTime : ('date' in b ? b.date : b.time)
  return new Date(timeB).getTime() - new Date(timeA).getTime()
})


    total = entries.length

    return NextResponse.json({
      entries,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Error fetching entries:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ babyId: string }> }
) {
  try {
    const { babyId } = await params
    const { searchParams } = new URL(request.url)
    const entryId = searchParams.get('entryId')
    const entryType = searchParams.get('type')
    const userEmail = searchParams.get('email')

    console.log('DELETE request received:', { babyId, entryId, entryType, userEmail })

    if (!entryId || !entryType || !userEmail) {
      console.error('Missing required parameters:', { entryId, entryType, userEmail })
      return NextResponse.json({ 
        error: 'Entry ID, type, and user email are required' 
      }, { status: 400 })
    }

    // Find the user by email to get their ID
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let deletedEntry
    let action

    if (entryType === 'feeding') {
      // Verify entry belongs to user
      const entry = await prisma.feedingEntry.findFirst({
        where: { 
          id: entryId, 
          babyId: babyId, 
          userId: user.id 
        }
      })

      if (!entry) {
        return NextResponse.json({ error: 'Feeding entry not found or unauthorized' }, { status: 404 })
      }

      deletedEntry = await prisma.feedingEntry.delete({
        where: { id: entryId }
      })
      action = 'feeding_deleted'

    } else if (entryType === 'sleep') {
      // Verify entry belongs to user
      const entry = await prisma.sleepEntry.findFirst({
        where: { 
          id: entryId, 
          babyId: babyId, 
          userId: user.id 
        }
      })

      if (!entry) {
        return NextResponse.json({ error: 'Sleep entry not found or unauthorized' }, { status: 404 })
      }

      deletedEntry = await prisma.sleepEntry.delete({
        where: { id: entryId }
      })
      action = 'sleep_deleted'

    } else if (entryType === 'diaper') {
      // Verify entry belongs to user
      const entry = await prisma.diaperEntry.findFirst({
        where: { 
          id: entryId, 
          babyId: babyId, 
          userId: user.id 
        }
      })

      if (!entry) {
        return NextResponse.json({ error: 'Diaper entry not found or unauthorized' }, { status: 404 })
      }

      deletedEntry = await prisma.diaperEntry.delete({
        where: { id: entryId }
      })
      action = 'diaper_deleted'

    } else if (entryType === 'growth') {
      // Verify entry belongs to baby (no user check needed for growth entries)
      const entry = await prisma.growthEntry.findFirst({
        where: { 
          id: entryId, 
          babyId: babyId
        }
      })

      if (!entry) {
        return NextResponse.json({ error: 'Growth entry not found or unauthorized' }, { status: 404 })
      }

      deletedEntry = await prisma.growthEntry.delete({
        where: { id: entryId }
      })
      action = 'growth_deleted'

    } else {
      return NextResponse.json({ error: 'Invalid entry type' }, { status: 400 })
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        babyId: babyId,
        action,
        data: { id: entryId, type: entryType },
      },
    })

    return NextResponse.json({ 
      success: true, 
      message: `${entryType} entry deleted successfully`,
      deletedEntry 
    })

  } catch (error) {
    console.error('Error deleting entry:', error)
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ babyId: string }> }
) {
  try {
    const { babyId } = await params
    const body = await request.json()
    const { entryId, userEmail, type, ...updateData } = body

    console.log('PUT request received:', { babyId, entryId, type, userEmail, updateData })

    if (!entryId || !type || !userEmail) {
      console.error('Missing required parameters:', { entryId, type, userEmail })
      return NextResponse.json({ 
        error: 'Entry ID, type, and user email are required' 
      }, { status: 400 })
    }

    // Find the user by email to get their ID
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let updatedEntry
    let action

    if (type === 'feeding') {
      // Verify entry belongs to user
      const existingEntry = await prisma.feedingEntry.findFirst({
        where: { 
          id: entryId, 
          babyId: babyId, 
          userId: user.id 
        }
      })

      if (!existingEntry) {
        return NextResponse.json({ error: 'Feeding entry not found or unauthorized' }, { status: 404 })
      }

      // Prepare update data
      const feedingUpdateData: Record<string, unknown> = {}
      if (updateData.kind) feedingUpdateData.type = updateData.kind // Map 'kind' to 'type' for database
      if (updateData.amount !== undefined) feedingUpdateData.amount = updateData.amount
      if (updateData.startTime) feedingUpdateData.startTime = new Date(updateData.startTime)
      if (updateData.endTime) feedingUpdateData.endTime = updateData.endTime ? new Date(updateData.endTime) : null
      if (updateData.duration !== undefined) feedingUpdateData.duration = updateData.duration
      if (updateData.mood) feedingUpdateData.mood = updateData.mood
      if (updateData.notes !== undefined) feedingUpdateData.notes = updateData.notes

      updatedEntry = await prisma.feedingEntry.update({
        where: { id: entryId },
        data: feedingUpdateData
      })
      action = 'feeding_updated'

    } else if (type === 'sleep') {
      // Similar logic for sleep entries
      const existingEntry = await prisma.sleepEntry.findFirst({
        where: { 
          id: entryId, 
          babyId: babyId, 
          userId: user.id 
        }
      })

      if (!existingEntry) {
        return NextResponse.json({ error: 'Sleep entry not found or unauthorized' }, { status: 404 })
      }

      const sleepUpdateData: Record<string, unknown> = {}
      if (updateData.startTime) sleepUpdateData.startTime = new Date(updateData.startTime)
      if (updateData.endTime) sleepUpdateData.endTime = updateData.endTime ? new Date(updateData.endTime) : null
      if (updateData.duration !== undefined) sleepUpdateData.duration = updateData.duration
      if (updateData.quality) sleepUpdateData.quality = updateData.quality
      if (updateData.sleepType) sleepUpdateData.type = updateData.sleepType
      if (updateData.location) sleepUpdateData.location = updateData.location
      if (updateData.notes !== undefined) sleepUpdateData.notes = updateData.notes

      updatedEntry = await prisma.sleepEntry.update({
        where: { id: entryId },
        data: sleepUpdateData
      })
      action = 'sleep_updated'

    } else if (type === 'diaper') {
      // Similar logic for diaper entries
      const existingEntry = await prisma.diaperEntry.findFirst({
        where: { 
          id: entryId, 
          babyId: babyId, 
          userId: user.id 
        }
      })

      if (!existingEntry) {
        return NextResponse.json({ error: 'Diaper entry not found or unauthorized' }, { status: 404 })
      }

      const diaperUpdateData: Record<string, unknown> = {}
      if (updateData.time) diaperUpdateData.time = new Date(updateData.time)
      if (updateData.diaperType) diaperUpdateData.type = updateData.diaperType
      if (updateData.wetness) diaperUpdateData.wetness = updateData.wetness
      if (updateData.stool) diaperUpdateData.stool = updateData.stool
      if (updateData.diaper) diaperUpdateData.diaper = updateData.diaper
      if (updateData.mood) diaperUpdateData.mood = updateData.mood
      if (updateData.changedBy) diaperUpdateData.changedBy = updateData.changedBy
      if (updateData.notes !== undefined) diaperUpdateData.notes = updateData.notes
      if (updateData.amount) diaperUpdateData.amount = updateData.amount
      if (updateData.color) diaperUpdateData.color = updateData.color

      updatedEntry = await prisma.diaperEntry.update({
        where: { id: entryId },
        data: diaperUpdateData
      })
      action = 'diaper_updated'

    } else if (type === 'growth') {
      // Similar logic for growth entries
      const existingEntry = await prisma.growthEntry.findFirst({
        where: { 
          id: entryId, 
          babyId: babyId
        }
      })

      if (!existingEntry) {
        return NextResponse.json({ error: 'Growth entry not found or unauthorized' }, { status: 404 })
      }

      const growthUpdateData: Record<string, unknown> = {}
      if (updateData.date) growthUpdateData.date = new Date(updateData.date)
      if (updateData.weight !== undefined) growthUpdateData.weight = updateData.weight ? parseInt(updateData.weight) : null
      if (updateData.height !== undefined) growthUpdateData.height = updateData.height ? parseInt(updateData.height) : null
      if (updateData.headCircumference !== undefined) growthUpdateData.headCirc = updateData.headCircumference ? parseInt(updateData.headCircumference) : null
      if (updateData.notes !== undefined) growthUpdateData.notes = updateData.notes

      updatedEntry = await prisma.growthEntry.update({
        where: { id: entryId },
        data: growthUpdateData
      })
      action = 'growth_updated'

    } else {
      return NextResponse.json({ error: 'Invalid entry type' }, { status: 400 })
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        babyId: babyId,
        action,
        data: { id: entryId, type, updates: updateData },
      },
    })

    return NextResponse.json({ 
      success: true, 
      message: `${type} entry updated successfully`,
      updatedEntry 
    })

  } catch (error) {
    console.error('Error updating entry:', error)
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
