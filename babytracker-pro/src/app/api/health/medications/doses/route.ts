import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      medicationEntryId,
      dosage,
      unit,
      time
    } = body

    if (!medicationEntryId || !dosage || !unit || !time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const dose = await prisma.medicationDose.create({
      data: {
        medicationEntryId,
        dosage,
        unit,
        time: new Date(time)
      }
    })

    return NextResponse.json(dose, { status: 201 })
  } catch (error) {
    console.error('Error creating medication dose:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const medicationEntryId = searchParams.get('medicationEntryId')
    const limit = searchParams.get('limit')

    if (!medicationEntryId) {
      return NextResponse.json({ error: 'Medication entry ID is required' }, { status: 400 })
    }

    const doses = await prisma.medicationDose.findMany({
      where: { medicationEntryId },
      orderBy: { time: 'desc' },
      ...(limit && { take: parseInt(limit) })
    })

    return NextResponse.json(doses)
  } catch (error) {
    console.error('Error fetching medication doses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}