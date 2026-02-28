"use client"

import * as React from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { ChatSession, Message, Project, Artifact } from "@/types"
import { MessageBubble } from "@/components/chat/message-bubble"
import { MessageInput } from "@/components/chat/message-input"
import { ArtifactPanel } from "@/components/artifacts/artifact-panel"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Menu, Share2, Sparkles, MessageCircleCode } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

const INITIAL_SESSIONS: ChatSession[] = [
  {
    id: "1",
    title: "Welcome to AetherFlow",
    createdAt: Date.now(),
    messages: [
      {
        id: "m1",
        role: "assistant",
        content: "Hello! I'm AetherFlow, your advanced AI collaborator. How can I help you build something amazing today?",
      },
    ],
  },
  {
    id: "2",
    title: "Design a Dashboard",
    createdAt: Date.now() - 1000 * 60 * 60,
    messages: [],
  }
]

const INITIAL_PROJECTS: Project[] = [
  { id: "p1", name: "Nebula UI Library", description: "Design components", sessions: [] },
  { id: "p2", name: "AI Marketing Site", description: "Copy and landing page", sessions: [] }
]

export default function Home() {
  const [sessions, setSessions] = React.useState<ChatSession[]>(INITIAL_SESSIONS)
  const [activeSessionId, setActiveSessionId] = React.useState<string>(INITIAL_SESSIONS[0].id)
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true)
  const [activeArtifact, setActiveArtifact] = React.useState<Artifact | null>(null)
  const [isArtifactPanelOpen, setIsArtifactPanelOpen] = React.useState(false)
  const [isThinking, setIsThinking] = React.useState(false)
  const isMobile = useIsMobile()
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0]

  React.useEffect(() => {
    if (isMobile) setIsSidebarOpen(false)
    else setIsSidebarOpen(true)
  }, [isMobile])

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [activeSession.messages, isThinking])

  const handleSendMessage = async (content: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: "user", content }
    
    // Update local state with user message
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, userMsg] } : s))
    
    // Simulate AI response
    setIsThinking(true)
    
    // Artificial delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    let artifact: Artifact | undefined
    let responseText = "That's an interesting request. Here is what I can do for you."
    
    if (content.toLowerCase().includes("dashboard") || content.toLowerCase().includes("ui") || content.toLowerCase().includes("code")) {
      artifact = {
        id: "art-" + Date.now(),
        type: content.toLowerCase().includes("dashboard") ? "interactive-ui" : "code",
        title: content.toLowerCase().includes("dashboard") ? "Analytics Dashboard Core" : "Utility Script",
        content: content.toLowerCase().includes("dashboard") 
          ? `// Generated Dashboard Component\nimport React from 'react';\n\nexport default function Dashboard() {\n  return <div>My AI Dashboard</div>;\n}`
          : `const compute = (data) => {\n  return data.map(item => item * 2);\n};\n\nconsole.log(compute([1, 2, 3]));`,
        language: "typescript"
      }
      responseText = `I've generated a ${artifact.type === 'interactive-ui' ? 'UI layout' : 'code snippet'} for your request. You can view and edit it in the artifacts panel to the right.`
    }

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: responseText,
      artifact
    }

    setIsThinking(false)
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, aiMsg] } : s))
    
    if (artifact) {
      setActiveArtifact(artifact)
      setIsArtifactPanelOpen(true)
    }
  }

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [{
        id: "m-init",
        role: "assistant",
        content: "New session started. How can I help?",
      }],
      createdAt: Date.now()
    }
    setSessions([newSession, ...sessions])
    setActiveSessionId(newSession.id)
    if (isMobile) setIsSidebarOpen(false)
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
          projects={INITIAL_PROJECTS}
          activeSessionId={activeSessionId}
          onNewChat={handleNewChat}
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
               <span className="text-sm font-semibold truncate max-w-[200px]">{activeSession.title}</span>
               <div className="px-1.5 py-0.5 rounded-md bg-primary/10 text-[10px] text-primary font-bold">V4.0</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
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
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Chat Scroll Area */}
        <div className="flex-1 overflow-hidden relative">
          <ScrollArea ref={scrollRef} className="h-full custom-scrollbar">
            <div className="flex flex-col gap-2 pt-10 pb-32">
              {activeSession.messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-700">
                  <div className="w-20 h-20 bg-primary/10 rounded-[30px] flex items-center justify-center mb-6 animate-pulse-glow">
                    <Sparkles className="h-10 w-10 text-primary" />
                  </div>
                  <h1 className="text-3xl font-bold mb-2">How can I help you?</h1>
                  <p className="text-muted-foreground max-w-sm">I'm AetherFlow, your creative AI partner. Ask me to code, write, or solve complex problems.</p>
                </div>
              )}
              {activeSession.messages.map((msg) => (
                <MessageBubble 
                  key={msg.id} 
                  message={msg} 
                  onOpenArtifact={() => {
                    if (msg.artifact) {
                      setActiveArtifact(msg.artifact)
                      setIsArtifactPanelOpen(true)
                    }
                  }}
                />
              ))}
              {isThinking && (
                <MessageBubble 
                  message={{ 
                    id: "thinking", 
                    role: "assistant", 
                    content: "", 
                    isThinking: true 
                  }} 
                />
              )}
            </div>
          </ScrollArea>

          {/* Bottom Gradient Fade */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
        </div>

        {/* Message Input Container */}
        <div className="sticky bottom-0 bg-transparent z-40">
          <MessageInput onSendMessage={handleSendMessage} disabled={isThinking} />
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
