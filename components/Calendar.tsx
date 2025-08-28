import React, { useState, useMemo } from 'react';
import { CalendarNote, Task, Agent, MemoryEntry } from '../types';
import NoteModal from './NoteModal';
import { generateTaskFromNote } from '../services/aiService';
import PlusIcon from './icons/PlusIcon';

interface CalendarProps {
    onAddTask: (task: Task) => void;
    agents: Agent[];
    memories: MemoryEntry[];
    addMemory: (entry: Omit<MemoryEntry, 'id' | 'timestamp'>) => void;
    notes: Record<string, CalendarNote[]>;
    setNotes: React.Dispatch<React.SetStateAction<Record<string, CalendarNote[]>>>;
}

const Calendar = ({ onAddTask, agents, memories, addMemory, notes, setNotes }: CalendarProps) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const handleDateClick = (day: Date) => {
        setSelectedDate(day);
        setIsModalOpen(true);
    };

    const handleAddNote = (content: string) => {
        if (!selectedDate) return;
        const dateKey = selectedDate.toISOString().split('T')[0];
        const newNote: CalendarNote = {
            id: `note-${Date.now()}`,
            date: dateKey,
            content,
        };
        
        setNotes(prevNotes => {
            const updatedNotes = { ...prevNotes };
            if (!updatedNotes[dateKey]) {
                updatedNotes[dateKey] = [];
            }
            updatedNotes[dateKey].push(newNote);
            return updatedNotes;
        });
        
        addMemory({
            type: 'NOTE_CREATION',
            agentName: null, // Notes are system-level
            summary: `Created a note on ${dateKey}: "${content.substring(0, 30)}..."`,
            details: { noteId: newNote.id, date: dateKey }
        });
    };

    const handleDeleteNote = (noteId: string) => {
        if (!selectedDate) return;
        const dateKey = selectedDate.toISOString().split('T')[0];
        const noteToDelete = notes[dateKey]?.find(note => note.id === noteId);

        if (noteToDelete) {
             addMemory({
                type: 'NOTE_DELETE',
                agentName: null,
                summary: `Deleted a note from ${dateKey}.`,
                details: { noteId: noteToDelete.id, content: noteToDelete.content }
            });
            
            setNotes(prevNotes => {
                const updatedNotes = { ...prevNotes };
                updatedNotes[dateKey] = updatedNotes[dateKey].filter(note => note.id !== noteId);
                if (updatedNotes[dateKey].length === 0) {
                    delete updatedNotes[dateKey];
                }
                return updatedNotes;
            });
        }
    };

    const handleCreateTaskFromNote = async (note: CalendarNote) => {
        const partialTask = await generateTaskFromNote(note, agents, memories);
        if (partialTask) {
            const newTask: Task = {
                ...partialTask,
                id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                stage: 'Backlog',
            };
            onAddTask(newTask);
        }
    };

    const changeMonth = (offset: number) => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setMonth(newDate.getMonth() + offset);
            return newDate;
        });
    };
    
    const calendarGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-start-${i}`} className="border-r border-b border-primary-lighter/30"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateKey = date.toISOString().split('T')[0];
            const dayNotes = notes[dateKey] || [];
            
            const isToday = new Date().toDateString() === date.toDateString();

            days.push(
                <div key={day} className="relative p-2 border-r border-b border-primary-lighter/30 min-h-[120px] flex flex-col hover:bg-primary-light/50 transition-colors group">
                    <time dateTime={dateKey} className={`font-semibold ${isToday ? 'bg-accent text-white rounded-full w-7 h-7 flex items-center justify-center' : 'text-neutral'}`}>
                        {day}
                    </time>
                    <div className="flex-grow mt-1 overflow-y-auto">
                        {dayNotes.length > 0 && (
                             <button onClick={() => handleDateClick(date)} className="text-left w-full">
                                <span className="text-xs bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">
                                    {dayNotes.length} {dayNotes.length > 1 ? 'notes' : 'note'}
                                </span>
                             </button>
                        )}
                    </div>
                     <button onClick={() => handleDateClick(date)} className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-accent p-1 rounded-full text-white">
                        <PlusIcon className="w-4 h-4" />
                    </button>
                </div>
            );
        }
        return days;
    }, [currentDate, notes]);

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="p-4 sm:p-6 md:p-8 text-neutral">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">
                    {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
                </h2>
                <div className="flex space-x-2">
                    <button onClick={() => changeMonth(-1)} className="px-4 py-2 glass-effect bg-primary-light/50 rounded-md hover:bg-primary-lighter/50 transition">Prev</button>
                    <button onClick={() => changeMonth(1)} className="px-4 py-2 glass-effect bg-primary-light/50 rounded-md hover:bg-primary-lighter/50 transition">Next</button>
                </div>
            </div>

            <div className="glass-effect bg-primary-lighter/40 border-t border-l border-transparent shadow-lg rounded-lg overflow-hidden">
                <div className="grid grid-cols-7">
                    {weekdays.map(day => (
                        <div key={day} className="text-center font-bold p-3 bg-primary-light/60 border-r border-b border-primary-lighter/30">{day}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7">
                    {calendarGrid}
                </div>
            </div>
            
            {selectedDate && (
                <NoteModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    selectedDate={selectedDate}
                    notes={notes[selectedDate.toISOString().split('T')[0]] || []}
                    onAddNote={handleAddNote}
                    onDeleteNote={handleDeleteNote}
                    onCreateTask={handleCreateTaskFromNote}
                />
            )}
        </div>
    );
};

export default Calendar;