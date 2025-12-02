import React from 'react';
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, ApplicationFormData } from '../types';

interface AdminChatbotProps {
    applicationData: ApplicationFormData;
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

  // Safe stringify helper to handle circular references
  const safeStringify = (obj: any) => {
    const cache = new Set();
    return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (cache.has(value)) {
                return; // Duplicate reference found, discard key
            }
            cache.add(value);
        }
        return value;
    });
  };

  React.useEffect(() => {
    if (isOpen) {
      try {
        const savedHistory = localStorage.getItem('adminChatHistory');
        if (savedHistory) {
          const { messages: savedMessages, timestamp, version } = JSON.parse(savedHistory);
          const savedDate = new Date(timestamp);
          const now = new Date();
          const hoursDiff = (now.getTime() - savedDate.getTime()) / (1000 * 60 * 60);

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
        setMessages([{ sender: 'ai', text: "Hello! I'm your Admin Assistant. How can I help you review this application? You can ask me to summarize it, check for red flags, or find specific information." }]);
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
        try {
            // Use safeStringify to prevent circular reference crashes
            localStorage.setItem('adminChatHistory', safeStringify(historyToSave));
        } catch (e) {
            console.warn("Failed to save chat history", e);
        }
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

    const newMessages: ChatMessage[] = [...messages, { sender: 'user', text: userInput }];
    setMessages(newMessages);
    const textToSend = userInput;
    setUserInput('');
    setIsLoading(true);
    setPreviousSession(null);

    try {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY is not configured.");
        }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        // Create a lean, privacy-focused context object to send to the AI
        // Using explicit simple types where possible to avoid complex object refs
        const contextForAI = {
            dateOfApplication: String(applicationData.dateOfApplication || ''),
            personalDetails: {
                employer: String(applicationData.employer || ''),
                employmentTerms: String(applicationData.employmentTerms || ''),
            },
            kinDetails: {
                kinRelationship: String(applicationData.kinRelationship || ''),
            },
            bankDetails: {
                bankName: String(applicationData.bankName || ''),
            },
            loanDetails: applicationData.loanDetails ? {
                amount: applicationData.loanDetails.amount,
                months: applicationData.loanDetails.months,
                monthlyPayment: applicationData.loanDetails.monthlyPayment
            } : null,
            loanPurpose: String(applicationData.loanPurpose || ''),
            sourceOfRepayment: String(applicationData.sourceOfRepayment || ''),
            otherLoans: String(applicationData.otherLoans || ''),
            status: String(applicationData.status || ''),
            rejectionReason: String(applicationData.rejectionReason || ''),
            submittedAt: String(applicationData.submittedAt || ''),
        };

        const applicationContext = safeStringify(contextForAI);
        
        const prompt = `
          You are a professional financial analyst AI assistant for loan officers at Xtenda. Your task is to analyze the provided loan application JSON data and answer questions accurately. Be objective, factual, and concise.

          Here are some example tasks you can perform:
          - "Summarize this application."
          - "Are there any potential red flags?"
          - "What is the applicant's employer and loan amount?"
          - "Calculate the debt-to-income ratio if their monthly salary is X." (Note: You cannot know the salary from the data, you must be told it).

          Based *only* on the data provided, please answer the user's question. If the information is not in the data, state that clearly. Do not ask for more information, just state what is missing.

          Application Data:
          ${applicationContext}

          User's Question:
          ${textToSend}
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        const aiText = response.text;
        setMessages(prev => [...prev, { sender: 'ai', text: aiText }]);

    } catch (error) {
        console.error("Error in Admin Chat:", error);
        setMessages(prev => [...prev, { sender: 'ai', text: "Sorry, I encountered an error. Please check the API key and try again." }]);
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