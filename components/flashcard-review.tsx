"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RotateCcw, Eye, EyeOff } from "lucide-react"

interface Flashcard {
  id: string
  front_text: string
  back_text: string
  front_image_url: string | null
  back_image_url: string | null
  difficulty_level: number
}

interface FlashcardReviewProps {
  card: Flashcard
  onResult: (result: { difficulty_rating: number; is_correct: boolean }) => void
  cardNumber: number
  totalCards: number
  isAdaptive?: boolean
}

export function FlashcardReview({ card, onResult, cardNumber, totalCards, isAdaptive = false }: FlashcardReviewProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  const handleRating = (rating: number) => {
    // In flashcard mode, we consider ratings 4-5 as "correct"
    const isCorrect = rating >= 4
    onResult({ difficulty_rating: rating, is_correct: isCorrect })
    setIsFlipped(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <Badge variant="outline" className="mb-2">
          Card {cardNumber} of {totalCards}
        </Badge>
        <div className="text-sm text-muted-foreground">
          {isAdaptive ? "Adaptive Learning Mode" : "Review Mode"} • Difficulty Level {card.difficulty_level}
        </div>
      </div>

      <Card className="min-h-[400px] cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
        <CardContent className="flex items-center justify-center p-8 min-h-[400px]">
          <div className="text-center w-full">
            {!isFlipped ? (
              <div>
                <div className="text-lg font-medium mb-4 text-balance">{card.front_text}</div>
                {card.front_image_url && (
                  <img
                    src={card.front_image_url || "/placeholder.svg"}
                    alt="Front side"
                    className="max-w-full h-auto mx-auto mb-4 rounded-lg"
                  />
                )}
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  Click to reveal answer
                </div>
              </div>
            ) : (
              <div>
                <div className="text-lg font-medium mb-4 text-balance">{card.back_text}</div>
                {card.back_image_url && (
                  <img
                    src={card.back_image_url || "/placeholder.svg"}
                    alt="Back side"
                    className="max-w-full h-auto mx-auto mb-4 rounded-lg"
                  />
                )}
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <EyeOff className="h-4 w-4" />
                  Click to hide answer
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 text-center">
        <Button variant="outline" size="sm" onClick={() => setIsFlipped(!isFlipped)} className="mb-4">
          <RotateCcw className="h-4 w-4 mr-2" />
          {isFlipped ? "Show Question" : "Show Answer"}
        </Button>
      </div>

      {isFlipped && (
        <div className="mt-6">
          <p className="text-center text-sm text-muted-foreground mb-4">How well did you know this?</p>
          <div className="grid grid-cols-5 gap-2">
            <Button variant="outline" size="sm" onClick={() => handleRating(1)} className="text-red-600">
              1<br />
              <span className="text-xs">Again</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleRating(2)} className="text-orange-600">
              2<br />
              <span className="text-xs">Hard</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleRating(3)} className="text-yellow-600">
              3<br />
              <span className="text-xs">Good</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleRating(4)} className="text-blue-600">
              4<br />
              <span className="text-xs">Easy</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleRating(5)} className="text-green-600">
              5<br />
              <span className="text-xs">Perfect</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
