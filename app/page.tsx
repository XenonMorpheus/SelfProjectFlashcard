import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Brain, Zap, Users, BarChart3 } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-svh">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">AI Study Platform</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost">
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-6 text-balance">Learn Smarter with AI-Powered Flashcards</h2>
            <p className="text-xl text-muted-foreground mb-8 text-pretty">
              Transform your study materials into intelligent flashcards, get personalized practice tests, and track
              your progress with advanced analytics.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/auth/sign-up">Start Learning Free</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/auth/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-muted/50 py-16">
          <div className="container mx-auto px-4">
            <h3 className="text-3xl font-bold text-center mb-12">Powerful Features</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <Zap className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>AI-Generated Cards</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Upload your notes and let AI create comprehensive flashcards automatically
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Brain className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Adaptive Learning</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Smart algorithms adjust difficulty based on your performance and learning patterns
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <BarChart3 className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Progress Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Detailed insights into your learning progress with personalized recommendations
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Collaborative Study</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Share decks, join study groups, and compete with friends on leaderboards
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 AI Study Platform. Built with Next.js and Supabase.</p>
        </div>
      </footer>
    </div>
  )
}
