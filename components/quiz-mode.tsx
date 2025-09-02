"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock } from "lucide-react"

interface Flashcard {
  id: string
  front_text: string
  back_text: string
  front_image_url: string | null
  back_image_url: string | null
  difficulty_level: number
}

interface QuizModeProps {
  card: Flashcard
  allCards: Flashcard[]
  onResult: (result: { difficulty_rating: number; is_correct: boolean }) => void
  cardNumber: number
  totalCards: number
}

export function QuizMode({ card, allCards, onResult, cardNumber, totalCards }: QuizModeProps) {
  const [options, setOptions] = useState<string[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)

  useEffect(() => {
    // Generate multiple choice options
    const correctAnswer = card.back_text
    const wrongAnswers = allCards
      .filter((c) => c.id !== card.id)
      .map((c) => c.back_text)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)

    const allOptions = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5)
    setOptions(allOptions)
    setSelectedAnswer(null)
    setShowResult(false)
    setTimeLeft(30)
  }, [card, allCards])

  useEffect(() => {
    if (timeLeft > 0 && !showResult) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !showResult) {
      handleTimeUp()
    }
  }, [timeLeft, showResult])

  const handleTimeUp = () => {
    setShowResult(true)
    setIsCorrect(false)
    setTimeout(() => {
      onResult({ difficulty_rating: 1, is_correct: false })
    }, 2000)
  }

  const handleAnswerSelect = (answer: string) => {
    if (showResult) return
    setSelectedAnswer(answer)
  }

  const handleSubmit = () => {
    if (!selectedAnswer) return

    const correct = selectedAnswer === card.back_text
    setIsCorrect(correct)
    setShowResult(true)

    setTimeout(() => {
      // Rate based on correctness and time taken
      const timeBonus = timeLeft > 20 ? 1 : 0
      const rating = correct ? 4 + timeBonus : 2
      onResult({ difficulty_rating: rating, is_correct: correct })
    }, 2000)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <Badge variant="outline" className="mb-2">
          Question {cardNumber} of {totalCards}
        </Badge>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div>Quiz Mode • Difficulty Level {card.difficulty_level}</div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {timeLeft}s
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-center text-balance">{card.front_text}</CardTitle>
          {card.front_image_url && (
            <img
              src={card.front_image_url || "/placeholder.svg"}
              alt="Question"
              className="max-w-full h-auto mx-auto rounded-lg"
            />
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {options.map((option, index) => {
              let buttonVariant: "outline" | "default" | "destructive" | "secondary" = "outline"
              let icon = null

              if (showResult) {
                if (option === card.back_text) {
                  buttonVariant = "default"
                  icon = <CheckCircle className="h-4 w-4" />
                } else if (option === selectedAnswer && option !== card.back_text) {
                  buttonVariant = "destructive"
                  icon = <XCircle className="h-4 w-4" />
                }
              } else if (selectedAnswer === option) {
                buttonVariant = "secondary"
              }

              return (
                <Button
                  key={index}
                  variant={buttonVariant}
                  className="w-full justify-start text-left h-auto p-4"
                  onClick={() => handleAnswerSelect(option)}
                  disabled={showResult}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <div className="flex-1 text-balance">{option}</div>
                    {icon && <div className="flex-shrink-0">{icon}</div>}
                  </div>
                </Button>
              )
            })}
          </div>

          {!showResult && (
            <div className="mt-6 text-center">
              <Button onClick={handleSubmit} disabled={!selectedAnswer} className="w-full">
                Submit Answer
              </Button>
            </div>
          )}

          {showResult && (
            <div className="mt-6 text-center">
              <div className={`text-lg font-semibold ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                {isCorrect ? "Correct!" : "Incorrect"}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {isCorrect ? "Great job!" : `The correct answer was: ${card.back_text}`}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
