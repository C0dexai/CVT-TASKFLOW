import React from 'react';

const BrainCircuitIcon = ({ className }: { className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M12 5a3 3 0 1 0-5.993.129" />
        <path d="M12 5a3 3 0 1 1 5.993.129" />
        <path d="M15 8.35a3 3 0 1 0-5.993.13" />
        <path d="M9 8.35a3 3 0 1 1 5.993.13" />
        <path d="M14 15a3 3 0 1 0-5.993.129" />
        <path d="M12 12a3 3 0 1 1 5.993.129" />
        <path d="M12 12a3 3 0 1 0-5.993.129" />
        <path d="M15 15.65a3 3 0 1 1 5.993.13" />
        <path d="M9 15.65a3 3 0 1 0 5.993.13" />
        <path d="M14 8.5h-4" />
        <path d="M15 15.5v-2.5" />
        <path d="M9 15.5v-2.5" />
        <path d="M12 12v-2" />
        <path d="M12 19v-2" />
    </svg>
);

export default BrainCircuitIcon;