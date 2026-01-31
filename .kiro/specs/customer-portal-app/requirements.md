# Requirements Document

## Introduction

This document specifies the requirements for the Doc JS Laundry Customer Portal App - a React-based web application that enables customers to book laundry services, make payments, and track orders. The app will be embedded into the existing marketing site (docjslaundry.com) and use Supabase as the managed backend with Monnify for payment processing.

## Glossary

- **Customer_Portal**: The React web application accessible at docjslaundry.com/app
- **Marketing_Site**: The existing static HTML/CSS/JS website at docjslaundry.com
- **Supabase**: The managed backend-as-a-service providing authentication, database, storage, and edge functions
- **Monnify**: The payment gateway provider for processing customer payments
- **Order_Status**: The current state of an order (received, processing, ready, delivered)
- **Quick_Order**: The bulk text parsing interface for rapid order entry
- **Visual_Order**: The icon-based interface for selecting services and quantities
- **OTP**: One-Time Password sent via SMS for phone authentication
- **Session**: An authenticated user session persisting for 30 days
- **Admin_Panel**: The hidden administrative interface for managing orders
- **Edge_Function**: Serverless functions running on Supabase for webhooks and background tasks
- **RLS**: Row-Level Security policies in Supabase Postgres

## Requirements

### Requirement 1: System Architecture & Integration

**User Story:** As a business owner, I want the customer portal to integrate seamlessly with my existing marketing site, so that customers have a unified experience without requiring a separate mobile app or custom backend.

#### Acceptance Criteria

1. THE Customer_Portal SHALL be built using React with Vite as the build tool
2. THE Customer_Portal SHALL be deployed on Vercel and accessible at docjslaundry.com/app
3. THE Marketing_Site SHALL remain as static HTML/CSS/JS without modification to its core structure
4. THE Customer_Portal SHALL use Tailwind CSS for styling to match the Marketing_Site design language
5. THE Customer_Portal SHALL use Framer Motion for page transitions and micro-animations
6. THE Customer_Portal SHALL use TypeScript for type safety
7. THE Customer_Portal SHALL use Supabase as the sole backend service (no custom servers)
8. THE Customer_Portal SHALL integrate with Monnify for payment processing via Supabase Edge Functions

### Requirement 2: Database Schema & Data Model

**User Story:** As a developer, I want a well-structured database schema with proper security policies, so that customer data is organized and protected.

#### Acceptance Criteria

1. THE System SHALL create a users table storing id, email, phone, display_name, created_at, last_login, google_provider_id, and password_set boolean
2. THE System SHALL create an addresses table storing id, user_id, label, line1, line2, city, state, lat, lng, and is_default
3. THE System SHALL create a services table storing id, key, name, base_price_cents, unit, description, and is_active
4. THE System SHALL create an orders table storing id, user_id, address_id, total_cents, currency, status enum, payment_status enum, created_at, and updated_at
5. THE System SHALL create an order_items table storing id, order_id, service_id, description, quantity, unit_price_cents, and modifiers jsonb
6. THE System SHALL create an order_events table storing id, order_id, event_type, note, created_at, and actor_user_id
7. THE System SHALL create a payments table storing id, order_id, provider, provider_payload jsonb, amount_cents, currency, status, and created_at
8. THE System SHALL create an uploads table storing id, user_id, object_key, url, metadata jsonb, and created_at
9. THE System SHALL define order status as an enum with exactly four values: received, processing, ready, delivered
10. THE System SHALL create indexes on orders(user_id, status) and payments(order_id) for query performance
11. THE System SHALL implement Row-Level Security policies so customers can only access their own data
12. THE System SHALL implement RLS policies allowing admin users to read and update all orders
13. THE System SHALL implement RLS policies allowing Edge Functions to insert and update payments and order statuses

### Requirement 3: Authentication & Session Management

**User Story:** As a customer, I want to sign in using Google or my phone number with minimal friction, so that I can quickly access my account without repeated OTP verification.

#### Acceptance Criteria

