export interface Message {
  id: string
  conversation_id: string
  sender_type: "user" | "agent"
  content: string
  content_type: "text" | "html" | "markdown"
  timestamp: string
  read_status: "read" | "unread"
}

export interface Agent {
  id: string
  name: string
  description?: string
  webhook_url: string
  status?: "active" | "inactive"
  response_format?: "text" | "html" | "markdown"
  configuration?: Record<string, any>
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface Conversation {
  id: string
  user_id: string
  agent_id: string
  started_at: string
  last_message_at: string
  title: string
  is_archived: boolean
}

export interface User {
  id: string
  email: string
  username?: string
  avatar_url?: string
  created_at: string
  last_login?: string
  email_notifications?: boolean
}
