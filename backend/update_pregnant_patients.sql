-- Update existing patients to mark them as pregnant with sample pregnancy data

-- Patient 1: d0bbf489-8719-444a-9e7c-d95806e88cc2 (20 weeks pregnant)
UPDATE patients
SET 
  is_pregnant = true,
  lmp = CURRENT_DATE - INTERVAL '20 weeks',
  edd = CURRENT_DATE - INTERVAL '20 weeks' + INTERVAL '40 weeks',
  current_pregnancy_week = 20,
  pregnancy_status = 'ongoing',
  gravida = 1,
  para = 0,
  abortion = 0,
  living = 0,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'd0bbf489-8719-444a-9e7c-d95806e88cc2';

-- Patient 2: 6d2bdbaa-ac91-474b-9014-65e8e0da0a3d (15 weeks pregnant)
UPDATE patients
SET 
  is_pregnant = true,
  lmp = CURRENT_DATE - INTERVAL '15 weeks',
  edd = CURRENT_DATE - INTERVAL '15 weeks' + INTERVAL '40 weeks',
  current_pregnancy_week = 15,
  pregnancy_status = 'ongoing',
  gravida = 2,
  para = 1,
  abortion = 0,
  living = 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = '6d2bdbaa-ac91-474b-9014-65e8e0da0a3d';

-- Verify the updates
SELECT 
  id, 
  first_name, 
  last_name, 
  is_pregnant, 
  lmp, 
  edd, 
  current_pregnancy_week,
  pregnancy_status
FROM patients 
WHERE id IN ('d0bbf489-8719-444a-9e7c-d95806e88cc2', '6d2bdbaa-ac91-474b-9014-65e8e0da0a3d');
