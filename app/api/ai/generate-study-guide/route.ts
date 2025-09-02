import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { groq } from "@/lib/ai/groq-client"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { deckId, topic } = await request.json()

    // Get flashcards from the deck
    const { data: flashcards } = await supabase
      .from("flashcards")
      .select("front, back, difficulty")
      .eq("deck_id", deckId)

    const flashcardContent = flashcards?.map((card) => `Q: ${card.front}\nA: ${card.back}`).join("\n\n") || ""

    const { text } = await generateText({
      model: groq("llama-3.1-70b-versatile"),
      prompt: `Create a comprehensive study guide for the topic: ${topic}

Based on these flashcards:
${flashcardContent}

Generate a study guide that includes:
1. **Overview** - Brief introduction to the topic
2. **Key Concepts** - Main ideas and definitions
3. **Important Details** - Specific facts and information
4. **Study Tips** - How to approach learning this material
5. **Practice Questions** - Additional questions for self-testing
6. **Summary** - Key takeaways and review points

Format the guide in clear markdown with proper headings and bullet points.
Make it comprehensive but easy to follow for effective studying.`,
    })

    return NextResponse.json({ studyGuide: text })
  } catch (error) {
    console.error("Error generating study guide:", error)
    return NextResponse.json({ error: "Failed to generate study guide" }, { status: 500 })
  }
}
