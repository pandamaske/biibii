import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ babyId: string }> }
) {
  try {
    const { babyId } = await params

    if (!babyId) {
      return NextResponse.json({ error: 'Baby ID is required' }, { status: 400 })
    }

    const baby = await prisma.baby.findUnique({
      where: { id: babyId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    if (!baby) {
      return NextResponse.json({ error: 'Baby not found' }, { status: 404 })
    }

    return NextResponse.json(baby)
  } catch (error) {
    console.error('Error fetching baby:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ babyId: string }> }
) {
  try {
    const { babyId } = await params
    const body = await request.json()
    const { name, birthDate, gender, weight, height } = body

    if (!babyId) {
      return NextResponse.json({ error: 'Baby ID is required' }, { status: 400 })
    }

    const baby = await prisma.baby.update({
      where: { id: babyId },
      data: {
        ...(name && { name }),
        ...(birthDate && { birthDate: new Date(birthDate) }),
        ...(gender && { gender }),
        ...(weight !== undefined && { weight }),
        ...(height !== undefined && { height })
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(baby)
  } catch (error) {
    console.error('Error updating baby:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}