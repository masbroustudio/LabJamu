import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Leaf, Camera, Wrench, ImagePlus, Mic, MicOff, Sparkles } from 'lucide-react'
import { nimAgentChat, LABJAMU_SYSTEM_PROMPT, type NIMMessage } from '@/lib/nim'
import { db, type ChatMessage } from '@/db'
import { useLiveQuery } from 'dexie-react-hooks'
import { nanoid } from '@/lib/nanoid'
import { CameraScanner } from '@/components/studio/CameraScanner'
import { MarkdownContent } from '@/components/chat/MarkdownContent'
import { BiometricScanCard, type BiometricMetrics } from '@/components/chat/BiometricScanCard'
import type { NavTab } from '@/types'

interface ChatPageProps {
  onNavigate?: (tab: NavTab, section?: 'overview' | 'metrics' | 'safety' | 'dag' | 'timeline') => void
}

export function ChatPage({ onNavigate }: ChatPageProps) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTools, setActiveTools] = useState<string[]>([])
  const [scannerOpen, setScannerOpen] = useState(false)
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [isListening, setIsListening] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)

  const messages = useLiveQuery(
    () => db.chatMessages.orderBy('timestamp').toArray(),
    []
  ) ?? []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, activeTools])

  function handleImageFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setAttachedFile(file)
      setScannerOpen(true)
      e.target.value = ''
    }
  }

  function toggleListening() {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRec) {
      alert('Voice dictation is not supported by your current browser. Try Chrome or Edge on desktop or mobile.')
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    try {
      const recognition = new SpeechRec()
      recognition.lang = 'en-US'
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript || ''
        if (transcript) {
          setInput(prev => (prev ? `${prev} ${transcript}` : transcript))
        }
        setIsListening(false)
      }

      recognition.onerror = () => {
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch {
      setIsListening(false)
    }
  }

  async function handleSend(customText?: string) {
    const text = (customText ?? input).trim()
    if (!text || loading) return

    setInput('')
    setLoading(true)
    setActiveTools([])

    const userMsg: ChatMessage = {
      id: nanoid(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    }
    await db.chatMessages.add(userMsg)

    try {
      const history: NIMMessage[] = [
        { role: 'system', content: LABJAMU_SYSTEM_PROMPT },
        ...messages.slice(-8).map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user', content: text },
      ]

      const { reply, usedTools } = await nimAgentChat({
        messages: history,
        temperature: 0.6,
        maxTokens: 1024,
      })

      if (usedTools.length > 0) {
        setActiveTools(usedTools)
      }

      const assistantMsg: ChatMessage = {
        id: nanoid(),
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
      }
      await db.chatMessages.add(assistantMsg)
    } catch (err: any) {
      console.error('[ChatPage] NIM error:', err)
      const errMsg: ChatMessage = {
        id: nanoid(),
        role: 'assistant',
        content: `⚠️ Communication error: ${err.message}. Please verify your network and NVIDIA API configuration.`,
        timestamp: Date.now(),
      }
      await db.chatMessages.add(errMsg)
    } finally {
      setLoading(false)
      setTimeout(() => setActiveTools([]), 4000)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const promptShortcuts = [
    'How is my redness trending?',
    'Explain Temugiring bioactivity',
    'Is my erythema trip-wire safe?',
    'Summarize my trial causality',
  ]

  return (
    <div className="flex flex-col h-full bg-rice-husk">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-slate/10 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="w-8 h-8 rounded-xl bg-botanical flex items-center justify-center shadow-xs">
          <Leaf size={16} className="text-rice-husk" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate leading-none">LabJamu Intelligence</h1>
          <p className="text-[10px] text-slate-light mt-0.5">
            {loading ? (
              <span className="text-turmeric font-semibold animate-pulse">Reasoning &amp; executing tools…</span>
            ) : (
              'Nemotron-3-Nano Reasoning · English Clinical Engine'
            )}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-8 h-8 rounded-xl bg-white border border-slate/15 flex items-center justify-center text-slate hover:text-botanical hover:border-botanical/30 active:scale-95 transition-all shadow-xs"
            title="Attach face photo for analysis"
          >
            <ImagePlus size={15} />
          </button>
          <button
            onClick={() => setScannerOpen(true)}
            className="w-8 h-8 rounded-xl bg-botanical/10 flex items-center justify-center text-botanical hover:bg-botanical/20 active:scale-95 transition-all"
            title="Open Camera Scanner"
          >
            <Camera size={16} />
          </button>
        </div>
      </header>

      {/* Hidden file input for direct photo ingestion from chat */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleImageFileSelect}
      />

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && !loading && (
          <WelcomeBubble onSelectPrompt={p => handleSend(p)} />
        )}

        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} onNavigate={onNavigate} />
        ))}

        {/* Live tool invocation banner */}
        {activeTools.length > 0 && (
          <div className="flex items-center gap-2 p-2 px-3 rounded-xl bg-botanical/10 border border-botanical/20 text-xs text-botanical animate-fade-in-up">
            <Wrench size={13} className="animate-spin" />
            <span className="font-mono text-[11px]">
              Executed local on-device tools: {activeTools.join(', ')}
            </span>
          </div>
        )}

        {loading && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>

      {/* Contextual Quick Shortcut Chips */}
      {messages.length > 0 && !loading && (
        <div className="px-3 py-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {promptShortcuts.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => handleSend(p)}
              className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-white border border-slate/15 text-slate hover:border-botanical/40 hover:text-botanical active:scale-95 transition-all shadow-xs flex items-center gap-1 flex-shrink-0"
            >
              <Sparkles size={11} className="text-turmeric" />
              <span>{p}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="px-3 pb-3 pt-2 border-t border-slate/10 bg-white/80 backdrop-blur-sm">
        <div className="flex items-end gap-1.5 bg-rice-husk-dark rounded-2xl px-2.5 py-2 border border-slate/10 focus-within:border-botanical/40 transition-colors">
          {/* Direct Photo Attach Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-slate-light hover:text-botanical hover:bg-white active:scale-95 transition-all"
            title="Attach face photo"
          >
            <ImagePlus size={16} />
          </button>

          {/* Hands-Free Voice Dictation Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={[
              'flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all',
              isListening
                ? 'bg-rose-500 text-white animate-pulse shadow-sm'
                : 'text-slate-light hover:text-botanical hover:bg-white active:scale-95',
            ].join(' ')}
            title={isListening ? 'Listening… click to finish' : 'Dictate with voice'}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? 'Listening… speak your clinical inquiry' : 'Ask about Temugiring, your redness score, or ritual status…'}
            rows={1}
            className="flex-1 bg-transparent resize-none text-sm text-slate placeholder-slate-light focus:outline-none max-h-32 px-1"
            style={{ lineHeight: '1.4' }}
          />

          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className={[
              'flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all',
              input.trim() && !loading
                ? 'bg-botanical text-rice-husk shadow-sm hover:bg-botanical-light active:scale-95'
                : 'bg-slate/10 text-slate-light cursor-not-allowed',
            ].join(' ')}
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-light mt-1.5">
          Local-First · On-Device Tool Execution · Privacy-Preserving Architecture
        </p>
      </div>

      {/* Camera scanner modal */}
      {scannerOpen && (
        <CameraScanner
          isOpen={scannerOpen}
          initialFile={attachedFile}
          onClose={() => {
            setScannerOpen(false)
            setAttachedFile(null)
          }}
          onViewDashboard={() => {
            setScannerOpen(false)
            setAttachedFile(null)
            onNavigate?.('studio', 'metrics')
          }}
          onScanComplete={async (metrics) => {
            setAttachedFile(null)
            const latestSession = await db.sessions.orderBy('timestamp').last()
            await db.chatMessages.add({
              id: nanoid(),
              role: 'assistant',
              content: 'Biometric Face Scan Recorded',
              timestamp: Date.now(),
              metadata: {
                type: 'biometric_scan',
                metrics,
                opfsImagePath: latestSession?.opfsImagePath ?? undefined,
              },
            })
          }}
        />
      )}
    </div>
  )
}

function parseBiometricsFromContent(content: string): BiometricMetrics | null {
  const moisture = content.match(/Moisture:\*?\*?\s*(\d+)/i)?.[1]
  const redness = content.match(/Redness.*?:\*?\*?\s*(\d+)/i)?.[1]
  const texture = content.match(/Texture:\*?\*?\s*(\d+)/i)?.[1]
  const radiance = content.match(/Radiance:\*?\*?\s*(\d+)/i)?.[1]
  const skinType = content.match(/Skin Classification:\*?\*?\s*([A-Za-z]+)/i)?.[1]

  if (moisture && redness && texture) {
    return {
      moisture: parseInt(moisture, 10),
      redness: parseInt(redness, 10),
      texture: parseInt(texture, 10),
      radiance: radiance ? parseInt(radiance, 10) : 80,
      skinType: skinType || 'Normal',
    }
  }
  return null
}

function WelcomeBubble({ onSelectPrompt }: { onSelectPrompt: (text: string) => void }) {
  const suggestions = [
    'What is my active herbal ritual status?',
    'Explain the phytochemical properties of Temugiring',
    'Are my current redness and moisture levels safe?',
    'How does ambient humidity confound my skincare results?',
  ]

  return (
    <div className="flex flex-col items-center text-center py-6 px-3 animate-fade-in-up">
      <div className="w-14 h-14 rounded-2xl bg-botanical/10 flex items-center justify-center mb-3 shadow-xs">
        <Leaf size={28} className="text-botanical" />
      </div>
      <h2 className="text-base font-bold text-slate mb-1">Welcome to LabJamu</h2>
      <p className="text-xs text-slate-light max-w-xs leading-relaxed">
        Your on-device ethnopharmacology research partner. Query your local metrics, verify botanical bioactivity, and track N-of-1 trial progress.
      </p>
      <div className="mt-4 flex flex-col gap-2 w-full max-w-xs">
        {suggestions.map(s => (
          <button
            key={s}
            onClick={() => onSelectPrompt(s)}
            className="text-left text-xs px-3.5 py-2.5 rounded-xl border border-botanical/15 text-botanical bg-white hover:bg-botanical/5 active:scale-98 transition-all shadow-xs"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

function MessageBubble({
  message,
  onNavigate,
}: {
  message: ChatMessage
  onNavigate?: (tab: NavTab, section?: 'overview' | 'metrics' | 'safety' | 'dag' | 'timeline') => void
}) {
  const isUser = message.role === 'user'

  const isScanMessage =
    message.metadata?.type === 'biometric_scan' ||
    message.content.includes('Biometric Face Scan Recorded') ||
    (message.content.includes('Moisture:') && message.content.includes('Redness'))

  const scanMetrics: BiometricMetrics | null =
    message.metadata?.metrics ||
    (isScanMessage ? parseBiometricsFromContent(message.content) : null)

  if (isScanMessage && scanMetrics) {
    return (
      <div className="flex justify-start animate-fade-in-up w-full">
        <div className="w-7 h-7 rounded-xl bg-botanical flex items-center justify-center mr-2 flex-shrink-0 mt-1 shadow-xs">
          <Leaf size={13} className="text-rice-husk" />
        </div>
        <div className="max-w-[90%] sm:max-w-[85%] flex-1">
          <BiometricScanCard
            metrics={scanMetrics}
            opfsImagePath={message.metadata?.opfsImagePath}
            timestamp={message.timestamp}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={`flex animate-fade-in-up ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-xl bg-botanical flex items-center justify-center mr-2 flex-shrink-0 mt-0.5 shadow-xs">
          <Leaf size={13} className="text-rice-husk" />
        </div>
      )}
      <div
        className={[
          'max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed',
          isUser
            ? 'bg-botanical text-rice-husk rounded-br-xs shadow-xs'
            : 'bg-white text-slate shadow-xs rounded-bl-xs border border-slate/5',
        ].join(' ')}
      >
        <MarkdownContent content={message.content} isUser={isUser} />
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 animate-fade-in-up">
      <div className="w-7 h-7 rounded-xl bg-botanical flex items-center justify-center flex-shrink-0 shadow-xs">
        <Leaf size={13} className="text-rice-husk" />
      </div>
      <div className="bg-white rounded-2xl rounded-bl-xs px-4 py-3 shadow-xs flex gap-1.5 items-center border border-slate/5">
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-botanical/60 inline-block" />
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-botanical/60 inline-block" />
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-botanical/60 inline-block" />
      </div>
    </div>
  )
}
