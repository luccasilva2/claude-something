export type Role = 'user' | 'assistant';

export interface Artifact {
  id: string;
  type: 'code' | 'interactive-ui' | 'text';
  title: string;
  content: string;
  language?: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  artifact?: Artifact;
  isThinking?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  sessions: string[]; // array of session IDs
}
