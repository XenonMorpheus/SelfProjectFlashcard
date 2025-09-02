import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, ImageIcon } from "lucide-react"
import Link from "next/link"

interface Flashcard {
  id: string
  front_text: string
  back_text: string
  front_image_url: string | null
  back_image_url: string | null
  difficulty_level: number
  created_at: string
}

interface FlashcardListProps {
  flashcards: Flashcard[]
  deckId: string
}

export function FlashcardList({ flashcards, deckId }: FlashcardListProps) {
  return (
    <div className="space-y-4">
      {flashcards.map((card) => (
        <Card key={card.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg line-clamp-2">{card.front_text}</CardTitle>
                <CardDescription className="line-clamp-2 mt-2">{card.back_text}</CardDescription>
              </div>
              <div className="flex items-center gap-2 ml-4">
                {(card.front_image_url || card.back_image_url) && (
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                )}
                <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  Level {card.difficulty_level}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Created {new Date(card.created_at).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/dashboard/decks/${deckId}/cards/${card.id}/edit`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="sm" variant="outline">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
