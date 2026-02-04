import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import Button from './Button'
import Input from './Input'

interface Message {
  id: string
  user_id: string
  message: string
  is_admin: boolean
  read_by_admin: boolean
  created_at: string
  user?: {
    display_name: string
    email: string
  }
}

interface Conversation {
  user_id: string
  user_name: string
  user_email: string
  last_message: string
  last_message_time: string
  unread_count: number
}

export default function AdminSupportChat() {
  const { user } = useAuthStore()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    loadConversations()
    
    // Subscribe to new messages
    const channel = supabase
      .channel('admin_messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'support_messages',
      }, () => {
        loadConversations()
        if (selectedUserId) {
          loadMessages(selectedUserId)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedUserId])

  const loadConversations = async () => {
    try {
      // Get all unique users who have sent messages
      const { data, error } = await supabase
        .from('support_messages')
        .select('user_id, message, created_at, is_admin, read_by_admin, user:users(display_name, email)')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Group by user
      const conversationMap = new Map<string, Conversation>()
      
      data?.forEach((msg: any) => {
        if (!conversationMap.has(msg.user_id)) {
          // Calculate unread count for this user
          const unreadCount = data.filter(
            (m: any) => m.user_id === msg.user_id && !m.is_admin && !m.read_by_admin
          ).length

          conversationMap.set(msg.user_id, {
            user_id: msg.user_id,
            user_name: msg.user?.display_name || 'Unknown User',
            user_email: msg.user?.email || '',
            last_message: msg.message,
            last_message_time: msg.created_at,
            unread_count: unreadCount,
          })
        }
      })

      setConversations(Array.from(conversationMap.values()))
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*, user:users(display_name, email)')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      if (error) throw error

      setMessages(data || [])

      // Mark messages as read by admin
      await supabase
        .from('support_messages')
        .update({ read_by_admin: true })
        .eq('user_id', userId)
        .eq('is_admin', false)
        .eq('read_by_admin', false)

      loadConversations() // Refresh unread counts
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUserId || !user) return

    setSending(true)
    try {
      const { error } = await supabase
        .from('support_messages')
        .insert({
          user_id: selectedUserId,
          message: newMessage.trim(),
          is_admin: true,
          read_by_user: false,
        })

      if (error) throw error

      setNewMessage('')
      loadMessages(selectedUserId)
      
      // TODO: Send email notification to customer
      // await sendAdminMessageEmail({ ... })
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  const selectConversation = (userId: string) => {
    setSelectedUserId(userId)
    loadMessages(userId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-lg overflow-hidden" style={{ height: '600px' }}>
      <div className="flex h-full">
        {/* Conversations List */}
        <div className="w-1/3 border-r-2 border-gray-100 overflow-y-auto">
          <div className="p-4 border-b-2 border-gray-100 bg-gradient-to-r from-primary-50 to-accent-50">
            <h3 className="font-display font-bold text-lg text-gray-900">Support Messages</h3>
            <p className="text-sm text-gray-600">{conversations.length} conversations</p>
          </div>

          {conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p>No messages yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {conversations.map((conv) => (
                <motion.button
                  key={conv.user_id}
                  whileHover={{ backgroundColor: '#f9fafb' }}
                  onClick={() => selectConversation(conv.user_id)}
                  className={`w-full p-4 text-left transition-colors ${
                    selectedUserId === conv.user_id ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-semibold text-gray-900">{conv.user_name}</span>
                    {conv.unread_count > 0 && (
                      <span className="bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate">{conv.last_message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(conv.last_message_time).toLocaleString()}
                  </p>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col">
          {selectedUserId ? (
            <>
              {/* Messages Header */}
              <div className="p-4 border-b-2 border-gray-100 bg-gradient-to-r from-primary-50 to-accent-50">
                <h3 className="font-display font-bold text-gray-900">
                  {conversations.find(c => c.user_id === selectedUserId)?.user_name}
                </h3>
                <p className="text-sm text-gray-600">
                  {conversations.find(c => c.user_id === selectedUserId)?.user_email}
                </p>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.is_admin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                          msg.is_admin
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-xs mt-1 ${msg.is_admin ? 'text-primary-100' : 'text-gray-500'}`}>
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Message Input */}
              <div className="p-4 border-t-2 border-gray-100">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your reply..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                  />
                  <Button onClick={sendMessage} loading={sending} disabled={!newMessage.trim()}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M2 10l16-8-8 16-2-6-6-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <svg className="w-20 h-20 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-lg font-medium">Select a conversation</p>
                <p className="text-sm">Choose a customer to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
