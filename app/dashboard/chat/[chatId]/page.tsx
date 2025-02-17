import ChatInterface from "@/components/ChatInterface";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getConvexClient } from "@/lib/convex";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

interface ChatPageProps {
    params:Promise<{
        chatId: Id<"chats">;
    }>;
}

export default async function ChatPage({params}:ChatPageProps) {
    const ChatId = await params; //wait for the dynamic route to resolve
    //here we get the user Authtentication status
    const {userId} = await auth();

    if(!userId){
        redirect("/");
    }
    try{
        //here we get the Convex client
        const convex = getConvexClient();
        //here we get the initial messages
       const initialMessages = await convex.query(api.messages.list,{chatId: ChatId.chatId});
       return(
        <div className="flex-1 overflow-hidden">
            <ChatInterface chatId={ChatId.chatId} initialMessages={initialMessages}/>
        </div>
       )
    }catch(e){
        console.error("Error loading chat:",e);
        redirect("/dashboard");
    }
}
