import React from 'react';
import CodeBracketsIcon from './icons/CodeBracketsIcon';

interface IntegrationCardProps {
    title: string;
    description: string;
    logo: React.ReactNode;
}

const IntegrationCard = ({ title, logo, description }: IntegrationCardProps) => (
    <div className="glass-effect bg-primary-light/50 rounded-lg p-6 border-transparent hover:border-accent transition-colors duration-300 flex flex-col items-start">
        <div className="flex items-center gap-4 mb-4">
            <div className="bg-primary-lighter/60 p-3 rounded-lg">
                {logo}
            </div>
            <h3 className="text-xl font-bold text-neutral">{title}</h3>
        </div>
        <p className="text-neutral-focus text-sm">{description}</p>
    </div>
);

const Integrations = () => {
    const integrations = [
        {
            title: "Gemini Studio",
            logo: <img src="https://www.gstatic.com/a/images/brand/google_wordmark_logo_192px_clr_white_v3.svg" alt="Google Logo" className="w-8 h-auto" />,
            description: "The application's core logic is natively built on the Google Gemini API. It leverages advanced multi-turn reasoning, tool use, and streaming capabilities for all AI-driven features, from task generation to the live orchestration console."
        },
        {
            title: "OpenAI Compatible",
            logo: <CodeBracketsIcon className="w-8 h-8 text-green-400" />,
            description: "The CUA (Conversational User Agent) architecture is designed with principles compatible with OpenAI's models. This allows for straightforward adaptation of agentic prompts and tool-use patterns, ensuring conceptual interoperability."
        },
        {
            title: "V0.dev Principles",
            logo: <CodeBracketsIcon className="w-8 h-8 text-cyan-400" />,
            description: "Components are designed with modularity in mind, echoing the philosophy of V0.dev for rapid UI generation and iteration. The visual and structural elements can be easily described, maintained, and adapted using generative UI concepts."
        },
        {
            title: "Abacus.AI Philosophy",
            logo: <CodeBracketsIcon className="w-8 h-8 text-purple-400" />,
            description: "The focus on contextual memory and real-time data integration for decision-making aligns with the full-stack AI platform principles of Abacus.AI. This ensures our agents operate with a deep, historical understanding of the operational environment."
        },
    ];

    return (
        <div className="p-4 sm:p-6 md:p-8 text-neutral">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-neutral">C.U.A. Integration Matrix</h2>
                <p className="text-accent mt-1 text-lg">A Framework for Associative AI Technology</p>
                <p className="max-w-3xl mx-auto mt-4 text-neutral-focus">
                    The CASSA VEGAS platform is built on a CUA (Conversational User Agent) framework, designed for robust interoperability. Its core components are engineered to be conceptually aligned with leading AI platforms, ensuring the system is both powerful and adaptable.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {integrations.map(item => (
                    <IntegrationCard key={item.title} {...item} />
                ))}
            </div>
        </div>
    );
};

export default Integrations;