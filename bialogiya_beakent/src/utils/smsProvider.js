const axios = require('axios');
const { prisma } = require('../config/db');
const { decrypt } = require('./encryption');

/**
 * Format Uzbek phone number to standard 998XXXXXXXXX format
 */
function normalizeUzPhone(phone) {
  if (!phone) return null;
  const cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.startsWith('998') && cleaned.length === 12) return cleaned;
  if (cleaned.length === 9) return '998' + cleaned;
  if (cleaned.startsWith('+998')) return cleaned.slice(1);
  return cleaned;
}

/**
 * Eskiz.uz API Adapter
 */
async function sendViaEskiz(apiKey, to, message, sender = '4546') {
  try {
    // If apiKey is email:password, exchange for token, else use bearer token
    const token = apiKey;
    const phone = normalizeUzPhone(to);
    const response = await axios.post(
      'https://notify.eskiz.uz/api/message/sms/send',
      {
        mobile_phone: phone,
        message,
        from: sender || '4546'
      },
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 8000
      }
    );
    return { success: true, messageId: response.data?.id, cost: 85 };
  } catch (err) {
    console.error('Eskiz SMS error:', err.response?.data || err.message);
    return { success: false, error: err.response?.data?.message || err.message, cost: 0 };
  }
}

/**
 * Playmobile.uz API Adapter
 */
async function sendViaPlaymobile(apiKey, to, message, sender = 'Abdora') {
  try {
    const phone = normalizeUzPhone(to);
    // Playmobile basic auth or bearer
    const [login, password] = (apiKey || '').split(':');
    const authHeader = login && password 
      ? 'Basic ' + Buffer.from(`${login}:${password}`).toString('base64')
      : `Bearer ${apiKey}`;

    const response = await axios.post(
      'https://send.smsxabar.uz/broker-api/send',
      {
        messages: [
          {
            recipient: phone,
            'message-id': 'abdora_' + Date.now(),
            sms: {
              originator: sender || 'Abdora',
              content: { text: message }
            }
          }
        ]
      },
      {
        headers: { Authorization: authHeader },
        timeout: 8000
      }
    );
    return { success: true, response: response.data, cost: 110 };
  } catch (err) {
    console.error('Playmobile SMS error:', err.response?.data || err.message);
    return { success: false, error: err.message, cost: 0 };
  }
}

/**
 * Twilio API Adapter
 */
async function sendViaTwilio(apiKey, to, message, sender = null) {
  try {
    const [accountSid, authToken] = (apiKey || '').split(':');
    const fromNumber = sender || process.env.TWILIO_PHONE_NUMBER || '+1234567890';
    const client = require('twilio')(accountSid, authToken);
    const res = await client.messages.create({
      body: message,
      from: fromNumber,
      to: to.startsWith('+') ? to : '+' + to
    });
    return { success: true, messageId: res.sid, cost: 125 };
  } catch (err) {
    console.error('Twilio SMS error:', err.message);
    return { success: false, error: err.message, cost: 0 };
  }
}

/**
 * Infobip API Adapter
 */
async function sendViaInfobip(apiKey, to, message, sender = 'Abdora') {
  try {
    const baseUrl = process.env.INFOBIP_BASE_URL || 'https://api.infobip.com';
    const response = await axios.post(
      `${baseUrl}/sms/2/text/advanced`,
      {
        messages: [
          {
            destinations: [{ to: normalizeUzPhone(to) }],
            from: sender || 'Abdora',
            text: message
          }
        ]
      },
      {
        headers: { Authorization: `App ${apiKey}` },
        timeout: 8000
      }
    );
    return { success: true, response: response.data, cost: 100 };
  } catch (err) {
    console.error('Infobip SMS error:', err.message);
    return { success: false, error: err.message, cost: 0 };
  }
}

/**
 * Main function: Send SMS for a center using configured provider
 */
async function sendCenterSMS({
  centerId,
  toPhone,
  message,
  trigger = 'custom',
  recipientType = 'parent',
  userId = null
}) {
  if (!centerId || !toPhone || !message) {
    return { success: false, error: 'Missing parameters (centerId, toPhone, message)' };
  }

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { centerId },
      include: { plan: true }
    });

    let provider = 'eskiz';
    let apiKey = process.env.SMS_ESKIZ_KEY || 'test_token';
    let senderName = process.env.SMS_SENDER_NAME || 'Abdora';

    if (subscription) {
      if (subscription.smsProvider === 'byos' && subscription.smsApiKeyEncrypted) {
        provider = 'byos';
        apiKey = decrypt(subscription.smsApiKeyEncrypted, subscription.smsApiKeyIV);
        senderName = subscription.smsSenderName || 'Abdora';
      } else if (subscription.plan && subscription.plan.smsProvider) {
        provider = subscription.plan.smsProvider === 'all' ? 'eskiz' : subscription.plan.smsProvider;
        const envKeyName = `SMS_${provider.toUpperCase()}_KEY`;
        apiKey = process.env[envKeyName] || process.env.SMS_ESKIZ_KEY || apiKey;
      }
    }

    let result = { success: false, cost: 0 };

    if (provider === 'playmobile') {
      result = await sendViaPlaymobile(apiKey, toPhone, message, senderName);
    } else if (provider === 'twilio') {
      result = await sendViaTwilio(apiKey, toPhone, message, senderName);
    } else if (provider === 'infobip') {
      result = await sendViaInfobip(apiKey, toPhone, message, senderName);
    } else {
      // Default to eskiz (or simulation if in test mode without live token)
      if (apiKey && apiKey !== 'test_token') {
        result = await sendViaEskiz(apiKey, toPhone, message, senderName);
      } else {
        // Simulation mode for testing environments
        result = { success: true, cost: 85, simulated: true };
      }
    }

    // Save SMS log
    const log = await prisma.sMSLog.create({
      data: {
        provider,
        toPhone: String(toPhone),
        recipientType,
        trigger,
        messageText: message,
        status: result.success ? 'sent' : 'failed',
        cost: result.cost || 0,
        errorMessage: result.error || null,
        userId,
        centerId,
        subscriptionId: subscription?.id || null
      }
    });

    // Increment counters if sent
    if (result.success && subscription) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          currentMonthSms: { increment: 1 },
          totalSmsSent: { increment: 1 }
        }
      }).catch(() => {});
    }

    return { success: result.success, logId: log.id, cost: result.cost };
  } catch (err) {
    console.error('sendCenterSMS error:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendViaEskiz,
  sendViaPlaymobile,
  sendViaTwilio,
  sendViaInfobip,
  sendCenterSMS
};
