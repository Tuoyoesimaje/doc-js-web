// Email sending helper functions

export async function sendOrderConfirmationEmail(data: {
  customerEmail: string;
  customerName: string;
  orderId: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  logisticsOption: string;
  logisticsFee: number;
  paymentMethod: string;
}) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'order_confirmation',
        to: data.customerEmail,
        data,
      }),
    });

    if (!response.ok) throw new Error('Failed to send email');
    return await response.json();
  } catch (error) {
    console.error('Email send error:', error);
    // Don't throw - email failure shouldn't break the app
  }
}

export async function sendPaymentConfirmationEmail(data: {
  customerEmail: string;
  customerName: string;
  orderId: string;
  amount: number;
  paymentMethod: string;
  transactionId: string;
}) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'payment_confirmation',
        to: data.customerEmail,
        data,
      }),
    });

    if (!response.ok) throw new Error('Failed to send email');
    return await response.json();
  } catch (error) {
    console.error('Email send error:', error);
  }
}

export async function sendOrderStatusEmail(data: {
  customerEmail: string;
  customerName: string;
  orderId: string;
  status: 'processing' | 'ready' | 'delivered';
}) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'order_status_update',
        to: data.customerEmail,
        data,
      }),
    });

    if (!response.ok) throw new Error('Failed to send email');
    return await response.json();
  } catch (error) {
    console.error('Email send error:', error);
  }
}

export async function sendAdminMessageEmail(data: {
  customerEmail: string;
  customerName: string;
  message: string;
}) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'admin_message',
        to: data.customerEmail,
        data,
      }),
    });

    if (!response.ok) throw new Error('Failed to send email');
    return await response.json();
  } catch (error) {
    console.error('Email send error:', error);
  }
}

export async function sendOrderReadyEmail(data: {
  customerEmail: string;
  customerName: string;
  orderId: string;
  pickupLocation?: string;
  finalPaymentPending?: boolean;
  remainingAmount?: number;
}) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'order_ready',
        to: data.customerEmail,
        data,
      }),
    });

    if (!response.ok) throw new Error('Failed to send email');
    return await response.json();
  } catch (error) {
    console.error('Email send error:', error);
  }
}

export async function sendPaymentReminderEmail(data: {
  customerEmail: string;
  customerName: string;
  orderId: string;
  amount: number;
}) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'payment_reminder',
        to: data.customerEmail,
        data,
      }),
    });

    if (!response.ok) throw new Error('Failed to send email');
    return await response.json();
  } catch (error) {
    console.error('Email send error:', error);
  }
}
