"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { Send, User, Bot, Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { useMobile } from "@/hooks/use-mobile"
import { useAgents } from "@/hooks/use-agents"
import { useConversations } from "@/hooks/use-conversations"
import ModernLayout from "@/components/layouts/modern-layout"
import { formatRelativeTime } from "@/lib/utils"
import DOMPurify from "dompurify";

export default function ChatInterface() {
  const [message, setMessage] = useState("")
  const [selectedAgentId, setSelectedAgentId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isCreatingConversation, setIsCreatingConversation] = useState(false)
  const [localMessages, setLocalMessages] = useState<any[]>([])
  const [hasInitialized, setHasInitialized] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const isMobile = useMobile()
  const router = useRouter()
  const searchParams = useSearchParams()

  const {
    messages,
    conversations,
    currentConversationId,
    setCurrentConversationId,
    createConversation,
    saveMessage,
    fetchMessages,
    isLoading: isLoadingConversations,
  } = useConversations()

  const { agents, isLoading: isLoadingAgents } = useAgents()

  // One-time initialization effect
  useEffect(() => {
    if (hasInitialized) return

    const initializeChat = async () => {
      console.log("Initializing chat, agents:", agents.length)

      // Set first agent as default if none selected
      if (agents.length > 0 && !selectedAgentId) {
        console.log("Setting default agent:", agents[0].id)
        setSelectedAgentId(agents[0].id)
      }

      // Handle conversation from URL params
      const conversationId = searchParams.get("conversation")
      const newConversation = searchParams.get("new")

      if (conversationId) {
        console.log("Setting conversation ID from URL:", conversationId)
        setCurrentConversationId(conversationId)
        try {
          const fetchedMessages = await fetchMessages(conversationId)
          console.log("Fetched messages:", fetchedMessages?.length || 0)
          setLocalMessages(fetchedMessages || [])
        } catch (error) {
          console.error("Error fetching messages:", error)
        }
      } else if (newConversation === "true" && agents.length > 0) {
        // Start new conversation if requested
        console.log("Starting new conversation from URL param")
        startNewConversation()
      }

      setHasInitialized(true)
    }

    if (agents.length > 0 && !isLoadingAgents) {
      initializeChat()
    }
  }, [agents, searchParams, hasInitialized, isLoadingAgents])

  // Update local messages when messages from hook change
  useEffect(() => {
    if (messages && messages.length > 0 && hasInitialized) {
      console.log("Updating local messages from hook:", messages.length)
      setLocalMessages(messages)
    }
  }, [messages, hasInitialized])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [localMessages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return

    const agentToUse = selectedAgentId || (agents.length > 0 ? agents[0].id : null)
    if (!agentToUse) {
      toast({
        title: "Error",
        description: "Please select an agent first",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const agent = agents.find((a) => a.id === agentToUse)
      if (!agent) throw new Error("Selected agent not found")

      if (!agent.webhook_url || !agent.webhook_url.startsWith("http")) {
        throw new Error("Agent webhook URL is missing or invalid")
      }

      // Create or use existing conversation
      let conversationId = currentConversationId
      if (!conversationId) {
        setIsCreatingConversation(true)
        conversationId = await createConversation(agentToUse)
        setIsCreatingConversation(false)

        if (!conversationId) throw new Error("Failed to create conversation")

        setCurrentConversationId(conversationId)
        router.push(`/?conversation=${conversationId}`, { scroll: false })
      }

      const timestamp = new Date().toISOString()
      const userMessageObj = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        sender_type: "user",
        content: message,
        content_type: "text",
        timestamp,
        read_status: "read",
      }

      setLocalMessages((prev) => [...prev, userMessageObj])
      const sentMessage = message
      setMessage("")

      await saveMessage(conversationId, sentMessage, "user")

      const tempAgentMessage = {
        id: `temp-agent-${Date.now()}`,
        conversation_id: conversationId,
        sender_type: "agent",
        content: "Thinking...",
        content_type: "text",
        timestamp: new Date().toISOString(),
        read_status: "unread",
        isLoading: true,
      }

      setLocalMessages((prev) => [...prev, tempAgentMessage])

      // Agent webhook call
      try {
        console.log("Sending request to agent webhook:", agent.webhook_url)
        const payload = {
          message: sentMessage,
          userId: "guest",
          sessionId: conversationId,
        }
        console.log("Payload:", payload)

        const response = await fetch(agent.webhook_url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error(`Agent responded with status ${response.status}`)
        }

        // const responseText = await response.text()
        //const parser = new DOMParser();
        let responseText = await response.json();
        responseText = responseText[0]['output']
        //const doc = parser.parseFromString(responseText, "text/html");

        console.log('###########################################"')
        console.log("Agent response:", await responseText)

        setLocalMessages((prev) => prev.filter((msg) => msg.id !== tempAgentMessage.id))
        await saveMessage(conversationId, responseText, "agent")

        const updatedMessages = await fetchMessages(conversationId)
        if (updatedMessages && updatedMessages.length > 0) {
          setLocalMessages(updatedMessages)
        }
      } catch (error) {
        console.error("Error calling agent webhook:", error)

        setLocalMessages((prev) => prev.filter((msg) => msg.id !== tempAgentMessage.id))

        const errorMessage = {
          id: `error-${Date.now()}`,
          conversation_id: conversationId,
          sender_type: "agent",
          content: "Sorry, I couldn't process your request. Please try again later.",
          content_type: "text",
          timestamp: new Date().toISOString(),
          read_status: "unread",
        }

        setLocalMessages((prev) => [...prev, errorMessage])
        await saveMessage(
          conversationId,
          "Sorry, I couldn't process your request. Please try again later.",
          "agent"
        )

        throw error
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const startNewConversation = async () => {
    if (isCreatingConversation) return

    try {
      setIsCreatingConversation(true)

      // Clear current messages
      setLocalMessages([])
      setCurrentConversationId(null)

      const agentToUse = selectedAgentId || (agents.length > 0 ? agents[0].id : null)

      if (!agentToUse) {
        toast({
          title: "Error",
          description: "No agents available. Please create an agent first.",
          variant: "destructive",
        })
        return
      }

      // If no agent is selected but we have agents, select the first one
      if (!selectedAgentId && agents.length > 0) {
        setSelectedAgentId(agents[0].id)
      }

      console.log("Creating new conversation with agent:", agentToUse)
      const newConversationId = await createConversation(agentToUse)

      if (newConversationId) {
        console.log("Created new conversation:", newConversationId)
        setCurrentConversationId(newConversationId)
        router.push(`/?conversation=${newConversationId}`, { scroll: false })
      } else {
        throw new Error("Failed to create conversation")
      }
    } catch (error) {
      console.error("Error creating new conversation:", error)
      toast({
        title: "Error",
        description: "Failed to create new conversation",
        variant: "destructive",
      })
    } finally {
      setIsCreatingConversation(false)
    }
  }

  // Function to get agent name by ID
  const getAgentNameById = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId)
    return agent ? agent.name : "AI Agent"
  }

  // Function to render message content based on content_type
  const renderMessageContent = (content: string, contentType: string) => {
    if (!content) {
      return <div className="text-gray-400 italic">Empty message</div>;
    }

    switch (contentType) {
      case "html":
        // Decode the HTML string
        // const decodedContent = JSON.parse('"' + content.replace(/\"/g, '\\"') + '"');



        //return <div dangerouslySetInnerHTML={{ __html: decodedContent }} />;
        return <div>X</div>

      case "markdown":
        return <div className="whitespace-pre-wrap">{ }</div>;

      default: // text
        const parser = new DOMParser();
        const dom = parser.parseFromString(content, "text/html");
        const listItems = dom.querySelectorAll("ul");
        console.log(contentType)

        listItems.forEach((ul) => {
          ul.style.backgroundColor = "#0052cc";
          ul.style.color = "white"
        });
        const listItems2 = dom.querySelectorAll("div");
        listItems2.forEach((div) => {
          div.style.color = "white"
        })
        const modifiedHtml = dom.body.innerHTML; // Use body.innerHTML to get the content
        return <div dangerouslySetInnerHTML={{ __html: modifiedHtml }} />;
    }
  };


  return (
    <ModernLayout showConversations={true}>
      <div className="flex h-[calc(100vh-64px)] flex-col">
        <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900 p-4">
          <h1 className="text-xl font-bold text-white">Chat with AI Agents</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={startNewConversation} disabled={isCreatingConversation}>
              {isCreatingConversation ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-1 h-4 w-4" />
              )}
              <span className="hidden sm:inline">New Chat</span>
            </Button>
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger className="w-[180px] max-w-[120px] bg-gradient-to-r from-blue-500/10 to-green-500/10 sm:max-w-[180px]">
                <SelectValue placeholder="Select agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-950 p-4">
          {isLoadingConversations && localMessages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              <p className="mt-4 text-gray-400">Loading messages...</p>
            </div>
          ) : localMessages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center">
              <div className="rounded-full bg-blue-500/10 p-4">
                <Bot className="h-8 w-8 text-blue-500" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-white">Start a new conversation</h2>
              <p className="mt-2 text-center text-gray-400">
                Select an agent and start typing to begin your conversation.
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {localMessages.map((msg, index) => (
                <motion.div
                  key={msg.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`mb-4 flex ${msg.sender_type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[90%] rounded-lg p-3 sm:max-w-[80%] ${msg.sender_type === "user"
                      ? "bg-gradient-to-r from-blue-500 to-green-500 text-white"
                      : "bg-gray-800 text-white"
                      }`}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      {msg.sender_type === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      <span className="text-xs font-medium">{msg.sender_type === "user" ? "You" : "AI Agent"}</span>
                      <span className="text-xs opacity-70">{formatRelativeTime(new Date(msg.timestamp))}</span>
                      {msg.isLoading && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
                    </div>
                    {msg.isLoading ? (
                      <div className="text-gray-300">{msg.content}</div>
                    ) : (
                      renderMessageContent(msg.content, msg.content_type)
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-800 bg-gray-900 p-4">
          <div className="flex gap-2">
            {isMobile ? (
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={isLoading || isCreatingConversation}
                className="flex-1 bg-gray-800 border-gray-700 text-white"
              />
            ) : (
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={isLoading || isCreatingConversation}
                className="flex-1 min-h-[60px] max-h-[200px] bg-gray-800 border-gray-700 text-white"
                rows={2}
              />
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={sendMessage}
                    disabled={!message.trim() || isLoading || isCreatingConversation}
                    className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <span>Send message</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </ModernLayout>
  )
}
