import React, { useState } from 'react';
import { CalendarNote } from '../types';
import XIcon from './icons/XIcon';
import TrashIcon from './icons/TrashIcon';
import SpinnerIcon from './icons/SpinnerIcon';

interface NoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: Date;
    notes: CalendarNote[];
    onAddNote: (content: string) => void;
    onDeleteNote: (noteId: string) => void;
    onCreateTask: (note: CalendarNote) => Promise<void>;
}

const NoteModal = ({ isOpen, onClose, selectedDate, notes, onAddNote, onDeleteNote, onCreateTask }: NoteModalProps) => {
    const [newNoteContent, setNewNoteContent] = useState('');
    const [isCreatingTask, setIsCreatingTask] = useState<string | null>(null); // Stores ID of note being processed

    if (!isOpen) return null;

    const handleAddNote = () => {
        if (newNoteContent.trim()) {
            onAddNote(newNoteContent.trim());
            setNewNoteContent('');
        }
    };

    const handleCreateTask = async (note: CalendarNote) => {
        setIsCreatingTask(note.id);
        await onCreateTask(note);
        setIsCreatingTask(null);
        onClose(); // Close modal after task creation
    }

    const day = selectedDate.getDate();
    const monthName = selectedDate.toLocaleString('default', { month: 'long' });

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="glass-effect bg-primary-light/50 rounded-lg shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-primary-lighter/40">
                    <h3 className="text-xl font-bold text-neutral">Notes for {monthName} {day}</h3>
                    <button onClick={onClose} className="text-neutral-focus hover:text-accent transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-4 max-h-[60vh] overflow-y-auto">
                    {notes.length === 0 ? (
                        <p className="text-neutral-focus italic text-center py-4">No notes for this day.</p>
                    ) : (
                        <ul className="space-y-3">
                            {notes.map((note) => (
                                <li key={note.id} className="glass-effect bg-primary-lighter/60 p-3 rounded-md flex justify-between items-start gap-2">
                                    <p className="text-neutral flex-grow break-words">{note.content}</p>
                                    <div className="flex-shrink-0 flex flex-col items-center gap-2">
                                        <button 
                                            onClick={() => handleCreateTask(note)} 
                                            disabled={!!isCreatingTask}
                                            className="text-xs bg-accent text-white px-2 py-1 rounded hover:bg-red-700 transition disabled:bg-gray-500 w-full flex justify-center items-center"
                                        >
                                            {isCreatingTask === note.id ? <SpinnerIcon className="w-4 h-4" /> : 'Create Task'}
                                        </button>
                                        <button onClick={() => onDeleteNote(note.id)} disabled={!!isCreatingTask} className="text-neutral-focus hover:text-red-500 transition disabled:opacity-50">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="p-4 border-t border-primary-lighter/40">
                    <h4 className="font-semibold text-neutral-focus mb-2">Add New Note</h4>
                    <textarea
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        className="w-full bg-primary/50 p-2 rounded-md text-neutral placeholder-neutral-focus/50 border border-primary-lighter/40 focus:ring-2 focus:ring-accent focus:outline-none"
                        placeholder="Type your note here..."
                        rows={3}
                    />
                    <button
                        onClick={handleAddNote}
                        className="mt-2 w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-300"
                    >
                        Add Note
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NoteModal;