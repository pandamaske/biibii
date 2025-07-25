import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const babyId = searchParams.get('babyId')
    const active = searchParams.get('active')

    if (!babyId) {
      return NextResponse.json({ error: 'Baby ID is required' }, { status: 400 })
    }

    const whereClause: Record<string, unknown> = { babyId }
    if (active === 'true') {
      whereClause.OR = [
        { endDate: null },
        { endDate: { gte: new Date() } }
      ]
    }

    const medications = await prisma.medicationEntry.findMany({
      where: whereClause,
      include: {
        medication: true,
        doses: {
          orderBy: { time: 'desc' },
          take: 10
        }
      },
      orderBy: { startDate: 'desc' }
    })

    return NextResponse.json(medications)
  } catch (error) {
    console.error('Error fetching medications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      babyId,
      medication,
      dosage,
      unit,
      frequency,
      startDate,
      endDate,
      prescribedBy,
      notes
    } = body

    if (!babyId || !medication || !dosage || !unit || !frequency || !startDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // First, find or create the medication
    let medicationRecord = await prisma.medication.findFirst({
      where: {
        name: medication.name,
        activeIngredient: medication.activeIngredient
      }
    })

    if (!medicationRecord) {
      medicationRecord = await prisma.medication.create({
        data: {
          name: medication.name,
          type: medication.type,
          activeIngredient: medication.activeIngredient,
          concentration: medication.concentration,
          form: medication.form
        }
      })
    }

    // Create the medication entry
    const medicationEntry = await prisma.medicationEntry.create({
      data: {
        babyId,
        medicationId: medicationRecord.id,
        dosage,
        unit,
        frequency,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        prescribedBy,
        notes
      },
      include: {
        medication: true,
        doses: true
      }
    })

    return NextResponse.json(medicationEntry, { status: 201 })
  } catch (error) {
    console.error('Error creating medication entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      dosage,
      unit,
      frequency,
      endDate,
      notes
    } = body

    if (!id) {
      return NextResponse.json({ error: 'Medication entry ID is required' }, { status: 400 })
    }

    const medicationEntry = await prisma.medicationEntry.update({
      where: { id },
      data: {
        ...(dosage !== undefined && { dosage }),
        ...(unit && { unit }),
        ...(frequency && { frequency }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(notes !== undefined && { notes })
      },
      include: {
        medication: true,
        doses: {
          orderBy: { time: 'desc' },
          take: 10
        }
      }
    })

    return NextResponse.json(medicationEntry)
  } catch (error) {
    console.error('Error updating medication entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}