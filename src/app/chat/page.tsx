'use client'
import { useState } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'
import { useUsers } from '../hooks/useUsers'
import ChatLayout from '../components/chatComponents/ChatLayout'


export default function ChatPage() {
  const { user } = useUser()
  const { users, loading } = useUsers()
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to use chat</p>
          <a href="/sign-in" className="text-blue-500 hover:underline">Sign In</a>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Chat App</h1>
        <UserButton afterSignOutUrl="/sign-in" />
      </header>
      
      <div className="flex-1 overflow-hidden">
        <ChatLayout
          currentUserId={user.id}
          users={users}
          selectedUserId={selectedUserId}
          onSelectUser={setSelectedUserId}
        />
      </div>
    </div>
  )
}