import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userEmail, recoveryItems } = body

    if (!userEmail || !recoveryItems) {
      return NextResponse.json({ error: 'User email and recovery items are required' }, { status: 400 })
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
      parentProfile = await prisma.parentHealthProfile.create({
        data: {
          userId: user.id,
          deliveryType: 'vaginal', // Default
          deliveryDate: new Date(), // Default
        }
      })
    }

    // Update user settings to store recovery progress
    await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: {
        privacy: {
          ...((await prisma.userSettings.findUnique({ where: { userId: user.id } }))?.privacy as Record<string, unknown> || {}),
          recoveryProgress: recoveryItems
        }
      },
      create: {
        userId: user.id,
        notifications: {},
        privacy: {
          recoveryProgress: recoveryItems
        },
        backup: {}
      }
    })

    return NextResponse.json({
      success: true,
      data: { recoveryItems }
    })

  } catch (error) {
    console.error('Error saving recovery data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userEmail = searchParams.get('userEmail')

    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 })
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        settings: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const recoveryProgress = (user.settings?.privacy as Record<string, unknown>)?.recoveryProgress || {}

    return NextResponse.json({
      success: true,
      data: { recoveryProgress }
    })

  } catch (error) {
    console.error('Error fetching recovery data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}