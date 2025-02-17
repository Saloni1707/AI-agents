import { ChatRequestBody, SSE_DATA_PREFIX,SSE_LINE_DELIMITER, StreamMessage, StreamMessageType } from "@/lib/types";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";

function sendSSEMessage(
    writer:WritableStreamDefaultWriter<Uint8Array>,
    _data:StreamMessage
){
    const encoder = new TextEncoder();
    return writer.write(
        encoder.encode(
            `${SSE_DATA_PREFIX}$(JSON.stringify(data))${SSE_LINE_DELIMITER}`
        )
    );
}

export default async function POST(req:Request) {
  try{
    const {userId} = await auth();
    if(!userId){
        return new Response("Unauthorized",{status:401});
    }
    const body = await req.json() as ChatRequestBody;
    const {messages, newMessage , chatId} = body;

    const convex = getConvexClient();

    //here we will create a stream with larger queue strategy for better performance
    const stream = new TransformStream({},{highWaterMark: 1024}); //here we set internal memory to 1024 bytes
    const writer = stream.writable.getWriter();

    //writing the responses to the stream
    const response = new Response(stream.readable, {
        headers: {
            "Content-type": "text/event-stream",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no", //Disable buffering for nginx for SSE to work well
        }
    });

    const startStream = async () => {
        try{
            //Stream the response to the client
            await sendSSEMessage(writer,{ type:StreamMessageType.Connected });
            // send user message to the convex our db
            await convex.mutation(api.messages.send,{
                chatId,
                content: newMessage,
            });

        }catch(e){
            console.error("Error in stream",e);
            return NextResponse.json(
                {error:"Failed to process chat request"} as const,
                {status:500}
            );
        }
    };

    startStream();
    return response;
    
    
  }catch(error){
    console.error("Error in chat API",error);
    return NextResponse.json(
        {error: "Failed to process chat request"} as const,
        {status:500}
    );  
  }
}


