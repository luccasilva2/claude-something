"use client"

import { Message } from "@/types"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Code2, ThumbsDown, ThumbsUp, User } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MessageBubbleProps {
  message: Message
  onOpenArtifact?: () => void
  feedback?: "up" | "down" | null
  onFeedback?: (value: "up" | "down") => void
}

export function MessageBubble({ message, onOpenArtifact, feedback, onFeedback }: MessageBubbleProps) {
  const isAI = message.role === "assistant"

  return (
    <div
      className={cn(
        "flex w-full max-w-4xl mx-auto gap-4 py-6 px-4 animate-in fade-in slide-in-from-bottom-2 duration-500",
        isAI ? "flex-row" : "flex-row-reverse"
      )}
    >
      <Avatar className={cn("h-8 w-8 shrink-0 border", isAI ? "border-primary/20" : "border-accent/20")}>
        {isAI ? (
          <>
            <AvatarImage src="https://picsum.photos/seed/chatclaude/100/100" />
            <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">CC</AvatarFallback>
          </>
        ) : (
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            <User className="h-4 w-4" />
          </AvatarFallback>
        )}
      </Avatar>

      <div className={cn("flex flex-col gap-2 max-w-[85%]", isAI ? "items-start" : "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed",
            isAI
              ? "bg-[hsl(var(--msg-ai-bg))] text-foreground shadow-sm"
              : "bg-[hsl(var(--msg-user-bg))] text-foreground shadow-md"
          )}
        >
          {message.isThinking ? (
            <div className="flex gap-1.5 py-1 items-center">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
        </div>

        {message.artifact && !message.isThinking && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenArtifact}
            className="mt-1 gap-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all glow-on-hover"
          >
            <Code2 className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium">View Artifact: {message.artifact.title}</span>
          </Button>
        )}

        {isAI && !message.isThinking && onFeedback && (
          <div className="flex items-center gap-1 mt-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("h-7 w-7", feedback === "up" ? "bg-muted" : "")}
              onClick={() => onFeedback("up")}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("h-7 w-7", feedback === "down" ? "bg-muted" : "")}
              onClick={() => onFeedback("down")}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
