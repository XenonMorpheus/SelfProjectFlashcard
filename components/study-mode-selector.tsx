"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain, HelpCircle, Zap, Clock, Target, BookOpen } from "lucide-react"
import type { StudyMode } from "@/components/study-session"

interface StudyModeSelectorProps {
  onSelectMode: (mode: StudyMode) => void
  cardCount: number
}

export function StudyModeSelector({ onSelectMode, cardCount }: StudyModeSelectorProps) {
  const estimatedTimes = {
    flashcard: Math.ceil(cardCount * 0.5),
    quiz: Math.ceil(cardCount * 0.75),
    adaptive: Math.ceil(cardCount * 1),
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onSelectMode("flashcard")}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-blue-500" />
            <div>
              <CardTitle>Flashcard Review</CardTitle>
              <CardDescription>Classic card flipping</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Review cards at your own pace. Flip to see answers and rate your confidence.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />~{estimatedTimes.flashcard} min
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              Self-paced
            </div>
          </div>
          <Button className="w-full" onClick={() => onSelectMode("flashcard")}>
            Start Review
          </Button>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onSelectMode("quiz")}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <HelpCircle className="h-8 w-8 text-green-500" />
            <div>
              <CardTitle>Quiz Mode</CardTitle>
              <CardDescription>Multiple choice testing</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Test your knowledge with multiple choice questions generated from your cards.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />~{estimatedTimes.quiz} min
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              Accuracy focused
            </div>
          </div>
          <Button className="w-full" onClick={() => onSelectMode("quiz")}>
            Start Quiz
          </Button>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onSelectMode("adaptive")}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Brain className="h-8 w-8 text-purple-500" />
            <div>
              <CardTitle>Adaptive Study</CardTitle>
              <CardDescription>AI-powered learning</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Smart algorithm adjusts difficulty based on your performance and focuses on weak areas.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />~{estimatedTimes.adaptive} min
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Optimized
            </div>
          </div>
          <Button className="w-full" onClick={() => onSelectMode("adaptive")}>
            Start Adaptive
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
