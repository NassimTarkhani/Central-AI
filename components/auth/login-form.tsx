"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import Logo from "@/components/logo"

const formSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
})

export default function SignIn() {
    const [isLoading, setIsLoading] = useState(false)
    //const { signIn } = useState(true)
    const router = useRouter()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            setIsLoading(true)
            await SignIn(values.email, values.password)
            router.push("/")
        } catch (error) {
            console.error("Sign in error:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 p-4">
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="animate-pulse-slow absolute -left-1/4 top-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl"></div>
                <div className="animate-pulse-slow absolute -right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-green-500/10 blur-3xl"></div>
            </div>

            <div className="mb-8 flex items-center gap-2">
                <Logo className="h-10 w-10" />
                <h1 className="text-2xl font-bold text-white">AI Agents Central</h1>
            </div>

            <Card className="w-full max-w-md border-gray-800 bg-gray-900 text-white">
                <CardHeader>
                    <CardTitle className="text-xl">Sign In</CardTitle>
                    <CardDescription className="text-gray-400">Enter your credentials to access your account</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="your.email@example.com"
                                                type="email"
                                                autoComplete="email"
                                                disabled={isLoading}
                                                className="bg-gray-800 border-gray-700"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="••••••••"
                                                type="password"
                                                autoComplete="current-password"
                                                disabled={isLoading}
                                                className="bg-gray-800 border-gray-700"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
                            >
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Sign In
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <div className="text-center text-sm text-gray-400">
                        Don&apos;t have an account?{" "}
                        <Link href="/signup" className="text-blue-400 hover:underline">
                            Sign up
                        </Link>
                    </div>
                    <div className="text-center text-xs text-gray-500">
                        By signing in, you agree to our Terms of Service and Privacy Policy.
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
