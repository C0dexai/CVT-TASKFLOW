import React, { useState, useEffect } from 'react';
import { Agent, MemoryEntry } from '../types';
import { suggestSkills } from '../services/aiService';
import XIcon from './icons/XIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import PlusIcon from './icons/PlusIcon';

interface EditAgentModalProps {
    agent: Agent;
    onClose: () => void;
    onSave: (updatedAgent: Agent) => void;
    memories: MemoryEntry[];
}

const EditAgentModal = ({ agent, onClose, onSave, memories }: EditAgentModalProps) => {
    const [localAgent, setLocalAgent] = useState<Agent>(agent);
    const [newSkill, setNewSkill] = useState('');
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);

    useEffect(() => {
        setLocalAgent(agent);
        setSuggestedSkills([]);
    }, [agent]);

    const handleAddSkill = () => {
        const trimmedSkill = newSkill.trim();
        if (trimmedSkill && !localAgent.skills.includes(trimmedSkill)) {
            setLocalAgent(prev => ({ ...prev, skills: [...prev.skills, trimmedSkill] }));
            setNewSkill('');
        }
    };

    const handleRemoveSkill = (skillToRemove: string) => {
        setLocalAgent(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skillToRemove) }));
    };

    const handleSuggestSkills = async () => {
        setIsSuggesting(true);
        const suggestions = await suggestSkills(localAgent, memories);
        const newSuggestions = suggestions.filter(s => !localAgent.skills.includes(s));
        setSuggestedSkills(newSuggestions);
        setIsSuggesting(false);
    };

    const handleAddSuggestedSkill = (skill: string) => {
        if (!localAgent.skills.includes(skill)) {
             setLocalAgent(prev => ({ ...prev, skills: [...prev.skills, skill] }));
        }
        setSuggestedSkills(prev => prev.filter(s => s !== skill));
    }

    const handleSave = () => {
        onSave(localAgent);
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="glass-effect bg-primary-light/50 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-primary-lighter/40">
                    <h3 className="text-xl font-bold text-neutral">Edit Skills for <span className="text-accent">{agent.name}</span></h3>
                    <button onClick={onClose} className="text-neutral-focus hover:text-accent transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 flex-grow overflow-y-auto max-h-[70vh] grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Current Skills Section */}
                    <div>
                        <h4 className="font-semibold text-neutral-focus mb-3">Current Skills</h4>
                        <div className="glass-effect bg-primary/50 p-3 rounded-md min-h-[150px]">
                            {localAgent.skills.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {localAgent.skills.map(skill => (
                                        <span key={skill} className="flex items-center bg-primary-lighter/60 text-sm font-medium text-neutral px-3 py-1 rounded-full">
                                            {skill}
                                            <button onClick={() => handleRemoveSkill(skill)} className="ml-2 text-neutral-focus hover:text-red-500">
                                                <XIcon className="w-3 h-3"/>
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-neutral-focus italic text-sm">No skills assigned.</p>
                            )}
                        </div>
                        <div className="mt-4 flex gap-2">
                            <input
                                type="text"
                                value={newSkill}
                                onChange={e => setNewSkill(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddSkill()}
                                placeholder="Add new skill"
                                className="w-full bg-primary/50 p-2 rounded-md text-neutral placeholder-neutral-focus/50 border border-primary-lighter/40 focus:ring-2 focus:ring-accent focus:outline-none"
                            />
                            <button onClick={handleAddSkill} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">Add</button>
                        </div>
                    </div>
                    
                    {/* AI Suggestions Section */}
                    <div>
                        <h4 className="font-semibold text-neutral-focus mb-3">AI Assistance</h4>
                        <button 
                            onClick={handleSuggestSkills} 
                            disabled={isSuggesting}
                            className="w-full bg-accent text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition flex items-center justify-center disabled:bg-gray-500"
                        >
                            {isSuggesting ? <SpinnerIcon className="w-5 h-5 mr-2"/> : '✨'}
                            {isSuggesting ? 'Analyzing Profile...' : 'Suggest New Skills'}
                        </button>
                        <div className="mt-3 glass-effect bg-primary/50 p-3 rounded-md min-h-[150px]">
                             {isSuggesting ? (
                                <div className="flex justify-center items-center h-full">
                                    <SpinnerIcon className="w-8 h-8 text-accent"/>
                                </div>
                            ) : suggestedSkills.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {suggestedSkills.map(skill => (
                                        <button key={skill} onClick={() => handleAddSuggestedSkill(skill)} className="flex items-center bg-green-600/20 text-sm font-medium text-green-300 px-3 py-1 rounded-full hover:bg-green-600/40 transition">
                                            <PlusIcon className="w-4 h-4 mr-1"/>
                                            {skill}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-neutral-focus italic text-sm text-center pt-4">Click "Suggest" to get AI-powered skill ideas.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-primary-lighter/40 bg-transparent rounded-b-lg flex justify-end">
                    <button onClick={handleSave} className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditAgentModal;