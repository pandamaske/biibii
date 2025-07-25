import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedHealthData() {
  console.log('🏥 Seeding health data...')

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
}

// Function to seed vaccine schedule for a specific baby
export async function seedVaccineScheduleForBaby(babyId: string, birthDate: Date) {
  const schedules = [
    // Birth
    { name: 'Hépatite B', ageGroup: 'birth', scheduledWeeks: 0 },
    
    // 2 months
    { name: 'DTaP (Diphtérie, Tétanos, Coqueluche)', ageGroup: '2-months', scheduledWeeks: 8 },
    { name: 'Hib (Haemophilus influenzae)', ageGroup: '2-months', scheduledWeeks: 8 },
    { name: 'IPV (Poliomyélite)', ageGroup: '2-months', scheduledWeeks: 8 },
    { name: 'PCV13 (Pneumocoque)', ageGroup: '2-months', scheduledWeeks: 8 },
    { name: 'RV (Rotavirus)', ageGroup: '2-months', scheduledWeeks: 8 },
    
    // 4 months
    { name: 'DTaP (Diphtérie, Tétanos, Coqueluche)', ageGroup: '4-months', scheduledWeeks: 16 },
    { name: 'Hib (Haemophilus influenzae)', ageGroup: '4-months', scheduledWeeks: 16 },
    { name: 'IPV (Poliomyélite)', ageGroup: '4-months', scheduledWeeks: 16 },
    { name: 'PCV13 (Pneumocoque)', ageGroup: '4-months', scheduledWeeks: 16 },
    { name: 'RV (Rotavirus)', ageGroup: '4-months', scheduledWeeks: 16 },
    
    // 6 months
    { name: 'DTaP (Diphtérie, Tétanos, Coqueluche)', ageGroup: '6-months', scheduledWeeks: 24 },
    { name: 'Hib (Haemophilus influenzae)', ageGroup: '6-months', scheduledWeeks: 24 },
    { name: 'PCV13 (Pneumocoque)', ageGroup: '6-months', scheduledWeeks: 24 },
    { name: 'RV (Rotavirus)', ageGroup: '6-months', scheduledWeeks: 24 },
    { name: 'Influenza', ageGroup: '6-months', scheduledWeeks: 24 },
    
    // 12 months
    { name: 'MMR (Rougeole, Oreillons, Rubéole)', ageGroup: '12-months', scheduledWeeks: 52 },
    { name: 'Varicelle', ageGroup: '12-months', scheduledWeeks: 52 },
    { name: 'Hépatite A', ageGroup: '12-months', scheduledWeeks: 52 },
    { name: 'PCV13 (Pneumocoque)', ageGroup: '12-months', scheduledWeeks: 52 }
  ]

  const vaccines = []
  for (const schedule of schedules) {
    const scheduledDate = new Date(birthDate)
    scheduledDate.setDate(scheduledDate.getDate() + (schedule.scheduledWeeks * 7))
    
    const now = new Date()
    let status = 'upcoming'
    
    if (scheduledDate < now) {
      const weeksPast = Math.floor((now.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60 * 24 * 7))
      if (weeksPast > 4) {
        status = 'overdue'
      } else {
        status = 'due'
      }
    }

    vaccines.push(
      prisma.vaccineEntry.create({
        data: {
          babyId,
          name: schedule.name,
          ageGroup: schedule.ageGroup,
          scheduledDate,
          status
        }
      })
    )
  }

  await Promise.all(vaccines)
  console.log(`✅ Created vaccine schedule for baby ${babyId}`)
}

// Function to seed developmental milestones for a baby
export async function seedMilestonesForBaby(babyId: string) {
  const milestones = [
    // Motor milestones
    { category: 'motor', milestone: 'Tient sa tête droite', description: 'Peut maintenir sa tête droite quand on le tient en position verticale', minWeeks: 8, maxWeeks: 16 },
    { category: 'motor', milestone: 'Se retourne ventre-dos', description: 'Peut se retourner du ventre vers le dos', minWeeks: 12, maxWeeks: 20 },
    { category: 'motor', milestone: 'Tient assis sans aide', description: 'Peut rester assis sans soutien pendant plusieurs minutes', minWeeks: 20, maxWeeks: 32 },
    { category: 'motor', milestone: 'Rampe', description: 'Se déplace en rampant sur le ventre', minWeeks: 24, maxWeeks: 36 },
    
    // Cognitive milestones  
    { category: 'cognitive', milestone: 'Suit des objets du regard', description: 'Suit des objets en mouvement avec ses yeux', minWeeks: 6, maxWeeks: 12 },
    { category: 'cognitive', milestone: 'Reconnaît les visages familiers', description: 'Montre une préférence pour les visages connus', minWeeks: 8, maxWeeks: 16 },
    { category: 'cognitive', milestone: 'Comprend la permanence des objets', description: 'Réalise que les objets continuent d\'exister même cachés', minWeeks: 32, maxWeeks: 48 },
    
    // Language milestones
    { category: 'language', milestone: 'Sourit en réponse', description: 'Sourit quand on lui parle ou lui sourit', minWeeks: 4, maxWeeks: 8 },
    { category: 'language', milestone: 'Babille', description: 'Produit des sons comme "ba-ba" ou "da-da"', minWeeks: 16, maxWeeks: 28 },
    { category: 'language', milestone: 'Répond à son prénom', description: 'Se tourne quand on l\'appelle par son nom', minWeeks: 24, maxWeeks: 36 },
    
    // Social milestones
    { category: 'social', milestone: 'Sourit spontanément', description: 'Sourit sans stimulation externe', minWeeks: 6, maxWeeks: 12 },
    { category: 'social', milestone: 'Joue à coucou-caché', description: 'Participe activement au jeu de coucou-caché', minWeeks: 28, maxWeeks: 40 },
    { category: 'social', milestone: 'Imite les expressions', description: 'Copie les expressions faciales des autres', minWeeks: 12, maxWeeks: 24 },
    
    // Adaptive milestones
    { category: 'adaptive', milestone: 'Porte objets à la bouche', description: 'Explore les objets en les portant à sa bouche', minWeeks: 12, maxWeeks: 20 },
    { category: 'adaptive', milestone: 'Boit au biberon/tasse', description: 'Peut boire dans un biberon ou une tasse avec aide', minWeeks: 20, maxWeeks: 32 },
    { category: 'adaptive', milestone: 'Mange des aliments solides', description: 'Accepte et mange des aliments en morceaux', minWeeks: 24, maxWeeks: 36 }
  ]

  const milestonePromises = milestones.map(milestone =>
    prisma.developmentalMilestone.create({
      data: {
        babyId,
        ...milestone
      }
    })
  )

  await Promise.all(milestonePromises)
  console.log(`✅ Created ${milestones.length} developmental milestones for baby ${babyId}`)
}

if (require.main === module) {
  seedHealthData()
    .catch((e) => {
      console.error('❌ Error seeding health data:', e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}

export { seedHealthData }