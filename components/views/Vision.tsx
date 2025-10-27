
import React, { useState } from 'react';
import { analyzeMedia } from '../../services/geminiService';

type RecognitionMode = 'Image' | 'Video' | 'Document' | 'Text' | 'Scene';

interface VisionProps {
  systemInstruction: string;
}

const Vision: React.FC<VisionProps> = ({ systemInstruction }) => {
  const [mode, setMode] = useState<RecognitionMode>('Image');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult('');
      setPrompt('');

      if (selectedFile.type.startsWith('image/') || selectedFile.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!file || !prompt) {
      alert('Please upload a file and provide a prompt.');
      return;
    }
    setIsLoading(true);
    setResult('');
    try {
      const response = await analyzeMedia(file, prompt, systemInstruction);
      setResult(response);
    } catch (error) {
      console.error('Error analyzing media:', error);
      const err = error as Error;
      setResult(`An error occurred during analysis: ${err.message}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const modes: RecognitionMode[] = ['Image', 'Video', 'Document', 'Text', 'Scene'];
  const placeholders: { [key in RecognitionMode]: string } = {
      Image: "e.g., Describe this image in detail. What is the main subject?",
      Video: "e.g., Provide a summary of this video's content, frame by frame.",
      Document: "e.g., Summarize this document. What are the main financial figures in this spreadsheet?",
      Text: "e.g., Identify and extract all email addresses from this image.",
      Scene: "e.g., What kind of event is happening in this scene? Describe the mood."
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <h1 className="text-2xl font-bold text-sky-300 text-center mb-4">Vision Analysis</h1>
      
      <div className="flex justify-center mb-4 border-b border-slate-700">
        {modes.map(m => (
          <button 
            key={m} 
            onClick={() => {
                setMode(m);
                setFile(null);
                setFilePreview(null);
                setResult('');
            }} 
            className={`px-4 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none ${
              mode === m 
                ? 'text-sky-400 border-b-2 border-sky-400' 
                : 'text-slate-400 hover:text-sky-300'
            }`}
            aria-pressed={mode === m}
          >
            {m} Recognition
          </button>
        ))}
      </div>
      
      <div className="flex-1 flex flex-col gap-4">
        <div className="bg-slate-800 p-4 rounded-lg flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-slate-600">
          <input type="file" id="vision-upload" onChange={handleFileChange} className="hidden" accept="image/*,video/*,application/pdf,.txt,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" />
          <label htmlFor="vision-upload" className="cursor-pointer text-center flex flex-col items-center justify-center w-full h-full">
            {file ? (
                <>
                    {filePreview && file.type.startsWith('video/') && <video src={filePreview} controls className="max-h-40 rounded-md" />}
                    {filePreview && file.type.startsWith('image/') && <img src={filePreview} alt="Preview" className="max-h-40 rounded-md" />}
                    {!filePreview && file && (
                        <div className="text-6xl mb-2">📄</div>
                    )}
                    <div className="mt-2 text-sm text-slate-300 font-medium truncate max-w-full px-2">{file.name}</div>
                    <div className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                    <div className="mt-2 text-xs text-sky-400 hover:text-sky-300">Click to change file</div>
                </>
            ) : (
                <>
                    <div className="text-4xl text-slate-500 mb-2">📤</div>
                    <p className="font-semibold text-slate-300">Tap to upload a file</p>
                    <p className="text-xs text-slate-500">Supported: Docs, Sheets, PDF, Images, Video & more</p>
                </>
            )}
          </label>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={placeholders[mode]}
          className="w-full bg-slate-800 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
          rows={3}
          disabled={!file}
        />
        
        <button onClick={handleAnalyze} disabled={isLoading || !file || !prompt} className="w-full bg-sky-500 text-white py-3 rounded-lg font-semibold transition-colors duration-200 disabled:bg-slate-600 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-500">
          {isLoading ? 'Analyzing...' : `Analyze ${mode}`}
        </button>

        {result && (
          <div className="mt-4 bg-slate-800 p-4 rounded-lg animate-fade-in">
            <h3 className="font-bold mb-2 text-sky-400">Analysis Result:</h3>
            <p className="text-slate-200 whitespace-pre-wrap">{result}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Vision;
