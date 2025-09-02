"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const initializeGoogleAuth = () => {
      if (typeof window !== "undefined" && window.google) {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
          callback: handleGoogleCallback,
          use_fedcm_for_prompt: true,
        })

        window.google.accounts.id.renderButton(document.getElementById("google-signin-button"), {
          theme: "outline",
          size: "large",
          width: "100%",
          text: "signin_with",
        })
      }
    }

    // Wait for Google script to load
    const checkGoogleLoaded = () => {
      if (window.google) {
        initializeGoogleAuth()
      } else {
        setTimeout(checkGoogleLoaded, 100)
      }
    }

    checkGoogleLoaded()
  }, [])

  const handleGoogleCallback = async (response: any) => {
    setIsGoogleLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: response.credential,
      })

      if (error) throw error
      router.push("/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Google sign-in failed")
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push("/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 animate-in fade-in duration-300">
      <div className="w-full max-w-sm">
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-semibold">Welcome Back</CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in to your AI Study Platform account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div
                id="google-signin-button"
                className={`w-full ${isGoogleLoading ? "opacity-50 pointer-events-none" : ""}`}
              />
              {isGoogleLoading && (
                <p className="text-sm text-center text-muted-foreground">Signing in with Google...</p>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="transition-colors"
                />
              </div>
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>
              )}
              <Button
                type="submit"
                className="w-full transition-all duration-200"
                disabled={isLoading || isGoogleLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/auth/sign-up" className="font-medium text-primary hover:underline transition-colors">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
