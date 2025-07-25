// API route for user settings management
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID parameter is required' 
      }, { status: 400 })
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId }
    })

    if (!settings) {
      // Return default settings if none exist
      const defaultSettings = {
        theme: 'light',
        colorScheme: 'green',
        fontSize: 'medium',
        language: 'fr',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        weightUnit: 'grams',
        heightUnit: 'cm',
        temperatureUnit: 'celsius',
        volumeUnit: 'ml',
        notifications: {
          push: true,
          email: true,
          feeding: true,
          sleep: true,
          diaper: true,
          growth: true
        },
        privacy: {
          shareData: false,
          analytics: true
        },
        backup: {
          autoBackup: true,
          frequency: 'weekly'
        }
      }
      return NextResponse.json(defaultSettings)
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching user settings:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const updates = await request.json()

    if (!updates.userId) {
      return NextResponse.json({ 
        error: 'User ID is required for settings update' 
      }, { status: 400 })
    }

    const { userId, ...settingsData } = updates

    // Prepare data for database - ensure JSON fields are properly formatted
    const dbData = { ...settingsData }
    
    // Handle JSON fields - merge with existing data if available
    const existingSettings = await prisma.userSettings.findUnique({
      where: { userId }
    })

    if (settingsData.notifications && existingSettings?.notifications) {
      dbData.notifications = { 
        ...(existingSettings.notifications as Record<string, unknown>), 
        ...settingsData.notifications 
      }
    } else if (!settingsData.notifications && !existingSettings?.notifications) {
      dbData.notifications = {
        enabled: true,
        feedingReminders: true,
        feedingInterval: 180,
        sleepReminders: true,
        sleepInsufficientThreshold: 0.5,
        sleepQualityMinimumHours: 6,
        diaperReminders: true,
        healthAlerts: true,
        quietHours: { enabled: false, start: '22:00', end: '06:00' },
        pushNotifications: true,
        emailNotifications: false
      }
    }

    if (settingsData.privacy && existingSettings?.privacy) {
      dbData.privacy = { 
        ...(existingSettings.privacy as Record<string, unknown>), 
        ...settingsData.privacy 
      }
    } else if (!settingsData.privacy && !existingSettings?.privacy) {
      dbData.privacy = {
        dataSharing: false,
        analytics: true,
        faceIdUnlock: false
      }
    }

    if (settingsData.backup && existingSettings?.backup) {
      dbData.backup = { 
        ...(existingSettings.backup as Record<string, unknown>), 
        ...settingsData.backup 
      }
    } else if (!settingsData.backup && !existingSettings?.backup) {
      dbData.backup = {
        autoBackup: true,
        backupFrequency: 'weekly',
        cloudSync: false
      }
    }

    let updatedSettings
    if (existingSettings) {
      // Update existing settings
      updatedSettings = await prisma.userSettings.update({
        where: { userId },
        data: dbData
      })
    } else {
      // Create new settings
      updatedSettings = await prisma.userSettings.create({
        data: {
          userId,
          ...dbData
        }
      })
    }

    // Log the settings update
    await prisma.activityLog.create({
      data: {
        userId: userId,
        action: 'settings_updated',
        data: settingsData
      }
    })

    return NextResponse.json({ success: true, settings: updatedSettings })
  } catch (error) {
    console.error('Error updating user settings:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}