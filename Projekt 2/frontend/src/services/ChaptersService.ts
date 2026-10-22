import { apiClient, type ApiClient } from './ApiClient'
import type { Chapter } from '../types/api'

export class ChaptersService {
  private readonly client: ApiClient

  constructor(client: ApiClient = apiClient) {
    this.client = client
  }

  getChapters(): Promise<Chapter[]> {
    return this.client.get<Chapter[]>('/chapters')
  }
}

export const chaptersService = new ChaptersService()
