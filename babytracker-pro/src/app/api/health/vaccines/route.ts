import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const babyId = searchParams.get('babyId')

    if (!babyId) {
      return NextResponse.json({ error: 'Baby ID is required' }, { status: 400 })
    }

    const vaccines = await prisma.vaccineEntry.findMany({
      where: { babyId },
      orderBy: { scheduledDate: 'asc' }
    })

    return NextResponse.json(vaccines)
  } catch (error) {
    console.error('Error fetching vaccines:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      babyId,
      name,
      status,
      scheduledDate,
      completedDate,
      location,
      batchNumber,
      reactions,
      notes,
      ageGroup
    } = body

    if (!babyId || !name) {
      return NextResponse.json({ error: 'Baby ID and vaccine name are required' }, { status: 400 })
    }

    const vaccine = await prisma.vaccineEntry.create({
      data: {
        babyId,
        name,
        status: status || 'upcoming',
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        completedDate: completedDate ? new Date(completedDate) : null,
        location,
        batchNumber,
        reactions,
        notes,
        ageGroup
      }
    })

    return NextResponse.json(vaccine, { status: 201 })
  } catch (error) {
    console.error('Error creating vaccine entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      status,
      completedDate,
      location,
      batchNumber,
      reactions,
      notes
    } = body

    if (!id) {
      return NextResponse.json({ error: 'Vaccine entry ID is required' }, { status: 400 })
    }

    const vaccine = await prisma.vaccineEntry.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(completedDate && { completedDate: new Date(completedDate) }),
        ...(location !== undefined && { location }),
        ...(batchNumber !== undefined && { batchNumber }),
        ...(reactions !== undefined && { reactions }),
        ...(notes !== undefined && { notes })
      }
    })

    return NextResponse.json(vaccine)
  } catch (error) {
    console.error('Error updating vaccine entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}