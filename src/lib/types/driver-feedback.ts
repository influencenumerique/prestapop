import { FeedbackTag, BadgeType } from "@prisma/client"

// ============ POST /api/drivers/[id]/feedback ============

export interface CreateFeedbackRequest {
  bookingId: string
  rating: number // 1-5
  tags: FeedbackTag[]
  comment?: string
}

export interface CreateFeedbackResponse {
  id: string
  bookingId: string
  driverId: string
  companyId: string
  rating: number
  tags: FeedbackTag[]
  comment?: string | null
  createdAt: Date
}

// ============ GET /api/drivers/[id]/stats ============

export interface DriverStatsResponse {
  driver: {
    id: string
    name: string | null
    image: string | null
    city: string | null
    region: string | null
    bio: string | null
    vehicleTypes: string[]
    isVerified: boolean
  }
  performance: {
    rating: number
    totalReviews: number
    totalDeliveries: number
    totalFeedbacks: number
  }
  topTags: Array<{
    tag: FeedbackTag
    count: number
    percentage: number
  }>
  badges: Array<{
    type: BadgeType
    earnedAt: Date
  }>
  ranking: {
    regionalRank: number | null
    region: string | null
  }
  recentFeedbacks: Array<{
    rating: number
    tags: FeedbackTag[]
    comment: string | null
    createdAt: Date
    company: {
      companyName: string
      logo: string | null
    }
  }>
}

// ============ GET /api/drivers/ranking ============

export interface DriverRankingRequest {
  region: string
  limit?: number // Default: 10
}

export interface DriverRankingResponse {
  region: string
  totalDrivers: number
  ranking: Array<{
    rank: number
    driver: {
      id: string
      name: string | null
      image: string | null
      city: string | null
      isVerified: boolean
    }
    performance: {
      rating: number
      totalReviews: number
      totalDeliveries: number
    }
    badges: BadgeType[]
    topTags: Array<{
      tag: FeedbackTag
      count: number
    }>
  }>
}

// ============ Badge Descriptions ============

export const BADGE_DESCRIPTIONS: Record<BadgeType, string> = {
  PUNCTUALITY_CHAMPION: "50+ livraisons ponctuelles",
  CAREFUL_EXPERT: "50+ livraisons soigneuses",
  SPEED_DEMON: "50+ livraisons rapides",
  COMMUNICATION_STAR: "50+ avis sur la communication",
  TOP_10_REGION: "Top 10 de sa région",
  TOP_3_REGION: "Top 3 de sa région",
  FIRST_100_DELIVERIES: "100 livraisons effectuées",
  FIRST_500_DELIVERIES: "500 livraisons effectuées",
  PERFECT_RATING: "Note moyenne parfaite (5.0)",
  RISING_STAR: "Nouveau talent prometteur",
}

// ============ Tag Descriptions ============

export const TAG_DESCRIPTIONS: Record<FeedbackTag, string> = {
  PUNCTUAL: "Ponctuel",
  CAREFUL: "Soigneux",
  COMMUNICATIVE: "Bonne communication",
  FAST: "Rapide",
  PRECISE: "Précis",
  FRIENDLY: "Souriant",
  RESOURCEFUL: "Débrouillard",
  RESPONSIVE: "Réactif",
  PROFESSIONAL: "Professionnel",
  RELIABLE: "Fiable",
}

// ============ Error Responses ============

export interface FeedbackErrorResponse {
  error: string
  details?: unknown
}
