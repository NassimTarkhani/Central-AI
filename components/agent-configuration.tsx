"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Edit, Trash, Activity, Server, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useAgents } from "@/hooks/use-agents"
import ModernLayout from "@/components/layouts/modern-layout"
import type { Agent } from "@/lib/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

const agentFormSchema = z.object({
  name: z.string().min(2, {
    message: "Agent name must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  webhook_url: z.string().url({
    message: "Please enter a valid URL.",
  }),
  response_format: z.enum(["text", "html", "markdown"]),
  status: z.enum(["active", "inactive"]),
  configuration: z.record(z.any()).optional(),
})

export default function AgentConfiguration() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [isTestingWebhook, setIsTestingWebhook] = useState(false)

  const { toast } = useToast()
  const { agents, isLoading, createAgent, updateAgent, deleteAgent } = useAgents()

  const form = useForm<z.infer<typeof agentFormSchema>>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: {
      name: "",
      description: "",
      webhook_url: "",
      response_format: "text",
      status: "active",
      configuration: {},
    },
  })

  useEffect(() => {
    if (editingAgent) {
      form.reset({
        name: editingAgent.name,
        description: editingAgent.description || "",
        webhook_url: editingAgent.webhook_url,
        response_format: editingAgent.response_format || "text",
        status: editingAgent.status || "active",
        configuration: editingAgent.configuration || {},
      })
    } else {
      form.reset({
        name: "",
        description: "",
        webhook_url: "",
        response_format: "text",
        status: "active",
        configuration: {},
      })
    }
  }, [editingAgent, form])

  const onSubmit = async (values: z.infer<typeof agentFormSchema>) => {
    try {
      if (editingAgent) {
        // Update existing agent
        await updateAgent(editingAgent.id, values)
      } else {
        // Create new agent
        await createAgent(values)
      }

      // Close dialog
      setIsDialogOpen(false)
      setEditingAgent(null)
    } catch (error) {
      console.error("Error saving agent:", error)
      toast({
        title: "Error",
        description: "Failed to save agent. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (agentId: string) => {
    await deleteAgent(agentId)
  }

  const testAgent = async () => {
    try {
      setIsTestingWebhook(true)
      setTestResult(null)

      const values = form.getValues()

      // Send test request to webhook
      const response = await fetch(values.webhook_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "This is a test message from AI Agents Central Command.",
          userId: "test-user",
          sessionId: "test-session",
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const responseText = await response.text()

      setTestResult({
        success: true,
        message: `Test successful! Response: ${responseText.substring(0, 100)}${responseText.length > 100 ? "..." : ""
          }`,
      })
    } catch (error) {
      console.error("Error testing agent:", error)
      setTestResult({
        success: false,
        message: `Test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
    } finally {
      setIsTestingWebhook(false)
    }
  }

  return (
    <ModernLayout>
      <div className="container mx-auto py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Configuration D'agents</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setEditingAgent(null)}
                className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
              >
                <Plus className="mr-2 h-4 w-4" /> Ajouter Nouveau Agent
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-gray-900 text-white border-gray-800">
              <DialogHeader>
                <DialogTitle>{editingAgent ? "Edit Agent" : "Create New Agent"}</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Configurer votre agent IA
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0.25">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom d'agent</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., SEO Content Agent"
                            {...field}
                            className="bg-gray-800 border-gray-700"
                          />
                        </FormControl>
                        <FormDescription className="text-gray-400">A descriptive name for your agent.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe what this agent does..."
                            {...field}
                            className="bg-gray-800 border-gray-700"
                          />
                        </FormControl>
                        <FormDescription className="text-gray-400">
                          Décrivez votre agent
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="webhook_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Webhook URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://your-webhook-url.com"
                            {...field}
                            className="bg-gray-800 border-gray-700"
                          />
                        </FormControl>
                        <FormDescription className="text-gray-400">
                          l'URL ou l'agent envoi son demande.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="response_format"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Format de Réponse</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-gray-800 border-gray-700">
                              <SelectValue placeholder="Select a format" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="text">Plain Text</SelectItem>
                            <SelectItem value="html">HTML</SelectItem>
                            <SelectItem value="markdown">Markdown</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-gray-400">
                          le format que l'agent envoi.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-700 p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active</FormLabel>
                          <FormDescription className="text-gray-400">Activer ou désactiver l'agent.</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value === "active"}
                            onCheckedChange={(checked) => field.onChange(checked ? "active" : "inactive")}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={testAgent}
                      className="mr-2"
                      disabled={isTestingWebhook}
                    >
                      {isTestingWebhook ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        "Tester Webhook"
                      )}
                    </Button>

                    {testResult && (
                      <div
                        className={`mt-2 rounded-md p-2 text-sm ${testResult.success ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"
                          }`}
                      >
                        {testResult.message}
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false)
                        setEditingAgent(null)
                        setTestResult(null)
                      }}
                      className="bg-gray-800 border-gray-700 hover:bg-gray-700"
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
                    >
                      {editingAgent ? "Mettre à jour Agent" : "Créer Agent"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="animate-pulse bg-gray-900 border-gray-800">
                <CardHeader className="h-24 bg-gray-800" />
                <CardContent className="h-32" />
                <CardFooter className="h-12" />
              </Card>
            ))
          ) : agents.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-700 p-12 text-center">
              <Server className="mb-4 h-12 w-12 text-gray-500" />
              <h3 className="mb-2 text-lg font-medium text-white">Pas d'Agents Configurer</h3>
              <p className="mb-4 text-sm text-gray-400">
                Vous n'avez pas créer des agents IA. Commençons par créer votre premier agentt.
              </p>
              <Button
                onClick={() => {
                  setEditingAgent(null)
                  setIsDialogOpen(true)
                }}
                className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
              >
                <Plus className="mr-2 h-4 w-4" /> Ajouter Agent
              </Button>
            </div>
          ) : (
            agents.map((agent) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="overflow-hidden bg-gray-900 border-gray-800">
                  <CardHeader className="relative bg-gradient-to-r from-blue-500/10 to-green-500/10 pb-2">
                    <div className="absolute right-4 top-4 flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditingAgent(agent)
                          setIsDialogOpen(true)
                        }}
                        className="hover:bg-gray-800"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(agent.id)}
                        className="hover:bg-gray-800"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-green-500 text-white">
                        <Activity className="h-4 w-4" />
                      </div>
                      {agent.name}
                    </CardTitle>
                    <div className="mt-1 flex items-center">
                      <span
                        className={`mr-2 inline-flex h-2 w-2 rounded-full ${agent.status === "active" ? "bg-green-500" : "bg-gray-400"
                          }`}
                      ></span>
                      <CardDescription className="text-gray-400">
                        {agent.status === "active" ? "Active" : "Inactive"}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="mb-2 text-sm text-gray-300">{agent.description || "No description provided."}</p>
                    <div className="mt-4 text-xs text-gray-400">
                      <div className="flex items-center justify-between">
                        <span>Format:</span>
                        <span className="font-medium">
                          {agent.response_format
                            ? agent.response_format.charAt(0).toUpperCase() + agent.response_format.slice(1)
                            : "Text"}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span>Créer:</span>
                        <span className="font-medium">
                          {agent.created_at ? new Date(agent.created_at).toLocaleDateString() : "Unknown"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t border-gray-800 bg-gray-800">
                    <div className="flex w-full items-center justify-between text-xs">
                      <span className="text-gray-400">Webhook URL:</span>
                      <span className="max-w-[180px] truncate font-mono text-gray-300">{agent.webhook_url}</span>
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </ModernLayout>
  )
}
