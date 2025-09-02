import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { groq } from "@/lib/ai/groq-client"
import { z } from "zod"
import { createServerClient } from "@/lib/supabase/server"

const flashcardSchema = z.object({
  flashcards: z.array(
    z.object({
      front: z.string(),
      back: z.string(),
      difficulty: z.enum(["easy", "medium", "hard"]),
      tags: z.array(z.string()).optional(),
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

    const { content, subject, count = 10 } = await request.json()

    const { object } = await generateObject({
      model: groq("llama-3.1-70b-versatile"),
      schema: flashcardSchema,
      prompt: `Generate ${count} flashcards from the following content about ${subject}:

${content}

Create flashcards that:
- Test key concepts and important details
- Have clear, concise questions on the front
- Provide comprehensive answers on the back
- Include appropriate difficulty levels (easy, medium, hard)
- Add relevant tags for categorization
- Cover different aspects of the material (definitions, examples, applications)

Make sure the flashcards are educational and help with active recall.`,
    })

    return NextResponse.json(object)
  } catch (error) {
    console.error("Error generating flashcards:", error)
    return NextResponse.json({ error: "Failed to generate flashcards" }, { status: 500 })
  }
}
