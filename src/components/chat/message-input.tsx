"use client"

import * as React from "react"
import { ArrowUp, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const COMMAND_SUGGESTIONS = [
  { cmd: "/helpfs", desc: "Lista comandos locais" },
  { cmd: "/ls ", desc: "Lista arquivos da pasta" },
  { cmd: "/read ", desc: "Lê um arquivo" },
  { cmd: "/stat ", desc: "Mostra metadados do arquivo" },
  { cmd: "/mkdir ", desc: "Cria pasta (com aprovacao)" },
  { cmd: "/write ", desc: "Escreve arquivo (com aprovacao)" },
  { cmd: "/append ", desc: "Adiciona em arquivo (com aprovacao)" },
  { cmd: "/pending", desc: "Lista acoes pendentes" },
  { cmd: "/approve ", desc: "Aprova acao pendente" },
  { cmd: "/reject ", desc: "Rejeita acao pendente" },
]

interface MessageInputProps {
  onSendMessage: (content: string) => void
  disabled?: boolean
}

export function MessageInput({ onSendMessage, disabled }: MessageInputProps) {
  const [input, setInput] = React.useState("")
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const [showCommands, setShowCommands] = React.useState(false)

  const filteredCommands = React.useMemo(() => {
    const trimmed = input.trim()
    if (!trimmed.startsWith("/")) {
      return []
    }
    return COMMAND_SUGGESTIONS.filter((item) => item.cmd.startsWith(trimmed)).slice(0, 8)
  }, [input])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSendMessage(input.trim())
      setInput("")
      setShowCommands(false)
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }
  }

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  React.useEffect(() => {
    setShowCommands(filteredCommands.length > 0)
  }, [filteredCommands.length])

  const applyCommand = (command: string) => {
    setInput(command)
    setShowCommands(false)
    textareaRef.current?.focus()
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-8">
      <div className="relative">
        {showCommands && (
          <div className="absolute bottom-[calc(100%+10px)] left-0 right-0 rounded-xl border bg-background shadow-lg overflow-hidden z-20">
            {filteredCommands.map((item) => (
              <button
                key={item.cmd}
                type="button"
                className="w-full px-4 py-2.5 text-left hover:bg-muted/60 transition-colors"
                onClick={() => applyCommand(item.cmd)}
              >
                <div className="text-sm font-medium">{item.cmd}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </button>
            ))}
          </div>
        )}

        <div className="relative flex items-end gap-2 bg-[hsl(var(--msg-ai-bg))] border border-border rounded-[26px] p-1.5 shadow-sm transition-all focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full h-10 w-10 shrink-0 text-muted-foreground hover:bg-muted"
        >
          <Plus className="h-5 w-5" />
        </Button>
        
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask ChatClaude anything..."
          className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-2.5 px-2 text-[15px] max-h-[200px] custom-scrollbar"
          rows={1}
        />

        <Button
          onClick={handleSend}
          disabled={!input.trim() || disabled}
          size="icon"
          className={cn(
            "rounded-full h-10 w-10 shrink-0 transition-all duration-300",
            input.trim() ? "bg-primary text-primary-foreground animate-pulse-glow" : "bg-muted text-muted-foreground"
          )}
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      </div>
      </div>
      <p className="text-[11px] text-center text-muted-foreground mt-3">
        ChatClaude can make mistakes. Please verify important information.
      </p>
    </div>
  )
}
