import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { groq } from "@/lib/ai/groq-client"
import { z } from "zod"
import { createServerClient } from "@/lib/supabase/server"

const quizSchema = z.object({
  questions: z.array(
    z.object({
      type: z.enum(["multiple_choice", "true_false", "fill_blank", "short_answer"]),
      question: z.string(),
      options: z.array(z.string()).optional(),
      correct_answer: z.string(),
      explanation: z.string(),
      difficulty: z.enum(["easy", "medium", "hard"]),
      topic: z.string(),
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

    const {
      deckId,
      questionCount = 10,
      questionTypes = ["multiple_choice"],
      difficulty = "medium",
    } = await request.json()

    // Get flashcards from the deck
    const { data: flashcards } = await supabase
      .from("flashcards")
      .select("front, back, difficulty")
      .eq("deck_id", deckId)
      .eq("user_id", user.id)

    const flashcardContent =
      flashcards?.map((card) => `Q: ${card.front}\nA: ${card.back}\nDifficulty: ${card.difficulty}`).join("\n\n") || ""

    const { object } = await generateObject({
      model: groq("llama-3.1-70b-versatile"),
      schema: quizSchema,
      prompt: `Create a comprehensive quiz based on these flashcards:

${flashcardContent}

Generate ${questionCount} questions with these specifications:
- Question types: ${questionTypes.join(", ")}
- Overall difficulty: ${difficulty}
- Mix different question formats for variety

For each question:
1. **Multiple Choice**: 4 options with 1 correct answer
2. **True/False**: Clear statement that can be definitively true or false
3. **Fill in the Blank**: Remove key terms with clear context clues
4. **Short Answer**: Require 1-2 sentence responses

Requirements:
- Test understanding, not just memorization
- Include detailed explanations for each answer
- Vary difficulty levels appropriately
- Cover different topics from the flashcards
- Make distractors (wrong answers) plausible but clearly incorrect
- Ensure questions are clear and unambiguous

Focus on:
- Key concepts and definitions
- Relationships between ideas
- Application of knowledge
- Critical thinking about the material`,
    })

    return NextResponse.json(object)
  } catch (error) {
    console.error("Error generating quiz:", error)
    return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 })
  }
}
