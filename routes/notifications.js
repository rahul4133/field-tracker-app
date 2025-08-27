const express = require('express');
const router = express.Router();
const axios = require('axios');
const { auth, authorize } = require('../middleware/auth');

// Interakt.shop WhatsApp API configuration
const interaktConfig = {
  apiKey: process.env.INTERAKT_API_KEY,
  baseURL: process.env.INTERAKT_BASE_URL || 'https://api.interakt.ai'
};

// SMSMeNow SMS API configuration
const smsConfig = {
  apiKey: process.env.SMSMENOW_API_KEY,
  senderId: process.env.SMSMENOW_SENDER_ID,
  baseURL: process.env.SMSMENOW_BASE_URL || 'http://sms.smsmenow.in'
};

// Send SMS notification via SMSMeNow
router.post('/sms', auth, async (req, res) => {
  try {
    const { to, message, customerName, templateId } = req.body;

    if (!smsConfig.apiKey || !smsConfig.senderId) {
      return res.status(500).json({ message: 'SMS service not configured' });
    }

    const messageBody = `Dear ${customerName || 'Customer'},\n\n${message}\n\nThank you for your business!`;

    const smsData = {
      username: smsConfig.apiKey,
      password: process.env.SMSMENOW_PASSWORD,
      sender: smsConfig.senderId,
      mobile: to.replace(/^\+91/, '').replace(/^\+/, ''),
      message: messageBody,
      type: 'text'
    };

    if (templateId) {
      smsData.template_id = templateId;
    }

    const response = await axios.post(`${smsConfig.baseURL}/api/send-sms`, smsData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    res.json({
      success: true,
      messageId: response.data.message_id || response.data.id,
      message: 'SMS sent successfully',
      response: response.data
    });
  } catch (error) {
    console.error('SMS send error:', error);
    res.status(500).json({ 
      message: 'Error sending SMS', 
      error: error.response?.data || error.message 
    });
  }
});

// Send WhatsApp notification via Interakt.shop
router.post('/whatsapp', auth, async (req, res) => {
  try {
    const { to, message, customerName, templateName, templateParams } = req.body;

    if (!interaktConfig.apiKey) {
      return res.status(500).json({ message: 'WhatsApp service not configured' });
    }

    const phoneNumber = to.replace(/^\+/, '').replace(/^91/, '');
    
    let whatsappData;
    
    if (templateName) {
      // Template message
      whatsappData = {
        countryCode: "+91",
        phoneNumber: phoneNumber,
        type: "Template",
        template: {
          name: templateName,
          languageCode: "en",
          headerValues: templateParams?.header || [],
          bodyValues: templateParams?.body || [customerName || 'Customer', message],
          buttonValues: templateParams?.buttons || {}
        }
      };
    } else {
      // Text message
      whatsappData = {
        countryCode: "+91",
        phoneNumber: phoneNumber,
        type: "Text",
        message: `Dear ${customerName || 'Customer'},\n\n${message}\n\nThank you for your business!`
      };
    }

    const response = await axios.post(`${interaktConfig.baseURL}/v1/public/message/`, whatsappData, {
      headers: {
        'Authorization': `Basic ${Buffer.from(interaktConfig.apiKey + ':').toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({
      success: true,
      messageId: response.data.id,
      message: 'WhatsApp message sent successfully',
      response: response.data
    });
  } catch (error) {
    console.error('WhatsApp send error:', error);
    res.status(500).json({ 
      message: 'Error sending WhatsApp message', 
      error: error.response?.data || error.message 
    });
  }
});

// Send payment confirmation notification
router.post('/payment-confirmation', auth, async (req, res) => {
  try {
    const { customerId, paymentId, amount, method, receiptNumber, phone, customerName, notificationType } = req.body;

    const message = `Payment Confirmation\n\nAmount: ₹${amount}\nMethod: ${method.toUpperCase()}\nReceipt No: ${receiptNumber}\nDate: ${new Date().toLocaleDateString()}\n\nPayment received successfully.`;

    let result;
    
    if (notificationType === 'whatsapp') {
      if (!interaktConfig.apiKey) {
        return res.status(500).json({ message: 'WhatsApp service not configured' });
      }
      
      const whatsappData = {
        countryCode: "+91",
        phoneNumber: phone.replace(/^\+/, '').replace(/^91/, ''),
        type: "Text",
        message: `Dear ${customerName},\n\n${message}\n\nThank you for your payment!`
      };

      result = await axios.post(`${interaktConfig.baseURL}/v1/public/message/`, whatsappData, {
        headers: {
          'Authorization': `Basic ${Buffer.from(interaktConfig.apiKey + ':').toString('base64')}`,
          'Content-Type': 'application/json'
        }
      });
    } else {
      if (!smsConfig.apiKey) {
        return res.status(500).json({ message: 'SMS service not configured' });
      }
      
      const smsData = {
        username: smsConfig.apiKey,
        password: process.env.SMSMENOW_PASSWORD,
        sender: smsConfig.senderId,
        mobile: phone.replace(/^\+91/, '').replace(/^\+/, ''),
        message: `Dear ${customerName},\n\n${message}\n\nThank you for your payment!`,
        type: 'text'
      };

      result = await axios.post(`${smsConfig.baseURL}/api/send-sms`, smsData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    res.json({
      message: `Payment confirmation sent via ${notificationType}`,
      messageId: result.sid,
      status: result.status
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ message: 'Error sending payment confirmation', error: error.message });
  }
});

// Send visit reminder notification
router.post('/visit-reminder', auth, async (req, res) => {
  try {
    const { customerName, phone, visitDate, employeeName, notificationType } = req.body;

    if (!interaktConfig.apiKey && !smsConfig.apiKey) {
      return res.status(500).json({ message: 'Notification service not configured' });
    }

    const message = `Visit Reminder\n\nDear ${customerName},\n\nThis is a reminder that ${employeeName} will be visiting you on ${new Date(visitDate).toLocaleDateString()} for a scheduled appointment.\n\nPlease be available at the scheduled time.\n\nThank you!`;

    let result;
    
    if (notificationType === 'whatsapp') {
      const whatsappData = {
        countryCode: "+91",
        phoneNumber: phone.replace(/^\+/, '').replace(/^91/, ''),
        type: "Text",
        message: message
      };

      result = await axios.post(`${interaktConfig.baseURL}/v1/public/message/`, whatsappData, {
        headers: {
          'Authorization': `Basic ${Buffer.from(interaktConfig.apiKey + ':').toString('base64')}`,
          'Content-Type': 'application/json'
        }
      });
    } else {
      const smsData = {
        username: smsConfig.apiKey,
        password: process.env.SMSMENOW_PASSWORD,
        sender: smsConfig.senderId,
        mobile: phone.replace(/^\+91/, '').replace(/^\+/, ''),
        message: message,
        type: 'text'
      };

      result = await axios.post(`${smsConfig.baseURL}/api/send-sms`, smsData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    res.json({
      message: `Visit reminder sent via ${notificationType}`,
      messageId: result.sid,
      status: result.status
    });
  } catch (error) {
    console.error('Visit reminder error:', error);
    res.status(500).json({ message: 'Error sending visit reminder', error: error.message });
  }
});

// Send bulk notifications
router.post('/bulk', auth, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { customers, message, notificationType } = req.body;

    if (!interaktConfig.apiKey && !smsConfig.apiKey) {
      return res.status(500).json({ message: 'Notification service not configured' });
    }

    if (!Array.isArray(customers) || customers.length === 0) {
      return res.status(400).json({ message: 'No customers provided' });
    }

    const results = [];
    const errors = [];

    for (const customer of customers) {
      try {
        let result;
        const messageBody = `Dear ${customer.name},\n\n${message}\n\nThank you for your business!`;

        if (notificationType === 'whatsapp') {
          const whatsappData = {
            countryCode: "+91",
            phoneNumber: customer.phone.replace(/^\+/, '').replace(/^91/, ''),
            type: "Text",
            message: messageBody
          };

          result = await axios.post(`${interaktConfig.baseURL}/v1/public/message/`, whatsappData, {
            headers: {
              'Authorization': `Basic ${Buffer.from(interaktConfig.apiKey + ':').toString('base64')}`,
              'Content-Type': 'application/json'
            }
          });
        } else {
          const smsData = {
            username: smsConfig.apiKey,
            password: process.env.SMSMENOW_PASSWORD,
            sender: smsConfig.senderId,
            mobile: customer.phone.replace(/^\+91/, '').replace(/^\+/, ''),
            message: messageBody,
            type: 'text'
          };

          result = await axios.post(`${smsConfig.baseURL}/api/send-sms`, smsData, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
        }

        results.push({
          customerId: customer.id,
          customerName: customer.name,
          phone: customer.phone,
          messageId: result.sid,
          status: result.status
        });
      } catch (error) {
        errors.push({
          customerId: customer.id,
          customerName: customer.name,
          phone: customer.phone,
          error: error.message
        });
      }
    }

    res.json({
      message: `Bulk notifications sent via ${notificationType}`,
      successful: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error) {
    console.error('Bulk notification error:', error);
    res.status(500).json({ message: 'Error sending bulk notifications', error: error.message });
  }
});

module.exports = router;
