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
-- Data for Name: pregnancies; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.pregnancies (id, patient_id, lmp, edd, gravida, para, risk_flags, status, created_at, updated_at, abortion, living, pregnancy_number, delivery_date, delivery_type, baby_weight_kg, complications, outcome) VALUES ('2c7c7a4f-5b4b-4986-aa3f-a3f12a2ff20d', '41023f41-a7b7-4ff2-8110-dc18f657327f', '2025-04-10', '2026-01-15', 1, 0, NULL, 'active', '2025-12-01 05:50:38.30891+02', '2025-12-01 05:50:38.30891+02', 0, 0, 1, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.pregnancies (id, patient_id, lmp, edd, gravida, para, risk_flags, status, created_at, updated_at, abortion, living, pregnancy_number, delivery_date, delivery_type, baby_weight_kg, complications, outcome) VALUES ('08784720-0b43-418a-b387-21c723b99731', '4257a240-2972-4424-8acd-a273188f37a3', '2025-07-25', '2026-05-01', 1, 0, NULL, 'active', '2025-12-01 05:50:38.30891+02', '2025-12-01 05:50:38.30891+02', 0, 0, 1, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.pregnancies (id, patient_id, lmp, edd, gravida, para, risk_flags, status, created_at, updated_at, abortion, living, pregnancy_number, delivery_date, delivery_type, baby_weight_kg, complications, outcome) VALUES ('61ed94d5-3142-40e5-83b2-2f91fe5d63af', '7f45163c-3ef5-41b6-b5d7-5c833c0ce6c1', '2025-05-18', '2026-02-22', 1, 0, NULL, 'active', '2025-12-01 05:50:38.30891+02', '2025-12-01 05:50:38.30891+02', 0, 0, 1, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.pregnancies (id, patient_id, lmp, edd, gravida, para, risk_flags, status, created_at, updated_at, abortion, living, pregnancy_number, delivery_date, delivery_type, baby_weight_kg, complications, outcome) VALUES ('315d0f3c-637b-4f31-bad8-172b986d86ab', '9d29df28-9c05-4009-b6b0-e2c01f3b85c8', '2025-06-01', '2026-03-08', 2, 1, NULL, 'active', '2025-12-01 05:50:38.30891+02', '2025-12-01 05:50:38.30891+02', 0, 0, 1, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.pregnancies (id, patient_id, lmp, edd, gravida, para, risk_flags, status, created_at, updated_at, abortion, living, pregnancy_number, delivery_date, delivery_type, baby_weight_kg, complications, outcome) VALUES ('4b50ce41-342e-43e0-9f0f-98ea4eea9096', 'a5bce3f9-4624-45c9-9f05-3f87ba722aa5', '2025-03-22', '2025-12-27', 2, 1, NULL, 'active', '2025-12-01 05:50:38.30891+02', '2025-12-01 05:50:38.30891+02', 0, 0, 1, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.pregnancies (id, patient_id, lmp, edd, gravida, para, risk_flags, status, created_at, updated_at, abortion, living, pregnancy_number, delivery_date, delivery_type, baby_weight_kg, complications, outcome) VALUES ('79a814b9-4877-4160-b0ce-9906e5bee13f', 'b7064c1a-9830-41e1-8939-a561df6e89e0', '2025-08-15', '2026-05-22', 1, 0, NULL, 'active', '2025-12-01 05:50:38.30891+02', '2025-12-01 05:50:38.30891+02', 0, 0, 1, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.pregnancies (id, patient_id, lmp, edd, gravida, para, risk_flags, status, created_at, updated_at, abortion, living, pregnancy_number, delivery_date, delivery_type, baby_weight_kg, complications, outcome) VALUES ('d427c666-7b37-4149-b182-3ee5b93e149a', '1fb056f7-a7ca-4b54-baef-0d6c92117812', '2024-09-05', '2025-06-12', 2, 1, NULL, 'delivered', '2025-12-01 05:50:38.30891+02', '2025-12-01 05:50:38.30891+02', 0, 0, 1, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.pregnancies (id, patient_id, lmp, edd, gravida, para, risk_flags, status, created_at, updated_at, abortion, living, pregnancy_number, delivery_date, delivery_type, baby_weight_kg, complications, outcome) VALUES ('c1f44277-c44a-412a-af06-335f2890a4ed', '65cfccdb-f436-4961-b629-eabe39748d22', '2024-11-20', '2025-08-27', 3, 2, NULL, 'delivered', '2025-12-01 05:50:38.30891+02', '2025-12-01 05:50:38.30891+02', 0, 0, 1, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.pregnancies (id, patient_id, lmp, edd, gravida, para, risk_flags, status, created_at, updated_at, abortion, living, pregnancy_number, delivery_date, delivery_type, baby_weight_kg, complications, outcome) VALUES ('84152482-dc06-4d6f-bef7-652fb0274ccd', '7dba7916-2de9-447e-b9c7-11ed48346524', '2024-12-10', '2025-09-16', 4, 3, NULL, 'delivered', '2025-12-01 05:50:38.30891+02', '2025-12-01 05:50:38.30891+02', 0, 0, 1, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.pregnancies (id, patient_id, lmp, edd, gravida, para, risk_flags, status, created_at, updated_at, abortion, living, pregnancy_number, delivery_date, delivery_type, baby_weight_kg, complications, outcome) VALUES ('d45c6e96-fb0b-46d6-8e1f-f06ec4d0f7b9', '6d2bdbaa-ac91-474b-9014-65e8e0da0a3d', '2024-10-13', '2025-07-20', 1, 0, 'Normal', 'active', '2025-12-14 13:54:34.791367+02', '2025-12-14 14:06:13.13775+02', 0, 1, 2, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.pregnancies (id, patient_id, lmp, edd, gravida, para, risk_flags, status, created_at, updated_at, abortion, living, pregnancy_number, delivery_date, delivery_type, baby_weight_kg, complications, outcome) VALUES ('412baad7-d056-4037-9672-ace95e006d31', '6d2bdbaa-ac91-474b-9014-65e8e0da0a3d', '2025-10-13', '2026-07-20', 1, 0, NULL, 'active', '2025-12-14 13:46:04.90169+02', '2025-12-15 23:47:10.793328+02', 0, 1, 1, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.pregnancies (id, patient_id, lmp, edd, gravida, para, risk_flags, status, created_at, updated_at, abortion, living, pregnancy_number, delivery_date, delivery_type, baby_weight_kg, complications, outcome) VALUES ('8e4ac734-ae61-4983-a45b-dd320ffbd88a', '0bf38974-07fa-405a-b739-db0bb9613ac3', '2025-10-29', '2026-08-05', 1, 0, NULL, 'active', '2025-12-01 05:50:38.30891+02', '2025-12-15 23:51:27.012069+02', 0, 0, 1, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.pregnancies (id, patient_id, lmp, edd, gravida, para, risk_flags, status, created_at, updated_at, abortion, living, pregnancy_number, delivery_date, delivery_type, baby_weight_kg, complications, outcome) VALUES ('9e6bbe0a-1d52-4ddd-b496-c83a6cd425e3', '4ea60de4-53c8-47db-840d-e57cdd584934', '2025-12-15', '2026-09-20', 1, 0, NULL, 'active', '2026-01-18 02:34:27.479283+02', '2026-01-18 02:34:27.479283+02', 0, 0, 1, NULL, NULL, NULL, NULL, NULL);


--
-- PostgreSQL database dump complete
--

