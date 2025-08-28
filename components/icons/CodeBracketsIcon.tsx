import React from 'react';

const CodeBracketsIcon = ({ className }: { className?: string }) => (
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
        <path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3" />
        <path d="M16 21h3a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-3" />
        <path d="M10 9l-2 2 2 2" />
        <path d="M14 15l2-2-2-2" />
    </svg>
);

export default CodeBracketsIcon;
