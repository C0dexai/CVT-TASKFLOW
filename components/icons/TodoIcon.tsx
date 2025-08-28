import React from 'react';

const TodoIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="5" width="6" height="6" rx="1"></rect>
        <rect x="3" y="13" width="6" height="6" rx="1"></rect>
        <line x1="12" y1="8" x2="21" y2="8"></line>
        <line x1="12" y1="16" x2="21" y2="16"></line>
    </svg>
);

export default TodoIcon;