import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import Button from './Button'

interface Message {
  id: string
  message: string
  is_admin: boolean
  created_at: string
  read_by_user: boolean
}

export default function SupportChat() {
  const { user } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      loadMessages()
      markMessagesAsRead()
      
      // Subscribe to new messages
      const channel = supabase
        .channel('support_messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'support_messages',
            filter: `user_id=eq.${user?.id}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as Message])
            scrollToBottom()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [isOpen, user?.id])

  useEffect(() => {
    // Check for unread messages periodically
    const checkUnread = async () => {
      const { count } = await supabase
        .from('support_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('is_admin', true)
        .eq('read_by_user', false)

      setUnreadCount(count || 0)
    }

    checkUnread()
    const interval = setInterval(checkUnread, 30000) // Check every 30s

    return () => clearInterval(interval)
  }, [user?.id])

  const loadMessages = async () => {
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: true })

    if (data) setMessages(data)
    scrollToBottom()
  }

  const markMessagesAsRead = async () => {
    await supabase
      .from('support_messages')
      .update({ read_by_user: true })
      .eq('user_id', user!.id)
      .eq('is_admin', true)
      .eq('read_by_user', false)

    setUnreadCount(0)
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('support_messages')
        .insert({
          user_id: user!.id,
          message: newMessage.trim(),
          is_admin: false,
        })

      if (error) throw error

      setNewMessage('')
      loadMessages()
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  return (
    <>
      {/* Chat Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 dark:from-primary-500 dark:to-primary-600 rounded-full shadow-2xl flex items-center justify-center z-40"
      >
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M14 2C7.4 2 2 6.9 2 13c0 2.4.9 4.6 2.4 6.3L2 26l7.1-2.3c1.5.7 3.2 1.1 4.9 1.1 6.6 0 12-4.9 12-11S20.6 2 14 2z" stroke="white" strokeWidth="2.5" strokeLinejoin="round"/>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 dark:bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-96 h-[500px] bg-white dark:bg-gray-800 rounded-3xl shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-500 dark:to-primary-600 p-5 rounded-t-3xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 dark:bg-white/10 rounded-full flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 2C5.6 2 2 5.1 2 9c0 1.5.6 2.9 1.6 4L2 17l4.4-1.4c1 .4 2.1.7 3.2.7 4.4 0 8-3.1 8-7s-3.6-7-8-7z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-white">Support Chat</h3>
                  <p className="text-xs text-white/80 dark:text-white/70">We typically reply in minutes</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/20 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M5 5l10 10M15 5l-10 10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <path d="M16 4C9.4 4 4 8.9 4 15c0 2.4.9 4.6 2.4 6.3L4 28l7.1-2.3c1.5.7 3.2 1.1 4.9 1.1 6.6 0 12-4.9 12-11S22.6 4 16 4z" stroke="#9ca3af" strokeWidth="2.5" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 font-medium">No messages yet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Start a conversation with our support team</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.is_admin ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                        msg.is_admin
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                          : 'bg-primary-600 dark:bg-primary-500 text-white'
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-xs mt-1 ${msg.is_admin ? 'text-gray-500 dark:text-gray-400' : 'text-white/70'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t-2 border-gray-100 dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1 px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-primary-600 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900 outline-none transition-all"
                />
                <Button
                  onClick={sendMessage}
                  loading={loading}
                  disabled={!newMessage.trim()}
                  size="sm"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M16 2L8 10M16 2l-6 14-2-6-6-2 14-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
