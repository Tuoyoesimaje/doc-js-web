# Test Checklist - Doc JS Laundry App

## Pre-Deployment Tests (Local)

### Database Tests
- [ ] Run `supabase-schema.sql` without errors
- [ ] Verify all 8 tables created (users, addresses, services, orders, order_items, order_events, payments, uploads)
- [ ] Verify 15 services seeded with correct prices
- [ ] Test RLS: User A cannot query User B's orders
- [ ] Test RLS: Admin can query all orders

### Authentication Tests

**Google OAuth:**
- [ ] Click "Continue with Google"
- [ ] Redirects to Google login
- [ ] Returns to app after auth
- [ ] User record created in `users` table
- [ ] Session persists after page refresh

**Phone - First Time:**
- [ ] Enter phone number (e.g., +2348012345678)
- [ ] OTP sent via SMS
- [ ] Enter OTP code
- [ ] OTP verified successfully
- [ ] Prompted to set password
- [ ] Password saved
- [ ] `password_set` = true in database
- [ ] Redirected to dashboard

**Phone - Returning User:**
- [ ] Enter phone + password
- [ ] Login successful WITHOUT OTP
- [ ] No SMS charged
- [ ] Session persists

**Session Persistence:**
- [ ] Login
- [ ] Close browser
- [ ] Reopen browser
- [ ] Still logged in (within 30 days)

### Order Creation Tests

**Quick Input Mode:**
- [ ] Enter "10 shirts, 5 trousers"
- [ ] Click "Parse Items"
- [ ] 2 items appear with correct quantities
- [ ] Prices calculated correctly
- [ ] Total = (10 × ₦900) + (5 × ₦1,200) = ₦15,000

**Visual Select Mode:**
- [ ] Switch to Visual Select
- [ ] Click + button on "Shirt / Polo"
- [ ] Quantity increases
- [ ] Click - button
- [ ] Quantity decreases
- [ ] Total updates in real-time

**Express Service:**
- [ ] Toggle "Express Service"
- [ ] Total increases by 50%
- [ ] Example: ₦15,000 → ₦22,500

**Address Selection:**
- [ ] Select delivery address
- [ ] Default address pre-selected
- [ ] Can switch between addresses

**Order Submission:**
- [ ] Click "Continue to Payment"
- [ ] Order created in database
- [ ] Order items created
- [ ] Order event "created" logged
- [ ] Redirected to order detail page

### Dashboard Tests
- [ ] Recent orders displayed
- [ ] Order cards show correct status
- [ ] Order cards show correct total
- [ ] Click order card → navigates to detail
- [ ] "New Order" button works
- [ ] Sign out button works

### Order Detail Tests
- [ ] Order status timeline displays
- [ ] Current status highlighted
- [ ] Items list shows all items
- [ ] Quantities and prices correct
- [ ] Total matches order total
- [ ] Delivery address displayed
- [ ] "Back to Dashboard" works

### Admin Panel Tests
- [ ] Navigate to `/admin`
- [ ] All orders visible (not just own)
- [ ] Click "Processing" button
- [ ] Order status updates
- [ ] Status change reflected immediately
- [ ] Order event logged
- [ ] Click "Ready" button
- [ ] Status updates again
- [ ] Click "Delivered" button
- [ ] Final status set

## Post-Deployment Tests (Vercel)

### Deployment Verification
- [ ] App accessible at production URL
- [ ] No 404 errors
- [ ] No console errors
- [ ] Assets loading (CSS, JS)
- [ ] Fonts loading correctly

### Environment Variables
- [ ] Supabase connection works
- [ ] Auth redirects work
- [ ] No "undefined" in API calls

### Mobile Responsiveness
- [ ] Test on iPhone (Safari)
- [ ] Test on Android (Chrome)
- [ ] Login modal responsive
- [ ] Dashboard responsive
- [ ] Order form responsive
- [ ] Buttons accessible
- [ ] Text readable

### Performance
- [ ] Initial load < 3 seconds
- [ ] Login flow < 2 minutes total
- [ ] Order creation < 30 seconds
- [ ] No lag when typing
- [ ] Smooth animations

### Cross-Browser
- [ ] Chrome (desktop)
- [ ] Safari (desktop)
- [ ] Firefox (desktop)
- [ ] Edge (desktop)
- [ ] Chrome (mobile)
- [ ] Safari (mobile)

## Integration Tests

