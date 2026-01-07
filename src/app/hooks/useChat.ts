// src/hooks/useChat.ts
'use client'

import { useState, useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  isOptimistic?: boolean // 🔥 Optimistic мессеж эсэхийг ялгах
}

export function useChat(recipientUserId: string | null) {
  const { user } = useUser()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserSupabaseId, setCurrentUserSupabaseId] = useState<string | null>(null)
  
  const currentUserIdRef = useRef<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 🔥 Автоматаар доош scroll хийх
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Messages өөрчлөгдөх бүрд scroll
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!recipientUserId || !user) {
      setMessages([])
      setLoading(false)
      return
    }

    const initChat = async () => {
      setLoading(true)
      
      try {
        const { data: currentUserData } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_id', user.id)
          .single()

        if (!currentUserData) {
          console.error('❌ Current user not found in database')
          setLoading(false)
          return
        }

        setCurrentUserSupabaseId(currentUserData.id)
        currentUserIdRef.current = currentUserData.id
        
        console.log('✅ Current user ID:', currentUserData.id)

        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${currentUserData.id},receiver_id.eq.${recipientUserId}),and(sender_id.eq.${recipientUserId},receiver_id.eq.${currentUserData.id})`)
          .order('created_at', { ascending: true })

        if (error) {
          console.error('❌ Error fetching messages:', error)
        } else if (data) {
          console.log(`✅ Loaded ${data.length} messages`)
          setMessages(data)
        }
      } catch (error) {
        console.error('❌ Error:', error)
      } finally {
        setLoading(false)
      }
    }

    initChat()

    const channel = supabase
      .channel(`chat:${user.id}:${recipientUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('🔴 Real-time event:', payload.new)
          const newMessage = payload.new as Message
          
          const myId = currentUserIdRef.current
          
          if (!myId) {
            console.warn('⚠️ Current user ID хараахан байхгүй байна')
            return
          }
          
          const isMyMessage = 
            (newMessage.sender_id === myId && newMessage.receiver_id === recipientUserId) ||
            (newMessage.sender_id === recipientUserId && newMessage.receiver_id === myId)
          
          if (isMyMessage) {
            console.log('✅ Шинэ message нэмлээ:', newMessage.content)
            setMessages((current) => {
              // Давхардахаас сэргийлэх (optimistic болон real-time)
              const exists = current.some(msg => 
                msg.id === newMessage.id || 
                (msg.isOptimistic && msg.content === newMessage.content && msg.sender_id === newMessage.sender_id)
              )
              
              if (exists) {
                console.log('⚠️ Message аль хэдийн байна эсвэл optimistic')
                // 🔥 Optimistic мессежийг real мессежээр солих
                return current.map(msg => 
                  msg.isOptimistic && msg.content === newMessage.content && msg.sender_id === newMessage.sender_id
                    ? { ...newMessage, isOptimistic: false }
                    : msg
                )
              }
              
              return [...current, newMessage]
            })
          } else {
            console.log('⏭️ Өөр conversation-ий message, алгасах')
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status)
      })

    return () => {
      console.log('🔴 Realtime subscription цуцаллаа')
      supabase.removeChannel(channel)
    }
  }, [recipientUserId, user])

  const sendMessage = async (content: string) => {
    if (!user || !recipientUserId || !content.trim()) return

    try {
      // 🔥 senderId-г баталгаатай авах
      let senderId = currentUserSupabaseId || currentUserIdRef.current
      
      if (!senderId) {
        const { data: currentUserData } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_id', user.id)
          .single()

        if (!currentUserData) {
          console.error('❌ User not found in database')
          return
        }
        senderId = currentUserData.id
        setCurrentUserSupabaseId(senderId)
        currentUserIdRef.current = senderId
      }

      // 🔥 Type safety check
      if (!senderId) {
        console.error('❌ Sender ID олдсонгүй')
        return
      }

      // 🔥 1. Эхлээд optimistic мессеж үүсгэж UI дээр харуулах
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`, // Түр ID
        sender_id: senderId,
        receiver_id: recipientUserId,
        content: content.trim(),
        created_at: new Date().toISOString(),
        isOptimistic: true // Optimistic мессеж гэдгийг тэмдэглэх
      }

      // UI дээр шууд харуулах
      setMessages(prev => [...prev, optimisticMessage])

      console.log('📤 Sending message:', content.substring(0, 50))

      // 🔥 2. Дараа нь Supabase-д хадгалах
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: senderId,
          receiver_id: recipientUserId,
          content: content.trim()
        })

      if (error) {
        console.error('❌ Error sending message:', error)
        // 🔥 Алдаа гарвал optimistic мессежийг устгах
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id))
      } else {
        console.log('✅ Message sent successfully')
        // Real-time subscription автоматаар шинэчлэнэ
      }
    } catch (error) {
      console.error('❌ Error:', error)
    }
  }

  return { 
    messages, 
    sendMessage, 
    loading,
    currentUserSupabaseId,
    messagesEndRef
  }
}