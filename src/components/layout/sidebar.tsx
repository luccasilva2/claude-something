"use client"

import * as React from "react"
import { Plus, MessageSquare, Settings, ChevronLeft, Edit3, Trash2, UserCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatSession } from "@/types"

interface SidebarProps {
  sessions: ChatSession[]
  activeSessionId?: string
  onNewChat: () => void
  onSelectSession: (id: string) => void
  onRenameSession: (id: string) => void
  onDeleteSession: (id: string) => void
  onToggleSidebar?: () => void
  accountLabel?: string
  className?: string
}

export function Sidebar({ 
  sessions, 
  activeSessionId, 
  onNewChat, 
  onSelectSession,
  onRenameSession,
  onDeleteSession,
  onToggleSidebar,
  accountLabel,
  className 
}: SidebarProps) {
  return (
    <div className={cn("flex flex-col h-full bg-sidebar border-r text-sidebar-foreground w-[280px]", className)}>
      <div className="p-4 flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg group-hover:scale-110 transition-transform">
            CC
          </div>
          <span className="font-bold text-xl tracking-tight">ChatClaude</span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onToggleSidebar}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="px-4 mb-6">
        <Button 
          onClick={onNewChat}
          className="w-full justify-start gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-6 shadow-md shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-5 w-5" />
          <span className="font-semibold">New Chat</span>
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 mb-4">
        <div className="space-y-6">
          <div>
            <h3 className="px-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">Recent Chats</h3>
            <div className="space-y-0.5">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all group relative overflow-hidden",
                    activeSessionId === session.id 
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm" 
                      : "hover:bg-sidebar-accent/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <MessageSquare className={cn("h-4 w-4 shrink-0", activeSessionId === session.id ? "text-primary" : "text-muted-foreground/50")} />
                  <span className="truncate flex-1 text-left">{session.title}</span>

                  <span className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation()
                        onRenameSession(session.id)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          e.stopPropagation()
                          onRenameSession(session.id)
                        }
                      }}
                      className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-muted/60"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteSession(session.id)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          e.stopPropagation()
                          onDeleteSession(session.id)
                        }
                      }}
                      className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-muted/60"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </span>
                  </span>

                  {activeSessionId === session.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 bg-muted/20 border-t">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-sidebar-accent transition-all group">
          <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden border">
            <UserCircle2 className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 text-left overflow-hidden">
            <p className="text-sm font-semibold truncate">Configuracoes da conta</p>
            <p className="text-[11px] text-muted-foreground truncate">{accountLabel ?? "Conta local"}</p>
          </div>
          <Settings className="h-4 w-4 text-muted-foreground group-hover:rotate-45 transition-transform" />
        </button>
      </div>
    </div>
  )
}
