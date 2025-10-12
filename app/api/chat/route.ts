import { type NextRequest, NextResponse } from "next/server"
import { streamText } from "ai"
import { xai } from "@ai-sdk/xai"
import { getUserReports } from "@/lib/google-cloud-storage"

const taxInstructions = `
# Act as an expert business advisor, CPA and attorney
# if the user asks to summarize information please provide a table format with the information
# Please do not start off your response with "Hey", "Hi" or "Hello"
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
|:------|:-------:|---------:| 
| XXXXX | XXXXXXXXX | $xxxxxxx |

# IMPORTANT: For tax and business law questions, ALWAYS use web search to get the most current information.
# Tax laws, regulations, and IRS guidance change frequently. When discussing:
# - Tax rates, brackets, or thresholds for 2025
# - Recent IRS announcements or rule changes
# - Current tax deadlines or extensions
# - New legislation or proposed changes
# - Current economic data affecting taxes
# Use the web_search tool to ensure accuracy and currency of information.


# CHART GENERATION:
# When presenting financial data, trends, or comparisons that would benefit from visualization, 
# include a chart using this JSON format in a code block with \`\`\`chart:

# Example chart formats:

# Bar Chart:
\`\`\`chart
{
  "type": "bar",
  "title": "Monthly Revenue Analysis",
  "description": "Revenue breakdown by month in thousands",
  "data": [
    {"name": "Jan", "value": 4000},
    {"name": "Feb", "value": 3000},
    {"name": "Mar", "value": 2000}
  ],
  "xKey": "name",
  "yKey": "value"
}
\`\`\`

# Line Chart (for trends):
\`\`\`chart
{
  "type": "line",
  "title": "Growth Trend",
  "description": "Quarterly growth percentage",
  "data": [
    {"name": "Q1", "value": 12},
    {"name": "Q2", "value": 19}
  ],
  "xKey": "name",
  "yKey": "value"
}
\`\`\`

# Pie Chart (for breakdowns):
\`\`\`chart
{
  "type": "pie",
  "title": "Expense Categories",
  "description": "Business expense breakdown",
  "data": [
    {"name": "Salaries", "value": 400},
    {"name": "Rent", "value": 300}
  ],
  "xKey": "name",
  "yKey": "value"
}
\`\`\`

# IMPORTANT: Only include charts when they would genuinely enhance understanding of financial data.

# TAX RETURN PROGRESS TRACKING:
# You are an AI assistant helping a CPA track tax return progress. Your role has two distinct modes:

# DEFAULT MODE - Internal Documentation:
# - Unless explicitly asked for a "client report" or "final report," treat ALL information I provide as internal working notes
# - Keep track of all tax information, decisions, questions, and notes I share throughout this conversation
# - Provide brief confirmations, ask clarifying questions, and help organize information
# - DO NOT generate detailed formatted reports or client-ready summaries unless specifically requested
# - Think of this thread as my working scratch pad

# CLIENT REPORT MODE:
# - Only activate when I use phrases like:
#   - "Generate the client report"
#   - "Prepare the final report"
#   - "Create client summary"
#   - "I need the report for the client"
# - When triggered, produce a comprehensive, professional client-facing report using ALL information accumulated in this thread
# - Format appropriately for client delivery

# Throughout our conversation:
# - Accumulate and remember all details: income sources, deductions, credits, questions resolved, items pending, etc.
# - Help me stay organized but keep responses concise
# - Ask clarifying questions about the tax situation when needed
# - Never assume I want a client report unless I explicitly request it`



export async function POST(req: NextRequest) {
  try {
    const { messages, fileContext, model = 'grok-4-fast', searchMyHistory, userId, workspaceOwner } = await req.json()

    console.log('[DEBUG] Chat request received:', {
      searchMyHistory,
      userId,
      workspaceOwner,
      model,
      messagesCount: messages?.length
    })

    if (!process.env.XAI_API_KEY) {
      return NextResponse.json({ error: "XAI API key not configured" }, { status: 500 })
    }

    // Include file context in system instructions if available
    let systemInstructions = taxInstructions

    // Add current date to system instructions
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    systemInstructions += `\n\n# CURRENT DATE\nToday's date is: ${currentDate}\nUse this date when drafting memos, reports, or any documents that require a date.`

    // Fetch and include custom instructions if user is logged in
    if (userId) {
      try {
        const customInstructionsResponse = await fetch(`${req.nextUrl.origin}/api/custom-instructions?userEmail=${encodeURIComponent(userId)}`)
        if (customInstructionsResponse.ok) {
          const customInstructionsData = await customInstructionsResponse.json()
          console.log('[DEBUG] Custom instructions response:', customInstructionsData)
          if (customInstructionsData.success && customInstructionsData.instructions) {
            console.log('[DEBUG] Adding custom instructions to system prompt:', customInstructionsData.instructions)
            systemInstructions += `\n\n# USER CUSTOM INSTRUCTIONS\n${customInstructionsData.instructions}`
          } else {
            console.log('[DEBUG] No custom instructions found or empty')
          }
        }
      } catch (error) {
        console.error('[DEBUG] Error fetching custom instructions:', error)
        // Continue without custom instructions if there's an error
      }
    }

    // Include user history context if requested
    if (searchMyHistory && userId) {
      try {
        // Get the user's latest message to analyze for search context
        const latestUserMessage = messages[messages.length - 1]?.content || ''

        const userHistory = await getUserReports(userId, latestUserMessage, true, workspaceOwner)
        if (userHistory && userHistory.trim().length > 0) {
          console.log(`[DEBUG] Including ${userHistory.length} characters of user history context`)
          systemInstructions += `\n\n# CRITICAL: USER HISTORY CONTEXT PROVIDED
The following are your previous reports and conversations with this user. Use this context to provide personalized responses based on their specific business needs and past work.

IMPORTANT RULES FOR USER HISTORY:
1. ONLY reference information that appears in the USER HISTORY CONTEXT below
2. If the user asks about a client or project NOT mentioned in the context, you MUST say: "I don't have any records for [client name] in your history. This could mean: (a) no work has been saved for this client yet, (b) the client name doesn't match exactly, or (c) the work is stored under a different name. Please check your Client Comms or Manage Projects to verify."
3. NEVER fabricate, estimate, or make up client work, project details, dates, or activities
4. If uncertain, ask for clarification rather than guessing

USER HISTORY CONTEXT:
${userHistory}

END USER HISTORY CONTEXT

`
        } else {
          console.log('[DEBUG] No relevant user history found for this query')
          systemInstructions += `\n\n# USER HISTORY SEARCH: NO RESULTS FOUND
The user has enabled client history search, but no relevant records were found for this query.

CRITICAL INSTRUCTION: You MUST inform the user that no client history was found. Say something like:
"I searched your client history but didn't find any records matching this query. This could mean:
- No work has been saved for this client yet
- The client name doesn't match exactly
- The work might be under a different name or project

You can check your Client Comms or Manage Projects to see all saved work."

DO NOT make up or fabricate any client information, project details, dates, or work activities.
`
        }
      } catch (error) {
        console.error('Error fetching user history:', error)
        // Continue without history context if there's an error
      }
    } else {
      console.log('[DEBUG] Not searching user history:', { searchMyHistory, userId })
    }
    
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
      model: xai(model, {
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
