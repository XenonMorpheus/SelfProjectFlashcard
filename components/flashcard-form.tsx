"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, ImageIcon } from "lucide-react"
import Link from "next/link"

interface FlashcardFormProps {
  deckId: string
  initialData?: {
    id: string
    front_text: string
    back_text: string
    front_image_url: string | null
    back_image_url: string | null
    difficulty_level: number
  }
}

export function FlashcardForm({ deckId, initialData }: FlashcardFormProps) {
  const [frontText, setFrontText] = useState(initialData?.front_text || "")
  const [backText, setBackText] = useState(initialData?.back_text || "")
  const [difficultyLevel, setDifficultyLevel] = useState(initialData?.difficulty_level?.toString() || "1")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("Not authenticated")

      const cardData = {
        deck_id: deckId,
        user_id: user.user.id,
        front_text: frontText,
        back_text: backText,
        difficulty_level: Number.parseInt(difficultyLevel),
      }

      if (initialData) {
        // Update existing card
        const { error } = await supabase.from("flashcards").update(cardData).eq("id", initialData.id)
        if (error) throw error
      } else {
        // Create new card
        const { error } = await supabase.from("flashcards").insert(cardData)
        if (error) throw error
      }

      router.push(`/dashboard/decks/${deckId}`)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/dashboard/decks/${deckId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <CardTitle>{initialData ? "Edit Flashcard" : "Create New Flashcard"}</CardTitle>
            <CardDescription>
              {initialData ? "Update your flashcard content" : "Add a new card to your deck"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="front">Front Side (Question) *</Label>
            <Textarea
              id="front"
              placeholder="Enter the question or prompt..."
              value={frontText}
              onChange={(e) => setFrontText(e.target.value)}
              required
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="back">Back Side (Answer) *</Label>
            <Textarea
              id="back"
              placeholder="Enter the answer or explanation..."
              value={backText}
              onChange={(e) => setBackText(e.target.value)}
              required
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty Level</Label>
            <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Very Easy</SelectItem>
                <SelectItem value="2">2 - Easy</SelectItem>
                <SelectItem value="3">3 - Medium</SelectItem>
                <SelectItem value="4">4 - Hard</SelectItem>
                <SelectItem value="5">5 - Very Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Image support coming soon with AI integration
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Saving..." : initialData ? "Update Card" : "Create Card"}
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href={`/dashboard/decks/${deckId}`}>Cancel</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
