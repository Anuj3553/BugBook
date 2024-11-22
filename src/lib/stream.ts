import { StreamChat } from 'stream-chat';

const streamServerClient = StreamChat.getInstance(
    process.env.NEXT_PUBLIC_STREAM_KEY!, // Your Stream Chat API key
    process.env.STREAM_SECRET!, // Your Stream Chat API secret
)

// This is a singleton instance of the StreamChat client
export default streamServerClient;