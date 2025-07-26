const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

// Use environment variable or default to local
const databaseUrl = process.env.DATABASE_URL || "postgresql://admin:admin@localhost:5432/baby_tracker?schema=public"

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
})

async function importData() {
  try {
    console.log('🚀 Importing data to database...')
    console.log('📍 Target database:', databaseUrl.replace(/:([^:@]*@)/, ':***@'))

    // Read exported data
    if (!fs.existsSync('database-export.json')) {
      throw new Error('database-export.json not found. Please run export-data.js first.')
    }

    const data = JSON.parse(fs.readFileSync('database-export.json', 'utf8'))
    console.log('📦 Data loaded from database-export.json')

    // 1. Import Users and Settings
    console.log('👥 Importing users...')
    for (const user of data.users) {
      const { settings, ...userData } = user
      
      // Create/update user
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
      
      // Create/update user settings
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
      
      console.log(`✅ Imported user: ${user.email}`)
    }

    // 2. Import Babies
    console.log('👶 Importing babies...')
    for (const baby of data.babies) {
      await prisma.baby.upsert({
        where: { id: baby.id },
        update: {
          name: baby.name,
          birthDate: new Date(baby.birthDate),
          gender: baby.gender,
          weight: baby.weight,
          height: baby.height,
          avatar: baby.avatar,
          userId: baby.userId
        },
        create: {
          ...baby,
          birthDate: new Date(baby.birthDate)
        }
      })
      console.log(`✅ Imported baby: ${baby.name}`)
    }

    // 3. Import Feeding Entries
    console.log('🍼 Importing feeding entries...')
    for (const entry of data.feedingEntries) {
      await prisma.feedingEntry.upsert({
        where: { id: entry.id },
        update: {
          ...entry,
          startTime: new Date(entry.startTime),
          endTime: entry.endTime ? new Date(entry.endTime) : null
        },
        create: {
          ...entry,
          startTime: new Date(entry.startTime),
          endTime: entry.endTime ? new Date(entry.endTime) : null
        }
      })
    }
    console.log(`✅ Imported ${data.feedingEntries.length} feeding entries`)

    // 4. Import Sleep Entries
    console.log('😴 Importing sleep entries...')
    for (const entry of data.sleepEntries) {
      await prisma.sleepEntry.upsert({
        where: { id: entry.id },
        update: {
          ...entry,
          startTime: new Date(entry.startTime),
          endTime: entry.endTime ? new Date(entry.endTime) : null
        },
        create: {
          ...entry,
          startTime: new Date(entry.startTime),
          endTime: entry.endTime ? new Date(entry.endTime) : null
        }
      })
    }
    console.log(`✅ Imported ${data.sleepEntries.length} sleep entries`)

    // 5. Import Diaper Entries
    console.log('👶 Importing diaper entries...')
    for (const entry of data.diaperEntries) {
      await prisma.diaperEntry.upsert({
        where: { id: entry.id },
        update: {
          ...entry,
          time: new Date(entry.time)
        },
        create: {
          ...entry,
          time: new Date(entry.time)
        }
      })
    }
    console.log(`✅ Imported ${data.diaperEntries.length} diaper entries`)

    // 6. Import Growth Entries
    console.log('📏 Importing growth entries...')
    for (const entry of data.growthEntries) {
      await prisma.growthEntry.upsert({
        where: { id: entry.id },
        update: {
          ...entry,
          date: new Date(entry.date)
        },
        create: {
          ...entry,
          date: new Date(entry.date)
        }
      })
    }
    console.log(`✅ Imported ${data.growthEntries.length} growth entries`)

    // 7. Import Health Data
    console.log('🏥 Importing health data...')
    
    // Import medications first
    if (data.medications) {
      for (const medication of data.medications) {
        await prisma.medication.upsert({
          where: { id: medication.id },
          update: medication,
          create: medication
        })
      }
    }
    
    // Import vaccine entries
    for (const entry of data.vaccineEntries) {
      await prisma.vaccineEntry.upsert({
        where: { id: entry.id },
        update: {
          ...entry,
          scheduledDate: entry.scheduledDate ? new Date(entry.scheduledDate) : null,
          completedDate: entry.completedDate ? new Date(entry.completedDate) : null
        },
        create: {
          ...entry,
          scheduledDate: entry.scheduledDate ? new Date(entry.scheduledDate) : null,
          completedDate: entry.completedDate ? new Date(entry.completedDate) : null
        }
      })
    }
    
    // Import symptom entries
    for (const entry of data.symptomEntries) {
      const { symptoms, photos, ...entryData } = entry
      
      const newEntry = await prisma.symptomEntry.upsert({
        where: { id: entry.id },
        update: {
          ...entryData,
          date: new Date(entryData.date)
        },
        create: {
          ...entryData,
          date: new Date(entryData.date)
        }
      })
      
      // Import related symptoms
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
      
      // Import photos
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
    }
    
    console.log(`✅ Imported ${data.vaccineEntries.length} vaccine entries`)
    console.log(`✅ Imported ${data.symptomEntries.length} symptom entries`)

    // 8. Import Activity Logs
    console.log('📋 Importing activity logs...')
    for (const log of data.activityLogs) {
      await prisma.activityLog.upsert({
        where: { id: log.id },
        update: {
          ...log,
          timestamp: new Date(log.timestamp)
        },
        create: {
          ...log,
          timestamp: new Date(log.timestamp)
        }
      })
    }
    console.log(`✅ Imported ${data.activityLogs.length} activity logs`)

    console.log('🎉 Data import completed successfully!')

    // Summary
    const summary = {
      users: data.users.length,
      babies: data.babies.length,
      feedingEntries: data.feedingEntries.length,
      sleepEntries: data.sleepEntries.length,
      diaperEntries: data.diaperEntries.length,
      growthEntries: data.growthEntries.length,
      vaccineEntries: data.vaccineEntries.length,
      symptomEntries: data.symptomEntries.length,
      activityLogs: data.activityLogs.length
    }
    
    console.log('\n📊 Import Summary:')
    console.table(summary)

  } catch (error) {
    console.error('❌ Import failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

importData()
  .then(() => {
    console.log('✨ Import completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Import failed:', error)
    process.exit(1)
  })