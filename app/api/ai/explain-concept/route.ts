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

    const { concept, context, difficulty = "medium" } = await request.json()

    const { text } = await generateText({
      model: groq("llama-3.1-70b-versatile"),
      prompt: `You are an expert AI tutor. Explain the following concept in a clear, engaging way:

Concept: ${concept}
Context: ${context || "General study material"}
Student Level: ${difficulty}

Provide a comprehensive explanation that includes:

1. **Simple Definition**: Start with a clear, concise definition
2. **Key Components**: Break down the main parts or elements
3. **Real-World Examples**: Provide 2-3 concrete examples that relate to everyday life
4. **Common Misconceptions**: Address typical misunderstandings students have
5. **Memory Techniques**: Suggest mnemonics, analogies, or visualization techniques
6. **Practice Tips**: How to apply or practice this concept
7. **Related Concepts**: What other topics connect to this

Make the explanation:
- Appropriate for ${difficulty} level understanding
- Engaging and easy to follow
- Practical with actionable learning tips
- Encouraging and supportive in tone

Format with clear headings and bullet points for easy reading.`,
    })

    return NextResponse.json({ explanation: text })
  } catch (error) {
    console.error("Error explaining concept:", error)
    return NextResponse.json({ error: "Failed to explain concept" }, { status: 500 })
  }
}
