// API route for baby management
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received baby creation request:', body)
    
    const { id, name, birthDate, gender, weight, height, avatar, userId } = body

    // Validate required fields
    if (!id || !name || !birthDate || !userId) {
      console.error('Missing required fields for baby:', { id, name, birthDate, userId })
      return NextResponse.json({ error: 'Missing required fields: id, name, birthDate, userId' }, { status: 400 })
    }

    console.log('Creating/updating baby with ID:', id, 'for user:', userId)

    // First ensure the user exists - create a minimal user if needed
    try {
      await prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: {
          id: userId,
          email: `${userId}@temp.com`,
          firstName: 'Temp',
          lastName: 'User',
          role: 'mother',
        },
      })
      console.log('User ensured to exist:', userId)
    } catch (userError) {
      console.error('Error ensuring user exists:', userError)
      // Continue anyway, maybe user already exists
    }

    // Create or update baby in database
    const baby = await prisma.baby.upsert({
      where: { id },
      update: {
        name,
        birthDate: new Date(birthDate),
        gender,
        weight,
        height,
        avatar: avatar || '👶',
      },
      create: {
        id,
        name,
        birthDate: new Date(birthDate),
        gender,
        weight,
        height,
        avatar: avatar || '👶',
        userId,
      },
    })

    console.log('Baby created/updated successfully:', baby.id)

    // Log activity
    try {
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'baby_created',
          data: { id: baby.id, name: baby.name },
        },
      })
    } catch (logError) {
      console.error('Error logging activity:', logError)
      // Don't fail the whole operation for logging
    }

    return NextResponse.json({ success: true, baby })
  } catch (error) {
    console.error('Error creating baby:', error)
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const babies = await prisma.baby.findMany({
      include: {
        user: true,
      },
    })

    return NextResponse.json({ babies })
  } catch (error) {
    console.error('Error fetching babies:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}