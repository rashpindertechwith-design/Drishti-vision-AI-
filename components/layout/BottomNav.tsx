
import React from 'react';
import { Tab } from '../../types';
import { ICONS } from '../../constants';

interface BottomNavProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 shadow-lg">
      <div className="flex justify-around max-w-2xl mx-auto">
        {Object.values(Tab).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex flex-col items-center justify-center w-full pt-3 pb-2 text-sm transition-colors duration-200 ${
              activeTab === tab ? 'text-sky-400' : 'text-slate-400 hover:text-sky-300'
            }`}
          >
            {ICONS[tab]}
            <span className="mt-1">{tab}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
