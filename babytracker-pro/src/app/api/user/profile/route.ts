// API route for user profile management
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    // Email is required for all profile lookups
    if (!email) {
      return NextResponse.json({ 
        error: 'Email parameter is required for user profile lookup' 
      }, { status: 400 })
    }

    console.log('Fetching profile by email:', email)
    const profile = await prisma.user.findUnique({
      where: { email },
      include: {
        settings: true,
        babies: {
          include: {
            feedingEntries: {
              orderBy: { startTime: 'desc' },
              take: 50  // Increased to get more comprehensive daily data
            },
            sleepEntries: {
              orderBy: { startTime: 'desc' },
              take: 50  // Increased to get more comprehensive daily data
            },
            diaperEntries: {
              orderBy: { time: 'desc' },
              take: 50  // Increased to get more comprehensive daily data
            },
            growthEntries: {
              orderBy: { date: 'desc' },
              take: 50  // Get growth history
            }
          }
        }
      }
    })

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const updates = await request.json()

    // We need either email in updates or user ID to update
    if (!updates.email && !updates.id) {
      return NextResponse.json({ error: 'Email or user ID is required for profile update' }, { status: 400 })
    }

    let whereClause: { id: string } | undefined
    let userId: string = ''

    // If we have an email, find user by email
    if (updates.email) {
      // For email changes, we need to find the current user by their current email
      // Check if we have a current user ID in the updates
      if (updates.id) {
        whereClause = { id: updates.id }
        userId = updates.id
      } else {
        // If no ID provided, we can't safely update by email alone
        return NextResponse.json({ error: 'User ID is required when updating email' }, { status: 400 })
      }
    } else if (updates.id) {
      whereClause = { id: updates.id }
      userId = updates.id
    }

    if (!whereClause) {
      return NextResponse.json({ error: 'Unable to determine user to update' }, { status: 400 })
    }

    // Remove id from updates as it shouldn't be updated
    const { id, ...updateData } = updates

    const updatedProfile = await prisma.user.update({
      where: whereClause,
      data: updateData
    })

    await prisma.activityLog.create({
      data: {
        userId: userId,
        action: 'profile_updated',
        data: updateData
      }
    })

    return NextResponse.json({ success: true, profile: updatedProfile })
  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}