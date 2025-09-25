import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    // Truncate content if it's too long to avoid token limits
    const truncatedContent = content.length > 3000 ? content.substring(0, 3000) + '...' : content

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert business analyst. Analyze the provided business report content and suggest a professional title and description. 

Requirements:
- Title should be concise, professional, and capture the main topic/focus (max 80 characters)
- Description should be a brief summary of what the report covers (max 150 characters)
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

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from OpenAI')
    }

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
      
      suggestions = JSON.parse(cleanResponse)
    } catch (parseError) {
      // If JSON parsing fails, create fallback suggestions
      console.error('Failed to parse OpenAI response:', parseError)
      suggestions = {
        title: "Business Intelligence Report",
        description: "AI-generated insights and analysis"
      }
    }

    // Validate and sanitize the suggestions
    const title = typeof suggestions.title === 'string' 
      ? suggestions.title.substring(0, 80).trim() 
      : "Business Intelligence Report"
    
    const description = typeof suggestions.description === 'string' 
      ? suggestions.description.substring(0, 150).trim() 
      : "AI-generated insights and analysis"

    return NextResponse.json({
      success: true,
      suggestions: {
        title,
        description
      }
    })

  } catch (error) {
    console.error('Suggest report details API error:', error)
    
    // Return fallback suggestions on error
    return NextResponse.json({
      success: true,
      suggestions: {
        title: "Business Intelligence Report",
        description: "AI-generated insights and analysis"
      }
    })
  }
}