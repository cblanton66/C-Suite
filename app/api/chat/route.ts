import { type NextRequest, NextResponse } from "next/server"
import { streamText, tool } from "ai"
import { xai } from "@ai-sdk/xai"
import { z } from "zod"
import { GoogleGenerativeAI } from "@google/generative-ai"
import OpenAI from "openai"
import { getUserReports } from "@/lib/google-cloud-storage"
import { getTickerDetails, calculatePerformance } from "@/lib/polygon-api"

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



// Define tools for portfolio analysis with Polygon.io
const portfolioTools = {
  getTickerData: tool({
    description: 'Get comprehensive data for a stock or ETF ticker including current details and historical performance (1M, 3M, 6M, 1Y returns). Use this when user asks about specific stocks or ETFs.',
    parameters: z.object({
      symbol: z.string().describe('The ticker symbol in uppercase (e.g., VTI, AAPL, SPY, NVDA)')
    }),
    execute: async (args) => {
      const symbol = args?.symbol
      console.log(`[TOOL CALL] getTickerData called for symbol:`, symbol, 'args:', args)

      if (!symbol) {
        return { error: 'Symbol parameter is required' }
      }

      try {
        const [details, performance] = await Promise.all([
          getTickerDetails(symbol.toUpperCase()),
          calculatePerformance(symbol.toUpperCase())
        ])

        if (!details) {
          return { error: `No data found for ticker ${symbol}` }
        }

        return {
          symbol: details.ticker,
          name: details.name,
          type: details.type,
          description: details.description,
          marketCap: details.market_cap,
          performance: performance || {
            oneMonth: null,
            threeMonth: null,
            sixMonth: null,
            oneYear: null
          }
        }
      } catch (error) {
        console.error(`[TOOL ERROR] getTickerData failed for ${symbol}:`, error)
        return { error: `Failed to fetch data for ${symbol}` }
      }
    }
  }),

  getMultipleTickers: tool({
    description: 'Get data for multiple stock/ETF tickers at once. More efficient than calling getTickerData multiple times. Use this for portfolio analysis with multiple holdings.',
    parameters: z.object({
      symbols: z.array(z.string()).describe('Array of ticker symbols in uppercase (e.g., ["VTI", "VOO", "AAPL"])')
    }),
    execute: async (args) => {
      const symbols = args?.symbols
      console.log(`[TOOL CALL] getMultipleTickers called for symbols:`, symbols, 'args:', args)

      if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
        return { error: 'Symbols array parameter is required' }
      }

      try {
        const results = await Promise.all(
          symbols.map(async (symbol) => {
            const upperSymbol = symbol.toUpperCase()
            try {
              const [details, performance] = await Promise.all([
                getTickerDetails(upperSymbol),
                calculatePerformance(upperSymbol)
              ])

              if (!details) {
                return { symbol: upperSymbol, error: 'No data found' }
              }

              return {
                symbol: details.ticker,
                name: details.name,
                type: details.type,
                description: details.description,
                marketCap: details.market_cap,
                performance: performance || {
                  oneMonth: null,
                  threeMonth: null,
                  sixMonth: null,
                  oneYear: null
                }
              }
            } catch (error) {
              return { symbol: upperSymbol, error: 'Failed to fetch data' }
            }
          })
        )
        return { tickers: results }
      } catch (error) {
        console.error('[TOOL ERROR] getMultipleTickers failed:', error)
        return { error: 'Failed to fetch ticker data' }
      }
    }
  })
}

export async function POST(req: NextRequest) {
  try {
    const { messages, fileContext, model = 'grok-3-mini-beta', searchMyHistory, userId, workspaceOwner, modeInstructions } = await req.json()

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
    // Note: The @ai-sdk/google package expects GOOGLE_GENERATIVE_AI_API_KEY env var
    const isGeminiRequest = model?.startsWith('gemini-')
    if (isGeminiRequest && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json({ error: "Google Generative AI API key not configured. Set GOOGLE_GENERATIVE_AI_API_KEY environment variable." }, { status: 500 })
    }

    // Check for OpenAI API key if a GPT model or combined analysis is requested
    const isOpenAIRequest = model?.startsWith('gpt-') || model === 'combined-analysis'
    if (isOpenAIRequest && !process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured. Set OPENAI_API_KEY environment variable." }, { status: 500 })
    }

    // Check if user is requesting portfolio analysis
    // Check the entire conversation history to see if portfolio mode was triggered
    const isPortfolioMode = messages.some(msg =>
      msg.role === 'user' &&
      msg.content?.toLowerCase().includes('perform a portfolio analysis')
    )

    // Override model to use full Grok for portfolio analysis
    let selectedModel = model
    if (isPortfolioMode) {
      selectedModel = 'grok-4-0709'
      console.log('[DEBUG] Portfolio analysis mode activated - using grok-4-0709 model')
    }

    // Select appropriate instruction set
    let systemInstructions = isPortfolioMode ? portfolioInstructions : taxInstructions
    console.log('[DEBUG] Mode:', isPortfolioMode ? 'PORTFOLIO' : 'DEFAULT with WEB SEARCH')

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

    // Use Chat API for all modes with appropriate configuration
    // Determine which provider to use based on model
    const isGeminiModel = selectedModel.startsWith('gemini-')

    // For Gemini models, use native SDK with Google Search tool
    if (isGeminiModel && !isPortfolioMode) {
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

    // For Grok models (non-portfolio), use xAI Responses API with web search
    const isGrokModel = selectedModel.startsWith('grok-')
    if (isGrokModel && !isPortfolioMode) {
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
    const isGPTModel = selectedModel.startsWith('gpt-')
    if (isGPTModel && !isPortfolioMode) {
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
    if (selectedModel === 'combined-analysis' && !isPortfolioMode) {
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
            model: 'grok-4-1-fast-non-reasoning',
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
            model: 'gemini-3-flash-preview',
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
            model: 'gpt-5.2-chat-latest',
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
        model: 'gpt-5.2-chat-latest',
        input: [{ role: "user", content: synthesisPrompt }],
      })

      const synthesizedText = synthesisResponse.output_text || ''

      return new Response(synthesizedText, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      })
    }

    // For Gemini portfolio mode or Grok portfolio mode, use Vercel AI SDK
    let modelProvider
    let tools: Record<string, unknown> | undefined = undefined
    let maxSteps = 1

    if (isGeminiModel) {
      // Portfolio mode with Gemini - use Vercel AI SDK without search (tools conflict)
      const { google } = await import("@ai-sdk/google")
      modelProvider = google(selectedModel, {
        thinkingConfig: { thinkingBudget: 0 },
      })
      systemInstructions = `IMPORTANT: Do not output any internal reasoning, self-correction notes, thinking process, or meta-commentary. Only output your final response to the user.\n\n` + systemInstructions
      tools = portfolioTools
      maxSteps = 5
    } else {
      // Grok portfolio mode
      modelProvider = xai(selectedModel, { apiKey: process.env.XAI_API_KEY })
      tools = portfolioTools
      maxSteps = 5
    }

    const result = await streamText({
      model: modelProvider,
      system: systemInstructions,
      messages: messages,
      tools,
      maxSteps,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Failed to process chat request" }, { status: 500 })
  }
}
