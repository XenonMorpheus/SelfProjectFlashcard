"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, Brain, Target, HelpCircle } from "lucide-react"

export default function AITutorPage() {
  const params = useParams()
  const deckId = params.id as string

  const [isLoading, setIsLoading] = useState(false)
  const [adaptivePlan, setAdaptivePlan] = useState<any>(null)
  const [explanation, setExplanation] = useState("")
  const [quiz, setQuiz] = useState<any>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<string[]>([])
  const [showResults, setShowResults] = useState(false)

  const [conceptInput, setConceptInput] = useState("")
  const [contextInput, setContextInput] = useState("")
  const [difficultyLevel, setDifficultyLevel] = useState("medium")
  const [quizSettings, setQuizSettings] = useState({
    questionCount: 10,
    questionTypes: ["multiple_choice"],
    difficulty: "medium",
  })

  const generateAdaptivePlan = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/ai/adaptive-learning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckId }),
      })

      const data = await response.json()
      if (data.recommendations) {
        setAdaptivePlan(data)
      }
    } catch (error) {
      console.error("Error generating adaptive plan:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const explainConcept = async () => {
    if (!conceptInput.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/ai/explain-concept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept: conceptInput,
          context: contextInput,
          difficulty: difficultyLevel,
        }),
      })

      const data = await response.json()
      if (data.explanation) {
        setExplanation(data.explanation)
      }
    } catch (error) {
      console.error("Error explaining concept:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateQuiz = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/ai/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckId, ...quizSettings }),
      })

      const data = await response.json()
      if (data.questions) {
        setQuiz(data)
        setCurrentQuestionIndex(0)
        setUserAnswers([])
        setShowResults(false)
      }
    } catch (error) {
      console.error("Error generating quiz:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const submitQuizAnswer = (answer: string) => {
    const newAnswers = [...userAnswers]
    newAnswers[currentQuestionIndex] = answer
    setUserAnswers(newAnswers)

    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      setShowResults(true)
    }
  }

  const calculateQuizScore = () => {
    if (!quiz || !userAnswers.length) return 0
    const correct = userAnswers.filter((answer, index) => answer === quiz.questions[index].correct_answer).length
    return Math.round((correct / quiz.questions.length) * 100)
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Tutor</h1>
        <p className="text-muted-foreground">
          Get personalized learning assistance with adaptive plans, concept explanations, and intelligent quizzes.
        </p>
      </div>

      <Tabs defaultValue="adaptive" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="adaptive" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Adaptive Learning
          </TabsTrigger>
          <TabsTrigger value="explain" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Concept Tutor
          </TabsTrigger>
          <TabsTrigger value="quiz" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Smart Quiz
          </TabsTrigger>
        </TabsList>

        <TabsContent value="adaptive" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Adaptive Learning Plan</CardTitle>
              <CardDescription>
                Get a personalized study plan based on your performance patterns and learning progress.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={generateAdaptivePlan} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Your Performance...
                  </>
                ) : (
                  <>
                    <Target className="mr-2 h-4 w-4" />
                    Generate Adaptive Plan
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {adaptivePlan && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Personalized Study Strategy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Focus Areas</h4>
                    <div className="flex flex-wrap gap-2">
                      {adaptivePlan.overall_strategy.focus_areas.map((area: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Recommended Session Length</p>
                      <p className="text-2xl font-bold">
                        {adaptivePlan.overall_strategy.recommended_session_length} min
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Difficulty Distribution</p>
                      <div className="text-sm">
                        Easy: {adaptivePlan.overall_strategy.difficulty_distribution.easy}% • Medium:{" "}
                        {adaptivePlan.overall_strategy.difficulty_distribution.medium}% • Hard:{" "}
                        {adaptivePlan.overall_strategy.difficulty_distribution.hard}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Card-Specific Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {adaptivePlan.recommendations.slice(0, 5).map((rec: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge
                            variant={
                              rec.difficulty_adjustment === "increase"
                                ? "destructive"
                                : rec.difficulty_adjustment === "decrease"
                                  ? "default"
                                  : "secondary"
                            }
                          >
                            {rec.difficulty_adjustment} difficulty
                          </Badge>
                          <span className="text-sm text-muted-foreground">Next review: {rec.next_review_hours}h</span>
                        </div>
                        <p className="font-medium mb-1">{rec.focus_reason}</p>
                        <p className="text-sm text-muted-foreground">{rec.study_tip}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="explain" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Concept Tutor</CardTitle>
              <CardDescription>Get detailed explanations for any concept you're struggling with.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="concept">Concept to Explain</Label>
                <Input
                  id="concept"
                  placeholder="e.g., Photosynthesis, Quadratic Equations, Machine Learning"
                  value={conceptInput}
                  onChange={(e) => setConceptInput(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="context">Context (Optional)</Label>
                <Textarea
                  id="context"
                  placeholder="Provide any additional context about what you're studying or where you're confused"
                  value={contextInput}
                  onChange={(e) => setContextInput(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="difficulty">Your Level</Label>
                <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Beginner</SelectItem>
                    <SelectItem value="medium">Intermediate</SelectItem>
                    <SelectItem value="hard">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={explainConcept} disabled={isLoading || !conceptInput.trim()} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Explanation...
                  </>
                ) : (
                  <>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Explain This Concept
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {explanation && (
            <Card>
              <CardHeader>
                <CardTitle>AI Explanation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans">{explanation}</pre>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="quiz" className="space-y-6">
          {!quiz ? (
            <Card>
              <CardHeader>
                <CardTitle>Smart Quiz Generator</CardTitle>
                <CardDescription>
                  Generate intelligent quizzes with various question types based on your flashcards.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="question-count">Number of Questions</Label>
                    <Select
                      value={quizSettings.questionCount.toString()}
                      onValueChange={(value) =>
                        setQuizSettings({ ...quizSettings, questionCount: Number.parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 Questions</SelectItem>
                        <SelectItem value="10">10 Questions</SelectItem>
                        <SelectItem value="15">15 Questions</SelectItem>
                        <SelectItem value="20">20 Questions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="quiz-difficulty">Difficulty Level</Label>
                    <Select
                      value={quizSettings.difficulty}
                      onValueChange={(value) => setQuizSettings({ ...quizSettings, difficulty: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={generateQuiz} disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Smart Quiz...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Generate Quiz
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : showResults ? (
            <Card>
              <CardHeader>
                <CardTitle>Quiz Results</CardTitle>
                <CardDescription>Your performance on the AI-generated quiz</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold mb-2">{calculateQuizScore()}%</div>
                  <p className="text-muted-foreground">
                    {userAnswers.filter((answer, index) => answer === quiz.questions[index].correct_answer).length} out
                    of {quiz.questions.length} correct
                  </p>
                </div>

                <div className="space-y-4">
                  {quiz.questions.map((question: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={userAnswers[index] === question.correct_answer ? "default" : "destructive"}>
                          {userAnswers[index] === question.correct_answer ? "Correct" : "Incorrect"}
                        </Badge>
                        <Badge variant="outline">{question.difficulty}</Badge>
                      </div>
                      <p className="font-medium mb-2">{question.question}</p>
                      <p className="text-sm text-muted-foreground mb-2">
                        Your answer: {userAnswers[index]} | Correct: {question.correct_answer}
                      </p>
                      <p className="text-sm">{question.explanation}</p>
                    </div>
                  ))}
                </div>

                <Button onClick={() => setQuiz(null)} className="w-full mt-6">
                  Generate New Quiz
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>
                  Question {currentQuestionIndex + 1} of {quiz.questions.length}
                </CardTitle>
                <CardDescription>{quiz.questions[currentQuestionIndex].topic}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-lg font-medium">{quiz.questions[currentQuestionIndex].question}</p>

                  {quiz.questions[currentQuestionIndex].type === "multiple_choice" && (
                    <div className="space-y-2">
                      {quiz.questions[currentQuestionIndex].options?.map((option: string, index: number) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="w-full justify-start text-left h-auto p-4 bg-transparent"
                          onClick={() => submitQuizAnswer(option)}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  )}

                  {quiz.questions[currentQuestionIndex].type === "true_false" && (
                    <div className="flex gap-4">
                      <Button
                        variant="outline"
                        className="flex-1 bg-transparent"
                        onClick={() => submitQuizAnswer("True")}
                      >
                        True
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 bg-transparent"
                        onClick={() => submitQuizAnswer("False")}
                      >
                        False
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
