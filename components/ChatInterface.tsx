"use client";

import {Id , Doc } from "@/convex/_generated/dataModel";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { ArrowRight, ArrowUpCircleIcon } from "lucide-react";
import { ChatRequestBody } from "@/lib/types";

interface ChatInterfaceProps{
    chatId: Id<"chats">;
    initialMessages: Doc<"messages">[];
}

function ChatInterface( {chatId , initialMessages} : ChatInterfaceProps) {
  const [messages,setMessages] = useState<Doc<"messages">[]>(initialMessages);
  const [input,setInput] = useState("");
  const [isloading,setIsLoading] =useState(false);
  const [streamedResponse,setStreamedResponse] = useState("");
  const [currentTool,setCurrentTool] = useState<{
    name:string,
    input:unknown,
} | null>(null);
  //using this we scroll to the bottom of the chat
  const messageEndRef = useRef<HTMLDivElement>(null);
  //If a streamed response is added, we scroll to the bottom of the chat
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({behavior:"smooth"});
  },[messages , streamedResponse]);

  const scrollToBottom = ()=>{
    messageEndRef.current?.scrollIntoView({behavior:"smooth"});
  };

  const handleSubmit = async (e:React.FormEvent)=>{
    e.preventDefault();

    const trimmedInput = input.trim();
    if(!trimmedInput || isloading) return;
    //Reset the UI components for the new message
    setInput("");
    setStreamedResponse("");
    setCurrentTool(null);
    setIsLoading(true);

    //Adding the user's message immediately for bettr UX
    const optimisticUserMessage: Doc<"messages"> = {
      _id: `temp_${Date.now()}`,
      chatId,
      content:trimmedInput,
      role:"user",
      createdAt:Date.now(),
    } as Doc<"messages">;

    setMessages((prev) => [...prev,optimisticUserMessage]);
    //here the full response is tracked so that we can store it in the database
    let fullResponse = "";
    //start the streaming response
    try{
      const requestBody: ChatRequestBody = {
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        newMessage: trimmedInput,
        chatId,
      };

      // Initialize SSE connection
      const response = await fetch("/api/chat/stream",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(requestBody),
      });
      if(!response.ok) throw new Error(await response.text());
      if(!response.body) throw new Error("No response body available");
      
      //---Handle the streamed response---

      //-----


    }catch(error){
      //Handle any errors during the streaming process
      console.error("Error sending message",error);
      //if error occurs, remove the optimistic user message
      setMessages((prev) => 
      prev.filter((msg) => msg._id !== optimisticUserMessage._id));

      setStreamedResponse("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className = "flex flex-col h-[calc(100vh-theme(spacing.14))]">
      {/* Messages */}
      <section className = "flex-1">
        <div>
          {/* Messages */}
          
          {/* Last Messages */}
          <div ref={messageEndRef}/>
        </div>
      </section>
      {/* footer */}
      <footer className="border-t bg-white p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange = {(e)=>setInput(e.target.value)}
              placeholder="Message AI Agent...."
              className="flex-1 py-3 px-4 rounded-2xl border border-gray-200
              focus:outline-none focus:ring-2 focus:ring-blue-500
              focus:border-transparent pr-12 bg-gray-50
              placeholder:text-gray-500"
              disabled={isloading}
            />
            <Button 
              type="submit"
              disabled={isloading || !input.trim()}
              className={`absolute right-1.5 rounded-xl h-9 w-9 p-0 flex items-center justify-center transition-all ${
                input.trim()
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                : "bg-gray-100 text-gray-400"
              }`}

            >
              <ArrowRight />

            </Button>

          </div>

        </form>
      </footer>

    </main>
  )
}

export default ChatInterface