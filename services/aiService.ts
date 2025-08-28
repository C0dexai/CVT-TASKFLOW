import { GoogleGenAI, Type, GenerateContentResponse, Content } from "@google/genai";
import { AGENT_PROFILE } from '../constants/agentProfile';
import { TASKFLOW_STAGES } from '../constants';
import { Task, Suggestion, CalendarNote, Agent, MemoryEntry, OrchestrationResponse } from '../types';

// Initialize Gemini client if API key is available
const ai = process.env.API_KEY ? new GoogleGenAI({ apiKey: process.env.API_KEY }) : null;
const geminiModel = "gemini-2.5-flash";

const formatMemoriesForPrompt = (memories: MemoryEntry[]): string => {
    if (memories.length === 0) {
        return "No recent activity logged.";
    }
    return memories.slice(-10).map(mem => `- ${new Date(mem.timestamp).toLocaleString()}: [${mem.type}] ${mem.summary}`).join('\n');
};

// --- OpenAI Helper ---
async function callOpenAIWithTools(prompt: string, tool: any): Promise<any> {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is not configured.");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            tools: [{ type: "function", function: tool }],
            tool_choice: { type: "function", function: { name: tool.name } }
        })
    });

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`OpenAI API request failed with status ${response.status}: ${errorBody.error?.message}`);
    }

    const result = await response.json();
    const toolCall = result.choices[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
        throw new Error("OpenAI response did not include the expected tool call.");
    }

    return JSON.parse(toolCall.function.arguments);
}


// --- Exported Functions with Fallback Logic ---

export const generateInitialTasks = async (agents: Agent[]): Promise<Task[]> => {
    const agentNames = agents.map(m => m.name);
    const currentAgentProfile = { ...AGENT_PROFILE, members: agents };
    const prompt = `
        You are the master orchestrator for a clandestine tech crew called CASSA VEGAS. Your job is to generate a list of initial tasks for the crew's KANBAN board.
        Here is the crew's current profile: ${JSON.stringify(currentAgentProfile, null, 2)}
        Here are the workflow stages: ${JSON.stringify(TASKFLOW_STAGES)}
        Based on the crew's skills and roles, generate 5-7 tasks that align with their operations (e.g., cybersecurity, system architecture, data analysis, infiltration, planning).
        For each task:
        1. Write a concise, action-oriented description (under 15 words).
        2. Assign it to the MOST appropriate agent from the 'members' list. Use their 'name'.
        3. Place it in the 'Backlog' stage.
        Return the result as a JSON array.`;

    // Try Gemini first
    if (ai) {
        try {
            const response = await ai.models.generateContent({
                model: geminiModel,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { content: { type: Type.STRING }, agentName: { type: Type.STRING, enum: agentNames }, stage: { type: Type.STRING, enum: ['Backlog'] } }, required: ["content", "agentName", "stage"] } }
                }
            });
            const tasks = JSON.parse(response.text.trim());
            return tasks.map((task: Omit<Task, 'id'>) => ({ ...task, id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` }));
        } catch (geminiError) {
            console.warn("Gemini 'generateInitialTasks' failed. Falling back to OpenAI.", geminiError);
        }
    }

    // Fallback to OpenAI
    if (process.env.OPENAI_API_KEY) {
        try {
            const tool = { name: "submit_initial_tasks", description: "Submit the generated tasks.", parameters: { type: "object", properties: { tasks: { type: "array", items: { type: "object", properties: { content: { type: "string" }, agentName: { type: "string", enum: agentNames }, stage: { type: "string", enum: ['Backlog'] } }, required: ["content", "agentName", "stage"] } } }, required: ["tasks"] } };
            const result = await callOpenAIWithTools(prompt, tool);
            const tasks = result.tasks || [];
            return tasks.map((task: Omit<Task, 'id'>) => ({ ...task, id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` }));
        } catch (openaiError) {
            console.error("OpenAI fallback for 'generateInitialTasks' also failed.", openaiError);
        }
    }

    console.error("All AI providers failed or are not configured for 'generateInitialTasks'.");
    return [];
};

