# Pregnancy Journey System - Complete Implementation

## Overview
A comprehensive pregnancy tracking system that allows healthcare providers to manage multiple pregnancy journeys per patient, track visits with pregnancy-specific notes, and maintain detailed obstetric records.

## Features Implemented

### 1. **Database Schema** ✅
- **Pregnancies Table**: Tracks multiple pregnancy journeys per patient
  - Patient linkage, LMP/EDD dates, GPAL (Gravida, Para, Abortion, Living)
  - Pregnancy status (active, delivered, terminated, miscarriage)
  - Risk flags and delivery information
  
- **OB Records Table**: Stores obstetric measurements per visit
  - Weight, blood pressure (systolic/diastolic)
  - Fundal height, fetal heart rate
  - OB-specific notes
  
- **Visits Enhancement**: Linked visits to specific pregnancies
  - `pregnancy_id` foreign key
  - `pregnancy_notes` for pregnancy-specific observations
  - `pregnancy_week` for gestational age tracking

- **Database Functions**:
  - `calculate_pregnancy_week(lmp_date, check_date)`: Auto-calculates gestational age
  - `calculate_edd(lmp_date)`: Calculates Expected Delivery Date (LMP + 280 days)
  
- **View**: `active_pregnancies_view` for quick access to ongoing pregnancies with current week

### 2. **Backend API** ✅

#### Pregnancy Routes (`/api/v1/pregnancies`)
- `GET /patient/:patientId` - Get all pregnancies for a patient
- `GET /patient/:patientId/active-journey` - Get active pregnancy with visit timeline
- `GET /:pregnancyId/journey` - Get detailed pregnancy journey with all visits
- `POST /patient/:patientId` - Create new pregnancy
- `PUT /:pregnancyId` - Update pregnancy details
- `POST /ob-record` - Create/update OB measurements for a visit

#### Key Backend Files:
- `backend/src/models/pregnancy.model.ts` - Data access layer
- `backend/src/services/pregnancy.service.ts` - Business logic with date conversions
- `backend/src/controllers/pregnancy.controller.ts` - API handlers
- `backend/src/routes/pregnancy.routes.ts` - Route definitions with RBAC

### 3. **Frontend - Pregnancy Management** ✅

#### PregnancyJourneyList (`/patients/:patientId/pregnancies`)
- **View all pregnancies** for a patient in card format
- **Status indicators**: Active (green heart), Delivered (check), Ended (alert)
- **Quick info**: LMP, EDD, GPAL, current week (for active), delivery details
- **Actions**: 
  - "New Pregnancy" button → Create new pregnancy
  - Edit button on each card → Edit pregnancy details
  - Click card → View detailed journey

#### PregnancyJourneyDetail (`/patients/:patientId/pregnancy/:pregnancyId`)
- **Summary cards**: Current week, LMP, EDD, status
- **GPAL display**: Gravida, Para, Abortion, Living counts
- **Risk flags**: Highlighted warnings
- **Visit timeline**: All visits related to this pregnancy with:
  - Visit date, doctor name, diagnosis
  - Pregnancy week at time of visit
  - OB measurements (weight, BP, fundal height, FHR)
  - Pregnancy-specific notes
  - Clinical notes and treatment plan
- **Edit button**: Navigate to pregnancy edit form

#### PregnancyForm (`/patients/:patientId/pregnancy/new` or `/:pregnancyId/edit`)
- **LMP input**: Auto-calculates EDD (LMP + 280 days)
- **EDD input**: Manual override if needed
- **GPAL inputs**: Gravida, Para, Abortion, Living with descriptions
- **Status dropdown**: Active, Delivered, Terminated, Miscarriage
- **Risk flags**: Text area for special considerations
- **Validation**: LMP required, dates checked
- **Actions**: Save (creates/updates) or Cancel

### 4. **Visit Form Enhancement** ✅

#### Pregnancy Integration in VisitForm
- **Auto-load active pregnancies** when patient is selected
- **Conditional section**: Only shows if patient has active pregnancies
- **Pregnancy selection**: Dropdown to link visit to specific pregnancy journey
- **Pregnancy week input**: Record gestational age at visit time
- **Pregnancy notes**: Separate textarea for pregnancy-specific observations

#### OB Measurements Section
- **Weight (kg)**: Maternal weight tracking
- **Blood Pressure**: Systolic/Diastolic inputs
- **Fundal Height (cm)**: Uterine measurement
- **Fetal Heart Rate (bpm)**: Baby's heartbeat
- **OB Notes**: Additional obstetric observations

#### Data Handling
- `handleSubmit` saves both:
  1. Visit record with pregnancy linkage
  2. OB measurements record (via `createOBRecord` API)

