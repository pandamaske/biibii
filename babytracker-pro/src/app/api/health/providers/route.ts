import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const providers = await prisma.healthcareProvider.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(providers)
  } catch (error) {
    console.error('Error fetching healthcare providers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      type,
      phone,
      email,
      address,
      hours,
      distance
    } = body

    if (!name || !type || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const provider = await prisma.healthcareProvider.create({
      data: {
        name,
        type,
        phone,
        email,
        address,
        hours,
        distance
      }
    })

    return NextResponse.json(provider, { status: 201 })
  } catch (error) {
    console.error('Error creating healthcare provider:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      name,
      type,
      phone,
      email,
      address,
      hours,
      distance,
      isActive
    } = body

    if (!id) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 })
    }

    const provider = await prisma.healthcareProvider.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(phone && { phone }),
        ...(email !== undefined && { email }),
        ...(address !== undefined && { address }),
        ...(hours !== undefined && { hours }),
        ...(distance !== undefined && { distance }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return NextResponse.json(provider)
  } catch (error) {
    console.error('Error updating healthcare provider:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}