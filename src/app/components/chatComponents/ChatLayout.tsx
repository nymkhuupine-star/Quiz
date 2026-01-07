'use client'
import { useState, useEffect, useRef } from 'react'
import { Send, Search, Smile, Image, Heart, ArrowLeft, Bot, Sparkles } from 'lucide-react'
import { User } from '@/lib/supabase'
import { useChat } from '@/app/hooks/useChat'
import { supabase } from '@/lib/supabase'
import { useUser } from '@clerk/nextjs'

interface Props {
  currentUserId: string
  users: User[]
  selectedUserId: string | null
  onSelectUser: (userId: string | null) => void
}

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
}

interface UserWithLastMessage extends User {
  lastMessage?: Message
  lastMessageTime?: string
  isAI?: boolean
}

const AI_BOT_ID = 'ai-assistant-groq'

export default function ChatLayout({
  currentUserId,
  users: propUsers,
  selectedUserId,
  onSelectUser
}: Props) {
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [allUsers, setAllUsers] = useState<UserWithLastMessage[]>(propUsers)
  const [aiMessages, setAiMessages] = useState<Message[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, loading, currentUserSupabaseId, messagesEndRef: chatMessagesEndRef } =
    useChat(selectedUserId === AI_BOT_ID ? null : selectedUserId)

  const { user: currentClerkUser } = useUser()

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const AI_USER: UserWithLastMessage = {
    id: AI_BOT_ID,
    username: 'AI Assistant',
    email: 'Powered by GROQ',
    avatar_url: 'https://ui-avatars.com/api/?name=AI&background=8b5cf6&color=fff&bold=true',
    isAI: true,
    created_at: new Date().toISOString()
  }

  useEffect(() => {
    const savedMessages = localStorage.getItem(`ai_messages_${currentUserId}`)
    if (savedMessages) {
      try {
        setAiMessages(JSON.parse(savedMessages))
      } catch (e) {
        console.error('Failed to load AI messages:', e)
      }
    }
  }, [currentUserId])
  useEffect(() => {
    if (aiMessages.length > 0) {
      localStorage.setItem(`ai_messages_${currentUserId}`, JSON.stringify(aiMessages))
    }
  }, [aiMessages, currentUserId])

  useEffect(() => {
    const fetchUsersWithLastMessages = async () => {
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .order('username', { ascending: true })

      if (usersData) {
        const filteredUsers = usersData.filter(u => u.id !== currentUserId)

        const usersWithMessages = await Promise.all(
          filteredUsers.map(async (user) => {
            const { data: lastMessages } = await supabase
              .from('messages')
              .select('*')
              .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${currentUserId})`)
              .order('created_at', { ascending: false })
              .limit(1)

            return {
              ...user,
              lastMessage: lastMessages?.[0],
              lastMessageTime: lastMessages?.[0]?.created_at
            }
          })
        )
        const aiLastMessage = aiMessages.length > 0 ? aiMessages[aiMessages.length - 1] : undefined
        const aiUserWithMessage: UserWithLastMessage = {
          ...AI_USER,
          lastMessage: aiLastMessage,
          lastMessageTime: aiLastMessage?.created_at
        }

        const sortedUsers = [aiUserWithMessage, ...usersWithMessages].sort((a, b) => {
          if (!a.lastMessageTime) return 1
          if (!b.lastMessageTime) return -1
          return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
        })

        setAllUsers(sortedUsers)
      }
    }

    fetchUsersWithLastMessages()

    const subscription = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          fetchUsersWithLastMessages()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [currentUserId, aiMessages])
  const getAIResponse = async (userMessage: string) => {
    setAiLoading(true)
    try {
     
      const conversationHistory = aiMessages.slice(-10).map(msg => ({
        role: msg.sender_id === AI_BOT_ID ? 'assistant' : 'user',
        content: msg.content
      }))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'API алдаа гарлаа')
      }

      return data.message
    } catch (error: any) {
      console.error('AI Response Error:', error)
      return `❌ Алдаа: ${error.message || 'Backend-тэй холбогдож чадсангүй'}`
    } finally {
      setAiLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (messageInput.trim()) {
      if (selectedUserId === AI_BOT_ID) {
        const userMessage: Message = {
          id: Date.now().toString(),
          sender_id: currentUserId,
          receiver_id: AI_BOT_ID,
          content: messageInput.trim(),
          created_at: new Date().toISOString(),
        }

        setAiMessages(prev => [...prev, userMessage])
        const userInput = messageInput
        setMessageInput('')

    
        const aiResponseText = await getAIResponse(userInput)

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender_id: AI_BOT_ID,
          receiver_id: currentUserId,
          content: aiResponseText,
          created_at: new Date().toISOString(),
        }

        setAiMessages(prev => [...prev, aiMessage])
      } else {
        await sendMessage(messageInput)
        setMessageInput('')
      }
    }
  }

  const filteredUsers = allUsers.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedUser = allUsers.find(u => u.id === selectedUserId)

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString()
  }

  const currentMessages = selectedUserId === AI_BOT_ID ? aiMessages : messages

  return (
    <div className={`flex h-full w-full ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
     
      <div
        className={`${selectedUserId ? 'hidden' : 'flex'
          } w-full flex-col ${isDark ? 'bg-[#1a1a1a] border-gray-800' : 'bg-gray-50 border-gray-200'} border-r`}
      >
        <div className={`p-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Chat</h2>
          </div>
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search"
              className={`w-full pl-9 pr-3 py-2 rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-500 ${isDark
                  ? 'bg-[#2a2a2a] text-white placeholder-gray-500'
                  : 'bg-white text-gray-900 placeholder-gray-400 border border-gray-200'
                }`}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredUsers.map(user => (
            <div
              key={user.id}
              onClick={() => onSelectUser(user.id)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${user.isAI
                  ? `${isDark ? 'bg-gradient-to-r from-purple-900/20 to-transparent border-l-2 border-purple-500' : 'bg-gradient-to-r from-purple-100 to-transparent border-l-2 border-purple-400'}`
                  : `${isDark ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100'}`
                }`}
            >
              <div className="relative">
                <img
                  src={
                    user.avatar_url ||
                    `https://ui-avatars.com/api/?name=${user.username}&background=3b82f6&color=fff`
                  }
                  alt={user.username}
                  className={`w-12 h-12 rounded-full ring-2 ${isDark ? 'ring-gray-700' : 'ring-gray-200'}`}
                />
                {user.isAI && (
                  <div className="absolute -bottom-1 -right-1 bg-purple-600 rounded-full p-1">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.username}</p>
                    {user.isAI && (
                      <span className="text-[10px] bg-purple-600 text-white px-1.5 py-0.5 rounded-full">AI</span>
                    )}
                  </div>
                  {user.lastMessageTime && (
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {formatMessageTime(user.lastMessageTime)}
                    </span>
                  )}
                </div>
                <p className={`text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {user.lastMessage ? (
                    <>
                      {user.lastMessage.sender_id === currentUserId && <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>You: </span>}
                      {user.lastMessage.content}
                    </>
                  ) : (
                    user.email
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

     
      {selectedUser && (
        <div className={`flex flex-col flex-1 ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
       
          <div className={`flex items-center gap-3 px-4 py-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'
            } ${selectedUser.isAI
              ? isDark
                ? 'bg-gradient-to-r from-purple-900/30 to-transparent'
                : 'bg-gradient-to-r from-purple-50 to-transparent'
              : isDark ? 'bg-[#1a1a1a]' : 'bg-white'
            }`}>
            <button
              onClick={() => onSelectUser(null)}
              className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-[#2a2a2a] text-white' : 'hover:bg-gray-100 text-gray-900'
                }`}
            >
              <ArrowLeft size={20} />
            </button>

            <div className="relative">
              <img
                src={
                  selectedUser.avatar_url ||
                  `https://ui-avatars.com/api/?name=${selectedUser.username}&background=3b82f6&color=fff`
                }
                alt={selectedUser.username}
                className={`w-10 h-10 rounded-full ring-2 ${isDark ? 'ring-gray-700' : 'ring-gray-200'}`}
              />
              {selectedUser.isAI && (
                <div className="absolute -bottom-1 -right-1 bg-purple-600 rounded-full p-1">
                  <Bot className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedUser.username}</p>
                {selectedUser.isAI && (
                  <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">AI</span>
                )}
              </div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{selectedUser.email}</p>
            </div>
          </div>

          <div
            className="flex-1 overflow-y-auto px-4 py-6 space-y-3 relative"
            style={{
              backgroundImage: isDark
                ? 'url(/background.jpg)'
                : 'url(/background1.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            {isDark && <div className="absolute inset-0  pointer-events-none" />}

            {(loading || aiLoading) && currentMessages.length === 0 && (
              <p className={`text-center text-sm relative z-10 px-4 py-2 rounded-lg inline-block ${isDark ? 'text-gray-200 bg-black/50' : 'text-gray-600 bg-white'
                }`}>Loading...</p>
            )}

            {currentMessages.length === 0 && selectedUser.isAI && !loading && !aiLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4 relative z-10">
                <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-6 rounded-3xl mb-4">
                  <Bot className="w-12 h-12 text-white" />
                </div>
                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>GROQ AI Assistant</h3>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  Сайн уу! Би танд туслахад бэлэн байна. 🚀
                </p>
              </div>
            )}

            {currentMessages.map(message => {
              const isAIChat = selectedUserId === AI_BOT_ID
              const mine = isAIChat
                ? message.sender_id === currentUserId
                : message.sender_id === currentUserSupabaseId

              let displayAvatar = ''

              if (isAIChat) {
                displayAvatar = mine
                  ? (currentClerkUser?.imageUrl || `https://ui-avatars.com/api/?name=You&background=3b82f6&color=fff`)
                  : selectedUser.avatar_url!
              } else {
                displayAvatar = mine
                  ? (currentClerkUser?.imageUrl || `https://ui-avatars.com/api/?name=You&background=3b82f6&color=fff`)
                  : (selectedUser.avatar_url || `https://ui-avatars.com/api/?name=${selectedUser.username}&background=3b82f6&color=fff`)
              }

              return (
                <div
                  key={message.id}
                  className={`flex gap-2 ${mine ? 'justify-end' : 'justify-start'} relative z-10`}
                >
                  {!mine && (
                    <img
                      src={displayAvatar}
                      alt={selectedUser.username}
                      className={`w-8 h-8 rounded-full flex-shrink-0 ring-2 ${isDark ? 'ring-gray-700' : 'ring-gray-200'}`}
                    />
                  )}

                  <div
                    className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm shadow-lg
                      ${mine
                        ? 'bg-blue-600 text-white'
                        : selectedUser.isAI
                          ? isDark
                            ? 'bg-gradient-to-r from-purple-900/50 to-purple-800/50 text-white border border-purple-500/30'
                            : 'bg-gradient-to-r from-purple-100 to-purple-50 text-gray-900 border border-purple-200'
                          : isDark
                            ? 'bg-[#2a2a2a] text-white'
                            : 'bg-gray-200 text-gray-900'
                      }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    <div className={`text-[10px] text-right mt-1 ${mine
                        ? 'text-blue-200'
                        : isDark ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>

                  {mine && (
                    <img
                      src={displayAvatar}
                      alt="You"
                      className={`w-8 h-8 rounded-full flex-shrink-0 ring-2 ${isDark ? 'ring-gray-700' : 'ring-gray-200'}`}
                    />
                  )}
                </div>
              )
            })}

            {aiLoading && (
              <div className="flex gap-2 justify-start relative z-10">
                <img
                  src={selectedUser?.avatar_url || 'https://ui-avatars.com/api/?name=AI&background=8b5cf6&color=fff'}
                  alt={selectedUser?.username || 'AI'}
                  className={`w-8 h-8 rounded-full flex-shrink-0 ring-2 ${isDark ? 'ring-gray-700' : 'ring-gray-200'}`}
                />
                <div className={`px-4 py-3 rounded-2xl ${isDark
                    ? 'bg-gradient-to-r from-purple-900/50 to-purple-800/50 border border-purple-500/30'
                    : 'bg-gradient-to-r from-purple-100 to-purple-50 border border-purple-200'
                  }`}>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={selectedUserId === AI_BOT_ID ? messagesEndRef : chatMessagesEndRef} />
          </div>

       
          <div className={`p-3 border-t flex items-center gap-2 ${isDark ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-200'
            }`}>
            <button className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100'
              }`}>
              <Image size={20} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
            </button>
            <button className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100'
              }`}>
              <Smile size={20} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
            </button>

            <input
              value={messageInput}
              onChange={e => setMessageInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              placeholder={selectedUser.isAI ? "AI-д асуулт асуух..." : "Type a message"}
              disabled={aiLoading || loading}
              className={`flex-1 px-4 py-2 rounded-full outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${isDark
                  ? 'bg-[#2a2a2a] text-white placeholder-gray-500'
                  : 'bg-gray-100 text-gray-900 placeholder-gray-400'
                }`}
            />

            <button
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || aiLoading || loading}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors disabled:opacity-50"
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