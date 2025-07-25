const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createSampleData() {
  console.log('🍼 Creating sample health data for testing...')

  try {
    // First, let's find or create a baby
    let baby = await prisma.baby.findFirst()
    
    if (!baby) {
      // Create a test user and baby
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'Parent',
          role: 'mother'
        }
      })

      baby = await prisma.baby.create({
        data: {
          name: 'Emma',
          birthDate: new Date('2024-08-15'), // 4+ months old
          gender: 'female',
          weight: 6800, // 6.8 kg
          height: 65, // 65 cm
          userId: user.id
        }
      })
      console.log(`✅ Created test baby: ${baby.name}`)
    }

    // Create vaccine schedule for this baby
    const vaccineSchedules = [
      // Completed vaccines
      { name: 'Hépatite B', ageGroup: 'birth', status: 'completed', scheduledDate: new Date('2024-08-15'), completedDate: new Date('2024-08-15'), location: 'Maternité' },
      { name: 'DTaP (1ère dose)', ageGroup: '2-months', status: 'completed', scheduledDate: new Date('2024-10-15'), completedDate: new Date('2024-10-15'), location: 'Dr. Smith' },
      { name: 'Hib (1ère dose)', ageGroup: '2-months', status: 'completed', scheduledDate: new Date('2024-10-15'), completedDate: new Date('2024-10-15'), location: 'Dr. Smith' },
      { name: 'IPV (1ère dose)', ageGroup: '2-months', status: 'completed', scheduledDate: new Date('2024-10-15'), completedDate: new Date('2024-10-15'), location: 'Dr. Smith' },
      
      // Due vaccines
      { name: 'DTaP (2ème dose)', ageGroup: '4-months', status: 'due', scheduledDate: new Date('2025-01-20') },
      { name: 'Hib (2ème dose)', ageGroup: '4-months', status: 'due', scheduledDate: new Date('2025-01-20') },
      { name: 'IPV (2ème dose)', ageGroup: '4-months', status: 'due', scheduledDate: new Date('2025-01-20') },
      { name: 'PCV13 (2ème dose)', ageGroup: '4-months', status: 'due', scheduledDate: new Date('2025-01-20') },
      
      // Upcoming vaccines
      { name: 'DTaP (3ème dose)', ageGroup: '6-months', status: 'upcoming', scheduledDate: new Date('2025-03-15') },
      { name: 'RV (3ème dose)', ageGroup: '6-months', status: 'upcoming', scheduledDate: new Date('2025-03-15') }
    ]

    for (const vaccine of vaccineSchedules) {
      await prisma.vaccineEntry.create({
        data: {
          babyId: baby.id,
          name: vaccine.name,
          status: vaccine.status,
          ageGroup: vaccine.ageGroup,
          scheduledDate: vaccine.scheduledDate,
          completedDate: vaccine.completedDate || null,
          location: vaccine.location || null
        }
      })
    }

    // Create some developmental milestones
    const milestones = [
      // Achieved milestones
      { category: 'motor', milestone: 'Tient sa tête droite', description: 'Maintient sa tête droite en position verticale', minWeeks: 8, maxWeeks: 16, achieved: true, achievedDate: new Date('2024-11-15') },
      { category: 'language', milestone: 'Premier sourire social', description: 'Sourit en réponse aux interactions', minWeeks: 4, maxWeeks: 8, achieved: true, achievedDate: new Date('2024-12-20') },
      { category: 'cognitive', milestone: 'Suit des objets du regard', description: 'Suit des objets en mouvement avec les yeux', minWeeks: 6, maxWeeks: 12, achieved: true, achievedDate: new Date('2024-11-30') },
      
      // Current milestones (not yet achieved)
      { category: 'motor', milestone: 'Se retourne ventre-dos', description: 'Peut se retourner du ventre vers le dos', minWeeks: 12, maxWeeks: 20, achieved: false },
      { category: 'language', milestone: 'Babillage', description: 'Produit des sons comme ba-ba, da-da', minWeeks: 16, maxWeeks: 28, achieved: false },
      { category: 'social', milestone: 'Reconnaissance des proches', description: 'Reconnaît les visages familiers', minWeeks: 8, maxWeeks: 16, achieved: false }
    ]

    for (const milestone of milestones) {
      await prisma.developmentalMilestone.create({
        data: {
          babyId: baby.id,
          category: milestone.category,
          milestone: milestone.milestone,
          description: milestone.description,
          minWeeks: milestone.minWeeks,
          maxWeeks: milestone.maxWeeks,
          achieved: milestone.achieved,
          achievedDate: milestone.achievedDate || null
        }
      })
    }

    // Create some recent symptoms
    const recentSymptoms = [
      {
        date: new Date('2024-12-18'),
        temperature: 38.2,
        notes: 'Légère fièvre, un peu grognon',
        doctorContacted: false,
        symptoms: [
          { name: 'Fièvre', category: 'fever', severity: 'mild' },
          { name: 'Irritabilité', category: 'behavioral', severity: 'mild' }
        ]
      },
      {
        date: new Date('2024-12-15'),
        notes: 'Congestion nasale, dort moins bien',
        doctorContacted: true,
        symptoms: [
          { name: 'Congestion nasale', category: 'respiratory', severity: 'moderate' },
          { name: 'Troubles du sommeil', category: 'behavioral', severity: 'mild' }
        ]
      }
    ]

    for (const symptomData of recentSymptoms) {
      const symptomEntry = await prisma.symptomEntry.create({
        data: {
          babyId: baby.id,
          date: symptomData.date,
          temperature: symptomData.temperature,
          notes: symptomData.notes,
          doctorContacted: symptomData.doctorContacted
        }
      })

      // Add individual symptoms
      for (const symptom of symptomData.symptoms) {
        await prisma.symptom.create({
          data: {
            symptomEntryId: symptomEntry.id,
            name: symptom.name,
            category: symptom.category,
            severity: symptom.severity
          }
        })
      }
    }

    // Create an appointment
    const provider = await prisma.healthcareProvider.findFirst({
      where: { type: 'pediatrician' }
    })

    if (provider) {
      await prisma.appointment.create({
        data: {
          babyId: baby.id,
          providerId: provider.id,
          type: 'Visite 4 mois',
          date: new Date('2025-02-01T14:30:00'),
          duration: 30,
          status: 'scheduled'
        }
      })
    }

    console.log('✅ Sample health data created successfully!')
    console.log(`- Baby: ${baby.name}`)
    console.log(`- Vaccines: ${vaccineSchedules.length} entries`)
    console.log(`- Milestones: ${milestones.length} entries`)
    console.log(`- Symptoms: ${recentSymptoms.length} entries`)
    console.log(`- Appointments: 1 entry`)
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error)
    throw error
  }
}

if (require.main === module) {
  createSampleData()
    .catch((e) => {
      console.error('❌ Error:', e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}