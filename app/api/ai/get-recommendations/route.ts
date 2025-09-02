import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { groq } from "@/lib/ai/groq-client"
import { z } from "zod"
import { createServerClient } from "@/lib/supabase/server"

const recommendationSchema = z.object({
  recommendations: z.array(
    z.object({
      type: z.enum(["focus_area", "study_method", "difficulty_adjustment", "time_management"]),
      title: z.string(),
      description: z.string(),
      priority: z.enum(["high", "medium", "low"]),
    }),
  ),
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

    // Get user's recent study sessions
    const { data: sessions } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)

    const sessionData =
      sessions?.map((session) => ({
        accuracy: session.accuracy,
        duration: session.duration_minutes,
        cards_studied: session.cards_studied,
        difficulty_distribution: session.difficulty_distribution,
      })) || []

    const { object } = await generateObject({
      model: groq("llama-3.1-70b-versatile"),
      schema: recommendationSchema,
      prompt: `Analyze this student's study performance and provide personalized recommendations:

Recent Study Sessions:
${JSON.stringify(sessionData, null, 2)}

Based on their performance patterns, generate 3-5 specific recommendations that could help them:
- Improve their study effectiveness
- Focus on areas that need attention
- Optimize their study methods
- Better manage their time

Each recommendation should be actionable and tailored to their performance data.
Consider accuracy rates, study duration, and difficulty patterns.`,
    })

    return NextResponse.json(object)
  } catch (error) {
    console.error("Error generating recommendations:", error)
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 })
  }
}
