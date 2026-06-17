import { ContentType, Platform } from "@prisma/client"
import { type MonthlyStrategy } from "./strategy"

export interface CalendarSlot {
  date: Date
  contentType: ContentType
  platform: Platform
  pillarName: string
}

export function generateCalendarSlots(
  strategy: MonthlyStrategy,
  month: number,
  year: number,
  postsPerWeek: number
): CalendarSlot[] {
  const slots: CalendarSlot[] = []
  const daysInMonth = new Date(year, month, 0).getDate()

  // Días óptimos de publicación por frecuencia
  const publishDays = getPublishDays(postsPerWeek)

  // Asignar pilares a los slots según su porcentaje
  const pillarDistribution = buildPillarDistribution(strategy.contentPillars)

  let slotIndex = 0

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day)
    const dayOfWeek = date.getDay() // 0=Dom, 1=Lun, ..., 6=Sáb

    if (!publishDays.includes(dayOfWeek)) continue

    const pillar = pillarDistribution[slotIndex % pillarDistribution.length]
    const contentType = selectContentType(pillar.name, slotIndex)
    const hour = getOptimalHour(dayOfWeek)

    date.setHours(hour, 0, 0, 0)

    slots.push({
      date: new Date(date),
      contentType,
      platform: Platform.INSTAGRAM,
      pillarName: pillar.name,
    })

    slotIndex++
  }

  return slots
}

// Días de la semana óptimos según frecuencia de posts
function getPublishDays(postsPerWeek: number): number[] {
  const maps: Record<number, number[]> = {
    1: [3],             // Solo miércoles
    2: [1, 4],          // Lunes y jueves
    3: [1, 3, 5],       // Lun, Mié, Vie
    4: [1, 2, 4, 6],    // Lun, Mar, Jue, Sáb
    5: [1, 2, 3, 5, 6], // Lun a Mié + Vie + Sáb
    6: [1, 2, 3, 4, 5, 6],
    7: [0, 1, 2, 3, 4, 5, 6],
  }
  return maps[Math.min(postsPerWeek, 7)] ?? maps[3]
}

// Horario óptimo de publicación por día
function getOptimalHour(dayOfWeek: number): number {
  // Lunes-Viernes: 19hs | Sábado: 11hs | Domingo: 20hs
  if (dayOfWeek === 6) return 11
  if (dayOfWeek === 0) return 20
  return 19
}

// Expandir pilares en un array según su porcentaje
function buildPillarDistribution(pillars: MonthlyStrategy["contentPillars"]) {
  const total = 10 // resolución de 10 slots
  const distribution: MonthlyStrategy["contentPillars"][number][] = []

  for (const pillar of pillars) {
    const count = Math.round((pillar.percentage / 100) * total)
    for (let i = 0; i < count; i++) {
      distribution.push(pillar)
    }
  }

  // Shuffle para que no sea predecible
  return distribution.sort(() => Math.random() - 0.5)
}

// Seleccionar tipo de contenido según el pilar
function selectContentType(pillarName: string, index: number): ContentType {
  const lower = pillarName.toLowerCase()

  if (lower.includes("educat") || lower.includes("tip") || lower.includes("tutorial")) {
    return index % 3 === 0 ? ContentType.CAROUSEL : ContentType.FEED_POST
  }
  if (lower.includes("testimon") || lower.includes("caso")) {
    return ContentType.FEED_POST
  }
  if (lower.includes("behind") || lower.includes("couliss") || lower.includes("proceso")) {
    return ContentType.STORY
  }
  if (lower.includes("venta") || lower.includes("convers") || lower.includes("oferta")) {
    return ContentType.FEED_POST
  }

  // Default: alternar entre feed y carrusel
  const types = [ContentType.FEED_POST, ContentType.FEED_POST, ContentType.CAROUSEL, ContentType.STORY]
  return types[index % types.length]
}
