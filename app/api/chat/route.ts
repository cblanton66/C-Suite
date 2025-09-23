import { type NextRequest, NextResponse } from "next/server"
import { streamText } from "ai"
import { xai } from "@ai-sdk/xai"

const taxInstructions = `
# Act as an expert business advisor, CPA and attorney
# Never talk about your credentials or experience
# You are very smart and have had extensive experience in the tax and business law industry
# You're also very professional but very friendly and engaging.
# Your user may or may not be a CPA or attorney
# When thinking about your response, Follow the user's question flow and try to determine their level of understanding and respond accordingly.
# Never thank the user for their feedback
# Never use the word expert
# Unless the user asks for a detailed report, your initial response should be a short summarized answer.
# Your responses should be formatted in a professional format (headers, subheaders, data, etc.)
# Instead of using bullet points, please use this table format:

  | XXXXX | XXXXXXX | XXXXXXX |
|-------|-------------|--------|
| XXXXX | XXXXXXXXX | $xxxxxxx |

# IMPORTANT: For tax and business law questions, ALWAYS use web search to get the most current information.
# Tax laws, regulations, and IRS guidance change frequently. When discussing:
# - Tax rates, brackets, or thresholds for 2025
# - Recent IRS announcements or rule changes
# - Current tax deadlines or extensions
# - New legislation or proposed changes
# - Current economic data affecting taxes
# Use the web_search tool to ensure accuracy and currency of information.
# closing should be Best Regards,`



export async function POST(req: NextRequest) {
  try {
    const { messages, fileContext } = await req.json()

    if (!process.env.XAI_API_KEY) {
      return NextResponse.json({ error: "XAI API key not configured" }, { status: 500 })
    }

    // Include file context in system instructions if available
    let systemInstructions = taxInstructions
    if (fileContext) {
      if (Array.isArray(fileContext)) {
        // Multiple files
        systemInstructions += `\n\nFILE CONTEXT:\nThe user has uploaded ${fileContext.length} files with the following content:\n\n`
        fileContext.forEach((file, index) => {
          systemInstructions += `FILE ${index + 1}:\nFile Name: ${file.filename}\nFile Type: ${file.type}\nFile Size: ${file.size} bytes\n\nFile Content:\n${file.content}\n\n${'='.repeat(50)}\n\n`
        })
        systemInstructions += `Please analyze all ${fileContext.length} files and provide comprehensive insights based on the uploaded documents. Compare and contrast information across files where relevant.`
      } else {
        // Single file (backward compatibility)
        systemInstructions += `\n\nFILE CONTEXT:\nThe user has uploaded a file with the following content:\n\nFile Name: ${fileContext.filename}\nFile Type: ${fileContext.type}\nFile Size: ${fileContext.size} bytes\n\nFile Content:\n${fileContext.content}\n\nPlease analyze this file content in your response and provide insights based on the uploaded document.`
      }
    }

    const result = await streamText({
      model: xai("grok-4", {
        apiKey: process.env.XAI_API_KEY,
      }),
      system: systemInstructions,
      messages: messages,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Failed to process chat request" }, { status: 500 })
  }
}
