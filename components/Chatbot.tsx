import React from 'react';
import { GoogleGenerativeAI } from "https://cdn.jsdelivr.net/npm/@google/generative-ai/+esm";
import { ScheduleEntry, ChatMessage } from '../types';

interface ChatbotProps {
    schedule: ScheduleEntry[];
}

// Increment this version to force clear all user chat histories on the next load
const CHAT_VERSION = '1.1';

const Chatbot = ({ schedule }: ChatbotProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [userInput, setUserInput] = React.useState('');
  const [previousSession, setPreviousSession] = React.useState<ChatMessage[] | null>(null);
  const chatContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      try {
        const savedHistory = localStorage.getItem('userChatHistory');
        if (savedHistory) {
          const { messages: savedMessages, timestamp, version } = JSON.parse(savedHistory);
          const savedDate = new Date(timestamp);
          const now = new Date();
          const hoursDiff = (now.getTime() - savedDate.getTime()) / (1000 * 60 * 60);

          // Load only if version matches AND it's less than 24 hours old
          if (version === CHAT_VERSION && hoursDiff < 24 && savedMessages.length > 0) {
            // If it's a very short recent session, just load it immediately
            if (savedMessages.length <= 2) {
                 setMessages(savedMessages);
            } else {
                 setPreviousSession(savedMessages);
            }
          } else {
            // Expired or old version
            localStorage.removeItem('userChatHistory');
          }
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
        localStorage.removeItem('userChatHistory');
      }

      if (messages.length === 0 && !previousSession) {
        setMessages([{ sender: 'ai', text: "Hello! I'm the Xtenda AI Assistant. How can I help you with your salary advance questions today?" }]);
      }
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (messages.length > 0) {
        const historyToSave = {
            messages,
            timestamp: new Date().toISOString(),
            version: CHAT_VERSION
        };
        localStorage.setItem('userChatHistory', JSON.stringify(historyToSave));
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
      if (window.confirm("Are you sure you want to clear our conversation history?")) {
          localStorage.removeItem('userChatHistory');
          setMessages([{ sender: 'ai', text: "Chat history cleared. How can I help you?" }]);
          setPreviousSession(null);
          setIsLoading(false);
      }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const newMessages = [...messages, { sender: 'user', text: userInput }];
    setMessages(newMessages);
    const currentUserInput = userInput;
    setUserInput('');
    setIsLoading(true);
    setPreviousSession(null); // Hide load button on new message

    try {
        const ai = new GoogleGenerativeAI({apiKey: process.env.API_KEY});
        const scheduleString = JSON.stringify(schedule, null, 2);
        const systemInstruction = `You are a helpful and friendly AI assistant for Xtenda Salary Advance, a company that provides salary-based loans in Zambia. Your currency is Zambian Kwacha (ZMW), use 'K' as a prefix for currency amounts (e.g., K500). Your goal is to answer customer questions accurately based on the provided JSON loan schedule data. The schedule shows disbursed amounts and the corresponding monthly installment for different repayment periods (in months). Do not make up information. If a question is outside the scope of Xtenda's loan products, politely decline to answer. Be concise. Here is the loan repayment schedule: ${scheduleString}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: currentUserInput,
            config: { systemInstruction }
        });

        const aiText = response.text;
        setMessages(prev => [...prev, { sender: 'ai', text: aiText }]);
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        setMessages(prev => [...prev, { sender: 'ai', text: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 bg-orange-500 text-white rounded-full h-16 w-16 flex items-center justify-center text-3xl shadow-lg hover:bg-orange-600 transition-transform transform hover:scale-110 z-[100]"
        aria-label="Toggle chat"
      >
        <i className={`fa-solid ${isOpen ? 'fa-times' : 'fa-comments'}`}></i>
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-full max-w-sm h-[60vh] bg-white rounded-2xl shadow-xl flex flex-col z-[100] border border-gray-200 animate-slide-up sm:max-w-md sm:h-[70vh]">
          <header className="bg-green-600 text-white p-4 rounded-t-2xl flex justify-between items-center">
            <h3 className="font-bold text-lg">Xtenda AI Assistant</h3>
            <div className="flex items-center gap-4">
                <button 
                    onClick={handleClearChat} 
                    className="text-green-100 hover:text-white transition"
                    title="Clear Chat History"
                >
                    <i className="fa-solid fa-trash-can"></i>
                </button>
                <button onClick={toggleChat} aria-label="Close chat" className="text-green-100 hover:text-white transition">
                    <i className="fa-solid fa-times text-xl"></i>
                </button>
            </div>
          </header>
          
          <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto bg-gray-50">
            {previousSession && (
                <div className="text-center mb-4">
                    <button
                        onClick={handleLoadHistory}
                        className="bg-gray-200 text-gray-700 text-xs font-semibold py-1.5 px-4 rounded-full hover:bg-gray-300 transition flex items-center gap-2 mx-auto"
                    >
                        <i className="fa-solid fa-clock-rotate-left"></i>
                        Load previous conversation
                    </button>
                </div>
            )}
            <div className="flex flex-col gap-3">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-orange-200 text-gray-800 rounded-br-none' : 'bg-green-200 text-gray-800 rounded-bl-none'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                 <div className="flex justify-start">
                  <div className="max-w-[80%] p-3 rounded-2xl bg-gray-200 text-gray-500 rounded-bl-none text-sm">
                    <span className="animate-pulse">Thinking...</span>
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
                placeholder="Ask a question..."
                className="flex-1 p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                disabled={isLoading}
              />
              <button type="submit" disabled={isLoading || !userInput.trim()} className="bg-orange-500 text-white rounded-full h-12 w-12 flex items-center justify-center text-xl hover:bg-orange-600 transition disabled:bg-gray-400 shrink-0">
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

export default Chatbot;
