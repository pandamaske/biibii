const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedHealthData() {
  console.log('🏥 Seeding health data...')

  try {
    // Create default healthcare providers
    const providers = await Promise.all([
      prisma.healthcareProvider.create({
        data: {
          name: 'Dr. Sarah Smith',
          type: 'pediatrician',
          phone: '01 42 34 56 78',
          email: 'dr.smith@pediatrie.fr',
          address: '123 Rue de la Santé, 75014 Paris',
          hours: 'Lun-Ven 8h-18h, Sam 9h-12h',
          distance: '2.3 km'
        }
      }),
      prisma.healthcareProvider.create({
        data: {
          name: 'Urgences Pédiatriques Necker',
          type: 'emergency',
          phone: '01 44 49 40 00',
          address: '149 Rue de Sèvres, 75015 Paris',
          hours: '24h/24, 7j/7',
          distance: '0.8 km'
        }
      }),
      prisma.healthcareProvider.create({
        data: {
          name: 'Centre de PMI Paris 14',
          type: 'specialist',
          phone: '01 43 22 45 67',
          address: '45 Avenue du Général Leclerc, 75014 Paris',
          hours: 'Lun-Ven 9h-17h',
          distance: '1.2 km'
        }
      })
    ])

    // Create standard medications database
    const medications = await Promise.all([
      prisma.medication.create({
        data: {
          name: 'Doliprane',
          type: 'pain_reliever',
          activeIngredient: 'Paracétamol',
          concentration: '80mg/ml',
          form: 'liquid'
        }
      }),
      prisma.medication.create({
        data: {
          name: 'Advil',
          type: 'pain_reliever',
          activeIngredient: 'Ibuprofène',
          concentration: '20mg/ml',
          form: 'liquid'
        }
      }),
      prisma.medication.create({
        data: {
          name: 'Vitamin D',
          type: 'vitamin',
          activeIngredient: 'Cholécalciférol',
          concentration: '1000 UI/ml',
          form: 'drops'
        }
      })
    ])

    // Create first aid guides
    const firstAidGuides = await Promise.all([
      prisma.firstAidGuide.create({
        data: {
          title: 'RCP nourrisson',
          type: 'video',
          duration: '3 min',
          content: 'Instructions détaillées pour la réanimation cardio-pulmonaire chez le nourrisson',
          steps: [
            'Vérifier la conscience du bébé',
            'Appeler les secours (15)',
            'Positionner correctement la tête',
            'Effectuer 5 insufflations de secours',
            'Alterner 30 compressions et 2 insufflations'
          ],
          emergencyNumber: '15'
        }
      }),
      prisma.firstAidGuide.create({
        data: {
          title: 'Étouffement',
          type: 'interactive',
          content: 'Que faire en cas d\'étouffement chez un bébé',
          steps: [
            'Maintenir le bébé tête vers le bas sur votre avant-bras',
            'Donner 5 tapes fermes entre les omoplates',
            'Retourner le bébé et faire 5 compressions thoraciques',
            'Répéter jusqu\'à dégagement ou perte de conscience'
          ]
        }
      }),
      prisma.firstAidGuide.create({
        data: {
          title: 'Gestion de la fièvre',
          type: 'article',
          content: 'Comment gérer la fièvre chez le nourrisson',
          steps: [
            'Prendre la température rectale',
            'Découvrir légèrement l\'enfant',
            'Donner à boire régulièrement',
            'Administrer un antipyrétique si nécessaire',
            'Consulter si fièvre > 38.5°C chez un nourrisson < 3 mois'
          ]
        }
      })
    ])

    // Create product recalls (sample)
    await prisma.productRecall.create({
      data: {
        productName: 'Lit bébé SleepSafe',
        brand: 'BabyCorp',
        modelNumber: 'SS-2024',
        severity: 'high',
        description: 'Risque de chute des barreaux latéraux pouvant causer des blessures',
        actionRequired: 'Arrêter immédiatement l\'utilisation et contacter le service client',
        recallDate: new Date('2024-11-15'),
        url: 'https://www.recalls.gov/baby-crib-ss2024'
      }
    })

    console.log('✅ Health data seeded successfully!')
    console.log(`Created ${providers.length} healthcare providers`)
    console.log(`Created ${medications.length} medications`)  
    console.log(`Created ${firstAidGuides.length} first aid guides`)
    
  } catch (error) {
    console.error('❌ Error seeding health data:', error)
    throw error
  }
}

if (require.main === module) {
  seedHealthData()
    .catch((e) => {
      console.error('❌ Error:', e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}