1. WHEN a new user signs in with a phone number, THE System SHALL send an OTP via SMS
2. WHEN a new phone user verifies their OTP, THE System SHALL create a user record with password_set=false
3. WHEN a new phone user completes OTP verification, THE System SHALL prompt them to set a password
4. WHEN a phone user sets their password, THE System SHALL update password_set=true and store the password securely via Supabase Auth
5. WHEN a returning phone user signs in, THE System SHALL allow authentication via phone and password
6. WHEN a phone user forgets their password, THE System SHALL provide an OTP fallback option
7. WHEN a user signs in with Google, THE System SHALL use Supabase OAuth redirect flow
8. WHEN a user signs in with Google, THE System SHALL automatically create or update their user record
9. WHEN a user successfully authenticates, THE System SHALL create a session persisting for 30 days
10. THE System SHALL store session tokens in localStorage and automatically refresh them
11. THE System SHALL NOT send OTP to returning phone users who have set a password
12. THE System SHALL display appropriate loading states and allow OTP retry after 30 seconds

### Requirement 4: Quick Order Interface

**User Story:** As a customer, I want to quickly enter my laundry order using natural text like "10 shirts, 5 trousers", so that I can complete my booking in under 2 minutes.

#### Acceptance Criteria

1. WHEN a customer enters bulk text in the Quick_Order interface, THE System SHALL parse the text into individual order items
2. THE System SHALL recognize common garment types including: shirt, trouser, jeans, polo, bedsheet, duvet, jacket, agbada, native, suit, blazer, kaftan, gown, tie, scarf
3. THE System SHALL extract quantities from text patterns like "10 shirts", "5x trousers", "wash 50 clothes"
4. WHEN the parser identifies an item, THE System SHALL map it to the corresponding service in the services table
5. WHEN the parser cannot identify an item, THE System SHALL flag it for manual review or correction
6. THE System SHALL display parsed items in a review list before order submission
7. THE System SHALL allow customers to edit quantities and remove items from the parsed list
8. THE System SHALL calculate the total price in real-time as items are parsed
9. WHEN parsing is complete, THE System SHALL transition to address selection within 5 seconds

### Requirement 5: Visual Order Interface

**User Story:** As a customer who prefers visual selection, I want to choose services using icons and quantity controls, so that I have an alternative to text-based ordering.

#### Acceptance Criteria

1. THE Visual_Order interface SHALL display service categories with representative icons
2. WHEN a customer clicks a service icon, THE System SHALL display quantity controls (+ and - buttons)
3. THE System SHALL allow customers to increment or decrement quantities for each service
4. THE System SHALL display the current quantity and unit price for each selected service
5. THE System SHALL calculate and display the running total as quantities change
6. THE System SHALL allow customers to switch between Quick_Order and Visual_Order modes
7. WHEN a customer completes Visual_Order selection, THE System SHALL transition to address selection

### Requirement 6: Address Management

**User Story:** As a customer, I want to save multiple delivery addresses and select one for each order, so that I can easily order for different locations.

#### Acceptance Criteria

1. THE System SHALL allow customers to add new addresses with fields: label, line1, line2, city, state
2. THE System SHALL allow customers to mark one address as default
3. WHEN creating a new order, THE System SHALL pre-select the default address
4. THE System SHALL display all saved addresses as selectable cards during order creation
5. THE System SHALL allow customers to edit existing addresses
6. THE System SHALL allow customers to delete non-default addresses
7. WHEN a customer selects an address, THE System SHALL associate it with the order being created

### Requirement 7: Payment Processing

**User Story:** As a customer, I want to pay for my order securely using Monnify, so that my payment is processed and my order is confirmed.

#### Acceptance Criteria

