import React, { useState, useMemo } from 'react';
import { MemoryEntry, Agent } from '../types';
import BrainCircuitIcon from './icons/BrainCircuitIcon';
import TrashIcon from './icons/TrashIcon';

interface MemoryLogProps {
    memories: MemoryEntry[];
    setMemories: React.Dispatch<React.SetStateAction<MemoryEntry[]>>;
    agents: Agent[];
}

const MemoryLog = ({ memories, setMemories, agents }: MemoryLogProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [agentFilter, setAgentFilter] = useState('all');

    const handleDeleteMemory = (id: string) => {
        if (window.confirm("Are you sure you want to delete this memory entry? This action cannot be undone.")) {
            setMemories(prev => prev.filter(mem => mem.id !== id));
        }
    };

    const filteredMemories = useMemo(() => {
        return memories
            .filter(mem => {
                const searchMatch = mem.summary.toLowerCase().includes(searchTerm.toLowerCase()) || (mem.agentName && mem.agentName.toLowerCase().includes(searchTerm.toLowerCase()));
                const agentMatch = agentFilter === 'all' || mem.agentName === agentFilter;
                return searchMatch && agentMatch;
            })
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [memories, searchTerm, agentFilter]);

    return (
        <div className="p-4 sm:p-6 md:p-8 text-neutral">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <BrainCircuitIcon className="w-10 h-10 text-accent" />
                    <div>
                        <h2 className="text-3xl font-bold">Memory Log</h2>
                        <p className="text-neutral-focus">The collective consciousness of the crew.</p>
                    </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Search memories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="glass-effect bg-primary-light/50 border-transparent rounded-md px-3 py-2 text-neutral placeholder-neutral-focus/50 focus:ring-2 focus:ring-accent focus:outline-none w-full"
                    />
                    <select
                        value={agentFilter}
                        onChange={(e) => setAgentFilter(e.target.value)}
                        className="glass-effect bg-primary-light/50 border-transparent rounded-md px-3 py-2 text-neutral focus:ring-2 focus:ring-accent focus:outline-none"
                    >
                        <option value="all">All Agents</option>
                        {agents.map(agent => (
                            <option key={agent.name} value={agent.name}>{agent.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="glass-effect bg-primary-lighter/40 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-primary-light/60">
                            <tr>
                                <th className="p-4 font-semibold">Timestamp</th>
                                <th className="p-4 font-semibold">Type</th>
                                <th className="p-4 font-semibold">Agent</th>
                                <th className="p-4 font-semibold">Summary</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMemories.map(mem => (
                                <tr key={mem.id} className="border-b border-primary-light/30 hover:bg-primary-light/50 transition-colors">
                                    <td className="p-4 whitespace-nowrap text-sm text-neutral-focus">{new Date(mem.timestamp).toLocaleString()}</td>
                                    <td className="p-4 whitespace-nowrap">
                                        <span className="px-2 py-1 text-xs font-semibold bg-primary/80 text-accent rounded-full">{mem.type}</span>
                                    </td>
                                    <td className="p-4 whitespace-nowrap font-medium">{mem.agentName || 'System'}</td>
                                    <td className="p-4">{mem.summary}</td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => handleDeleteMemory(mem.id)}
                                            className="text-neutral-focus hover:text-red-500 p-1 rounded-full"
                                            aria-label="Delete memory"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 {filteredMemories.length === 0 && (
                    <div className="text-center p-8 text-neutral-focus italic">
                        <p>No memories found matching your criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MemoryLog;