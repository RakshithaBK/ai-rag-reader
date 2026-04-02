'use client';

import FileUpload from './components/FileUpload';
import ChatInterface from './components/chatInterface';

export default function ChatDashboard() {
  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto p-4 bg-gray-50">

      {/* Header & File Upload */}
      <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">AI PDF Assistant</h1>
          <p className="text-sm text-gray-500">Powered by Claude & Next.js</p>
        </div>
        <FileUpload />
      </div>

      <ChatInterface />
    </div>
  );
}
