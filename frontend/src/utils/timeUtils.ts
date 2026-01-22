/**
 * Time Utilities - Centralized time handling to prevent timezone inconsistencies
 * 
 * IMPORTANT: All appointment times should be treated as LOCAL time without timezone conversion
 * The backend stores times in 'YYYY-MM-DD HH:MM:SS' format (no timezone)
 */

/**
 * Parse a time slot from backend (format: 'YYYY-MM-DD HH:MM:SS' or Date object)
 * Returns time in HH:MM format for display
 */
export const parseTimeSlot = (timeString: string | Date): string => {
  if (timeString instanceof Date) {
    const hours = timeString.getHours().toString().padStart(2, '0');
    const minutes = timeString.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  
  // Handle 'YYYY-MM-DD HH:MM:SS' format
  const timePart = timeString.includes(' ') 
    ? timeString.split(' ')[1]  // Space-separated format
    : timeString.split('T')[1];  // ISO format
  
  if (!timePart) return '00:00';
  
  const [hours, minutes] = timePart.split(':');
  return `${hours}:${minutes}`;
};

/**
 * Format time for display (12-hour format with AM/PM)
 * Input: ISO datetime string or 'YYYY-MM-DD HH:MM:SS' format
 */
export const formatTime = (dateString: string): string => {
  if (!dateString) return '';
  
  // Parse datetime string directly without timezone conversion
  // Expected format: 'YYYY-MM-DDTHH:MM:SS' or 'YYYY-MM-DD HH:MM:SS'
  const timePart = dateString.includes('T') 
    ? dateString.split('T')[1] 
    : dateString.split(' ')[1];
  
  if (!timePart) return '';
  
  const [hours, minutes] = timePart.split(':').map(Number);
  
  // Format to 12-hour time
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
};

/**
 * Format time for display (24-hour format)
 * Input: ISO datetime string or 'YYYY-MM-DD HH:MM:SS' format
 */
export const formatTime24 = (dateString: string): string => {
  if (!dateString) return '';
  
  const timePart = dateString.includes('T') 
    ? dateString.split('T')[1] 
    : dateString.split(' ')[1];
  
  if (!timePart) return '';
  
  const [hours, minutes] = timePart.split(':');
  return `${hours}:${minutes}`;
};

/**
 * Create local datetime string for HTML datetime-local input
 * Avoids timezone conversion issues
 * Output: 'YYYY-MM-DDTHH:mm' format
 */
export const toLocalDateTimeString = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Build string manually to avoid timezone conversion
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Parse datetime from database format to datetime-local input format
 * Input: 'YYYY-MM-DD HH:MM:SS' or ISO string
 * Output: 'YYYY-MM-DDTHH:mm' (for datetime-local input)
 */
export const parseDbDateTimeToLocal = (dbDateTime: string): string => {
  if (!dbDateTime) return '';
  
  // Remove timezone info and milliseconds if present
  const cleaned = dbDateTime
    .replace(/\.\d{3}Z?$/, '')  // Remove .000Z or .000
    .replace(' ', 'T');          // Convert space to T
  
  return cleaned.substring(0, 16); // Return 'YYYY-MM-DDTHH:mm' format
};

/**
 * Create appointment datetime from date and time inputs
 * No timezone conversion - treats all inputs as local time
 * @param date - 'YYYY-MM-DD' format
 * @param time - 'HH:MM' format
 * @returns ISO string without timezone (for backend)
 */
export const createAppointmentDateTime = (date: string, time: string): string => {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  
  const localDate = new Date(year, month - 1, day, hours, minutes);
  
  // Format manually to avoid timezone conversion
  const y = localDate.getFullYear();
  const m = String(localDate.getMonth() + 1).padStart(2, '0');
  const d = String(localDate.getDate()).padStart(2, '0');
  const h = String(localDate.getHours()).padStart(2, '0');
  const min = String(localDate.getMinutes()).padStart(2, '0');
  const sec = String(localDate.getSeconds()).padStart(2, '0');
  
  return `${y}-${m}-${d}T${h}:${min}:${sec}`;
};

/**
 * Calculate end time based on start time and duration
 * @param startDateTime - ISO datetime string
 * @param durationMinutes - Duration in minutes
 * @returns ISO datetime string (local time)
 */
export const calculateEndTime = (startDateTime: string, durationMinutes: number): string => {
  // Parse without timezone conversion
  const [datePart, timePart] = startDateTime.includes('T') 
    ? startDateTime.split('T')
    : startDateTime.split(' ');
  
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  
  const localDate = new Date(year, month - 1, day, hours, minutes);
  localDate.setMinutes(localDate.getMinutes() + durationMinutes);
  
  // Format manually
  const y = localDate.getFullYear();
  const m = String(localDate.getMonth() + 1).padStart(2, '0');
  const d = String(localDate.getDate()).padStart(2, '0');
  const h = String(localDate.getHours()).padStart(2, '0');
  const min = String(localDate.getMinutes()).padStart(2, '0');
  const sec = String(localDate.getSeconds()).padStart(2, '0');
  
  return `${y}-${m}-${d}T${h}:${min}:${sec}`;
};

/**
 * Get current date and time in local format for datetime-local input
 */
export const getCurrentLocalDateTime = (): string => {
  return toLocalDateTimeString(new Date());
};

/**
 * Extract date part from datetime string
 * Returns: 'YYYY-MM-DD'
 */
export const extractDate = (dateTime: string): string => {
  if (!dateTime) return '';
  return dateTime.split('T')[0].split(' ')[0];
};

/**
 * Extract time part from datetime string  
 * Returns: 'HH:MM'
 */
export const extractTime = (dateTime: string): string => {
  return parseTimeSlot(dateTime);
};

/**
 * Calculate duration between two datetime strings
 * @returns Duration in minutes
 */
export const calculateDuration = (start: string, end: string): number => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diff = endDate.getTime() - startDate.getTime();
  return Math.round(diff / 60000); // Convert to minutes
};
