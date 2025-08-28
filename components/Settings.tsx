import React from 'react';
import SettingsIcon from './icons/SettingsIcon';
import CodeBracketsIcon from './icons/CodeBracketsIcon';

interface ApiSetting {
    name: string;
    description: string;
    envVar: string;
    isConfigured: boolean;
    logo: React.ReactNode;
}

const ApiSettingCard = ({ setting }: { setting: ApiSetting }) => {
    const [key, setKey] = React.useState('');

    const handleSave = () => {
        if (!key.trim()) {
            alert('API Key cannot be empty.');
            return;
        }
        localStorage.setItem(setting.envVar, key);
        alert(`API key for ${setting.envVar} has been updated. The application will now reload to apply the changes.`);
        window.location.reload();
    };

    const handleClear = () => {
        localStorage.removeItem(setting.envVar);
        alert(`API key for ${setting.envVar} has been cleared. The application will now reload.`);
        window.location.reload();
    };

    return (
        <div className="glass-effect bg-primary-light/50 rounded-lg p-6 border-transparent flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                    <div className="bg-primary-lighter/60 p-3 rounded-lg">
                        {setting.logo}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-neutral">{setting.name}</h3>
                        <p className="text-sm text-neutral-focus">Required ENV Variable: <code className="bg-primary/80 px-1 rounded">{setting.envVar}</code></p>
                    </div>
                </div>
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${setting.isConfigured ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {setting.isConfigured ? 'Active' : 'Inactive'}
                </span>
            </div>
            <p className="text-neutral-focus text-sm flex-grow">{setting.description}</p>
            
            <div className="mt-4 pt-4 border-t border-primary-lighter/40">
                <label htmlFor={`${setting.envVar}-input`} className="text-sm font-semibold text-neutral-focus mb-2 block">
                    {setting.isConfigured ? 'Update Key Value' : 'Set API Key Value'}
                </label>
                <div className="flex items-center gap-2">
                    <input
                        id={`${setting.envVar}-input`}
                        type="password"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        placeholder="Enter API Key and click Save"
                        className="w-full bg-primary/50 p-2 rounded-md text-neutral placeholder-neutral-focus/50 border border-primary-lighter/40 focus:ring-2 focus:ring-accent focus:outline-none"
                    />
                    <button 
                        onClick={handleSave}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-300 flex-shrink-0"
                    >
                        Save
                    </button>
                </div>
                {setting.isConfigured && (
                    <button 
                        onClick={handleClear}
                        className="text-xs text-neutral-focus hover:text-accent mt-2 underline"
                    >
                        Clear Saved Key & Reload
                    </button>
                )}
            </div>
        </div>
    );
};

const Settings = () => {
    // This is a "read-only" check. The component does not handle secrets,
    // it only checks for their existence as a status indicator for the user.
    const apiSettings: ApiSetting[] = [
        {
            name: "Google Gemini",
            description: "The core AI engine for most application logic, including task generation and console commands. Acts as a fallback for conversations.",
            envVar: "API_KEY",
            isConfigured: !!process.env.API_KEY,
            logo: <img src="https://www.gstatic.com/a/images/brand/google_wordmark_logo_192px_clr_white_v3.svg" alt="Google Logo" className="w-8 h-auto" />
        },
        {
            name: "OpenAI",
            description: "If configured, this is the primary engine for agent conversations in the 'AI Family' tab, providing an alternative AI model for interactive chats.",
            envVar: "OPENAI_API_KEY",
            isConfigured: !!process.env.OPENAI_API_KEY,
            logo: <CodeBracketsIcon className="w-8 h-8 text-green-400" />
        },
        {
            name: "V0.dev",
            description: "API key for potential future integration with generative UI services to dynamically create or modify components.",
            envVar: "V0_API_KEY",
            isConfigured: !!process.env.V0_API_KEY,
            logo: <CodeBracketsIcon className="w-8 h-8 text-cyan-400" />
        },
        {
            name: "Abacus.ai",
            description: "Connect to a custom full-stack AI platform for advanced MLOps, model monitoring, or custom model hosting.",
            envVar: "ABACUS_API_KEY",
            isConfigured: !!process.env.ABACUS_API_KEY,
            logo: <CodeBracketsIcon className="w-8 h-8 text-purple-400" />
        },
        {
            name: "CASSA VEGAS API",
            description: "A custom API key for authenticating with internal Cassa Vegas services or databases.",
            envVar: "CASSA_VEGAS_API_KEY",
            isConfigured: !!process.env.CASSA_VEGAS_API_KEY,
            logo: <span className="text-accent font-bold text-lg">CV</span>
        }
    ];

    return (
        <div className="p-4 sm:p-6 md:p-8 text-neutral">
            <div className="flex items-center gap-3 mb-8">
                <SettingsIcon className="w-10 h-10 text-accent" />
                <div>
                    <h2 className="text-3xl font-bold">API & Integration Settings</h2>
                    <p className="text-neutral-focus">Monitor the status of your application's API connections.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {apiSettings.map(setting => (
                    <ApiSettingCard key={setting.name} setting={setting} />
                ))}
            </div>
        </div>
    );
};

export default Settings;