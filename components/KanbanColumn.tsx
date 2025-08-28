import React from 'react';
import { KanbanColumnId, Task } from '../types';
import KanbanCard from './KanbanCard';

interface KanbanColumnProps {
    title: KanbanColumnId;
    tasks: Task[];
    onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>, columnId: KanbanColumnId) => void;
    icon: React.ComponentType<{ className?: string }>;
    isGlowing: boolean;
    isOverloaded: boolean;
}

const KanbanColumn = ({ title, tasks, onDragStart, onDrop, icon: Icon, isGlowing, isOverloaded }: KanbanColumnProps) => {
    const [isOver, setIsOver] = React.useState(false);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        onDrop(e, title);
        setIsOver(false);
    };

    const glowClass = 'text-accent neon-text-accent';

    return (
        <div
            className="flex-shrink-0 w-80 glass-effect bg-primary-lighter/40 rounded-lg"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className={`p-4 border-b-2 border-primary-light/50 sticky top-0 bg-primary-lighter/60 rounded-t-lg flex justify-between items-center transition-all duration-300 ${isOverloaded ? 'column-overloaded-header' : ''}`}>
                <div>
                    <h3 className="font-bold text-neutral tracking-wider">{title}</h3>
                    <span className="text-sm text-neutral/60">{tasks.length} Tasks</span>
                </div>
                <Icon className={`w-8 h-8 transition-all duration-300 ${isGlowing ? glowClass : 'text-neutral/30'}`} />
            </div>
            <div className={`p-4 h-full transition-colors duration-300 ${isOver ? 'bg-primary-light/40' : ''}`}>
                {tasks.map((task) => (
                    <KanbanCard key={task.id} task={task} onDragStart={onDragStart} />
                ))}
            </div>
        </div>
    );
};

export default KanbanColumn;
