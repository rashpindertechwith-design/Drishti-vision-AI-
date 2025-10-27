
import React, { useState } from 'react';
import { UserProfile, SurveyAnswers } from '../../types';

interface SettingsProps {
  userProfile: UserProfile;
  onLogout: () => void;
  onSave: (instructions: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ userProfile, onLogout, onSave }) => {
  const [profile, setProfile] = useState(userProfile);
  const [assistantInstructions, setAssistantInstructions] = useState(localStorage.getItem('assistantInstructions') || '');

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };
  
  const saveChanges = () => {
      localStorage.setItem('userProfile', JSON.stringify(profile));
      localStorage.setItem('assistantInstructions', assistantInstructions);
      onSave(assistantInstructions);
      alert('Settings saved!');
  };

  const deleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        onLogout();
    }
  };

  const exportData = () => {
      try {
        const surveyAnswers: SurveyAnswers | null = JSON.parse(localStorage.getItem('surveyAnswers') || 'null');
        const data = {
            userProfile: profile,
            surveyAnswers,
            assistantInstructions
        };
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'drishti_vision_ai_data.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
          console.error("Failed to export data", error);
          alert("Could not export data.");
      }
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <h1 className="text-2xl font-bold text-sky-300 text-center mb-6">Settings</h1>
      
      <div className="space-y-6 overflow-y-auto">
        {/* Account Information */}
        <div className="bg-slate-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-sky-400 mb-3">Account Information</h2>
          <div className="space-y-2">
            <div>
              <label className="text-sm text-slate-400">First Name</label>
              <input type="text" name="firstName" value={profile.firstName} onChange={handleProfileChange} className="w-full bg-slate-700 p-2 rounded-md mt-1" />
            </div>
            <div>
              <label className="text-sm text-slate-400">Last Name</label>
              <input type="text" name="lastName" value={profile.lastName} onChange={handleProfileChange} className="w-full bg-slate-700 p-2 rounded-md mt-1" />
            </div>
          </div>
        </div>

        {/* Assistant Instructions */}
        <div className="bg-slate-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-sky-400 mb-3">Customize Assistant</h2>
          <textarea
            value={assistantInstructions}
            onChange={(e) => setAssistantInstructions(e.target.value)}
            placeholder="e.g., Always respond in a formal tone. You are an expert in ancient history."
            className="w-full bg-slate-700 p-2 rounded-md mt-1 h-24"
          />
        </div>

        {/* Data Management */}
        <div className="bg-slate-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-sky-400 mb-3">Data Management</h2>
          <div className="flex flex-col space-y-2">
            <button onClick={exportData} className="text-left text-slate-300 hover:text-sky-400">Export My Data</button>
            <button onClick={deleteAccount} className="text-left text-red-500 hover:text-red-400">Delete Account</button>
          </div>
        </div>
        
        <div className="flex flex-col space-y-3">
            <button onClick={saveChanges} className="w-full bg-sky-500 text-white py-3 rounded-lg font-semibold">Save Changes</button>
            <button onClick={onLogout} className="w-full bg-slate-700 text-white py-3 rounded-lg font-semibold">Logout</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
