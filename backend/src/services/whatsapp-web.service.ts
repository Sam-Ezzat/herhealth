import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import path from 'path';
import fs from 'fs';

interface WhatsAppWebClient {
  client: Client | null;
  isReady: boolean;
  qrCode: string | null;
  isInitializing: boolean;
}

const whatsappWeb: WhatsAppWebClient = {
  client: null,
  isReady: false,
  qrCode: null,
  isInitializing: false
};

// Initialize WhatsApp Web client
export const initializeWhatsAppWeb = async (): Promise<void> => {
  if (whatsappWeb.client || whatsappWeb.isInitializing) {
    console.log('WhatsApp Web client already initialized or initializing');
    return;
  }

  try {
    whatsappWeb.isInitializing = true;
    whatsappWeb.qrCode = null;
    whatsappWeb.isReady = false;

    if (process.env.NODE_ENV === 'production') {
      if (!process.env.PUPPETEER_CACHE_DIR) {
        process.env.PUPPETEER_CACHE_DIR = path.join('/tmp', 'puppeteer');
      }
      if (!process.env.PUPPETEER_TMP_DIR) {
        process.env.PUPPETEER_TMP_DIR = '/tmp';
      }
    }

    // Create session directory if it doesn't exist
    // Use a writable path in production (serverless environments are often read-only)
    const sessionPath = process.env.WHATSAPP_WEB_AUTH_PATH
      ? path.resolve(process.env.WHATSAPP_WEB_AUTH_PATH)
      : process.env.NODE_ENV === 'production'
        ? path.join('/tmp', '.wwebjs_auth')
        : path.join(process.cwd(), '.wwebjs_auth');
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }

    let chromiumArgs: string[] = [];
    let chromiumExecutablePath: string | undefined = process.env.PUPPETEER_EXECUTABLE_PATH;

    if (process.env.NODE_ENV === 'production' && !chromiumExecutablePath) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const chromium = require('@sparticuz/chromium');
        chromiumArgs = chromium.args || [];
        chromiumExecutablePath = await chromium.executablePath();
      } catch (chromiumError) {
        console.warn('Chromium dependency not available, falling back to default Puppeteer behavior.');
      }
    }

    whatsappWeb.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: sessionPath
      }),
      puppeteer: {
        headless: true,
        executablePath: chromiumExecutablePath,
        args: [
          ...chromiumArgs,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      }
    });

    // QR Code event
    whatsappWeb.client.on('qr', (qr) => {
      console.log('QR Code received, scan with WhatsApp mobile app');
      whatsappWeb.qrCode = qr;
      
      // Display QR in terminal for development
      qrcode.generate(qr, { small: true });
    });

    // Ready event
    whatsappWeb.client.on('ready', () => {
      console.log('WhatsApp Web client is ready!');
      whatsappWeb.isReady = true;
      whatsappWeb.qrCode = null;
      whatsappWeb.isInitializing = false;
    });

    // Authentication events
    whatsappWeb.client.on('authenticated', () => {
      console.log('WhatsApp Web authenticated');
    });

    whatsappWeb.client.on('auth_failure', (msg) => {
      console.error('WhatsApp Web authentication failure:', msg);
      whatsappWeb.isReady = false;
      whatsappWeb.qrCode = null;
      whatsappWeb.isInitializing = false;
    });

    // Disconnected event
    whatsappWeb.client.on('disconnected', (reason) => {
      console.log('WhatsApp Web disconnected:', reason);
      whatsappWeb.isReady = false;
      whatsappWeb.qrCode = null;
      whatsappWeb.client = null;
      whatsappWeb.isInitializing = false;
    });

    // Initialize the client
    await whatsappWeb.client.initialize();
    console.log('WhatsApp Web client initialization started...');

  } catch (error: any) {
    console.error('Error initializing WhatsApp Web:', error);
    whatsappWeb.isInitializing = false;
    whatsappWeb.client = null;
    throw error;
  }
};