### 5. **Patient Management** ✅
- **Is Pregnant checkbox** on patient form (defaults to true)
- **Pregnancy Journeys button** on patient detail page
- Backend updated to store `is_pregnant` flag

## User Workflows

### Creating a New Pregnancy Journey
1. Navigate to patient details
2. Click "Pregnancy Journeys" button
3. Click "New Pregnancy"
4. Enter LMP (EDD auto-calculates)
5. Fill GPAL information
6. Add risk flags if any
7. Set status
8. Save

### Recording a Prenatal Visit
1. Create/edit a visit for pregnant patient
2. Pregnancy section auto-appears
3. Select which pregnancy journey (if multiple)
4. Enter current pregnancy week
5. Add pregnancy-specific notes
6. Record OB measurements:
   - Weight, Blood Pressure
   - Fundal height, Fetal heart rate
   - Additional OB notes
7. Fill regular visit fields (diagnosis, treatment)
8. Save (creates both visit and OB record)

### Viewing Pregnancy Journey
1. From patient details → "Pregnancy Journeys"
2. See all pregnancies in card view
3. Click any pregnancy card
4. View complete timeline:
   - Pregnancy summary
   - All visits with measurements
   - Pregnancy notes from each visit
   - Progression tracking

### Editing Pregnancy
1. From pregnancy list → Click edit icon on card
2. Or from pregnancy detail → Click "Edit Details"
3. Update LMP, GPAL, risk flags, status
4. Save changes

## Technical Details

### Frontend Structure
```
frontend/src/
├── pages/
│   ├── pregnancy/
│   │   ├── PregnancyJourneyList.tsx     (List view)
│   │   ├── PregnancyJourneyDetail.tsx   (Detail view)
│   │   └── PregnancyForm.tsx            (Create/Edit form)
│   ├── visits/
│   │   └── VisitForm.tsx                (Enhanced with pregnancy tracking)
│   └── patients/
│       ├── PatientForm.tsx              (Added is_pregnant checkbox)
│       └── PatientDetail.tsx            (Added Pregnancy Journeys button)
└── services/
    └── pregnancyJourney.service.ts      (API integration)
```

### Backend Structure
```
backend/src/
├── models/
│   ├── pregnancy.model.ts       (Data access)
│   ├── patient.model.ts         (Updated with is_pregnant)
│   └── visit.model.ts          (Updated with pregnancy fields)
├── services/
│   └── pregnancy.service.ts    (Business logic)
├── controllers/
│   └── pregnancy.controller.ts (API handlers)
└── routes/
    └── pregnancy.routes.ts     (Route definitions)
```

### Database Migration
- File: `backend/migrations/create_pregnancy_journey_system.sql`
- Creates: pregnancies table, enhances visits table, adds functions/view
- Executed: Successfully (UPDATE 10 rows)

## Permissions (RBAC)
- `PREGNANCY_VIEW` - View pregnancy data
- `PREGNANCY_UPDATE` - Create/edit pregnancies
- `PREGNANCY_DELETE` - Delete pregnancies
- All routes protected with appropriate permission arrays

## Key Calculations
- **EDD**: LMP + 280 days (40 weeks)
- **Current Week**: Database function calculates from LMP to current date
- **Trimester**: Week 1-13 (First), 14-27 (Second), 28+ (Third)

## Status Indicators
- 🟢 **Active**: Green - Ongoing pregnancy
- ✅ **Delivered**: Blue - Successfully delivered
- ⚠️ **Terminated/Miscarriage**: Red/Yellow - Ended pregnancy

## Data Flow
```
Patient → Pregnancies (1:many)
Pregnancy → Visits (1:many) 
Visit → OB Record (1:1)
```

## Testing Data
- Test patients updated with pregnancy data via SQL
- Heba Victor and Rehab Helmy marked as pregnant with sample data

## What's Working
✅ Create/Read/Update/Delete pregnancies
✅ View all pregnancies per patient
✅ View detailed pregnancy journey with visits
✅ Record pregnancy-specific visit notes
✅ Track OB measurements per visit
✅ Auto-calculate pregnancy weeks and EDD
✅ Link visits to specific pregnancies
✅ Multiple pregnancy support per patient
✅ Status tracking (active/delivered/ended)
✅ Risk flag warnings
✅ GPAL tracking

## Notes
- System fully integrated: backend ↔ frontend ↔ database
- All TypeScript compilation successful (no errors)
- Responsive design with Tailwind CSS
- Toast notifications for user feedback
- Protected routes with authentication
- RBAC permission checks on all endpoints

## Next Possible Enhancements
- Delivery form with baby details
- Growth charts visualization
- Ultrasound image uploads
- Appointment scheduling for prenatal visits
- Reports generation (pregnancy summary, discharge summary)
- WhatsApp reminders for prenatal appointments
