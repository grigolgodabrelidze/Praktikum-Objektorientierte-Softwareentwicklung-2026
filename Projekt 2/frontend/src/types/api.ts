/**
 * Wire-format types for the Lernwerkzeug-67 REST API.
 * Field names mirror backend/src/models.py (Flashcard, FlashcardProgress) 1:1,
 * so no case-mapping is needed between frontend and backend.
 */

export interface Chapter {
  id: string
  title: string
}

export interface Flashcard {
  id: string
  question: string
  answer: string
  chapter: string
}

export type LeitnerBox = 1 | 2 | 3

export interface FlashcardProgress {
  card_id: string
  box: LeitnerBox
  last_reviewed: number
  next_review_due: number
}

export interface FlashcardWithProgress extends Flashcard {
  progress: FlashcardProgress
}

export interface AskQuestionRequest {
  chapter_id: string
  question: string
}

export interface AskQuestionResponse {
  answer: string
}

/** Vergleich kurzer vs. ausführlicher Prompts, siehe Projektanforderung 3 (LLM-Kognitionskompetenzen). */
export type PromptDetail = 'short' | 'detailed'

export interface GenerateCardsRequest {
  chapter_id: string
  num_cards: number
  prompt_detail: PromptDetail
}

export interface GenerateCardsResponse {
  cards: Flashcard[]
  /** Optional, bis das echte Backend Token-Tracking implementiert (noch nicht Teil von backend/src/main.py). */
  tokens_used?: number
  token_limit?: number
}

/** 1 = falsch, 2 = teilweise richtig, 3 = vollständig richtig (siehe LearningEngine.review_card) */
export type ReviewRating = 1 | 2 | 3

export interface ReviewCardRequest {
  rating: ReviewRating
}

export interface EvaluateAnswerRequest {
  answer: string
}

export interface EvaluateAnswerResponse {
  accuracy: number
  completeness: number
  feedback: string
}
