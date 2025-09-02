import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Play, Edit, Trash2 } from "lucide-react"
import Link from "next/link"

interface Deck {
  id: string
  title: string
  description: string | null
  subject: string | null
  created_at: string
  updated_at: string
}

interface DeckGridProps {
  decks: Deck[]
}

export function DeckGrid({ decks }: DeckGridProps) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {decks.map((deck) => (
        <Card key={deck.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg line-clamp-2">{deck.title}</CardTitle>
                {deck.subject && (
                  <div className="text-xs text-muted-foreground mt-1 bg-muted px-2 py-1 rounded-md inline-block">
                    {deck.subject}
                  </div>
                )}
              </div>
              <BookOpen className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
            </div>
            {deck.description && <CardDescription className="line-clamp-2">{deck.description}</CardDescription>}
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" className="flex-1">
                <Link href={`/dashboard/decks/${deck.id}/study`}>
                  <Play className="h-4 w-4 mr-2" />
                  Study
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={`/dashboard/decks/${deck.id}/edit`}>
                  <Edit className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="sm" variant="outline">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Updated {new Date(deck.updated_at).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
