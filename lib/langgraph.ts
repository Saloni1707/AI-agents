// Build our own model
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const initialiseModel = () => {
    const model = new ChatGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY,
        modelName: "gemini-1.5-flash", // Use a free-tier compatible model
        temperature: 0.7,
        maxOutputTokens: 4000, // Ensure the free tier supports this
        streaming: true,
        clientOptions: {
            defaultHeaders: {
                "X-GEMINI-MODE": "prompt-caching-optional", // Adjusted for potential free-tier use
            }
        }
    });

    return model;
};

export default initialiseModel;
