import React, { useState, useRef, useEffect } from 'react';
import { Agent, Task, MemoryEntry, CalendarNote, OrchestrationResponse } from '../types';
import { orchestrateCommand, generateHints } from '../services/aiService';
import SpinnerIcon from './icons/SpinnerIcon';
import TerminalIcon from './icons/TerminalIcon';

interface OrchestrationConsoleProps {
    agents: Agent[];
    tasks: Task[];
    memories: MemoryEntry[];
    notes: Record<string, CalendarNote[]>;
    onAddTask: (task: Omit<Task, 'id' | 'stage'>) => void;
}

interface CommandHistoryEntry {
    type: 'command' | 'response' | 'error' | 'system';
    content: string;
}

const OrchestrationConsole = ({ agents, tasks, memories, notes, onAddTask }: OrchestrationConsoleProps) => {
    const [inputValue, setInputValue] = useState('');
    const [history, setHistory] = useState<CommandHistoryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [suggestedHints, setSuggestedHints] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const historyEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, isLoading]);
    
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleCommandSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const commandText = inputValue.trim();
        if (!commandText || isLoading) return;

        const command = commandText.toLowerCase();
        
        setHistory(prev => [...prev, { type: 'command', content: commandText }]);
        setInputValue('');
        setIsLoading(true);
        setSuggestedHints([]);

        try {
            if (command === 'help' || command === '?') {
                setHistory(prev => [...prev, { type: 'system', content: "Generating contextual hints..." }]);
                const hints = await generateHints(agents, tasks, memories, notes);
                setSuggestedHints(hints);
                setHistory(prev => [...prev, { type: 'system', content: "Generated command suggestions based on current system state. Click a hint to load it." }]);
            } else {
                const result: OrchestrationResponse = await orchestrateCommand(commandText, agents, tasks, memories, notes);
                setHistory(prev => [...prev, { type: 'response', content: result.responseText }]);
                if (result.newTask) {
                    onAddTask(result.newTask);
                    setHistory(prev => [...prev, { type: 'system', content: `[SYSTEM] New task "${result.newTask?.content}" created and assigned to ${result.newTask?.agentName}.` }]);
                }
            }
        } catch (error) {
            console.error("Orchestration command failed:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setHistory(prev => [...prev, { type: 'error', content: `Error: ${errorMessage}` }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if (!isLoading) {
            inputRef.current?.focus();
        }
    }, [isLoading]);
    
    const handleHintClick = (hint: string) => {
        setInputValue(hint);
        inputRef.current?.focus();
    };


    return (
        <div className="p-4 sm:p-6 md:p-8 text-neutral flex flex-col h-[calc(100vh-76px)]">
            <div className="flex items-center gap-3 mb-4">
                <TerminalIcon className="w-10 h-10 text-accent" />
                <div>
                    <h2 className="text-3xl font-bold">Orchestration Console</h2>
                    <p className="text-neutral-focus">Direct command-line interface to the system AI.</p>
                </div>
            </div>

            <div className="flex-grow glass-effect bg-primary-lighter/40 border-transparent rounded-lg shadow-inner flex flex-col p-4 font-mono text-sm">
                <div className="flex-grow overflow-y-auto space-y-2" onClick={() => inputRef.current?.focus()}>
                    <div className="text-green-400">CASSA VEGAS C.U.A. (v2.5) -- System Ready.</div>
                    <div className="text-neutral-focus">Enter a command or type 'help' for contextual suggestions.</div>
                    <hr className="border-primary-light/40 my-2"/>
                    {history.map((entry, index) => (
                        <div key={index}>
                            {entry.type === 'command' && (
                                <div className="flex gap-2">
                                    <span className="text-accent flex-shrink-0">&gt;</span>
                                    <p className="whitespace-pre-wrap break-words">{entry.content}</p>
                                </div>
                            )}
                            {entry.type === 'response' && (
                                <p className="text-neutral whitespace-pre-wrap break-words">{entry.content}</p>
                            )}
                            {entry.type === 'system' && (
                                <p className="text-blue-400 italic whitespace-pre-wrap break-words">{entry.content}</p>
                            )}
                             {entry.type === 'error' && (
                                <p className="text-red-500 whitespace-pre-wrap break-words">{entry.content}</p>
                            )}
                        </div>
                    ))}
                    {isLoading && <div className="flex justify-center"><SpinnerIcon className="w-5 h-5 text-accent" /></div>}
                    <div ref={historyEndRef} />
                </div>
                
                {suggestedHints.length > 0 && !isLoading && (
                    <div className="mt-4 pt-4 border-t border-primary-light/40">
                        <p className="text-sm font-semibold text-neutral-focus mb-2">Suggested Commands:</p>
                        <div className="flex flex-wrap gap-2">
                            {suggestedHints.map((hint, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleHintClick(hint)}
                                    className="glass-effect bg-primary-light/60 text-neutral-focus text-xs px-3 py-1.5 rounded-full hover:bg-accent hover:text-white transition text-left"
                                >
                                    {hint}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                <form onSubmit={handleCommandSubmit} className="flex gap-2 items-center mt-4 pt-4 border-t border-primary-light/40">
                    <span className="text-accent flex-shrink-0">&gt;</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={isLoading}
                        className="w-full bg-transparent focus:outline-none text-neutral placeholder:text-neutral-focus/50"
                        placeholder="Enter command..."
                        autoComplete="off"
                    />
                </form>
            </div>
        </div>
    );
};

export default OrchestrationConsole;