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
-- Data for Name: doctors; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.doctors (id, first_name, last_name, specialty, phone, email, user_id, created_at) VALUES ('b258c852-0f82-4c96-9ca7-c4609c091e29', 'Dr. Maria', 'Santos', 'Obstetrician', '555-1101', 'maria.santos@herhealth.com', NULL, '2025-12-01 05:46:01.507251+02');
INSERT INTO public.doctors (id, first_name, last_name, specialty, phone, email, user_id, created_at) VALUES ('3bb6cd6c-4a7c-49ef-b2f5-9a4b39444abb', 'Dr. Linda', 'Chen', 'Gynecologist', '555-1102', 'linda.chen@herhealth.com', NULL, '2025-12-01 05:46:01.507251+02');
INSERT INTO public.doctors (id, first_name, last_name, specialty, phone, email, user_id, created_at) VALUES ('828ce74d-1e19-4a15-8388-292aa0001fcd', 'Dr. Patricia', 'Kumar', 'OB/GYN', '555-1103', 'patricia.kumar@herhealth.com', NULL, '2025-12-01 05:46:01.507251+02');
INSERT INTO public.doctors (id, first_name, last_name, specialty, phone, email, user_id, created_at) VALUES ('522429a1-69e3-4472-8af9-309975818e8d', 'Dr. Jennifer', 'Lee', 'Maternal-Fetal Medicine', '555-1104', 'jennifer.lee@herhealth.com', NULL, '2025-12-01 05:46:01.507251+02');
INSERT INTO public.doctors (id, first_name, last_name, specialty, phone, email, user_id, created_at) VALUES ('ebaba171-3194-4c6c-9bba-052689078eaf', 'Dr. Susan', 'Patel', 'Reproductive Endocrinology', '555-1105', 'susan.patel@herhealth.com', NULL, '2025-12-01 05:46:01.507251+02');
INSERT INTO public.doctors (id, first_name, last_name, specialty, phone, email, user_id, created_at) VALUES ('0fda0e91-654f-4c1b-9674-cb38bd94e877', 'Dr. Nancy', 'Williams', 'OB/GYN', '555-1106', 'nancy.williams@herhealth.com', NULL, '2025-12-01 05:46:01.507251+02');
INSERT INTO public.doctors (id, first_name, last_name, specialty, phone, email, user_id, created_at) VALUES ('addaf0b2-2010-4124-af40-4cc186a38a52', 'Dr. Karen', 'Rodriguez', 'Gynecologic Oncology', '555-1107', 'karen.rodriguez@herhealth.com', NULL, '2025-12-01 05:46:01.507251+02');
INSERT INTO public.doctors (id, first_name, last_name, specialty, phone, email, user_id, created_at) VALUES ('6453a2e8-a027-45bd-af26-a477acbea7f2', 'Dr. Barbara', 'Jackson', 'OB/GYN', '555-1108', 'barbara.jackson@herhealth.com', NULL, '2025-12-01 05:46:01.507251+02');
INSERT INTO public.doctors (id, first_name, last_name, specialty, phone, email, user_id, created_at) VALUES ('3cca1e2a-04ed-42fd-a908-207a231f6207', 'Dr. Lisa', 'Thompson', 'Urogynecology', '555-1109', 'lisa.thompson@herhealth.com', NULL, '2025-12-01 05:46:01.507251+02');
INSERT INTO public.doctors (id, first_name, last_name, specialty, phone, email, user_id, created_at) VALUES ('df3402a6-4522-4745-a193-0d36e9753fa7', 'Dr. Betty', 'White', 'OB/GYN', '555-1110', 'betty.white@herhealth.com', NULL, '2025-12-01 05:46:01.507251+02');
INSERT INTO public.doctors (id, first_name, last_name, specialty, phone, email, user_id, created_at) VALUES ('0e0be0cd-e993-462c-b589-49f4642b8c43', 'Dr. Maria', 'Santos', 'Obstetrician', '555-1101', 'maria.santos@herhealth.com', NULL, '2025-12-01 05:46:09.331412+02');
INSERT INTO public.doctors (id, first_name, last_name, specialty, phone, email, user_id, created_at) VALUES ('24ee1570-c604-4f5c-a915-8499452a0e40', 'Dr. Patricia', 'Kumar', 'OB/GYN', '555-1103', 'patricia.kumar@herhealth.com', NULL, '2025-12-01 05:46:09.331412+02');
INSERT INTO public.doctors (id, first_name, last_name, specialty, phone, email, user_id, created_at) VALUES ('e68f6b3f-d462-44ed-b18f-7fbac48d0106', 'Dr. Jennifer', 'Lee', 'Maternal-Fetal Medicine', '555-1104', 'jennifer.lee@herhealth.com', NULL, '2025-12-01 05:46:09.331412+02');
INSERT INTO public.doctors (id, first_name, last_name, specialty, phone, email, user_id, created_at) VALUES ('423a448d-1fed-4089-875e-2f3da8f69686', 'Dr. Susan', 'Patel', 'Reproductive Endocrinology', '555-1105', 'susan.patel@herhealth.com', NULL, '2025-12-01 05:46:09.331412+02');
INSERT INTO public.doctors (id, first_name, last_name, specialty, phone, email, user_id, created_at) VALUES ('c9393288-04c2-41f7-a9a1-e26fa39cfeb5', 'Dr. Karen', 'Rodriguez', 'Gynecologic Oncology', '555-1107', 'karen.rodriguez@herhealth.com', NULL, '2025-12-01 05:46:09.331412+02');
INSERT INTO public.doctors (id, first_name, last_name, specialty, phone, email, user_id, created_at) VALUES ('6dd2cff7-a100-4032-a963-fecd55ca5bac', 'Dr. Barbara', 'Jackson', 'OB/GYN', '555-1108', 'barbara.jackson@herhealth.com', NULL, '2025-12-01 05:46:09.331412+02');
INSERT INTO public.doctors (id, first_name, last_name, specialty, phone, email, user_id, created_at) VALUES ('5bc40da4-7d87-4840-8e59-fc7c143f8a1b', 'Dr. Lisa', 'Thompson', 'Urogynecology', '555-1109', 'lisa.thompson@herhealth.com', NULL, '2025-12-01 05:46:09.331412+02');
INSERT INTO public.doctors (id, first_name, last_name, specialty, phone, email, user_id, created_at) VALUES ('c3ff77ee-dee0-4c34-98b9-0edee96e07b4', 'Dr. Betty', 'White', 'OB/GYN', '555-1110', 'betty.white@herhealth.com', NULL, '2025-12-01 05:46:09.331412+02');
INSERT INTO public.doctors (id, first_name, last_name, specialty, phone, email, user_id, created_at) VALUES ('a958bb0c-d02e-404d-b4e3-f42de84c68b9', 'Dr. Linda', 'Chen', 'Gynecologist', '555-1102-12564', 'linda.chen@herhealth.com', NULL, '2025-12-01 05:46:09.331412+02');


--
-- PostgreSQL database dump complete
--

