import { apiClient, type ApiClient } from './ApiClient'
import type { AskQuestionRequest, AskQuestionResponse } from '../types/api'

export class ChatService {
  private readonly client: ApiClient

  constructor(client: ApiClient = apiClient) {
    this.client = client
  }

  askQuestion(request: AskQuestionRequest): Promise<AskQuestionResponse> {
    return this.client.post<AskQuestionResponse>('/chat/ask', request)
  }
}

export const chatService = new ChatService()
