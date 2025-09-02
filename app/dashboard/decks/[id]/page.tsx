import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Plus, Play, Settings, Sparkles, Brain } from "lucide-react"
import Link from "next/link"
import { FlashcardList } from "@/components/flashcard-list"

interface DeckPageProps {
  params: Promise<{ id: string }>
}

export default async function DeckPage({ params }: DeckPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: user, error: userError } = await supabase.auth.getUser()
  if (userError || !user?.user) {
    redirect("/auth/login")
  }

  // Get deck details
  const { data: deck, error: deckError } = await supabase
    .from("flashcard_decks")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.user.id)
    .single()

  if (deckError || !deck) {
    notFound()
  }

  // Get flashcards for this deck
  const { data: flashcards } = await supabase
    .from("flashcards")
    .select("*")
    .eq("deck_id", id)
    .eq("user_id", user.user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{deck.title}</h1>
            {deck.description && <p className="text-muted-foreground mt-1">{deck.description}</p>}
            {deck.subject && (
              <div className="text-xs text-muted-foreground mt-2 bg-muted px-2 py-1 rounded-md inline-block">
                {deck.subject}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link href={`/dashboard/decks/${id}/study`}>
                <Play className="h-4 w-4 mr-2" />
                Study Now
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/dashboard/decks/${id}/ai-tools`}>
                <Sparkles className="h-4 w-4 mr-2" />
                AI Tools
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/dashboard/decks/${id}/ai-tutor`}>
                <Brain className="h-4 w-4 mr-2" />
                AI Tutor
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/dashboard/decks/${id}/edit`}>
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{flashcards?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Total Cards</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Mastered</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Study Sessions</p>
            </CardContent>
          </Card>
        </div>

        {/* Flashcards */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Flashcards</h2>
            <Button asChild>
              <Link href={`/dashboard/decks/${id}/cards/new`}>
                <Plus className="h-4 w-4 mr-2" />
                Add Card
              </Link>
            </Button>
          </div>

          {flashcards && flashcards.length > 0 ? (
            <FlashcardList flashcards={flashcards} deckId={id} />
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <CardTitle className="mb-2">No flashcards yet</CardTitle>
                <CardDescription className="mb-4">Add your first flashcard to start studying</CardDescription>
                <Button asChild>
                  <Link href={`/dashboard/decks/${id}/cards/new`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Card
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
