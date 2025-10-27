
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { connectLive, disconnectLive, createBlob, decodeAudioData } from '../../services/geminiService';
import { LiveServerMessage } from '@google/genai';

type LiveSession = Awaited<ReturnType<typeof connectLive>>;
type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';
interface Turn { id: number; user: string; model: string; isFinal: boolean; }

const audioWorkletScript = `
class AudioProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const channelData = input[0];
    if (channelData) {
      // Post a transferable object for performance
      this.port.postMessage(channelData.buffer, [channelData.buffer]);
    }
    return true;
  }
}
registerProcessor('audio-processor', AudioProcessor);
`;

const Live: React.FC = () => {
    const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
    const [transcriptionHistory, setTranscriptionHistory] = useState<Turn[]>([]);
    
    const sessionRef = useRef<LiveSession | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef(0);
    const turnCounterRef = useRef(0);

    const handleMessage = useCallback(async (message: LiveServerMessage) => {
        if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
             const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
             const outCtx = outputAudioContextRef.current;
             if (outCtx) {
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
                const audioBuffer = await decodeAudioData(base64Audio, outCtx, 24000, 1);
                const source = outCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outCtx.destination);
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
             }
        }
        
        if (message.serverContent?.inputTranscription || message.serverContent?.outputTranscription) {
            setTranscriptionHistory(prev => {
                const newHistory = [...prev];
                let currentTurn = newHistory.find(t => !t.isFinal);
                if (!currentTurn) {
                    currentTurn = { id: turnCounterRef.current, user: '', model: '', isFinal: false };
                    newHistory.push(currentTurn);
                }

                if (message.serverContent?.inputTranscription) {
                    currentTurn.user += message.serverContent.inputTranscription.text;
                }
                if (message.serverContent?.outputTranscription) {
                    currentTurn.model += message.serverContent.outputTranscription.text;
                }
                
                if (message.serverContent?.turnComplete) {
                    currentTurn.isFinal = true;
                    turnCounterRef.current++;
                }
                
                return newHistory;
            });
        }
    }, []);
    
    const stopConversation = useCallback(() => {
        disconnectLive(sessionRef.current);
        sessionRef.current = null;

        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        
        workletNodeRef.current?.port.close();
        workletNodeRef.current?.disconnect();
        workletNodeRef.current = null;

        audioContextRef.current?.close().catch(console.error);
        audioContextRef.current = null;
        
        outputAudioContextRef.current?.close().catch(console.error);
        outputAudioContextRef.current = null;
        
        nextStartTimeRef.current = 0;
        setConnectionState('disconnected');
    }, []);
    
    const startConversation = useCallback(async () => {
        if (connectionState !== 'disconnected' && connectionState !== 'error') return;
        setConnectionState('connecting');
        setTranscriptionHistory([]);
        turnCounterRef.current = 0;

        try {
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            const sessionPromise = connectLive({
                onopen: () => setConnectionState('connected'),
                onmessage: handleMessage,
                onerror: (e) => {
                    console.error("Live connection error:", e);
                    setConnectionState('error');
                    stopConversation();
                },
                onclose: () => {
                    setConnectionState('disconnected');
                    stopConversation();
                }
            });
            
            sessionRef.current = await sessionPromise;

            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            
            const blob = new Blob([audioWorkletScript], { type: 'application/javascript' });
            const workletURL = URL.createObjectURL(blob);
            await audioContextRef.current.audioWorklet.addModule(workletURL);
            
            const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
            workletNodeRef.current = new AudioWorkletNode(audioContextRef.current, 'audio-processor');
            
            workletNodeRef.current.port.onmessage = (event) => {
                const pcmData = new Float32Array(event.data);
                const pcmBlob = createBlob(pcmData);
                sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            
            source.connect(workletNodeRef.current);
            workletNodeRef.current.connect(audioContextRef.current.destination);

        } catch (error) {
            console.error("Failed to start live conversation:", error);
            setConnectionState('error');
        }
    }, [connectionState, handleMessage, stopConversation]);

    useEffect(() => {
        return () => {
            if (sessionRef.current) {
                stopConversation();
            }
        };
    }, [stopConversation]);

    const getButtonState = () => {
        switch (connectionState) {
            case 'disconnected': return { text: 'Start Live Conversation', action: startConversation, color: 'bg-sky-500 hover:bg-sky-600' };
            case 'connecting': return { text: 'Connecting...', action: () => {}, color: 'bg-yellow-500', disabled: true };
            case 'connected': return { text: 'Stop Conversation', action: stopConversation, color: 'bg-red-500 hover:bg-red-600' };
            case 'error': return { text: 'Error - Retry?', action: startConversation, color: 'bg-orange-500 hover:bg-orange-600' };
        }
    };
    
    const { text, action, color, disabled } = getButtonState();

    return (
        <div className="p-4 h-full flex flex-col items-center justify-center text-center">
            <h1 className="text-3xl font-bold text-sky-300 mb-2">Live Conversation</h1>
             <p className="text-slate-400 mb-4 max-w-md">
                Speak directly with Drishti for instant, voice-to-voice interaction.
            </p>

            <div className="relative w-48 h-48 flex items-center justify-center mb-4">
                {connectionState === 'connected' && (
                    <>
                        <div className="absolute w-full h-full rounded-full bg-sky-500/20 animate-ping"></div>
                        <div className="absolute w-3/4 h-3/4 rounded-full bg-sky-500/30 animate-ping [animation-delay:0.5s]"></div>
                    </>
                )}
                <button 
                    onClick={action} 
                    disabled={disabled}
                    className={`w-32 h-32 rounded-full text-white font-semibold text-lg flex items-center justify-center transition-all duration-300 shadow-lg ${color} ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
                >
                    {text}
                </button>
            </div>
            
            <p className="text-slate-500">Status: <span className="font-semibold text-slate-300 capitalize">{connectionState}</span></p>

            <div className="w-full max-w-2xl mt-4 h-48 bg-slate-800 rounded-lg p-3 overflow-y-auto text-left font-mono text-sm">
                {transcriptionHistory.length === 0 && <p className="text-slate-500">Transcription will appear here...</p>}
                {transcriptionHistory.map(turn => (
                    <div key={turn.id} className={`${turn.isFinal ? 'opacity-100' : 'opacity-60'}`}>
                       <p><span className="font-bold text-sky-400">You:</span> {turn.user}</p>
                       <p><span className="font-bold text-indigo-400">AI:</span> {turn.model}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Live;
