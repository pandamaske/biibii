// IndexedDB wrapper for baby tracker data
import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface BabyTrackerDB extends DBSchema {
  userProfiles: {
    key: string
    value: any
  }
  babies: {
    key: string
    value: any
  }
  feedingEntries: {
    key: string
    value: any
    indexes: { 'by-baby': string; 'by-date': Date }
  }
  sleepEntries: {
    key: string
    value: any
    indexes: { 'by-baby': string; 'by-date': Date }
  }
  diaperEntries: {
    key: string
    value: any
    indexes: { 'by-baby': string; 'by-date': Date }
  }
  logs: {
    key: string
    value: any
    indexes: { 'by-date': Date; 'by-type': string }
  }
}

class BabyTrackerIndexedDB {
  private db: IDBPDatabase<BabyTrackerDB> | null = null

  async init() {
    this.db = await openDB<BabyTrackerDB>('BabyTrackerDB', 1, {
      upgrade(db) {
        // User profiles store
        db.createObjectStore('userProfiles', { keyPath: 'id' })
        
        // Babies store
        db.createObjectStore('babies', { keyPath: 'id' })
        
        // Feeding entries with indexes
        const feedingStore = db.createObjectStore('feedingEntries', { keyPath: 'id' })
        feedingStore.createIndex('by-baby', 'babyId')
        feedingStore.createIndex('by-date', 'startTime')
        
        // Sleep entries with indexes
        const sleepStore = db.createObjectStore('sleepEntries', { keyPath: 'id' })
        sleepStore.createIndex('by-baby', 'babyId')
        sleepStore.createIndex('by-date', 'startTime')
        
        // Diaper entries with indexes
        const diaperStore = db.createObjectStore('diaperEntries', { keyPath: 'id' })
        diaperStore.createIndex('by-baby', 'babyId')
        diaperStore.createIndex('by-date', 'time')
        
        // Activity logs
        const logsStore = db.createObjectStore('logs', { keyPath: 'id' })
        logsStore.createIndex('by-date', 'timestamp')
        logsStore.createIndex('by-type', 'type')
      },
    })
  }

  // Save user profile
  async saveUserProfile(profile: any) {
    if (!this.db) await this.init()
    return this.db!.put('userProfiles', profile)
  }

  // Save baby data
  async saveBaby(baby: any) {
    if (!this.db) await this.init()
    return this.db!.put('babies', baby)
  }

  // Save feeding entry
  async saveFeedingEntry(entry: any) {
    if (!this.db) await this.init()
    await this.db!.put('feedingEntries', entry)
    
    // Log the activity
    await this.logActivity({
      id: `log-${Date.now()}`,
      type: 'feeding',
      action: 'create',
      babyId: entry.babyId,
      timestamp: new Date(),
      data: { amount: entry.amount, type: entry.type }
    })
  }

  // Save sleep entry
  async saveSleepEntry(entry: any) {
    if (!this.db) await this.init()
    await this.db!.put('sleepEntries', entry)
    
    // Log the activity
    await this.logActivity({
      id: `log-${Date.now()}`,
      type: 'sleep',
      action: 'create',
      babyId: entry.babyId,
      timestamp: new Date(),
      data: { duration: entry.endTime ? (new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / 1000 / 60 : null }
    })
  }

  // Save diaper entry
  async saveDiaperEntry(entry: any) {
    if (!this.db) await this.init()
    await this.db!.put('diaperEntries', entry)
    
    // Log the activity
    await this.logActivity({
      id: `log-${Date.now()}`,
      type: 'diaper',
      action: 'create',
      babyId: entry.babyId,
      timestamp: new Date(),
      data: { type: entry.type }
    })
  }

  // Log activity
  async logActivity(log: any) {
    if (!this.db) await this.init()
    return this.db!.put('logs', log)
  }

  // Get logs by date range
  async getLogs(startDate: Date, endDate: Date, babyId?: string) {
    if (!this.db) await this.init()
    const logs = await this.db!.getAllFromIndex('logs', 'by-date')
    
    return logs.filter(log => {
      const logDate = new Date(log.timestamp)
      const inRange = logDate >= startDate && logDate <= endDate
      const matchesBaby = !babyId || log.babyId === babyId
      return inRange && matchesBaby
    })
  }

  // Export all data
  async exportAllData() {
    if (!this.db) await this.init()
    
    const [profiles, babies, feedings, sleeps, diapers, logs] = await Promise.all([
      this.db!.getAll('userProfiles'),
      this.db!.getAll('babies'),
      this.db!.getAll('feedingEntries'),
      this.db!.getAll('sleepEntries'),
      this.db!.getAll('diaperEntries'),
      this.db!.getAll('logs')
    ])

    return {
      userProfiles: profiles,
      babies,
      feedingEntries: feedings,
      sleepEntries: sleeps,
      diaperEntries: diapers,
      logs,
      exportDate: new Date(),
      version: '1.0.0'
    }
  }

  // Clear all data
  async clearAllData() {
    if (!this.db) await this.init()
    
    const stores = ['userProfiles', 'babies', 'feedingEntries', 'sleepEntries', 'diaperEntries', 'logs']
    const tx = this.db!.transaction(stores as any, 'readwrite')
    
    await Promise.all(stores.map(store => tx.objectStore(store).clear()))
    await tx.done
  }
}

export const babyTrackerDB = new BabyTrackerIndexedDB()