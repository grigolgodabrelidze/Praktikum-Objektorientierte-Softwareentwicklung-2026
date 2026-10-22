import { apiClient, type ApiClient } from './ApiClient'
import type {
  EvaluateAnswerResponse,
  Flashcard,
  FlashcardProgress,
  FlashcardWithProgress,
  GenerateCardsRequest,
  GenerateCardsResponse,
  ReviewRating,
} from '../types/api'

export class CardsService {
  private readonly client: ApiClient

  constructor(client: ApiClient = apiClient) {
    this.client = client
  }

  getCards(): Promise<FlashcardWithProgress[]> {
    return this.client.get<FlashcardWithProgress[]>('/cards')
  }

  generateCards(request: GenerateCardsRequest): Promise<GenerateCardsResponse> {
    return this.client.post<GenerateCardsResponse>('/generate', request)
  }

  saveCard(card: Flashcard): Promise<Flashcard> {
    return this.client.post<Flashcard>('/cards/save', card)
  }

  reviewCard(cardId: string, rating: ReviewRating): Promise<FlashcardProgress> {
    return this.client.put<FlashcardProgress>(`/cards/${cardId}/review`, { rating })
  }

  evaluateAnswer(cardId: string, answer: string): Promise<EvaluateAnswerResponse> {
    return this.client.post<EvaluateAnswerResponse>(`/cards/${cardId}/evaluate`, { answer })
  }
}

export const cardsService = new CardsService()
