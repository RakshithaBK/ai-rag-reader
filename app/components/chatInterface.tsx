'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState } from 'react';

export default function ChatInterface() {
  const [input, setInput] = useState('');

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  });

  const isThinking = status === 'submitted' || status === 'streaming';

  const callWithRetry = async (fn: () => Promise<unknown>, retries = 3, delay = 1000) => {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
  };

  const onSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim()) {
      const message = input;
      setInput('');
      await callWithRetry(() => sendMessage({ text: message }));
    }
  };

  return (
    <>
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
    </>
  );
}
