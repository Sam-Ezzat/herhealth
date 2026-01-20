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
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.roles (id, name, permissions, created_at) VALUES ('3dddaea4-fd98-4ec2-9060-419892851ed5', 'Doctor', '["patients.view", "patients.create", "patients.update", "appointments.view", "appointments.viewOwn", "appointments.updateOwn", "visits.*", "pregnancy.*", "calendars.viewOwn", "calendars.updateOwn", "calendars.manageWorkingHours", "calendars.manageTimeSlots", "calendars.manageExceptions", "stats.viewOwn", "colorcodes.view"]', '2025-12-13 02:19:26.180642+02');
INSERT INTO public.roles (id, name, permissions, created_at) VALUES ('efaf6b86-2456-4751-9360-5f69b1eaac2d', 'Receptionist', '["patients.*", "doctors.view", "appointments.*", "visits.view", "calendars.view", "calendars.viewAvailableSlots", "whatsapp.send", "whatsapp.viewMessages", "colorcodes.view", "colorcodes.update", "stats.viewBasic"]', '2025-12-13 02:19:26.180642+02');
INSERT INTO public.roles (id, name, permissions, created_at) VALUES ('993f8015-f757-4da9-8424-31e88c89294e', 'Super Admin', '["users.*", "roles.*", "patients.*", "doctors.*", "appointments.*", "visits.*", "pregnancy.*", "calendars.*", "whatsapp.*", "colorcodes.*", "stats.*", "settings.*"]', '2025-12-13 02:19:26.180642+02');


--
-- PostgreSQL database dump complete
--