// Send message via WhatsApp Web
export const sendWhatsAppWebMessage = async (
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    if (!whatsappWeb.client || !whatsappWeb.isReady) {
      return {
        success: false,
        error: 'WhatsApp Web client is not ready. Please scan QR code first.'
      };
    }

    // Format phone number - remove all non-numeric characters
    let formattedPhone = phoneNumber.replace(/[^0-9]/g, '');
    
    console.log('Original phone number:', phoneNumber);
    console.log('Formatted phone number (raw):', formattedPhone);
    
    // Remove leading zeros
    formattedPhone = formattedPhone.replace(/^0+/, '');
    
    // Add country code if not present
    // Egyptian mobile numbers are 10 digits starting with 1 (after removing leading 0)
    // They need country code 20 prepended
    if (formattedPhone.length === 10) {
      // Egyptian number (10 digits starting with 1): add 20
      if (formattedPhone.startsWith('1')) {
        formattedPhone = '20' + formattedPhone;
      }
      // Pakistan number (10 digits starting with 3): add 92
      else if (formattedPhone.startsWith('3')) {
        formattedPhone = '92' + formattedPhone;
      }
      // Default: assume Egypt
      else {
        formattedPhone = '20' + formattedPhone;
      }
    }
    // If it starts with 20 (Egypt) and has 12+ digits, it might have an extra leading digit
    else if (formattedPhone.startsWith('20') && formattedPhone.length > 12) {
      console.warn('Egyptian number appears to have extra digits. Length:', formattedPhone.length);
      // Egyptian format should be: 20 + 10 digits = 12 digits total
      // If it's 201226470484 (12 digits), check if it should be 20 + 1226470484 (not valid)
      // Egyptian numbers after 20 should start with 1 and be exactly 10 digits
      const withoutCountryCode = formattedPhone.substring(2);
      if (withoutCountryCode.length === 10 && withoutCountryCode.startsWith('1')) {
        // This is correct: 20 + 10 digits starting with 1
        console.log('Valid Egyptian format detected: 20 + 10 digits');
      } else if (withoutCountryCode.length > 10) {
        console.warn(`Invalid Egyptian number format. After country code (20): ${withoutCountryCode} (${withoutCountryCode.length} digits)`);
        console.warn('Egyptian mobile numbers should be: 20 + 10 digits starting with 1');
      }
    }
    // If it's not 10 digits, check if it already has a country code
    else if (formattedPhone.length > 10 && formattedPhone.length <= 15) {
      // Already has country code, use as-is
      console.log('Number already appears to have country code');
    }
    else {
      console.warn('Unexpected phone number format, length:', formattedPhone.length);
    }
    
    console.log('Formatted phone number (with country code):', formattedPhone);
    
    // WhatsApp Web format: number@c.us
    const chatId = `${formattedPhone}@c.us`;
    console.log('Chat ID:', chatId);

    // First, verify the number is registered on WhatsApp
    console.log('🔍 Checking if number is registered on WhatsApp...');
    try {
      const isRegistered = await whatsappWeb.client.isRegisteredUser(chatId);
      console.log(`Registration status: ${isRegistered ? '✅ Registered' : '❌ Not registered'}`);
      
      if (!isRegistered) {
        return {
          success: false,
          error: `Phone number ${formattedPhone} is not registered on WhatsApp`
        };
      }
    } catch (regError: any) {
      console.warn('⚠️ Could not verify registration status:', regError.message);
      console.log('Proceeding with send attempt anyway...');
      // Continue anyway - some versions might not support this check
    }

    // Try to get the chat to see if it exists
    let chatExists = false;
    try {
      const chat = await whatsappWeb.client.getChatById(chatId);
      console.log('💬 Chat found:', chat.name || chat.id._serialized);
      chatExists = true;
    } catch (chatError: any) {
      console.log('💬 Chat not found in contacts, will be created on first message');
    }

    // Send the message with options to disable automatic "mark as seen"
    console.log('📤 Sending message with sendSeen disabled...');
    try {
      // First attempt: with sendSeen: false option
      const sentMessage = await whatsappWeb.client.sendMessage(chatId, message, {
        sendSeen: false
      });
      
      if (sentMessage && sentMessage.id && sentMessage.id.id) {
        console.log('✅ Message sent successfully! Message ID:', sentMessage.id.id);
        console.log('📱 Message details:', {
          to: sentMessage.to,
          from: sentMessage.from,
          timestamp: sentMessage.timestamp,
          type: sentMessage.type
        });
        
        return {
          success: true,
          messageId: sentMessage.id.id
        };
      } else {
        console.error('⚠️ Message sent but no ID received:', sentMessage);
        return {
          success: false,
          error: 'Message sent but could not get confirmation'
        };
      }
    } catch (sendError: any) {
      console.error('❌ Failed to send message:', sendError.message);
      
      // If it's the markedUnread error, the message might still have been sent
      // This is a known issue with WhatsApp Web when trying to mark chats as seen
      if (sendError.message && sendError.message.includes('markedUnread')) {
        console.log('⚠️ Message likely sent but could not mark chat as seen');
        console.log('💡 Please check WhatsApp Web manually to confirm delivery');
        
        return {
          success: false,
          error: 'Message may have been sent, but encountered an error marking chat as seen. Please check WhatsApp Web to confirm.'
        };
      }
      
      // Check if it's a number registration error
      if (sendError.message && (
        sendError.message.includes('not registered') ||
        sendError.message.includes('is not a WhatsApp user') ||
        sendError.message.includes('phone number is not registered')
      )) {
        return {
          success: false,
          error: `Phone number ${formattedPhone} is not registered on WhatsApp`
        };
      }
      
      // Re-throw other errors with more context
      throw new Error(`WhatsApp send failed: ${sendError.message}`);
    }

  } catch (error: any) {
    console.error('WhatsApp Web send error:', error);
    console.error('Error details:', error.message, error.stack);
    return {
      success: false,
      error: error.message || 'Failed to send message'
    };
  }
};

