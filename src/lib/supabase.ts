import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type User = {
  id: string
  email: string
  username: string
  avatar_url: string | null
  created_at: string
}

export type Message = {
  id: string
  conversation_id: string
  sender_id: string
  receiver_id: string
  content: string
  read: boolean
  created_at: string
}

export type Conversation = {
  id: string
  user1_id: string
  user2_id: string
  last_message: string | null
  last_message_at: string | null
  created_at: string
}