"use client"

import * as React from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { ChatSession, Message, Artifact } from "@/types"
import { MessageBubble } from "@/components/chat/message-bubble"
import { MessageInput } from "@/components/chat/message-input"
import { ArtifactPanel } from "@/components/artifacts/artifact-panel"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Menu, Share2, Sparkles, MessageCircleCode, LogOut } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { CHAT_MODES, ChatMode } from "@/lib/chat-modes"

type SessionRow = {
  id: string
  title: string
  created_at: string
}

type MessageRow = {
  id: string
  session_id: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

type FeedbackRow = {
  message_id: string
  rating: "up" | "down"
}

const INITIAL_SESSIONS: ChatSession[] = [
  {
    id: "local-1",
    title: "Welcome to ChatClaude",
    createdAt: Date.now(),
    messages: [
      {
        id: "local-m1",
        role: "assistant",
        content: "Hello! I'm ChatClaude, your advanced AI collaborator. How can I help you build something amazing today?",
      },
    ],
  },
]

const DEFAULT_ASSISTANT_GREETING = "New session started. How can I help?"

function toSessionTitle(text: string): string {
  const trimmed = text.replace(/\s+/g, " ").trim()
  if (!trimmed) {
    return "New Chat"
  }
  return trimmed.length > 42 ? `${trimmed.slice(0, 42)}...` : trimmed
}

function mapDbToSessions(sessionRows: SessionRow[], messageRows: MessageRow[]): ChatSession[] {
  const messagesBySession = new Map<string, Message[]>()

  for (const row of messageRows) {
    if (!messagesBySession.has(row.session_id)) {
      messagesBySession.set(row.session_id, [])
    }
    messagesBySession.get(row.session_id)!.push({
      id: row.id,
      role: row.role,
      content: row.content,
    })
  }

  return sessionRows.map((row) => ({
    id: row.id,
    title: row.title,
    createdAt: new Date(row.created_at).getTime(),
    messages: messagesBySession.get(row.id) ?? [],
  }))
}

export default function Home() {
  const [sessions, setSessions] = React.useState<ChatSession[]>(INITIAL_SESSIONS)
  const [activeSessionId, setActiveSessionId] = React.useState<string>(INITIAL_SESSIONS[0].id)
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true)
  const [activeArtifact, setActiveArtifact] = React.useState<Artifact | null>(null)
  const [isArtifactPanelOpen, setIsArtifactPanelOpen] = React.useState(false)
  const [isThinking, setIsThinking] = React.useState(false)
  const [supabaseUserId, setSupabaseUserId] = React.useState<string | null>(null)
  const [authRequired, setAuthRequired] = React.useState(false)
  const [authLoading, setAuthLoading] = React.useState(false)
  const [authEmail, setAuthEmail] = React.useState("")
  const [authPassword, setAuthPassword] = React.useState("")
  const [chatMode, setChatMode] = React.useState<ChatMode>("coder")
  const [accountEmail, setAccountEmail] = React.useState<string>("")
  const [feedbackByMessageId, setFeedbackByMessageId] = React.useState<Record<string, "up" | "down">>({})
  const isMobile = useIsMobile()
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0]

  const persistMessage = React.useCallback(
    async (userId: string, sessionId: string, role: "user" | "assistant", content: string, skillsUsed: string[] = []) => {
      if (!supabase || !content.trim()) {
        return null
      }

      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          user_id: userId,
          session_id: sessionId,
          role,
          content,
          skills_used: skillsUsed,
        })
        .select("id")
        .single<{ id: string }>()

      if (error || !data) {
        return null
      }

      return data.id
    },
    []
  )

  const createSessionInDb = React.useCallback(
    async (userId: string, title: string, withGreeting = true): Promise<ChatSession | null> => {
      if (!supabase) {
        return null
      }

      const { data, error } = await supabase
        .from("chat_sessions")
        .insert({ user_id: userId, title })
        .select("id,title,created_at")
        .single<SessionRow>()

      if (error || !data) {
        throw new Error(error?.message ?? "Could not create chat session.")
      }

      const newSession: ChatSession = {
        id: data.id,
        title: data.title,
        createdAt: new Date(data.created_at).getTime(),
        messages: [],
      }

      if (withGreeting) {
        await persistMessage(userId, data.id, "assistant", DEFAULT_ASSISTANT_GREETING)
        newSession.messages.push({
          id: `local-greeting-${Date.now()}`,
          role: "assistant",
          content: DEFAULT_ASSISTANT_GREETING,
        })
      }

      return newSession
    },
    [persistMessage]
  )

  const loadUserChats = React.useCallback(
    async (userId: string) => {
      if (!supabase) {
        return
      }

      const sessionsRes = await supabase
        .from("chat_sessions")
        .select("id,title,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (sessionsRes.error) {
        throw sessionsRes.error
      }

      const messagesRes = await supabase
        .from("chat_messages")
        .select("id,session_id,role,content,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })

      if (messagesRes.error) {
        throw messagesRes.error
      }

      const loadedSessions = mapDbToSessions(
        (sessionsRes.data ?? []) as SessionRow[],
        (messagesRes.data ?? []) as MessageRow[]
      )

      const feedbackRes = await supabase
        .from("chat_message_feedback")
        .select("message_id,rating")
        .eq("user_id", userId)

      if (!feedbackRes.error) {
        const map: Record<string, "up" | "down"> = {}
        for (const row of (feedbackRes.data ?? []) as FeedbackRow[]) {
          if (row.rating === "up" || row.rating === "down") {
            map[row.message_id] = row.rating
          }
        }
        setFeedbackByMessageId(map)
      }

      if (loadedSessions.length > 0) {
        setSessions(loadedSessions)
        setActiveSessionId(loadedSessions[0].id)
        return
      }

      const created = await createSessionInDb(userId, "New Chat", true)
      if (!created) {
        return
      }

      setSessions([created])
      setActiveSessionId(created.id)
    },
    [createSessionInDb]
  )

  React.useEffect(() => {
    if (isMobile) setIsSidebarOpen(false)
    else setIsSidebarOpen(true)
  }, [isMobile])

  React.useEffect(() => {
    if (scrollRef.current && activeSession) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [activeSession, isThinking])

  React.useEffect(() => {
    let cancelled = false

    async function bootstrapSupabase() {
      if (!isSupabaseConfigured || !supabase) {
        return
      }

      try {
        setAuthLoading(true)
        const userRes = await supabase.auth.getUser()
        const user = userRes.data.user

        if (!user) {
          if (!cancelled) {
            setAuthRequired(true)
            setSupabaseUserId(null)
          }
          return
        }

        if (cancelled) {
          return
        }

        setAuthRequired(false)
        setSupabaseUserId(user.id)
        setAccountEmail(user.email ?? user.id)
        await loadUserChats(user.id)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Supabase initialization failed."
        toast({
          title: "Supabase pendente",
          description: `${message} Execute o SQL em supabase/schema.sql para ativar persistência.`,
        })
      } finally {
        if (!cancelled) {
          setAuthLoading(false)
        }
      }
    }

    bootstrapSupabase()

    return () => {
      cancelled = true
    }
  }, [loadUserChats, toast])

  const handleEmailLogin = async () => {
    if (!supabase || !authEmail.trim() || !authPassword.trim()) {
      return
    }

    setAuthLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail.trim(),
      password: authPassword,
    })
    if (error) {
      setAuthLoading(false)
      toast({ title: "Falha no login", description: error.message })
      return
    }

    const userRes = await supabase.auth.getUser()
    const user = userRes.data.user
    if (!user) {
      setAuthLoading(false)
      toast({ title: "Falha no login", description: "Usuario nao encontrado apos autenticacao." })
      return
    }

    setSupabaseUserId(user.id)
    setAccountEmail(user.email ?? user.id)
    setAuthRequired(false)
    await loadUserChats(user.id)
    setAuthLoading(false)
  }

  const handleEmailSignUp = async () => {
    if (!supabase || !authEmail.trim() || !authPassword.trim()) {
      return
    }

    setAuthLoading(true)
    const { error } = await supabase.auth.signUp({
      email: authEmail.trim(),
      password: authPassword,
    })
    if (error) {
      setAuthLoading(false)
      toast({ title: "Falha no cadastro", description: error.message })
      return
    }

    toast({
      title: "Cadastro iniciado",
      description: "Conta criada. Se o projeto pedir confirmacao por email, valide sua caixa de entrada.",
    })
    setAuthLoading(false)
  }

  const handleSignOut = async () => {
    if (!supabase) {
      return
    }
    await supabase.auth.signOut()
    setSupabaseUserId(null)
    setAccountEmail("")
    setFeedbackByMessageId({})
    setAuthRequired(true)
    setSessions(INITIAL_SESSIONS)
    setActiveSessionId(INITIAL_SESSIONS[0].id)
  }

  const renameSessionInDb = React.useCallback(async (sessionId: string, title: string) => {
    if (!supabaseUserId || !supabase) {
      return
    }
    await supabase
      .from("chat_sessions")
      .update({ title })
      .eq("id", sessionId)
      .eq("user_id", supabaseUserId)
  }, [supabaseUserId])

  const handleRenameSession = React.useCallback(async (sessionId: string) => {
    const current = sessions.find((s) => s.id === sessionId)
    const nextTitle = window.prompt("Novo nome do chat:", current?.title ?? "New Chat")
    if (!nextTitle) {
      return
    }

    const cleanTitle = toSessionTitle(nextTitle)
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? { ...session, title: cleanTitle }
          : session
      )
    )

    await renameSessionInDb(sessionId, cleanTitle)
  }, [renameSessionInDb, sessions])

  const ensureAnySession = React.useCallback(async () => {
    if (sessions.length > 0) {
      return
    }
    if (!supabaseUserId) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: "New Chat",
        messages: [{
          id: "m-init",
          role: "assistant",
          content: DEFAULT_ASSISTANT_GREETING,
        }],
        createdAt: Date.now(),
      }
      setSessions([newSession])
      setActiveSessionId(newSession.id)
      return
    }
    const created = await createSessionInDb(supabaseUserId, "New Chat", true)
    if (created) {
      setSessions([created])
      setActiveSessionId(created.id)
    }
  }, [createSessionInDb, sessions.length, supabaseUserId])

  const handleDeleteSession = React.useCallback(async (sessionId: string) => {
    const target = sessions.find((s) => s.id === sessionId)
    const ok = window.confirm(`Excluir o chat \"${target?.title ?? "New Chat"}\"?`)
    if (!ok) {
      return
    }

    const remaining = sessions.filter((s) => s.id !== sessionId)
    setSessions(remaining)

    if (activeSessionId === sessionId) {
      setActiveSessionId(remaining[0]?.id ?? "")
    }

    if (supabaseUserId && supabase) {
      await supabase
        .from("chat_sessions")
        .delete()
        .eq("id", sessionId)
        .eq("user_id", supabaseUserId)
    }

    if (remaining.length === 0) {
      await ensureAnySession()
    }
  }, [activeSessionId, ensureAnySession, sessions, supabase, supabaseUserId])

  const updateAssistantMessage = React.useCallback(
    (sessionId: string, messageId: string, updater: (current: string) => string) => {
      setSessions((prev) =>
        prev.map((session) => {
          if (session.id !== sessionId) {
            return session
          }

          return {
            ...session,
            messages: session.messages.map((message) => {
              if (message.id !== messageId) {
                return message
              }
              return {
                ...message,
                content: updater(message.content),
              }
            }),
          }
        })
      )
    },
    []
  )

  const replaceMessageId = React.useCallback((sessionId: string, oldId: string, nextId: string) => {
    setSessions((prev) =>
      prev.map((session) => {
        if (session.id !== sessionId) {
          return session
        }
        return {
          ...session,
          messages: session.messages.map((message) =>
            message.id === oldId ? { ...message, id: nextId } : message
          ),
        }
      })
    )
  }, [])

  const handleMessageFeedback = React.useCallback(async (messageId: string, rating: "up" | "down") => {
    setFeedbackByMessageId((prev) => ({ ...prev, [messageId]: rating }))
    if (!supabase || !supabaseUserId) {
      return
    }
    await supabase.from("chat_message_feedback").upsert(
      {
        user_id: supabaseUserId,
        message_id: messageId,
        rating,
      },
      { onConflict: "user_id,message_id" }
    )
  }, [supabaseUserId])

  const handleSendMessage = async (content: string) => {
    const sessionId = activeSessionId
    const currentSession = sessions.find((session) => session.id === sessionId)
    if (!currentSession) {
      return
    }

    const userMsg: Message = { id: Date.now().toString(), role: "user", content }
    const assistantId = `a-${Date.now()}`
    const history = currentSession.messages
      .filter((message) => !message.isThinking)
      .map((message) => ({
        role: message.role,
        content: message.content,
      }))
      .slice(-12)

    const shouldAutoTitle = currentSession.title === "New Chat" && history.filter((m) => m.role === "user").length === 0
    if (shouldAutoTitle) {
      const generatedTitle = toSessionTitle(content)
      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId ? { ...session, title: generatedTitle } : session
        )
      )
      await renameSessionInDb(sessionId, generatedTitle)
    }

    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              messages: [...session.messages, userMsg, { id: assistantId, role: "assistant", content: "" }],
            }
          : session
      )
    )

    if (supabaseUserId) {
      const savedUserId = await persistMessage(supabaseUserId, sessionId, "user", content)
      if (savedUserId) {
        replaceMessageId(sessionId, userMsg.id, savedUserId)
      }
    }

    setIsThinking(true)

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          history: [...history, { role: "user", content }],
          mode: chatMode,
        }),
      })

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error ?? 'Chat stream request failed.')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let skillsUsed: string[] = []
      let assistantText = ""

      while (true) {
        const { value, done } = await reader.read()
        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.trim()) {
            continue
          }

          const payload = JSON.parse(line) as {
            type: 'meta' | 'delta' | 'done' | 'error'
            text?: string
            error?: string
            skillsUsed?: string[]
          }

          if (payload.type === 'meta') {
            skillsUsed = Array.isArray(payload.skillsUsed) ? payload.skillsUsed : []
            continue
          }

          if (payload.type === 'delta') {
            const chunk = payload.text ?? ''
            assistantText += chunk
            updateAssistantMessage(sessionId, assistantId, (current) => `${current}${chunk}`)
            continue
          }

          if (payload.type === 'error') {
            throw new Error(payload.error ?? 'Unknown streaming error.')
          }

          if (payload.type === 'done' && skillsUsed.length > 0) {
            const suffix = `\n\nSkills utilizados: ${skillsUsed.join(', ')}`
            assistantText += suffix
            updateAssistantMessage(sessionId, assistantId, (current) => `${current}${suffix}`)
          }
        }
      }

      if (supabaseUserId) {
        const savedAssistantId = await persistMessage(supabaseUserId, sessionId, "assistant", assistantText, skillsUsed)
        if (savedAssistantId) {
          replaceMessageId(sessionId, assistantId, savedAssistantId)
        }
      }
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : 'Unknown error.'
      const fallback = `Erro ao chamar a IA: ${errMessage}`
      updateAssistantMessage(sessionId, assistantId, () => fallback)
      if (supabaseUserId) {
        const savedAssistantId = await persistMessage(supabaseUserId, sessionId, "assistant", fallback)
        if (savedAssistantId) {
          replaceMessageId(sessionId, assistantId, savedAssistantId)
        }
      }
    }

    setIsThinking(false)
  }

  const handleNewChat = async () => {
    let newSession: ChatSession

    if (supabaseUserId) {
      try {
        const created = await createSessionInDb(supabaseUserId, "New Chat", true)
        if (!created) {
          throw new Error("Could not initialize new persisted chat.")
        }
        newSession = created
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create new chat."
        toast({ title: "Erro ao criar chat", description: message })
        return
      }
    } else {
      newSession = {
        id: Date.now().toString(),
        title: "New Chat",
        messages: [{
          id: "m-init",
          role: "assistant",
          content: DEFAULT_ASSISTANT_GREETING,
        }],
        createdAt: Date.now(),
      }
    }

    setSessions((prev) => [newSession, ...prev])
    setActiveSessionId(newSession.id)
    if (isMobile) setIsSidebarOpen(false)
  }

  if (isSupabaseConfigured && authRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm space-y-4">
          <h1 className="text-xl font-semibold">Entrar no ChatClaude</h1>
          <p className="text-sm text-muted-foreground">Use email e senha para acessar seus chats salvos.</p>
          <Input
            type="email"
            placeholder="voce@email.com"
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
            disabled={authLoading}
          />
          <Input
            type="password"
            placeholder="Sua senha"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            disabled={authLoading}
          />
          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleEmailLogin} disabled={authLoading}>
              Entrar
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleEmailSignUp} disabled={authLoading}>
              Cadastrar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Se ainda nao executou, rode o SQL em <code>supabase/schema.sql</code>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Mobile Drawer Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60]" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed md:relative z-[70] h-full transition-all duration-300 ease-in-out",
          isSidebarOpen ? "w-[280px] translate-x-0" : "w-0 -translate-x-full md:translate-x-0 overflow-hidden"
        )}
      >
        <Sidebar 
          sessions={sessions} 
          activeSessionId={activeSessionId}
          onNewChat={handleNewChat}
          onRenameSession={handleRenameSession}
          onDeleteSession={handleDeleteSession}
          accountLabel={accountEmail || (supabaseUserId ? "Conta conectada" : "Conta local")}
          onSelectSession={(id) => {
            setActiveSessionId(id)
            if (isMobile) setIsSidebarOpen(false)
          }}
          onToggleSidebar={() => setIsSidebarOpen(false)}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Top Header */}
        <header className="h-14 border-b flex items-center justify-between px-4 bg-background/80 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setIsSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <div className="flex items-center gap-2">
               <span className="text-sm font-semibold truncate max-w-[200px]">{activeSession?.title ?? "New Chat"}</span>
               <div className="px-1.5 py-0.5 rounded-md bg-primary/10 text-[10px] text-primary font-bold">V4.0</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={chatMode} onValueChange={(value) => setChatMode(value as ChatMode)}>
              <SelectTrigger className="h-8 w-[120px] text-xs">
                <SelectValue placeholder="Modo" />
              </SelectTrigger>
              <SelectContent>
                {CHAT_MODES.map((mode) => (
                  <SelectItem key={mode.value} value={mode.value}>
                    {mode.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "h-9 gap-2 text-xs transition-all",
                isArtifactPanelOpen ? "text-primary bg-primary/10" : "text-muted-foreground"
              )}
              onClick={() => setIsArtifactPanelOpen(!isArtifactPanelOpen)}
            >
              <MessageCircleCode className="h-4 w-4" />
              <span className="hidden sm:inline">Artifacts</span>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <ThemeToggle />
            {supabaseUserId ? (
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground">
                <Share2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </header>

        {/* Chat Scroll Area */}
        <div className="flex-1 overflow-hidden relative">
          <ScrollArea ref={scrollRef} className="h-full custom-scrollbar">
            <div className="flex flex-col gap-2 pt-10 pb-32">
              {(activeSession?.messages.length ?? 0) === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-700">
                  <div className="w-20 h-20 bg-primary/10 rounded-[30px] flex items-center justify-center mb-6 animate-pulse-glow">
                    <Sparkles className="h-10 w-10 text-primary" />
                  </div>
                  <h1 className="text-3xl font-bold mb-2">How can I help you?</h1>
                  <p className="text-muted-foreground max-w-sm">I'm ChatClaude, your creative AI partner. Ask me to code, write, or solve complex problems.</p>
                </div>
              )}
              {(activeSession?.messages ?? []).map((msg) => (
                <MessageBubble 
                  key={msg.id} 
                  message={msg} 
                  feedback={feedbackByMessageId[msg.id] ?? null}
                  onFeedback={
                    msg.role === "assistant" && !msg.id.startsWith("local-") && !msg.id.startsWith("a-")
                      ? (value) => void handleMessageFeedback(msg.id, value)
                      : undefined
                  }
                  onOpenArtifact={() => {
                    if (msg.artifact) {
                      setActiveArtifact(msg.artifact)
                      setIsArtifactPanelOpen(true)
                    }
                  }}
                />
              ))}
            </div>
          </ScrollArea>

          {/* Bottom Gradient Fade */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
        </div>

        {/* Message Input Container */}
        <div className="sticky bottom-0 bg-transparent z-40">
          <MessageInput onSendMessage={handleSendMessage} disabled={isThinking || !activeSession} />
        </div>
      </main>

      {/* Artifact Panel */}
      <ArtifactPanel 
        artifact={activeArtifact} 
        isOpen={isArtifactPanelOpen} 
        onClose={() => setIsArtifactPanelOpen(false)} 
      />
    </div>
  )
}
