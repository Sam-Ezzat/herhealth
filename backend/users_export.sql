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
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users (id, username, password_hash, full_name, role_id, email, phone, created_at, updated_at) VALUES ('a9551bc7-e190-4017-a256-bd1c48c70eea', 'superadmin', '$2b$10$hc/HmxnhRWQS5HILDJ0.Lu0R8O.XBheyeKp/p8XGABXBC3ACU.WD.', 'System Administrator', '993f8015-f757-4da9-8424-31e88c89294e', 'admin@herhealth.clinic', NULL, '2025-12-13 02:19:26.180642+02', '2025-12-13 03:00:08.774905+02');
INSERT INTO public.users (id, username, password_hash, full_name, role_id, email, phone, created_at, updated_at) VALUES ('b9796075-179f-4a0c-a266-36d01aebd524', 'soha', '$2b$10$k8tSSaxr7M9gi08e3z72Ru562iJ9V4ryYwQEBTP7/SQWqCYGV.1Ya', 'Soha Mohamed', '3dddaea4-fd98-4ec2-9060-419892851ed5', 'soha@herhealth.com', '0123698547', '2025-12-13 02:45:42.148433+02', '2026-01-09 01:06:04.166936+02');
INSERT INTO public.users (id, username, password_hash, full_name, role_id, email, phone, created_at, updated_at) VALUES ('839cf3a8-85b8-4acd-91ed-7753192c167b', 'admin', '$2b$10$E/n4wsJzgym0rVakDKs/U.UMmdiSnrpIRB8WBPrfoELxcVJMnPEmi', 'System Administrator', '993f8015-f757-4da9-8424-31e88c89294e', 'admin@herhealth.com', '01226470484', '2025-12-01 04:19:55.792667+02', '2026-01-09 01:06:34.600201+02');


--
-- PostgreSQL database dump complete
--

