"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Github, Mail } from "lucide-react"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function RegisterForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [username, setUsername] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const passwordStrength = (password: string) => {
    if (!password) return 0

    let score = 0

    // Length check
    if (password.length >= 8) score += 1
    if (password.length >= 12) score += 1

    // Complexity checks
    if (/[A-Z]/.test(password)) score += 1
    if (/[a-z]/.test(password)) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1

    return Math.min(score, 5)
  }

  const getPasswordStrengthText = (strength: number) => {
    if (strength === 0) return "Very Weak"
    if (strength === 1) return "Weak"
    if (strength === 2) return "Fair"
    if (strength === 3) return "Good"
    if (strength === 4) return "Strong"
    return "Very Strong"
  }

  const getPasswordStrengthColor = (strength: number) => {
    if (strength === 0) return "bg-red-500"
    if (strength === 1) return "bg-red-400"
    if (strength === 2) return "bg-yellow-500"
    if (strength === 3) return "bg-yellow-400"
    if (strength === 4) return "bg-green-500"
    return "bg-green-400"
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password || !confirmPassword || !username) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      })
      return
    }

    if (passwordStrength(password) < 3) {
      toast({
        title: "Error",
        description: "Please use a stronger password.",
        variant: "destructive",
      })
      return
    }

    if (!acceptTerms) {
      toast({
        title: "Error",
        description: "You must accept the terms of service.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      })

      if (error) throw error

      if (data.user) {
        // Create user profile in the database
        const { error: profileError } = await supabase.from("users").insert({
          id: data.user.id,
          email: data.user.email,
          username,
          created_at: new Date().toISOString(),
        })

        if (profileError) throw profileError
      }

      toast({
        title: "Success",
        description: "Registration successful. Please check your email to verify your account.",
      })

      router.push("/auth?tab=login")
    } catch (error) {
      console.error("Registration error:", error)
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthRegister = async (provider: "github" | "google") => {
    try {
      setIsLoading(true)

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
    } catch (error) {
      console.error("OAuth registration error:", error)
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const strength = passwordStrength(password)

  return (
    <form onSubmit={handleRegister} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="your.email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          type="text"
          placeholder="johndoe"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {password && (
          <div className="mt-2 space-y-1">
            <div className="flex h-1 items-center gap-1">
              {[0, 1, 2, 3, 4].map((index) => (
                <div
                  key={index}
                  className={cn(
                    "h-full flex-1 rounded-full",
                    index < strength ? getPasswordStrengthColor(strength) : "bg-gray-200 dark:bg-gray-700",
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Password strength: {getPasswordStrengthText(strength)}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isLoading}
          required
        />
        {password && confirmPassword && password !== confirmPassword && (
          <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="terms" checked={acceptTerms} onCheckedChange={(checked) => setAcceptTerms(checked === true)} />
        <Label htmlFor="terms" className="text-sm font-normal">
          I accept the{" "}
          <a href="/terms" className="text-blue-500 hover:underline dark:text-blue-400">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-blue-500 hover:underline dark:text-blue-400">
            Privacy Policy
          </a>
        </Label>
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
        disabled={isLoading}
      >
        {isLoading ? "Creating account..." : "Create account"}
      </Button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500 dark:bg-gray-900 dark:text-gray-400">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button type="button" variant="outline" onClick={() => handleOAuthRegister("github")} disabled={isLoading}>
          <Github className="mr-2 h-4 w-4" />
          GitHub
        </Button>
        <Button type="button" variant="outline" onClick={() => handleOAuthRegister("google")} disabled={isLoading}>
          <Mail className="mr-2 h-4 w-4" />
          Google
        </Button>
      </div>
    </form>
  )
}
