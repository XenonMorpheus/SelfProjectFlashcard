import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FlashcardForm } from "@/components/flashcard-form"

interface NewCardPageProps {
  params: Promise<{ id: string }>
}

export default async function NewCardPage({ params }: NewCardPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: user, error: userError } = await supabase.auth.getUser()
  if (userError || !user?.user) {
    redirect("/auth/login")
  }

  // Verify deck exists and belongs to user
  const { data: deck, error: deckError } = await supabase
    .from("flashcard_decks")
    .select("id, title")
    .eq("id", id)
    .eq("user_id", user.user.id)
    .single()

  if (deckError || !deck) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Add New Flashcard</h1>
            <p className="text-muted-foreground">Create a new flashcard for "{deck.title}"</p>
          </div>
          <FlashcardForm deckId={id} />
        </div>
      </div>
    </div>
  )
}
