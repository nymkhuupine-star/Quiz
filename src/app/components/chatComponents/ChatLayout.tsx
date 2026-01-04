'use client'
import { useState, useEffect } from 'react'
import { Send, Search, Smile, Image, Heart, ArrowLeft } from 'lucide-react'
import { User } from '@/lib/supabase'
import { useChat } from '@/app/hooks/useChat'
import { supabase } from '@/lib/supabase'

interface Props {
  currentUserId: string
  users: User[]
  selectedUserId: string | null
  onSelectUser: (userId: string | null) => void
}

export default function ChatLayout({
  currentUserId,
  users: propUsers,
  selectedUserId,
  onSelectUser
}: Props) {
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [allUsers, setAllUsers] = useState<User[]>(propUsers)
  const { messages, sendMessage, loading, currentUserSupabaseId } =
    useChat(selectedUserId)

  useEffect(() => {
    const fetchAllUsers = async () => {
      const { data } = await supabase
        .from('users')
        .select('*')
        .order('username', { ascending: true })

      if (data) {
        setAllUsers(data.filter(u => u.id !== currentUserId))
      }
    }

    fetchAllUsers()
  }, [currentUserId])

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      sendMessage(messageInput)
      setMessageInput('')
    }
  }

  const filteredUsers = allUsers.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedUser = allUsers.find(u => u.id === selectedUserId)

  return (
    <div className="flex h-full w-full bg-[#f0f2f5]">
      {/* USERS */}
      <div
        className={`${
          selectedUserId ? 'hidden' : 'flex'
        } w-full flex-col bg-white border-r`}
      >
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full pl-9 pr-3 py-2 rounded-full bg-gray-100 text-sm outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredUsers.map(user => (
            <div
              key={user.id}
              onClick={() => onSelectUser(user.id)}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-100"
            >
              <img
                src={
                  user.avatar_url ||
                  `https://ui-avatars.com/api/?name=${user.username}`
                }
                className="w-12 h-12 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user.username}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CHAT */}
      {selectedUser && (
        <div className="flex flex-col flex-1 bg-[#efeae2]">
          {/* HEADER */}
          <div className="flex items-center gap-3 px-4 py-3 bg-white border-b">
            <button
              onClick={() => onSelectUser(null)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft size={20} />
            </button>

            <img
              src={
                selectedUser.avatar_url ||
                `https://ui-avatars.com/api/?name=${selectedUser.username}`
              }
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="font-medium">{selectedUser.username}</p>
              <p className="text-xs text-gray-500">{selectedUser.email}</p>
            </div>
          </div>

          {/* MESSAGES */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
            {loading && (
              <p className="text-center text-sm text-gray-500">Loading...</p>
            )}

            {messages.map(message => {
              const mine = message.sender_id === currentUserSupabaseId
              return (
                <div
                  key={message.id}
                  className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm shadow
                      ${mine ? 'bg-[#d9fdd3]' : 'bg-white'}`}
                  >
                    {message.content}
                    <div className="text-[10px] text-gray-500 text-right mt-1">
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* INPUT */}
          <div className="p-3 bg-white border-t flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Image size={20} />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Smile size={20} />
            </button>

            <input
              value={messageInput}
              onChange={e => setMessageInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message"
              className="flex-1 px-4 py-2 rounded-full bg-gray-100 outline-none"
            />

            <button
              onClick={handleSendMessage}
              className="p-2 bg-green-500 hover:bg-green-600 rounded-full"
            >
              {messageInput.trim() ? (
                <Send className="w-5 h-5 text-white" />
              ) : (
                <Heart className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