// Get WhatsApp Web status
export const getWhatsAppWebStatus = (): {
  isReady: boolean;
  qrCode: string | null;
  isInitializing: boolean;
} => {
  return {
    isReady: whatsappWeb.isReady,
    qrCode: whatsappWeb.qrCode,
    isInitializing: whatsappWeb.isInitializing
  };
};

// Disconnect WhatsApp Web
export const disconnectWhatsAppWeb = async (): Promise<void> => {
  if (whatsappWeb.client) {
    try {
      await whatsappWeb.client.destroy();
      whatsappWeb.client = null;
      whatsappWeb.isReady = false;
      whatsappWeb.qrCode = null;
      whatsappWeb.isInitializing = false;
      console.log('WhatsApp Web client disconnected');
    } catch (error: any) {
      console.error('Error disconnecting WhatsApp Web:', error);
      throw error;
    }
  }
};

// Check if number is registered on WhatsApp
export const isRegisteredOnWhatsApp = async (phoneNumber: string): Promise<boolean> => {
  try {
    if (!whatsappWeb.client || !whatsappWeb.isReady) {
      return false;
    }

    let formattedPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (!formattedPhone.startsWith('92') && formattedPhone.length === 10) {
      formattedPhone = '92' + formattedPhone;
    }

    const numberId = await whatsappWeb.client.getNumberId(`${formattedPhone}@c.us`);
    return numberId !== null;

  } catch (error: any) {
    console.error('Error checking WhatsApp registration:', error);
    return false;
  }
};

// Get client info
export const getWhatsAppWebClientInfo = async (): Promise<any> => {
  if (!whatsappWeb.client || !whatsappWeb.isReady) {
    return null;
  }

  try {
    const info = await whatsappWeb.client.info;
    return {
      phoneNumber: info.wid.user,
      name: info.pushname,
      platform: info.platform
    };
  } catch (error: any) {
    console.error('Error getting client info:', error);
    return null;
  }
};
