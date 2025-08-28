import React, { useState } from 'react';
import { AGENT_PROFILE } from '../constants/agentProfile';
import AgentCard from './AgentCard';
import EditAgentModal from './EditAgentModal';
import IntroductionModal from './IntroductionModal';
import TaskSuggestionModal from './TaskSuggestionModal';
import { Agent, MemoryEntry, Task } from '../types';
import { suggestTasksForNewSkills } from '../services/aiService';

interface AIFamilyProps {
    agents: Agent[];
    setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
    memories: MemoryEntry[];
    addMemory: (entry: Omit<MemoryEntry, 'id' | 'timestamp'>) => void;
    onAddTask: (task: Omit<Task, 'id' | 'stage'>, options?: { showAlert?: boolean, switchTab?: boolean }) => void;
}

const AIFamily = ({ agents, setAgents, memories, addMemory, onAddTask }: AIFamilyProps) => {
    const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
    const [introducingAgent, setIntroducingAgent] = useState<Agent | null>(null);
    const [taskSuggestions, setTaskSuggestions] = useState<{ agent: Agent, tasks: string[] } | null>(null);


    const handleSaveAgent = async (updatedAgent: Agent) => {
        const originalAgent = agents.find(a => a.name === updatedAgent.name);
        
        setAgents(prevAgents => 
            prevAgents.map(agent => 
                agent.name === updatedAgent.name ? updatedAgent : agent
            )
        );
        
        if (originalAgent && JSON.stringify(originalAgent.skills) !== JSON.stringify(updatedAgent.skills)) {
             const oldSkills = new Set(originalAgent.skills);
             const addedSkills = updatedAgent.skills.filter(s => !oldSkills.has(s));

             addMemory({
                type: 'SKILL_UPDATE',
                agentName: updatedAgent.name,
                summary: `Updated skills for ${updatedAgent.name}.`,
                details: {
                    before: originalAgent.skills,
                    after: updatedAgent.skills,
                },
            });

            if (addedSkills.length > 0) {
                const suggestedTaskContents = await suggestTasksForNewSkills(updatedAgent, addedSkills, memories);
                if (suggestedTaskContents && suggestedTaskContents.length > 0) {
                    setTaskSuggestions({ agent: updatedAgent, tasks: suggestedTaskContents });
                }
            }
        }

        setEditingAgent(null);
    };

    const handleAddTaskFromSuggestion = (task: Omit<Task, 'id' | 'stage'>) => {
        onAddTask(task, { showAlert: false, switchTab: false });
    };

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-neutral">Meet the Family</h2>
                <p className="text-accent mt-1 text-lg">{AGENT_PROFILE.creed}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {agents.map((agent) => (
                    <AgentCard 
                        key={agent.name} 
                        agent={agent} 
                        onEdit={() => setEditingAgent(agent)}
                        onIntroduce={() => setIntroducingAgent(agent)}
                    />
                ))}
            </div>

            {editingAgent && (
                <EditAgentModal 
                    agent={editingAgent}
                    onClose={() => setEditingAgent(null)}
                    onSave={handleSaveAgent}
                    memories={memories}
                />
            )}
            
            {introducingAgent && (
                <IntroductionModal
                    agent={introducingAgent}
                    onClose={() => setIntroducingAgent(null)}
                    memories={memories}
                    addMemory={addMemory}
                />
            )}

            <TaskSuggestionModal
                suggestions={taskSuggestions}
                onClose={() => setTaskSuggestions(null)}
                onAddTask={handleAddTaskFromSuggestion}
            />
        </div>
    );
};

export default AIFamily;
