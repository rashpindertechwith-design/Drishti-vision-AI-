
import React, { useState } from 'react';
import { UserProfile, SurveyAnswers } from '../../types';
import { AppIcon } from '../../constants';

interface SetupProps {
  onSetupComplete: (profile: UserProfile) => void;
}

const Setup: React.FC<SetupProps> = ({ onSetupComplete }) => {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    age: 18,
    gender: '',
  });
  const [answers, setAnswers] = useState<SurveyAnswers>({
    introductionSource: '',
    usedBefore: '',
    isVisuallyImpaired: '',
  });

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: name === 'age' ? parseInt(value, 10) : value });
  };

  const handleAnswersChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAnswers({ ...answers, [name]: value });
  };
  
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (event) => {
              setProfile({ ...profile, profilePicture: event.target?.result as string });
          };
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const submit = () => {
    if (profile.firstName && profile.lastName && profile.age && profile.gender) {
      localStorage.setItem('surveyAnswers', JSON.stringify(answers));
      onSetupComplete(profile);
    } else {
      alert('Please fill out all required profile fields.');
    }
  };

  return (
    <div className="min-h-screen bg-sky-100 text-slate-800 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-2xl p-8 space-y-6">
        <div className="flex flex-col items-center space-y-2">
            <AppIcon />
            <h1 className="text-3xl font-bold text-slate-900">Welcome to Drishti</h1>
            <p className="text-slate-500">Let's set up your profile.</p>
        </div>
        
        {step === 1 && (
            <div className="space-y-4 animate-fade-in">
                <h2 className="text-xl font-semibold">Step 1: Your Information</h2>
                <div>
                    <label className="block text-sm font-medium text-slate-600">Profile Picture (Optional)</label>
                    <div className="mt-1 flex items-center space-x-4">
                        <span className="inline-block h-12 w-12 rounded-full overflow-hidden bg-slate-100">
                        {profile.profilePicture ? <img src={profile.profilePicture} alt="Profile" className="h-full w-full object-cover" /> : <svg className="h-full w-full text-slate-300" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.997A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                        </span>
                        <input type="file" accept="image/*" onChange={handleProfilePictureChange} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"/>
                    </div>
                </div>
                <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-slate-600">First Name</label>
                    <input type="text" name="firstName" value={profile.firstName} onChange={handleProfileChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500"/>
                </div>
                 <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-slate-600">Last Name</label>
                    <input type="text" name="lastName" value={profile.lastName} onChange={handleProfileChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500"/>
                </div>
                 <div>
                    <label htmlFor="age" className="block text-sm font-medium text-slate-600">Age</label>
                    <input type="number" name="age" value={profile.age} onChange={handleProfileChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500"/>
                </div>
                 <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-slate-600">Gender</label>
                    <select name="gender" value={profile.gender} onChange={handleProfileChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500">
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Non-binary">Non-binary</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                </div>
                <button onClick={nextStep} className="w-full bg-sky-500 text-white py-2 px-4 rounded-md hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500">Next</button>
            </div>
        )}

        {step === 2 && (
            <div className="space-y-4 animate-fade-in">
                <h2 className="text-xl font-semibold">Step 2: A Few Questions</h2>
                 <div>
                    <label htmlFor="introductionSource" className="block text-sm font-medium text-slate-600">Who introduced you to Drishti Vision AI?</label>
                    <select name="introductionSource" value={answers.introductionSource} onChange={handleAnswersChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500">
                        <option value="">Select...</option>
                        <option value="Friends">Friends</option>
                        <option value="Family">Family</option>
                        <option value="AI">AI</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                 <div>
                    <label htmlFor="usedBefore" className="block text-sm font-medium text-slate-600">Have you used this app before?</label>
                    <select name="usedBefore" value={answers.usedBefore} onChange={handleAnswersChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500">
                        <option value="">Select...</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                 <div>
                    <label htmlFor="isVisuallyImpaired" className="block text-sm font-medium text-slate-600">Are you visually impaired?</label>
                    <select name="isVisuallyImpaired" value={answers.isVisuallyImpaired} onChange={handleAnswersChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500">
                        <option value="">Select...</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                    </select>
                </div>
                <div className="flex justify-between">
                    <button onClick={prevStep} className="bg-slate-200 text-slate-800 py-2 px-4 rounded-md hover:bg-slate-300">Back</button>
                    <button onClick={submit} className="bg-sky-500 text-white py-2 px-4 rounded-md hover:bg-sky-600">Finish Setup</button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Setup;