1. WHEN a customer completes order details, THE System SHALL calculate the total amount in Naira
2. WHEN a customer clicks "Pay Now", THE System SHALL create an order record with status=received and payment_status=pending
3. THE System SHALL invoke a Supabase Edge Function to initialize a Monnify payment
4. THE Edge Function SHALL return a Monnify payment URL or modal parameters
5. THE System SHALL redirect the customer to Monnify or display the Monnify payment modal
6. WHEN Monnify processes the payment, THE Monnify webhook SHALL call a Supabase Edge Function
7. THE Edge Function SHALL verify the webhook signature and payment status
8. WHEN payment is successful, THE Edge Function SHALL update payment_status=paid and create an order_event with type=payment_received
9. WHEN payment is successful, THE System SHALL send an SMS notification to the customer confirming the order
10. WHEN payment fails, THE System SHALL update payment_status=failed and notify the customer via email
11. THE System SHALL allow customers to retry failed payments

### Requirement 8: Order Tracking & Status Updates

**User Story:** As a customer, I want to see the current status of my orders and receive notifications when status changes, so that I know when to expect my laundry.

#### Acceptance Criteria

1. THE System SHALL display orders in a list showing order number, date, total, and current status
2. WHEN a customer clicks an order, THE System SHALL display detailed order information including items, address, and status timeline
3. THE System SHALL display order status as one of four states: received, processing, ready, delivered
4. THE System SHALL display a visual timeline showing completed and pending status transitions
5. WHEN an admin updates order status to "ready", THE System SHALL send an SMS notification to the customer
6. WHEN an admin updates order status to "delivered", THE System SHALL send an email notification to the customer
7. THE System SHALL send email notifications for status transitions from received to processing
8. THE System SHALL create an order_event record for each status transition
9. THE System SHALL display order_events in chronological order on the order detail page
10. THE System SHALL allow customers to refresh order status in real-time

### Requirement 9: Notification System

**User Story:** As a customer, I want to receive timely notifications about my orders via SMS and email, so that I stay informed without excessive SMS costs for the business.

#### Acceptance Criteria

1. THE System SHALL send SMS notifications only for: OTP (first login), order confirmed (payment received), and order ready
2. THE System SHALL send email notifications for: order receipt, processing updates, delivered status, and rating requests
3. WHEN an order is created and paid, THE System SHALL send an SMS within 2 minutes confirming the order number
4. WHEN an order status changes to "ready", THE System SHALL send an SMS within 5 minutes
5. WHEN an order status changes to "processing", THE System SHALL send an email within 10 minutes
6. WHEN an order status changes to "delivered", THE System SHALL send an email within 10 minutes with a rating request link
7. THE System SHALL use Supabase Edge Functions to send notifications asynchronously
8. THE System SHALL log all notification attempts in the order_events table
9. THE System SHALL retry failed SMS notifications up to 2 times with exponential backoff
10. THE System SHALL NOT send duplicate notifications for the same status transition

### Requirement 10: Admin Panel

**User Story:** As an admin, I want a simple interface to view orders and update their status, so that I can manage the order workflow efficiently.

#### Acceptance Criteria

1. THE Admin_Panel SHALL be accessible at a hidden route (e.g., /app/admin)
2. THE Admin_Panel SHALL require admin authentication (admin role in Supabase)
3. THE Admin_Panel SHALL display all orders in a filterable list (by status, date, customer)
4. WHEN an admin clicks an order, THE System SHALL display full order details including customer info and items
5. THE Admin_Panel SHALL provide a status update dropdown with the four allowed statuses
6. WHEN an admin changes order status, THE System SHALL update the orders table and create an order_event
7. WHEN an admin changes order status, THE System SHALL trigger appropriate notifications
8. THE Admin_Panel SHALL display order statistics (total orders, orders by status, revenue)
9. THE Admin_Panel SHALL allow admins to search orders by customer name, phone, or order number
10. THE Admin_Panel SHALL display recent order_events for audit purposes

### Requirement 11: File Upload & Storage

**User Story:** As a customer, I want to optionally upload photos of special care instructions or stains, so that the laundry service can handle my items appropriately.

#### Acceptance Criteria

1. THE System SHALL allow customers to upload images during order creation
2. THE System SHALL store uploaded files in Supabase Storage
3. THE System SHALL create an uploads record for each file with user_id, object_key, url, and metadata
4. THE System SHALL limit file uploads to image formats (JPEG, PNG, HEIC)
5. THE System SHALL limit individual file size to 5MB
6. THE System SHALL allow up to 5 images per order
7. THE System SHALL display uploaded images as thumbnails in the order review screen
8. THE System SHALL associate uploaded images with the order via metadata jsonb field
9. THE System SHALL allow admins to view uploaded images in the Admin_Panel
10. THE System SHALL implement RLS policies so customers can only access their own uploads

