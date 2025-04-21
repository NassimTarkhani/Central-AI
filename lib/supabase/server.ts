import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export const createClient = () => {
  const cookieStore = cookies()

  return createServerClient(
    "https://mokzyuoaizeeorohilxc.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1va3p5dW9haXplZW9yb2hpbHhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMTE2NTIsImV4cCI6MjA1OTY4NzY1Mn0.bp2LC8mrNd312KIrUh_YB8MzYfBptnpcXvyfFucJ_cQ",
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name, options) {
          cookieStore.set({ name, value: "", ...options })
        },
      },
    },
  )
}
