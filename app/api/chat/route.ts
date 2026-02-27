import { type NextRequest, NextResponse } from "next/server"
import { streamText, tool } from "ai"
import { xai } from "@ai-sdk/xai"
import { z } from "zod"
import { GoogleGenerativeAI } from "@google/generative-ai"
import OpenAI from "openai"
import Anthropic from "@anthropic-ai/sdk"
import { getUserReports, getClientSummary, type ClientSummary } from "@/lib/google-cloud-storage"
import { FEATURE_MODELS, isGrokModel, isGeminiModel, isOpenAIModel, isClaudeModel, DEFAULT_MODEL } from "@/lib/ai-models"

// Helper function to detect if user is asking for a client overview
function detectClientOverviewRequest(query: string): boolean {
  const lowerQuery = query.toLowerCase().trim()

  // Short queries are likely overview requests (just a name)
  const wordCount = lowerQuery.split(/\s+/).length
  if (wordCount <= 4) {
    // Check if it's mostly a name (capitalized words or short phrase)
    const hasQuestionWords = /\b(what|how|when|where|why|which|can|could|should|would|did|does|is|are)\b/i.test(query)
    if (!hasQuestionWords) {
      return true
    }
  }

  // Explicit overview request patterns
  const overviewPatterns = [
    /^(tell me about|show me|what do (you|we) have (on|for)|summary (of|for)|overview (of|for)|look up|search for|find)\s+/i,
    /^(client|customer)?\s*:?\s*[A-Z][a-z]+(\s+[A-Z][a-z]+)*\s*$/i,  // Just a capitalized name
    /\b(all (work|projects|notes|history)|everything|full (history|summary))\b/i
  ]

  return overviewPatterns.some(pattern => pattern.test(query))
}

// Helper function to extract client name from query
function extractClientName(query: string): string | null {
  const originalQuery = query.trim()

  // Pattern 1: Just a capitalized name (most common for overview)
  const justNameMatch = originalQuery.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)$/)
  if (justNameMatch) {
    return justNameMatch[1]
  }

  // Pattern 2: "tell me about [Name]" or "show me [Name]"
  const aboutMatch = originalQuery.match(/(?:tell me about|show me|look up|search for|find|summary (?:of|for)|overview (?:of|for)|what do (?:you|we) have (?:on|for))\s+(.+?)(?:\s*\?)?$/i)
  if (aboutMatch) {
    const name = aboutMatch[1].trim()
    // Capitalize if not already
    if (name.length > 2) {
      return name.split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ')
    }
  }

  // Pattern 3: Proper names (capitalized multi-word)
  const properNameMatch = originalQuery.match(/\b([A-Z][a-z]+(?:\s+(?:and\s+)?[A-Z][a-z]+)+)\b/)
  if (properNameMatch) {
    return properNameMatch[1]
  }

  // Pattern 4: After "client" or "for" keyword
  const clientKeywordMatch = originalQuery.match(/(?:client|for|about)\s+([A-Za-z]+(?:\s+[A-Za-z]+)+)/i)
  if (clientKeywordMatch) {
    const name = clientKeywordMatch[1].trim()
    return name.split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
  }

  return null
}

const taxInstructions = `
# Act as an expert business advisor, CPA financial expert and attorney
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
# Use the web_search tool to ensure accuracy and currency of information.`

