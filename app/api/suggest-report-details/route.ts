import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  console.log('🚀 [SUGGEST-REPORT-DETAILS] API called at:', new Date().toISOString())
  
  try {
    const { content } = await request.json()
    console.log('📥 [SUGGEST-REPORT-DETAILS] Request payload received, content length:', content?.length || 0)

    if (!content || typeof content !== 'string') {
      console.log('❌ [SUGGEST-REPORT-DETAILS] Invalid content:', { content: typeof content, length: content?.length })
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      console.log('❌ [SUGGEST-REPORT-DETAILS] OpenAI API key not configured')
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    console.log('✅ [SUGGEST-REPORT-DETAILS] OpenAI API key found, length:', process.env.OPENAI_API_KEY.length)

    // Initialize OpenAI client at runtime
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    console.log('✅ [SUGGEST-REPORT-DETAILS] OpenAI client initialized successfully')

    // Truncate content if it's too long to avoid token limits
    const truncatedContent = content.length > 3000 ? content.substring(0, 3000) + '...' : content
    console.log('📝 [SUGGEST-REPORT-DETAILS] Content prepared, final length:', truncatedContent.length, 'characters')

    console.log('🤖 [SUGGEST-REPORT-DETAILS] Calling OpenAI API...')
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert business analyst. Analyze the provided business report content and suggest a professional title and description. 

Requirements:
- Title should be concise, professional, and capture the main topic/focus (max 80 characters)
- Description should be a brief summary of what the report covers (max 12 words)
- Use business terminology appropriate for executives
- Focus on key insights, metrics, or analysis areas
- Avoid generic phrases like "Business Report" or "Analysis Report"

Return your response in JSON format with "title" and "description" fields only.`
        },
        {
          role: "user",
          content: `Please analyze this business report content and suggest a professional title and description:\n\n${truncatedContent}`
        }
      ],
      max_tokens: 200,
      temperature: 0.7
    })

    console.log('✅ [SUGGEST-REPORT-DETAILS] OpenAI API response received')
    console.log('📊 [SUGGEST-REPORT-DETAILS] Usage:', completion.usage)

    const response = completion.choices[0]?.message?.content
    if (!response) {
      console.log('❌ [SUGGEST-REPORT-DETAILS] No response content from OpenAI')
      throw new Error('No response from OpenAI')
    }

    console.log('📄 [SUGGEST-REPORT-DETAILS] Raw OpenAI response:', response)

    // Parse the JSON response, handling markdown code blocks
    let suggestions
    try {
      // Remove any markdown code block formatting
      let cleanResponse = response.trim()
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      console.log('🧹 [SUGGEST-REPORT-DETAILS] Cleaned response for JSON parsing:', cleanResponse)
      suggestions = JSON.parse(cleanResponse)
      console.log('✅ [SUGGEST-REPORT-DETAILS] Successfully parsed JSON:', suggestions)
    } catch (parseError) {
      // If JSON parsing fails, create fallback suggestions
      console.error('❌ [SUGGEST-REPORT-DETAILS] Failed to parse OpenAI response:', parseError)
      console.error('❌ [SUGGEST-REPORT-DETAILS] Raw response that failed to parse:', response)
      suggestions = {
        title: "Business Intelligence Report",
        description: "AI-generated insights and analysis"
      }
      console.log('🔄 [SUGGEST-REPORT-DETAILS] Using fallback suggestions due to parse error')
    }

    // Validate and sanitize the suggestions
    const title = typeof suggestions.title === 'string' 
      ? suggestions.title.substring(0, 80).trim() 
      : "Business Intelligence Report"
    
    // Limit description to 12 words
    const limitDescriptionToWords = (text: string, maxWords: number) => {
      const words = text.trim().split(/\s+/)
      return words.length > maxWords ? words.slice(0, maxWords).join(' ') : text
    }
    
    const description = typeof suggestions.description === 'string' 
      ? limitDescriptionToWords(suggestions.description.trim(), 12)
      : "AI-generated insights and analysis"

    const finalResponse = {
      success: true,
      suggestions: {
        title,
        description
      }
    }

    console.log('🎉 [SUGGEST-REPORT-DETAILS] Final response:', finalResponse)
    return NextResponse.json(finalResponse)

  } catch (error) {
    console.error('💥 [SUGGEST-REPORT-DETAILS] API error details:')
    console.error('💥 [SUGGEST-REPORT-DETAILS] Error name:', error?.name)
    console.error('💥 [SUGGEST-REPORT-DETAILS] Error message:', error?.message)
    console.error('💥 [SUGGEST-REPORT-DETAILS] Error stack:', error?.stack)
    console.error('💥 [SUGGEST-REPORT-DETAILS] Full error object:', error)
    
    // Check if it's an OpenAI specific error
    if (error?.code) {
      console.error('💥 [SUGGEST-REPORT-DETAILS] OpenAI error code:', error.code)
    }
    if (error?.status) {
      console.error('💥 [SUGGEST-REPORT-DETAILS] HTTP status from OpenAI:', error.status)
    }
    
    // Return fallback suggestions on error
    const fallbackResponse = {
      success: true,
      suggestions: {
        title: "Business Intelligence Report",
        description: "AI-generated insights and analysis"
      }
    }
    
    console.log('🔄 [SUGGEST-REPORT-DETAILS] Returning fallback response due to error:', fallbackResponse)
    return NextResponse.json(fallbackResponse)
  }
}