### Supabase Integration
- [ ] Auth state syncs correctly
- [ ] Real-time updates work (if enabled)
- [ ] File uploads work (if implemented)
- [ ] RLS policies enforced

### Payment Integration (Phase 2)
- [ ] Monnify payment modal opens
- [ ] Payment processes successfully
- [ ] Webhook received
- [ ] Order status updated
- [ ] Payment record created
- [ ] Confirmation email sent

### Notification Tests (Phase 2)

**SMS Notifications:**
- [ ] OTP received (first login)
- [ ] Order confirmed SMS received
- [ ] Order ready SMS received
- [ ] No SMS for "processing" status

**Email Notifications:**
- [ ] Order confirmation email
- [ ] Processing update email
- [ ] Ready for pickup email
- [ ] Delivered confirmation email
- [ ] Rating request email

## Edge Cases

### Authentication Edge Cases
- [ ] Invalid phone number → error message
- [ ] Wrong OTP code → error message
- [ ] Expired OTP → error message
- [ ] Network error during login → retry works
- [ ] Logout → session cleared

### Order Edge Cases
- [ ] Empty order → submit disabled
- [ ] No address selected → error message
- [ ] Invalid quantity (0 or negative) → ignored
- [ ] Very large order (100+ items) → works
- [ ] Special characters in text input → handled

### Admin Edge Cases
- [ ] Non-admin tries to access `/admin` → redirected
- [ ] Update status while offline → error handled
- [ ] Concurrent status updates → last write wins

## Security Tests

### Authentication Security
- [ ] Cannot access dashboard without login
- [ ] Cannot access other users' orders
- [ ] Session expires after 30 days
- [ ] Logout clears all session data

### API Security
- [ ] Cannot query other users' data via API
- [ ] RLS policies enforced on all tables
- [ ] Service role key not exposed in client
- [ ] Anon key has limited permissions

### Input Validation
- [ ] SQL injection attempts blocked
- [ ] XSS attempts sanitized
- [ ] CSRF protection enabled
- [ ] Rate limiting on auth endpoints

## Performance Benchmarks

### Load Times
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Largest Contentful Paint < 2.5s

### API Response Times
- [ ] Login < 500ms
- [ ] Load orders < 300ms
- [ ] Create order < 500ms
- [ ] Update status < 200ms

### Bundle Size
- [ ] Initial JS bundle < 200KB (gzipped)
- [ ] CSS bundle < 50KB (gzipped)
- [ ] Total page weight < 500KB

## Accessibility Tests

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Enter key submits forms
- [ ] Escape key closes modals
- [ ] Focus indicators visible

### Screen Reader
- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Buttons have descriptive text
- [ ] Status messages announced

### Color Contrast
- [ ] Text meets WCAG AA standards
- [ ] Buttons have sufficient contrast
- [ ] Status colors distinguishable

## User Acceptance Tests

### New User Journey
1. [ ] Visit site
2. [ ] Click "Login"
3. [ ] Choose phone login
4. [ ] Receive OTP
5. [ ] Verify OTP
6. [ ] Set password
7. [ ] See dashboard
8. [ ] Click "New Order"
9. [ ] Enter items
10. [ ] Submit order
11. [ ] Complete payment
12. [ ] Track order
**Total time: < 5 minutes**

### Returning User Journey
1. [ ] Visit site
2. [ ] Enter phone + password
3. [ ] See dashboard with past orders
4. [ ] Click "New Order"
5. [ ] Quick input: "10 shirts"
6. [ ] Submit
7. [ ] Pay
**Total time: < 2 minutes**

### Admin Journey
1. [ ] Login as admin
2. [ ] Navigate to `/admin`
3. [ ] See all pending orders
4. [ ] Update order to "processing"
5. [ ] Customer receives notification
6. [ ] Update to "ready"
7. [ ] Customer receives SMS
8. [ ] Update to "delivered"
9. [ ] Customer receives email + rating request

## Sign-Off

### Development Team
- [ ] All features implemented
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Documentation complete

### QA Team
- [ ] All test cases executed
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Security verified

### Product Owner
- [ ] Acceptance criteria met
- [ ] User flows validated
- [ ] Ready for production

### Deployment Team
- [ ] Environment configured
- [ ] Monitoring set up
- [ ] Backup strategy in place
- [ ] Rollback plan ready

---

**Test Date**: _____________

**Tested By**: _____________

**Status**: ⬜ Pass | ⬜ Fail | ⬜ Needs Review

**Notes**:
