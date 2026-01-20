# Quick Start Guide - Multiple Calendars Feature

## Step 1: Run Database Migration

### Windows (PowerShell):
```powershell
cd backend
.\run-calendar-color-migration.ps1
```

### Linux/Mac:
```bash
cd backend
psql "YOUR_DATABASE_CONNECTION_STRING" < database/migrations/008_add_color_code_to_calendars.sql
```

### Using Database Client (pgAdmin, DBeaver, etc.):
Open and execute the SQL file: `backend/database/migrations/008_add_color_code_to_calendars.sql`

---

## Step 2: Restart Backend Server

```bash
cd backend
npm run dev
```

---

## Step 3: Access Calendar Management

1. Open your browser and navigate to your application
2. Go to **Settings** → **Doctor Calendars**
3. Click **Create Calendar** button

---

## Step 4: Create Calendars for Doctors

### Creating a Calendar:

1. **Select Doctor** - Choose the doctor from dropdown
2. **Calendar Name** - e.g., "Morning Clinic", "Surgery Schedule", "Emergency"
3. **Color Code** - Click color picker or enter hex code (e.g., #FF5733)
4. **Color Name** - e.g., "Red", "Blue", "Green"
5. **Notes** - Optional description
6. **Weekend Days** - Select days that are closed
7. Click **Create Calendar**

### Example Calendars:
- **Morning Clinic** - Blue (#3B82F6)
- **Afternoon Clinic** - Green (#10B981)
- **Emergency** - Red (#EF4444)
- **Surgery** - Purple (#8B5CF6)

---

## Step 5: Configure Working Hours

For each calendar:

1. Click the **expand** arrow on calendar card
2. View **Weekly Working Hours** section
3. Click **+** button next to any day to add hours
4. Set **Start Time** and **End Time**
5. Mark days as **Closed** for weekends/holidays
6. Click **Save**

---

## Step 6: Configure Time Slots

1. In the expanded calendar view, find **Time Slot Configuration**
2. Click **Configure Slots**
3. Set:
   - **Slot Duration**: e.g., 30 minutes
   - **Break Duration**: e.g., 5 minutes
   - **Max Appointments Per Slot**: usually 1
4. Click **Save**

---

## Step 7: Book Appointment with Calendar Selection

### Creating a New Appointment:

1. Go to **Appointments** → **New Appointment**
2. **Select Patient** - Type to search
3. **Select Doctor** - Calendar dropdown appears automatically
4. **Select Calendar** - Choose from doctor's calendars
   - See color indicator
   - View calendar name
5. **Select Date** - Available dates shown
6. **Select Time** - Time slots based on calendar working hours
7. Fill remaining details
8. Click **Save**

---

## Step 8: View Appointments

### In Appointment List:
- **Patient Color Dot** - First colored circle (patient's color code)
- **Calendar Color Dot** - Second colored circle (calendar color)
- **Calendar Name** - Shows under doctor name
- **Hover** - See color names in tooltip

---

## Usage Examples

### Scenario 1: Separate Morning & Afternoon
```
Dr. Smith:
  ├─ Morning Clinic (Blue) - 8:00 AM to 12:00 PM
  └─ Afternoon Clinic (Green) - 2:00 PM to 6:00 PM
```

### Scenario 2: By Specialty
```
Dr. Johnson:
  ├─ General Consultation (Blue) - 30-min slots
  ├─ Surgery (Red) - 2-hour slots
  └─ Follow-ups (Green) - 15-min slots
```

### Scenario 3: By Location
```
Dr. Williams:
  ├─ Main Clinic (Blue) - Mon, Wed, Fri
  ├─ Branch Office (Orange) - Tue, Thu
  └─ Home Visits (Purple) - Sat
```

---

## Features at a Glance

✅ **Multiple calendars per doctor**  
✅ **Custom color codes (hex)**  
✅ **Custom color names**  
✅ **Individual working hours per calendar**  
✅ **Individual time slots per calendar**  
✅ **Calendar-based appointment booking**  
✅ **Visual color indicators**  
✅ **Patient + Calendar dual colors**  
✅ **Calendar management UI**  
✅ **Auto-calendar selection (if only one)**  

---

## Troubleshooting

### Calendar dropdown not showing?
- Ensure doctor has at least one calendar created
- Check if `loadDoctorCalendars()` is called
- Verify API endpoint: `/api/calendars/doctor/:doctorId/all`

### Colors not displaying?
- Verify migration ran successfully
- Check database: `SELECT color_code FROM doctor_calendars`
- Clear browser cache

### Appointments not saving calendar?
- Check `calendar_id` in appointments table
- Verify form includes `calendar_id` in payload
- Check browser console for errors

### Time slots not loading?
- Ensure calendar has working hours configured
- Ensure calendar has time slot settings
- Check if selected day is marked as closed

---

## Support

For issues or questions:
1. Check [MULTIPLE_CALENDARS_FEATURE.md](./MULTIPLE_CALENDARS_FEATURE.md) for implementation details
2. Review database migration file
3. Check backend logs for API errors
4. Verify frontend console for JavaScript errors

---

**Congratulations!** 🎉 You now have multiple calendars per doctor with color coding!
