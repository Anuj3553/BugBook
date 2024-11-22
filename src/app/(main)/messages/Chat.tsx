"use client";

import { Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { Chat as StreamChat } from "stream-chat-react";
import ChatChannel from "./ChatChannel";
import ChatSidebar from "./ChatSidebar";
import useIntializeChatClient from "./useInitializeChatClient";

// Chat component
export default function Chat() {
    // Initialize the chat client
    const chatClient = useIntializeChatClient();

    // Get the resolved theme
    const { resolvedTheme } = useTheme();

    // Sidebar state
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // If the chat client is not initialized
    if (!chatClient) {
        return <Loader2 className="mx-auto my-3 animate-spin" />;
    }

    return (
        <main className="relative w-full overflow-hidden rounded-2xl bg-card shadow-sm">
            <div className="absolute bottom-0 top-0 flex w-full">
                <StreamChat
                    client={chatClient} // the chat client
                    theme={ // If the resolved theme is dark, use the dark theme, otherwise use the light theme
                        resolvedTheme === "dark"
                            ? "str-chat__theme-dark"
                            : "str-chat__theme-light"
                    }
                >
                    <ChatSidebar
                        open={!sidebarOpen} // If the sidebar is open
                        onClose={() => setSidebarOpen(true)} // Close the sidebar
                    />
                    <ChatChannel
                        open={sidebarOpen} // If the sidebar is not open
                        openSidebar={() => setSidebarOpen(false)} // Open the sidebar
                    />
                </StreamChat>
            </div>
        </main>
    );
}