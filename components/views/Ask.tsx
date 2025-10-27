
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, ChatMessage } from '../../types';
import { generateWithFlashLite, generateWithSearch, generateWithProThinking, transcribeAudio, generateWithFile } from '../../services/geminiService';

interface AskProps {
  userProfile: UserProfile;
  systemInstruction: string;
}

const Ask: React.FC<AskProps> = ({ userProfile, systemInstruction }) => {
  const [time, setTime] = useState(new Date());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [useProMode, setUseProMode] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const getGreeting = () => {
    const hour = time.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMessage: ChatMessage = { role: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    const fileToSend = attachedFile;
    setAttachedFile(null); // Reset after sending
    setFilePreview(null);

    try {
      let response;
      if (fileToSend) {
        response = await generateWithFile(text, fileToSend, systemInstruction);
      } else if (useProMode) {
        response = await generateWithProThinking(text, systemInstruction);
      } else if (useSearch) {
        response = await generateWithSearch(text, systemInstruction);
      } else {
        response = await generateWithFlashLite(text, systemInstruction);
      }
      const modelMessage: ChatMessage = { role: 'model', text: response.text, sources: response.sources };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: ChatMessage = { role: 'model', text: 'Sorry, I encountered an error.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        setAttachedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setFilePreview(reader.result as string);
        reader.readAsDataURL(file);
    } else if (file) {
        alert("Please select an image file.");
    }
  };

  const handleStartRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];
        
        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };
        
        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setIsLoading(true);
          try {
            const transcription = await transcribeAudio(audioBlob);
            await handleSend(transcription);
          } catch(err) {
            console.error("Transcription error:", err);
            const errorMessage: ChatMessage = { role: 'model', text: 'Could not transcribe audio.' };
            setMessages(prev => [...prev, errorMessage]);
          } finally {
            setIsLoading(false);
          }
          setIsRecording(false);
          stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Could not start recording:", err);
      }
    }
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-sky-300">{getGreeting()}, {userProfile.firstName}!</h1>
        <p className="text-slate-400">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 p-2 bg-slate-800 rounded-lg">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-sky-500 text-white' : 'bg-slate-700 text-slate-200'}`}>
              <p className="whitespace-pre-wrap">{msg.text}</p>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 border-t border-slate-600 pt-2">
                  <h4 className="text-xs font-bold text-slate-400 mb-1">Sources:</h4>
                  <ul className="text-xs space-y-1">
                    {msg.sources.map((source, i) => (
                      <li key={i}><a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">{source.title || source.uri}</a></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="px-4 py-2 rounded-2xl bg-slate-700 text-slate-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="mt-4 flex flex-col gap-2">
          <div className="flex items-center justify-center gap-4 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={useSearch} onChange={() => { setUseSearch(!useSearch); setUseProMode(false); }} className="form-checkbox h-4 w-4 text-sky-600 bg-slate-700 border-slate-600 rounded focus:ring-sky-500" disabled={!!attachedFile}/>
              Search Web
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={useProMode} onChange={() => { setUseProMode(!useProMode); setUseSearch(false); }} className="form-checkbox h-4 w-4 text-indigo-600 bg-slate-700 border-slate-600 rounded focus:ring-indigo-500" disabled={!!attachedFile} />
              Pro Mode
            </label>
          </div>
        
          {filePreview && (
              <div className="relative self-center">
                  <img src={filePreview} alt="attachment preview" className="h-20 w-auto rounded-md" />
                  <button onClick={() => { setAttachedFile(null); setFilePreview(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">X</button>
              </div>
          )}

          <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-2">
            <input type="file" className="hidden" id="file-upload" accept="image/*" onChange={handleFileChange} />
            <label htmlFor="file-upload" className="p-2 text-slate-400 hover:text-sky-400 cursor-pointer">📎</label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend(input)}
              placeholder="Type or record a message..."
              className="flex-1 bg-transparent focus:outline-none p-2 text-slate-200"
              disabled={isLoading}
            />
            <button onClick={handleStartRecording} className={`p-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-700'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>
            </button>
            <button onClick={() => handleSend(input)} disabled={isLoading || !input.trim()} className="p-2 bg-sky-500 text-white rounded-lg disabled:bg-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
      </div>
    </div>
  );
};

export default Ask;
