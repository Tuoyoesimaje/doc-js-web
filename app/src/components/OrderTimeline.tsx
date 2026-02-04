import { motion } from 'framer-motion'
import type { OrderStatus, OrderEvent } from '../types'

interface OrderTimelineProps {
  status: OrderStatus
  events: OrderEvent[]
}

const STATUSES: OrderStatus[] = ['received', 'processing', 'ready', 'delivered']

const STATUS_CONFIG = {
  received: { 
    label: 'Received', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M20 7L12 3L4 7M20 7L12 11M20 7V17L12 21M12 11L4 7M12 11V21M4 7V17L12 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-500',
    lightBg: 'bg-blue-50',
    ringColor: 'ring-blue-200'
  },
  processing: { 
    label: 'Processing', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="animate-spin">
        <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-500',
    lightBg: 'bg-amber-50',
    ringColor: 'ring-amber-200'
  },
  ready: { 
    label: 'Ready', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-500',
    lightBg: 'bg-purple-50',
    ringColor: 'ring-purple-200'
  },
  delivered: { 
    label: 'Delivered', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M13 16V6C13 4.89543 13.8954 4 15 4H19C20.1046 4 21 4.89543 21 6V16M13 16H3L5 8H11L13 16ZM13 16H21M21 16H23V18C23 19.1046 22.1046 20 21 20H19.5M13 16V18C13 19.1046 12.1046 20 11 20H9.5M9.5 20C9.5 21.3807 8.38071 22.5 7 22.5C5.61929 22.5 4.5 21.3807 4.5 20C4.5 18.6193 5.61929 17.5 7 17.5C8.38071 17.5 9.5 18.6193 9.5 20ZM19.5 20C19.5 21.3807 18.3807 22.5 17 22.5C15.6193 22.5 14.5 21.3807 14.5 20C14.5 18.6193 15.6193 17.5 17 17.5C18.3807 17.5 19.5 18.6193 19.5 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-500',
    lightBg: 'bg-green-50',
    ringColor: 'ring-green-200'
  },
}

export default function OrderTimeline({ status, events }: OrderTimelineProps) {
  const currentIndex = STATUSES.indexOf(status)

  return (
    <div className="relative py-8">
      {/* Confetti effect for delivered status */}
      {status === 'delivered' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: -20, x: Math.random() * 100 + '%', opacity: 1 }}
              animate={{ 
                y: 400, 
                rotate: Math.random() * 360,
                opacity: 0 
              }}
              transition={{ 
                duration: 2 + Math.random() * 2, 
                delay: Math.random() * 0.5,
                repeat: Infinity,
                repeatDelay: 3
              }}
              className="absolute w-2 h-2 rounded-full"
              style={{ 
                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'][Math.floor(Math.random() * 4)]
              }}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 relative">
        {STATUSES.map((s, index) => {
          const isCompleted = index <= currentIndex
          const isCurrent = index === currentIndex
          const event = events.find(e => e.event_type === s)
          const config = STATUS_CONFIG[s]

          return (
            <div key={s} className="relative flex flex-col items-center">
              {/* Animated Connector Line */}
              {index < STATUSES.length - 1 && (
                <div className="absolute top-8 left-1/2 w-full h-2 -z-10">
                  <div className="relative w-full h-full bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ 
                        width: index < currentIndex ? '100%' : '0%' 
                      }}
                      transition={{ 
                        duration: 1, 
                        delay: index * 0.3,
                        ease: 'easeInOut'
                      }}
                      className={`h-full bg-gradient-to-r ${config.color} rounded-full`}
                    />
                  </div>
                </div>
              )}

              {/* Animated Status Circle */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ 
                  scale: isCompleted ? [1, 1.1, 1] : 1,
                  rotate: 0
                }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.2,
                  scale: {
                    repeat: isCurrent ? Infinity : 0,
                    repeatDelay: 1,
                    duration: 1
                  }
                }}
                className="relative"
              >
                {/* Pulsing ring for current status */}
                {isCurrent && (
                  <motion.div
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 0, 0.5]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                    className={`absolute inset-0 rounded-full ${config.bgColor} opacity-30`}
                  />
                )}

                <div
                  className={`relative w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all duration-500 mb-4 ${
                    isCompleted
                      ? `bg-gradient-to-br ${config.color} border-transparent shadow-2xl text-white`
                      : `bg-white border-gray-300 text-gray-400 shadow-md`
                  } ${isCurrent ? `ring-8 ${config.ringColor} shadow-2xl` : ''}`}
                >
                  {isCompleted ? (
                    isCurrent ? (
                      <motion.div
                        animate={{ 
                          rotate: s === 'processing' ? 360 : 0,
                          scale: [1, 1.2, 1]
                        }}
                        transition={{ 
                          rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
                          scale: { duration: 1, repeat: Infinity, repeatDelay: 0.5 }
                        }}
                        className="flex items-center justify-center"
                      >
                        {config.icon}
                      </motion.div>
                    ) : (
                      <motion.svg 
                        width="28" 
                        height="28" 
                        viewBox="0 0 24 24" 
                        fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5, delay: index * 0.2 }}
                      >
                        <motion.path 
                          d="M5 12l5 5L20 7" 
                          stroke="white" 
                          strokeWidth="3" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                      </motion.svg>
                    )
                  ) : (
                    <div className="flex items-center justify-center opacity-50">
                      {config.icon}
                    </div>
                  )}
                </div>

                {/* Sparkle effect for completed status */}
                {isCompleted && (
                  <>
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0]
                      }}
                      transition={{ 
                        duration: 1,
                        delay: index * 0.2 + 0.5,
                        repeat: isCurrent ? Infinity : 0,
                        repeatDelay: 2
                      }}
                      className="absolute -top-1 -right-1 w-4 h-4"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="text-yellow-400">
                        <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6z"/>
                      </svg>
                    </motion.div>
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0]
                      }}
                      transition={{ 
                        duration: 1,
                        delay: index * 0.2 + 0.7,
                        repeat: isCurrent ? Infinity : 0,
                        repeatDelay: 2
                      }}
                      className="absolute -bottom-1 -left-1 w-3 h-3"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="text-yellow-400">
                        <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6z"/>
                      </svg>
                    </motion.div>
                  </>
                )}
              </motion.div>

              {/* Status Label with animation */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 + 0.3 }}
                className="text-center"
              >
                <motion.p 
                  className={`text-sm font-bold mb-1 transition-colors duration-300 ${
                    isCompleted ? 'text-gray-900' : 'text-gray-500'
                  }`}
                  animate={isCurrent ? { 
                    scale: [1, 1.05, 1]
                  } : {}}
                  transition={{ 
                    duration: 1,
                    repeat: isCurrent ? Infinity : 0,
                    repeatDelay: 1
                  }}
                >
                  {config.label}
                </motion.p>
                {event && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.2 + 0.5 }}
                    className="text-xs text-gray-500"
                  >
                    {new Date(event.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </motion.p>
                )}
              </motion.div>

              {/* Celebration message for delivered */}
              {s === 'delivered' && isCompleted && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 1, type: 'spring', stiffness: 200 }}
                  className={`absolute -bottom-16 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-2 rounded-full ${config.lightBg} text-green-700 text-xs font-bold shadow-lg`}
                >
                  🎉 Enjoy your fresh clothes!
                </motion.div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
