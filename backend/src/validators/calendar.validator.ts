import Joi from 'joi';

const windowsTimezones = [
  'UTC',
  'GMT Standard Time',
  'Greenwich Standard Time',
  'W. Europe Standard Time',
  'Central Europe Standard Time',
  'Romance Standard Time',
  'Central European Standard Time',
  'W. Central Africa Standard Time',
  'Jordan Standard Time',
  'GTB Standard Time',
  'Middle East Standard Time',
  'Egypt Standard Time',
  'E. Europe Standard Time',
  'Syria Standard Time',
  'South Africa Standard Time',
  'FLE Standard Time',
  'Israel Standard Time',
  'E. Africa Standard Time',
  'Arab Standard Time',
  'Arabic Standard Time',
  'Russia Time Zone 3',
  'Mauritius Standard Time',
  'Georgian Standard Time',
  'Caucasus Standard Time',
  'Afghanistan Standard Time',
  'West Asia Standard Time',
  'Ekaterinburg Standard Time',
  'Pakistan Standard Time',
  'India Standard Time',
  'Sri Lanka Standard Time',
  'Nepal Standard Time',
  'Central Asia Standard Time',
  'Bangladesh Standard Time',
  'N. Central Asia Standard Time',
  'Myanmar Standard Time',
  'SE Asia Standard Time',
  'North Asia Standard Time',
  'China Standard Time',
  'North Asia East Standard Time',
  'Singapore Standard Time',
  'W. Australia Standard Time',
  'Taipei Standard Time',
  'Ulaanbaatar Standard Time',
  'Tokyo Standard Time',
  'Korea Standard Time',
  'Yakutsk Standard Time',
  'Cen. Australia Standard Time',
  'AUS Central Standard Time',
  'E. Australia Standard Time',
  'AUS Eastern Standard Time',
  'West Pacific Standard Time',
  'Tasmania Standard Time',
  'Vladivostok Standard Time',
  'Central Pacific Standard Time',
  'New Zealand Standard Time',
  'Fiji Standard Time',
  'Kamchatka Standard Time',
  'Tonga Standard Time',
  'Azores Standard Time',
  'Cape Verde Standard Time',
  'Morocco Standard Time',
  'Coordinated Universal Time',
  'Atlantic Standard Time',
  'SA Western Standard Time',
  'Newfoundland Standard Time',
  'Paraguay Standard Time',
  'Eastern Standard Time',
  'SA Pacific Standard Time',
  'US Eastern Standard Time',
  'Venezuela Standard Time',
  'Central Standard Time',
  'Central America Standard Time',
  'Mountain Standard Time',
  'US Mountain Standard Time',
  'Pacific Standard Time',
  'SA Eastern Standard Time',
  'Alaskan Standard Time',
  'Hawaiian Standard Time',
  'Samoa Standard Time'
];

export const createCalendarSchema = Joi.object({
  doctor_id: Joi.string().uuid().required(),
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).optional(),
  timezone: Joi.string().valid(...windowsTimezones).default('UTC'),
  is_active: Joi.boolean().default(true),
  color_code: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
  color_name: Joi.string().max(100).optional().allow(''),
  notes: Joi.string().max(1000).optional().allow('')
});

export const updateCalendarSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  description: Joi.string().max(500).optional(),
  timezone: Joi.string().valid(...windowsTimezones).optional(),
  is_active: Joi.boolean().optional(),
  color_code: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
  color_name: Joi.string().max(100).optional().allow(''),
  notes: Joi.string().max(1000).optional().allow('')
});

export const createWorkingHoursSchema = Joi.object({
  day_of_week: Joi.number().integer().min(0).max(6).required(),
  start_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).required(),
  end_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).required(),
  is_active: Joi.boolean().default(true),
  is_closed: Joi.boolean().default(false)
});

export const updateWorkingHoursSchema = Joi.object({
  day_of_week: Joi.number().integer().min(0).max(6).optional(),
  start_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).optional(),
  end_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).optional(),
  is_active: Joi.boolean().optional(),
  is_closed: Joi.boolean().optional()
});

export const createTimeSlotSchema = Joi.object({
  slot_duration: Joi.number().integer().min(5).max(480).required(),
  break_duration: Joi.number().integer().min(0).max(120).default(0),
  max_appointments_per_slot: Joi.number().integer().min(1).max(10).default(1),
  is_active: Joi.boolean().default(true)
});

export const updateTimeSlotSchema = Joi.object({
  slot_duration: Joi.number().integer().min(5).max(480).optional(),
  break_duration: Joi.number().integer().min(0).max(120).optional(),
  max_appointments_per_slot: Joi.number().integer().min(1).max(10).optional(),
  is_active: Joi.boolean().optional()
});

export const bulkRescheduleSchema = Joi.object({
  startDatetime: Joi.date().required(),
  endDatetime: Joi.date().required(),
  method: Joi.string().valid('offset', 'set_time').required(),
  appointmentIds: Joi.array().items(Joi.string().uuid()).optional(),
  offsetMinutes: Joi.when('method', {
    is: 'offset',
    then: Joi.number().integer().min(-720).max(720).required(),
    otherwise: Joi.forbidden()
  }),
  targetTime: Joi.when('method', {
    is: 'set_time',
    then: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).required(),
    otherwise: Joi.forbidden()
  }),
  notifyPatients: Joi.boolean().default(true)
});
