"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { MessageSquare, Settings, User, Menu, Plus, MessageCircle, ChevronRight, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useMobile } from "@/hooks/use-mobile"
import { useConversations } from "@/hooks/use-conversations"
import Logo from "@/components/logo"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Image from "next/image"

interface ModernLayoutProps {
  children: React.ReactNode
  showConversations?: boolean
}

export default function ModernLayout({ children, showConversations = false }: ModernLayoutProps) {
  const [profile, setProfile] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const isMobile = useMobile()
  const { conversations, deleteConversation } = useConversations()

  // Close sidebar on mobile by default
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    } else {
      setSidebarOpen(true)
    }
  }, [isMobile])

  // Fetch user data on mount
  useEffect(() => {
    // Only set user data if not already set
    if (!user || !profile) {
      setUser({
        email: "guest@example.com",
      })

      setProfile({
        username: "Guest User",
      })

      setIsLoading(false)
    }
  }, [user, profile]) // Only run when user or profile changes

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return date.toLocaleDateString()
  }

  const navItems = [
    {
      name: "Conversations",
      href: "/",
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      name: "Configuration",
      href: "/config",
      icon: <Settings className="h-5 w-5" />,
    },
    {
      name: "Profile",
      href: "/e",
      icon: <User className="h-5 w-5" />,
    },
  ]

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleDeleteConversation = async (e: React.MouseEvent, conversationId: string) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      await deleteConversation(conversationId)
      toast({
        title: "Conversation deleted",
        description: "The conversation has been deleted successfully",
      })

      // If we're currently viewing this conversation, redirect to home
      if (pathname === `/?conversation=${conversationId}`) {
        router.push("/")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Top navigation bar */}
      <header className="fixed top-0 z-40 flex h-16 w-full items-center justify-between border-b bg-gray-900 px-4 md:px-6">
        <div className="flex items-center">
          {showConversations && (
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-2">
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/white.png"
              width={125}
              height={82}
              alt=""
            />
          </Link>
        </div>

        <div className="hidden md:flex md:items-center md:gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${pathname === item.href ? "bg-blue-500/20 text-blue-400" : "text-gray-300 hover:bg-gray-800"
                }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 hid">
            <div className="  flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-green-500 text-white">
              {profile?.username?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "G"}
            </div>
            <div className="hidden flex-col sm:flex ">
              <span className="text-sm font-medium text-white hidden ">{profile?.username || "Guest User"}</span>
              <span className="text-xs text-gray-400 hidden ">{user?.email || "guest@example.com"}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content with optional sidebar */}
      <div className="mt-16 flex flex-1 overflow-hidden">
        {/* Conversations sidebar - only shown when showConversations is true */}
        {showConversations && (
          <>
            {/* Sidebar overlay for mobile */}
            {isMobile && sidebarOpen && (
              <div className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside
              className={cn(
                "fixed inset-y-0 left-0 z-30 mt-16 w-72 transform border-r border-gray-800 bg-gray-900 transition-transform duration-200 ease-in-out",
                sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-16",
              )}
            >
              {/* New Conversation Button */}
              <div className="p-3">
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start bg-gradient-to-r from-blue-500/10 to-green-500/10 hover:from-blue-500/20 hover:to-green-500/20",
                    !sidebarOpen && "md:justify-center md:px-0",
                  )}
                  onClick={() => {
                    router.push("/?new=true")
                  }}
                >
                  <Plus className={cn("h-4 w-4", sidebarOpen ? "mr-2" : "")} />
                  {sidebarOpen && <span>New Conversation</span>}
                </Button>
              </div>

              {/* Recent Conversations Header */}
              <div className="px-3 py-2">
                <h3 className={cn("text-sm font-medium text-gray-400", !sidebarOpen && "md:text-center")}>
                  {sidebarOpen ? "Recent Conversations" : "Recent"}
                </h3>
              </div>

              {/* Conversations List */}
              <div className="no-scrollbar h-[calc(100vh-180px)] overflow-y-auto">
                {isLoading ? (
                  // Loading skeletons
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={`loading-${index}`} className="animate-pulse p-3">
                      <div className="h-4 w-3/4 rounded bg-gray-700 mb-2"></div>
                      <div className="h-3 w-1/2 rounded bg-gray-700"></div>
                    </div>
                  ))
                ) : conversations.length === 0 ? (
                  // No conversations message
                  <div className="p-4 text-center text-sm text-gray-500">
                    {isLoading
                      ? "Loading conversations..."
                      : sidebarOpen
                        ? "No conversations yet. Start a new conversation."
                        : "No chats"}
                  </div>
                ) : (
                  // Conversations list
                  conversations.map((conv) => (
                    <div key={conv.id} className="relative group">
                      <Link
                        href={`/?conversation=${conv.id}`}
                        className={cn(
                          "flex items-center px-3 py-2 my-1 mx-2 rounded-md transition-colors",
                          pathname === `/?conversation=${conv.id}`
                            ? "bg-gradient-to-r from-blue-500/20 to-green-500/20 text-white"
                            : "text-gray-300 hover:bg-gray-800",
                        )}
                      >
                        <MessageCircle className="h-5 w-5 flex-shrink-0" />

                        {sidebarOpen && (
                          <div className="ml-3 flex-1 overflow-hidden">
                            <div className="truncate font-medium">{conv.title || "New Conversation"}</div>
                            <div className="flex justify-between items-center w-full">
                              <span className="text-xs text-gray-500 truncate max-w-[100px]">
                                {conv.agent_id === "seo-agent"
                                  ? "SEO Content Agent"
                                  : conv.agent_id === "linkedin-agent"
                                    ? "LinkedIn Post Agent"
                                    : "AI Agent"}
                              </span>
                              <span className="text-xs text-gray-500">{formatRelativeTime(conv.last_message_at)}</span>
                            </div>
                          </div>
                        )}
                      </Link>

                      {/* Delete button - visible on hover or when sidebar is collapsed */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "absolute right-6 top-1/3 pb-1 -translate-y-1/2 opacity-0 transition-opacity",
                                "group-hover:opacity-100",
                                !sidebarOpen && "md:opacity-100 md:right-1",
                                pathname === `/?conversation=${conv.id}` && "opacity-100",
                              )}
                              onClick={(e) => handleDeleteConversation(e, conv.id)}
                            >
                              <Trash2 className="h-3 w-3 m  text-gray-400 hover:text-red-400" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Delete conversation</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ))
                )}
              </div>

              {/* User Profile */}
              <div className="absolute bottom-0 left-0 right-0 border-t border-gray-800 p-3">
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-lg bg-gray-800 p-2",
                    !sidebarOpen && "md:justify-center",
                  )}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-green-500 text-white">
                    {profile?.username?.charAt(0)?.toUpperCase() || "G"}
                  </div>
                  {sidebarOpen && (
                    <div className="flex-1 truncate hidden">
                      <p className="text-sm font-medium truncate text-white hidden">{profile?.username || "Guest User"}</p>
                      <p className="text-xs text-gray-400 truncate hidden">{user?.email || "guest@example.com"}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Toggle button for desktop */}
              <button
                className="absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 transform items-center justify-center rounded-full border border-gray-800 bg-gray-900 text-gray-400 hover:text-white md:flex"
                onClick={toggleSidebar}
              >
                <ChevronRight className={cn("h-4 w-4 transition-transform", !sidebarOpen && "rotate-180")} />
              </button>
            </aside>

            {/* Main content */}
            <div className={cn("flex-1 overflow-auto", sidebarOpen ? "md:ml-72" : "md:ml-16")}>{children}</div>
          </>
        )}

        {/* Content without sidebar */}
        {!showConversations && <div className="flex-1 overflow-auto">{children}</div>}
      </div>

      {/* Mobile navigation */}
      <div className="md:hidden">
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-gray-800 bg-gray-900">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center py-2 text-xs ${pathname === item.href ? "text-blue-400" : "text-gray-400"
                }`}
            >
              {item.icon}
              <span className="mt-1">{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Background animations */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden opacity-30">
        <div className="animate-pulse-slow absolute -left-1/4 top-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl"></div>
        <div className="animate-pulse-slow absolute -right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-green-500/10 blur-3xl"></div>
      </div>
    </div>
  )
}
