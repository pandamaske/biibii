import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userEmail, goals } = body

    if (!userEmail || !goals) {
      return NextResponse.json({ error: 'User email and goals are required' }, { status: 400 })
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update user settings to store self-care goals
    await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: {
        privacy: {
          ...((await prisma.userSettings.findUnique({ where: { userId: user.id } }))?.privacy as Record<string, unknown> || {}),
          selfCareGoals: goals
        }
      },
      create: {
        userId: user.id,
        notifications: {},
        privacy: {
          selfCareGoals: goals
        },
        backup: {}
      }
    })

    return NextResponse.json({
      success: true,
      data: { goals }
    })

  } catch (error) {
    console.error('Error saving self-care goals:', error)
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

    const selfCareGoals = (user.settings?.privacy as Record<string, unknown>)?.selfCareGoals || {}

    return NextResponse.json({
      success: true,
      data: { selfCareGoals }
    })

  } catch (error) {
    console.error('Error fetching self-care goals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}