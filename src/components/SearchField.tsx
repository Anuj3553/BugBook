"use client"

import { useRouter } from "next/navigation"
import { Input } from "./ui/input";
import { SearchIcon } from "lucide-react";

export default function SearchField() {

    const router = useRouter();

    // Handle the form submission
    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault(); // Prevent the default form submission
        const form = e.currentTarget; // Get the form element
        const q = (form.q as HTMLInputElement).value.trim(); // Get the search query from the form input
        if(!q) return; // If the search query is empty, return

        // Redirect to the search page with the query string 
        router.push(`/search?q=${encodeURIComponent(q)}`)
    }

    // Progressive enhancement: use a form to submit the search query
    return <form onSubmit={handleSubmit} method="GET" action="/search">
        <div className="relative">
            <Input name="q" placeholder="Search" className="pe-10" />
            <SearchIcon className="absolute right-3 top-1/2 size-5 -translate-y-1/2 transform text-muted-foreground" />
        </div>
    </form>
}