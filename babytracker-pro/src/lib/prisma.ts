import { PrismaClient } from '@prisma/client'

declare global {
  // impératif pour éviter un nouveau client à chaque hot reload
  var prisma: PrismaClient | undefined
}

// Check if we're in a build environment without database access
const isDuringBuild = process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL

export const prisma = isDuringBuild 
  ? null 
  : (global.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
    }))

if (process.env.NODE_ENV !== 'production' && prisma) global.prisma = prisma
