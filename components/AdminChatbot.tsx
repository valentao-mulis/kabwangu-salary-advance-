import React from 'react';
import { GoogleGenerativeAI } from "https://cdn.jsdelivr.net/npm/@google/generative-ai/+esm";
import { ChatMessage } from '../types';

interface AdminChatbotProps {
    applicationData: any;
}

// Increment this version to force clear all admin chat histories
const ADMIN_CHAT_VERSION = '1.1';

const AdminChatbot = ({ applicationData }: AdminChatbotProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [userInput, setUserInput] = React.useState('');
  const [previousSession, setPreviousSession] = React.useState<ChatMessage[] | null>(null);
  const chatContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      try {
        const savedHistory = localStorage.getItem('adminChatHistory');
        if (savedHistory) {
          const { messages: savedMessages, timestamp, version } = JSON.parse(savedHistory);
          const savedDate = new Date(timestamp);
          const now = new Date();
          const hoursDiff = (now.getTime() - savedDate.getTime()) / (1000 * 60 * 60);

          // Load only if version matches AND it's less than 24 hours old
          if (version === ADMIN_CHAT_VERSION && hoursDiff < 24 && savedMessages.length > 0) {
             setPreviousSession(savedMessages);
          } else {
            localStorage.removeItem('adminChatHistory');
          }
        }
      } catch (error) {
        console.error('Failed to load admin chat history:', error);
        localStorage.removeItem('adminChatHistory');
      }

      if (messages.length === 0 && !previousSession) {
        setMessages([{ sender: 'ai', text: "Hello! I'm your Admin Assistant. How can I help you review this application?" }]);
      }
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (messages.length > 0) {
        const historyToSave = {
            messages,
            timestamp: new Date().toISOString(),
            version: ADMIN_CHAT_VERSION
        };
        localStorage.setItem('adminChatHistory', JSON.stringify(historyToSave));
    }
  }, [messages]);

  React.useEffect(() => {
     if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
     }
  }, [messages]);

  const toggleChat = () => setIsOpen(!isOpen);
  
  const handleLoadHistory = () => {
    if (previousSession) {
        setMessages(previousSession);
        setPreviousSession(null);
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Clear this admin chat session history?")) {
        localStorage.removeItem('adminChatHistory');
        setMessages([{ sender: 'ai', text: "Session cleared. Ready to assist with this application." }]);
        setPreviousSession(null);
        setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    // Explicitly type newMessages to match ChatMessage[]
    const newMessages: ChatMessage[] = [...messages, { sender: 'user', text: userInput }];
    setMessages(newMessages);
    const currentUserInput = userInput;
    setUserInput('');
    setIsLoading(true);
    setPreviousSession(null);

    try {
        const ai = new GoogleGenerativeAI({apiKey: process.env.API_KEY});
        const applicationJsonString = JSON.stringify(applicationData, null, 2);
        const systemInstruction = `You are an expert AI assistant for an Xtenda Salary Advance administrator. Your task is to help the admin review and process a loan application. You have been provided with the full application data in JSON format. Use this data as the single source of truth to answer questions, summarize details, check for completeness, and draft communications. Be concise, professional, and accurate. When drafting communications, use placeholders like [Applicant Name]. Do not invent any information not present in the provided data. Here is the application data: ${applicationJsonString}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: currentUserInput,
            config: { systemInstruction }
        });

        const aiText = response.text;
        setMessages(prev => [...prev, { sender: 'ai', text: aiText }]);
    } catch (error) {
        console.error("Error calling Gemini API for Admin Chat:", error);
        setMessages(prev => [...prev, { sender: 'ai', text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 bg-gray-700 text-white rounded-full h-16 w-16 flex items-center justify-center text-3xl shadow-lg hover:bg-gray-800 transition-transform transform hover:scale-110 z-[100]"
        aria-label="Toggle Admin Assistant"
      >
        <i className={`fa-solid ${isOpen ? 'fa-times' : 'fa-robot'}`}></i>
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-full max-w-sm h-[60vh] bg-white rounded-2xl shadow-xl flex flex-col z-[100] border border-gray-300 animate-slide-up sm:max-w-md sm:h-[70vh]">
          <header className="bg-gray-800 text-white p-4 rounded-t-2xl flex justify-between items-center">
            <h3 className="font-bold text-lg">Admin Assistant</h3>
             <div className="flex items-center gap-4">
                <button 
                    onClick={handleClearChat} 
                    className="text-gray-400 hover:text-white transition"
                    title="Clear Session History"
                >
                    <i className="fa-solid fa-trash-can"></i>
                </button>
                <button onClick={toggleChat} aria-label="Close chat" className="text-gray-400 hover:text-white transition">
                    <i className="fa-solid fa-times text-xl"></i>
                </button>
            </div>
          </header>
          
          <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto bg-gray-100">
            {previousSession && (
                <div className="text-center mb-4">
                    <button
                        onClick={handleLoadHistory}
                        className="bg-gray-300 text-gray-800 text-xs font-semibold py-1.5 px-4 rounded-full hover:bg-gray-400 transition flex items-center gap-2 mx-auto"
                    >
                        <i className="fa-solid fa-clock-rotate-left"></i>
                        Load previous conversation
                    </button>
                </div>
            )}
            <div className="flex flex-col gap-3">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                 <div className="flex justify-start">
                  <div className="max-w-[80%] p-3 rounded-2xl bg-gray-200 text-gray-500 rounded-bl-none text-sm">
                    <span className="animate-pulse">Analyzing...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t bg-white rounded-b-2xl">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Ask about this application..."
                className="flex-1 p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
              <button type="submit" disabled={isLoading || !userInput.trim()} className="bg-blue-600 text-white rounded-full h-12 w-12 flex items-center justify-center text-xl hover:bg-blue-700 transition disabled:bg-gray-400 shrink-0">
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </div>
          </form>
        </div>
      )}
      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default AdminChatbot;