"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, RotateCcw } from "lucide-react"
import { StudyModeSelector } from "@/components/study-mode-selector"
import { FlashcardReview } from "@/components/flashcard-review"
import { QuizMode } from "@/components/quiz-mode"
import { StudyResults } from "@/components/study-results"

interface Deck {
  id: string
  title: string
  description: string | null
  subject: string | null
}

interface Flashcard {
  id: string
  front_text: string
  back_text: string
  front_image_url: string | null
  back_image_url: string | null
  difficulty_level: number
}

interface StudySessionProps {
  deck: Deck
  flashcards: Flashcard[]
  userId: string
}

export type StudyMode = "flashcard" | "quiz" | "adaptive"

interface SessionResult {
  flashcard_id: string
  difficulty_rating: number
  time_spent_seconds: number
  is_correct: boolean
}

export function StudySession({ deck, flashcards, userId }: StudySessionProps) {
  const [studyMode, setStudyMode] = useState<StudyMode | null>(null)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([])
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [cardStartTime, setCardStartTime] = useState<Date | null>(null)
  const [isSessionComplete, setIsSessionComplete] = useState(false)
  const [shuffledCards, setShuffledCards] = useState<Flashcard[]>([])
  const router = useRouter()

  useEffect(() => {
    // Shuffle cards when component mounts
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5)
    setShuffledCards(shuffled)
  }, [flashcards])

  const startSession = (mode: StudyMode) => {
    setStudyMode(mode)
    setSessionStartTime(new Date())
    setCardStartTime(new Date())
  }

  const handleCardResult = (result: Omit<SessionResult, "flashcard_id" | "time_spent_seconds">) => {
    if (!cardStartTime) return

    const timeSpent = Math.floor((new Date().getTime() - cardStartTime.getTime()) / 1000)
    const sessionResult: SessionResult = {
      flashcard_id: shuffledCards[currentCardIndex].id,
      time_spent_seconds: timeSpent,
      ...result,
    }

    setSessionResults((prev) => [...prev, sessionResult])

    if (currentCardIndex < shuffledCards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1)
      setCardStartTime(new Date())
    } else {
      completeSession([...sessionResults, sessionResult])
    }
  }

  const completeSession = async (results: SessionResult[]) => {
    const supabase = createClient()

    try {
      // Save session results to database
      const sessionData = results.map((result) => ({
        user_id: userId,
        deck_id: deck.id,
        ...result,
      }))

      await supabase.from("study_sessions").insert(sessionData)
      setIsSessionComplete(true)
    } catch (error) {
      console.error("Error saving session:", error)
      setIsSessionComplete(true)
    }
  }

  const resetSession = () => {
    setStudyMode(null)
    setCurrentCardIndex(0)
    setSessionResults([])
    setSessionStartTime(null)
    setCardStartTime(null)
    setIsSessionComplete(false)
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5)
    setShuffledCards(shuffled)
  }

  const progress = shuffledCards.length > 0 ? ((currentCardIndex + 1) / shuffledCards.length) * 100 : 0

  if (isSessionComplete) {
    return (
      <StudyResults
        deck={deck}
        results={sessionResults}
        totalTime={sessionStartTime ? Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 1000) : 0}
        onRestart={resetSession}
        onExit={() => router.push(`/dashboard/decks/${deck.id}`)}
      />
    )
  }

  if (!studyMode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/dashboard/decks/${deck.id}`)}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Deck
            </Button>
            <h1 className="text-3xl font-bold mb-2">Study: {deck.title}</h1>
            <p className="text-muted-foreground">Choose your study mode to begin</p>
            <div className="flex items-center justify-center gap-4 mt-4">
              <Badge variant="secondary">{shuffledCards.length} cards</Badge>
              {deck.subject && <Badge variant="outline">{deck.subject}</Badge>}
            </div>
          </div>
          <StudyModeSelector onSelectMode={startSession} cardCount={shuffledCards.length} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setStudyMode(null)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{deck.title}</h1>
              <p className="text-sm text-muted-foreground capitalize">{studyMode} Mode</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {currentCardIndex + 1} of {shuffledCards.length}
            </div>
            <Button variant="outline" size="sm" onClick={resetSession}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
        </div>

        {/* Study Interface */}
        {shuffledCards.length > 0 && (
          <>
            {studyMode === "flashcard" && (
              <FlashcardReview
                card={shuffledCards[currentCardIndex]}
                onResult={handleCardResult}
                cardNumber={currentCardIndex + 1}
                totalCards={shuffledCards.length}
              />
            )}
            {studyMode === "quiz" && (
              <QuizMode
                card={shuffledCards[currentCardIndex]}
                allCards={shuffledCards}
                onResult={handleCardResult}
                cardNumber={currentCardIndex + 1}
                totalCards={shuffledCards.length}
              />
            )}
            {studyMode === "adaptive" && (
              <FlashcardReview
                card={shuffledCards[currentCardIndex]}
                onResult={handleCardResult}
                cardNumber={currentCardIndex + 1}
                totalCards={shuffledCards.length}
                isAdaptive={true}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
