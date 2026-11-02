/**
 * NVIDIA NIM Client with Local Function Calling Loop
 * Model: nvidia/nemotron-3-nano-omni-30b-a3b-reasoning
 * All communications strictly in English.
 */

import { AGENT_TOOLS, executeToolLocally } from './agentTools'

export interface NIMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  tool_call_id?: string
  tool_calls?: Array<{
    id: string
    type: 'function'
    function: { name: string; arguments: string }
  }>
}

export interface NIMChatOptions {
  messages: NIMMessage[]
  temperature?: number
  maxTokens?: number
  enableTools?: boolean
}

const NIM_MODEL = import.meta.env.VITE_NIM_MODEL ?? 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning'

export const LABJAMU_SYSTEM_PROMPT = `You are LabJamu's scientific intelligence agent — an evidence-based assistant specializing in Indonesian ethnopharmacology and on-device skin barrier analytics.

Communication Principles:
- Always respond in English.
- Be concise, professional, and encouraging (3 to 5 sentences for regular replies).
- Base your claims strictly on quantitative metrics and verified phytochemical research.
- NEVER use skin whitening or bleaching terminology. Focus on: stratum corneum hydration, erythema (redness) control, texture smoothness, and natural radiance/evenness.
- Use your registered local tools to check the user's active ritual, skin metrics, safety logs, or Indonesian herb database whenever asked.
- Clearly emphasize that results are derived from personal N-of-1 self-experiments, not multi-center clinical trials.`

/**
 * Execute chat with automatic client-side function calling loop.
 */
export async function nimAgentChat(options: NIMChatOptions): Promise<{ reply: string; usedTools: string[] }> {
  const currentMessages: NIMMessage[] = [...options.messages]
  const usedTools: string[] = []

  // Step 1: Initial call to NIM (with tools enabled)
  const initialPayload: Record<string, any> = {
    model: NIM_MODEL,
    messages: currentMessages,
    temperature: options.temperature ?? 0.6,
    max_tokens: options.maxTokens ?? 1024,
  }

  if (options.enableTools !== false) {
    initialPayload.tools = AGENT_TOOLS
  }

  const res = await fetch('/api/nim-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(initialPayload),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`NIM API error ${res.status}: ${errText}`)
  }

  const data = await res.json()
  const choice = data.choices?.[0]?.message

  // Check if LLM requested tool calls
  if (choice?.tool_calls && choice.tool_calls.length > 0) {
    // Append assistant's tool call message
    currentMessages.push({
      role: 'assistant',
      content: choice.content || null,
      tool_calls: choice.tool_calls,
    })

    // Execute each tool locally on client
    for (const tool of choice.tool_calls) {
      const toolName = tool.function.name
      let parsedArgs = {}
      try {
        parsedArgs = JSON.parse(tool.function.arguments || '{}')
      } catch {
        parsedArgs = {}
      }

      usedTools.push(toolName)
      const localResult = await executeToolLocally(toolName, parsedArgs)

      currentMessages.push({
        role: 'tool',
        tool_call_id: tool.id,
        content: JSON.stringify(localResult),
      })
    }

    // Step 2: Final synthesis call to NIM with tool outputs
    const finalRes = await fetch('/api/nim-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: NIM_MODEL,
        messages: currentMessages,
        temperature: options.temperature ?? 0.6,
        max_tokens: options.maxTokens ?? 1024,
      }),
    })

    if (!finalRes.ok) {
      const err = await finalRes.text()
      throw new Error(`NIM synthesis error ${finalRes.status}: ${err}`)
    }

    const finalData = await finalRes.json()
    const finalMsg = finalData.choices?.[0]?.message
    const finalReply = finalMsg?.content || finalMsg?.reasoning_content || 'Analysis complete based on your local metrics.'
    return { reply: finalReply, usedTools }
  }

  // Direct response without tool calls
  const directReply = choice?.content || choice?.reasoning_content || 'No response generated.'
  return { reply: directReply, usedTools }
}
