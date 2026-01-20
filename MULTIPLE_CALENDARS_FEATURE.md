# Multiple Calendars Per Doctor Feature - Implementation Summary

## Overview
Implemented a feature that allows each doctor to have multiple calendars with distinct color codes. When a patient books an appointment, they select a calendar, and the appointment inherits that calendar's color code.

## Database Changes

### Migration File Created
- `backend/database/migrations/008_add_color_code_to_calendars.sql`

### Schema Updates

1. **doctor_calendars table** - Added 3 new columns:
   ```sql
   ALTER TABLE doctor_calendars
   ADD COLUMN color_code varchar(7) DEFAULT '#3B82F6',
   ADD COLUMN color_name varchar(100),
   ADD COLUMN notes text;
   ```

2. **appointments table** - Added 1 new column:
   ```sql
   ALTER TABLE appointments
   ADD COLUMN calendar_id uuid REFERENCES doctor_calendars(id);
   ```

3. **Index for performance**:
   ```sql
   CREATE INDEX idx_appointments_calendar ON appointments(calendar_id);
   ```

## Backend Implementation

### 1. Models Updated
**File**: `backend/src/models/calendar.model.ts`
- Added `color_code`, `color_name`, and `notes` fields to `DoctorCalendar` interface
- Added `findCalendarsByDoctorId()` function to get all calendars for a doctor
- Updated `createDoctorCalendar()` to include color fields

**File**: `backend/src/models/appointment.model.ts`
- Added `calendar_id` field to `Appointment` interface
- Added `calendar_color_code`, `calendar_color_name`, `calendar_name` to joined fields
- Updated SQL queries to include calendar color joins
- Updated `createAppointment()` to save `calendar_id`

### 2. Controllers Updated
**File**: `backend/src/controllers/calendar.controller.ts`
- Added `getDoctorCalendars()` function to get all calendars for a specific doctor

### 3. Services Updated
**File**: `backend/src/services/calendar.service.ts`
- Added `getDoctorCalendars()` service function
- Updated `createCalendar()` to include color fields with defaults
- Updated `getOrCreateDoctorCalendar()` to set default blue color

### 4. Routes Added
**File**: `backend/src/routes/calendar.routes.ts`
- Added route: `GET /api/calendars/doctor/:doctorId/all` - Get all calendars for a doctor

## Frontend Implementation

### 1. Calendar Management Page
**File**: `frontend/src/pages/settings/DoctorCalendars.tsx`

**Updates**:
- Added color picker input to calendar creation/edit modal
- Added color name text field
- Added notes textarea field
- Updated calendar header to display with custom color gradient
- Shows color badge with color name on calendar header
- Form now saves and displays: `color_code`, `color_name`, `notes`

**Features**:
- Admin can create multiple calendars per doctor
- Each calendar has:
  - Customizable name
  - Color code (hex picker + text input)
  - Color name (display name)
  - Notes field
  - Working hours configuration
  - Time slot settings
  - Active/inactive status

### 2. Appointment Booking Form
**File**: `frontend/src/pages/appointments/AppointmentForm.tsx`

**Updates**:
- Added state for `doctorCalendars` and `loadingCalendars`
- Added `calendar_id` field to `formData`
- Created `loadDoctorCalendars()` function to fetch calendars when doctor is selected
- Added calendar dropdown after doctor selection (shows only if doctor has multiple calendars)
- Auto-selects calendar if doctor has only one
- Calendar dropdown shows:
  - Calendar name
  - Color name in parentheses
  - Visual color indicator with color preview
- Time slots now load based on selected calendar
- Form clears calendar and time slots when doctor changes
- Saves `calendar_id` with appointment

**User Flow**:
1. Select doctor → Calendars load automatically
2. If multiple calendars exist → Dropdown appears
3. Select calendar → Color indicator shows
4. Select date → Time slots load for that calendar
5. Select time → Appointment created with calendar_id

### 3. Appointment List Display
**File**: `frontend/src/pages/appointments/AppointmentList.tsx`

**Updates**:
- Shows calendar color dot next to patient color dot
- Displays calendar name under doctor name
- Tooltips show:
  - Patient color name
  - Calendar name and color name
- Both patient and calendar colors visible at a glance

## API Endpoints Summary

### New/Updated Endpoints:
- `GET /api/calendars/doctor/:doctorId/all` - Get all calendars for doctor
- `POST /api/calendars` - Create calendar (now includes color_code, color_name, notes)
- `PUT /api/calendars/:id` - Update calendar (now includes color fields)
- `POST /api/appointments` - Create appointment (now includes calendar_id)

## Color System

### Patient Colors
- Patients still have their own color codes (separate feature)
- Managed via Color Codes settings page
- Displayed as first color dot in appointment list

### Calendar Colors
- Each doctor calendar has its own color
- Appointments inherit the calendar's color
- Displayed as second color dot in appointment list
- Default color: #3B82F6 (blue)

## How to Run Migration

### Option 1: Using psql command
```bash
cd backend
psql "postgresql://YOUR_CONNECTION_STRING" -f database/migrations/008_add_color_code_to_calendars.sql
```

### Option 2: Manual execution
Connect to your database and run the SQL from:
`backend/database/migrations/008_add_color_code_to_calendars.sql`

### Option 3: Using database client
Copy the SQL content and execute in your preferred database client (pgAdmin, DBeaver, etc.)

## Testing Steps

1. **Calendar Management**:
   - Go to Settings → Doctor Calendars
   - Create multiple calendars for a doctor
   - Set different colors for each calendar
   - Verify calendars display with correct colors

2. **Appointment Booking**:
   - Go to Appointments → New Appointment
   - Select a doctor with multiple calendars
   - Verify calendar dropdown appears
   - Select a calendar
   - Verify color indicator shows
   - Book appointment
   - Verify appointment saves with calendar_id

3. **Appointment Display**:
   - Go to Appointments list
   - Verify calendar color dots appear
   - Verify calendar name shows under doctor
   - Hover over colors to see tooltips

## Benefits

1. **Better Organization**: Doctors can separate appointments by type, location, or specialty
2. **Visual Clarity**: Color-coded calendars make it easy to identify appointment types
3. **Flexible Scheduling**: Different calendars can have different time slots and working hours
4. **Dual Color System**: Both patient and calendar colors visible
5. **Scalability**: Unlimited calendars per doctor

## Future Enhancements

- Filter appointments by calendar
- Calendar-based statistics and reports
- Copy calendar settings to another doctor
- Calendar templates for quick setup
- Calendar color presets/themes
