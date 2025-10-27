
import React, { useState, useEffect, useCallback } from 'react';
import { Tab, UserProfile } from './types';
import Setup from './components/views/Setup';
import Ask from './components/views/Ask';
import Live from './components/views/Live';
import Vision from './components/views/Vision';
import Settings from './components/views/Settings';
import BottomNav from './components/layout/BottomNav';

const App: React.FC = () => {
  const [isSetupComplete, setIsSetupComplete] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Ask);
  const [systemInstruction, setSystemInstruction] = useState<string>('');

  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem('userProfile');
      const storedInstruction = localStorage.getItem('assistantInstructions');
      if (storedProfile) {
        setUserProfile(JSON.parse(storedProfile));
        setIsSetupComplete(true);
      }
      if (storedInstruction) {
        setSystemInstruction(storedInstruction);
      }
    } catch (error) {
      console.error("Failed to parse data from localStorage", error);
      localStorage.clear(); // Clear corrupted storage
    }
  }, []);

  const handleSetupComplete = useCallback((profile: UserProfile) => {
    localStorage.setItem('userProfile', JSON.stringify(profile));
    setUserProfile(profile);
    setIsSetupComplete(true);
  }, []);
  
  const handleLogout = useCallback(() => {
    localStorage.clear();
    setUserProfile(null);
    setIsSetupComplete(false);
    setSystemInstruction('');
    setActiveTab(Tab.Ask);
  }, []);

  const handleSettingsSave = (instructions: string) => {
    setSystemInstruction(instructions);
  };


  const renderContent = () => {
    switch (activeTab) {
      case Tab.Ask:
        return <Ask userProfile={userProfile!} systemInstruction={systemInstruction} />;
      case Tab.Live:
        return <Live />;
      case Tab.Vision:
        return <Vision systemInstruction={systemInstruction} />;
      case Tab.Settings:
        return <Settings userProfile={userProfile!} onLogout={handleLogout} onSave={handleSettingsSave} />;
      default:
        return <Ask userProfile={userProfile!} systemInstruction={systemInstruction} />;
    }
  };

  if (!isSetupComplete) {
    return <Setup onSetupComplete={handleSetupComplete} />;
  }

  return (
    <div className="h-screen w-screen bg-slate-900 flex flex-col font-sans">
      <main className="flex-1 overflow-y-auto pb-20">
        {renderContent()}
      </main>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;