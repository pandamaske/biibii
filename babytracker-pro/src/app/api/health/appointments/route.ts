import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const babyId = searchParams.get('babyId')
    const status = searchParams.get('status')

    if (!babyId) {
      return NextResponse.json({ error: 'Baby ID is required' }, { status: 400 })
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        babyId,
        ...(status && { status })
      },
      include: {
        provider: true
      },
      orderBy: { date: 'asc' }
    })

    return NextResponse.json(appointments)
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      babyId,
      providerId,
      type,
      date,
      duration,
      notes,
      reminders
    } = body

    if (!babyId || !providerId || !type || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const appointment = await prisma.appointment.create({
      data: {
        babyId,
        providerId,
        type,
        date: new Date(date),
        duration: duration || 30,
        notes,
        reminders,
        status: 'scheduled'
      },
      include: {
        provider: true
      }
    })

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      status,
      date,
      duration,
      notes,
      reminders
    } = body

    if (!id) {
      return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 })
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(date && { date: new Date(date) }),
        ...(duration && { duration }),
        ...(notes !== undefined && { notes }),
        ...(reminders && { reminders })
      },
      include: {
        provider: true
      }
    })

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('Error updating appointment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}