export const getHandOffSuggestion = async (task: Task, sourceStage: string, destinationStage: string, agents: Agent[], memories: MemoryEntry[]): Promise<Suggestion | null> => {
    const agentNames = agents.map(m => m.name);
    const prompt = `
        You are an AI assistant for the CASSA VEGAS tech crew. A task moved. Suggest the next step.
        Crew: ${JSON.stringify(agents.map(m => ({ name: m.name, skills: m.skills, role: m.role })), null, 2)}
        Task: "${task.content}" (Agent: "${task.agentName}")
        Move: From "${sourceStage}" to "${destinationStage}"
        Recent Activity:
        ${formatMemoriesForPrompt(memories)}
        Analyze this transition. Is '${task.agentName}' still the right owner, or should it be handed off? What's the next action?
        Provide your analysis in a JSON object.`;

    if (ai) {
        try {
            const response = await ai.models.generateContent({
                model: geminiModel,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: { type: Type.OBJECT, properties: { suggestedAgent: { type: Type.STRING, enum: agentNames }, nextAction: { type: Type.STRING, description: "Brief next step (under 10 words)." } }, required: ["suggestedAgent", "nextAction"] }
                }
            });
            return JSON.parse(response.text.trim());
        } catch (geminiError) {
            console.warn("Gemini 'getHandOffSuggestion' failed. Falling back to OpenAI.", geminiError);
        }
    }

    if (process.env.OPENAI_API_KEY) {
        try {
            const tool = { name: "submit_handoff_suggestion", description: "Submit the handoff suggestion.", parameters: { type: "object", properties: { suggestedAgent: { type: "string", enum: agentNames }, nextAction: { type: "string", description: "Brief next step (under 10 words)." } }, required: ["suggestedAgent", "nextAction"] } };
            return await callOpenAIWithTools(prompt, tool);
        } catch (openaiError) {
            console.error("OpenAI fallback for 'getHandOffSuggestion' also failed.", openaiError);
        }
    }

    return null;
};

export const generateTaskFromNote = async (note: CalendarNote, agents: Agent[], memories: MemoryEntry[]): Promise<Pick<Task, 'content' | 'agentName'>> => {
    const agentNames = agents.map(m => m.name);
    const prompt = `
        You are an AI assistant for CASSA VEGAS. Convert this calendar note from ${note.date} into a task.
        Crew: ${JSON.stringify(agents.map(m => ({ name: m.name, role: m.role, skills: m.skills })), null, 2)}
        Note: "${note.content}"
        Recent Activity: ${formatMemoriesForPrompt(memories)}
        1. Create a concise task description (under 15 words).
        2. Assign to the BEST agent.
        Return JSON object with "content" and "agentName".`;

    const fallbackResult = { content: `Address calendar note: ${note.content.substring(0, 20)}...`, agentName: "Andoy" };
    
    if (ai) {
        try {
            const response = await ai.models.generateContent({
                model: geminiModel,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: { type: Type.OBJECT, properties: { content: { type: Type.STRING }, agentName: { type: Type.STRING, enum: agentNames } }, required: ["content", "agentName"] }
                }
            });
            return JSON.parse(response.text.trim());
        } catch (geminiError) {
            console.warn("Gemini 'generateTaskFromNote' failed. Falling back to OpenAI.", geminiError);
        }
    }
    
    if (process.env.OPENAI_API_KEY) {
        try {
             const tool = { name: "submit_task_from_note", description: "Submit the task generated from a calendar note.", parameters: { type: "object", properties: { content: { type: "string" }, agentName: { type: "string", enum: agentNames } }, required: ["content", "agentName"] } };
             return await callOpenAIWithTools(prompt, tool);
        } catch (openaiError) {
             console.error("OpenAI fallback for 'generateTaskFromNote' also failed.", openaiError);
        }
    }

    return fallbackResult;
};

export const suggestSkills = async (agent: Agent, memories: MemoryEntry[]): Promise<string[]> => {
    const prompt = `
        You are an AI assistant for CASSA VEGAS. Suggest new skills for a crew member. Do not suggest skills they already have.
        Agent: ${agent.name} (Role: ${agent.role}, Current Skills: ${JSON.stringify(agent.skills)})
        Recent Crew Activity: ${formatMemoriesForPrompt(memories)}
        Suggest 3-5 new, concise, technical or tactical skills (e.g., "Threat Modeling", "Cloud Security"). Return a JSON array of strings.`;
    
    if (ai) {
        try {
            const response = await ai.models.generateContent({ model: geminiModel, contents: prompt, config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } } } });
            return JSON.parse(response.text.trim());
        } catch (geminiError) {
            console.warn("Gemini 'suggestSkills' failed. Falling back to OpenAI.", geminiError);
        }
    }

    if (process.env.OPENAI_API_KEY) {
        try {
             const tool = { name: "submit_skill_suggestions", description: "Submit the suggested skills.", parameters: { type: "object", properties: { skills: { type: "array", items: { type: "string" } } }, required: ["skills"] } };
             const result = await callOpenAIWithTools(prompt, tool);
             return result.skills || [];
        } catch (openaiError) {
             console.error("OpenAI fallback for 'suggestSkills' also failed.", openaiError);
        }
    }

    return [];
};

