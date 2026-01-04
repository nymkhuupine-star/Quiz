// src/hooks/useChat.ts
'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
}

export function useChat(recipientUserId: string | null) {
  const { user } = useUser()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserSupabaseId, setCurrentUserSupabaseId] = useState<string | null>(null)

  useEffect(() => {
    if (!recipientUserId || !user) {
      setMessages([])
      setLoading(false)
      return
    }

    const initChat = async () => {
      setLoading(true)
      
      try {
        // 1. Clerk ID → Supabase ID хөрвүүлэх
        const { data: currentUserData } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_id', user.id)
          .single()

        if (!currentUserData) {
          console.error('Current user not found in database')
          setLoading(false)
          return
        }

        setCurrentUserSupabaseId(currentUserData.id)

        // 2. Хоёр хэрэглэгчийн хооронд солилцсон мессежүүдийг татах
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${currentUserData.id},receiver_id.eq.${recipientUserId}),and(sender_id.eq.${recipientUserId},receiver_id.eq.${currentUserData.id})`)
          .order('created_at', { ascending: true })

        if (error) {
          console.error('Error fetching messages:', error)
        } else if (data) {
          setMessages(data)
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    initChat()

    // 3. Real-time subscription
    const channel = supabase
      .channel(`chat-${user.id}-${recipientUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMessage = payload.new as Message
          
          // Зөвхөн энэ conversation-д хамаарах мессеж бол нэмэх
          if (
            (newMessage.sender_id === currentUserSupabaseId && newMessage.receiver_id === recipientUserId) ||
            (newMessage.sender_id === recipientUserId && newMessage.receiver_id === currentUserSupabaseId)
          ) {
            setMessages((current) => [...current, newMessage])
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [recipientUserId, user])

  const sendMessage = async (content: string) => {
    if (!user || !recipientUserId || !content.trim()) return

    try {
      // Clerk ID → Supabase ID
      const { data: currentUserData } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user.id)
        .single()

      if (!currentUserData) {
        console.error('User not found in database')
        return
      }

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUserData.id,
          receiver_id: recipientUserId,
          content: content.trim()
        })

      if (error) {
        console.error('Error sending message:', error)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return { 
    messages, 
    sendMessage, 
    loading,
    currentUserSupabaseId // Export хийх - ChatLayout-д ашиглах
  }
}