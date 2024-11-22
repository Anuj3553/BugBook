import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { MailPlus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
    ChannelList,
    ChannelPreviewMessenger,
    ChannelPreviewUIComponentProps,
    useChatContext,
} from "stream-chat-react";
import { useSession } from "../SessionProvider";
import NewChatDialog from "./NewChatDialog";

interface ChatSidebarProps {
    open: boolean;
    onClose: () => void;
}

// Chat sidebar component
export default function ChatSidebar({ open, onClose }: ChatSidebarProps) {
    // Get the user from the session
    const { user } = useSession();

    // Get the query client
    const queryClient = useQueryClient();

    // Get the channel from the chat context
    const { channel } = useChatContext();

    // Invalidate the unread messages count query when the channel changes
    useEffect(() => {
        if (channel?.id) { // if the channel id exists
            queryClient.invalidateQueries({ queryKey: ["unread-messages-count"] }); // invalidate the unread messages count query
        }
    }, [channel?.id, queryClient]); // when the channel id changes

    // Channel preview component
    const ChannelPreviewCustom = useCallback( // useCallback is used to memoize the ChannelPreviewCustom component
        (props: ChannelPreviewUIComponentProps) => ( // ChannelPreviewUIComponentProps is the props which comes from the Stream Chat 
            <ChannelPreviewMessenger // ChannelPreviewMessenger is the default channel preview component
                {...props} // pass the props to the ChannelPreviewMessenger component
                onSelect={() => { // when the channel is selected
                    props.setActiveChannel?.(props.channel, props.watchers); // set the active channel
                    onClose(); // close the sidebar
                }}
            />
        ),
        [onClose], // when the onClose function changes
    );

    return (
        <div
            className={cn(
                "size-full flex-col border-e md:flex md:w-72",
                open ? "flex" : "hidden",
            )}
        >
            <MenuHeader onClose={onClose} />
            <ChannelList
                filters={{ // filters for the channel list
                    type: "messaging", // type is messaging
                    members: { $in: [user.id] }, // members include the user id
                }}
                showChannelSearch // show the channel search
                options={{ state: true, presence: true, limit: 8 }} // options for the channel list
                sort={{ last_message_at: -1 }} // sort the channels by last message at
                additionalChannelSearchProps={{ // additional channel search props
                    searchForChannels: true, // search for channels
                    searchQueryParams: { // search query params
                        channelFilters: { // channel filters
                            filters: { members: { $in: [user.id] } }, // members include the user id
                        },
                    },
                }}
                Preview={ChannelPreviewCustom} // custom channel preview component
            />
        </div>
    );
}

// Menu header component
interface MenuHeaderProps {
    onClose: () => void; // function to close the menu
}

// Menu header component
function MenuHeader({ onClose }: MenuHeaderProps) {
    const [showNewChatDialog, setShowNewChatDialog] = useState(false); // show new chat dialog state

    return (
        <>
            <div className="flex items-center gap-3 p-2">
                <div className="h-full md:hidden">
                    <Button size="icon" variant="ghost" onClick={onClose}>
                        <X className="size-5" />
                    </Button>
                </div>
                <h1 className="me-auto text-xl font-bold md:ms-2">Messages</h1>
                <Button
                    size="icon"
                    variant="ghost"
                    title="Start new chat"
                    onClick={() => setShowNewChatDialog(true)} // show the new chat dialog
                >
                    <MailPlus className="size-5" />
                </Button>
            </div>
            {showNewChatDialog && (
                <NewChatDialog
                    onOpenChange={setShowNewChatDialog} // set the show new chat dialog state
                    onChatCreated={() => { // when the chat is created
                        setShowNewChatDialog(false); // hide the new chat dialog
                        onClose(); // close the menu
                    }}
                />
            )}
        </>
    );
}