// API route for email-based user lookup and profile management
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email, oldUserData } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    console.log('Looking up user by email:', email)

    // First, try to find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        settings: true,
        babies: true
      }
    })

    // If user exists, return their data
    if (user) {
      console.log('Found existing user by email:', user.id)
      return NextResponse.json({ 
        success: true, 
        user,
        isExistingUser: true 
      })
    }

    // If we have old user data (from legacy ID system), migrate it
    if (oldUserData && oldUserData.id) {
      console.log('Migrating user from legacy ID:', oldUserData.id, 'to email:', email)
      
      // Check if old user exists
      const oldUser = await prisma.user.findUnique({
        where: { id: oldUserData.id },
        include: {
          settings: true,
          babies: true
        }
      })

      if (oldUser && oldUser.email !== email) {
        // Update the existing user's email and return their data
        const updatedUser = await prisma.user.update({
          where: { id: oldUser.id },
          data: { email },
          include: {
            settings: true,
            babies: true
          }
        })

        console.log('Updated user email from', oldUser.email, 'to', email)
        
        // Log the email change
        await prisma.activityLog.create({
          data: {
            userId: oldUser.id,
            action: 'email_updated',
            data: { 
              oldEmail: oldUser.email, 
              newEmail: email 
            }
          }
        })

        return NextResponse.json({ 
          success: true, 
          user: updatedUser,
          isEmailUpdated: true 
        })
      }
    }

    // If no existing user found, this is a new user
    console.log('No existing user found for email:', email)
    return NextResponse.json({ 
      success: true, 
      user: null,
      isNewUser: true 
    })

  } catch (error) {
    console.error('Error in user lookup:', error)
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}