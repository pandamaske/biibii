import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const babyId = searchParams.get('babyId')
    const category = searchParams.get('category')
    const achieved = searchParams.get('achieved')

    if (!babyId) {
      return NextResponse.json({ error: 'Baby ID is required' }, { status: 400 })
    }

    const whereClause: Record<string, unknown> = { babyId }
    if (category) whereClause.category = category
    if (achieved !== null) whereClause.achieved = achieved === 'true'

    const milestones = await prisma.developmentalMilestone.findMany({
      where: whereClause,
      orderBy: { minWeeks: 'asc' }
    })

    return NextResponse.json(milestones)
  } catch (error) {
    console.error('Error fetching milestones:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      babyId,
      category,
      milestone,
      description,
      minWeeks,
      maxWeeks,
      achieved,
      achievedDate,
      photos,
      video,
      notes,
      concerns
    } = body

    if (!babyId || !category || !milestone || !description || minWeeks === undefined || maxWeeks === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const milestoneEntry = await prisma.developmentalMilestone.create({
      data: {
        babyId,
        category,
        milestone,
        description,
        minWeeks,
        maxWeeks,
        achieved: achieved || false,
        achievedDate: achievedDate ? new Date(achievedDate) : null,
        photos,
        video,
        notes,
        concerns
      }
    })

    return NextResponse.json(milestoneEntry, { status: 201 })
  } catch (error) {
    console.error('Error creating milestone:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      achieved,
      achievedDate,
      photos,
      video,
      notes,
      concerns
    } = body

    if (!id) {
      return NextResponse.json({ error: 'Milestone ID is required' }, { status: 400 })
    }

    const milestone = await prisma.developmentalMilestone.update({
      where: { id },
      data: {
        ...(achieved !== undefined && { achieved }),
        ...(achievedDate !== undefined && { achievedDate: achievedDate ? new Date(achievedDate) : null }),
        ...(photos !== undefined && { photos }),
        ...(video !== undefined && { video }),
        ...(notes !== undefined && { notes }),
        ...(concerns !== undefined && { concerns })
      }
    })

    return NextResponse.json(milestone)
  } catch (error) {
    console.error('Error updating milestone:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}