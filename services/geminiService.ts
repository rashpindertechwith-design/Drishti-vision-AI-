// FIX: Replaced deprecated 'GenerateContentRequest' with 'GenerateContentParameters' to align with the latest SDK.
import { GoogleGenAI, Modality, LiveServerMessage, Blob as GenAIBlob, GenerateContentParameters } from '@google/genai';

// --- UTILITY FUNCTIONS ---

const fileToGenerativePart = async (file: File) => {
  const base64EncodedData = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: base64EncodedData, mimeType: file.type },
  };
};

// --- API CLIENT ---
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });


// --- TEXT GENERATION (ASK TAB) ---
// FIX: Modified buildRequest to include the model parameter, resolving the TypeScript error where 'model' was missing from GenerateContentParameters.
const buildRequest = (model: string, prompt: string, systemInstruction?: string): GenerateContentParameters => ({
    model,
    contents: prompt,
    ...(systemInstruction && { config: { systemInstruction } }),
});

export const generateWithFlashLite = async (prompt: string, systemInstruction?: string): Promise<{ text: string, sources?: any[] }> => {
    const ai = getAiClient();
    const request = buildRequest('gemini-flash-lite-latest', prompt, systemInstruction);
    const response = await ai.models.generateContent(request);
    return { text: response.text };
};

export const generateWithSearch = async (prompt: string, systemInstruction?: string): Promise<{ text: string, sources?: any[] }> => {
    const ai = getAiClient();
    const request = buildRequest('gemini-2.5-flash', prompt, systemInstruction);
    request.config = { ...request.config, tools: [{ googleSearch: {} }] };
    const response = await ai.models.generateContent(request);
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => chunk.web).filter(Boolean) || [];
    return { text: response.text, sources };
};

export const generateWithProThinking = async (prompt: string, systemInstruction?: string): Promise<{ text: string, sources?: any[] }> => {
    const ai = getAiClient();
    const request = buildRequest('gemini-2.5-pro', prompt, systemInstruction);
    request.config = { ...request.config, thinkingConfig: { thinkingBudget: 32768 } };
    const response = await ai.models.generateContent(request);
    return { text: response.text };
};

export const generateWithFile = async (prompt: string, file: File, systemInstruction?: string): Promise<{ text: string, sources?: any[] }> => {
    const ai = getAiClient();
    const imagePart = await fileToGenerativePart(file);
    const request = buildRequest('gemini-2.5-flash', prompt, systemInstruction);
    request.contents = { parts: [ { text: prompt }, imagePart ]};
    const response = await ai.models.generateContent(request);
    return { text: response.text };
}

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    const ai = getAiClient();
    const audioPart = await fileToGenerativePart(new File([audioBlob], "audio.webm", {type: "audio/webm"}));
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [ audioPart, { text: "Transcribe this audio." } ] }
    });
    return response.text;
};


// --- MEDIA ANALYSIS (VISION TAB) ---
export const analyzeMedia = async (file: File, prompt: string, systemInstruction?: string): Promise<string> => {
    const ai = getAiClient();
    const mediaPart = await fileToGenerativePart(file);
    const request = buildRequest('gemini-2.5-pro', prompt, systemInstruction);
    request.contents = { parts: [ mediaPart, { text: prompt } ] };
    const response = await ai.models.generateContent(request);
    return response.text;
};

// FIX: Added generateImage, editImage, and generateVideo functions to implement media generation features.
// --- MEDIA GENERATION (GENERATE TAB) ---
export const generateImage = async (prompt: string): Promise<string | null> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [{ text: prompt }],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:image/png;base64,${base64ImageBytes}`;
        }
    }
    return null;
};

export const editImage = async (file: File, prompt: string): Promise<string | null> => {
    const ai = getAiClient();
    const imagePart = await fileToGenerativePart(file);
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [imagePart, textPart],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:image/png;base64,${base64ImageBytes}`;
        }
    }
    return null;
};

export const generateVideo = async (prompt: string, aspectRatio: '16:9' | '9:16', imageFile?: File | null): Promise<string | null> => {
    const ai = getAiClient();
    
    const imagePayload = imageFile ? {
        imageBytes: (await fileToGenerativePart(imageFile)).inlineData.data,
        mimeType: imageFile.type,
    } : undefined;

    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        ...(imagePayload && { image: imagePayload }),
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio
        }
    });
    
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation });
    }
    
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation failed or returned no link.");
    }

    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!videoResponse.ok) {
        const errorBody = await videoResponse.text();
        console.error("Video download error:", errorBody);
        if (errorBody.includes("Requested entity was not found.")) {
             throw new Error("API Key not found or invalid. Please re-select your API Key.");
        }
        throw new Error(`Failed to download video: ${videoResponse.statusText}`);
    }
    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);
};


// --- LIVE CONVERSATION (LIVE TAB) ---

interface LiveCallbacks {
    onopen: () => void;
    onmessage: (message: LiveServerMessage) => void;
    onerror: (event: ErrorEvent) => void;
    onclose: (event: CloseEvent) => void;
}

export const connectLive = (callbacks: LiveCallbacks) => {
    const ai = getAiClient();
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks,
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
            inputAudioTranscription: {},
            outputAudioTranscription: {}
        }
    });
};

export const disconnectLive = (session: { close: () => void } | null) => {
    session?.close();
};

export function createBlob(data: Float32Array): GenAIBlob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] < 0 ? data[i] * 32768 : data[i] * 32767;
    }
    const bytes = new Uint8Array(int16.buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return { data: btoa(binary), mimeType: 'audio/pcm;rate=16000' };
}

export async function decodeAudioData(
    base64: string,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const dataInt16 = new Int16Array(bytes.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}
