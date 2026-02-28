"use client"

import * as React from "react"
import { Artifact } from "@/types"
import { X, Code, Eye, Copy, Share2, Edit2, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface ArtifactPanelProps {
  artifact: Artifact | null
  isOpen: boolean
  onClose: () => void
}

export function ArtifactPanel({ artifact, isOpen, onClose }: ArtifactPanelProps) {
  if (!artifact) return null

  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 z-50 w-full md:w-[600px] lg:w-[800px] bg-background border-l transform transition-transform duration-500 ease-in-out artifact-panel-shadow",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      <div className="flex flex-col h-full">
        <header className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Code className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold truncate max-w-[300px]">{artifact.title}</h2>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                {artifact.type === 'interactive-ui' ? 'Interactive App' : 'Code Snippet'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <Tabs defaultValue="preview" className="flex-1 flex flex-col">
            <div className="px-6 py-2 border-b flex items-center justify-between bg-muted/30">
              <TabsList className="bg-transparent gap-2 h-auto p-0">
                <TabsTrigger
                  value="preview"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-3 py-1.5 text-xs font-medium transition-all"
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  Preview
                </TabsTrigger>
                <TabsTrigger
                  value="code"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-3 py-1.5 text-xs font-medium transition-all"
                >
                  <Code className="h-3.5 w-3.5 mr-1.5" />
                  Code
                </TabsTrigger>
                <TabsTrigger
                  value="edit"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-3 py-1.5 text-xs font-medium transition-all"
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                  AI-Edit
                </TabsTrigger>
              </TabsList>
              
              <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs font-medium text-muted-foreground hover:text-foreground">
                <Copy className="h-3.5 w-3.5" />
                Copy
              </Button>
            </div>

            <TabsContent value="preview" className="flex-1 mt-0 relative min-h-0 overflow-hidden bg-white dark:bg-zinc-950">
               {artifact.type === 'interactive-ui' ? (
                 <div className="w-full h-full p-8 flex flex-col items-center justify-center text-center">
                    <div className="max-w-md w-full animate-in zoom-in duration-500">
                      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Play className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold mb-3">Aether-Powered Preview</h3>
                      <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                        This is a simulated interactive interface for <b>{artifact.title}</b>.
                        In a production environment, this would render the generated React/HTML components in a secure sandbox.
                      </p>
                      <div className="p-6 border rounded-xl bg-card shadow-sm border-primary/20">
                         <div className="h-4 bg-muted rounded w-3/4 mb-4" />
                         <div className="h-24 bg-muted/50 rounded w-full mb-4" />
                         <div className="flex gap-2">
                            <div className="h-8 bg-primary rounded w-20" />
                            <div className="h-8 bg-muted rounded w-20" />
                         </div>
                      </div>
                    </div>
                 </div>
               ) : (
                 <div className="w-full h-full p-8 flex items-center justify-center italic text-muted-foreground">
                    Preview not available for raw code artifacts.
                 </div>
               )}
            </TabsContent>

            <TabsContent value="code" className="flex-1 mt-0 bg-zinc-900 text-zinc-100 font-mono text-sm min-h-0">
               <ScrollArea className="h-full">
                  <pre className="p-6">
                    <code>{artifact.content}</code>
                  </pre>
               </ScrollArea>
            </TabsContent>

            <TabsContent value="edit" className="flex-1 mt-0 p-8 flex flex-col items-center justify-center text-center">
                <div className="max-w-sm">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Edit2 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Smart Refinement</h3>
                  <p className="text-sm text-muted-foreground">
                    Ask me to change colors, add features, or fix bugs in this artifact directly from the chat.
                  </p>
                </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
