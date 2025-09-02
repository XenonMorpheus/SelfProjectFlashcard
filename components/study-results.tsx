"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Trophy, Clock, Target, TrendingUp, RotateCcw, ArrowLeft } from "lucide-react"

interface Deck {
  id: string
  title: string
  description: string | null
  subject: string | null
}

interface SessionResult {
  flashcard_id: string
  difficulty_rating: number
  time_spent_seconds: number
  is_correct: boolean
}

interface StudyResultsProps {
  deck: Deck
  results: SessionResult[]
  totalTime: number
  onRestart: () => void
  onExit: () => void
}

export function StudyResults({ deck, results, totalTime, onRestart, onExit }: StudyResultsProps) {
  const totalCards = results.length
  const correctAnswers = results.filter((r) => r.is_correct).length
  const accuracy = totalCards > 0 ? Math.round((correctAnswers / totalCards) * 100) : 0
  const averageTime =
    totalCards > 0 ? Math.round(results.reduce((sum, r) => sum + r.time_spent_seconds, 0) / totalCards) : 0
  const averageRating =
    totalCards > 0 ? Math.round((results.reduce((sum, r) => sum + r.difficulty_rating, 0) / totalCards) * 10) / 10 : 0

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getPerformanceMessage = () => {
    if (accuracy >= 90) return { message: "Excellent work!", color: "text-green-600", icon: Trophy }
    if (accuracy >= 75) return { message: "Great job!", color: "text-blue-600", icon: TrendingUp }
    if (accuracy >= 60) return { message: "Good effort!", color: "text-yellow-600", icon: Target }
    return { message: "Keep practicing!", color: "text-orange-600", icon: Target }
  }

  const performance = getPerformanceMessage()
  const PerformanceIcon = performance.icon

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="mb-4">
            <PerformanceIcon className={`h-16 w-16 mx-auto ${performance.color}`} />
          </div>
          <h1 className="text-3xl font-bold mb-2">Study Session Complete!</h1>
          <p className="text-muted-foreground">You've finished studying "{deck.title}"</p>
          <div className={`text-xl font-semibold mt-2 ${performance.color}`}>{performance.message}</div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{accuracy}%</div>
              <Progress value={accuracy} className="mb-2" />
              <p className="text-sm text-muted-foreground">
                {correctAnswers} of {totalCards} cards correct
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{formatTime(totalTime)}</div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Avg {averageTime}s per card
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Session Summary</CardTitle>
            <CardDescription>Your performance breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{totalCards}</div>
                <div className="text-xs text-muted-foreground">Cards Studied</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{averageRating}</div>
                <div className="text-xs text-muted-foreground">Avg Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{correctAnswers}</div>
                <div className="text-xs text-muted-foreground">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{totalCards - correctAnswers}</div>
                <div className="text-xs text-muted-foreground">Need Review</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={onRestart} className="flex-1">
            <RotateCcw className="h-4 w-4 mr-2" />
            Study Again
          </Button>
          <Button onClick={onExit} variant="outline" className="flex-1 bg-transparent">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Deck
          </Button>
        </div>

        {accuracy < 75 && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">💡 Study Tip</h3>
            <p className="text-sm text-muted-foreground">
              Consider reviewing the cards you missed and try the adaptive study mode for personalized learning.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