export const orchestrateCommand = async (command: string, agents: Agent[], tasks: Task[], memories: MemoryEntry[], notes: Record<string, CalendarNote[]>): Promise<OrchestrationResponse> => {
    const agentNames = agents.map(a => a.name);
    const prompt = `
      You are the central Orchestrator AI for CASSA VEGAS. Analyze the operator's command in the context of the full system state and respond. If the command implies creating a task, generate it.
      **STATE:**
      Agents: ${JSON.stringify(agents.map(a => ({ name: a.name, role: a.role, skills: a.skills.length })), null, 2)}
      Tasks: ${tasks.length > 0 ? JSON.stringify(tasks, null, 2) : "No active tasks."}
      Memory Log: ${formatMemoriesForPrompt(memories)}
      Calendar Notes: ${Object.keys(notes).length > 0 ? JSON.stringify(notes, null, 2) : "No notes."}
      **COMMAND:** "${command}"
      **DIRECTIVES:** Analyze the command. Formulate a response. If a task is requested, define a 'newTask' object (concise content, best agent). Omit 'newTask' if not implied. Return a single JSON object.`;

    const fallbackResponse = { responseText: "Critical error processing command. All providers failed." };

    if (ai) {
        try {
            const response = await ai.models.generateContent({
                model: geminiModel, contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: { type: Type.OBJECT, properties: { responseText: { type: Type.STRING }, newTask: { type: Type.OBJECT, properties: { content: { type: Type.STRING }, agentName: { type: Type.STRING, enum: agentNames } }, nullable: true } }, required: ["responseText"] }
                }
            });
            return JSON.parse(response.text.trim());
        } catch (geminiError) {
            console.warn("Gemini 'orchestrateCommand' failed. Falling back to OpenAI.", geminiError);
        }
    }

    if (process.env.OPENAI_API_KEY) {
        try {
             const tool = { name: "submit_orchestration_response", description: "Submit the orchestration response.", parameters: { type: "object", properties: { responseText: { type: Type.STRING }, newTask: { type: Type.OBJECT, properties: { content: { type: Type.STRING }, agentName: { type: Type.STRING, enum: agentNames } }, nullable: true } }, required: ["responseText"] } };
             return await callOpenAIWithTools(prompt, tool);
        } catch (openaiError) {
             console.error("OpenAI fallback for 'orchestrateCommand' also failed.", openaiError);
        }
    }
    
    return fallbackResponse;
};

export const generateHints = async (agents: Agent[], tasks: Task[], memories: MemoryEntry[], notes: Record<string, CalendarNote[]>): Promise<string[]> => {
    const prompt = `
      You are a strategic advisor AI for CASSA VEGAS. The operator needs help. Analyze the system state and generate 3-4 highly relevant, actionable command suggestions to guide them.
      **STATE:**
      Agents: ${JSON.stringify(agents.map(a => ({ name: a.name, role: a.role, taskCount: tasks.filter(t => t.agentName === a.name).length })))}
      Tasks: ${JSON.stringify(tasks.map(t => ({ content: t.content, agent: t.agentName, stage: t.stage })))}
      Memory: ${formatMemoriesForPrompt(memories)}
      Notes: ${JSON.stringify(Object.values(notes).flat().map(n => n.content))}
      **TASK:** Identify opportunities, bottlenecks, or needs. Formulate commands to address them. Return a JSON array of 3-4 command strings.`;

    const fallbackHints = ["Summarize all active tasks.", "Who is the most available agent?"];
    
    if (ai) {
        try {
            const response = await ai.models.generateContent({ model: geminiModel, contents: prompt, config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } } } });
            return JSON.parse(response.text.trim());
        } catch (geminiError) {
             console.warn("Gemini 'generateHints' failed. Falling back to OpenAI.", geminiError);
        }
    }

    if (process.env.OPENAI_API_KEY) {
        try {
             const tool = { name: "submit_command_hints", description: "Submit command hint suggestions.", parameters: { type: "object", properties: { hints: { type: "array", items: { type: "string" } } }, required: ["hints"] } };
             const result = await callOpenAIWithTools(prompt, tool);
             return result.hints || fallbackHints;
        } catch (openaiError) {
             console.error("OpenAI fallback for 'generateHints' also failed.", openaiError);
        }
    }

    return fallbackHints;
};

