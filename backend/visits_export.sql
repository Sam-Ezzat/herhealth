--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: visits; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.visits (id, appointment_id, patient_id, doctor_id, visit_date, reason, clinical_notes, diagnosis, treatment_plan, created_at, updated_at, pregnancy_id, pregnancy_notes, pregnancy_week) VALUES ('05ec5c6d-33f5-4348-bcac-70ce619df7f1', '5b683eed-6c75-4908-a802-484dc0a84714', '65cfccdb-f436-4961-b629-eabe39748d22', 'b258c852-0f82-4c96-9ca7-c4609c091e29', '2025-12-05', 'Annual Checkup', 'Patient presented for Annual Checkup', 'Healthy', 'Continue current care plan', '2025-12-01 05:50:02.630405+02', '2025-12-01 05:50:02.630405+02', NULL, NULL, NULL);
INSERT INTO public.visits (id, appointment_id, patient_id, doctor_id, visit_date, reason, clinical_notes, diagnosis, treatment_plan, created_at, updated_at, pregnancy_id, pregnancy_notes, pregnancy_week) VALUES ('f56d0683-7917-4432-9668-b14c71988332', 'eeabdff9-bbcc-4884-8068-8cf15dd8a719', 'b7064c1a-9830-41e1-8939-a561df6e89e0', '3bb6cd6c-4a7c-49ef-b2f5-9a4b39444abb', '2025-12-05', 'Prenatal Visit', 'Patient presented for Prenatal Visit', 'Normal pregnancy progression', 'Continue current care plan', '2025-12-01 05:50:02.630405+02', '2025-12-01 05:50:02.630405+02', NULL, NULL, NULL);
INSERT INTO public.visits (id, appointment_id, patient_id, doctor_id, visit_date, reason, clinical_notes, diagnosis, treatment_plan, created_at, updated_at, pregnancy_id, pregnancy_notes, pregnancy_week) VALUES ('a3f94806-86fa-40bd-8527-e1155e6dbc5d', '7a211d20-961b-44ab-ad55-b7808096e584', '1fb056f7-a7ca-4b54-baef-0d6c92117812', '828ce74d-1e19-4a15-8388-292aa0001fcd', '2025-12-06', 'Follow-up', 'Patient presented for Follow-up', 'Stable condition', 'Continue current care plan', '2025-12-01 05:50:02.630405+02', '2025-12-01 05:50:02.630405+02', NULL, NULL, NULL);
INSERT INTO public.visits (id, appointment_id, patient_id, doctor_id, visit_date, reason, clinical_notes, diagnosis, treatment_plan, created_at, updated_at, pregnancy_id, pregnancy_notes, pregnancy_week) VALUES ('fdd0c2ff-8b7d-4ea8-8e25-14c9a56034c9', 'a42091e2-c195-4863-8d42-d6fdf4b88818', '4257a240-2972-4424-8acd-a273188f37a3', '522429a1-69e3-4472-8af9-309975818e8d', '2025-12-07', 'Consultation', 'Patient presented for Consultation', 'Healthy', 'Continue current care plan', '2025-12-01 05:50:02.630405+02', '2025-12-01 05:50:02.630405+02', NULL, NULL, NULL);
INSERT INTO public.visits (id, appointment_id, patient_id, doctor_id, visit_date, reason, clinical_notes, diagnosis, treatment_plan, created_at, updated_at, pregnancy_id, pregnancy_notes, pregnancy_week) VALUES ('aedd176d-3593-4f68-92f1-f84b3d0282d1', '84b67325-ce68-4fe3-bab1-545e68423a39', '9d29df28-9c05-4009-b6b0-e2c01f3b85c8', 'ebaba171-3194-4c6c-9bba-052689078eaf', '2025-12-08', 'Prenatal Visit', 'Patient presented for Prenatal Visit', 'Normal pregnancy progression', 'Continue current care plan', '2025-12-01 05:50:02.630405+02', '2025-12-01 05:50:02.630405+02', NULL, NULL, NULL);
INSERT INTO public.visits (id, appointment_id, patient_id, doctor_id, visit_date, reason, clinical_notes, diagnosis, treatment_plan, created_at, updated_at, pregnancy_id, pregnancy_notes, pregnancy_week) VALUES ('7917f0dd-9bb2-4c20-8b7f-fadf7a598bad', '38fce55f-2e7a-4519-846f-ab282e3b14c4', '7dba7916-2de9-447e-b9c7-11ed48346524', '0fda0e91-654f-4c1b-9674-cb38bd94e877', '2025-12-09', 'Follow-up', 'Patient presented for Follow-up', 'Stable condition', 'Continue current care plan', '2025-12-01 05:50:02.630405+02', '2025-12-01 05:50:02.630405+02', NULL, NULL, NULL);
INSERT INTO public.visits (id, appointment_id, patient_id, doctor_id, visit_date, reason, clinical_notes, diagnosis, treatment_plan, created_at, updated_at, pregnancy_id, pregnancy_notes, pregnancy_week) VALUES ('b59c6966-e359-499e-a5b0-bbed111731e2', '44a4523d-e4c1-4316-8d61-5d3bc4a99356', '7f45163c-3ef5-41b6-b5d7-5c833c0ce6c1', 'addaf0b2-2010-4124-af40-4cc186a38a52', '2025-12-10', 'Annual Checkup', 'Patient presented for Annual Checkup', 'Healthy', 'Continue current care plan', '2025-12-01 05:50:02.630405+02', '2025-12-01 05:50:02.630405+02', NULL, NULL, NULL);
INSERT INTO public.visits (id, appointment_id, patient_id, doctor_id, visit_date, reason, clinical_notes, diagnosis, treatment_plan, created_at, updated_at, pregnancy_id, pregnancy_notes, pregnancy_week) VALUES ('d1356c4d-45df-404b-9b8e-9388f58afdb6', '6b6474cf-8b54-4119-a5e1-464c1e775900', 'a5bce3f9-4624-45c9-9f05-3f87ba722aa5', '6453a2e8-a027-45bd-af26-a477acbea7f2', '2025-12-11', 'Consultation', 'Patient presented for Consultation', 'Healthy', 'Continue current care plan', '2025-12-01 05:50:02.630405+02', '2025-12-01 05:50:02.630405+02', NULL, NULL, NULL);
INSERT INTO public.visits (id, appointment_id, patient_id, doctor_id, visit_date, reason, clinical_notes, diagnosis, treatment_plan, created_at, updated_at, pregnancy_id, pregnancy_notes, pregnancy_week) VALUES ('8d70e5ae-57e1-4ac4-a9c5-0f312d30ee42', '625563cc-36f5-4bfb-b388-add6557dee78', '0bf38974-07fa-405a-b739-db0bb9613ac3', '3cca1e2a-04ed-42fd-a908-207a231f6207', '2025-12-12', 'Follow-up', 'Patient presented for Follow-up', 'Stable condition', 'Continue current care plan', '2025-12-01 05:50:02.630405+02', '2025-12-01 05:50:02.630405+02', NULL, NULL, NULL);
INSERT INTO public.visits (id, appointment_id, patient_id, doctor_id, visit_date, reason, clinical_notes, diagnosis, treatment_plan, created_at, updated_at, pregnancy_id, pregnancy_notes, pregnancy_week) VALUES ('2a91feb8-7426-4cd5-b00d-e469ac9eff41', NULL, '0bf38974-07fa-405a-b739-db0bb9613ac3', '6453a2e8-a027-45bd-af26-a477acbea7f2', '2025-12-15', 'follow up', 'normal', 'normal pregnancy', 'vitamins medications', '2025-12-15 23:45:55.616387+02', '2025-12-15 23:45:55.616387+02', NULL, NULL, NULL);
INSERT INTO public.visits (id, appointment_id, patient_id, doctor_id, visit_date, reason, clinical_notes, diagnosis, treatment_plan, created_at, updated_at, pregnancy_id, pregnancy_notes, pregnancy_week) VALUES ('d0442210-94e1-42ad-a66f-205d4fb371b9', 'd2f3c9d3-1c41-4cf6-a8b0-ea9dcb764708', '41023f41-a7b7-4ff2-8110-dc18f657327f', 'df3402a6-4522-4745-a193-0d36e9753fa7', '2025-12-11', 'Prenatal Visit', 'Patient presented for Prenatal Visit', 'Normal pregnancy progression', 'Continue current care plan', '2025-12-01 05:50:02.630405+02', '2026-01-09 01:02:59.576333+02', '2c7c7a4f-5b4b-4986-aa3f-a3f12a2ff20d', 'the the pregnancy normal ', 20);
INSERT INTO public.visits (id, appointment_id, patient_id, doctor_id, visit_date, reason, clinical_notes, diagnosis, treatment_plan, created_at, updated_at, pregnancy_id, pregnancy_notes, pregnancy_week) VALUES ('5ddfea35-4dc3-4c82-88fe-bf51ba847dc0', NULL, '4ea60de4-53c8-47db-840d-e57cdd584934', '6453a2e8-a027-45bd-af26-a477acbea7f2', '2026-01-18', 'Routine checkup ', NULL, NULL, NULL, '2026-01-18 02:23:55.188543+02', '2026-01-18 02:23:55.188543+02', NULL, NULL, NULL);


--
-- PostgreSQL database dump complete
--

