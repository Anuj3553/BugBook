import Image from "next/image";
import signupImage from "@/assets/signup-image.jpg";
import Link from "next/link";

import type { Metadata } from "next";
import SignUpForm from "./SignUpForm";

export const metadata: Metadata = {
    title: "Signup",
    description: "Signup for an account",
};

export default function Page() {
    return (
        <main className="flex h-screen items-center justify-center p-5">
            <div className="flex h-full max-h-[40rem] w-full max-w-[64rem] overflow-hidden bg-card shadow-2xl">
                <div className="w-full space-y-10 overflow-y-auto p-10 md:w-1/2">
                    <div className="space-y-1 text-center">
                        <h1 className="text-3xl font-bold">Sign up to Connect</h1>
                        <p className="text-muted-foreground">
                            A place where <span className="italic">you</span> can find a friend
                        </p>
                    </div>
                    <div className="space-y-5">
                        <SignUpForm />
                        <Link href="/login" className="block text-center">
                            <span className="hover:underline">Already have an account? Log in</span>
                        </Link>
                    </div>
                </div>

                <Image
                    src={signupImage}
                    className="w-1/2 object-cover hidden md:block"
                    alt="Signup image"
                />
            </div>
        </main>
    );
}
