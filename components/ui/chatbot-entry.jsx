"use client";
import { SignedIn } from "@clerk/nextjs";
import ChatbotButton from "./chatbot";

export default function ChatbotEntry({ context = "general" }) {
  return (
    <SignedIn>
      <ChatbotButton context={context} />
    </SignedIn>
  );
} 