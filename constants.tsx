import React from 'react';
import { Tab } from './types';

export const AppIcon = () => (
    <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 10C27.9086 10 10 27.9086 10 50C10 72.0914 27.9086 90 50 90" stroke="url(#paint0_linear_405_2)" strokeWidth="8" strokeLinecap="round"/>
        <circle cx="30" cy="30" r="4" fill="#38bdf8"/>
        <circle cx="20" cy="50" r="4" fill="#38bdf8"/>
        <circle cx="30" cy="70" r="4" fill="#38bdf8"/>
        <circle cx="50" cy="80" r="4" fill="#38bdf8"/>
        <circle cx="70" cy="70" r="4" fill="#38bdf8"/>
        <circle cx="80" cy="50" r="4" fill="#38bdf8"/>
        <circle cx="70" cy="30" r="4" fill="#38bdf8"/>
        <circle cx="50" cy="20" r="4" fill="#38bdf8"/>
        <defs>
            <linearGradient id="paint0_linear_405_2" x1="50" y1="10" x2="50" y2="90" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0ea5e9"/>
                <stop offset="1" stopColor="#6366f1"/>
            </linearGradient>
        </defs>
    </svg>
);


// SVG Icons from lucide-react (inlined for simplicity)
const MessageSquare = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
);

const Mic = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>
);

const Eye = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);

const Settings = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);

export const ICONS: { [key in Tab]: React.ReactElement } = {
  [Tab.Ask]: <MessageSquare />,
  [Tab.Live]: <Mic />,
  [Tab.Vision]: <Eye />,
  [Tab.Settings]: <Settings />,
};
