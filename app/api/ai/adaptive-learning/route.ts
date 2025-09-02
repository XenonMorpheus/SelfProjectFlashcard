import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { groq } from "@/lib/ai/groq-client"
import { z } from "zod"
import { createServerClient } from "@/lib/supabase/server"

const adaptivePlanSchema = z.object({
  recommendations: z.array(
    z.object({
      card_id: z.string(),
      next_review_hours: z.number(),
      difficulty_adjustment: z.enum(["increase", "decrease", "maintain"]),
      focus_reason: z.string(),
      study_tip: z.string(),
    }),
  ),
  overall_strategy: z.object({
    focus_areas: z.array(z.string()),
    recommended_session_length: z.number(),
    difficulty_distribution: z.object({
      easy: z.number(),
      medium: z.number(),
      hard: z.number(),
    }),
  }),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { deckId } = await request.json()

    // Get recent study performance for this deck
    const { data: sessions } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("deck_id", deckId)
      .order("created_at", { ascending: false })
      .limit(10)

    // Get flashcards with their performance data
    const { data: flashcards } = await supabase
      .from("flashcards")
      .select("*")
      .eq("deck_id", deckId)
      .eq("user_id", user.id)

    const performanceData =
      sessions?.map((session) => ({
        accuracy: session.accuracy,
        duration: session.duration_minutes,
        cards_studied: session.cards_studied,
        difficulty_distribution: session.difficulty_distribution,
        created_at: session.created_at,
      })) || []

    const { object } = await generateObject({
      model: groq("llama-3.1-70b-versatile"),
      schema: adaptivePlanSchema,
      prompt: `Analyze this student's performance and create an adaptive learning plan:

Flashcards: ${JSON.stringify(flashcards?.slice(0, 20), null, 2)}

Recent Performance:
${JSON.stringify(performanceData, null, 2)}

Create a personalized adaptive learning plan that:
1. Identifies which cards need more/less frequent review based on performance
2. Adjusts difficulty levels appropriately
3. Provides specific study tips for challenging concepts
4. Recommends optimal review intervals using spaced repetition principles
5. Suggests overall study strategy improvements

Consider:
- Cards with low accuracy need more frequent review
- Cards consistently answered correctly can have longer intervals
- Difficulty should be adjusted based on response patterns
- Provide actionable study tips for improvement`,
    })

    return NextResponse.json(object)
  } catch (error) {
    console.error("Error generating adaptive plan:", error)
    return NextResponse.json({ error: "Failed to generate adaptive plan" }, { status: 500 })
  }
}
