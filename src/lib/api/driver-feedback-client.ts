/**
 * Client API pour le système de feedback des chauffeurs
 * Facilite les appels API côté frontend
 */

import type {
  CreateFeedbackRequest,
  CreateFeedbackResponse,
  DriverStatsResponse,
  DriverRankingResponse,
  FeedbackErrorResponse,
} from "@/lib/types/driver-feedback"

export class DriverFeedbackClient {
  private baseUrl: string

  constructor(baseUrl = "/api") {
    this.baseUrl = baseUrl
  }

  /**
   * Créer un feedback pour un chauffeur
   * @param driverId ID du chauffeur
   * @param data Données du feedback
   * @returns Feedback créé ou erreur
   */
  async createFeedback(
    driverId: string,
    data: CreateFeedbackRequest
  ): Promise<CreateFeedbackResponse> {
    const response = await fetch(`${this.baseUrl}/drivers/${driverId}/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error: FeedbackErrorResponse = await response.json()
      throw new Error(error.error)
    }

    return response.json()
  }

  /**
   * Récupérer les statistiques d'un chauffeur
   * @param driverId ID du chauffeur
   * @returns Stats complètes du chauffeur
   */
  async getDriverStats(driverId: string): Promise<DriverStatsResponse> {
    const response = await fetch(`${this.baseUrl}/drivers/${driverId}/stats`)

    if (!response.ok) {
      const error: FeedbackErrorResponse = await response.json()
      throw new Error(error.error)
    }

    return response.json()
  }

  /**
   * Récupérer le classement régional des chauffeurs
   * @param region Région (ex: "Paris", "Île-de-France")
   * @param limit Nombre de résultats (défaut: 10)
   * @returns Classement des chauffeurs
   */
  async getDriverRanking(
    region: string,
    limit = 10
  ): Promise<DriverRankingResponse> {
    const params = new URLSearchParams({
      region,
      limit: limit.toString(),
    })

    const response = await fetch(
      `${this.baseUrl}/drivers/ranking?${params.toString()}`
    )

    if (!response.ok) {
      const error: FeedbackErrorResponse = await response.json()
      throw new Error(error.error)
    }

    return response.json()
  }
}

// Instance singleton pour faciliter l'utilisation
export const driverFeedbackClient = new DriverFeedbackClient()

// Fonctions helper pour utilisation directe
export const createDriverFeedback = driverFeedbackClient.createFeedback.bind(
  driverFeedbackClient
)
export const getDriverStats = driverFeedbackClient.getDriverStats.bind(
  driverFeedbackClient
)
export const getDriverRanking = driverFeedbackClient.getDriverRanking.bind(
  driverFeedbackClient
)