// --- Multi-provider Conversation ---
async function* startGeminiConversation(agent: Agent, history: Content[], message: string, memories: MemoryEntry[]): AsyncGenerator<{ text: string }> {
    if (!ai) {
        yield { text: "Gemini API Key not configured." };
        return;
    }
    const systemInstruction = `${agent.personality_prompt}\n\nRecent Crew Activity:\n${formatMemoriesForPrompt(memories)}`;
    const contents = [...history, { role: 'user', parts: [{ text: message }] }];
    const responseStream = await ai.models.generateContentStream({ model: geminiModel, contents, config: { systemInstruction } });
    for await (const chunk of responseStream) {
        yield { text: chunk.text };
    }
}

async function* startOpenAIConversation(agent: Agent, history: Content[], message: string, memories: MemoryEntry[]): AsyncGenerator<{ text: string }> {
    const systemInstruction = `${agent.personality_prompt}\n\nRecent Crew Activity:\n${formatMemoriesForPrompt(memories)}`;
    const messages = [
        { role: 'system', content: systemInstruction },
        ...history.map(h => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.parts.map(p => p.text).join('') })),
        { role: 'user', content: message }
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: 'gpt-4o', messages, stream: true })
    });
    if (!response.ok || !response.body) throw new Error(`OpenAI API Error: ${response.statusText}`);
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const jsonStr = line.substring(6);
                if (jsonStr === '[DONE]') return;
                const chunk = JSON.parse(jsonStr);
                const content = chunk.choices[0]?.delta?.content;
                if (content) yield { text: content };
            }
        }
    }
}

export const startAgentConversation = async (agent: Agent, history: Content[], message: string, memories: MemoryEntry[]): Promise<AsyncGenerator<{ text: string }>> => {
    // Prefer OpenAI for conversations if available, as per previous setup
    if (process.env.OPENAI_API_KEY) {
        try {
            return await startOpenAIConversation(agent, history, message, memories);
        } catch (openaiError) {
            console.warn("OpenAI conversation failed. Falling back to Gemini.", openaiError);
        }
    }
    // Fallback to Gemini
    if (process.env.API_KEY) {
         try {
            return await startGeminiConversation(agent, history, message, memories);
        } catch (geminiError) {
            console.error("Gemini conversation fallback also failed.", geminiError);
            // This is tricky for async generators. We'll let the UI handle the final error.
            throw geminiError;
        }
    }
    
    throw new Error("No AI provider is configured for conversations.");
};

export const suggestTasksForNewSkills = async (agent: Agent, addedSkills: string[], memories: MemoryEntry[]): Promise<string[]> => {
    const prompt = `
        You are a master orchestrator for the CASSA VEGAS tech crew. An agent's skills have just been upgraded. Your job is to suggest new tasks that leverage their new abilities, keeping in mind the crew's recent activities.

        Agent Profile:
        - Name: "${agent.name}"
        - Role: "${agent.role}"
        - Recently Gained Skills: ${JSON.stringify(addedSkills)}

        Recent Crew Activity Log (for context):
        ${formatMemoriesForPrompt(memories)}

        Based on the agent's new skills and recent crew activities, suggest 2-3 concise, actionable task descriptions (under 15 words each) for ${agent.name}. The tasks should specifically utilize one or more of the new skills.

        Return a JSON array of strings, where each string is a task description.
    `;
    
    if (ai) {
        try {
            const response = await ai.models.generateContent({
                model: geminiModel,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        description: "An array of 2-3 task description strings.",
                        items: { type: Type.STRING }
                    }
                }
            });
            return JSON.parse(response.text.trim());
        } catch (geminiError) {
             console.warn("Gemini 'suggestTasksForNewSkills' failed. Falling back to OpenAI.", geminiError);
        }
    }

    if (process.env.OPENAI_API_KEY) {
        try {
             const tool = {
                 name: "submit_task_suggestions",
                 description: "Submit new task suggestions for an agent.",
                 parameters: {
                     type: "object",
                     properties: {
                         tasks: {
                             type: "array",
                             description: "An array of 2-3 task description strings.",
                             items: { type: "string" }
                         }
                     },
                     required: ["tasks"]
                 }
             };
             const result = await callOpenAIWithTools(prompt, tool);
             return result.tasks || [];
        } catch (openaiError) {
             console.error("OpenAI fallback for 'suggestTasksForNewSkills' also failed.", openaiError);
        }
    }

    console.error("All AI providers failed or are not configured for 'suggestTasksForNewSkills'.");
    return [];
};
