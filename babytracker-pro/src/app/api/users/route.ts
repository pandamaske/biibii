// API route for user management
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received user creation request:', body)
    
    const { 
      id, 
      email, 
      firstName, 
      lastName, 
      avatar, 
      role = 'mother', 
      preferredName,
      timezone = 'Europe/Paris',
      language = 'fr',
      phone,
      emergencyContact
    } = body

    // Validate required fields
    if (!id || !email || !firstName || !lastName) {
      console.error('Missing required fields:', { id, email, firstName, lastName })
      return NextResponse.json({ error: 'Missing required fields: id, email, firstName, lastName' }, { status: 400 })
    }

    console.log('Creating/updating user with ID:', id, 'email:', email)

    // Create or update user in database
    const user = await prisma.user.upsert({
      where: { id },
      update: {
        // Don't update email due to unique constraint
        firstName,
        lastName,
        avatar,
        role,
        preferredName,
        timezone,
        language,
        phone,
        emergencyContact,
      },
      create: {
        id,
        email,
        firstName,
        lastName,
        avatar,
        role,
        preferredName,
        timezone,
        language,
        phone,
        emergencyContact,
      },
    })

    console.log('User created/updated successfully:', user.id)

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'user_created',
        data: { id: user.id, email: user.email },
      },
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Error creating user:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create user account'
    let details = 'Unknown error'
    
    if (error instanceof Error) {
      details = error.message
      
      // Check for common Prisma errors
      if (error.message.includes('Unique constraint')) {
        errorMessage = 'Email address already exists'
        details = 'A user with this email address already exists'
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Database connection failed'
        details = 'Unable to connect to database'
      } else if (error.message.includes('P2002')) {
        errorMessage = 'Email already in use'
        details = 'This email address is already registered'
      }
    }
    
    return NextResponse.json({ 
      error: errorMessage, 
      details: details
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        babies: true,
        settings: true,
      },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}