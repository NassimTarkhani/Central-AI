"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { v4 as uuidv4 } from "uuid"
import type { Agent } from "@/lib/types"

// Default agents to use as fallback - now with proper UUIDs
const defaultAgents: Agent[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440000", // UUID for SEO agent
    name: "SEO Content Agent",
    description: "Generates SEO-optimized content for websites and blogs",
    webhook_url: "https://n8n.srv780482.hstgr.cloud/webhook/ce5c6672-28d9-4971-b269-2d78bee7d48c",
    status: "active",
    response_format: "text",
    created_at: new Date().toISOString(),
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440001", // UUID for LinkedIn agent
    name: "LinkedIn Post Agent",
    description: "Creates engaging LinkedIn posts for professional networking",
    webhook_url: "https://n8n.srv780482.hstgr.cloud/webhook-test/ce5c6672-28d9-4971-b269-2d78bee7d48c",
    status: "active",
    response_format: "text",
    created_at: new Date().toISOString(),
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002", // UUID for Spatial agent
    name: "Spatial Room Agent",
    description: "Manages spatial room configurations and settings",
    webhook_url: "https://n8n.srv780482.hstgr.cloud/webhook/ce5c6672-28d9-4971-b269-2d78bee7d48c",
    status: "active",
    response_format: "html",
    created_at: new Date().toISOString(),
  },
]

export function useAgents() {
  const [agents, setAgents] = useLocalStorage<Agent[]>("agents", defaultAgents)
  const [isLoading, setIsLoading] = useState(true)
  const [dbAvailable, setDbAvailable] = useState(false)
  const [dbChecked, setDbChecked] = useState(false) // Track if we've checked the DB

  const supabase = createClient()
  const { toast } = useToast()

  const fetchAgents = useCallback(async () => {
    try {
      setIsLoading(true)

      // If we've already checked the DB and it's not available, use localStorage
      if (dbChecked && !dbAvailable) {
        return agents
      }

      // Try to fetch from Supabase
      const { data, error } = await supabase.from("agents").select("*").order("created_at", { ascending: false })

      if (error) {
        // If there's an error, it might be because the table doesn't exist
        console.error("Error fetching agents:", error)
        setDbAvailable(false)
        setDbChecked(true)
        return agents // Return the current state (from localStorage)
      }

      // If we got data from Supabase, use it
      if (data && data.length > 0) {
        setDbAvailable(true)
        setDbChecked(true)
        setAgents(data)
        return data
      }

      // If no data in Supabase but no error, use localStorage data
      setDbAvailable(true)
      setDbChecked(true)
      return agents
    } catch (error) {
      console.error("Error in fetchAgents:", error)
      setDbAvailable(false)
      setDbChecked(true)
      return agents // Return the current state (from localStorage)
    } finally {
      setIsLoading(false)
    }
  }, [supabase, agents, setAgents, dbChecked, dbAvailable])

  const createAgent = useCallback(
    async (agent: Omit<Agent, "id" | "created_at">) => {
      try {
        const newAgent = {
          id: uuidv4(),
          ...agent,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        // Try to save to Supabase if available
        if (dbAvailable) {
          try {
            const { error } = await supabase.from("agents").insert(newAgent)
            if (error) {
              console.error("Error saving to Supabase:", error)
              // Fall back to localStorage if Supabase fails
              setDbAvailable(false)
            }
          } catch (error) {
            console.error("Error saving to Supabase:", error)
            setDbAvailable(false)
          }
        }

        // Always update local state
        setAgents((prev) => [newAgent as Agent, ...prev])

        toast({
          title: "Success",
          description: "Agent created successfully",
        })

        return newAgent.id
      } catch (error) {
        console.error("Error creating agent:", error)
        toast({
          title: "Error",
          description: "Failed to create agent",
          variant: "destructive",
        })
        return null
      }
    },
    [supabase, dbAvailable, setAgents, toast],
  )

  const updateAgent = useCallback(
    async (id: string, updates: Partial<Agent>) => {
      try {
        const updatedAgent = {
          ...updates,
          updated_at: new Date().toISOString(),
        }

        // Try to update in Supabase if available
        if (dbAvailable) {
          try {
            const { error } = await supabase.from("agents").update(updatedAgent).eq("id", id)
            if (error) {
              console.error("Error updating in Supabase:", error)
              setDbAvailable(false)
            }
          } catch (error) {
            console.error("Error updating in Supabase:", error)
            setDbAvailable(false)
          }
        }

        // Always update local state
        setAgents((prev) => prev.map((agent) => (agent.id === id ? { ...agent, ...updatedAgent } : agent)))

        toast({
          title: "Success",
          description: "Agent updated successfully",
        })

        return true
      } catch (error) {
        console.error("Error updating agent:", error)
        toast({
          title: "Error",
          description: "Failed to update agent",
          variant: "destructive",
        })
        return false
      }
    },
    [supabase, dbAvailable, setAgents, toast],
  )

  const deleteAgent = useCallback(
    async (id: string) => {
      try {
        // Try to delete from Supabase if available
        if (dbAvailable) {
          try {
            const { error } = await supabase.from("agents").delete().eq("id", id)
            if (error) {
              console.error("Error deleting from Supabase:", error)
              setDbAvailable(false)
            }
          } catch (error) {
            console.error("Error deleting from Supabase:", error)
            setDbAvailable(false)
          }
        }

        // Always update local state
        setAgents((prev) => prev.filter((agent) => agent.id !== id))

        toast({
          title: "Success",
          description: "Agent deleted successfully",
        })

        return true
      } catch (error) {
        console.error("Error deleting agent:", error)
        toast({
          title: "Error",
          description: "Failed to delete agent",
          variant: "destructive",
        })
        return false
      }
    },
    [supabase, dbAvailable, setAgents, toast],
  )

  // Only fetch agents once on initial mount
  useEffect(() => {
    fetchAgents()
  }, []) // Empty dependency array to run only once

  return {
    agents,
    isLoading,
    fetchAgents,
    createAgent,
    updateAgent,
    deleteAgent,
  }
}
