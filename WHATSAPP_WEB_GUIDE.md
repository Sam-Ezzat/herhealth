# 📱 WhatsApp Integration Guide

## Two Modes Available

### 🔵 **Business API Mode** (Production)
- Official Meta WhatsApp Business API
- Requires verification and setup through Meta Business Suite
- Production-ready and reliable
- Supports high volume messaging

### 🟢 **WhatsApp Web Mode** (Development/Testing)
- Uses whatsapp-web.js to connect via web.whatsapp.com
- Perfect for development and testing
- No Meta setup required - just scan QR code
- ⚠️ Not recommended for production (against WhatsApp ToS)

---

## 🚀 Quick Start - WhatsApp Web Mode

### 1. Start Backend
```bash
cd backend
npm run dev
```

### 2. Open WhatsApp Settings
- Navigate to **Settings → WhatsApp Settings**
- You'll see two mode options

### 3. Select WhatsApp Web Mode
- Click on **"WhatsApp Web"** mode
- Click **"Connect WhatsApp Web"** button

### 4. Scan QR Code
- A QR code will appear on screen
- Open WhatsApp on your phone
- Go to: **Settings → Linked Devices → Link a Device**
- Scan the QR code displayed on screen

### 5. Done! ✅
- Once scanned, you'll see "Connected Successfully!"
- Your WhatsApp account info will display
- All messages will now send through your connected WhatsApp

---

## 🔄 Switching Between Modes

### To Switch to WhatsApp Web:
1. Go to WhatsApp Settings
2. Click on "WhatsApp Web" card
3. Click "Connect WhatsApp Web"
4. Scan QR code

### To Switch to Business API:
1. Go to WhatsApp Settings
2. Click on "Business API" card
3. Enter your Meta Business API credentials
4. Save configuration

---

## 📨 Sending Messages

### Messages are sent automatically for:
- ✅ Appointment Scheduled
- ✅ Appointment Confirmed
- ✅ Appointment Rescheduled
- ❌ Appointment Cancelled
- ⏰ Appointment Reminder (24h before)

### Send Custom Messages:
- Go to **WhatsApp Messages** page
- Select a patient
- Type your message
- Click "Send Message"

---

## 🔧 Technical Details

### WhatsApp Web Features:
- **Session Persistence**: Your session is saved locally in `.wwebjs_auth/`
- **Auto-reconnect**: Automatically reconnects if disconnected
- **QR Refresh**: QR code refreshes if not scanned within timeout
- **Phone Number Format**: Automatically formats numbers (supports international)

### Phone Number Format:
- Input: `03001234567` or `+923001234567`
- Auto-formatted to: `923001234567@c.us` (WhatsApp ID)

### Session Storage:
- Location: `backend/.wwebjs_auth/`
- Contains: Encrypted session data
- ⚠️ Add to `.gitignore` (security)

---

## ⚠️ Important Notes

### WhatsApp Web Mode:
- ✅ Perfect for **development and testing**
- ✅ No costs, no setup complexity
- ❌ **Not for production** (violates WhatsApp ToS)
- ❌ Risk of account ban if detected
- ❌ Session can expire (need to re-scan)
- ❌ Requires backend to stay running

### Business API Mode:
- ✅ **Production ready**
- ✅ Official and compliant
- ✅ Reliable and scalable
- ✅ Webhook support
- ❌ Requires business verification
- ❌ Costs apply for messages
- ❌ Template restrictions

---

## 🐛 Troubleshooting

### QR Code Not Showing
```bash
# Restart backend
cd backend
npm run dev
```

### "Client Not Ready" Error
- Wait a few seconds after scanning QR
- Check if QR was scanned successfully
- Try disconnecting and reconnecting

### Session Expired
- Click "Disconnect"
- Click "Connect WhatsApp Web" again
- Scan new QR code

### Messages Not Sending
- Check phone number format
- Ensure WhatsApp Web is connected (green status)
- Check if recipient has WhatsApp
- View error in message history

---

## 🔐 Security Best Practice

### Add to `.gitignore`:
```
# WhatsApp Web Session
backend/.wwebjs_auth/
backend/.wwebjs_cache/
```

### For Production:
- Always use **Business API mode**
- Store API credentials in environment variables
- Never commit API tokens to Git
- Use secure secrets management

---

## 📊 Monitoring

### Check Connection Status:
- Go to WhatsApp Settings
- Look for status card (green = connected)
- View connected phone number and name

### View Message History:
- Go to WhatsApp Messages page
- See all sent messages with status
- Filter by patient, status, date
- View delivery status (sent, delivered, read, failed)

---

## 🎯 Recommendations

### Development:
✅ Use **WhatsApp Web mode**
- Quick setup
- No costs
- Easy testing

### Production:
✅ Use **Business API mode**
- Reliable
- Compliant
- Scalable
- Professional

---

## 📞 Need Help?

If you encounter issues:
1. Check backend console for errors
2. Verify phone number format
3. Ensure WhatsApp is open on phone
4. Try disconnecting and reconnecting
5. Check `.wwebjs_auth/` permissions

---

**Happy Messaging! 🚀📱💬**
