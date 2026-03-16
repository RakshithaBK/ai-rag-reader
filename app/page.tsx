'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai'; // Added this import for V5!
import { useState, useRef } from 'react';

export default function ChatDashboard() {
  // 1. We now manage the input state manually
  const [input, setInput] = useState('');

  // 2. useChat now requires a 'transport' and returns 'sendMessage' and 'status'
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat', 
    }),
  });

  // Local state for the file upload
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

 const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);

    try {
      // Package the file securely
      const formData = new FormData();
      formData.append('file', file);

      // Send it to the API route we just built
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert('File successfully processed and saved to Pinecone!');
      } else {
        alert('Upload failed. Check console for details.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('An error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  // 3. We create our own submit handler
  const onSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (input.trim()) {
      const message = input;
      setInput(''); // Clear the input box
      await callGeminiWithRetry(() => sendMessage({ text: message }));
    }
  };

   //Implement to call this method callGeminiWithRetry
  const callGeminiWithRetry = async (fn: () => Promise<unknown>, retries = 3, delay = 1000) => {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return callGeminiWithRetry(fn, retries - 1, delay * 2);
    }
  };
  

  // 4. Derive loading state from the new 'status' variable
  const isThinking = status === 'submitted' || status === 'streaming';

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto p-4 bg-gray-50">
      
      {/* Header & File Upload */}
      <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">AI PDF Assistant</h1>
          <p className="text-sm text-gray-500">Powered by Gemini & Next.js</p>
        </div>
        
        <div className="flex items-center gap-2">
          <input 
            type="file" 
            accept="application/pdf" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
          >
            {file ? file.name : 'Select PDF'}
          </button>
          
          <button 
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition"
          >
            {isUploading ? 'Processing...' : 'Upload Data'}
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white rounded-lg shadow-sm border mb-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-20">
            No messages yet. Say hello!
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-lg ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                <span className="font-bold text-xs uppercase opacity-70 block mb-1">
                  {m.role === 'user' ? 'You' : 'AI'}
                </span>
                {/* 5. In V5, messages are broken into 'parts' */}
                {m.parts.map((part, index) => 
                  part.type === 'text' ? <span key={index}>{part.text}</span> : null
                )}
              </div>
            </div>
          ))
        )}
        {isThinking && (
          <div className="text-gray-400 text-sm animate-pulse">Thinking...</div>
        )}
      </div>

      {/* Chat Input */}
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          className="flex-1 p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          disabled={isThinking}
        />
        <button 
          type="submit" 
          disabled={isThinking || !input.trim()}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-blue-300 transition"
        >
          Send
        </button>
      </form>
      
    </div>
  );
}