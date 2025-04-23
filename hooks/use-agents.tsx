"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/client"
import { useToast } from "@/hooks/use-toast"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { v4 as uuidv4 } from "uuid"
import type { Agent } from "@/lib/types"

// Default agents to use as fallback
const defaultAgents: Agent[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "SEO Content Agent",
    description: "Generates SEO-optimized content for websites and blogs",
    webhook_url: "https://n8n.srv780482.hstgr.cloud/webhook/ce5c6672-28d9-4971-b269-2d78bee7d48c",
    status: "active",
    response_format: "text",
    created_at: new Date().toISOString(),
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    name: "LinkedIn Post Agent",
    description: "Creates engaging LinkedIn posts for professional networking",
    webhook_url: "https://n8n.srv780482.hstgr.cloud/webhook-test/ce5c6672-28d9-4971-b269-2d78bee7d48c",
    status: "active",
    response_format: "text",
    created_at: new Date().toISOString(),
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
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
  const [dbChecked, setDbChecked] = useState(false)

  const supabase = createClient()
  const { toast } = useToast()

  const fetchAgents = useCallback(async () => {
    try {
      setIsLoading(true)

      if (dbChecked && !dbAvailable) return

      const { data, error } = await supabase.from("agents").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching agents:", error)
        setDbAvailable(false)
      } else if (data && data.length > 0) {
        setAgents(data)
        setDbAvailable(true)
      }

      setDbChecked(true)
    } catch (error) {
      console.error("Error in fetchAgents:", error)
      setDbAvailable(false)
      setDbChecked(true)
    } finally {
      setIsLoading(false)
    }
  }, [supabase, setAgents, dbChecked, dbAvailable])

  const createAgent = useCallback(
    async (agent: Omit<Agent, "id" | "created_at">) => {
      try {
        // Insert agent without passing id or created_at, as Supabase handles that
        const { data, error } = await supabase
          .from("agents")
          .insert([agent]) // wrap agent in an array
          .select("*") // to get the full response with id and created_at

        if (error) {
          console.error("Error saving to Supabase:", error)
          setDbAvailable(false)
          toast({
            title: "Error",
            description: "Failed to create agent",
            variant: "destructive",
          })
          return null
        }

        // Ensure we receive the full data from the insert query
        if (data && data.length > 0) {
          const insertedAgent = data[0] // The first agent in the response (should be the one we just inserted)
          setAgents((prev) => [insertedAgent, ...prev]) // Update local storage state with the new agent

          toast({
            title: "Success",
            description: "Agent created successfully",
          })
          return insertedAgent.id // Return the new agent's id
        } else {
          console.error("No data returned from Supabase insert")
          return null
        }
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
    [supabase, dbAvailable, setAgents, toast]
  )



  const updateAgent = useCallback(
    async (id: string, updates: Partial<Agent>) => {
      const updatedAgent = {
        ...updates,
        updated_at: new Date().toISOString(),
      }

      try {
        if (dbAvailable) {
          const { error } = await supabase.from("agents").update(updatedAgent).eq("id", id)
          if (error) {
            console.error("Error updating in Supabase:", error)
            setDbAvailable(false)
          }
        }

        setAgents((prev) => prev.map((agent) => (agent.id === id ? { ...agent, ...updatedAgent } : agent)))

        toast({ title: "Success", description: "Agent updated successfully" })
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
        if (dbAvailable) {
          const { error } = await supabase.from("agents").delete().eq("id", id)
          if (error) {
            console.error("Error deleting from Supabase:", error)
            setDbAvailable(false)
          }
        }

        setAgents((prev) => prev.filter((agent) => agent.id !== id))

        toast({ title: "Success", description: "Agent deleted successfully" })
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

  useEffect(() => {
    if (!dbChecked) fetchAgents()
  }, [fetchAgents, dbChecked])

  return {
    agents,
    isLoading,
    fetchAgents,
    createAgent,
    updateAgent,
    deleteAgent,
    dbAvailable, // optional if you want to expose DB status
  }
}
