import { Resend } from 'resend';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, to, data } = req.body;

    let subject = '';
    let html = '';

    switch (type) {
      case 'order_confirmation':
        subject = `Order Confirmed - #${data.orderId.slice(0, 8).toUpperCase()}`;
        html = getOrderConfirmationEmail(data);
        break;

      case 'payment_confirmation':
        subject = `Payment Received - ₦${(data.amount / 100).toLocaleString()}`;
        html = getPaymentConfirmationEmail(data);
        break;

      case 'order_status_update':
        subject = `Order Update: ${data.status}`;
        html = getOrderStatusEmail(data);
        break;

      case 'admin_message':
        subject = `New Message from Doc JS Laundry`;
        html = getAdminMessageEmail(data);
        break;

      case 'order_ready':
        subject = `Your Order is Ready for Pickup! 🎉`;
        html = getOrderReadyEmail(data);
        break;

      case 'payment_reminder':
        subject = `Payment Reminder - Order #${data.orderId.slice(0, 8).toUpperCase()}`;
        html = getPaymentReminderEmail(data);
        break;

      default:
        return res.status(400).json({ error: 'Invalid email type' });
    }

    const result = await resend.emails.send({
      from: 'Doc JS Laundry <noreply@docjslaundry.com>',
      to,
      subject,
      html,
    });

    return res.status(200).json({ success: true, id: result.data?.id });
  } catch (error: any) {
    console.error('Email send error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Email Templates

function getOrderConfirmationEmail(data: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563EB 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 2px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
        .order-id { font-size: 24px; font-weight: bold; color: #2563EB; margin: 20px 0; }
        .items { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .total { font-size: 20px; font-weight: bold; color: #2563EB; text-align: right; margin-top: 20px; }
        .button { display: inline-block; background: #2563EB; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmed! 🎉</h1>
          <p>Thank you for choosing Doc JS Laundry</p>
        </div>
        <div class="content">
          <p>Hi ${data.customerName},</p>
          <p>Your order has been received and is being processed.</p>
          
          <div class="order-id">Order #${data.orderId.slice(0, 8).toUpperCase()}</div>
          
          <div class="items">
            <h3>Order Details</h3>
            ${data.items.map((item: any) => `
              <div class="item">
                <span>${item.quantity}x ${item.name}</span>
                <span>₦${(item.price / 100).toLocaleString()}</span>
              </div>
            `).join('')}
            
            ${data.logisticsOption !== 'none' ? `
              <div class="item">
                <span>Logistics (${data.logisticsOption === 'pickup' ? 'Pickup Only' : 'Pickup & Delivery'})</span>
                <span>₦${(data.logisticsFee / 100).toLocaleString()}</span>
              </div>
            ` : ''}
            
            <div class="total">
              Total: ₦${(data.total / 100).toLocaleString()}
            </div>
          </div>
          
          <p><strong>Payment Method:</strong> ${data.paymentMethod === 'prepay' ? 'Prepay (2% Discount)' : 'Postpay'}</p>
          <p><strong>Status:</strong> Received</p>
          
          <a href="https://docjslaundry.com/app/orders/${data.orderId}" class="button">
            Track Your Order
          </a>
          
          <p>We'll notify you when your order status changes.</p>
        </div>
        <div class="footer">
          <p>Doc JS Laundry & Dry Cleaning Services</p>
          <p>Warri, Delta State | +234 XXX XXX XXXX</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getPaymentConfirmationEmail(data: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 2px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
        .amount { font-size: 32px; font-weight: bold; color: #10b981; margin: 20px 0; text-align: center; }
        .receipt { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .receipt-item { display: flex; justify-content: space-between; padding: 8px 0; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Payment Received ✅</h1>
          <p>Thank you for your payment!</p>
        </div>
        <div class="content">
          <p>Hi ${data.customerName},</p>
          <p>We've received your payment successfully.</p>
          
          <div class="amount">₦${(data.amount / 100).toLocaleString()}</div>
          
          <div class="receipt">
            <h3>Payment Receipt</h3>
            <div class="receipt-item">
              <span>Order ID:</span>
              <span>#${data.orderId.slice(0, 8).toUpperCase()}</span>
            </div>
            <div class="receipt-item">
              <span>Amount Paid:</span>
              <span>₦${(data.amount / 100).toLocaleString()}</span>
            </div>
            <div class="receipt-item">
              <span>Payment Method:</span>
              <span>${data.paymentMethod}</span>
            </div>
            <div class="receipt-item">
              <span>Transaction ID:</span>
              <span>${data.transactionId}</span>
            </div>
            <div class="receipt-item">
              <span>Date:</span>
              <span>${new Date().toLocaleDateString()}</span>
            </div>
          </div>
          
          <a href="https://docjslaundry.com/app/orders/${data.orderId}" class="button">
            View Order
          </a>
        </div>
        <div class="footer">
          <p>Doc JS Laundry & Dry Cleaning Services</p>
          <p>Keep this email for your records</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getOrderStatusEmail(data: any) {
  const statusMessages = {
    processing: {
      title: 'Order is Being Processed 🧺',
      message: 'Your clothes are being carefully cleaned and pressed.',
      color: '#f59e0b'
    },
    ready: {
      title: 'Order is Ready for Pickup! 🎉',
      message: 'Your freshly cleaned clothes are ready. Come pick them up anytime!',
      color: '#8b5cf6'
    },
    delivered: {
      title: 'Order Delivered ✅',
      message: 'Your order has been delivered. Thank you for choosing Doc JS Laundry!',
      color: '#10b981'
    }
  };

  const status = statusMessages[data.status as keyof typeof statusMessages];

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${status.color}; color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 2px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
        .button { display: inline-block; background: ${status.color}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${status.title}</h1>
        </div>
        <div class="content">
          <p>Hi ${data.customerName},</p>
          <p>${status.message}</p>
          
          <p><strong>Order #${data.orderId.slice(0, 8).toUpperCase()}</strong></p>
          
          <a href="https://docjslaundry.com/app/orders/${data.orderId}" class="button">
            View Order Details
          </a>
        </div>
        <div class="footer">
          <p>Doc JS Laundry & Dry Cleaning Services</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getAdminMessageEmail(data: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563EB 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 2px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
        .message { background: #f9fafb; padding: 20px; border-left: 4px solid #2563EB; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; background: #2563EB; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Message from Doc JS Laundry 💬</h1>
        </div>
        <div class="content">
          <p>Hi ${data.customerName},</p>
          <p>You have a new message from our team:</p>
          
          <div class="message">
            ${data.message}
          </div>
          
          <a href="https://docjslaundry.com/app/dashboard" class="button">
            Reply in App
          </a>
        </div>
        <div class="footer">
          <p>Doc JS Laundry & Dry Cleaning Services</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getOrderReadyEmail(data: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 2px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
        .highlight { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; font-weight: bold; }
        .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Order is Ready! 🎉</h1>
        </div>
        <div class="content">
          <p>Hi ${data.customerName},</p>
          <p>Great news! Your freshly cleaned clothes are ready for pickup.</p>
          
          <div class="highlight">
            Order #${data.orderId.slice(0, 8).toUpperCase()}
          </div>
          
          <p><strong>Pickup Location:</strong> ${data.pickupLocation || 'Any of our 3 locations in Warri'}</p>
          <p><strong>Opening Hours:</strong> Mon-Sat, 7:00 AM - 7:00 PM</p>
          
          ${data.finalPaymentPending ? `
            <p style="color: #f59e0b;"><strong>⚠️ Payment Reminder:</strong> Please complete your payment (₦${(data.remainingAmount / 100).toLocaleString()}) when picking up.</p>
          ` : ''}
          
          <a href="https://docjslaundry.com/app/orders/${data.orderId}" class="button">
            View Order
          </a>
        </div>
        <div class="footer">
          <p>Doc JS Laundry & Dry Cleaning Services</p>
          <p>Effurun | Airport Road | Ubeji</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getPaymentReminderEmail(data: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 2px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
        .amount { font-size: 32px; font-weight: bold; color: #f59e0b; margin: 20px 0; text-align: center; }
        .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Payment Reminder 💳</h1>
        </div>
        <div class="content">
          <p>Hi ${data.customerName},</p>
          <p>This is a friendly reminder about your pending payment for order #${data.orderId.slice(0, 8).toUpperCase()}.</p>
          
          <div class="amount">₦${(data.amount / 100).toLocaleString()}</div>
          
          <p>Your order is ready for pickup. Please complete payment when you collect your clothes.</p>
          
          <a href="https://docjslaundry.com/app/orders/${data.orderId}" class="button">
            Pay Now
          </a>
        </div>
        <div class="footer">
          <p>Doc JS Laundry & Dry Cleaning Services</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
