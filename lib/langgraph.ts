// Build our own model
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import wxflows from "@wxflows/sdk/langchain";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { END,START,StateGraph, MessagesAnnotation, MemorySaver } from "@langchain/langgraph";
import SYSTEM_MESSAGE from "@/constants/systemMessage";
import { AIMessage, BaseMessage, HumanMessage, SystemMessage,trimMessages } from "@langchain/core/messages";
import { ChatPromptTemplate , MessagesPlaceholder } from "@langchain/core/prompts";


//Trim the messages to the last 10 messages
const trimmer = trimMessages({
    maxTokens: 10, //i only want the last 10 messages
    strategy:"last",
    tokenCounter: (msgs) => msgs.length,
    includeSystem: true,
    allowPartial:false,
    startOn:"human",
});

const toolClient = new wxflows({
    endpoint: process.env.WXFLOWS_ENDPOINT || "",
    apikey: process.env.WXFLOWS_APIKEY,
});

// Retrieve the tools asynchronously
const tools = await toolClient.lcTools;
const toolNode = new ToolNode(tools);


// Connect to wxflows and retrieve tools
const initialiseModel = async () => {    
    const model = new ChatGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY,
        modelName: "gemini-1.5-flash",
        temperature: 0.7,
        maxOutputTokens: 4000,
        streaming: true,
        callbacks: [
            {
                handleLLMStart: async () => {
                    // console.log("🤖 Starting LLM call");
                },
                handleLLMEnd: async (output: { llmOutput?: { usage?: { 
                    promptTokens?: number;
                    candidatesTokens?: number;
                    totalTokens?: number;
                }}}) => {
                    console.log("🤖 End LLM call", output);
                    const usage = output.llmOutput?.usage;
                    if (usage) {
                        // console.log("📊 Token Usage:", {
                        //   prompt_tokens: usage.promptTokens,
                        //   candidates_tokens: usage.candidatesTokens,
                        //   total_tokens: usage.totalTokens,
                        // });
                    }
                },
            },
        ],
    }).bindTools([tools]);

    return model;
};

// Define the shouldContinue function that determine wheter to continue or not
function shouldContinue(state: typeof MessagesAnnotation.State){
    const messages = state.messages;
    const lastMessage = messages[messages.length - 1] as AIMessage;
    //if the LLM makes a took call , then we route to the tools node
    if(lastMessage.tool_calls?.length){
        return "tools";
    }
    //if the last message is a tool message , route back to the agent
    if(lastMessage.content && lastMessage._getType() === "tool"){
        return "agent";
    }

    //otherwise we are done
    return END;
}

const createWorkflow = () => {
    const model = initialiseModel();
    //we are using the state graph to store the state of the workflow and let the model call the tools and update the state also make decisions based on the state
    
    const stateGraph = new StateGraph(MessagesAnnotation).addNode(
        'agent', //here the first node of the graph is the agent
        async(state) => {
            // I've created a system message that will be used to guide the agent
            const systemContent = SYSTEM_MESSAGE;

            //Created the prompt template with the system message and the messages placeholder
            const promptTemplate = ChatPromptTemplate.fromMessages([
                new SystemMessage(systemContent, {
                    cache_control: {type: "ephemeral"} //set a cache breakpoint {max number of tokens for google genai is 16384}
                }),
                new MessagesPlaceholder("messages"),
            ]);

            //Trim the messages to the last 10 messages
            const trimmedMessages = await trimmer.invoke(state.messages);

            //Format the prompt with the current messages
            const prompt = await promptTemplate.invoke({messages:trimmedMessages});
            
            //Getting the response from the model
            const response = (await model).invoke(prompt);
            return {messages: [response]};
        
        })
        .addEdge(START, "agent")
        .addNode("tools",toolNode)
        .addConditionalEdges("agent",shouldContinue)
        .addEdge("tools","agent");

    return stateGraph;
};
//function to add caching headers to messages
function addCachingHeaders(messages: BaseMessage[]): BaseMessage[] {
    //Here are some of the caching headers rules for turn-by-turn conversations
    //1. Cache the first message
    //2.Cache the LAST message
    //3.Cache the second to last HUMAN message
    return messages;
    if(!messages.length) return messages;
    // then we create the copy of the messages just to avoid mutating the original messages
    const cachedMessages = [...messages];

    //helper to add cache control headers
    const addCacheControl = (message: BaseMessage) => {
        message.content = [
            {
                type: "text",
                text: message.content as string,
                cache_control: {type: "ephemeral"},
            },
        ];
    };

    //cache the last message
    addCacheControl(cachedMessages.at(-1)!);

    //Find and Cache the second to last HUMAN message
    let humanCount = 0 ;
    for (let i = cachedMessages.length - 1 ; i >= 0 ; i--){
        if(cachedMessages[i] instanceof HumanMessage){
            humanCount++;
            if(humanCount === 2){
                addCacheControl(cachedMessages[i]);  
                break;
            }
            
        }

    }

    return cachedMessages;

}

export async function submitQuestion(messages: BaseMessage[] , chatId: string){
    //Add caching headers to messages
    const cachedMessages = addCachingHeaders(messages);

    
    const workflow = createWorkflow();

    //Here we create a checkpoint to save the state of the conversations
    const checkpointer = new MemorySaver();
    const app = workflow.compile({ checkpointer });

    console.log("🔒🔒🔒 Messages:",messages);

    //Here we run the graph and stream the response

    const stream = await app.invoke(
        {
            messages,
        },{
            configurable: {
                thread_id: chatId
            },
            streamMode: "messages",
            runId: chatId,
        })
}


export default initialiseModel;
