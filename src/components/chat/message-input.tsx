"use client"

import * as React from "react"
import { ArrowUp, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MessageInputProps {
  onSendMessage: (content: string) => void
  disabled?: boolean
}

export function MessageInput({ onSendMessage, disabled }: MessageInputProps) {
  const [input, setInput] = React.useState("")
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

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

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-8">
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
          placeholder="Ask AetherFlow anything..."
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
      <p className="text-[11px] text-center text-muted-foreground mt-3">
        AetherFlow can make mistakes. Please verify important information.
      </p>
    </div>
  )
}
