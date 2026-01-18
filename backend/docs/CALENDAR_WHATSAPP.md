# Calendar Management & WhatsApp Integration

## Overview

This system provides advanced calendar management for doctors with customizable time slots, working hours, and emergency cancellation features. It includes WhatsApp Business API integration for automated patient notifications.

## Features

### 1. **Doctor Calendars**
- Each doctor has their own calendar with customizable settings
- Timezone support
- Active/inactive status management

### 2. **Working Hours**
- Define weekly working hours for each day (0=Sunday, 6=Saturday)
- Multiple time slots per day
- Easy enable/disable functionality

### 3. **Custom Time Slots**
- Configurable appointment durations (15, 30, 45, 60, 90, 120, 180 minutes)
- Break duration between appointments
- Maximum appointments per slot

### 4. **Calendar Exceptions**
- **Types**: Holiday, Vacation, Emergency, Block
- **Auto-cancellation**: Optionally cancel all appointments in exception range
- **Patient notification**: Auto-notify affected patients via WhatsApp

### 5. **Emergency Cancellation**
- Instantly cancel all appointments in a time range
- Automatically sends WhatsApp notifications to all affected patients
- Tracks cancellation reasons and history

### 6. **WhatsApp Integration**
- **Message Types**:
  - Appointment Scheduled
  - Appointment Confirmed
  - Appointment Rescheduled
  - Appointment Cancelled
  - Appointment Reminder
  - Emergency Cancellation

- **Features**:
  - Customizable message templates
  - Variable replacement (patient name, date, time, doctor, etc.)
  - Message delivery tracking (pending, sent, delivered, read, failed)
  - Complete message history per appointment

## API Endpoints

### Calendar Management

#### Get/Create Doctor Calendar
```http
GET /api/v1/calendars/doctor/:doctorId
```
Auto-creates calendar if doesn't exist.

#### Update Calendar
```http
PUT /api/v1/calendars/:id
```
**Body:**
```json
{
  "name": "Updated Calendar Name",
  "description": "Calendar description",
  "timezone": "America/New_York",
  "is_active": true
}
```

### Working Hours

#### Get Working Hours
```http
GET /api/v1/calendars/:calendarId/working-hours
```

#### Create Working Hours
```http
POST /api/v1/calendars/:calendarId/working-hours
```
**Body:**
```json
{
  "day_of_week": 1,
  "start_time": "09:00:00",
  "end_time": "17:00:00",
  "is_active": true
}
```

#### Update Working Hours
```http
PUT /api/v1/calendars/working-hours/:id
```

#### Delete Working Hours
```http
DELETE /api/v1/calendars/working-hours/:id
```

### Time Slots

#### Get Time Slots
```http
GET /api/v1/calendars/:calendarId/time-slots
```

#### Create Time Slot
```http
POST /api/v1/calendars/:calendarId/time-slots
```
**Body:**
```json
{
  "slot_duration": 30,
  "break_duration": 5,
  "max_appointments_per_slot": 1,
  "is_active": true
}
```

#### Update Time Slot
```http
PUT /api/v1/calendars/time-slots/:id
```

### Calendar Exceptions

#### Get Exceptions
```http
GET /api/v1/calendars/:calendarId/exceptions?startDate=2025-12-01&endDate=2025-12-31
```

#### Create Exception
```http
POST /api/v1/calendars/:calendarId/exceptions
```
**Body:**
```json
{
  "exception_type": "vacation",
  "start_datetime": "2025-12-20T00:00:00Z",
  "end_datetime": "2025-12-27T23:59:59Z",
  "reason": "Holiday vacation",
  "cancel_appointments": true,
  "notify_patients": true
}
```

#### Update Exception
```http
PUT /api/v1/calendars/exceptions/:id
```

#### Delete Exception
```http
DELETE /api/v1/calendars/exceptions/:id
```

### Preview & Actions

#### Preview Affected Appointments
```http
GET /api/v1/calendars/:calendarId/affected-appointments?startDatetime=2025-12-01T09:00:00Z&endDatetime=2025-12-01T17:00:00Z
```
Returns list of appointments that would be affected by an exception.

#### Block Time Range
```http
POST /api/v1/calendars/:calendarId/block-time-range
```
**Body:**
```json
{
  "startDatetime": "2025-12-15T14:00:00Z",
  "endDatetime": "2025-12-15T16:00:00Z",
  "reason": "Staff meeting",
  "cancelExisting": true,
  "notifyPatients": true
}
```

#### Emergency Cancel Range
```http
POST /api/v1/calendars/:calendarId/emergency-cancel
```
**Body:**
```json
{
  "startDatetime": "2025-12-01T09:00:00Z",
  "endDatetime": "2025-12-01T17:00:00Z",
  "reason": "Doctor emergency"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "exception": {...},
    "cancellation": {
      "cancelled": 8,
      "notified": 8
    }
  },
  "message": "Emergency cancellation completed. 8 appointments cancelled, 8 patients notified."
}
```

### WhatsApp Notifications

#### Send Scheduled Notification
```http
POST /api/v1/whatsapp/send/scheduled/:appointmentId
```

#### Send Confirmed Notification
```http
POST /api/v1/whatsapp/send/confirmed/:appointmentId
```

#### Send Rescheduled Notification
```http
POST /api/v1/whatsapp/send/rescheduled/:appointmentId
```
**Body:**
```json
{
  "oldStartAt": "2025-12-01T10:00:00Z",
  "newStartAt": "2025-12-01T14:00:00Z"
}
```

