import { ConvexHttpClient } from "convex/browser";

export const getConvexClient = () => {
    // Ensure the environment variable exists and is properly typed
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
        throw new Error("NEXT_PUBLIC_CONVEX_URL is not defined");
    }
    // Create a new instance using the imported ConvexHttpClient
    return new ConvexHttpClient(url);
};