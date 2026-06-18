import Anthropic from '@anthropic-ai/sdk'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { NextRequest } from 'next/server'

type AIAction = 'rewrite' | 'exec-summary' | 'insights' | 'toc'

function buildPrompt(action: AIAction, content: string, tone?: string): { prompt: string; model: string } {
  switch (action) {
    case 'rewrite':
      return {
        model: 'claude-haiku-4-5-20251001',
        prompt: `Rewrite the following text in a ${tone ?? 'professional'} business tone. Improve clarity, flow, and impact while preserving the original meaning. Return only the rewritten text with no commentary:\n\n${content}`,
      }
    case 'exec-summary':
      return {
        model: 'claude-sonnet-4-6',
        prompt: `You are a professional business writer. Based on the following report content, write a concise executive summary in 2–3 paragraphs. Focus on key metrics, findings, and strategic implications. Use clear language suitable for senior stakeholders. Return only the executive summary text:\n\n${content}`,
      }
    case 'insights':
      return {
        model: 'claude-sonnet-4-6',
        prompt: `You are a business analyst. Analyze the following data and provide 3–5 key insights as clear, actionable bullet points. Each bullet should open with a specific observation followed by its business implication. Start each bullet with a • character. Return only the bullet points:\n\n${content}`,
      }
    case 'toc':
      return {
        model: 'claude-haiku-4-5-20251001',
        prompt: `Generate a professional Table of Contents based on the following document structure. Use a clean numbered format. Include the section hierarchy with sub-entries indented. Return only the formatted table of contents:\n\n${content}`,
      }
    default:
      return { model: 'claude-haiku-4-5-20251001', prompt: content }
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response('AI features not configured. Add ANTHROPIC_API_KEY to your environment variables.', { status: 503 })
  }

  const body = await req.json() as { action: AIAction; content: string; tone?: string }
  const { action, content, tone } = body

  if (!content?.trim()) {
    return new Response('No content provided', { status: 400 })
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const { prompt, model } = buildPrompt(action, content.slice(0, 8000), tone)

  const stream = client.messages.stream({
    model,
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
