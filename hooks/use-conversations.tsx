"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { createClient } from "@/lib/client"
import { useToast } from "@/hooks/use-toast"
import { v4 as uuidv4 } from "uuid"
import type { Conversation, Message } from "@/lib/types"

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [allMessages, setAllMessages] = useState<Record<string, Message[]>>({})
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Use refs to track initialization state
  const initialized = useRef(false)

  const supabase = createClient()
  const { toast } = useToast()

  // Initialize once
  useEffect(() => {
    if (initialized.current) return

    const init = async () => {
      setIsLoading(true)
      try {
        await fetchConversations()
      } catch (error) {
        console.error("Error initializing conversations:", error)
      } finally {
        setIsLoading(false)
        initialized.current = true
      }
    }

    init()
  }, [])

  // Update messages when currentConversationId changes
  useEffect(() => {
    if (!currentConversationId) {
      setMessages([])
      return
    }

    // If we have cached messages, use them
    if (allMessages[currentConversationId]) {
      setMessages(allMessages[currentConversationId])
    } else {
      // Otherwise fetch them
      fetchMessages(currentConversationId).catch((err) =>
        console.error("Error fetching messages for conversation:", err),
      )
    }
  }, [currentConversationId])

  const fetchConversations = useCallback(async () => {
    try {
      console.log("Fetching conversations from Supabase")

      // Fetch conversations from Supabase
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .order("last_message_at", { ascending: false })
        .limit(20)

      if (error) {
        console.error("Error fetching conversations:", error)
        return []
      }

      console.log("Fetched conversations:", data?.length || 0)

      // Update state with fetched conversations
      setConversations(data || [])
      return data || []
    } catch (error) {
      console.error("Error in fetchConversations:", error)
      return []
    }
  }, [supabase])

  const fetchMessages = useCallback(
    async (conversationId: string) => {
      if (!conversationId) {
        console.error("No conversation ID provided to fetchMessages")
        return []
      }

      try {
        setIsLoading(true)
        console.log("Fetching messages for conversation:", conversationId)

        // Fetch messages from Supabase
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("timestamp", { ascending: true })

        if (error) {
          console.error("Error fetching messages:", error)
          return []
        }

        console.log("Fetched messages:", data?.length || 0)

        // Store messages in cache
        const messagesData = data || []

        // Update cache without triggering re-renders
        setAllMessages((prev) => ({
          ...prev,
          [conversationId]: messagesData,
        }))

        // Only update current messages if this is still the active conversation
        if (currentConversationId === conversationId) {
          setMessages(messagesData)
        }

        return messagesData
      } catch (error) {
        console.error("Error in fetchMessages:", error)
        return []
      } finally {
        setIsLoading(false)
      }
    },
    [supabase, currentConversationId],
  )

  const createConversation = useCallback(
    async (agentId: string, title?: string) => {
      try {
        console.log("Creating new conversation with agent:", agentId)

        const conversationId = uuidv4()
        const timestamp = new Date().toISOString()

        const newConversation = {
          id: conversationId,
          user_id: "guest", // For guest users
          agent_id: agentId,
          started_at: timestamp,
          last_message_at: timestamp,
          title: title || "New Conversation",
          is_archived: false,
        }

        // Save to Supabase
        const { error } = await supabase.from("conversations").insert(newConversation)

        if (error) {
          console.error("Error creating conversation in Supabase:", error)
          throw new Error(`Failed to create conversation: ${error.message}`)
        }

        console.log("Conversation created successfully:", conversationId)

        // Update local state - add to the beginning of the array
        setConversations((prev) => [newConversation as Conversation, ...prev])

        // Initialize empty message array for this conversation
        setAllMessages((prev) => ({
          ...prev,
          [conversationId]: [],
        }))

        return conversationId
      } catch (error) {
        console.error("Error creating conversation:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to create conversation",
          variant: "destructive",
        })
        return null
      }
    },
    [supabase, toast],
  )

  const saveMessage = useCallback(
    async (conversationId: string, content: string, senderType: "user" | "agent") => {
      try {
        if (!conversationId) {
          throw new Error("No conversation ID provided")
        }

        console.log(`Saving ${senderType} message to conversation:`, conversationId)

        const messageId = uuidv4()
        const timestamp = new Date().toISOString()

        const newMessage = {
          id: messageId,
          conversation_id: conversationId,
          sender_type: senderType,
          content,
          content_type: "text",
          timestamp,
          read_status: senderType === "user" ? "read" : "unread",
        }

        // Save to Supabase
        const { error: messageError } = await supabase.from("messages").insert(newMessage)

        if (messageError) {
          console.error("Error saving message to Supabase:", messageError)
          throw new Error(`Failed to save message: ${messageError.message}`)
        }

        console.log("Message saved successfully:", messageId)

        // Update conversation last_message_at in Supabase
        const { error: conversationError } = await supabase
          .from("conversations")
          .update({ last_message_at: timestamp })
          .eq("id", conversationId)

        if (conversationError) {
          console.error("Error updating conversation timestamp:", conversationError)
        }

        // Update conversation last_message_at in local state
        setConversations((prev) =>
          prev.map((conv) => (conv.id === conversationId ? { ...conv, last_message_at: timestamp } : conv)),
        )

        // Update the messages in allMessages
        const updatedMessages = [...(allMessages[conversationId] || []), newMessage as Message]
        setAllMessages((prev) => ({
          ...prev,
          [conversationId]: updatedMessages,
        }))

        // Update current messages if this is the active conversation
        if (currentConversationId === conversationId) {
          setMessages(updatedMessages)
        }

        return newMessage as Message
      } catch (error) {
        console.error("Error saving message:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to save message",
          variant: "destructive",
        })
        throw error
      }
    },
    [supabase, toast, allMessages, currentConversationId],
  )

  const updateConversationTitle = useCallback(
    async (conversationId: string, title: string) => {
      try {
        // Update in Supabase
        const { error } = await supabase.from("conversations").update({ title }).eq("id", conversationId)

        if (error) {
          console.error("Error updating conversation title in Supabase:", error)
          throw new Error("Failed to update conversation title")
        }

        // Update local state
        setConversations((prev) => prev.map((conv) => (conv.id === conversationId ? { ...conv, title } : conv)))
      } catch (error) {
        console.error("Error updating conversation title:", error)
        toast({
          title: "Error",
          description: "Failed to update conversation title",
          variant: "destructive",
        })
        throw error
      }
    },
    [supabase, toast],
  )

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      try {
        // Delete from Supabase
        const { error } = await supabase.from("conversations").delete().eq("id", conversationId)

        if (error) {
          console.error("Error deleting conversation from Supabase:", error)
          throw new Error("Failed to delete conversation")
        }

        // Update local state
        setConversations((prev) => prev.filter((conv) => conv.id !== conversationId))

        // Clear messages if this was the current conversation
        if (currentConversationId === conversationId) {
          setMessages([])
          setCurrentConversationId(null)
        }

        // Remove from allMessages
        setAllMessages((prev) => {
          const newMessages = { ...prev }
          delete newMessages[conversationId]
          return newMessages
        })
      } catch (error) {
        console.error("Error deleting conversation:", error)
        toast({
          title: "Error",
          description: "Failed to delete conversation",
          variant: "destructive",
        })
        throw error
      }
    },
    [supabase, toast, currentConversationId],
  )

  return {
    conversations,
    currentConversationId,
    setCurrentConversationId,
    messages,
    isLoading,
    fetchConversations,
    fetchMessages,
    createConversation,
    saveMessage,
    updateConversationTitle,
    deleteConversation,
  }
}
