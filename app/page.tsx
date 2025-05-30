'use client'
import { Suspense } from "react";
import ChatInterface from "@/components/chat-interface";

export default function Home() {
  return (
    <Suspense fallback={<div>Loading chat...</div>}>
      <ChatInterface />
    </Suspense>
  );
}
