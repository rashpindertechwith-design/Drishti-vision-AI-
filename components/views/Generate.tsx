
import React, { useState, useEffect } from 'react';
import { generateImage, editImage, generateVideo } from '../../services/geminiService';

type GenerateMode = 'Video' | 'Image';
type ImageMode = 'Create' | 'Edit';

const Generate: React.FC = () => {
    const [mode, setMode] = useState<GenerateMode>('Video');
    const [imageMode, setImageMode] = useState<ImageMode>('Create');
    const [prompt, setPrompt] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedMedia, setGeneratedMedia] = useState<string | null>(null);
    const [apiKeySelected, setApiKeySelected] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');

    useEffect(() => {
        const checkKey = async () => {
            if (mode === 'Video' && window.aistudio) {
                setApiKeySelected(await window.aistudio.hasSelectedApiKey());
            }
        };
        checkKey();
    }, [mode]);

    const resetStateForModeChange = () => {
        setPrompt('');
        setImageFile(null);
        setImagePreview(null);
        setGeneratedMedia(null);
        setIsLoading(false);
    };

    const handleSelectKey = async () => {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            setApiKeySelected(true);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            alert("A prompt is required.");
            return;
        }
        
        if (mode === 'Video' && !apiKeySelected) {
            alert("Please select an API key for video generation.");
            return;
        }

        setIsLoading(true);
        setGeneratedMedia(null);
        
        try {
            let resultUrl: string | null = null;
            if (mode === 'Image') {
                if (imageMode === 'Create') {
                    setLoadingMessage('Creating image with Nano Banana...');
                    resultUrl = await generateImage(prompt);
                } else { // Edit
                    if (!imageFile) {
                        alert("An image is required for editing.");
                        setIsLoading(false);
                        return;
                    }
                    setLoadingMessage('Editing image with Nano Banana...');
                    resultUrl = await editImage(imageFile, prompt);
                }
            } else { // Video
                setLoadingMessage('Generating video with VEO 3... this may take minutes.');
                resultUrl = await generateVideo(prompt, aspectRatio, imageFile);
            }
            setGeneratedMedia(resultUrl);
        } catch (error: any) {
            console.error(`Error generating ${mode}:`, error);
            if (error.message && error.message.includes("API Key not found")) {
                setApiKeySelected(false);
            }
            alert(error.message || `An error occurred: Please try again.`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderVideoUI = () => (
        <>
            {!apiKeySelected && (
                <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-300 p-3 rounded-lg text-center text-sm">
                    Video generation requires a Google AI Studio API key. 
                    <button onClick={handleSelectKey} className="ml-2 underline font-bold">Select Key</button>
                    <p className="text-xs mt-1">For more info, see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline">billing documentation</a>.</p>
                </div>
            )}
             <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="e.g., A neon hologram of a cat driving at top speed" rows={3} className="w-full bg-slate-800 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-sky-500" />
            <div className="flex items-center gap-4">
                <span className="text-slate-400">Aspect Ratio:</span>
                <button onClick={() => setAspectRatio('16:9')} className={`px-3 py-1 rounded-md text-sm ${aspectRatio === '16:9' ? 'bg-sky-500' : 'bg-slate-700'}`}>16:9 (Landscape)</button>
                <button onClick={() => setAspectRatio('9:16')} className={`px-3 py-1 rounded-md text-sm ${aspectRatio === '9:16' ? 'bg-sky-500' : 'bg-slate-700'}`}>9:16 (Portrait)</button>
            </div>
             <div className="bg-slate-800 p-4 rounded-lg flex flex-col items-center justify-center min-h-[150px] border-2 border-dashed border-slate-600">
                <input type="file" id="video-image-upload" onChange={handleFileChange} className="hidden" accept="image/*" />
                <label htmlFor="video-image-upload" className="cursor-pointer text-center">
                    {imagePreview ? <img src={imagePreview} alt="Start frame" className="max-h-32 rounded-md" /> : <p className="text-slate-400">Add starting frame (optional) to animate</p>}
                </label>
            </div>
        </>
    );

    const renderImageUI = () => (
        <>
            <div className="flex justify-center mb-4 rounded-lg bg-slate-800 p-1">
                <button onClick={() => { setImageMode('Create'); resetStateForModeChange(); }} className={`w-full py-2 text-sm font-medium rounded-md ${imageMode === 'Create' ? 'bg-sky-600' : 'text-slate-300'}`}>Create</button>
                <button onClick={() => { setImageMode('Edit'); resetStateForModeChange(); }} className={`w-full py-2 text-sm font-medium rounded-md ${imageMode === 'Edit' ? 'bg-sky-600' : 'text-slate-300'}`}>Edit</button>
            </div>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={imageMode === 'Create' ? "e.g., A photorealistic image of a cat wearing sunglasses" : "e.g., Add a retro filter, make the sky purple"} rows={3} className="w-full bg-slate-800 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-sky-500" />
            {imageMode === 'Edit' && (
                <div className="bg-slate-800 p-4 rounded-lg flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-slate-600">
                    <input type="file" id="image-edit-upload" onChange={handleFileChange} className="hidden" accept="image/*" />
                    <label htmlFor="image-edit-upload" className="cursor-pointer text-center">
                        {imagePreview ? <img src={imagePreview} alt="To edit" className="max-h-48 rounded-md" /> : <p className="text-slate-400">Upload image to edit</p>}
                    </label>
                </div>
            )}
        </>
    );

    return (
        <div className="p-4 h-full flex flex-col">
            <h1 className="text-2xl font-bold text-sky-300 text-center mb-4">Generate Media</h1>
            <div className="flex justify-center mb-4 border-b border-slate-700">
                <button onClick={() => { setMode('Video'); resetStateForModeChange(); }} className={`px-4 py-2 text-sm font-medium ${mode === 'Video' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-400'}`}>Video</button>
                <button onClick={() => { setMode('Image'); resetStateForModeChange(); }} className={`px-4 py-2 text-sm font-medium ${mode === 'Image' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-400'}`}>Image</button>
            </div>
            <div className="flex-1 flex flex-col gap-4">
                {mode === 'Video' ? renderVideoUI() : renderImageUI()}
                <button onClick={handleGenerate} disabled={isLoading} className="w-full bg-sky-500 text-white py-3 rounded-lg font-semibold disabled:bg-slate-600 transition-colors duration-200 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-500">
                    {isLoading ? loadingMessage : `Generate ${mode}`}
                </button>
                 {generatedMedia && (
                    <div className="mt-4 bg-slate-800 p-4 rounded-lg animate-fade-in">
                        <h3 className="font-bold mb-2 text-sky-400">Result:</h3>
                        {mode === 'Video' ? 
                            <video src={generatedMedia} controls className="w-full rounded-md" /> : 
                            <img src={generatedMedia} alt="Generated" className="w-full rounded-md" />}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Generate;
