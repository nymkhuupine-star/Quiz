import { supabase } from './supabase'

export const chatService = {
  // Get all users except current user
  async getAllUsers(currentUserId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .neq('id', currentUserId)
      .order('username')
    
    return { data, error }
  },

  // Get or create conversation between two users
  async getOrCreateConversation(user1Id: string, user2Id: string) {
    const { data, error } = await supabase
      .rpc('get_or_create_conversation', {
        p_user1_id: user1Id,
        p_user2_id: user2Id
      })
    
    return { conversationId: data, error }
  },

  // Get messages for a conversation
  async getMessages(conversationId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    
    return { data, error }
  },

  // Send a message
  async sendMessage(conversationId: string, senderId: string, receiverId: string, content: string) {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        receiver_id: receiverId,
        content
      })
      .select()
      .single()

    // Update conversation's last message
    if (!error) {
      await supabase
        .from('conversations')
        .update({
          last_message: content,
          last_message_at: new Date().toISOString()
        })
        .eq('id', conversationId)
    }
    
    return { data, error }
  },

  // Subscribe to new messages
  subscribeToMessages(conversationId: string, callback: (message: any) => void) {
    return supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => callback(payload.new)
      )
      .subscribe()
  }
}