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
    )
  },
  processing: { 
    label: 'Processing', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  ready: { 
    label: 'Ready', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  delivered: { 
    label: 'Delivered', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M13 16V6C13 4.89543 13.8954 4 15 4H19C20.1046 4 21 4.89543 21 6V16M13 16H3L5 8H11L13 16ZM13 16H21M21 16H23V18C23 19.1046 22.1046 20 21 20H19.5M13 16V18C13 19.1046 12.1046 20 11 20H9.5M9.5 20C9.5 21.3807 8.38071 22.5 7 22.5C5.61929 22.5 4.5 21.3807 4.5 20C4.5 18.6193 5.61929 17.5 7 17.5C8.38071 17.5 9.5 18.6193 9.5 20ZM19.5 20C19.5 21.3807 18.3807 22.5 17 22.5C15.6193 22.5 14.5 21.3807 14.5 20C14.5 18.6193 15.6193 17.5 17 17.5C18.3807 17.5 19.5 18.6193 19.5 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
}

export default function OrderTimeline({ status, events }: OrderTimelineProps) {
  const currentIndex = STATUSES.indexOf(status)

  return (
    <div className="relative">
      <div className="grid grid-cols-4 gap-4">
        {STATUSES.map((s, index) => {
          const isCompleted = index <= currentIndex
          const isCurrent = index === currentIndex
          const event = events.find(e => e.event_type === s)
          const config = STATUS_CONFIG[s]

          return (
            <div key={s} className="relative flex flex-col items-center">
              {/* Connector Line */}
              {index < STATUSES.length - 1 && (
                <div
                  className={`absolute top-6 left-1/2 w-full h-1 -z-10 transition-all duration-500 ${
                    index < currentIndex ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                />
              )}

              {/* Status Circle */}
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-500 mb-3 ${
                  isCompleted
                    ? 'bg-primary-600 border-primary-600 shadow-lg scale-110 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                } ${isCurrent ? 'ring-4 ring-primary-100' : ''}`}
              >
                {isCompleted ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l5 5L20 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <div className="flex items-center justify-center">
                    {config.icon}
                  </div>
                )}
              </div>

              {/* Status Label */}
              <div className="text-center">
                <p className={`text-sm font-bold mb-1 ${isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                  {config.label}
                </p>
                {event && (
                  <p className="text-xs text-gray-500">
                    {new Date(event.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
