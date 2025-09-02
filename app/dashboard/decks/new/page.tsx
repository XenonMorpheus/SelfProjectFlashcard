import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DeckForm } from "@/components/deck-form"

export default async function NewDeckPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Create New Flashcard Deck</h1>
            <p className="text-muted-foreground">
              Start building your personalized study collection with AI-powered flashcards
            </p>
          </div>
          <DeckForm />
        </div>
      </div>
    </div>
  )
}
