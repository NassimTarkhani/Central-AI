import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = "https://mokzyuoaizeeorohilxc.supabase.co"
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1va3p5dW9haXplZW9yb2hpbHhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMTE2NTIsImV4cCI6MjA1OTY4NzY1Mn0.bp2LC8mrNd312KIrUh_YB8MzYfBptnpcXvyfFucJ_cQ"

export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseKey)
}
