import type { OrderStatus, OrderEvent } from '../types'

interface OrderTimelineProps {
  status: OrderStatus
  events: OrderEvent[]
}

const STATUSES: OrderStatus[] = ['received', 'processing', 'ready', 'delivered']

const STATUS_CONFIG = {
  received: { label: 'Received', icon: '📦' },
  processing: { label: 'Processing', icon: '🔄' },
  ready: { label: 'Ready', icon: '✅' },
  delivered: { label: 'Delivered', icon: '🎉' },
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
                    ? 'bg-primary-600 border-primary-600 shadow-lg scale-110'
                    : 'bg-white border-gray-300'
                } ${isCurrent ? 'ring-4 ring-primary-100' : ''}`}
              >
                {isCompleted ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l5 5L20 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <span className="text-2xl">{config.icon}</span>
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
