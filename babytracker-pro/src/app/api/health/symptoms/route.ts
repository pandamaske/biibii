import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const babyId = searchParams.get('babyId')
    const limit = searchParams.get('limit')

    if (!babyId) {
      return NextResponse.json({ error: 'Baby ID is required' }, { status: 400 })
    }

    const symptoms = await prisma.symptomEntry.findMany({
      where: { babyId },
      include: {
        symptoms: true,
        photos: true,
        medications: true
      },
      orderBy: { date: 'desc' },
      ...(limit && { take: parseInt(limit) })
    })

    return NextResponse.json(symptoms)
  } catch (error) {
    console.error('Error fetching symptoms:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      babyId,
      date,
      temperature,
      temperatureUnit,
      notes,
      doctorContacted,
      followUpRequired,
      symptoms,
      photos,
      medications
    } = body

    if (!babyId || !date || !notes) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create the main symptom entry
    const symptomEntry = await prisma.symptomEntry.create({
      data: {
        babyId,
        date: new Date(date),
        temperature,
        temperatureUnit: temperatureUnit || 'celsius',
        notes,
        doctorContacted: doctorContacted || false,
        followUpRequired: followUpRequired || false
      }
    })

    // Add individual symptoms
    if (symptoms && symptoms.length > 0) {
      await prisma.symptom.createMany({
        data: symptoms.map((symptom: { name: string; category: string; severity: string; icon: string }) => ({
          symptomEntryId: symptomEntry.id,
          name: symptom.name,
          category: symptom.category,
          severity: symptom.severity,
          icon: symptom.icon
        }))
      })
    }

    // Add photos
    if (photos && photos.length > 0) {
      await prisma.symptomPhoto.createMany({
        data: photos.map((photo: { url: string; bodyPart: string; notes?: string }) => ({
          symptomEntryId: symptomEntry.id,
          url: photo.url,
          bodyPart: photo.bodyPart,
          notes: photo.notes
        }))
      })
    }

    // Add medication doses
    if (medications && medications.length > 0) {
      await prisma.medicationDose.createMany({
        data: medications.map((med: { dosage: number; unit: string; time: string }) => ({
          symptomEntryId: symptomEntry.id,
          dosage: med.dosage,
          unit: med.unit,
          time: new Date(med.time)
        }))
      })
    }

    // Fetch the complete entry with relations
    const completeEntry = await prisma.symptomEntry.findUnique({
      where: { id: symptomEntry.id },
      include: {
        symptoms: true,
        photos: true,
        medications: true
      }
    })

    return NextResponse.json(completeEntry, { status: 201 })
  } catch (error) {
    console.error('Error creating symptom entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      temperature,
      temperatureUnit,
      notes,
      doctorContacted,
      followUpRequired
    } = body

    if (!id) {
      return NextResponse.json({ error: 'Symptom entry ID is required' }, { status: 400 })
    }

    const symptomEntry = await prisma.symptomEntry.update({
      where: { id },
      data: {
        ...(temperature !== undefined && { temperature }),
        ...(temperatureUnit && { temperatureUnit }),
        ...(notes !== undefined && { notes }),
        ...(doctorContacted !== undefined && { doctorContacted }),
        ...(followUpRequired !== undefined && { followUpRequired })
      },
      include: {
        symptoms: true,
        photos: true,
        medications: true
      }
    })

    return NextResponse.json(symptomEntry)
  } catch (error) {
    console.error('Error updating symptom entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}