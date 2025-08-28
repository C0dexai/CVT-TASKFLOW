import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Agent, ChatMessage, MemoryEntry } from '../types';
import { startAgentConversation } from '../services/aiService';
import XIcon from './icons/XIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import CopyIcon from './icons/CopyIcon';
import CheckIcon from './icons/CheckIcon';
import SendIcon from './icons/SendIcon';

interface IntroductionModalProps {
    agent: Agent;
    onClose: () => void;
    memories: MemoryEntry[];
    addMemory: (entry: Omit<MemoryEntry, 'id' | 'timestamp'>) => void;
}

const MIN_WIDTH = 450;
const MIN_HEIGHT = 400;

const IntroductionModal = ({ agent, onClose, memories, addMemory }: IntroductionModalProps) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [size, setSize] = useState({
        width: Math.max(MIN_WIDTH, window.innerWidth * 0.5, 672),
        height: Math.max(MIN_HEIGHT, window.innerHeight * 0.8),
    });
    const [isResizing, setIsResizing] = useState<string | null>(null);
    const dragStartRef = useRef<{ startX: number, startY: number, startWidth: number, startHeight: number } | null>(null);


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    useEffect(() => {
        // Record conversation memory when the modal is closed
        return () => {
            if (messages.length > 1) { // Only save if there was an interaction
                addMemory({
                    type: 'CONVERSATION',
                    agentName: agent.name,
                    summary: `Had a conversation with ${agent.name}.`,
                    details: {
                        messageCount: messages.length,
                        finalMessage: messages[messages.length - 1].content.substring(0, 100)
                    }
                });
            }
        };
    }, [messages, agent, addMemory]);

    const handleResizeMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, direction: string) => {
        e.preventDefault();
        setIsResizing(direction);
        dragStartRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startWidth: size.width,
            startHeight: size.height,
        };
    }, [size.width, size.height]);

    const handleResizeMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing || !dragStartRef.current) return;

        const dx = e.clientX - dragStartRef.current.startX;
        const dy = e.clientY - dragStartRef.current.startY;

        let newWidth = dragStartRef.current.startWidth;
        let newHeight = dragStartRef.current.startHeight;

        if (isResizing.includes('right')) {
            newWidth = dragStartRef.current.startWidth + dx;
        }
        if (isResizing.includes('bottom')) {
            newHeight = dragStartRef.current.startHeight + dy;
        }

        setSize({
            width: Math.max(MIN_WIDTH, newWidth),
            height: Math.max(MIN_HEIGHT, newHeight),
        });
    }, [isResizing]);

    const handleResizeMouseUp = useCallback(() => {
        setIsResizing(null);
        dragStartRef.current = null;
    }, []);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', handleResizeMouseMove);
            window.addEventListener('mouseup', handleResizeMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleResizeMouseMove);
            window.removeEventListener('mouseup', handleResizeMouseUp);
        };
    }, [isResizing, handleResizeMouseMove, handleResizeMouseUp]);

    const createMessage = (role: 'user' | 'model', content: string): ChatMessage => ({
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        role,
        content,
    });

    const handleCopy = (message: ChatMessage) => {
        if (!message.content) return;
        navigator.clipboard.writeText(message.content);
        setCopiedMessageId(message.id);
        setTimeout(() => setCopiedMessageId(null), 2000);
    };

    const handleStream = async (prompt: string) => {
        setIsLoading(true);
        setError(null);
        setShowSuggestions(false);
        
        const history = messages.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        }));

        try {
            const stream = await startAgentConversation(agent, history, prompt, memories);
            
            let fullResponse = '';
            const placeholderMessage = createMessage('model', '');
            setMessages(prev => [...prev, placeholderMessage]);

            for await (const chunk of stream) {
                fullResponse += chunk.text;
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === placeholderMessage.id
                            ? { ...msg, content: fullResponse }
                            : msg
                    )
                );
            }
        } catch (err) {
            console.error("Error in conversation stream:", err);
            setError("Sorry, I'm having trouble connecting right now.");
        } finally {
            setIsLoading(false);
            setShowSuggestions(true);
        }
    };

    useEffect(() => {
        const initialPrompt = `Introduce yourself to the System Operator. In character, briefly explain your primary role, your key skills, and how you help the CASSA VEGAS family achieve its mission.`;
        handleStream(initialPrompt);
    }, [agent]);
    
    const handleSuggestionClick = (suggestion: string) => {
        setMessages(prev => [...prev, createMessage('user', suggestion)]);
        handleStream(suggestion);
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedInput = userInput.trim();
        if (!trimmedInput || isLoading) return;

        setMessages(prev => [...prev, createMessage('user', trimmedInput)]);
        handleStream(trimmedInput);
        setUserInput('');
    };

    const suggestedQuestions = [
        "How do you use the KANBAN board?",
        "What kind of Calendar notes help you?",
        "Explain your skills in more detail."
    ];

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                style={{ width: `${size.width}px`, height: `${size.height}px` }}
                className="glass-effect bg-primary-light/50 rounded-lg shadow-2xl flex flex-col relative overflow-hidden" 
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Content */}
                <div className="flex justify-between items-center p-4 border-b border-primary-lighter/40 flex-shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-neutral">Activating: <span className="text-accent">{agent.name}</span></h3>
                        <p className="text-sm text-neutral-focus">{agent.role}</p>
                    </div>
                    <button onClick={onClose} className="text-neutral-focus hover:text-accent transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-4 flex-grow overflow-y-auto space-y-4">
                    {messages.map((msg, index) => (
                        <div key={msg.id} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {/* For USER messages, button comes first */}
                            {msg.role === 'user' && msg.content && (
                                <button
                                    onClick={() => handleCopy(msg)}
                                    className={`flex-shrink-0 p-1.5 rounded-full text-neutral-focus transition-colors duration-200 self-center
                                    ${copiedMessageId === msg.id ? 'bg-green-500/30' : 'bg-primary/60 hover:bg-primary-lighter/60'}`
                                    }
                                    aria-label="Copy message"
                                >
                                    {copiedMessageId === msg.id ? (
                                        <CheckIcon className="w-4 h-4 text-green-400" />
                                    ) : (
                                        <CopyIcon className="w-4 h-4" />
                                    )}
                                </button>
                            )}

                            {/* For MODEL messages, avatar comes first */}
                            {msg.role === 'model' && (
                                <div className="w-8 h-8 rounded-full bg-accent flex-shrink-0 flex items-center justify-center font-bold text-sm text-white">{agent.name.charAt(0)}</div>
                            )}

                            {/* The message bubble */}
                            <div className={`max-w-md lg:max-w-lg p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'glass-effect bg-primary-lighter/60 text-neutral'}`}>
                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                {msg.role === 'model' && isLoading && index === messages.length - 1 && <SpinnerIcon className="w-4 h-4 mt-2" />}
                            </div>

                            {/* For MODEL messages, button comes last */}
                            {msg.role === 'model' && msg.content && (
                                <button
                                    onClick={() => handleCopy(msg)}
                                    className={`flex-shrink-0 p-1.5 rounded-full text-neutral-focus transition-colors duration-200 self-center
                                    ${copiedMessageId === msg.id ? 'bg-green-500/30' : 'bg-primary/60 hover:bg-primary-lighter/60'}`
                                    }
                                    aria-label="Copy message"
                                >
                                    {copiedMessageId === msg.id ? (
                                        <CheckIcon className="w-4 h-4 text-green-400" />
                                    ) : (
                                        <CopyIcon className="w-4 h-4" />
                                    )}
                                </button>
                            )}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                    {error && <p className="text-red-500 text-center">{error}</p>}
                </div>
                
                <div className="p-4 border-t border-primary-lighter/40 flex-shrink-0">
                    {showSuggestions && !isLoading && (
                        <div className="mb-4">
                            <p className="text-sm font-semibold text-neutral-focus mb-2">Suggested prompts:</p>
                            <div className="flex flex-wrap gap-2">
                                {suggestedQuestions.map(q => (
                                    <button key={q} onClick={() => handleSuggestionClick(q)} className="glass-effect bg-primary-lighter/50 text-neutral-focus text-sm px-3 py-1.5 rounded-full hover:bg-accent hover:text-white transition">
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder={`Message ${agent.name}...`}
                            disabled={isLoading}
                            className="w-full bg-primary/50 p-2 rounded-md text-neutral placeholder-neutral-focus/50 border border-primary-lighter/40 focus:ring-2 focus:ring-accent focus:outline-none"
                            autoComplete="off"
                        />
                        <button 
                            type="submit" 
                            disabled={isLoading || !userInput.trim()}
                            className="bg-accent text-white p-2 rounded-md font-semibold hover:bg-red-700 transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex-shrink-0"
                            aria-label="Send message"
                        >
                            <SendIcon className="w-5 h-5" />
                        </button>
                    </form>
                </div>
                
                {/* Resize Handles */}
                <div onMouseDown={(e) => handleResizeMouseDown(e, 'right')} className="absolute top-0 right-0 h-full w-2 cursor-ew-resize" />
                <div onMouseDown={(e) => handleResizeMouseDown(e, 'bottom')} className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize" />
                <div onMouseDown={(e) => handleResizeMouseDown(e, 'right-bottom')} className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize group">
                     <div className="w-full h-full border-r-2 border-b-2 border-neutral/40 group-hover:border-accent transition-colors"></div>
                </div>
            </div>
        </div>
    );
};

export default IntroductionModal;
