"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, Sparkles, BookOpen, Target } from "lucide-react"

export default function AIToolsPage() {
  const params = useParams()
  const deckId = params.id as string

  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedFlashcards, setGeneratedFlashcards] = useState<any[]>([])
  const [studyGuide, setStudyGuide] = useState("")
  const [recommendations, setRecommendations] = useState<any[]>([])

  const [content, setContent] = useState("")
  const [subject, setSubject] = useState("")
  const [cardCount, setCardCount] = useState(10)

  const generateFlashcards = async () => {
    if (!content.trim() || !subject.trim()) return

    setIsGenerating(true)
    try {
      const response = await fetch("/api/ai/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, subject, count: cardCount }),
      })

      const data = await response.json()
      if (data.flashcards) {
        setGeneratedFlashcards(data.flashcards)
      }
    } catch (error) {
      console.error("Error generating flashcards:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateStudyGuide = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch("/api/ai/generate-study-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckId, topic: subject }),
      })

      const data = await response.json()
      if (data.studyGuide) {
        setStudyGuide(data.studyGuide)
      }
    } catch (error) {
      console.error("Error generating study guide:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const getRecommendations = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch("/api/ai/get-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      const data = await response.json()
      if (data.recommendations) {
        setRecommendations(data.recommendations)
      }
    } catch (error) {
      console.error("Error getting recommendations:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Study Tools</h1>
        <p className="text-muted-foreground">
          Enhance your learning with AI-powered flashcard generation, study guides, and personalized recommendations.
        </p>
      </div>

      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Generate Cards
          </TabsTrigger>
          <TabsTrigger value="study-guide" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Study Guide
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Flashcards from Content</CardTitle>
              <CardDescription>
                Paste your notes, textbook content, or any study material to automatically generate flashcards.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subject">Subject/Topic</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., Biology, History, Programming"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="count">Number of Cards</Label>
                  <Input
                    id="count"
                    type="number"
                    min="5"
                    max="50"
                    value={cardCount}
                    onChange={(e) => setCardCount(Number.parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="content">Study Content</Label>
                <Textarea
                  id="content"
                  placeholder="Paste your notes, textbook content, or study material here..."
                  className="min-h-[200px]"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              <Button
                onClick={generateFlashcards}
                disabled={isGenerating || !content.trim() || !subject.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Flashcards...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Flashcards
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {generatedFlashcards.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Flashcards ({generatedFlashcards.length})</CardTitle>
                <CardDescription>Review and add these AI-generated flashcards to your deck.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {generatedFlashcards.map((card, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge
                          variant={
                            card.difficulty === "easy"
                              ? "secondary"
                              : card.difficulty === "medium"
                                ? "default"
                                : "destructive"
                          }
                        >
                          {card.difficulty}
                        </Badge>
                        {card.tags && (
                          <div className="flex gap-1">
                            {card.tags.map((tag: string, tagIndex: number) => (
                              <Badge key={tagIndex} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="font-medium text-sm text-muted-foreground">Front:</p>
                          <p>{card.front}</p>
                        </div>
                        <div>
                          <p className="font-medium text-sm text-muted-foreground">Back:</p>
                          <p>{card.back}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="study-guide" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Study Guide Generator</CardTitle>
              <CardDescription>
                Generate a comprehensive study guide based on your flashcards and topic.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="guide-topic">Topic</Label>
                <Input
                  id="guide-topic"
                  placeholder="Enter the main topic for your study guide"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <Button onClick={generateStudyGuide} disabled={isGenerating || !subject.trim()} className="w-full">
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Study Guide...
                  </>
                ) : (
                  <>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Generate Study Guide
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {studyGuide && (
            <Card>
              <CardHeader>
                <CardTitle>Your AI-Generated Study Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans">{studyGuide}</pre>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personalized Study Recommendations</CardTitle>
              <CardDescription>
                Get AI-powered insights and recommendations based on your study performance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={getRecommendations} disabled={isGenerating} className="w-full">
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Performance...
                  </>
                ) : (
                  <>
                    <Target className="mr-2 h-4 w-4" />
                    Get Recommendations
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {recommendations.length > 0 && (
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{rec.title}</CardTitle>
                      <Badge
                        variant={
                          rec.priority === "high" ? "destructive" : rec.priority === "medium" ? "default" : "secondary"
                        }
                      >
                        {rec.priority} priority
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{rec.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
