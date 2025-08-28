import React, { useState } from 'react';
import { Agent, Task } from '../types';
import XIcon from './icons/XIcon';
import PlusIcon from './icons/PlusIcon';
import BrainCircuitIcon from './icons/BrainCircuitIcon';
import CheckIcon from './icons/CheckIcon';

interface TaskSuggestionModalProps {
    suggestions: { agent: Agent; tasks: string[] } | null;
    onClose: () => void;
    onAddTask: (task: Omit<Task, 'id' | 'stage'>) => void;
}

const TaskSuggestionModal = ({ suggestions, onClose, onAddTask }: TaskSuggestionModalProps) => {
    const [addedTasks, setAddedTasks] = useState<string[]>([]);

    if (!suggestions) return null;

    const { agent, tasks } = suggestions;

    const handleAddTask = (taskContent: string) => {
        if (addedTasks.includes(taskContent)) return;

        onAddTask({
            content: taskContent,
            agentName: agent.name,
        });
        setAddedTasks(prev => [...prev, taskContent]);
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="glass-effect bg-primary-light/50 rounded-lg shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-primary-lighter/40">
                    <div className="flex items-center gap-3">
                        <BrainCircuitIcon className="w-6 h-6 text-accent" />
                        <h3 className="text-xl font-bold text-neutral">Task Suggestions for {agent.name}</h3>
                    </div>
                    <button onClick={onClose} className="text-neutral-focus hover:text-accent transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-neutral-focus mb-4">
                        Based on <span className="font-bold text-accent">{agent.name}'s</span> newly acquired skills, the Orchestrator suggests the following tasks:
                    </p>
                    <ul className="space-y-3">
                        {tasks.map((task, index) => {
                            const isAdded = addedTasks.includes(task);
                            return (
                                <li key={index} className="glass-effect bg-primary-lighter/60 p-3 rounded-md flex justify-between items-center gap-4">
                                    <p className="text-neutral flex-grow">{task}</p>
                                    <button
                                        onClick={() => handleAddTask(task)}
                                        disabled={isAdded}
                                        className={`flex-shrink-0 flex items-center justify-center gap-2 text-sm text-white px-3 py-1.5 rounded-md font-semibold transition-colors duration-200 w-28
                                            ${isAdded
                                                ? 'bg-green-600/80 cursor-default'
                                                : 'bg-blue-600 hover:bg-blue-700'
                                            }`}
                                    >
                                        {isAdded ? (
                                            <>
                                                <CheckIcon className="w-4 h-4" />
                                                <span>Added</span>
                                            </>
                                        ) : (
                                            <>
                                                <PlusIcon className="w-4 h-4" />
                                                <span>Add Task</span>
                                            </>
                                        )}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
                
                <div className="p-4 border-t border-primary-lighter/40 flex justify-end">
                     <button onClick={onClose} className="bg-accent text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition">
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskSuggestionModal;
