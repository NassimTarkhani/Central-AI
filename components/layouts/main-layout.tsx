"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, Settings, User, Menu, X, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useMobile } from "@/hooks/use-mobile"
import Logo from "@/components/logo"

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  const pathname = usePathname()
  const supabase = createClient()
  const { toast } = useToast()
  const isMobile = useMobile()

  useEffect(() => {
    fetchUserData()
  }, [])

  useEffect(() => {
    // Close sidebar on mobile when route changes
    if (isMobile) {
      setIsSidebarOpen(false)
    }
  }, [pathname, isMobile])

  // Modify the MainLayout component to work without authentication
  // Update the fetchUserData method
  const fetchUserData = async () => {
    try {
      // Set default guest user
      setUser({
        email: "guest@example.com",
      })

      setProfile({
        username: "Guest User",
      })
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  // Update the handleLogout method to just refresh the page
  const handleLogout = async () => {
    try {
      window.location.reload()
    } catch (error) {
      console.error("Error signing out:", error)
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      })
    }
  }

  const navItems = [
    {
      name: "Conversation",
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
      href: "/",
      icon: <User className="h-5 w-5" />,
    },
  ]

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-950">
      {/* Sidebar for desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r bg-white transition-all dark:border-gray-800 dark:bg-gray-900 md:flex ${isSidebarOpen ? "translate-x-0" : ""
          }`}
      >
        <div className="flex h-16 items-center border-b px-6 dark:border-gray-800">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors ${pathname === item.href
                ? "bg-gradient-to-r from-blue-500/10 to-green-500/10 text-blue-600 dark:text-blue-400"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
            >
              {item.icon}
              <span className="ml-3">{item.name}</span>
            </Link>
          ))}
        </nav>
        <div className="border-t p-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-green-500 text-white">
              {profile?.username?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium">{profile?.username || "User"}</p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.email || ""}</p>
            </div>
          </div>
          <Button variant="outline" className="mt-4 w-full justify-start" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isSidebarOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSidebarOpen && isMobile && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed inset-y-0 left-0 z-50 w-64 flex-col border-r bg-white dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex h-16 items-center justify-between border-b px-6 dark:border-gray-800">
              <Link href="/" className="flex items-center gap-2">
                <Logo className="h-8 w-8" />
                <span className="font-bold">AI Agents Central</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 space-y-1 p-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors ${pathname === item.href
                    ? "bg-gradient-to-r from-blue-500/10 to-green-500/10 text-blue-600 dark:text-blue-400"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </Link>
              ))}
            </nav>
            <div className="border-t p-4 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-green-500 text-white">
                  {profile?.username?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 truncate">
                  <p className="text-sm font-medium">{profile?.username || "User"}</p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.email || ""}</p>
                </div>
              </div>
              <Button variant="outline" className="mt-4 w-full justify-start" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex flex-1 flex-col md:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-white px-4 dark:border-gray-800 dark:bg-gray-900 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="mr-2">
            <Menu className="h-6 w-6" />
          </Button>
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="font-bold"></span>
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1">{children}</main>
      </div>

      {/* Mobile navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t bg-white dark:border-gray-800 dark:bg-gray-900 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center py-2 text-xs ${pathname === item.href ? "text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"
                }`}
            >
              {item.icon}
              <span className="mt-1">{item.name}</span>
            </Link>
          ))}
        </nav>
      )}

      {/* Background animations */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="animate-pulse-slow absolute -left-1/4 top-1/4 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl dark:bg-blue-500/10"></div>
        <div className="animate-pulse-slow absolute -right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-green-500/5 blur-3xl dark:bg-green-500/10"></div>
      </div>
    </div>
  )
}
