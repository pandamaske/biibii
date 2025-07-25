import { PrismaClient } from '@prisma/client'

declare global {
  // impératif pour éviter un nouveau client à chaque hot reload
  var prisma: PrismaClient | undefined
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: ['query', 'error'], // Affiche chaque SQL exécuté
  })

if (process.env.NODE_ENV !== 'production') global.prisma = prisma
