import React from 'react';
import { AGENT_PROFILE } from '../constants/agentProfile';
import { Tab } from '../types';

interface HeaderProps {
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
}

const Header = ({ activeTab, setActiveTab }: HeaderProps) => {
    const tabs: Tab[] = ['KANBAN', 'AI Family', 'Calendar', 'Memory', 'Console', 'Settings', 'Integrations'];

    return (
        <header className="glass-effect bg-primary-light/60 p-4 border-b-2 border-accent">
            <div className="container mx-auto flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <span className="text-2xl font-bold tracking-wider text-accent">
                        {AGENT_PROFILE.organization}
                    </span>
                    <span className="text-sm text-neutral/70 hidden md:block">
                        {AGENT_PROFILE.protocols.motto}
                    </span>
                </div>
                <nav className="flex items-center glass-effect bg-primary-lighter/40 rounded-lg p-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-300 ${
                                activeTab === tab
                                    ? 'bg-accent text-white'
                                    : 'text-neutral-focus hover:bg-primary-light/60'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>
        </header>
    );
};

export default Header;