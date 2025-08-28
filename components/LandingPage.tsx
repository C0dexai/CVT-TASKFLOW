import React from 'react';
import { AGENT_PROFILE } from '../constants/agentProfile';
import TerminalIcon from './icons/TerminalIcon';
import UsersIcon from './icons/UsersIcon';
import BrainCircuitIcon from './icons/BrainCircuitIcon';

interface LandingPageProps {
    onEnter: () => void;
}

const LandingPage = ({ onEnter }: LandingPageProps) => {
    return (
        <main className="font-sans text-neutral">
            <div className="relative z-10 w-full h-screen overflow-y-auto bg-black/30">
                {/* Hero Section */}
                <section className="min-h-screen flex flex-col justify-center items-center text-center p-4 relative">
                    <h1 className="text-6xl md:text-8xl font-black uppercase tracking-widest neon-text-accent" style={{fontWeight: 900}}>
                        Cassa Vegas
                    </h1>
                    <p className="mt-4 text-xl md:text-2xl font-semibold text-neutral/80 max-w-2xl">
                        {AGENT_PROFILE.creed}
                    </p>
                    <button
                        onClick={onEnter}
                        className="mt-12 px-8 py-4 bg-accent text-white font-bold text-lg rounded-lg shadow-lg hover:bg-red-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-accent/50 neon-shadow-accent"
                    >
                        Launch Taskflow
                    </button>
                    <div className="absolute bottom-10 animate-bounce">
                        <svg className="w-8 h-8 text-neutral/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-24 bg-transparent">
                    <div className="max-w-6xl mx-auto px-4">
                        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">An Associative AI Framework</h2>
                        <div className="grid md:grid-cols-3 gap-8 text-center">
                            {/* Feature 1 */}
                            <div className="glass-effect bg-primary-light/40 p-8 rounded-lg transform hover:-translate-y-2 transition-transform duration-300">
                               <BrainCircuitIcon className="w-12 h-12 mx-auto text-accent mb-4" />
                               <h3 className="text-2xl font-bold mb-2">AI-Powered Workflow</h3>
                               <p className="text-neutral-focus">Leverage Gemini to intelligently generate, assign, and suggest hand-offs for tasks on a dynamic Kanban board.</p>
                            </div>
                            {/* Feature 2 */}
                             <div className="glass-effect bg-primary-light/40 p-8 rounded-lg transform hover:-translate-y-2 transition-transform duration-300">
                               <UsersIcon className="w-12 h-12 mx-auto text-accent mb-4" />
                               <h3 className="text-2xl font-bold mb-2">Meet the Crew</h3>
                               <p className="text-neutral-focus">Interact with a family of specialized AI agents, each with a unique personality, skillset, and role within the organization.</p>
                            </div>
                            {/* Feature 3 */}
                             <div className="glass-effect bg-primary-light/40 p-8 rounded-lg transform hover:-translate-y-2 transition-transform duration-300">
                               <TerminalIcon className="w-12 h-12 mx-auto text-accent mb-4" />
                               <h3 className="text-2xl font-bold mb-2">Orchestration Console</h3>
                               <p className="text-neutral-focus">Take direct control with a CLI to the system's core AI, issuing commands and receiving contextual, state-aware responses.</p>
                            </div>
                        </div>
                    </div>
                </section>
                <footer className="text-center py-8 glass-effect bg-primary-lighter/30 text-neutral-focus text-sm">
                    © {new Date().getFullYear()} CASSA VEGAS. All rights reserved.
                </footer>
            </div>
        </main>
    );
};

export default LandingPage;