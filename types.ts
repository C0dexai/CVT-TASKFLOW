export interface Agent {
  name: string;
  gender: string;
  role: string;
  skills: string[];
  voice_style: string;
  personality: string;
  personality_prompt: string;
}

export interface AgentFamily {
  organization: string;
  headquarters: string;
  creed: string;
  members: Agent[];
  protocols: {
    orchestration: string;
    loyalty: string;
    motto: string;
  };
  colors: {
    primary: string;
    accent: string;
    neutral: string;
  };
  logo: string;
  anthem: string;
}

export interface Task {
  id: string;
  content: string;
  agentName: string;
  stage: string;
}

export type KanbanColumnId = 'Backlog' | 'To Do' | 'In Progress' | 'Review' | 'Done';

export interface Suggestion {
  suggestedAgent: string;
  nextAction: string;
}

export type Tab = 'KANBAN' | 'AI Family' | 'Calendar' | 'Memory' | 'Console' | 'Settings' | 'Integrations';

export interface CalendarNote {
  id: string;
  date: string; // YYYY-MM-DD
  content: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
}

export type MemoryType = 'TASK_CREATION' | 'TASK_HANDOFF' | 'CONVERSATION' | 'SKILL_UPDATE' | 'NOTE_CREATION' | 'NOTE_DELETE';

export interface MemoryEntry {
  id: string;
  timestamp: string; // ISO string
  type: MemoryType;
  agentName: string | null; // Can be null for system-level events
  summary: string;
  details?: Record<string, any>;
}

export interface OrchestrationResponse {
  responseText: string;
  newTask?: Omit<Task, 'id' | 'stage'>;
}