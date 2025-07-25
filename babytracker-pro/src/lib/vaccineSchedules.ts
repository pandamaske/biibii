// Pediatric Vaccine Schedule Calculator
// Based on CDC, WHO, and European vaccination schedules

export interface VaccineScheduleEntry {
  id: string
  name: string
  abbreviation: string
  description: string
  ageInWeeks: number
  ageLabel: string
  doseNumber: number
  totalDoses: number
  category: 'mandatory' | 'recommended' | 'optional' | 'risk_based'
  urgency: 'critical' | 'high' | 'medium' | 'low'
  canBeDelayed: boolean
  maxDelayWeeks: number
  minimumInterval?: number // weeks between doses
  contraindications: string[]
  sideEffects: string[]
  protectionAgainst: string[]
  notes?: string
}

export const VACCINE_SCHEDULES: VaccineScheduleEntry[] = [
  // ===== BIRTH (0-2 weeks) =====
  {
    id: 'hep-b-1',
    name: 'Hépatite B (1ère dose)',
    abbreviation: 'HepB',
    description: 'Protection contre l\'hépatite B',
    ageInWeeks: 0,
    ageLabel: 'Naissance',
    doseNumber: 1,
    totalDoses: 3,
    category: 'mandatory',
    urgency: 'critical',
    canBeDelayed: false,
    maxDelayWeeks: 1,
    contraindications: ['allergie_levure', 'maladie_grave_aigue'],
    sideEffects: ['douleur_injection', 'fievre_legere', 'irritabilite'],
    protectionAgainst: ['hepatite_b', 'cirrhose_hepatique', 'cancer_foie']
  },
  {
    id: 'bcg-1',
    name: 'BCG (Tuberculose)',
    abbreviation: 'BCG',
    description: 'Protection contre la tuberculose',
    ageInWeeks: 0,
    ageLabel: 'Naissance (si risque)',
    doseNumber: 1,
    totalDoses: 1,
    category: 'risk_based',
    urgency: 'high',
    canBeDelayed: true,
    maxDelayWeeks: 12,
    contraindications: ['immunodeficience', 'infection_cutanee', 'premature'],
    sideEffects: ['ulceration_locale', 'adenite', 'cicatrice'],
    protectionAgainst: ['tuberculose', 'meningite_tuberculeuse']
  },

  // ===== 2 MONTHS (8 weeks) =====
  {
    id: 'dtap-1',
    name: 'DTaP (1ère dose)',
    abbreviation: 'DTaP',
    description: 'Diphtérie, Tétanos, Coqueluche acellulaire',
    ageInWeeks: 8,
    ageLabel: '2 mois',
    doseNumber: 1,
    totalDoses: 4,
    category: 'mandatory',
    urgency: 'critical',
    canBeDelayed: false,
    maxDelayWeeks: 2,
    minimumInterval: 4,
    contraindications: ['encephalopathie', 'convulsions', 'allergie_composants'],
    sideEffects: ['fievre', 'irritabilite', 'somnolence', 'perte_appetit'],
    protectionAgainst: ['diphterie', 'tetanos', 'coqueluche']
  },
  {
    id: 'hib-1',
    name: 'Hib (1ère dose)',
    abbreviation: 'Hib',
    description: 'Haemophilus influenzae type b',
    ageInWeeks: 8,
    ageLabel: '2 mois',
    doseNumber: 1,
    totalDoses: 3,
    category: 'mandatory',
    urgency: 'critical',
    canBeDelayed: false,
    maxDelayWeeks: 2,
    minimumInterval: 4,
    contraindications: ['allergie_composants', 'maladie_aigue_severe'],
    sideEffects: ['fievre_legere', 'irritabilite', 'rougeur_injection'],
    protectionAgainst: ['meningite_hib', 'pneumonie', 'epiglottite']
  },
  {
    id: 'ipv-1',
    name: 'IPV (1ère dose)',
    abbreviation: 'IPV',
    description: 'Poliomyélite inactivée',
    ageInWeeks: 8,
    ageLabel: '2 mois',
    doseNumber: 1,
    totalDoses: 4,
    category: 'mandatory',
    urgency: 'critical',
    canBeDelayed: false,
    maxDelayWeeks: 2,
    minimumInterval: 4,
    contraindications: ['allergie_streptomycine', 'allergie_polymyxine', 'maladie_aigue'],
    sideEffects: ['douleur_injection', 'rougeur_legere', 'fievre_rare'],
    protectionAgainst: ['poliomyelite', 'paralysie_flasque']
  },
  {
    id: 'pcv13-1',
    name: 'PCV13 (1ère dose)',
    abbreviation: 'PCV',
    description: 'Pneumocoque conjugué 13-valent',
    ageInWeeks: 8,
    ageLabel: '2 mois',
    doseNumber: 1,
    totalDoses: 4,
    category: 'mandatory',
    urgency: 'critical',
    canBeDelayed: false,
    maxDelayWeeks: 2,
    minimumInterval: 4,
    contraindications: ['allergie_anatoxine_diphtérique', 'maladie_aigue_severe'],
    sideEffects: ['fievre', 'irritabilite', 'somnolence', 'perte_appetit'],
    protectionAgainst: ['pneumonie', 'meningite_pneumocoque', 'otite', 'bacteriemie']
  },
  {
    id: 'rotavirus-1',
    name: 'Rotavirus (1ère dose)',
    abbreviation: 'RV',
    description: 'Rotavirus oral',
    ageInWeeks: 8,
    ageLabel: '2 mois',
    doseNumber: 1,
    totalDoses: 3,
    category: 'recommended',
    urgency: 'high',
    canBeDelayed: true,
    maxDelayWeeks: 4,
    minimumInterval: 4,
    contraindications: ['immunodeficience', 'invagination_anterieure', 'diarrhee_severe'],
    sideEffects: ['irritabilite_legere', 'diarrhee_legere', 'vomissements_rares'],
    protectionAgainst: ['gastroenterite_rotavirus', 'diarrhee_severe', 'deshydratation']
  },

  // ===== 4 MONTHS (16 weeks) =====
  {
    id: 'dtap-2',
    name: 'DTaP (2ème dose)',
    abbreviation: 'DTaP',
    description: 'Diphtérie, Tétanos, Coqueluche acellulaire',
    ageInWeeks: 16,
    ageLabel: '4 mois',
    doseNumber: 2,
    totalDoses: 4,
    category: 'mandatory',
    urgency: 'critical',
    canBeDelayed: false,
    maxDelayWeeks: 2,
    minimumInterval: 4,
    contraindications: ['reaction_severe_dose_precedente', 'encephalopathie'],
    sideEffects: ['fievre', 'irritabilite', 'somnolence', 'gonflement_leger'],
    protectionAgainst: ['diphterie', 'tetanos', 'coqueluche']
  },
  {
    id: 'hib-2',
    name: 'Hib (2ème dose)',
    abbreviation: 'Hib',
    description: 'Haemophilus influenzae type b',
    ageInWeeks: 16,
    ageLabel: '4 mois',
    doseNumber: 2,
    totalDoses: 3,
    category: 'mandatory',
    urgency: 'critical',
    canBeDelayed: false,
    maxDelayWeeks: 2,
    minimumInterval: 4,
    contraindications: ['allergie_composants', 'reaction_severe_anterieure'],
    sideEffects: ['fievre_legere', 'irritabilite', 'rougeur_injection'],
    protectionAgainst: ['meningite_hib', 'pneumonie', 'epiglottite']
  },
  {
    id: 'ipv-2',
    name: 'IPV (2ème dose)',
    abbreviation: 'IPV',
    description: 'Poliomyélite inactivée',
    ageInWeeks: 16,
    ageLabel: '4 mois',
    doseNumber: 2,
    totalDoses: 4,
    category: 'mandatory',
    urgency: 'critical',
    canBeDelayed: false,
    maxDelayWeeks: 2,
    minimumInterval: 4,
    contraindications: ['allergie_antibiotiques_vaccin', 'reaction_severe_anterieure'],
    sideEffects: ['douleur_injection', 'rougeur_legere'],
    protectionAgainst: ['poliomyelite', 'paralysie_flasque']
  },
  {
    id: 'pcv13-2',
    name: 'PCV13 (2ème dose)',
    abbreviation: 'PCV',
    description: 'Pneumocoque conjugué 13-valent',
    ageInWeeks: 16,
    ageLabel: '4 mois',
    doseNumber: 2,
    totalDoses: 4,
    category: 'mandatory',
    urgency: 'critical',
    canBeDelayed: false,
    maxDelayWeeks: 2,
    minimumInterval: 4,
    contraindications: ['allergie_composants', 'reaction_severe_anterieure'],
    sideEffects: ['fievre', 'irritabilite', 'somnolence', 'perte_appetit'],
    protectionAgainst: ['pneumonie', 'meningite_pneumocoque', 'otite']
  },
  {
    id: 'rotavirus-2',
    name: 'Rotavirus (2ème dose)',
    abbreviation: 'RV',
    description: 'Rotavirus oral',
    ageInWeeks: 16,
    ageLabel: '4 mois',
    doseNumber: 2,
    totalDoses: 3,
    category: 'recommended',
    urgency: 'high',
    canBeDelayed: true,
    maxDelayWeeks: 4,
    minimumInterval: 4,
    contraindications: ['immunodeficience_developpee', 'reaction_severe_anterieure'],
    sideEffects: ['irritabilite_legere', 'diarrhee_temporaire'],
    protectionAgainst: ['gastroenterite_rotavirus', 'hospitalisation']
  },

  // ===== 6 MONTHS (24 weeks) =====
  {
    id: 'dtap-3',
    name: 'DTaP (3ème dose)',
    abbreviation: 'DTaP',
    description: 'Diphtérie, Tétanos, Coqueluche acellulaire',
    ageInWeeks: 24,
    ageLabel: '6 mois',
    doseNumber: 3,
    totalDoses: 4,
    category: 'mandatory',
    urgency: 'critical',
    canBeDelayed: false,
    maxDelayWeeks: 4,
    minimumInterval: 4,
    contraindications: ['encephalopathie_progressive', 'reaction_severe_anterieure'],
    sideEffects: ['fievre', 'irritabilite', 'gonflement_site_injection'],
    protectionAgainst: ['diphterie', 'tetanos', 'coqueluche']
  },
  {
    id: 'hib-3',
    name: 'Hib (3ème dose)',
    abbreviation: 'Hib',
    description: 'Haemophilus influenzae type b',
    ageInWeeks: 24,
    ageLabel: '6 mois',
    doseNumber: 3,
    totalDoses: 3,
    category: 'mandatory',
    urgency: 'critical',
    canBeDelayed: false,
    maxDelayWeeks: 4,
    minimumInterval: 4,
    contraindications: ['immunodeficience_severe', 'allergie_composants'],
    sideEffects: ['fievre_legere', 'irritabilite', 'rougeur_injection'],
    protectionAgainst: ['meningite_hib', 'pneumonie', 'epiglottite']
  },
  {
    id: 'ipv-3',
    name: 'IPV (3ème dose)',
    abbreviation: 'IPV',
    description: 'Poliomyélite inactivée',
    ageInWeeks: 24,
    ageLabel: '6 mois',
    doseNumber: 3,
    totalDoses: 4,
    category: 'mandatory',
    urgency: 'critical',
    canBeDelayed: false,
    maxDelayWeeks: 4,
    minimumInterval: 4,
    contraindications: ['allergie_composants_vaccin', 'maladie_neurologique_progressive'],
    sideEffects: ['douleur_injection', 'rougeur_legere', 'fievre_rare'],
    protectionAgainst: ['poliomyelite', 'paralysie']
  },
  {
    id: 'pcv13-3',
    name: 'PCV13 (3ème dose)',
    abbreviation: 'PCV',
    description: 'Pneumocoque conjugué 13-valent',
    ageInWeeks: 24,
    ageLabel: '6 mois',
    doseNumber: 3,
    totalDoses: 4,
    category: 'mandatory',
    urgency: 'critical',
    canBeDelayed: false,
    maxDelayWeeks: 4,
    minimumInterval: 4,
    contraindications: ['allergie_anatoxine', 'reaction_anaphylactique_anterieure'],
    sideEffects: ['fievre', 'irritabilite', 'somnolence'],
    protectionAgainst: ['pneumonie', 'meningite', 'septicemie']
  },
  {
    id: 'rotavirus-3',
    name: 'Rotavirus (3ème dose)',
    abbreviation: 'RV',
    description: 'Rotavirus oral',
    ageInWeeks: 24,
    ageLabel: '6 mois',
    doseNumber: 3,
    totalDoses: 3,
    category: 'recommended',
    urgency: 'high',
    canBeDelayed: true,
    maxDelayWeeks: 8,
    minimumInterval: 4,
    contraindications: ['immunodeficience', 'maladie_gastro_intestinale_chronique'],
    sideEffects: ['irritabilite_legere', 'diarrhee_temporaire'],
    protectionAgainst: ['gastroenterite_severe', 'deshydratation']
  },
  {
    id: 'hep-b-2',
    name: 'Hépatite B (2ème dose)',
    abbreviation: 'HepB',
    description: 'Protection contre l\'hépatite B',
    ageInWeeks: 24,
    ageLabel: '6 mois',
    doseNumber: 2,
    totalDoses: 3,
    category: 'mandatory',
    urgency: 'critical',
    canBeDelayed: false,
    maxDelayWeeks: 4,
    minimumInterval: 8,
    contraindications: ['allergie_levure', 'reaction_severe_anterieure'],
    sideEffects: ['douleur_injection', 'fievre_legere', 'fatigue'],
    protectionAgainst: ['hepatite_b_chronique', 'cirrhose', 'cancer_foie']
  },
  {
    id: 'influenza-1',
    name: 'Grippe (1ère dose)',
    abbreviation: 'Flu',
    description: 'Vaccin antigrippal annuel',
    ageInWeeks: 24,
    ageLabel: '6 mois',
    doseNumber: 1,
    totalDoses: 2,
    category: 'recommended',
    urgency: 'medium',
    canBeDelayed: true,
    maxDelayWeeks: 12,
    minimumInterval: 4,
    contraindications: ['allergie_oeuf_severe', 'syndrome_guillain_barre'],
    sideEffects: ['fievre_legere', 'douleur_bras', 'fatigue'],
    protectionAgainst: ['grippe_saisonniere', 'complications_respiratoires'],
    notes: 'Vaccin saisonnier, à renouveler chaque année'
  },

  // ===== 12 MONTHS (52 weeks) =====
  {
    id: 'hib-4',
    name: 'Hib (Rappel)',
    abbreviation: 'Hib',
    description: 'Haemophilus influenzae type b - Rappel',
    ageInWeeks: 52,
    ageLabel: '12 mois',
    doseNumber: 4,
    totalDoses: 4,
    category: 'mandatory',
    urgency: 'high',
    canBeDelayed: true,
    maxDelayWeeks: 8,
    minimumInterval: 16,
    contraindications: ['immunodeficience_severe', 'allergie_composants'],
    sideEffects: ['fievre_legere', 'irritabilite'],
    protectionAgainst: ['meningite_hib', 'protection_long_terme']
  },
  {
    id: 'pcv13-4',
    name: 'PCV13 (Rappel)',
    abbreviation: 'PCV',
    description: 'Pneumocoque conjugué 13-valent - Rappel',
    ageInWeeks: 52,
    ageLabel: '12 mois',
    doseNumber: 4,
    totalDoses: 4,
    category: 'mandatory',
    urgency: 'high',
    canBeDelayed: true,
    maxDelayWeeks: 8,
    minimumInterval: 16,
    contraindications: ['allergie_composants', 'maladie_aigue_severe'],
    sideEffects: ['fievre', 'irritabilite', 'gonflement_leger'],
    protectionAgainst: ['pneumonie', 'meningite', 'otite_recurrente']
  },
  {
    id: 'mmr-1',
    name: 'ROR (1ère dose)',
    abbreviation: 'MMR',
    description: 'Rougeole, Oreillons, Rubéole',
    ageInWeeks: 52,
    ageLabel: '12 mois',
    doseNumber: 1,
    totalDoses: 2,
    category: 'mandatory',
    urgency: 'critical',
    canBeDelayed: false,
    maxDelayWeeks: 4,
    contraindications: ['immunodeficience', 'grossesse', 'allergie_neomycine', 'tuberculose_active'],
    sideEffects: ['fievre', 'rash_leger', 'gonflement_ganglions', 'convulsions_febriles_rares'],
    protectionAgainst: ['rougeole', 'oreillons', 'rubeole', 'encephalite']
  },
  {
    id: 'varicella-1',
    name: 'Varicelle (1ère dose)',
    abbreviation: 'VAR',
    description: 'Protection contre la varicelle',
    ageInWeeks: 52,
    ageLabel: '12 mois',
    doseNumber: 1,
    totalDoses: 2,
    category: 'recommended',
    urgency: 'high',
    canBeDelayed: true,
    maxDelayWeeks: 8,
    contraindications: ['immunodeficience', 'grossesse', 'salicylates', 'gelatin_allergie'],
    sideEffects: ['fievre_legere', 'rash_varicelle_leger', 'irritabilite'],
    protectionAgainst: ['varicelle', 'zona_futur', 'complications_cutanees']
  },
  {
    id: 'hep-a-1',
    name: 'Hépatite A (1ère dose)',
    abbreviation: 'HepA',
    description: 'Protection contre l\'hépatite A',
    ageInWeeks: 52,
    ageLabel: '12 mois',
    doseNumber: 1,
    totalDoses: 2,
    category: 'recommended',
    urgency: 'medium',
    canBeDelayed: true,
    maxDelayWeeks: 12,
    contraindications: ['maladie_aigue_severe', 'allergie_composants'],
    sideEffects: ['douleur_injection', 'fievre_legere', 'fatigue'],
    protectionAgainst: ['hepatite_a', 'insuffisance_hepatique_aigue']
  },

  // ===== 15 MONTHS (65 weeks) =====
  {
    id: 'dtap-4',
    name: 'DTaP (Rappel)',
    abbreviation: 'DTaP',
    description: 'Diphtérie, Tétanos, Coqueluche - Rappel',
    ageInWeeks: 65,
    ageLabel: '15 mois',
    doseNumber: 4,
    totalDoses: 4,
    category: 'mandatory',
    urgency: 'high',
    canBeDelayed: true,
    maxDelayWeeks: 8,
    minimumInterval: 24,
    contraindications: ['encephalopathie', 'reaction_severe_anterieure'],
    sideEffects: ['fievre', 'irritabilite', 'gonflement_site_injection'],
    protectionAgainst: ['diphterie', 'tetanos', 'coqueluche']
  },
  {
    id: 'ipv-4',
    name: 'IPV (Rappel)',
    abbreviation: 'IPV',
    description: 'Poliomyélite inactivée - Rappel',
    ageInWeeks: 65,
    ageLabel: '15 mois',
    doseNumber: 4,
    totalDoses: 4,
    category: 'mandatory',
    urgency: 'high',
    canBeDelayed: true,
    maxDelayWeeks: 8,
    minimumInterval: 24,
    contraindications: ['allergie_composants', 'maladie_neurologique'],
    sideEffects: ['douleur_injection', 'rougeur_legere'],
    protectionAgainst: ['poliomyelite', 'protection_long_terme']
  },

  // ===== 18 MONTHS (78 weeks) =====
  {
    id: 'hep-a-2',
    name: 'Hépatite A (2ème dose)',
    abbreviation: 'HepA',
    description: 'Protection contre l\'hépatite A - Rappel',
    ageInWeeks: 78,
    ageLabel: '18 mois',
    doseNumber: 2,
    totalDoses: 2,
    category: 'recommended',
    urgency: 'medium',
    canBeDelayed: true,
    maxDelayWeeks: 12,
    minimumInterval: 24,
    contraindications: ['allergie_composants', 'maladie_hepatique_severe'],
    sideEffects: ['douleur_injection', 'fievre_legere'],
    protectionAgainst: ['hepatite_a_long_terme', 'protection_voyage']
  },
  {
    id: 'hep-b-3',
    name: 'Hépatite B (3ème dose)',
    abbreviation: 'HepB',
    description: 'Protection contre l\'hépatite B - Série complète',
    ageInWeeks: 78,
    ageLabel: '18 mois',
    doseNumber: 3,
    totalDoses: 3,
    category: 'mandatory',
    urgency: 'high',
    canBeDelayed: true,
    maxDelayWeeks: 8,
    minimumInterval: 32,
    contraindications: ['allergie_levure', 'reaction_anaphylactique'],
    sideEffects: ['douleur_injection', 'fievre_legere', 'fatigue'],
    protectionAgainst: ['hepatite_b_vie_entiere', 'transmission_verticale']
  }
]

