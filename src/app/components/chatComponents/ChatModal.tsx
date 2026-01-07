'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import ChatLayout from './ChatLayout'
import { useUsers } from '@/app/hooks/useUsers'

export default function ChatModal({ onClose }: { onClose: () => void }) {
  const { user } = useUser()
  const { users, loading } = useUsers()
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  return (
    <div className="fixed inset-0 z-50 flex justify-end items-center pr-10">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      <div className="relative w-[420px] h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white shadow hover:bg-gray-100"
        >
          <X size={18} />
        </button>

        {!user || loading ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            Loading...
          </div>
        ) : (
          <ChatLayout
            currentUserId={user.id}
            users={users}
            selectedUserId={selectedUserId}
            onSelectUser={setSelectedUserId}
          />
        )}
      </div>
    </div>
  )
}
