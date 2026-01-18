# WhatsApp Web Integration - Quick Test

## Setup Steps

### 1. Start Backend
```bash
cd backend
npm run dev
```

### 2. Test the Integration

Open your browser and navigate to the frontend, then:

1. **Go to Settings → WhatsApp Settings**

2. **Switch to WhatsApp Web Mode**
   - Click on the "WhatsApp Web" card
   - Mode will automatically switch

3. **Initialize Connection**
   - Click "Connect WhatsApp Web" button
   - Wait for QR code to appear (takes 5-10 seconds)

4. **Scan QR Code**
   - Open WhatsApp on your phone
   - Tap the 3 dots menu → Linked Devices
   - Tap "Link a Device"
   - Scan the QR code on your screen

5. **Verify Connection**
   - Status should change to "Connected Successfully!"
   - You'll see your WhatsApp name and number
   - Green checkmark indicates ready

### 3. Send Test Message

#### Option A: Via UI
1. Go to **WhatsApp Messages** page
2. Select a patient from dropdown
3. Type a message
4. Click "Send Message"
5. Check message status in history below

#### Option B: Via API (Postman/curl)
```bash
# Get auth token first by logging in
# Then send message:

curl -X POST http://localhost:5000/api/whatsapp/messages/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 1,
    "message": "Hello! This is a test message from HerHealth."
  }'
```

### 4. Check Message Status

**In UI:**
- Go to WhatsApp Messages page
- View message history at bottom
- Status will show: pending → sent → delivered → read

**On Your Phone:**
- Open WhatsApp
- Message should appear in patient's chat
- If patient doesn't have WhatsApp, you'll see error

---

## Testing Appointment Notifications

### 1. Create an Appointment
- Go to Calendar
- Create appointment for a patient (ensure patient has phone number)

### 2. Automatic Notification
- Message is automatically sent when appointment is created
- Check WhatsApp Messages page to see it

### 3. Test Other Notifications
```bash
# Confirm appointment
curl -X PUT http://localhost:5000/api/appointments/{id}/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"status": "confirmed"}'

# Reschedule appointment
curl -X PUT http://localhost:5000/api/appointments/{id} \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"start_at": "2025-12-20T10:00:00Z"}'

# Cancel appointment
curl -X DELETE http://localhost:5000/api/appointments/{id} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Troubleshooting

### QR Code Not Appearing
**Check backend console for errors:**
```
WhatsApp Web client initialization started...
QR Code received, scan with WhatsApp mobile app
```

**If you see errors:**
- Make sure Chromium/Chrome is installed
- Check if port 5000 is not blocked
- Try restarting backend

### Message Shows as "Pending"
- Wait 5-10 seconds for status update
- Check if WhatsApp Web is still connected (green status)
- Verify phone number format (should be numbers only)

### "Client Not Ready" Error
- Wait 10 seconds after QR scan
- Backend needs time to authenticate
- Refresh status in WhatsApp Settings

### Session Keeps Disconnecting
- Check if WhatsApp app on phone is online
- Ensure backend stays running
- Session data is in `backend/.wwebjs_auth/` - don't delete it

---

## Phone Number Format

The system auto-formats phone numbers. All these work:

```
Input           →  Formatted (WhatsApp ID)
03001234567     →  923001234567@c.us
+923001234567   →  923001234567@c.us
00923001234567  →  923001234567@c.us
3001234567      →  923001234567@c.us (adds 92)
```

**Note:** Default country code is 92 (Pakistan). Modify in `whatsapp-web.service.ts` if needed.

---

## Checking Connection Status

### Via API:
```bash
curl http://localhost:5000/api/whatsapp/config \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "mode": "web",
    "webStatus": {
      "isReady": true,
      "isInitializing": false,
      "hasQrCode": false
    }
  }
}
```

### Via UI:
- WhatsApp Settings page shows status
- Green = Connected
- Yellow = Not connected / Waiting for QR scan
- Shows connected account info when ready

---

## Session Persistence

**Your WhatsApp Web session is saved!**

- After first QR scan, session is stored in `backend/.wwebjs_auth/`
- Next time you restart backend, it auto-connects
- No need to scan QR again (unless session expires)
- Session expires if:
  - You logout from linked devices in WhatsApp
  - WhatsApp detects unusual activity
  - You delete `.wwebjs_auth/` folder

---

## Monitoring Messages

### Real-time Status Updates:
- **pending**: Message created, waiting to send
- **sent**: Message sent to WhatsApp
- **delivered**: Message delivered to recipient's phone
- **read**: Recipient opened the message
- **failed**: Error occurred (see error_message)

### View in Database:
```sql
SELECT * FROM whatsapp_messages 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## Production Readiness

### ⚠️ For Production, Use Business API Instead:

**Why?**
- WhatsApp Web automation violates ToS
- Risk of account ban
- Session instability
- Not scalable

**Switch to Business API:**
1. Go to WhatsApp Settings
2. Click "Business API" mode
3. Enter Meta Business credentials
4. Save configuration

---

## Environment Variables

Add to `backend/.env`:

```env
# WhatsApp Mode (api or web)
WHATSAPP_MODE=web

# Business API credentials (for api mode)
WHATSAPP_API_URL=https://graph.facebook.com/v17.0
WHATSAPP_PHONE_ID=your_phone_id
WHATSAPP_ACCESS_TOKEN=your_access_token
```

---

## Need Help?

**Check Logs:**
```bash
# Backend console shows:
- QR code in ASCII art
- Connection status
- Message sending status
- Errors and warnings
```

**Common Issues:**
- QR expired: Refresh page and click "Connect" again
- Not sending: Check connection status (must be green)
- Wrong number: Verify patient phone number format
- Failed messages: Check error_message in WhatsApp Messages page

---

**You're all set! 🎉 Start sending messages! 📱💬**
