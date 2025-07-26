const { PrismaClient } = require('@prisma/client')

// Database configurations
const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://admin:admin@localhost:5432/baby_tracker?schema=public"
    }
  }
})

const remotePrisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://admin:PenVKjLGGzb7hSRc4rEIlZLjyy59a5x6@dpg-d21k4d7gi27c73e166n0-a.oregon-postgres.render.com/baby_tracker_jlq9"
    }
  }
})

async function migrateData() {
  try {
    console.log('🚀 Starting data migration...')

    // 1. Migrate Users
    console.log('📝 Migrating users...')
    const users = await localPrisma.user.findMany({
      include: {
        settings: true
      }
    })
    
    for (const user of users) {
      const { settings, ...userData } = user
      
      // Create user
      const newUser = await remotePrisma.user.upsert({
        where: { email: user.email },
        update: userData,
        create: userData
      })
      
      // Create user settings if exists
      if (settings) {
        await remotePrisma.userSettings.upsert({
          where: { userId: newUser.id },
          update: { ...settings, userId: newUser.id },
          create: { ...settings, userId: newUser.id }
        })
      }
      
      console.log(`✅ Migrated user: ${user.email}`)
    }

    // 2. Migrate Babies
    console.log('👶 Migrating babies...')
    const babies = await localPrisma.baby.findMany()
    
    for (const baby of babies) {
      await remotePrisma.baby.upsert({
        where: { id: baby.id },
        update: baby,
        create: baby
      })
      console.log(`✅ Migrated baby: ${baby.name}`)
    }

    // 3. Migrate Feeding Entries
    console.log('🍼 Migrating feeding entries...')
    const feedingEntries = await localPrisma.feedingEntry.findMany()
    
    for (const entry of feedingEntries) {
      await remotePrisma.feedingEntry.upsert({
        where: { id: entry.id },
        update: entry,
        create: entry
      })
    }
    console.log(`✅ Migrated ${feedingEntries.length} feeding entries`)

    // 4. Migrate Sleep Entries
    console.log('😴 Migrating sleep entries...')
    const sleepEntries = await localPrisma.sleepEntry.findMany()
    
    for (const entry of sleepEntries) {
      await remotePrisma.sleepEntry.upsert({
        where: { id: entry.id },
        update: entry,
        create: entry
      })
    }
    console.log(`✅ Migrated ${sleepEntries.length} sleep entries`)

    // 5. Migrate Diaper Entries
    console.log('👶 Migrating diaper entries...')
    const diaperEntries = await localPrisma.diaperEntry.findMany()
    
    for (const entry of diaperEntries) {
      await remotePrisma.diaperEntry.upsert({
        where: { id: entry.id },
        update: entry,
        create: entry
      })
    }
    console.log(`✅ Migrated ${diaperEntries.length} diaper entries`)

    // 6. Migrate Growth Entries
    console.log('📏 Migrating growth entries...')
    const growthEntries = await localPrisma.growthEntry.findMany()
    
    for (const entry of growthEntries) {
      await remotePrisma.growthEntry.upsert({
        where: { id: entry.id },
        update: entry,
        create: entry
      })
    }
    console.log(`✅ Migrated ${growthEntries.length} growth entries`)

    // 7. Migrate Health Data (if any)
    console.log('🏥 Migrating health data...')
    
    // Vaccine entries
    const vaccineEntries = await localPrisma.vaccineEntry.findMany()
    for (const entry of vaccineEntries) {
      await remotePrisma.vaccineEntry.upsert({
        where: { id: entry.id },
        update: entry,
        create: entry
      })
    }
    
    // Symptom entries
    const symptomEntries = await localPrisma.symptomEntry.findMany({
      include: {
        symptoms: true,
        photos: true
      }
    })
    
    for (const entry of symptomEntries) {
      const { symptoms, photos, ...entryData } = entry
      
      const newEntry = await remotePrisma.symptomEntry.upsert({
        where: { id: entry.id },
        update: entryData,
        create: entryData
      })
      
      // Migrate related symptoms
      for (const symptom of symptoms) {
        await remotePrisma.symptom.upsert({
          where: { id: symptom.id },
          update: { ...symptom, symptomEntryId: newEntry.id },
          create: { ...symptom, symptomEntryId: newEntry.id }
        })
      }
      
      // Migrate photos
      for (const photo of photos) {
        await remotePrisma.symptomPhoto.upsert({
          where: { id: photo.id },
          update: { ...photo, symptomEntryId: newEntry.id },
          create: { ...photo, symptomEntryId: newEntry.id }
        })
      }
    }
    
    console.log(`✅ Migrated ${vaccineEntries.length} vaccine entries`)
    console.log(`✅ Migrated ${symptomEntries.length} symptom entries`)

    // 8. Migrate Activity Logs
    console.log('📋 Migrating activity logs...')
    const activityLogs = await localPrisma.activityLog.findMany()
    
    for (const log of activityLogs) {
      await remotePrisma.activityLog.upsert({
        where: { id: log.id },
        update: log,
        create: log
      })
    }
    console.log(`✅ Migrated ${activityLogs.length} activity logs`)

    console.log('🎉 Data migration completed successfully!')

    // Summary
    const summary = {
      users: users.length,
      babies: babies.length,
      feedingEntries: feedingEntries.length,
      sleepEntries: sleepEntries.length,
      diaperEntries: diaperEntries.length,
      growthEntries: growthEntries.length,
      vaccineEntries: vaccineEntries.length,
      symptomEntries: symptomEntries.length,
      activityLogs: activityLogs.length
    }
    
    console.log('\n📊 Migration Summary:')
    console.table(summary)

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await localPrisma.$disconnect()
    await remotePrisma.$disconnect()
  }
}

// Run migration
migrateData()
  .then(() => {
    console.log('✨ Migration script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error)
    process.exit(1)
  })