#### Send Cancelled Notification
```http
POST /api/v1/whatsapp/send/cancelled/:appointmentId
```
**Body:**
```json
{
  "reason": "Doctor emergency",
  "isEmergency": true
}
```

#### Send Reminder Notification
```http
POST /api/v1/whatsapp/send/reminder/:appointmentId
```

#### Get Message History
```http
GET /api/v1/whatsapp/messages/:appointmentId
```

#### Get Templates
```http
GET /api/v1/whatsapp/templates
```

## Database Schema

### Tables Created
1. **doctor_calendars** - Calendar configurations
2. **doctor_working_hours** - Weekly working schedules
3. **doctor_time_slots** - Time slot configurations
4. **calendar_exceptions** - Holidays, vacations, emergencies
5. **whatsapp_messages** - Message delivery tracking
6. **whatsapp_templates** - Message templates with variables

## Setup Instructions

### 1. Run Database Migration
```bash
psql -U postgres -d obgyn_clinic -f backend/database/migrations/007_create_calendar_tables.sql
```

### 2. Configure WhatsApp Business API

1. Go to [Meta Business Suite](https://business.facebook.com/)
2. Create a WhatsApp Business Account
3. Get your Phone Number ID and Access Token
4. Update `.env` file:
```env
WHATSAPP_API_URL=https://graph.facebook.com/v17.0
WHATSAPP_PHONE_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
```

### 3. Test WhatsApp Integration
```bash
# Send a test scheduled notification
curl -X POST http://localhost:5000/api/v1/whatsapp/send/scheduled/{appointmentId} \
  -H "Authorization: Bearer {token}"
```

## Automatic Notifications

The system automatically sends WhatsApp notifications when:

1. **Creating Appointment**: Sends "Scheduled" notification
2. **Status Changed to Confirmed**: Sends "Confirmed" notification
3. **Start Time Changed**: Sends "Rescheduled" notification
4. **Status Changed to Cancelled**: Sends "Cancelled" notification
5. **Emergency Cancellation**: Sends "Emergency Cancellation" to all affected patients

## Message Templates

Default templates include placeholders:
- `{patient_name}` - Patient's full name
- `{appointment_date}` - Formatted date
- `{appointment_time}` - Formatted time
- `{doctor_name}` - Doctor's full name
- `{appointment_type}` - Type of appointment
- `{old_date}`, `{old_time}` - For rescheduling
- `{new_date}`, `{new_time}` - For rescheduling
- `{cancellation_reason}` - Reason for cancellation

## Usage Examples

### Example 1: Set Up Doctor's Weekly Schedule
```javascript
// 1. Get/Create calendar
const calendar = await fetch('/api/v1/calendars/doctor/{doctorId}');

// 2. Add working hours (Monday-Friday, 9 AM - 5 PM)
for (let day = 1; day <= 5; day++) {
  await fetch(`/api/v1/calendars/${calendar.id}/working-hours`, {
    method: 'POST',
    body: JSON.stringify({
      day_of_week: day,
      start_time: '09:00:00',
      end_time: '17:00:00',
      is_active: true
    })
  });
}

// 3. Set time slot configuration
await fetch(`/api/v1/calendars/${calendar.id}/time-slots`, {
  method: 'POST',
  body: JSON.stringify({
    slot_duration: 30,
    break_duration: 5,
    max_appointments_per_slot: 1,
    is_active: true
  })
});
```

### Example 2: Emergency Cancellation
```javascript
// Cancel all appointments for today due to emergency
const result = await fetch(`/api/v1/calendars/${calendarId}/emergency-cancel`, {
  method: 'POST',
  body: JSON.stringify({
    startDatetime: new Date().toISOString(),
    endDatetime: new Date(new Date().setHours(23, 59, 59)).toISOString(),
    reason: 'Doctor emergency - will reschedule soon'
  })
});

console.log(`Cancelled ${result.data.cancellation.cancelled} appointments`);
console.log(`Notified ${result.data.cancellation.notified} patients`);
```

### Example 3: Schedule Vacation
```javascript
// Block December 20-27 for vacation
await fetch(`/api/v1/calendars/${calendarId}/exceptions`, {
  method: 'POST',
  body: JSON.stringify({
    exception_type: 'vacation',
    start_datetime: '2025-12-20T00:00:00Z',
    end_datetime: '2025-12-27T23:59:59Z',
    reason: 'Annual vacation',
    cancel_appointments: true,
    notify_patients: true
  })
});
```

## Troubleshooting

### WhatsApp Messages Not Sending
1. Verify `WHATSAPP_PHONE_ID` and `WHATSAPP_ACCESS_TOKEN` in `.env`
2. Check phone number format (should be international format without +)
3. Verify WhatsApp Business Account is active
4. Check message logs in `whatsapp_messages` table

### Emergency Cancellation Not Working
1. Ensure calendar ID is correct
2. Verify datetime range includes appointments
3. Check appointment status (only scheduled/confirmed are cancelled)
4. Review logs for specific errors

## Security Notes

- All endpoints require authentication
- WhatsApp API tokens should be kept secure
- Message history is logged for compliance
- Failed messages are tracked with error details

## Future Enhancements

- SMS fallback if WhatsApp fails
- Email notifications
- Automated reminders (cron job)
- Patient self-service rescheduling via WhatsApp
- Multi-language template support
- Analytics dashboard for message delivery rates

