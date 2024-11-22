import LoadingButton from "@/components/LoadingButton";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import UserAvatar from "@/components/UserAvatar";
import useDebounce from "@/hooks/useDebounce";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Loader2, SearchIcon, X } from "lucide-react";
import { useState } from "react";
import { UserResponse } from "stream-chat";
import { DefaultStreamChatGenerics, useChatContext } from "stream-chat-react";
import { useSession } from "../SessionProvider";

// New chat dialog component props
interface NewChatDialogProps {
    onOpenChange: (open: boolean) => void; // onOpenChange function
    onChatCreated: () => void; // onChatCreated function
}

// New chat dialog component
export default function NewChatDialog({
    onOpenChange, // onOpenChange function
    onChatCreated, // onChatCreated function
}: NewChatDialogProps) {
    // Get the chat context
    const { client, setActiveChannel } = useChatContext();

    // Get the toast function
    const { toast } = useToast();

    // Get the logged in user
    const { user: loggedInUser } = useSession();

    // Search input state
    const [searchInput, setSearchInput] = useState("");
    // Debounced search input
    const searchInputDebounced = useDebounce(searchInput);

    // Selected users state
    const [selectedUsers, setSelectedUsers] = useState<
        UserResponse<DefaultStreamChatGenerics>[] // UserResponse<DefaultStreamChatGenerics> is the user response type
    >([]);

    const { data, isFetching, isError, isSuccess } = useQuery({ // useQuery is used to fetch data
        queryKey: ["stream-users", searchInputDebounced], // the query key
        queryFn: async () => // the query function
            client.queryUsers( // query the users
                {
                    id: { $ne: loggedInUser.id }, // the id is not equal to the logged in user id
                    role: { $ne: "admin" }, // the role is not equal to admin
                    ...(searchInputDebounced // if the search input is debounced
                        ? { // the query
                            $or: [ // or
                                { name: { $autocomplete: searchInputDebounced } }, // the name is autocompleted
                                { username: { $autocomplete: searchInputDebounced } }, // the username is autocompleted
                            ],
                        }
                        : {}), // otherwise, an empty object
                },
                { name: 1, username: 1 }, // the name and username
                { limit: 15 }, // the limit
            ),
    });

    const mutation = useMutation({
        mutationFn: async () => { // the mutation function
            const channel = client.channel("messaging", { // create a new messaging channel
                members: [loggedInUser.id, ...selectedUsers.map((u) => u.id)], // the members
                name: // the name
                    selectedUsers.length > 1 // if the selected users length is greater than 1
                        ? loggedInUser.displayName + // the logged in user display name
                        ", " + // and
                        selectedUsers.map((u) => u.name).join(", ") // the selected users names joined by a comma
                        : undefined, // otherwise, undefined
            });
            await channel.create(); // create the channel
            return channel; // return the channel
        },
        // onSuccess function
        onSuccess: (channel) => {
            setActiveChannel(channel); // set the active channel
            onChatCreated(); // call the onChatCreated function
        },
        onError(error) {
            console.error("Error starting chat", error);
            toast({
                variant: "destructive",
                description: "Error starting chat. Please try again.",
            });
        },
    });

    return (
        <Dialog open onOpenChange={onOpenChange}>
            <DialogContent className="bg-card p-0">
                <DialogHeader className="px-6 pt-6">
                    <DialogTitle>New chat</DialogTitle>
                </DialogHeader>
                <div>
                    <div className="group relative">
                        <SearchIcon className="absolute left-5 top-1/2 size-5 -translate-y-1/2 transform text-muted-foreground group-focus-within:text-primary" />
                        <input
                            placeholder="Search users..."
                            className="h-12 w-full pe-4 ps-14 focus:outline-none"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                    </div>
                    {!!selectedUsers.length && (
                        <div className="mt-4 flex flex-wrap gap-2 p-2">
                            {selectedUsers.map((user) => (
                                <SelectedUserTag
                                    key={user.id}
                                    user={user}
                                    onRemove={() => {
                                        setSelectedUsers((prev) =>
                                            prev.filter((u) => u.id !== user.id),
                                        );
                                    }}
                                />
                            ))}
                        </div>
                    )}
                    <hr />
                    <div className="h-96 overflow-y-auto">
                        {isSuccess &&
                            data.users.map((user) => (
                                <UserResult
                                    key={user.id} // the key
                                    user={user} // the user
                                    selected={selectedUsers.some((u) => u.id === user.id)} // if the user is selected
                                    onClick={() => { // when the user is clicked
                                        setSelectedUsers((prev) => // set the selected users
                                            prev.some((u) => u.id === user.id) // if the user is already selected
                                                ? prev.filter((u) => u.id !== user.id) // filter the user
                                                : [...prev, user], // otherwise, add the user
                                        );
                                    }}
                                />
                            ))}
                        {isSuccess && !data.users.length && (
                            <p className="my-3 text-center text-muted-foreground">
                                No users found. Try a different name.
                            </p>
                        )}
                        {isFetching && <Loader2 className="mx-auto my-3 animate-spin" />}
                        {isError && (
                            <p className="my-3 text-center text-destructive">
                                An error occurred while loading users.
                            </p>
                        )}
                    </div>
                </div>
                <DialogFooter className="px-6 pb-6">
                    <LoadingButton
                        disabled={!selectedUsers.length}
                        loading={mutation.isPending}
                        onClick={() => mutation.mutate()}
                    >
                        Start chat
                    </LoadingButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// User result component props
interface UserResultProps {
    user: UserResponse<DefaultStreamChatGenerics>; // the user
    selected: boolean; // if the user is selected
    onClick: () => void; // onClick function
}

// User result component
function UserResult({ user, selected, onClick }: UserResultProps) {
    return (
        <button
            className="flex w-full items-center justify-between px-4 py-2.5 transition-colors hover:bg-muted/50"
            onClick={onClick}
        >
            <div className="flex items-center gap-2">
                <UserAvatar avatarUrl={user.image} />
                <div className="flex flex-col text-start">
                    <p className="font-bold">{user.name}</p>
                    <p className="text-muted-foreground">@{user.username}</p>
                </div>
            </div>
            {selected && <Check className="size-5 text-green-500" />}
        </button>
    );
}

// Selected user tag component props
interface SelectedUserTagProps {
    user: UserResponse<DefaultStreamChatGenerics>; // the user
    onRemove: () => void; // onRemove function
}

// Selected user tag component
function SelectedUserTag({ user, onRemove }: SelectedUserTagProps) { // the user and onRemove function
    return (
        <button
            onClick={onRemove} // when the button is clicked 
            className="flex items-center gap-2 rounded-full border p-1 hover:bg-muted/50"
        >
            <UserAvatar avatarUrl={user.image} size={24} />
            <p className="font-bold">{user.name}</p>
            <X className="mx-2 size-5 text-muted-foreground" />
        </button>
    );
}