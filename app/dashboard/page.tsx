import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, BookOpen, Brain, TrendingUp, BarChart3 } from "lucide-react"
import Link from "next/link"
import { DeckGrid } from "@/components/deck-grid"
import { Suspense } from "react"

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-muted rounded" />
            <div className="h-6 w-48 bg-muted rounded" />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-9 w-24 bg-muted rounded" />
            <div className="h-9 w-24 bg-muted rounded" />
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
        <div className="h-64 bg-muted rounded-lg" />
      </main>
    </div>
  )
}

async function DashboardContent() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const [decksResult, sessionsResult] = await Promise.all([
    supabase
      .from("flashcard_decks")
      .select("*")
      .eq("user_id", data.user.id)
      .order("updated_at", { ascending: false })
      .limit(6), // Limit for better performance
    supabase.from("study_sessions").select("*", { count: "exact", head: true }).eq("user_id", data.user.id),
  ])

  const decks = decksResult.data
  const sessionsCount = sessionsResult.count

  return (
    <div className="min-h-screen bg-background animate-in fade-in duration-500">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">AI Study Platform</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">Welcome back!</span>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/analytics">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/dashboard/decks/new">
                <Plus className="h-4 w-4 mr-2" />
                New Deck
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Decks</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{decks?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Flashcard collections</p>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Study Sessions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessionsCount || 0}</div>
              <p className="text-xs text-muted-foreground">Practice sessions completed</p>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Generated</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Cards created by AI</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Decks */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Your Flashcard Decks</h2>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/decks">View All</Link>
            </Button>
          </div>

          {decks && decks.length > 0 ? (
            <DeckGrid decks={decks} />
          ) : (
            <Card className="text-center py-12 transition-all duration-200 hover:shadow-md">
              <CardContent>
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <CardTitle className="mb-2">No flashcard decks yet</CardTitle>
                <CardDescription className="mb-4">
                  Create your first deck to start studying with AI-powered flashcards
                </CardDescription>
                <Button asChild>
                  <Link href="/dashboard/decks/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Deck
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}
