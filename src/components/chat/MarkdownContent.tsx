import React from 'react'

interface MarkdownContentProps {
  content: string
  isUser?: boolean
}

/**
 * Lightweight, zero-dependency Markdown renderer tailored for mobile chat.
 * Correctly strips raw '**' and renders formatted bold, lists, headers, and code.
 */
export function MarkdownContent({ content, isUser = false }: MarkdownContentProps) {
  if (!content) return null

  // If user bubble, render text directly with break
  if (isUser) {
    return <span className="whitespace-pre-wrap">{content}</span>
  }

  // Split lines into structured blocks
  const lines = content.split('\n')
  const blocks: React.ReactNode[] = []
  let currentList: { type: 'ul' | 'ol'; items: React.ReactNode[] } | null = null

  function flushList() {
    if (currentList) {
      if (currentList.type === 'ul') {
        blocks.push(
          <ul key={`ul-${blocks.length}`} className="my-1.5 space-y-1 list-none pl-1">
            {currentList.items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5 text-xs sm:text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-botanical/60 flex-shrink-0 mt-1.5" />
                <span className="flex-1">{item}</span>
              </li>
            ))}
          </ul>
        )
      } else {
        blocks.push(
          <ol key={`ol-${blocks.length}`} className="my-1.5 space-y-1 list-decimal pl-4 text-xs sm:text-sm">
            {currentList.items.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ol>
        )
      }
      currentList = null
    }
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim()

    // Empty line
    if (!trimmed) {
      flushList()
      return
    }

    // Horizontal Rule
    if (/^(\*\*\*|---|___)$/.test(trimmed)) {
      flushList()
      blocks.push(<hr key={index} className="my-2 border-slate/10" />)
      return
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      flushList()
      blocks.push(
        <h4 key={index} className="font-bold text-xs sm:text-sm text-slate mt-2 mb-0.5">
          {formatInline(trimmed.slice(4))}
        </h4>
      )
      return
    }
    if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      flushList()
      const text = trimmed.replace(/^#+\s*/, '')
      blocks.push(
        <h3 key={index} className="font-extrabold text-sm text-botanical mt-2 mb-1">
          {formatInline(text)}
        </h3>
      )
      return
    }

    // Bullet points (•, -, *)
    const bulletMatch = trimmed.match(/^([•\-\*])\s+(.+)$/)
    if (bulletMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList()
        currentList = { type: 'ul', items: [] }
      }
      currentList.items.push(formatInline(bulletMatch[2]))
      return
    }

    // Numbered lists (1., 2.)
    const numMatch = trimmed.match(/^(\d+)\.\s+(.+)$/)
    if (numMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList()
        currentList = { type: 'ol', items: [] }
      }
      currentList.items.push(formatInline(numMatch[2]))
      return
    }

    // Normal paragraph line
    flushList()
    blocks.push(
      <p key={index} className="my-1 leading-relaxed text-xs sm:text-sm">
        {formatInline(trimmed)}
      </p>
    )
  })

  flushList()

  return <div className="space-y-1">{blocks}</div>
}

/**
 * Format inline bold (**text** or __text__), italics (*text* or _text_), and inline code (`code`)
 */
function formatInline(text: string): React.ReactNode[] {
  // Regex splitting by:
  // 1. `code`
  // 2. **bold** or __bold__
  // 3. *italic* or _italic_
  const parts: React.ReactNode[] = []
  let remaining = text
  let keyIndex = 0

  while (remaining.length > 0) {
    // Check for inline code `...`
    const codeMatch = remaining.match(/^`([^`]+)`/)
    if (codeMatch) {
      parts.push(
        <code key={keyIndex++} className="px-1.5 py-0.5 mx-0.5 bg-slate-100 text-botanical font-mono text-[11px] rounded-md border border-slate-200">
          {codeMatch[1]}
        </code>
      )
      remaining = remaining.slice(codeMatch[0].length)
      continue
    }

    // Check for bold **...** or __...__
    const boldMatch = remaining.match(/^(\*\*|__)(.*?)\1/)
    if (boldMatch) {
      parts.push(
        <strong key={keyIndex++} className="font-bold text-slate">
          {boldMatch[2]}
        </strong>
      )
      remaining = remaining.slice(boldMatch[0].length)
      continue
    }

    // Check for italic *...* or _..._
    const italicMatch = remaining.match(/^(\*|_)(.*?)\1/)
    if (italicMatch && !italicMatch[2].startsWith('*') && !italicMatch[2].endsWith('*')) {
      parts.push(
        <em key={keyIndex++} className="italic text-slate/90">
          {italicMatch[2]}
        </em>
      )
      remaining = remaining.slice(italicMatch[0].length)
      continue
    }

    // Next delimiter index
    const nextSpecial = remaining.search(/[`\*_]/)
    if (nextSpecial === -1) {
      parts.push(remaining)
      break
    } else if (nextSpecial === 0) {
      // Stray delimiter that didn't match a pair, consume one character
      parts.push(remaining[0])
      remaining = remaining.slice(1)
    } else {
      parts.push(remaining.slice(0, nextSpecial))
      remaining = remaining.slice(nextSpecial)
    }
  }

  return parts
}