// Utility functions for vaccine schedule calculations
export class VaccineScheduleCalculator {
  static calculateAgeInWeeks(birthDate: Date): number {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - birthDate.getTime())
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7))
    return diffWeeks
  }

  static getVaccinesForAge(ageInWeeks: number): VaccineScheduleEntry[] {
    return VACCINE_SCHEDULES.filter(vaccine => {
      const isAgeMatch = ageInWeeks >= vaccine.ageInWeeks
      const isNotOverdue = ageInWeeks <= (vaccine.ageInWeeks + vaccine.maxDelayWeeks)
      return isAgeMatch && isNotOverdue
    })
  }

  static getDueVaccines(ageInWeeks: number): VaccineScheduleEntry[] {
    return VACCINE_SCHEDULES.filter(vaccine => {
      return ageInWeeks >= vaccine.ageInWeeks && 
             ageInWeeks <= (vaccine.ageInWeeks + vaccine.maxDelayWeeks)
    })
  }

  static getOverdueVaccines(ageInWeeks: number): VaccineScheduleEntry[] {
    return VACCINE_SCHEDULES.filter(vaccine => {
      return ageInWeeks > (vaccine.ageInWeeks + vaccine.maxDelayWeeks)
    })
  }

  static getUpcomingVaccines(ageInWeeks: number, weeksAhead: number = 8): VaccineScheduleEntry[] {
    return VACCINE_SCHEDULES.filter(vaccine => {
      return vaccine.ageInWeeks > ageInWeeks && 
             vaccine.ageInWeeks <= (ageInWeeks + weeksAhead)
    }).sort((a, b) => a.ageInWeeks - b.ageInWeeks)
  }

  static getCatchUpSchedule(birthDate: Date, currentVaccines: string[] = []): VaccineScheduleEntry[] {
    const ageInWeeks = this.calculateAgeInWeeks(birthDate)
    const missedVaccines = VACCINE_SCHEDULES.filter(vaccine => {
      const shouldHaveReceived = ageInWeeks >= vaccine.ageInWeeks
      const notReceived = !currentVaccines.includes(vaccine.id)
      return shouldHaveReceived && notReceived
    })

    // Sort by urgency and age
    return missedVaccines.sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
      if (urgencyDiff !== 0) return urgencyDiff
      return a.ageInWeeks - b.ageInWeeks
    })
  }

  static canVaccinesBeGivenTogether(vaccine1: string, vaccine2: string): boolean {
    // Most vaccines can be given together, but some exceptions exist
    const incompatibleCombinations: string[][] = [
      // Add any incompatible combinations here
    ]
    
    return !incompatibleCombinations.some(combo => 
      (combo.includes(vaccine1) && combo.includes(vaccine2))
    )
  }

  static generatePersonalizedSchedule(
    birthDate: Date, 
    riskFactors: string[] = [],
    contraindications: string[] = [],
    travelPlanned: boolean = false
  ): VaccineScheduleEntry[] {
    let schedule = [...VACCINE_SCHEDULES]

    // Filter out contraindicated vaccines
    schedule = schedule.filter(vaccine => 
      !vaccine.contraindications.some(contra => contraindications.includes(contra))
    )

    // Modify based on risk factors
    if (riskFactors.includes('premature')) {
      // Premature babies may need adjusted schedules
      schedule = schedule.map(vaccine => ({
        ...vaccine,
        ageInWeeks: vaccine.ageInWeeks + 2, // Delay by 2 weeks
        maxDelayWeeks: vaccine.maxDelayWeeks + 2
      }))
    }

    if (riskFactors.includes('immunocompromised')) {
      // Remove live vaccines for immunocompromised babies
      schedule = schedule.filter(vaccine => 
        !['mmr-1', 'varicella-1', 'rotavirus-1', 'rotavirus-2', 'rotavirus-3'].includes(vaccine.id)
      )
    }

    if (travelPlanned) {
      // Accelerate certain vaccines for travel
      schedule = schedule.map(vaccine => {
        if (['hep-a-1', 'hep-b-1', 'mmr-1'].includes(vaccine.id)) {
          return {
            ...vaccine,
            urgency: 'critical' as const,
            canBeDelayed: false
          }
        }
        return vaccine
      })
    }

    return schedule.sort((a, b) => a.ageInWeeks - b.ageInWeeks)
  }

  static getVaccineReminders(birthDate: Date, currentVaccines: string[] = []): Array<{
    vaccine: VaccineScheduleEntry,
    status: 'due' | 'overdue' | 'upcoming',
    daysUntilDue: number,
    priority: 'urgent' | 'high' | 'medium' | 'low'
  }> {
    const ageInWeeks = this.calculateAgeInWeeks(birthDate)
    const reminders = []

    for (const vaccine of VACCINE_SCHEDULES) {
      if (currentVaccines.includes(vaccine.id)) continue

      const weeksUntilDue = vaccine.ageInWeeks - ageInWeeks
      const daysUntilDue = weeksUntilDue * 7
      const isOverdue = ageInWeeks > (vaccine.ageInWeeks + vaccine.maxDelayWeeks)
      const isDue = ageInWeeks >= vaccine.ageInWeeks && ageInWeeks <= (vaccine.ageInWeeks + vaccine.maxDelayWeeks)
      const isUpcoming = weeksUntilDue > 0 && weeksUntilDue <= 4

      if (isOverdue || isDue || isUpcoming) {
        let status: 'due' | 'overdue' | 'upcoming'
        let priority: 'urgent' | 'high' | 'medium' | 'low'

        if (isOverdue) {
          status = 'overdue'
          priority = vaccine.urgency === 'critical' ? 'urgent' : 'high'
        } else if (isDue) {
          status = 'due'
          priority = vaccine.urgency === 'critical' ? 'urgent' : 'high'
        } else {
          status = 'upcoming'
          priority = vaccine.urgency === 'critical' ? 'high' : 'medium'
        }

        reminders.push({
          vaccine,
          status,
          daysUntilDue,
          priority
        })
      }
    }

    return reminders.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }
}