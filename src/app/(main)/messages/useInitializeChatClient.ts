import kyInstance from "@/lib/ky";
import { useEffect, useState } from "react";
import { StreamChat } from "stream-chat";
import { useSession } from "../SessionProvider";

// Initialize the chat client service
export default function useInitializeChatClient() {
    // Get the user from the session
    const { user } = useSession();
    // Chat client state
    const [chatClient, setChatClient] = useState<StreamChat | null>(null);

    // Initialize the chat client
    useEffect(() => {
        const client = StreamChat.getInstance(process.env.NEXT_PUBLIC_STREAM_KEY!); // Get the Stream Chat client

        client // Connect the user
            .connectUser( // Connect the user
                { 
                    id: user.id, // the user id
                    username: user.username, // the username
                    name: user.displayName, // the display name
                    image: user.avatarUrl, // the avatar url
                },
                async () => // the async function
                    kyInstance // the ky instance
                        .get("/api/get-token") // get the token
                        .json<{ token: string }>() // the token
                        .then((data) => data.token), // the token
            )
            .catch((error) => console.error("Failed to connect user", error))
            .then(() => setChatClient(client)); // set the chat client

        return () => {
            setChatClient(null); // set the chat
            // Disconnect the user
            client 
                .disconnectUser()
                .catch((error) => console.error("Failed to disconnect user", error))
                .then(() => console.log("Connection closed"));
        };
    }, [user.id, user.username, user.displayName, user.avatarUrl]); // when the user id, username, display name, or avatar url changes

    return chatClient; // return the chat client
}