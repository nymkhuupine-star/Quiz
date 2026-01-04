'use client'
import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { chatService } from '@/lib/chatService'
import { User } from '@/lib/supabase'

export function useUsers() {
  const { user } = useUser()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchUsers = async () => {
      const { data } = await chatService.getAllUsers(user.id)
      setUsers(data || [])
      setLoading(false)
    }

    fetchUsers()
  }, [user])

  return { users, loading }
}