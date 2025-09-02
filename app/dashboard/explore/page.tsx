"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Star, Copy, Eye } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import Link from "next/link"

interface PublicDeck {
  id: string
  title: string
  description: string
  subject: string
  card_count: number
  rating_average: number
  rating_count: number
  clone_count: number
  created_by: string
  creator_name: string
}

export default function ExplorePage() {
  const [publicDecks, setPublicDecks] = useState<PublicDeck[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("all")
  const [sortBy, setSortBy] = useState("rating")
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient()

  useEffect(() => {
    loadPublicDecks()
  }, [searchQuery, selectedSubject, sortBy])

  const loadPublicDecks = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from("flashcard_decks")
        .select(`
          id,
          title,
          description,
          subject,
          rating_average,
          rating_count,
          clone_count,
          created_at,
          profiles!flashcard_decks_user_id_fkey(full_name)
        `)
        .eq("is_public", true)

      if (searchQuery) {
        query = query.or(
          `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,subject.ilike.%${searchQuery}%`,
        )
      }

      if (selectedSubject !== "all") {
        query = query.eq("subject", selectedSubject)
      }

      // Sort options
      switch (sortBy) {
        case "rating":
          query = query.order("rating_average", { ascending: false })
          break
        case "popular":
          query = query.order("clone_count", { ascending: false })
          break
        case "recent":
          query = query.order("created_at", { ascending: false })
          break
      }

      const { data, error } = await query.limit(20)

      if (error) throw error

      // Get card counts for each deck
      const decksWithCounts = await Promise.all(
        (data || []).map(async (deck) => {
          const { count } = await supabase
            .from("flashcards")
            .select("*", { count: "exact", head: true })
            .eq("deck_id", deck.id)

          return {
            ...deck,
            card_count: count || 0,
            creator_name: deck.profiles?.full_name || "Anonymous",
          }
        }),
      )

      setPublicDecks(decksWithCounts)
    } catch (error) {
      console.error("Error loading public decks:", error)
    } finally {
      setLoading(false)
    }
  }

  const cloneDeck = async (deckId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Get original deck and its cards
      const { data: originalDeck } = await supabase.from("flashcard_decks").select("*").eq("id", deckId).single()

      const { data: originalCards } = await supabase.from("flashcards").select("*").eq("deck_id", deckId)

      if (!originalDeck) return

      // Create new deck
      const { data: newDeck, error: deckError } = await supabase
        .from("flashcard_decks")
        .insert({
          title: `${originalDeck.title} (Copy)`,
          description: originalDeck.description,
          subject: originalDeck.subject,
          user_id: user.id,
          is_public: false,
        })
        .select()
        .single()

      if (deckError) throw deckError

      // Clone cards
      if (originalCards && originalCards.length > 0) {
        const newCards = originalCards.map((card) => ({
          front: card.front,
          back: card.back,
          difficulty: card.difficulty,
          deck_id: newDeck.id,
          user_id: user.id,
        }))

        await supabase.from("flashcards").insert(newCards)
      }

      // Update clone count
      await supabase
        .from("flashcard_decks")
        .update({ clone_count: (originalDeck.clone_count || 0) + 1 })
        .eq("id", deckId)

      // Refresh the list
      loadPublicDecks()
    } catch (error) {
      console.error("Error cloning deck:", error)
    }
  }

  const subjects = [
    "all",
    "Mathematics",
    "Science",
    "History",
    "Language",
    "Programming",
    "Medicine",
    "Business",
    "Other",
  ]

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Explore Public Decks</h1>
        <p className="text-muted-foreground">Discover and clone flashcard decks created by the community</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search decks by title, description, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((subject) => (
              <SelectItem key={subject} value={subject}>
                {subject === "all" ? "All Subjects" : subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="popular">Most Cloned</SelectItem>
            <SelectItem value="recent">Most Recent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Deck Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publicDecks.map((deck) => (
            <Card key={deck.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{deck.title}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {deck.description || "No description provided"}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {deck.subject && (
                    <Badge variant="secondary" className="text-xs">
                      {deck.subject}
                    </Badge>
                  )}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{deck.rating_average?.toFixed(1) || "0.0"}</span>
                    <span>({deck.rating_count || 0})</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>{deck.card_count} cards</span>
                  <span>by {deck.creator_name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Copy className="h-3 w-3" />
                    <span>{deck.clone_count || 0} clones</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent" asChild>
                    <Link href={`/dashboard/explore/${deck.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Link>
                  </Button>
                  <Button size="sm" className="flex-1" onClick={() => cloneDeck(deck.id)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Clone
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && publicDecks.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="mb-2">No decks found</CardTitle>
            <CardDescription>Try adjusting your search criteria or browse different subjects</CardDescription>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
