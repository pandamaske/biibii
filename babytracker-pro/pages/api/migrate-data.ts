import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

// Function to load exported data
function loadExportedData() {
  try {
    const filePath = path.join(process.cwd(), 'database-export.json')
    const fileContent = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(fileContent)
  } catch (error) {
    console.error('Error loading exported data:', error)
    return {
      users: [],
      babies: [],
      feedingEntries: [],
      sleepEntries: [],
      diaperEntries: [],
      growthEntries: [],
      vaccineEntries: [],
      symptomEntries: [],
      medicationEntries: [],
      medications: [],
      activityLogs: []
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Simple authentication - use a secret key
  const { secret } = req.body
  if (secret !== 'migrate-my-data-2025') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    console.log('🚀 Starting data migration via API...')

    if (!prisma) {
      return res.status(503).json({ error: 'Database not available' })
    }

    // Load the exported data
    const IMPORTED_DATA = loadExportedData()
    console.log('📦 Loaded exported data:', {
      users: IMPORTED_DATA.users.length,
      babies: IMPORTED_DATA.babies.length,
      feedingEntries: IMPORTED_DATA.feedingEntries.length,
      sleepEntries: IMPORTED_DATA.sleepEntries.length,
      diaperEntries: IMPORTED_DATA.diaperEntries.length,
      growthEntries: IMPORTED_DATA.growthEntries.length,
      vaccineEntries: IMPORTED_DATA.vaccineEntries.length,
      symptomEntries: IMPORTED_DATA.symptomEntries.length,
      activityLogs: IMPORTED_DATA.activityLogs.length
    })

    const results = {
      users: 0,
      babies: 0,
      feedingEntries: 0,
      sleepEntries: 0,
      diaperEntries: 0,
      growthEntries: 0,
      vaccineEntries: 0,
      symptomEntries: 0,
      activityLogs: 0
    }

    // 1. Import Users and Settings
    for (const user of IMPORTED_DATA.users) {
      const { settings, ...userData } = user as any
      
      const newUser = await prisma.user.upsert({
        where: { email: user.email },
        update: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          avatar: userData.avatar,
          role: userData.role,
          preferredName: userData.preferredName,
          timezone: userData.timezone,
          language: userData.language,
          phone: userData.phone,
          isEmailVerified: userData.isEmailVerified,
          isPhoneVerified: userData.isPhoneVerified,
          emergencyContact: userData.emergencyContact
        },
        create: userData
      })
      
      if (settings) {
        await prisma.userSettings.upsert({
          where: { userId: newUser.id },
          update: {
            theme: settings.theme,
            colorScheme: settings.colorScheme,
            fontSize: settings.fontSize,
            language: settings.language,
            dateFormat: settings.dateFormat,
            timeFormat: settings.timeFormat,
            weightUnit: settings.weightUnit,
            heightUnit: settings.heightUnit,
            temperatureUnit: settings.temperatureUnit,
            volumeUnit: settings.volumeUnit,
            notifications: settings.notifications,
            privacy: settings.privacy,
            backup: settings.backup
          },
          create: {
            ...settings,
            userId: newUser.id
          }
        })
      }
      results.users++
    }

    // 2. Import Babies
    for (const baby of IMPORTED_DATA.babies) {
      await prisma.baby.upsert({
        where: { id: (baby as any).id },
        update: {
          name: (baby as any).name,
          birthDate: new Date((baby as any).birthDate),
          gender: (baby as any).gender,
          weight: (baby as any).weight,
          height: (baby as any).height,
          avatar: (baby as any).avatar,
          userId: (baby as any).userId
        },
        create: {
          ...(baby as any),
          birthDate: new Date((baby as any).birthDate)
        }
      })
      results.babies++
    }

    // 3. Import Feeding Entries
    for (const entry of IMPORTED_DATA.feedingEntries) {
      await prisma.feedingEntry.upsert({
        where: { id: (entry as any).id },
        update: {
          ...(entry as any),
          startTime: new Date((entry as any).startTime),
          endTime: (entry as any).endTime ? new Date((entry as any).endTime) : null
        },
        create: {
          ...(entry as any),
          startTime: new Date((entry as any).startTime),
          endTime: (entry as any).endTime ? new Date((entry as any).endTime) : null
        }
      })
      results.feedingEntries++
    }

    // 4. Import Sleep Entries
    for (const entry of IMPORTED_DATA.sleepEntries) {
      await prisma.sleepEntry.upsert({
        where: { id: (entry as any).id },
        update: {
          ...(entry as any),
          startTime: new Date((entry as any).startTime),
          endTime: (entry as any).endTime ? new Date((entry as any).endTime) : null
        },
        create: {
          ...(entry as any),
          startTime: new Date((entry as any).startTime),
          endTime: (entry as any).endTime ? new Date((entry as any).endTime) : null
        }
      })
      results.sleepEntries++
    }

    // 5. Import Diaper Entries
    for (const entry of IMPORTED_DATA.diaperEntries) {
      await prisma.diaperEntry.upsert({
        where: { id: (entry as any).id },
        update: {
          ...(entry as any),
          time: new Date((entry as any).time)
        },
        create: {
          ...(entry as any),
          time: new Date((entry as any).time)
        }
      })
      results.diaperEntries++
    }

    // 6. Import Growth Entries
    for (const entry of IMPORTED_DATA.growthEntries) {
      await prisma.growthEntry.upsert({
        where: { id: (entry as any).id },
        update: {
          ...(entry as any),
          date: new Date((entry as any).date)
        },
        create: {
          ...(entry as any),
          date: new Date((entry as any).date)
        }
      })
      results.growthEntries++
    }

    // 7. Import Vaccine Entries
    for (const entry of IMPORTED_DATA.vaccineEntries) {
      await prisma.vaccineEntry.upsert({
        where: { id: (entry as any).id },
        update: {
          ...(entry as any),
          scheduledDate: (entry as any).scheduledDate ? new Date((entry as any).scheduledDate) : null,
          completedDate: (entry as any).completedDate ? new Date((entry as any).completedDate) : null
        },
        create: {
          ...(entry as any),
          scheduledDate: (entry as any).scheduledDate ? new Date((entry as any).scheduledDate) : null,
          completedDate: (entry as any).completedDate ? new Date((entry as any).completedDate) : null
        }
      })
      results.vaccineEntries++
    }

    // 8. Import Symptom Entries
    for (const entry of IMPORTED_DATA.symptomEntries) {
      const { symptoms, photos, ...entryData } = entry as any
      
      const newEntry = await prisma.symptomEntry.upsert({
        where: { id: (entry as any).id },
        update: {
          ...entryData,
          date: new Date(entryData.date)
        },
        create: {
          ...entryData,
          date: new Date(entryData.date)
        }
      })
      
      if (symptoms) {
        for (const symptom of symptoms) {
          await prisma.symptom.upsert({
            where: { id: symptom.id },
            update: {
              ...symptom,
              symptomEntryId: newEntry.id
            },
            create: {
              ...symptom,
              symptomEntryId: newEntry.id
            }
          })
        }
      }
      
      if (photos) {
        for (const photo of photos) {
          await prisma.symptomPhoto.upsert({
            where: { id: photo.id },
            update: {
              ...photo,
              symptomEntryId: newEntry.id
            },
            create: {
              ...photo,
              symptomEntryId: newEntry.id
            }
          })
        }
      }
      results.symptomEntries++
    }

    // 9. Import Activity Logs
    for (const log of IMPORTED_DATA.activityLogs) {
      await prisma.activityLog.upsert({
        where: { id: (log as any).id },
        update: {
          ...(log as any),
          timestamp: new Date((log as any).timestamp)
        },
        create: {
          ...(log as any),
          timestamp: new Date((log as any).timestamp)
        }
      })
      results.activityLogs++
    }

    console.log('🎉 Data migration completed via API!')
    
    return res.status(200).json({
      success: true,
      message: 'Data migration completed successfully!',
      results
    })

  } catch (error) {
    console.error('❌ Migration failed:', error)
    return res.status(500).json({
      success: false,
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}