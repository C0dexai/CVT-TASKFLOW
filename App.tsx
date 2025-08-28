import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import KanbanBoard from './components/KanbanBoard';
import AIFamily from './components/AIFamily';
import Calendar from './components/Calendar';
import MemoryLog from './components/MemoryLog';
import OrchestrationConsole from './components/OrchestrationConsole';
import Settings from './components/Settings';
import Integrations from './components/Integrations';
import LandingPage from './components/LandingPage';
import { Tab, Task, Agent, MemoryEntry, CalendarNote } from './types';
import { generateInitialTasks } from './services/aiService';
import { AGENT_PROFILE } from './constants/agentProfile';
import * as db from './utils/db'; // Using IndexedDB for state

const App = () => {
    const [hasEntered, setHasEntered] = useState(() => {
        // Skip landing page if user has already entered
        return localStorage.getItem('hasEnteredCassaVegas') === 'true';
    });
    const [activeTab, setActiveTab] = useState<Tab>('KANBAN');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isAppLoading, setIsAppLoading] = useState<boolean>(true);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [memories, setMemories] = useState<MemoryEntry[]>([]);
    const [notes, setNotes] = useState<Record<string, CalendarNote[]>>({});

    // Load initial state from IndexedDB
    useEffect(() => {
        const loadStateFromDB = async () => {
            setIsAppLoading(true);
            try {
                const [storedAgents, storedTasks, storedMemories, storedNotes] = await Promise.all([
                    db.getAppState<Agent[]>('agents'),
                    db.getAppState<Task[]>('tasks'),
                    db.getAppState<MemoryEntry[]>('memories'),
                    db.getAppState<Record<string, CalendarNote[]>>('notes'),
                ]);

                let initialAgents = storedAgents;
                if (!initialAgents || initialAgents.length === 0) {
                    initialAgents = AGENT_PROFILE.members;
                    await db.setAppState('agents', initialAgents);
                }
                setAgents(initialAgents);
                setTasks(storedTasks || []);
                setMemories(storedMemories || []);
                setNotes(storedNotes || {});

            } catch (error) {
                console.error("Failed to load state from IndexedDB, falling back to defaults.", error);
                setAgents(AGENT_PROFILE.members);
            } finally {
                setIsAppLoading(false);
            }
        };

        loadStateFromDB();
    }, []);

    // Save state changes back to IndexedDB
    useEffect(() => {
        if (!isAppLoading) db.setAppState('agents', agents);
    }, [agents, isAppLoading]);
    
    useEffect(() => {
        if (!isAppLoading) db.setAppState('tasks', tasks);
    }, [tasks, isAppLoading]);

    useEffect(() => {
        if (!isAppLoading) db.setAppState('memories', memories);
    }, [memories, isAppLoading]);
    
    useEffect(() => {
        if (!isAppLoading) db.setAppState('notes', notes);
    }, [notes, isAppLoading]);

    const addMemory = (entry: Omit<MemoryEntry, 'id' | 'timestamp'>) => {
        const newMemory: MemoryEntry = {
            ...entry,
            id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            timestamp: new Date().toISOString(),
        };
        setMemories(prev => [...prev, newMemory]);
    };

    const fetchInitialTasks = useCallback(async (showLoading = true) => {
        // Don't show app loading for regeneration, KanbanBoard has its own spinner
        if (showLoading) {
          setIsAppLoading(true);
        }
        const initialTasks = await generateInitialTasks(agents);
        setTasks(initialTasks);
        if (showLoading) {
          setIsAppLoading(false);
        }
    }, [agents]);

    // Fetch initial tasks from AI if the board is empty after loading from DB
    useEffect(() => {
        if (isAppLoading) return; // Wait until DB load is complete

        const anyKeyAvailable = !!process.env.API_KEY || !!process.env.OPENAI_API_KEY;
        if (tasks.length === 0 && agents.length > 0 && anyKeyAvailable) {
            fetchInitialTasks();
        } else if (!anyKeyAvailable && tasks.length === 0) {
            console.warn("No API key configured. App will not fetch initial tasks.");
        }
    }, [isAppLoading, tasks.length, agents.length, fetchInitialTasks]);

    const addNewTask = (
        task: Omit<Task, 'id' | 'stage'>,
        options: { stage?: 'Backlog', showAlert?: boolean, switchTab?: boolean } = {}
    ) => {
      const { stage = 'Backlog', showAlert = true, switchTab = true } = options;
      const newTask = {
          ...task,
          id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          stage: stage,
      };
      setTasks(prevTasks => [...prevTasks, newTask]);
      addMemory({
          type: 'TASK_CREATION',
          agentName: task.agentName,
          summary: `Created task "${task.content}" and assigned to ${task.agentName}.`,
          details: { taskId: newTask.id, content: task.content }
      });
      if (showAlert) {
        alert(`New task "${task.content}" added to the Backlog!`);
      }
      if (switchTab) {
        setActiveTab('KANBAN');
      }
    };
    
    const handleAddTaskFromCalendar = (task: Task) => {
      setTasks(prevTasks => [...prevTasks, task]);
       addMemory({
          type: 'TASK_CREATION',
          agentName: task.agentName,
          summary: `Created task "${task.content}" from calendar note, assigned to ${task.agentName}.`,
          details: { taskId: task.id, content: task.content }
      });
      alert(`New task "${task.content}" added to the Backlog!`);
      setActiveTab('KANBAN');
    }

    const handleEnter = () => {
        localStorage.setItem('hasEnteredCassaVegas', 'true');
        setHasEntered(true);
    };

    if (!hasEntered) {
        return <LandingPage onEnter={handleEnter} />;
    }


    return (
        <div className="min-h-screen font-sans bg-black/30">
            <Header activeTab={activeTab} setActiveTab={setActiveTab} />
            <main>
                {activeTab === 'KANBAN' && (
                  <KanbanBoard 
                    tasks={tasks} 
                    setTasks={setTasks} 
                    agents={agents}
                    isLoading={isAppLoading}
                    onRegenerateTasks={() => fetchInitialTasks(false)}
                    memories={memories}
                    addMemory={addMemory}
                  />
                )}
                {activeTab === 'AI Family' && <AIFamily agents={agents} setAgents={setAgents} memories={memories} addMemory={addMemory} onAddTask={addNewTask}/>}
                {activeTab === 'Calendar' && (
                    <Calendar 
                        onAddTask={handleAddTaskFromCalendar} 
                        agents={agents} 
                        memories={memories} 
                        addMemory={addMemory} 
                        notes={notes}
                        setNotes={setNotes}
                    />
                )}
                {activeTab === 'Memory' && <MemoryLog memories={memories} setMemories={setMemories} agents={agents} />}
                {activeTab === 'Console' && (
                    <OrchestrationConsole
                        agents={agents}
                        tasks={tasks}
                        memories={memories}
                        notes={notes}
                        onAddTask={addNewTask}
                    />
                )}
                {activeTab === 'Settings' && <Settings />}
                {activeTab === 'Integrations' && <Integrations />}
            </main>
        </div>
    );
};

export default App;