### Requirement 12: Performance & User Experience

**User Story:** As a customer, I want the app to load quickly and respond instantly to my actions, so that I can complete my order without frustration.

#### Acceptance Criteria

1. THE Customer_Portal SHALL load the initial page in under 3 seconds on 4G connection
2. THE System SHALL display loading states for all asynchronous operations
3. THE System SHALL cache service pricing data in localStorage for 24 hours
4. THE System SHALL prefetch user addresses after login
5. THE System SHALL complete the order flow from login to payment in under 2 minutes for returning customers
6. THE System SHALL use optimistic UI updates for non-critical operations (e.g., adding items to cart)
7. THE System SHALL debounce text input in Quick_Order to avoid excessive parsing
8. THE System SHALL use React.lazy for code splitting on admin and order detail routes
9. THE System SHALL display error messages clearly with actionable recovery steps
10. THE System SHALL work on mobile devices with screen widths from 320px to 1920px

### Requirement 13: Security & Data Protection

**User Story:** As a business owner, I want customer data to be secure and access-controlled, so that we comply with data protection requirements and maintain customer trust.

#### Acceptance Criteria

1. THE System SHALL enforce Row-Level Security on all Supabase tables
2. THE System SHALL validate all user inputs on both client and server (Edge Functions)
3. THE System SHALL sanitize text inputs to prevent XSS attacks
4. THE System SHALL use HTTPS for all communications
5. THE System SHALL store passwords using Supabase Auth's secure hashing
6. THE System SHALL never expose API keys or secrets in client-side code
7. THE System SHALL verify Monnify webhook signatures before processing payments
8. THE System SHALL log all admin actions in order_events with actor_user_id
9. THE System SHALL implement rate limiting on authentication endpoints (via Supabase)
10. THE System SHALL expire sessions after 30 days of inactivity
11. THE System SHALL allow customers to view and delete their personal data (GDPR compliance)

### Requirement 14: Error Handling & Resilience

**User Story:** As a customer, I want the app to handle errors gracefully and provide clear guidance, so that I can recover from issues without losing my progress.

#### Acceptance Criteria

1. WHEN a network error occurs, THE System SHALL display a user-friendly error message with retry option
2. WHEN Supabase is unavailable, THE System SHALL display a maintenance message
3. WHEN payment processing fails, THE System SHALL preserve the order draft and allow retry
4. WHEN Quick_Order parsing fails, THE System SHALL offer to switch to Visual_Order mode
5. THE System SHALL validate order data before submission and display specific validation errors
6. THE System SHALL implement error boundaries to catch React component errors
7. WHEN an error boundary catches an error, THE System SHALL display a fallback UI with home link
8. THE System SHALL log client-side errors to Supabase for debugging
9. THE System SHALL implement retry logic with exponential backoff for failed API calls
10. THE System SHALL preserve form state in sessionStorage to prevent data loss on page refresh

### Requirement 15: Testing & Quality Assurance

**User Story:** As a developer, I want comprehensive tests to ensure the app works correctly, so that we can deploy with confidence and catch regressions early.

#### Acceptance Criteria

1. THE System SHALL include unit tests for the Quick_Order parser with 90%+ coverage
2. THE System SHALL include integration tests for authentication flows
3. THE System SHALL include integration tests for order creation and payment flows
4. THE System SHALL include tests verifying RLS policies prevent unauthorized access
5. THE System SHALL include tests for Edge Functions handling Monnify webhooks
6. THE System SHALL include visual regression tests for key UI components
7. THE System SHALL run tests automatically on pull requests via CI/CD
8. THE System SHALL achieve 80%+ code coverage across the codebase
9. THE System SHALL include end-to-end tests for the complete order flow
10. THE System SHALL include load tests simulating 100 concurrent users
