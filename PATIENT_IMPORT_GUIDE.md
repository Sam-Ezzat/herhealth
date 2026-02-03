# Patient Import Feature - Implementation Guide

## Overview
A new feature has been added to import patients from Excel files in bulk. This feature is available in the Settings section and allows you to upload Excel sheets containing patient information.

## Feature Location
**Settings → Import Patients** (`/settings/import-patients`)

## Features Implemented

### 1. Frontend Components
- **PatientImport Component** (`frontend/src/pages/settings/PatientImport.tsx`)
  - File upload with drag-and-drop support
  - Excel file parsing (.xlsx, .xls, .csv)
  - Data preview before import
  - Real-time validation
  - Detailed import results with error reporting
  - Template download functionality

### 2. Backend API
- **Bulk Import Endpoint**: `POST /api/patients/bulk-import`
  - Validates required fields (first_name, last_name, phone)
  - Handles batch processing
  - Returns detailed success/failure statistics
  - Individual error tracking per row

### 3. Navigation
- Added menu item in Layout: **Settings → Import Patients**

## How to Use

### Step 1: Download Template
1. Navigate to **Settings → Import Patients**
2. Click "Download Excel Template" button
3. Open the downloaded template file

### Step 2: Prepare Your Data
The Excel file should have the following columns:

**Required Columns:**

**Option 1: Full Name**
- `Full Name` - Patient's complete name (will be split: first word = First Name, remaining = Last Name)
- `Phone` - Patient's phone number (required)

**Option 2: Separate Names**
- `First Name` - Patient's first name (required)
- `Last Name` - Patient's last name (required)
- `Phone` - Patient's phone number (required)

**Optional Columns:**
- `Email` - Patient's email address
- `Date of Birth` - Format: YYYY-MM-DD (e.g., 1990-01-15)
- `Gender` - Options: Male, Female, Other
- `Address` - Patient's address

**Column Name Variations Supported:**
- Full Name: `Full Name`, `full_name`, `FullName`, `Name`, `name`
- First Name: `First Name`, `first_name`, `FirstName`
- Last Name: `Last Name`, `last_name`, `LastName`
- Phone: `Phone`, `phone`, `Phone Number`
- Email: `Email`, `email`
- Date of Birth: `Date of Birth`, `date_of_birth`, `DOB`
- Gender: `Gender`, `gender`
- Address: `Address`, `address`

### Step 3: Upload and Preview
1. Click the upload area or drag and drop your Excel file
2. The system will automatically parse and display a preview
3. Review the data in the preview table
4. Check that all required fields are present

### Step 4: Import
1. Click "Import X Patients" button
2. Wait for the import process to complete
3. Review the import results:
   - **Success Count**: Number of patients successfully imported
   - **Failed Count**: Number of patients that failed to import
   - **Error Details**: List of errors with row numbers and reasons

### Step 5: Handle Errors (if any)
If some patients failed to import:
1. Review the error messages
2. Fix the issues in your Excel file
3. Re-upload only the failed entries
4. Import again

## Example Excel Format
**Option 1: Using Full Name**

| Full Name  | Phone      | Email                | Date of Birth | Gender | Address            |
|------------|------------|----------------------|---------------|--------|--------------------||
| John Doe   | 1234567890 | john.doe@example.com | 1990-01-15    | Male   | 123 Main St, City  |
| Jane Smith | 0987654321 | jane.smith@email.com | 1985-05-20    | Female | 456 Oak Ave, Town  |

**Option 2: Using Separate Names**
| First Name | Last Name | Phone      | Email                | Date of Birth | Gender | Address            |
|------------|-----------|------------|----------------------|---------------|--------|--------------------|
| John       | Doe       | 1234567890 | john.doe@example.com | 1990-01-15    | Male   | 123 Main St, City  |
| Jane       | Smith     | 0987654321 | jane.smith@email.com | 1985-05-20    | Female | 456 Oak Ave, Town  |

## Technical Details

### Dependencies Installed
- `xlsx` (^0.18.5) - For Excel file parsing and creation

### Files Modified/Created

**Frontend:**
- ✅ `frontend/src/pages/settings/PatientImport.tsx` - New component
- ✅ `frontend/src/pages/settings/index.ts` - Export added
- ✅ `frontend/src/App.tsx` - Route added
- ✅ `frontend/src/components/Layout.tsx` - Menu item added
- ✅ `frontend/src/services/patient.service.ts` - bulkImport method added
- ✅ `frontend/package.json` - xlsx dependency added

**Backend:**
- ✅ `backend/src/routes/patient.routes.ts` - Bulk import route added
- ✅ `backend/src/controllers/patient.controller.ts` - bulkImportPatients controller added

### API Endpoint Details

**Endpoint:** `POST /api/patients/bulk-import`

**Request Body:**
```json
{
  "patients": [
    {
      "first_name": "John",
      "last_name": "Doe",
      "phone": "1234567890",
      "email": "john@example.com",
      "date_of_birth": "1990-01-15",
      "gender": "Male",
      "address": "123 Main St"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": 10,
    "failed": 2,
    "errors": [
      {
        "row": 5,
        "error": "Missing required fields (first_name, last_name, phone)",
        "data": { ... }
      }
    ]
  },
  "message": "Bulk import completed. 10 succeeded, 2 failed."
}
```

## Validation Rules

1. **First Name**: Required, cannot be empty
2. **Last Name**: Required, cannot be empty
3. **Phone**: Required, cannot be empty
4. **Email**: Optional, must be valid email format if provided
5. **Date of Birth**: Optional, defaults to "2000-01-01" if not provided
6. **Gender**: Optional, defaults to "Female" if not provided
7. **Address**: Optional

## Error Handling

The system provides detailed error messages for:
- Missing required fields
- Invalid data formats
- Duplicate phone numbers (if enforced by database)
- Database constraint violations
- File parsing errors

## Permissions Required

The import feature requires the `PATIENTS_CREATE` permission to use.

## Best Practices

1. **Always download the template first** to ensure correct format
2. **Test with a small batch** (2-5 patients) before importing large datasets
3. **Keep a backup** of your Excel file before importing
4. **Review the preview** carefully before clicking Import
5. **Check error messages** if imports fail and fix the data accordingly
6. **Don't include duplicate phone numbers** in the same import batch

## Troubleshooting

### Common Issues

**Issue: "Failed to parse Excel file"**
- Solution: Ensure the file is a valid Excel file (.xlsx, .xls, or .csv)
- Check that the file is not corrupted

**Issue: "Missing required fields"**
- Solution: Ensure First Name, Last Name, and Phone columns exist and are filled

**Issue: "Failed to create patient"**
- Solution: Check if phone number already exists in the database
- Verify that data formats are correct (especially dates)

**Issue: Import is slow**
- Solution: This is normal for large datasets. The system processes patients one by one to ensure data integrity

## Future Enhancements

Potential improvements for future versions:
- Bulk validation endpoint for faster validation
- Duplicate detection before import
- Progress bar for large imports
- Export failed records to Excel
- Support for updating existing patients
- Import preview with validation warnings
- Async/background processing for large imports

## Support

For issues or questions, check the error messages in the import results panel or contact system administrator.
