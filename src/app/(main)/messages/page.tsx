import { Metadata } from "next";
import Chat from "./Chat";

// Page metadata
export const metadata: Metadata = {
    title: "Messages",
};


export default function Page() {
    return <Chat />;
}