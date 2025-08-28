import React, { useState } from 'react';
import { KanbanColumnId, Task, Suggestion, Agent, MemoryEntry } from '../types';
import { TASKFLOW_STAGES } from '../constants';
import KanbanColumn from './KanbanColumn';
import { getHandOffSuggestion } from '../services/aiService';
import PlusIcon from './icons/PlusIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import BacklogIcon from './icons/BacklogIcon';
import TodoIcon from './icons/TodoIcon';
import InProgressIcon from './icons/InProgressIcon';
import ReviewIcon from './icons/ReviewIcon';
import DoneIcon from './icons/DoneIcon';

interface KanbanBoardProps {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    agents: Agent[];
    isLoading: boolean;
    onRegenerateTasks: () => Promise<void>;
    memories: MemoryEntry[];
    addMemory: (entry: Omit<MemoryEntry, 'id' | 'timestamp'>) => void;
}

const columnIcons: Record<KanbanColumnId, React.ComponentType<{ className?: string }>> = {
    'Backlog': BacklogIcon,
    'To Do': TodoIcon,
    'In Progress': InProgressIcon,
    'Review': ReviewIcon,
    'Done': DoneIcon,
};

const OVERLOAD_THRESHOLD = 3;
const OVERLOAD_COLUMNS: KanbanColumnId[] = ['To Do', 'In Progress', 'Review'];

const KanbanBoard = ({ tasks, setTasks, agents, isLoading, onRegenerateTasks, memories, addMemory }: KanbanBoardProps) => {
    const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
    const [isThinking, setIsThinking] = useState<boolean>(false);
    const [suggestion, setSuggestion] = useState<Suggestion & { taskId: string } | null>(null);
    
    const anyKeyAvailable = !!process.env.API_KEY || !!process.env.OPENAI_API_KEY;

    const handleRegenerate = async () => {
      setIsRegenerating(true);
      setSuggestion(null);
      await onRegenerateTasks();
      setIsRegenerating(false);
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
        e.dataTransfer.setData("taskId", taskId);
        setSuggestion(null);
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, destinationColumnId: KanbanColumnId) => {
        const taskId = e.dataTransfer.getData("taskId");
        const taskToMove = tasks.find(t => t.id === taskId);

        if (taskToMove && taskToMove.stage !== destinationColumnId) {
            const sourceStage = taskToMove.stage;
            const originalAgent = taskToMove.agentName;
            
            // Optimistic UI update for stage
            const updatedTasks = tasks.map(t =>
                t.id === taskId ? { ...t, stage: destinationColumnId } : t
            );
            setTasks(updatedTasks);
            
            setIsThinking(true);
            const taskWithNewStage = { ...taskToMove, stage: destinationColumnId };
            const handOffSuggestion = await getHandOffSuggestion(taskWithNewStage, sourceStage, destinationColumnId, agents, memories);
            setIsThinking(false);

            if (handOffSuggestion) {
                setTasks(prevTasks =>
                    prevTasks.map(t =>
                        t.id === taskId ? { ...t, agentName: handOffSuggestion.suggestedAgent } : t
                    )
                );
                setSuggestion({ ...handOffSuggestion, taskId });

                // Record memory of the hand-off
                addMemory({
                    type: 'TASK_HANDOFF',
                    agentName: originalAgent,
                    summary: `Task "${taskToMove.content}" moved from ${sourceStage} to ${destinationColumnId}. Handed off to ${handOffSuggestion.suggestedAgent}.`,
                    details: {
                        taskId: taskToMove.id,
                        fromAgent: originalAgent,
                        toAgent: handOffSuggestion.suggestedAgent,
                        fromStage: sourceStage,
                        toStage: destinationColumnId,
                        aiSuggestion: handOffSuggestion.nextAction,
                    }
                });
            }
        }
    };
    
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-150px)] text-neutral">
                <SpinnerIcon className="w-12 h-12 text-accent" />
                <p className="mt-4 text-lg">Initializing Mission Parameters...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-76px)] text-neutral">
            <div className="p-4 flex justify-between items-center border-b border-primary-light/50">
                <div>
                    <h2 className="text-2xl font-bold">Taskflow</h2>
                    {isThinking && (
                        <div className="flex items-center text-accent mt-1">
                            <SpinnerIcon className="w-4 h-4 mr-2" />
                            <span>AI Analyzing Hand-off...</span>
                        </div>
                    )}
                    {suggestion && (
                         <div className="mt-1 text-sm text-neutral-focus glass-effect bg-primary-light/70 p-2 rounded-md">
                            <strong>Next Action for {suggestion.suggestedAgent}:</strong> "{suggestion.nextAction}"
                         </div>
                    )}
                </div>
                <button
                    onClick={handleRegenerate}
                    disabled={isRegenerating || !anyKeyAvailable}
                    className="flex items-center justify-center bg-accent text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    {isRegenerating ? <SpinnerIcon className="w-5 h-5 mr-2" /> : <PlusIcon className="w-5 h-5 mr-2"/>}
                    {isRegenerating ? 'Generating...' : 'Generate New Tasks'}
                </button>
            </div>
            <div className="flex-grow p-4 overflow-x-auto">
                <div className="flex space-x-4">
                    {TASKFLOW_STAGES.map((columnId) => {
                        const columnTasks = tasks.filter(task => task.stage === columnId);
                        const IconComponent = columnIcons[columnId];
                        const isOverloaded = OVERLOAD_COLUMNS.includes(columnId) && columnTasks.length > OVERLOAD_THRESHOLD;
                        return (
                            <KanbanColumn
                                key={columnId}
                                title={columnId}
                                tasks={columnTasks}
                                onDragStart={handleDragStart}
                                onDrop={handleDrop}
                                icon={IconComponent}
                                isGlowing={columnTasks.length > 0}
                                isOverloaded={isOverloaded}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default KanbanBoard;
