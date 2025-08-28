import React from 'react';
import { Task } from '../types';
import { AGENT_PROFILE } from '../constants/agentProfile';

interface KanbanCardProps {
    task: Task;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
}

const KanbanCard = ({ task, onDragStart }: KanbanCardProps) => {
    const agent = AGENT_PROFILE.members.find(m => m.name === task.agentName);
    const agentColor = agent?.gender === 'Male' ? 'border-l-blue-500' : 'border-l-pink-500';

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, task.id)}
            className={`glass-effect bg-primary-light/60 p-4 mb-3 rounded-lg cursor-grab active:cursor-grabbing border-l-4 ${agentColor} transition-shadow duration-200 hover:shadow-xl`}
        >
            <p className="text-neutral font-medium mb-2">{task.content}</p>
            <div className="text-xs text-neutral/70 font-semibold">
                Assigned: <span className="text-accent">{task.agentName}</span>
            </div>
        </div>
    );
};

export default KanbanCard;