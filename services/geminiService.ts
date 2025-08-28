import { GoogleGenAI, Type, GenerateContentResponse, Content } from "@google/genai";
import { AGENT_PROFILE } from '../constants/agentProfile';
import { TASKFLOW_STAGES } from '../constants';
import { Task, Suggestion, CalendarNote, Agent, MemoryEntry, OrchestrationResponse } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = "gemini-2.5-flash";

const formatMemoriesForPrompt = (memories: MemoryEntry[]): string => {
    if (memories.length === 0) {
        return "No recent activity logged.";
    }
    // Take the last 5 memories, format them concisely
    return memories.slice(-10).map(mem => `- ${new Date(mem.timestamp).toLocaleString()}: [${mem.type}] ${mem.summary}`).join('\n');
};


export const generateInitialTasks = async (agents: Agent[]): Promise<Task[]> => {
  const agentNames = agents.map(m => m.name);
  const currentAgentProfile = { ...AGENT_PROFILE, members: agents };
  
  const prompt = `
    You are the master orchestrator for a clandestine tech crew called CASSA VEGAS. Your job is to generate a list of initial tasks for the crew's KANBAN board.

    Here is the crew's current profile:
    ${JSON.stringify(currentAgentProfile, null, 2)}

    Here are the workflow stages:
    ${JSON.stringify(TASKFLOW_STAGES)}

    Based on the crew's skills and roles, generate 5-7 tasks that align with their operations (e.g., cybersecurity, system architecture, data analysis, infiltration, planning).

    For each task:
    1.  Write a concise, action-oriented description (under 15 words).
    2.  Assign it to the MOST appropriate agent from the 'members' list. Use their 'name'.
    3.  Place it in the 'Backlog' stage.

    Return the result as a JSON array.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              content: { type: Type.STRING, description: 'The concise task description.' },
              agentName: { type: Type.STRING, description: 'Name of the assigned agent.', enum: agentNames },
              stage: { type: Type.STRING, description: 'The initial stage of the task.', enum: ['Backlog'] }
            },
            required: ["content", "agentName", "stage"]
          }
        }
      }
    });

    const jsonText = response.text.trim();
    const tasks = JSON.parse(jsonText);
    
    return tasks.map((task: Omit<Task, 'id'>) => ({
        ...task,
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    }));

  } catch (error) {
    console.error("Error generating initial tasks:", error);
    return [];
  }
};


export const getHandOffSuggestion = async (task: Task, sourceStage: string, destinationStage: string, agents: Agent[], memories: MemoryEntry[]): Promise<Suggestion | null> => {
    const agentNames = agents.map(m => m.name);
    const prompt = `
        You are an AI assistant for the CASSA VEGAS tech crew. A task has just been moved on the KANBAN board. Your job is to analyze the move and suggest the next step, using recent events for context.

        Crew Profile (Name and Skills):
        ${JSON.stringify(agents.map(m => ({ name: m.name, skills: m.skills, role: m.role })), null, 2)}

        Task Details:
        - Content: "${task.content}"
        - Current Agent: "${task.agentName}"
        - Moved from stage: "${sourceStage}"
        - Moved to stage: "${destinationStage}"

        Recent Activity Log (for context):
        ${formatMemoriesForPrompt(memories)}

        Analyze this transition. Based on the new stage ('${destinationStage}'), the crew's skills, and the recent activity, is '${task.agentName}' still the right person for the job? Or should it be handed off to someone else from the crew? What is the single most important next action to take for this task in its new stage?

        Provide your analysis in a JSON object.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestedAgent: {
                            type: Type.STRING,
                            description: "The name of the agent who should now own the task. This can be the current agent or a new one.",
                            enum: agentNames,
                        },
                        nextAction: {
                            type: Type.STRING,
                            description: "A very brief, actionable next step for the task (under 10 words)."
                        }
                    },
                    required: ["suggestedAgent", "nextAction"]
                }
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as Suggestion;
    } catch (error) {
        console.error("Error getting hand-off suggestion:", error);
        return null;
    }
};