export async function POST(req: NextRequest) {
  try {
    const { messages, fileContext, model = DEFAULT_MODEL, searchMyHistory, userId, workspaceOwner, modeInstructions } = await req.json()

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

    // Check for Gemini API key if a Gemini model is requested
    const isGeminiRequest = isGeminiModel(model)
    if (isGeminiRequest && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json({ error: "Google Generative AI API key not configured. Set GOOGLE_GENERATIVE_AI_API_KEY environment variable." }, { status: 500 })
    }

    // Check for OpenAI API key if a GPT model or combined analysis is requested
    const isOpenAIRequest = isOpenAIModel(model)
    if (isOpenAIRequest && !process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured. Set OPENAI_API_KEY environment variable." }, { status: 500 })
    }

    // Check for Anthropic API key if a Claude model is requested
    const isClaudeRequest = isClaudeModel(model)
    if (isClaudeRequest && !process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Anthropic API key not configured. Set ANTHROPIC_API_KEY environment variable." }, { status: 500 })
    }

    const selectedModel = model

    // Set system instructions
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

    // Include mode-specific instructions if provided (from quick action buttons)
    if (modeInstructions) {
      console.log('[DEBUG] Adding mode instructions to system prompt')
      systemInstructions += `\n\n# MODE-SPECIFIC INSTRUCTIONS\n${modeInstructions}`

      // If this is stock analysis mode, fetch data from Alpha Vantage
      if (modeInstructions.includes('stock market analyst') || modeInstructions.includes('Alpha Vantage')) {
        try {
          const latestUserMessage = messages[messages.length - 1]?.content || ''
          console.log('[DEBUG] Stock Analysis mode detected, fetching market data for:', latestUserMessage)

          const stockResponse = await fetch(`${req.nextUrl.origin}/api/stock-analysis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: latestUserMessage })
          })

          if (stockResponse.ok) {
            const stockData = await stockResponse.json()
            if (stockData.success && stockData.data) {
              console.log('[DEBUG] Stock data fetched successfully for tickers:', stockData.tickers)
              systemInstructions += `\n\n# STOCK MARKET DATA (from Alpha Vantage API)
The following real-time market data has been fetched based on the user's query.
Use this data to provide accurate, data-driven analysis.

Query: ${stockData.query}
Tickers analyzed: ${stockData.tickers.join(', ')}
Analysis types: ${stockData.analysisTypes.join(', ')}

DATA:
${JSON.stringify(stockData.data, null, 2)}

END STOCK MARKET DATA
`
            } else if (stockData.error) {
              console.log('[DEBUG] Stock analysis error:', stockData.error)
              systemInstructions += `\n\n# STOCK DATA NOTE\n${stockData.error}\n`
            }
          }
        } catch (error) {
          console.error('[DEBUG] Error fetching stock data:', error)
        }
      }
    }

    // Include user history context if requested
    if (searchMyHistory && userId) {
      try {
        // Get the user's latest message to analyze for search context
        const latestUserMessage = messages[messages.length - 1]?.content || ''

        // Detect if this is a client overview request (just a name or simple question)
        const isClientOverviewRequest = detectClientOverviewRequest(latestUserMessage)
        console.log(`[DEBUG] Client overview request detected: ${isClientOverviewRequest}`)

        // Extract potential client name from the query
        const clientNameMatch = extractClientName(latestUserMessage)

        let clientSummary: ClientSummary | null = null
        if (clientNameMatch) {
          console.log(`[DEBUG] Attempting to get summary for client: ${clientNameMatch}`)
          clientSummary = await getClientSummary(userId, clientNameMatch, workspaceOwner)
        }

        const userHistory = await getUserReports(userId, latestUserMessage, true, workspaceOwner)

        if (clientSummary?.found) {
          // We have a structured client summary - provide clear formatting instructions
          console.log(`[DEBUG] Client summary found: ${clientSummary.totalItems} items`)

          systemInstructions += `\n\n# CLIENT HISTORY SEARCH RESULTS

## STRUCTURED CLIENT SUMMARY
You have found records for this client. Present this information clearly.

**Client:** ${clientSummary.clientName}
**Last Activity:** ${clientSummary.lastActivity}
**Total Records:** ${clientSummary.totalItems}

### Projects (${clientSummary.projects.length}):
${clientSummary.projects.length > 0 ? clientSummary.projects.map(p => `- "${p.name}" (${p.date})`).join('\n') : 'No projects found'}

### Notes (${clientSummary.notes.length}):
${clientSummary.notes.length > 0 ? clientSummary.notes.map(n => `- "${n.name}" (${n.date})`).join('\n') : 'No notes found'}

### Conversation Threads (${clientSummary.threads.length}):
${clientSummary.threads.length > 0 ? clientSummary.threads.map(t => `- "${t.name}" - ${t.preview || ''} (${t.date})`).join('\n') : 'No threads found'}

## RESPONSE INSTRUCTIONS
${isClientOverviewRequest ? `
The user is asking for an overview of this client. Respond with a well-formatted summary like this:

**Client: [Name]**
- **Last Activity:** [Date]
- **Projects ([count]):** [List each project with date]
- **Notes ([count]):** [List each note with date]
- **Conversation Threads ([count]):** [List each thread with status and date]

Then ask: "Would you like me to look at any specific item in more detail?"
` : `
The user is asking a specific question. Use the detailed content below to answer their question.
If they ask about a specific project, note, or thread, look for it in the DETAILED CONTENT section.
`}

## DETAILED CONTENT (for follow-up questions)
${userHistory || 'No detailed content available.'}

## IMPORTANT RULES
1. ONLY reference information from the summary or detailed content above
2. If the user asks about something NOT in the content, say you don't have records for that
3. NEVER fabricate or make up client information
4. When listing items, include the dates shown above

END CLIENT HISTORY CONTEXT

`
        } else if (userHistory && userHistory.trim().length > 0) {
          console.log(`[DEBUG] Including ${userHistory.length} characters of user history context (no structured summary)`)
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

    // Use Chat API for all modes with appropriate configuration
    // Determine which provider to use based on model
    const isGeminiModelSelected = isGeminiModel(selectedModel)

    // For Gemini models, use native SDK with Google Search tool
    if (isGeminiModelSelected ) {
      // Add instruction for Gemini to not output internal reasoning
      const geminiSystemPrompt = `IMPORTANT: Do not output any internal reasoning, self-correction notes, thinking process, or meta-commentary. Only output your final response to the user. Never output text like "Self-Correction" or "Internal Documentation Mode" or any commentary about your thought process.\n\n` + systemInstructions

      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)
      const geminiModel = genAI.getGenerativeModel({
        model: selectedModel,
        tools: [{ googleSearch: {} } as any],
        systemInstruction: geminiSystemPrompt,
      })

      // Convert messages to Gemini format
      const geminiHistory = messages.slice(0, -1).map((msg: { role: string; content: string }) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }))

      const lastMessage = messages[messages.length - 1]?.content || ''

      const chat = geminiModel.startChat({ history: geminiHistory })
      const result = await chat.sendMessageStream(lastMessage)

      // Create a streaming response
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result.stream) {
              const text = chunk.text()
              if (text) {
                controller.enqueue(encoder.encode(text))
              }
            }
            controller.close()
          } catch (error) {
            controller.error(error)
          }
        },
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
        },
      })
    }

    // For Claude models, use Anthropic SDK with streaming
    const isClaudeModelSelected = isClaudeModel(selectedModel)
    if (isClaudeModelSelected) {
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      })

      // Convert messages to Anthropic format
      const anthropicMessages = messages.map((msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }))

      // Create streaming response
      const stream = await anthropic.messages.stream({
        model: selectedModel,
        max_tokens: 4096,
        system: systemInstructions,
        messages: anthropicMessages,
      })

      // Create a streaming response
      const encoder = new TextEncoder()
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const event of stream) {
              if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                controller.enqueue(encoder.encode(event.delta.text))
              }
            }
            controller.close()
          } catch (error) {
            controller.error(error)
          }
        },
      })

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
        },
      })
    }

    // For Grok models, use xAI Responses API with web search
    const isGrokModelSelected = isGrokModel(selectedModel)
    if (isGrokModelSelected ) {
      const xaiClient = new OpenAI({
        apiKey: process.env.XAI_API_KEY,
        baseURL: "https://api.x.ai/v1",
      })

      // Convert messages to xAI format with system instruction
      const xaiMessages = [
        { role: "system" as const, content: systemInstructions },
        ...messages.map((msg: { role: string; content: string }) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
      ]

      // Use Responses API with web_search tool (non-streaming for now)
      const response = await (xaiClient as any).responses.create({
        model: selectedModel,
        input: xaiMessages,
        tools: [{ type: "web_search" }],
      })

      // Extract text from response - xAI returns it in output_text field
      const outputText = response.output_text || ''

      // Return as a simple text response
      return new Response(outputText, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      })
    }

    // For GPT models (non-portfolio), use OpenAI Responses API with web search
    const isGPTModelSelected = isOpenAIModel(selectedModel) && selectedModel !== 'combined-analysis'
    if (isGPTModelSelected ) {
      const openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })

      // Convert messages to OpenAI format with system instruction
      const openaiMessages = [
        { role: "system" as const, content: systemInstructions },
        ...messages.map((msg: { role: string; content: string }) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
      ]

      // Use Responses API with web_search tool
      const response = await (openaiClient as any).responses.create({
        model: selectedModel,
        input: openaiMessages,
        tools: [{ type: "web_search" }],
      })

      // Extract text from response - OpenAI returns it in output_text field
      const outputText = response.output_text || ''

      // Return as a simple text response
      return new Response(outputText, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      })
    }

    // For Combined Analysis mode - query all three models and synthesize
    if (selectedModel === 'combined-analysis' ) {
      console.log('[DEBUG] Combined Analysis mode - querying Grok, Gemini, and GPT (fast models)')

      // Query all three fast models in parallel
      const [grokResponse, geminiResponse, gptResponse] = await Promise.all([
        // Grok 4.1 Fast
        (async () => {
          const xaiClient = new OpenAI({
            apiKey: process.env.XAI_API_KEY,
            baseURL: "https://api.x.ai/v1",
          })
          const xaiMessages = [
            { role: "system" as const, content: systemInstructions },
            ...messages.map((msg: { role: string; content: string }) => ({
              role: msg.role as "user" | "assistant",
              content: msg.content,
            })),
          ]
          const response = await (xaiClient as any).responses.create({
            model: FEATURE_MODELS.grokWebSearch,
            input: xaiMessages,
            tools: [{ type: "web_search" }],
          })
          return response.output_text || ''
        })(),

        // Gemini 3 Flash
        (async () => {
          const geminiSystemPrompt = `IMPORTANT: Do not output any internal reasoning, self-correction notes, thinking process, or meta-commentary. Only output your final response to the user.\n\n` + systemInstructions
          const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)
          const geminiModel = genAI.getGenerativeModel({
            model: FEATURE_MODELS.geminiWebSearch,
            tools: [{ googleSearch: {} } as any],
            systemInstruction: geminiSystemPrompt,
          })
          const geminiHistory = messages.slice(0, -1).map((msg: { role: string; content: string }) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
          }))
          const lastMessage = messages[messages.length - 1]?.content || ''
          const chat = geminiModel.startChat({ history: geminiHistory })
          const result = await chat.sendMessage(lastMessage)
          return result.response.text()
        })(),

        // GPT-5.2 Instant
        (async () => {
          const openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
          })
          const openaiMessages = [
            { role: "system" as const, content: systemInstructions },
            ...messages.map((msg: { role: string; content: string }) => ({
              role: msg.role as "user" | "assistant",
              content: msg.content,
            })),
          ]
          const response = await (openaiClient as any).responses.create({
            model: FEATURE_MODELS.openaiWebSearch,
            input: openaiMessages,
            tools: [{ type: "web_search" }],
          })
          return response.output_text || ''
        })(),
      ])

      console.log('[DEBUG] All three models responded, synthesizing...')

      // Synthesize the responses using GPT-5.2 Instant
      const synthesisPrompt = `You are a synthesis expert. You have received responses from three different AI models to the same question. Your task is to create a comprehensive, well-organized response that combines the best insights from all three sources.

ORIGINAL QUESTION:
${messages[messages.length - 1]?.content || ''}

RESPONSE FROM GROK 4:
${grokResponse}

RESPONSE FROM GEMINI 3 PRO:
${geminiResponse}

RESPONSE FROM GPT-5.2 PRO:
${gptResponse}

Please synthesize these responses into a single, comprehensive answer that:
1. Combines unique insights from each model
2. Resolves any conflicting information by noting the discrepancy or choosing the most accurate/recent data
3. Organizes the information clearly with headers and bullet points where appropriate
4. Maintains a professional tone consistent with a CPA/business advisor
5. Cites which model provided specific information when relevant

Do not mention that you are synthesizing responses or reference the individual models unless there are notable differences worth highlighting.`

      const openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })

      const synthesisResponse = await (openaiClient as any).responses.create({
        model: FEATURE_MODELS.openaiWebSearch,
        input: [{ role: "user", content: synthesisPrompt }],
      })

      const synthesizedText = synthesisResponse.output_text || ''

      return new Response(synthesizedText, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      })
    }

    // Fallback: use Vercel AI SDK with Grok (no web search)
    const modelProvider = xai(selectedModel, { apiKey: process.env.XAI_API_KEY })

    const result = await streamText({
      model: modelProvider,
      system: systemInstructions,
      messages: messages,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Failed to process chat request" }, { status: 500 })
  }
}
