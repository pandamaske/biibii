const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://admin:admin@localhost:5432/baby_tracker?schema=public"
    }
  }
})

async function exportData() {
  try {
    console.log('📦 Exporting data from local database...')

    const data = {}

    // Export Users with settings
    console.log('👥 Exporting users...')
    data.users = await prisma.user.findMany({
      include: {
        settings: true
      }
    })
    console.log(`✅ Exported ${data.users.length} users`)

    // Export Babies
    console.log('👶 Exporting babies...')
    data.babies = await prisma.baby.findMany()
    console.log(`✅ Exported ${data.babies.length} babies`)

    // Export Feeding Entries
    console.log('🍼 Exporting feeding entries...')
    data.feedingEntries = await prisma.feedingEntry.findMany()
    console.log(`✅ Exported ${data.feedingEntries.length} feeding entries`)

    // Export Sleep Entries
    console.log('😴 Exporting sleep entries...')
    data.sleepEntries = await prisma.sleepEntry.findMany()
    console.log(`✅ Exported ${data.sleepEntries.length} sleep entries`)

    // Export Diaper Entries
    console.log('👶 Exporting diaper entries...')
    data.diaperEntries = await prisma.diaperEntry.findMany()
    console.log(`✅ Exported ${data.diaperEntries.length} diaper entries`)

    // Export Growth Entries
    console.log('📏 Exporting growth entries...')
    data.growthEntries = await prisma.growthEntry.findMany()
    console.log(`✅ Exported ${data.growthEntries.length} growth entries`)

    // Export Health Data
    console.log('🏥 Exporting health data...')
    data.vaccineEntries = await prisma.vaccineEntry.findMany()
    data.symptomEntries = await prisma.symptomEntry.findMany({
      include: {
        symptoms: true,
        photos: true
      }
    })
    data.medicationEntries = await prisma.medicationEntry.findMany({
      include: {
        medication: true,
        doses: true
      }
    })
    data.medications = await prisma.medication.findMany()
    console.log(`✅ Exported health data`)

    // Export Activity Logs
    console.log('📋 Exporting activity logs...')
    data.activityLogs = await prisma.activityLog.findMany()
    console.log(`✅ Exported ${data.activityLogs.length} activity logs`)

    // Save to JSON file
    const jsonData = JSON.stringify(data, null, 2)
    fs.writeFileSync('database-export.json', jsonData)
    
    console.log('💾 Data exported to database-export.json')
    console.log('\n📊 Export Summary:')
    console.table({
      users: data.users.length,
      babies: data.babies.length,
      feedingEntries: data.feedingEntries.length,
      sleepEntries: data.sleepEntries.length,
      diaperEntries: data.diaperEntries.length,
      growthEntries: data.growthEntries.length,
      vaccineEntries: data.vaccineEntries.length,
      symptomEntries: data.symptomEntries.length,
      medicationEntries: data.medicationEntries.length,
      activityLogs: data.activityLogs.length
    })

  } catch (error) {
    console.error('❌ Export failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

exportData()
  .then(() => {
    console.log('✨ Export completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Export failed:', error)
    process.exit(1)
  })