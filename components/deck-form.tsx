"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

const subjects = [
  "Mathematics",
  "Science",
  "History",
  "Literature",
  "Languages",
  "Computer Science",
  "Medicine",
  "Business",
  "Art",
  "Music",
  "Other",
]

interface DeckFormProps {
  initialData?: {
    id: string
    title: string
    description: string | null
    subject: string | null
    is_public: boolean
  }
}

export function DeckForm({ initialData }: DeckFormProps) {
  const [title, setTitle] = useState(initialData?.title || "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [subject, setSubject] = useState(initialData?.subject || "")
  const [isPublic, setIsPublic] = useState(initialData?.is_public || false)
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

      const deckData = {
        title,
        description: description || null,
        subject: subject || null,
        is_public: isPublic,
        user_id: user.user.id,
      }

      if (initialData) {
        // Update existing deck
        const { error } = await supabase.from("flashcard_decks").update(deckData).eq("id", initialData.id)
        if (error) throw error
        router.push(`/dashboard/decks/${initialData.id}`)
      } else {
        // Create new deck
        const { data, error } = await supabase.from("flashcard_decks").insert(deckData).select().single()
        if (error) throw error
        router.push(`/dashboard/decks/${data.id}`)
      }
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
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <CardTitle>{initialData ? "Edit Deck" : "Create New Deck"}</CardTitle>
            <CardDescription>
              {initialData ? "Update your flashcard deck details" : "Set up your new flashcard collection"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Deck Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Spanish Vocabulary, Biology Chapter 5"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of what this deck covers..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subj) => (
                  <SelectItem key={subj} value={subj}>
                    {subj}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="public" checked={isPublic} onCheckedChange={setIsPublic} />
            <Label htmlFor="public">Make this deck public</Label>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Saving..." : initialData ? "Update Deck" : "Create Deck"}
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/dashboard">Cancel</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