export const generateTaskFromNote = async (note: CalendarNote, agents: Agent[], memories: MemoryEntry[]): Promise<Pick<Task, 'content' | 'agentName'>> => {
    const agentNames = agents.map(m => m.name);
    const prompt = `
        You are an AI assistant for the CASSA VEGAS tech crew, acting as the master orchestrator. A crew member left a note on the calendar for the date ${note.date}. Your job is to convert this note into a concrete, actionable task for the Kanban board, considering recent events.

        Crew Profile (Name, Role, Skills):
        ${JSON.stringify(agents.map(m => ({ name: m.name, role: m.role, skills: m.skills })), null, 2)}

        Calendar Note Content:
        "${note.content}"
        
        Recent Activity Log (for context):
        ${formatMemoriesForPrompt(memories)}

        Based on the note, the crew's skills, and recent activity:
        1.  Create a concise, actionable task description (under 15 words).
        2.  Assign it to the MOST appropriate agent from the crew.

        Return a single JSON object with the keys "content" and "agentName".
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        content: { type: Type.STRING, description: 'The concise, actionable task description.' },
                        agentName: { type: Type.STRING, description: 'Name of the agent best suited for the task.', enum: agentNames }
                    },
                    required: ["content", "agentName"]
                }
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error generating task from note:", error);
        return {
            content: `Address calendar note: ${note.content.substring(0, 20)}...`,
            agentName: "Andoy"
        };
    }
};

export const suggestSkills = async (agent: Agent, memories: MemoryEntry[]): Promise<string[]> => {
    const prompt = `
        You are an AI assistant for the CASSA VEGAS tech crew. Your job is to suggest new, relevant skills for a crew member based on their profile and recent crew activities. Do not suggest skills they already have.

        Agent Profile:
        - Name: "${agent.name}"
        - Role: "${agent.role}"
        - Current Skills: ${JSON.stringify(agent.skills)}
        - Personality: "${agent.personality}"

        Recent Crew Activity Log (for context on what the team is working on):
        ${formatMemoriesForPrompt(memories)}

        Based on this, suggest 3-5 new, single-word or two-word skills that would enhance this agent's capabilities. The skills should be concise and technical or tactical in nature. For example: "Threat Modeling", "Cloud Security", "React Native", "Social Engineering".

        Return only a JSON array of strings.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error suggesting skills:", error);
        return [];
    }
};

export const startAgentConversation = async (agent: Agent, history: Content[], message: string, memories: MemoryEntry[]): Promise<AsyncGenerator<GenerateContentResponse>> => {
    const contents: Content[] = [...history, { role: 'user', parts: [{ text: message }] }];
    
    const systemInstruction = `${agent.personality_prompt}

    Here is a log of recent crew activity to provide you with context for this conversation:
    ${formatMemoriesForPrompt(memories)}
    `;

    const response = await ai.models.generateContentStream({
        model,
        contents,
        config: {
            systemInstruction,
        },
    });

    return response;
};

