import React from 'react';
import { Agent } from '../types';
import EditIcon from './icons/EditIcon';
import ChatIcon from './icons/ChatIcon';

interface AgentCardProps {
    agent: Agent;
    onEdit: () => void;
    onIntroduce: () => void;
}

const AgentCard = ({ agent, onEdit, onIntroduce }: AgentCardProps) => {
    return (
        <div className="glass-effect bg-primary-light/50 rounded-lg p-6 flex flex-col border-transparent hover:border-accent transition-all duration-300 group relative">
             <div className="absolute top-3 right-3 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={onIntroduce}
                    className="text-neutral-focus p-2 rounded-full bg-primary-lighter/70 hover:bg-accent hover:text-white"
                    aria-label={`Activate ${agent.name}`}
                >
                    <ChatIcon className="w-4 h-4" />
                </button>
                <button 
                    onClick={onEdit}
                    className="text-neutral-focus p-2 rounded-full bg-primary-lighter/70 hover:bg-accent hover:text-white"
                    aria-label={`Edit ${agent.name}`}
                >
                    <EditIcon className="w-4 h-4" />
                </button>
            </div>
            <div className="flex-grow">
                <h3 className="text-xl font-bold text-accent mb-1">{agent.name}</h3>
                <p className="text-neutral-focus font-semibold mb-3">{agent.role}</p>
                <p className="text-sm text-neutral mb-4 italic">"{agent.personality}"</p>
                <div className="mb-4">
                    <h4 className="font-semibold text-neutral-focus mb-2">Skills:</h4>
                    <div className="flex flex-wrap gap-2">
                        {agent.skills.map((skill) => (
                            <span key={skill} className="bg-primary-lighter/60 text-xs font-medium text-neutral px-2 py-1 rounded-full">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
            <div className="mt-auto pt-4 border-t border-primary-lighter/40">
                 <p className="text-xs text-neutral/60">
                    <span className="font-bold">Voice:</span> {agent.voice_style}
                </p>
            </div>
        </div>
    );
};

export default AgentCard;