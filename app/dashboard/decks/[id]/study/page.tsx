import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { StudySession } from "@/components/study-session"

interface StudyPageProps {
  params: Promise<{ id: string }>
}

export default async function StudyPage({ params }: StudyPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: user, error: userError } = await supabase.auth.getUser()
  if (userError || !user?.user) {
    redirect("/auth/login")
  }

  // Get deck details
  const { data: deck, error: deckError } = await supabase.from("flashcard_decks").select("*").eq("id", id).single()

  if (deckError || !deck) {
    notFound()
  }

  // Check if user owns deck or if it's public
  if (deck.user_id !== user.user.id && !deck.is_public) {
    notFound()
  }

  // Get flashcards for this deck
  const { data: flashcards, error: flashcardsError } = await supabase
    .from("flashcards")
    .select("*")
    .eq("deck_id", id)
    .order("created_at", { ascending: false })

  if (flashcardsError || !flashcards || flashcards.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Cards to Study</h1>
          <p className="text-muted-foreground mb-4">This deck doesn't have any flashcards yet.</p>
          <a href={`/dashboard/decks/${id}`} className="text-primary hover:underline">
            Go back to deck
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <StudySession deck={deck} flashcards={flashcards} userId={user.user.id} />
    </div>
  )
}