export const orchestrateCommand = async (
    command: string,
    agents: Agent[],
    tasks: Task[],
    memories: MemoryEntry[],
    notes: Record<string, CalendarNote[]>
): Promise<OrchestrationResponse> => {
    const agentNames = agents.map(a => a.name);
    const prompt = `
      You are the central Orchestrator AI for the CASSA VEGAS tech crew. The System Operator has issued a command via a secure CLI.
      Your job is to analyze the command in the context of the entire system's current state and provide a concise, actionable response.
      If the command implies the creation of a new task, you MUST generate that task.

      **FULL SYSTEM STATE:**

      1.  **Crew Roster (Agents and their skills):**
          ${JSON.stringify(agents.map(a => ({ name: a.name, role: a.role, skills: a.skills })), null, 2)}

      2.  **Current Kanban Tasks:**
          ${tasks.length > 0 ? JSON.stringify(tasks, null, 2) : "No active tasks."}

      3.  **Recent Memory Log (Last 10 entries):**
          ${formatMemoriesForPrompt(memories)}

      4.  **Current Calendar Notes:**
          ${Object.keys(notes).length > 0 ? JSON.stringify(notes, null, 2) : "No calendar notes."}

      **OPERATOR COMMAND:**
      "${command}"

      **YOUR DIRECTIVES:**
      1.  **Analyze:** Deeply analyze the user's command against the full system state.
      2.  **Respond:** Formulate a clear, direct response text.
      3.  **Act:** If the command is a request to create a task (e.g., "create a task to...", "we need to...", "assign someone to..."), define a 'newTask' object. The task content should be concise, and you must assign it to the most appropriate agent. If no task creation is implied, omit the 'newTask' field.

      Return a single JSON object with your analysis.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        responseText: {
                            type: Type.STRING,
                            description: "Your text-based analysis and response to the operator's command."
                        },
                        newTask: {
                            type: Type.OBJECT,
                            description: "The new task object, if one is to be created.",
                            properties: {
                                content: { type: Type.STRING },
                                agentName: { type: Type.STRING, enum: agentNames }
                            },
                            nullable: true,
                        }
                    },
                    required: ["responseText"]
                }
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error orchestrating command:", error);
        return {
            responseText: "There was a critical error processing your command. Please check the system logs."
        };
    }
};

export const generateHints = async (
    agents: Agent[],
    tasks: Task[],
    memories: MemoryEntry[],
    notes: Record<string, CalendarNote[]>
): Promise<string[]> => {
    const prompt = `
      You are a strategic advisor AI for the CASSA VEGAS tech crew. The System Operator has requested help in the Orchestration Console.
      Your job is to analyze the entire system's current state and generate 3-4 highly relevant, insightful, and actionable command suggestions. These hints should guide the operator towards effective management of the crew and their tasks.

      **FULL SYSTEM STATE:**
      1.  **Crew Roster:** ${JSON.stringify(agents.map(a => ({ name: a.name, role: a.role, taskCount: tasks.filter(t => t.agentName === a.name).length, skills: a.skills.length })), null, 2)}
      2.  **Kanban Tasks:** ${JSON.stringify(tasks.map(t => ({ content: t.content, agent: t.agentName, stage: t.stage })), null, 2)}
      3.  **Recent Memory Log:** ${formatMemoriesForPrompt(memories)}
      4.  **Calendar Notes:** ${JSON.stringify(Object.values(notes).flat().map(n => n.content), null, 2)}

      **YOUR TASK:**
      Based on the state above, identify potential opportunities, bottlenecks, or areas that need attention. Formulate commands that address these points.

      **Example Thought Process:**
      - *Analysis:* "The 'Review' stage has 3 tasks, which is a potential bottleneck. One task has been there for a while."
      - *Suggested Command:* "Summarize all tasks in the Review stage and identify potential blockers."
      
      - *Analysis:* "The agent 'Charlie' has 0 tasks, but is skilled in 'Stealth'. The memory log shows recent 'infiltration' discussions."
      - *Suggested Command:* "Create a new infiltration task for Charlie to probe the competitor's network."

      - *Analysis:* "There's a new calendar note about 'Project Chimera deadline'."
      - *Suggested Command:* "What is the status of Project Chimera based on current tasks?"

      - *Analysis:* "The memory log shows 'Kara' successfully negotiated a deal."
      - *Suggested Command:* "Create a task for David to analyze the financial impact of Kara's latest deal."

      **Output:**
      Return a JSON array of 3-4 string-based command suggestions. Do not add any explanation.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    description: "An array of 3-4 command suggestions.",
                    items: { type: Type.STRING }
                }
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error generating hints:", error);
        return [
            "Summarize all active tasks.",
            "Who is the most available agent?",
            "Create a new task to review security protocols."
        ];
    }
};
