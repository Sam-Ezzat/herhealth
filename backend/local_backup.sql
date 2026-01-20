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
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: calculate_edd(date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calculate_edd(lmp_date date) RETURNS date
    LANGUAGE plpgsql IMMUTABLE
    AS $$
BEGIN
  RETURN lmp_date + INTERVAL '280 days';
END;
$$;


ALTER FUNCTION public.calculate_edd(lmp_date date) OWNER TO postgres;

--
-- Name: calculate_pregnancy_week(date, date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calculate_pregnancy_week(lmp_date date, check_date date DEFAULT CURRENT_DATE) RETURNS integer
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Simple date subtraction divided by 7 to get weeks
  RETURN FLOOR((check_date - lmp_date) / 7);
END;
$$;


ALTER FUNCTION public.calculate_pregnancy_week(lmp_date date, check_date date) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: patients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.patients (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    first_name character varying(150) NOT NULL,
    last_name character varying(150) NOT NULL,
    date_of_birth date,
    gender character varying(32) DEFAULT 'Female'::character varying,
    phone character varying(50),
    email character varying(255),
    address text,
    emergency_contact_name text,
    chronic_conditions text,
    allergies text,
    color_code_id integer,
    color_note text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    emergency_contact_phone character varying(50),
    blood_type character varying(10),
    current_medications text,
    insurance_provider character varying(255),
    insurance_number character varying(100),
    is_pregnant boolean DEFAULT false,
    lmp date,
    edd date,
    pregnancy_status character varying(50),
    current_pregnancy_week integer,
    gravida integer,
    para integer,
    abortion integer,
    living integer,
    CONSTRAINT patients_gender_check CHECK (((gender)::text = 'Female'::text))
);


ALTER TABLE public.patients OWNER TO postgres;

--
-- Name: COLUMN patients.is_pregnant; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.patients.is_pregnant IS 'Whether patient is currently pregnant';


--
-- Name: COLUMN patients.lmp; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.patients.lmp IS 'Last Menstrual Period date';


--
-- Name: COLUMN patients.edd; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.patients.edd IS 'Expected Delivery Date';


--
-- Name: COLUMN patients.pregnancy_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.patients.pregnancy_status IS 'Status: active, delivered, terminated, etc.';


--
-- Name: COLUMN patients.current_pregnancy_week; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.patients.current_pregnancy_week IS 'Current week of pregnancy';


--
-- Name: COLUMN patients.gravida; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.patients.gravida IS 'Total number of pregnancies (G)';


--
-- Name: COLUMN patients.para; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.patients.para IS 'Number of deliveries after 20 weeks (P)';


--
-- Name: COLUMN patients.abortion; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.patients.abortion IS 'Number of pregnancy losses before 20 weeks (A)';


--
-- Name: COLUMN patients.living; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.patients.living IS 'Number of living children (L)';


--
-- Name: pregnancies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pregnancies (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    patient_id uuid,
    lmp date,
    edd date,
    gravida integer,
    para integer,
    risk_flags text,
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    abortion integer DEFAULT 0,
    living integer DEFAULT 0,
    pregnancy_number integer,
    delivery_date date,
    delivery_type character varying(50),
    baby_weight_kg numeric(5,2),
    complications text,
    outcome character varying(50)
);


ALTER TABLE public.pregnancies OWNER TO postgres;

--
-- Name: COLUMN pregnancies.abortion; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pregnancies.abortion IS 'Number of abortions/miscarriages (A in GPAL)';


--
-- Name: COLUMN pregnancies.living; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pregnancies.living IS 'Number of living children from this pregnancy';


--
-- Name: COLUMN pregnancies.pregnancy_number; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pregnancies.pregnancy_number IS 'Sequential pregnancy number for this patient (1st, 2nd, etc)';


--
-- Name: COLUMN pregnancies.delivery_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pregnancies.delivery_date IS 'Actual delivery date';


--
-- Name: COLUMN pregnancies.delivery_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pregnancies.delivery_type IS 'Normal/C-section/Assisted/etc';


--
-- Name: COLUMN pregnancies.outcome; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pregnancies.outcome IS 'live_birth/stillbirth/miscarriage/abortion/ongoing';


--
-- Name: active_pregnancies_view; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.active_pregnancies_view AS
 SELECT p.id,
    p.patient_id,
    p.lmp,
    p.edd,
    p.gravida,
    p.para,
    p.risk_flags,
    p.status,
    p.created_at,
    p.updated_at,
    p.abortion,
    p.living,
    p.pregnancy_number,
    p.delivery_date,
    p.delivery_type,
    p.baby_weight_kg,
    p.complications,
    p.outcome,
    public.calculate_pregnancy_week(p.lmp) AS current_week,
    concat(pt.first_name, ' ', pt.last_name) AS patient_name,
    pt.phone AS patient_phone
   FROM (public.pregnancies p
     JOIN public.patients pt ON ((p.patient_id = pt.id)))
  WHERE ((p.status)::text = 'active'::text);


ALTER VIEW public.active_pregnancies_view OWNER TO postgres;

--
-- Name: appointments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.appointments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    patient_id uuid,
    doctor_id uuid,
    start_at timestamp with time zone,
    end_at timestamp with time zone,
    type character varying(100),
    status character varying(50) DEFAULT 'scheduled'::character varying,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    reservation_type character varying(50) DEFAULT 'Clinic'::character varying,
    created_by uuid,
    CONSTRAINT check_reservation_type CHECK (((reservation_type)::text = ANY ((ARRAY['Clinic'::character varying, 'samar_phone'::character varying, 'Habiba_phone'::character varying, 'Doctor'::character varying, 'website'::character varying])::text[])))
);


ALTER TABLE public.appointments OWNER TO postgres;

--
-- Name: calendar_exceptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.calendar_exceptions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    calendar_id uuid,
    exception_type character varying(50) NOT NULL,
    start_datetime timestamp with time zone NOT NULL,
    end_datetime timestamp with time zone NOT NULL,
    reason text,
    cancel_appointments boolean DEFAULT false,
    notify_patients boolean DEFAULT true,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT valid_datetime_range CHECK ((end_datetime > start_datetime))
);


ALTER TABLE public.calendar_exceptions OWNER TO postgres;

--
-- Name: color_code; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.color_code (
    id integer NOT NULL,
    color_name character varying(50) NOT NULL,
    color_hex character varying(7) NOT NULL,
    is_customizable boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    notes text,
    is_active boolean DEFAULT true,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.color_code OWNER TO postgres;

--
-- Name: color_code_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.color_code_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.color_code_id_seq OWNER TO postgres;

--
-- Name: color_code_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.color_code_id_seq OWNED BY public.color_code.id;


--
-- Name: consent_forms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.consent_forms (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    patient_id uuid,
    visit_id uuid,
    form_type character varying(100),
    content text,
    signed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.consent_forms OWNER TO postgres;

--
-- Name: doctor_calendars; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctor_calendars (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    doctor_id uuid,
    name character varying(255) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    timezone character varying(100) DEFAULT 'UTC'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.doctor_calendars OWNER TO postgres;

--
-- Name: doctor_time_slots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctor_time_slots (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    calendar_id uuid,
    slot_duration integer NOT NULL,
    break_duration integer DEFAULT 0,
    max_appointments_per_slot integer DEFAULT 1,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.doctor_time_slots OWNER TO postgres;

--
-- Name: doctor_working_hours; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctor_working_hours (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    calendar_id uuid,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_closed boolean DEFAULT false,
    CONSTRAINT doctor_working_hours_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6))),
    CONSTRAINT valid_time_range CHECK ((end_time > start_time))
);


ALTER TABLE public.doctor_working_hours OWNER TO postgres;

--
-- Name: doctors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctors (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    first_name character varying(150),
    last_name character varying(150),
    specialty character varying(150),
    phone character varying(50),
    email character varying(255),
    user_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.doctors OWNER TO postgres;

--
-- Name: gyne_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gyne_records (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    patient_id uuid,
    record_date date,
    exam_findings text,
    pap_result text,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.gyne_records OWNER TO postgres;

--
-- Name: imaging; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.imaging (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    visit_id uuid,
    patient_id uuid,
    modality character varying(100),
    report text,
    measurements jsonb,
    performed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.imaging OWNER TO postgres;

--
-- Name: inventory_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255),
    sku character varying(100),
    quantity integer DEFAULT 0,
    expiry_date date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.inventory_items OWNER TO postgres;

--
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoices (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    patient_id uuid,
    visit_id uuid,
    total_amount numeric(10,2),
    status character varying(50) DEFAULT 'pending'::character varying,
    issued_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.invoices OWNER TO postgres;

--
-- Name: lab_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lab_orders (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    visit_id uuid,
    patient_id uuid,
    test_type character varying(150),
    status character varying(50) DEFAULT 'pending'::character varying,
    ordered_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.lab_orders OWNER TO postgres;

--
-- Name: lab_results; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lab_results (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    lab_order_id uuid,
    result_summary character varying(500),
    full_result jsonb,
    result_at timestamp with time zone,
    abnormal boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.lab_results OWNER TO postgres;

--
-- Name: medications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.medications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    generic_name character varying(255),
    indications text,
    pregnancy_safe boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.medications OWNER TO postgres;

--
-- Name: ob_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ob_records (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    pregnancy_id uuid,
    record_date date,
    weight_kg numeric(5,2),
    bp_systolic smallint,
    bp_diastolic smallint,
    fundal_height_cm numeric(5,2),
    fetal_heart_rate character varying(50),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    pregnancy_week integer,
    visit_id uuid
);


ALTER TABLE public.ob_records OWNER TO postgres;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    invoice_id uuid,
    amount numeric(10,2),
    method character varying(50),
    paid_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: prescription_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prescription_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    prescription_id uuid,
    medication_id uuid,
    dosage character varying(100),
    frequency character varying(100),
    duration_days integer,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.prescription_items OWNER TO postgres;

--
-- Name: prescriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prescriptions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    visit_id uuid,
    patient_id uuid,
    doctor_id uuid,
    issued_at date DEFAULT CURRENT_DATE,
    instructions text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.prescriptions OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    permissions jsonb,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    username character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(255),
    role_id uuid,
    email character varying(255),
    phone character varying(50),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: visits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.visits (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    appointment_id uuid,
    patient_id uuid,
    doctor_id uuid,
    visit_date date,
    reason text,
    clinical_notes text,
    diagnosis character varying(255),
    treatment_plan text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    pregnancy_id uuid,
    pregnancy_notes text,
    pregnancy_week integer
);


ALTER TABLE public.visits OWNER TO postgres;

--
-- Name: COLUMN visits.pregnancy_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.visits.pregnancy_id IS 'Links visit to a specific pregnancy journey';


--
-- Name: COLUMN visits.pregnancy_notes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.visits.pregnancy_notes IS 'Doctor notes specific to pregnancy during this visit';


--
-- Name: COLUMN visits.pregnancy_week; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.visits.pregnancy_week IS 'Pregnancy week at time of visit';


--
-- Name: whatsapp_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.whatsapp_messages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    appointment_id uuid,
    patient_id uuid,
    phone_number character varying(50) NOT NULL,
    message_type character varying(50) NOT NULL,
    message_content text NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying,
    whatsapp_message_id character varying(255),
    error_message text,
    sent_at timestamp with time zone,
    delivered_at timestamp with time zone,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    template_id uuid
);


ALTER TABLE public.whatsapp_messages OWNER TO postgres;

--
-- Name: TABLE whatsapp_messages; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.whatsapp_messages IS 'Tracks all WhatsApp messages sent to patients with delivery status';


--
-- Name: COLUMN whatsapp_messages.template_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.whatsapp_messages.template_id IS 'Reference to the template used for this message';


--
-- Name: whatsapp_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.whatsapp_templates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    template_name character varying(100) NOT NULL,
    template_type character varying(50) NOT NULL,
    template_content text NOT NULL,
    variables jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.whatsapp_templates OWNER TO postgres;

--
-- Name: color_code id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.color_code ALTER COLUMN id SET DEFAULT nextval('public.color_code_id_seq'::regclass);


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.appointments (id, patient_id, doctor_id, start_at, end_at, type, status, notes, created_at, updated_at, reservation_type, created_by) FROM stdin;
dc13785c-f9a8-42f0-8571-6004e66ceaa9	6d2bdbaa-ac91-474b-9014-65e8e0da0a3d	6453a2e8-a027-45bd-af26-a477acbea7f2	2026-01-19 13:20:00+02	2026-01-19 13:50:00+02	Walk-in Appointment	scheduled	\N	2026-01-18 03:24:53.688357+02	2026-01-18 03:24:53.688357+02	Clinic	839cf3a8-85b8-4acd-91ed-7753192c167b
374e20f8-060a-4cca-a3c8-16614a4cd31e	7dba7916-2de9-447e-b9c7-11ed48346524	a958bb0c-d02e-404d-b4e3-f42de84c68b9	2025-12-09 20:00:00+02	2025-12-09 20:15:00+02	Annual Exam 	confirmed		2025-12-01 16:30:02.274115+02	2025-12-09 16:14:05.137954+02	Clinic	\N
98a33164-7a21-4c69-ba58-c54f8d1f9d69	a5bce3f9-4624-45c9-9f05-3f87ba722aa5	e68f6b3f-d462-44ed-b18f-7fbac48d0106	2025-12-09 20:15:00+02	2025-12-09 20:30:00+02	Annual Exam 	confirmed		2025-12-01 16:45:40.339886+02	2025-12-09 16:14:17.87972+02	Clinic	\N
8a4307e5-1d61-4e3a-8cf3-9e1a1eb25575	b7064c1a-9830-41e1-8939-a561df6e89e0	24ee1570-c604-4f5c-a915-8499452a0e40	2025-12-16 01:15:00+02	2025-12-16 01:30:00+02	Annual Exam 	scheduled	\N	2025-12-01 20:32:14.939408+02	2025-12-01 20:32:14.939408+02	Clinic	\N
625563cc-36f5-4bfb-b388-add6557dee78	0bf38974-07fa-405a-b739-db0bb9613ac3	6453a2e8-a027-45bd-af26-a477acbea7f2	2025-12-03 14:30:00+02	2025-12-03 15:00:00+02	Follow-up	scheduled	Migraine management	2025-12-01 05:46:32.02785+02	2025-12-01 21:47:34.936128+02	Clinic	\N
38fce55f-2e7a-4519-846f-ab282e3b14c4	7dba7916-2de9-447e-b9c7-11ed48346524	0fda0e91-654f-4c1b-9674-cb38bd94e877	2025-12-09 22:00:00+02	2025-12-09 22:30:00+02	Follow-up	scheduled	Hypertension follow-up	2025-12-01 05:46:32.02785+02	2025-12-09 18:58:40.595556+02	Clinic	\N
5b683eed-6c75-4908-a802-484dc0a84714	65cfccdb-f436-4961-b629-eabe39748d22	b258c852-0f82-4c96-9ca7-c4609c091e29	2025-12-05 07:00:00+02	2025-12-05 07:30:00+02	Annual Checkup	no-show	Routine annual examination	2025-12-01 05:46:32.02785+02	2025-12-05 02:53:27.329034+02	Clinic	\N
df5967ce-2d61-41c3-9395-8fafdee1fef9	4ea60de4-53c8-47db-840d-e57cdd584934	6453a2e8-a027-45bd-af26-a477acbea7f2	2026-01-19 14:00:00+02	2026-01-19 14:15:00+02	Annual checkup	scheduled	\N	2026-01-18 03:31:17.543958+02	2026-01-18 03:31:17.543958+02	Doctor	839cf3a8-85b8-4acd-91ed-7753192c167b
120b3094-cf99-4400-9b19-4e68085da175	d0bbf489-8719-444a-9e7c-d95806e88cc2	6dd2cff7-a100-4032-a963-fecd55ca5bac	2025-12-12 09:00:00+02	2025-12-12 09:15:00+02	Walk-in Appointment	scheduled	\N	2025-12-10 03:48:11.089114+02	2025-12-10 03:48:11.089114+02	Clinic	\N
84b67325-ce68-4fe3-bab1-545e68423a39	9d29df28-9c05-4009-b6b0-e2c01f3b85c8	ebaba171-3194-4c6c-9bba-052689078eaf	2025-12-09 16:15:00+02	2025-12-09 16:45:00+02	Prenatal Visit	scheduled	Second trimester ultrasound	2025-12-01 05:46:32.02785+02	2025-12-09 16:12:15.853183+02	Clinic	\N
44a4523d-e4c1-4316-8d61-5d3bc4a99356	7f45163c-3ef5-41b6-b5d7-5c833c0ce6c1	addaf0b2-2010-4124-af40-4cc186a38a52	2025-12-09 17:30:00+02	2025-12-09 18:00:00+02	Annual Checkup	no-show	Annual pap smear	2025-12-01 05:46:32.02785+02	2025-12-09 16:12:36.051882+02	Clinic	\N
fcd46cdb-5c46-4860-ac47-fef947a7ce28	65cfccdb-f436-4961-b629-eabe39748d22	24ee1570-c604-4f5c-a915-8499452a0e40	2025-12-09 19:15:00+02	2025-12-09 19:45:00+02	Prental Checkup	scheduled		2025-12-01 16:32:42.952062+02	2025-12-09 16:12:44.353958+02	Clinic	\N
7c6ac308-7af2-4506-8bf1-859245c754a4	af0e04e5-0aff-421c-9426-3c74c8289e90	6453a2e8-a027-45bd-af26-a477acbea7f2	2025-12-13 09:30:00+02	2025-12-13 09:45:00+02	Annual Exam	scheduled		2025-12-10 04:16:20.57634+02	2025-12-10 04:34:10.123238+02	Clinic	\N
eeabdff9-bbcc-4884-8068-8cf15dd8a719	b7064c1a-9830-41e1-8939-a561df6e89e0	3bb6cd6c-4a7c-49ef-b2f5-9a4b39444abb	2025-12-13 13:00:00+02	2025-12-13 13:15:00+02	Prenatal Visit	scheduled	First trimester checkup	2025-12-01 05:46:32.02785+02	2025-12-11 23:23:15.521153+02	Clinic	\N
86697c39-bb12-43e3-93ea-00cb05ebfac6	d0bbf489-8719-444a-9e7c-d95806e88cc2	6453a2e8-a027-45bd-af26-a477acbea7f2	2025-12-12 09:00:00+02	2025-12-12 09:15:00+02	Prental Checkup	confirmed		2025-12-10 04:32:06.833644+02	2025-12-11 23:25:27.658451+02	Clinic	\N
a91d4c9f-3641-4f81-8e20-7f06c3b4cf7b	3494cf07-3954-4cd6-8401-6c0a66419186	6453a2e8-a027-45bd-af26-a477acbea7f2	2025-12-12 09:00:00+02	2025-12-12 09:15:00+02	Walk-in Appointment	scheduled		2025-12-10 04:10:52.707764+02	2025-12-11 23:25:34.192714+02	Clinic	\N
d9321c25-38d9-4edf-b533-2b8b4a1b3811	41023f41-a7b7-4ff2-8110-dc18f657327f	24ee1570-c604-4f5c-a915-8499452a0e40	2026-01-31 07:00:00+02	2026-01-31 07:30:00+02	متابعة حمل	confirmed		2025-12-12 02:03:33.006606+02	2025-12-12 02:04:17.214575+02	phone	\N
6b6474cf-8b54-4119-a5e1-464c1e775900	a5bce3f9-4624-45c9-9f05-3f87ba722aa5	6453a2e8-a027-45bd-af26-a477acbea7f2	2025-12-13 10:00:00+02	2025-12-13 10:15:00+02	Consultation	scheduled	Thyroid consultation	2025-12-01 05:46:32.02785+02	2025-12-11 23:40:46.02651+02	Clinic	\N
61723856-5ab6-4b15-b239-74ac23d956e5	65cfccdb-f436-4961-b629-eabe39748d22	6453a2e8-a027-45bd-af26-a477acbea7f2	2025-12-13 10:15:00+02	2025-12-13 10:30:00+02	Walk-in Appointment	scheduled		2025-12-10 04:12:24.88137+02	2025-12-11 23:40:56.022519+02	Clinic	\N
d2f3c9d3-1c41-4cf6-a8b0-ea9dcb764708	41023f41-a7b7-4ff2-8110-dc18f657327f	df3402a6-4522-4745-a193-0d36e9753fa7	2025-12-13 11:30:00+02	2025-12-13 11:45:00+02	Prenatal Visit	confirmed	Third trimester checkup	2025-12-01 05:46:32.02785+02	2025-12-11 23:41:56.705363+02	Clinic	\N
3e369a6c-1389-4cc6-84a0-2a2c98c4f7b3	7f45163c-3ef5-41b6-b5d7-5c833c0ce6c1	6453a2e8-a027-45bd-af26-a477acbea7f2	2025-12-20 02:00:00+02	2025-12-20 02:30:00+02	Annual Exam	confirmed		2025-12-01 16:48:18.397376+02	2025-12-12 00:48:07.757895+02	Clinic	\N
97897d98-e2f3-4b5d-aa4e-ece80ad493d0	af0e04e5-0aff-421c-9426-3c74c8289e90	6453a2e8-a027-45bd-af26-a477acbea7f2	2025-12-13 13:15:00+02	2025-12-13 13:30:00+02	Prental Checkup	confirmed	\N	2025-12-10 04:31:09.005847+02	2025-12-13 12:22:33.793445+02	Clinic	\N
05483674-599b-4513-810d-2ee159e88166	95aeb430-e169-44b5-a460-5a33a87fa233	6453a2e8-a027-45bd-af26-a477acbea7f2	2025-12-25 09:00:00+02	2025-12-25 09:15:00+02	Annual Exam 	confirmed		2025-12-16 03:45:40.825376+02	2025-12-16 04:03:51.714959+02	Clinic	\N
6a6911ac-035a-438e-ace4-a634c549eb84	41023f41-a7b7-4ff2-8110-dc18f657327f	6453a2e8-a027-45bd-af26-a477acbea7f2	2026-01-10 09:00:00+02	2026-01-10 09:15:00+02	متابعة حمل	confirmed		2025-12-12 00:49:19.678585+02	2026-01-09 01:01:14.58999+02	Clinic	\N
610308cf-7181-498c-9bd8-d01d64baefcc	6d2bdbaa-ac91-474b-9014-65e8e0da0a3d	6453a2e8-a027-45bd-af26-a477acbea7f2	2026-01-15 09:15:00+02	2026-01-15 09:45:00+02	Walk-in Appointment	confirmed		2025-12-12 03:36:33.537372+02	2026-01-14 00:09:13.661914+02	Clinic	\N
7a211d20-961b-44ab-ad55-b7808096e584	1fb056f7-a7ca-4b54-baef-0d6c92117812	828ce74d-1e19-4a15-8388-292aa0001fcd	2025-12-06 14:00:00+02	2025-12-06 14:30:00+02	Follow-up	confirmed	Asthma medication review	2025-12-01 05:46:32.02785+02	2025-12-01 05:46:32.02785+02	Clinic	b9796075-179f-4a0c-a266-36d01aebd524
a42091e2-c195-4863-8d42-d6fdf4b88818	4257a240-2972-4424-8acd-a273188f37a3	522429a1-69e3-4472-8af9-309975818e8d	2025-12-07 11:00:00+02	2025-12-07 11:30:00+02	Consultation	scheduled	New patient consultation	2025-12-01 05:46:32.02785+02	2025-12-01 05:46:32.02785+02	Clinic	b9796075-179f-4a0c-a266-36d01aebd524
6952e8f8-a486-460d-9bbb-3c19f1ee9589	65cfccdb-f436-4961-b629-eabe39748d22	6dd2cff7-a100-4032-a963-fecd55ca5bac	2025-12-09 20:45:00+02	2025-12-09 21:00:00+02	Annual Exam	scheduled		2025-12-01 16:34:17.773954+02	2025-12-09 16:13:50.474202+02	Clinic	b9796075-179f-4a0c-a266-36d01aebd524
a251c3f1-d665-4070-b57b-28c937ff1944	4ea60de4-53c8-47db-840d-e57cdd584934	6453a2e8-a027-45bd-af26-a477acbea7f2	2026-01-22 07:00:00+02	2026-01-22 07:15:00+02	Walk-in Appointment	confirmed		2026-01-18 01:51:05.093788+02	2026-01-18 02:21:50.004659+02	Clinic	\N
73e60553-2392-4af0-b5e1-a60372e7c81d	95aeb430-e169-44b5-a460-5a33a87fa233	6453a2e8-a027-45bd-af26-a477acbea7f2	2026-01-19 13:00:00+02	2026-01-19 13:15:00+02	Walk-in Appointment	scheduled	\N	2026-01-18 03:23:56.503349+02	2026-01-18 03:23:56.503349+02	Clinic	839cf3a8-85b8-4acd-91ed-7753192c167b
\.


--
-- Data for Name: calendar_exceptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.calendar_exceptions (id, calendar_id, exception_type, start_datetime, end_datetime, reason, cancel_appointments, notify_patients, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: color_code; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.color_code (id, color_name, color_hex, is_customizable, created_at, notes, is_active, updated_at) FROM stdin;
7	Black	#000000	t	2025-12-05 15:44:26.71955+02	Emergency	t	2025-12-05 15:44:26.71955+02
4	Blue	#0000FF	f	2025-12-01 03:02:58.327539+02	Normal	t	2025-12-05 15:44:42.622595+02
3	Green	#00FF00	f	2025-12-01 03:02:58.327539+02	Pregnancy Case	t	2025-12-05 15:44:57.80459+02
5	Orange	#FFA500	f	2025-12-01 03:02:58.327539+02	Can Wait 	t	2025-12-05 15:45:28.537924+02
6	Purple	#800080	f	2025-12-01 03:02:58.327539+02	Reschedule	t	2025-12-05 15:45:41.239066+02
1	Red	#FF0000	f	2025-12-01 03:02:58.327539+02	Cancelled 	t	2025-12-05 15:45:59.742662+02
8	New Comers	#004040	t	2025-12-06 02:33:15.819103+02	New Comers 	t	2025-12-06 02:33:37.116021+02
2	Yellow	#efcf52	f	2025-12-01 03:02:58.327539+02	Reminder	t	2025-12-12 03:08:25.675615+02
9	High Risk	#1a6a2c	t	2026-01-09 00:59:28.1238+02	High Risk Can't wait	t	2026-01-09 00:59:28.1238+02
\.


--
-- Data for Name: consent_forms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.consent_forms (id, patient_id, visit_id, form_type, content, signed_at, created_at) FROM stdin;
c58b6ded-8278-4737-963d-6e935e543919	65cfccdb-f436-4961-b629-eabe39748d22	05ec5c6d-33f5-4348-bcac-70ce619df7f1	Treatment Consent	I consent to the proposed treatment and procedures	2025-11-10 21:41:04.867206+02	2025-12-01 05:51:59.375082+02
4848e189-dd4a-4752-8934-a686f951dcd5	b7064c1a-9830-41e1-8939-a561df6e89e0	f56d0683-7917-4432-9668-b14c71988332	Treatment Consent	I consent to the proposed treatment and procedures	2025-10-27 00:30:18.361504+03	2025-12-01 05:51:59.375082+02
58ef2492-8abf-4f42-b824-2d754662b0da	1fb056f7-a7ca-4b54-baef-0d6c92117812	a3f94806-86fa-40bd-8527-e1155e6dbc5d	Treatment Consent	I consent to the proposed treatment and procedures	2025-10-29 19:44:28.302972+03	2025-12-01 05:51:59.375082+02
60956efa-26e8-4a2b-94a4-a1426a79ecba	4257a240-2972-4424-8acd-a273188f37a3	fdd0c2ff-8b7d-4ea8-8e25-14c9a56034c9	Treatment Consent	I consent to the proposed treatment and procedures	2025-10-18 02:59:13.428237+03	2025-12-01 05:51:59.375082+02
e95de751-a212-4ea7-b4c3-937d1158a96e	9d29df28-9c05-4009-b6b0-e2c01f3b85c8	aedd176d-3593-4f68-92f1-f84b3d0282d1	Treatment Consent	I consent to the proposed treatment and procedures	2025-11-27 14:52:48.165018+02	2025-12-01 05:51:59.375082+02
6fb3849f-b2e0-44cb-8ab4-a7f5e766e51f	7dba7916-2de9-447e-b9c7-11ed48346524	7917f0dd-9bb2-4c20-8b7f-fadf7a598bad	Treatment Consent	I consent to the proposed treatment and procedures	2025-11-08 05:27:55.058551+02	2025-12-01 05:51:59.375082+02
f2f914d2-a48c-4b5e-97f6-ecc06e326ef6	7f45163c-3ef5-41b6-b5d7-5c833c0ce6c1	b59c6966-e359-499e-a5b0-bbed111731e2	Treatment Consent	I consent to the proposed treatment and procedures	2025-10-16 15:21:31.660552+03	2025-12-01 05:51:59.375082+02
bb37f943-ba6d-4ccb-80a3-bd7b0137b49c	a5bce3f9-4624-45c9-9f05-3f87ba722aa5	d1356c4d-45df-404b-9b8e-9388f58afdb6	Treatment Consent	I consent to the proposed treatment and procedures	2025-11-19 09:10:21.852141+02	2025-12-01 05:51:59.375082+02
5af270c5-8298-4c7c-bffe-6c3252975619	0bf38974-07fa-405a-b739-db0bb9613ac3	8d70e5ae-57e1-4ac4-a9c5-0f312d30ee42	Treatment Consent	I consent to the proposed treatment and procedures	2025-11-26 12:37:49.97998+02	2025-12-01 05:51:59.375082+02
1be3355d-3405-422f-8d06-bae3bd8200b0	41023f41-a7b7-4ff2-8110-dc18f657327f	d0442210-94e1-42ad-a66f-205d4fb371b9	Treatment Consent	I consent to the proposed treatment and procedures	2025-11-04 16:49:30.863711+02	2025-12-01 05:51:59.375082+02
\.


--
-- Data for Name: doctor_calendars; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctor_calendars (id, doctor_id, name, description, is_active, timezone, created_at, updated_at) FROM stdin;
9a32d9cb-3a7d-4e05-9b68-da8bfa74d93e	24ee1570-c604-4f5c-a915-8499452a0e40	Main Calendar	Default calendar	t	UTC	2025-12-05 02:38:24.562439+02	2025-12-05 02:38:24.562439+02
f003b2e4-638e-4989-9e60-96bfe247bd7f	df3402a6-4522-4745-a193-0d36e9753fa7	Dr. Betty White's Calendar	Default calendar	t	UTC	2025-12-05 03:58:01.782744+02	2025-12-05 03:58:01.782744+02
b4956337-263a-47c0-9c26-410cfdac4b41	6dd2cff7-a100-4032-a963-fecd55ca5bac	Main Calendar	Default calendar	f	UTC	2025-12-05 02:38:22.466704+02	2025-12-10 03:45:54.359938+02
299b5cf9-7d79-450c-8193-968acaddddbe	6dd2cff7-a100-4032-a963-fecd55ca5bac	Dr. Barbara Jackson's Calendar	Default calendar	f	UTC	2025-12-10 03:45:54.48401+02	2025-12-10 03:46:05.453953+02
1c7bb575-2e0d-491c-8104-7d37cf92a1d4	423a448d-1fed-4089-875e-2f3da8f69686	Dr. Susan Patel's Calendar	Default calendar	f	UTC	2025-12-05 03:58:01.968832+02	2025-12-12 02:52:05.472808+02
5087b4ae-3d8d-463e-9ddd-dfc22ecfbff1	423a448d-1fed-4089-875e-2f3da8f69686	Dr. Susan Patel's Calendar	Default calendar	f	UTC	2025-12-12 02:52:05.498792+02	2025-12-12 02:57:00.033512+02
04e486b1-3d21-45c7-91be-ec94556047e1	423a448d-1fed-4089-875e-2f3da8f69686	Dr. Susan Patel's Calendar	Default calendar	f	UTC	2025-12-12 02:57:00.349658+02	2025-12-12 02:58:36.820096+02
40b0e422-61fd-4d85-a7d0-cd3b1cebc9a8	522429a1-69e3-4472-8af9-309975818e8d	Dr. Jennifer Lee's Calendar	Default calendar	f	UTC	2025-12-05 03:58:01.810681+02	2025-12-12 02:58:53.811045+02
73966dbc-608c-4605-bf99-a06ad6d30acb	e68f6b3f-d462-44ed-b18f-7fbac48d0106	Dr. Jennifer Lee's Calendar	Default calendar	f	UTC	2025-12-05 03:58:01.817787+02	2025-12-12 02:58:57.926854+02
5c7affdc-042f-469b-a404-a17737ae6e40	0e0be0cd-e993-462c-b589-49f4642b8c43	Dr. Maria Santos's Calendar	Default calendar	f	UTC	2025-12-05 03:58:01.925092+02	2025-12-12 02:59:58.60236+02
671b0ccc-a007-4b50-aa2f-c181fd3e0521	423a448d-1fed-4089-875e-2f3da8f69686	Dr. Susan Patel's Calendar	Default calendar	f	UTC	2025-12-12 02:58:36.862188+02	2025-12-12 03:01:33.419299+02
d237eeb2-40ce-48ee-9f70-0afa93658a73	423a448d-1fed-4089-875e-2f3da8f69686	Dr. Susan Patel's Calendar	Default calendar	f	UTC	2025-12-12 03:01:33.724594+02	2025-12-12 03:01:59.262413+02
b22569b1-2713-44b5-a5de-56a2d110bdeb	423a448d-1fed-4089-875e-2f3da8f69686	Dr. Susan Patel's Calendar	Default calendar	f	UTC	2025-12-12 03:01:59.291922+02	2025-12-12 03:02:52.303965+02
ab555073-5077-43fb-b917-01bf99ce5848	522429a1-69e3-4472-8af9-309975818e8d	Dr. Jennifer Lee's Calendar	Default calendar	f	UTC	2025-12-12 02:58:53.830393+02	2025-12-12 03:03:17.231191+02
4c3872e4-079e-4e6b-9329-5b502011bd92	c9393288-04c2-41f7-a9a1-e26fa39cfeb5	Dr. Karen Rodriguez's Calendar	Default calendar	f	UTC	2025-12-05 03:58:01.927811+02	2025-12-12 03:03:24.71778+02
ae9b0e7f-fbdf-433f-939d-56d7e86fcb40	3cca1e2a-04ed-42fd-a908-207a231f6207	Dr. Lisa Thompson's Calendar	Default calendar	f	UTC	2025-12-05 03:58:01.911742+02	2025-12-12 03:03:35.23261+02
461213d2-bbf5-4457-9f55-fbf1571f3c8d	b258c852-0f82-4c96-9ca7-c4609c091e29	Dr. Maria Santos's Calendar	Default calendar	f	UTC	2025-12-05 03:58:01.926896+02	2025-12-12 03:03:40.982021+02
7aeef31e-5302-4dd4-b82d-ccf0aaead9c6	828ce74d-1e19-4a15-8388-292aa0001fcd	Dr. Patricia Kumar's Calendar	Default calendar	f	UTC	2025-12-05 03:58:01.942521+02	2025-12-12 03:03:49.24667+02
22dff140-b5e0-45d8-929e-e56ae2c83456	0fda0e91-654f-4c1b-9674-cb38bd94e877	Dr. Nancy Williams's Calendar	Default calendar	f	UTC	2025-12-05 03:58:01.929652+02	2025-12-12 03:10:29.650411+02
5b4add17-6e02-4362-850d-bdb6f6e0d345	a958bb0c-d02e-404d-b4e3-f42de84c68b9	Main Calendar	Default calendar	f	UTC	2025-12-05 02:38:19.69152+02	2025-12-12 04:27:49.023281+02
04d382f7-68dc-4aae-98f2-a6d981849d81	3bb6cd6c-4a7c-49ef-b2f5-9a4b39444abb	Main Calendar	Default calendar	t	Egypt Standard Time	2025-12-05 02:37:30.473537+02	2025-12-12 04:28:04.753037+02
26a61af7-9d78-4f4b-8dad-7443bed52b66	6453a2e8-a027-45bd-af26-a477acbea7f2	Dr. Barbara Jackson's Calendar	Default calendar	t	Egypt Standard Time	2025-12-05 03:58:01.489333+02	2025-12-12 04:28:38.347544+02
46edf183-40d8-4493-9efe-2484e1a5872d	c3ff77ee-dee0-4c34-98b9-0edee96e07b4	Dr. Betty Calender	Default calendar	f	UTC	2025-12-12 03:32:00.171215+02	2026-01-18 02:37:41.890715+02
259100aa-dcf8-49ea-837e-60e21fa8d6aa	6dd2cff7-a100-4032-a963-fecd55ca5bac	Dr. Barbara Jackson's Calendar	Default calendar	f	Egypt Standard Time	2025-12-10 03:46:05.481054+02	2026-01-18 02:37:30.075367+02
8e3e8c6f-c0e3-45fb-8209-1ac5b7a012e4	c3ff77ee-dee0-4c34-98b9-0edee96e07b4	Dr. Betty White's Calendar	Default calendar	f	UTC	2025-12-05 03:58:01.747532+02	2026-01-18 02:37:38.106013+02
8f243c85-d0a8-4708-b09f-92bce4f5f8bf	e68f6b3f-d462-44ed-b18f-7fbac48d0106	Dr. Jennifer Lee's Calendar	Default calendar	f	UTC	2025-12-12 02:58:57.942233+02	2026-01-18 02:37:46.039665+02
81803894-5ee7-4b9c-8888-ee0658b094ad	522429a1-69e3-4472-8af9-309975818e8d	Main Calendar	Default calendar	f	UTC	2026-01-18 01:49:56.546779+02	2026-01-18 02:37:50.105838+02
1c6b7181-7874-4fd3-adea-405adb6d3b72	a958bb0c-d02e-404d-b4e3-f42de84c68b9	Main Calendar	Default calendar	f	UTC	2026-01-18 01:50:12.252175+02	2026-01-18 02:37:56.280261+02
cec97b1d-5afb-4194-820a-de82887fd9c5	0e0be0cd-e993-462c-b589-49f4642b8c43	Dr. Maria Santos's Calendar	Default calendar	f	UTC	2025-12-12 02:59:58.659758+02	2026-01-18 02:38:01.868542+02
e5e6d145-fb92-4d03-8dc0-0ff5cf50376c	0fda0e91-654f-4c1b-9674-cb38bd94e877	Dr. Nancy Calender	Default calendar	f	UTC	2025-12-12 03:11:09.106451+02	2026-01-18 02:38:05.944133+02
cea93755-1613-4067-8bb5-b5dd0a5156b2	ebaba171-3194-4c6c-9bba-052689078eaf	Dr. Susan Patel's Calendar	Default calendar	f	UTC	2025-12-05 03:58:01.913713+02	2026-01-18 02:38:13.609896+02
99e88c51-7242-4776-8f88-b9ef7ec3a296	5bc40da4-7d87-4840-8e59-fc7c143f8a1b	Dr. Lisa Thompson's Calendar	Default calendar	f	UTC	2025-12-05 03:58:01.944886+02	2026-01-18 02:38:22.443886+02
0b6be4fa-d01b-46c8-80df-8d83ef2b2053	addaf0b2-2010-4124-af40-4cc186a38a52	Dr. Karen Rodriguez's Calendar	Default calendar	f	UTC	2025-12-05 03:58:01.901228+02	2026-01-18 02:38:30.012894+02
a8230a02-c067-4eea-8204-1b44eb609562	e68f6b3f-d462-44ed-b18f-7fbac48d0106	Main Calendar	Default calendar	t	UTC	2026-01-18 03:35:01.381409+02	2026-01-18 03:35:01.381409+02
\.


--
-- Data for Name: doctor_time_slots; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctor_time_slots (id, calendar_id, slot_duration, break_duration, max_appointments_per_slot, is_active, created_at, updated_at) FROM stdin;
f0ab2604-0fc4-40c8-b3ec-d3bea628999d	26a61af7-9d78-4f4b-8dad-7443bed52b66	15	5	4	\N	2025-12-05 03:58:24.937328+02	2025-12-05 03:58:24.937328+02
32cb375c-4e2c-4940-a19f-6c22592bef5b	26a61af7-9d78-4f4b-8dad-7443bed52b66	30	0	1	\N	2025-12-05 04:05:47.121352+02	2025-12-05 04:05:47.121352+02
9eea7edf-4846-4481-aa98-755ec3b8ba30	26a61af7-9d78-4f4b-8dad-7443bed52b66	30	0	1	f	2025-12-05 04:30:12.512343+02	2025-12-05 04:30:43.24065+02
c7524855-5a8b-42f8-a30b-c94798fe8bfd	46edf183-40d8-4493-9efe-2484e1a5872d	30	0	1	t	2025-12-12 03:33:14.030151+02	2025-12-12 03:33:14.030151+02
c6199760-e1d0-433b-896b-20e1984e1705	26a61af7-9d78-4f4b-8dad-7443bed52b66	15	5	2	t	2025-12-05 04:30:31.591614+02	2026-01-18 03:25:55.684359+02
\.


--
-- Data for Name: doctor_working_hours; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctor_working_hours (id, calendar_id, day_of_week, start_time, end_time, is_active, created_at, updated_at, is_closed) FROM stdin;
3897ab70-e9d7-4289-a7a4-1b1993cc8a5e	b4956337-263a-47c0-9c26-410cfdac4b41	1	09:00:00	17:00:00	\N	2025-12-05 03:58:01.413975+02	2025-12-05 03:58:01.413975+02	f
6e508c36-02ef-4d1e-9bdf-91ec7263b0c9	26a61af7-9d78-4f4b-8dad-7443bed52b66	0	13:00:00	17:00:00	\N	2025-12-05 03:58:47.859684+02	2025-12-05 03:58:47.859684+02	f
9bd9838f-f267-43cb-9902-17103382a867	26a61af7-9d78-4f4b-8dad-7443bed52b66	0	09:00:00	17:00:00	\N	2025-12-05 04:05:32.518246+02	2025-12-05 04:05:32.518246+02	f
eb3f744a-35c7-4578-9c39-3610c8ea2df9	26a61af7-9d78-4f4b-8dad-7443bed52b66	0	09:00:00	17:00:00	t	2025-12-05 04:30:03.860964+02	2025-12-05 04:30:03.860964+02	f
c391e2b0-7a1a-4560-87df-695d848c62bb	26a61af7-9d78-4f4b-8dad-7443bed52b66	1	13:00:00	21:00:00	t	2025-12-05 04:31:36.594138+02	2025-12-05 04:31:36.594138+02	f
dd577a1b-f5a4-4f13-b776-2a0b9888bc66	26a61af7-9d78-4f4b-8dad-7443bed52b66	2	13:00:00	21:00:00	t	2025-12-05 04:31:45.716191+02	2025-12-05 04:31:45.716191+02	f
3ff5e49c-b4d0-4db1-9dee-a022795e8b98	26a61af7-9d78-4f4b-8dad-7443bed52b66	3	15:00:00	22:00:00	t	2025-12-05 04:31:56.653183+02	2025-12-05 04:31:56.653183+02	f
eae4332d-eaf4-440c-a020-2ce573fd8007	26a61af7-9d78-4f4b-8dad-7443bed52b66	5	09:00:00	17:00:00	f	2025-12-05 04:37:35.519022+02	2025-12-05 04:37:35.519022+02	t
a69c8834-558b-4fde-b2aa-1c813e3c1e45	b4956337-263a-47c0-9c26-410cfdac4b41	0	09:00:00	17:00:00	t	2025-12-05 04:38:24.677127+02	2025-12-05 04:38:24.677127+02	f
bbf15b0a-f010-4d46-8f5c-86023a428373	26a61af7-9d78-4f4b-8dad-7443bed52b66	5	09:00:00	17:00:00	f	2025-12-05 15:12:32.629858+02	2025-12-05 15:12:32.629858+02	t
024235f5-70dd-473a-8abf-da7cb07ec13c	26a61af7-9d78-4f4b-8dad-7443bed52b66	5	09:00:00	17:00:00	f	2025-12-05 15:14:45.753905+02	2025-12-05 15:14:45.753905+02	t
56cef60b-c22e-454b-9468-c57e952144d9	26a61af7-9d78-4f4b-8dad-7443bed52b66	6	09:00:00	17:00:00	f	2025-12-05 15:20:28.129265+02	2025-12-05 15:20:28.129265+02	t
8f766cc2-e916-4238-ab1a-d6f272d3142f	26a61af7-9d78-4f4b-8dad-7443bed52b66	6	09:00:00	17:00:00	f	2025-12-05 15:26:37.923229+02	2025-12-05 15:26:37.923229+02	t
0ff72f27-fc82-4168-ade0-feca020505aa	26a61af7-9d78-4f4b-8dad-7443bed52b66	6	09:00:00	17:00:00	f	2025-12-10 03:46:25.206452+02	2025-12-10 03:46:25.206452+02	t
60e8067b-9f57-498f-a5f4-07c3eb7917b3	26a61af7-9d78-4f4b-8dad-7443bed52b66	6	09:00:00	17:00:00	f	2025-12-10 03:46:41.394439+02	2025-12-12 03:14:24.715736+02	t
d51d8a55-79cb-46c0-a60d-a375ce69b489	26a61af7-9d78-4f4b-8dad-7443bed52b66	4	09:00:00	17:00:00	t	2025-12-12 03:14:38.515356+02	2025-12-12 03:14:38.515356+02	f
8e720770-5d01-4576-9cb6-90a562dbbb37	26a61af7-9d78-4f4b-8dad-7443bed52b66	6	09:00:00	17:00:00	f	2025-12-12 03:19:29.083834+02	2025-12-12 03:19:29.083834+02	t
735ec8e7-ce93-4a51-994c-971374482b02	26a61af7-9d78-4f4b-8dad-7443bed52b66	6	09:00:00	17:00:00	f	2025-12-12 03:22:47.621881+02	2025-12-12 03:22:47.621881+02	t
fb1bc135-0125-4499-96ef-a6a8e8375959	26a61af7-9d78-4f4b-8dad-7443bed52b66	6	09:00:00	17:00:00	f	2025-12-12 03:25:19.171699+02	2025-12-12 03:25:19.171699+02	t
30c77d77-b5ba-4927-8b60-d66ac7fd90d4	26a61af7-9d78-4f4b-8dad-7443bed52b66	0	09:00:00	17:00:00	t	2025-12-05 04:05:39.682744+02	2025-12-12 03:28:02.563778+02	f
825988b7-a26a-429b-a99c-8a7599dd276c	46edf183-40d8-4493-9efe-2484e1a5872d	0	09:00:00	17:00:00	t	2025-12-12 03:32:00.254482+02	2025-12-12 03:32:00.254482+02	f
7b7f8a2f-6fc8-4ce3-892d-bb881211c240	46edf183-40d8-4493-9efe-2484e1a5872d	5	09:00:00	17:00:00	f	2025-12-12 03:32:00.273432+02	2025-12-12 03:32:00.273432+02	t
6f797a38-3c9a-48de-8f94-aad980e147df	46edf183-40d8-4493-9efe-2484e1a5872d	1	09:00:00	17:00:00	t	2025-12-12 03:32:00.385181+02	2025-12-12 03:32:00.385181+02	f
bd7ce2b8-5763-4cac-821c-aa0fa3bea038	46edf183-40d8-4493-9efe-2484e1a5872d	2	09:00:00	17:00:00	t	2025-12-12 03:32:00.401334+02	2025-12-12 03:32:00.401334+02	f
02bdb0bd-526b-4612-866c-6f25ce8bf0e6	46edf183-40d8-4493-9efe-2484e1a5872d	6	09:00:00	17:00:00	f	2025-12-12 03:32:00.424072+02	2025-12-12 03:32:00.424072+02	t
f7dc5e03-b0f5-4bd3-85fb-892f183bfe58	46edf183-40d8-4493-9efe-2484e1a5872d	4	09:00:00	17:00:00	f	2025-12-12 03:32:00.41971+02	2025-12-12 03:32:24.455959+02	t
31173fbe-4de7-4102-9268-38678a608b72	46edf183-40d8-4493-9efe-2484e1a5872d	3	12:00:00	21:00:00	t	2025-12-12 03:32:00.399938+02	2025-12-12 03:32:42.157755+02	f
\.


--
-- Data for Name: doctors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctors (id, first_name, last_name, specialty, phone, email, user_id, created_at) FROM stdin;
b258c852-0f82-4c96-9ca7-c4609c091e29	Dr. Maria	Santos	Obstetrician	555-1101	maria.santos@herhealth.com	\N	2025-12-01 05:46:01.507251+02
3bb6cd6c-4a7c-49ef-b2f5-9a4b39444abb	Dr. Linda	Chen	Gynecologist	555-1102	linda.chen@herhealth.com	\N	2025-12-01 05:46:01.507251+02
828ce74d-1e19-4a15-8388-292aa0001fcd	Dr. Patricia	Kumar	OB/GYN	555-1103	patricia.kumar@herhealth.com	\N	2025-12-01 05:46:01.507251+02
522429a1-69e3-4472-8af9-309975818e8d	Dr. Jennifer	Lee	Maternal-Fetal Medicine	555-1104	jennifer.lee@herhealth.com	\N	2025-12-01 05:46:01.507251+02
ebaba171-3194-4c6c-9bba-052689078eaf	Dr. Susan	Patel	Reproductive Endocrinology	555-1105	susan.patel@herhealth.com	\N	2025-12-01 05:46:01.507251+02
0fda0e91-654f-4c1b-9674-cb38bd94e877	Dr. Nancy	Williams	OB/GYN	555-1106	nancy.williams@herhealth.com	\N	2025-12-01 05:46:01.507251+02
addaf0b2-2010-4124-af40-4cc186a38a52	Dr. Karen	Rodriguez	Gynecologic Oncology	555-1107	karen.rodriguez@herhealth.com	\N	2025-12-01 05:46:01.507251+02
6453a2e8-a027-45bd-af26-a477acbea7f2	Dr. Barbara	Jackson	OB/GYN	555-1108	barbara.jackson@herhealth.com	\N	2025-12-01 05:46:01.507251+02
3cca1e2a-04ed-42fd-a908-207a231f6207	Dr. Lisa	Thompson	Urogynecology	555-1109	lisa.thompson@herhealth.com	\N	2025-12-01 05:46:01.507251+02
df3402a6-4522-4745-a193-0d36e9753fa7	Dr. Betty	White	OB/GYN	555-1110	betty.white@herhealth.com	\N	2025-12-01 05:46:01.507251+02
0e0be0cd-e993-462c-b589-49f4642b8c43	Dr. Maria	Santos	Obstetrician	555-1101	maria.santos@herhealth.com	\N	2025-12-01 05:46:09.331412+02
24ee1570-c604-4f5c-a915-8499452a0e40	Dr. Patricia	Kumar	OB/GYN	555-1103	patricia.kumar@herhealth.com	\N	2025-12-01 05:46:09.331412+02
e68f6b3f-d462-44ed-b18f-7fbac48d0106	Dr. Jennifer	Lee	Maternal-Fetal Medicine	555-1104	jennifer.lee@herhealth.com	\N	2025-12-01 05:46:09.331412+02
423a448d-1fed-4089-875e-2f3da8f69686	Dr. Susan	Patel	Reproductive Endocrinology	555-1105	susan.patel@herhealth.com	\N	2025-12-01 05:46:09.331412+02
c9393288-04c2-41f7-a9a1-e26fa39cfeb5	Dr. Karen	Rodriguez	Gynecologic Oncology	555-1107	karen.rodriguez@herhealth.com	\N	2025-12-01 05:46:09.331412+02
6dd2cff7-a100-4032-a963-fecd55ca5bac	Dr. Barbara	Jackson	OB/GYN	555-1108	barbara.jackson@herhealth.com	\N	2025-12-01 05:46:09.331412+02
5bc40da4-7d87-4840-8e59-fc7c143f8a1b	Dr. Lisa	Thompson	Urogynecology	555-1109	lisa.thompson@herhealth.com	\N	2025-12-01 05:46:09.331412+02
c3ff77ee-dee0-4c34-98b9-0edee96e07b4	Dr. Betty	White	OB/GYN	555-1110	betty.white@herhealth.com	\N	2025-12-01 05:46:09.331412+02
a958bb0c-d02e-404d-b4e3-f42de84c68b9	Dr. Linda	Chen	Gynecologist	555-1102-12564	linda.chen@herhealth.com	\N	2025-12-01 05:46:09.331412+02
\.


--
-- Data for Name: gyne_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gyne_records (id, patient_id, record_date, exam_findings, pap_result, notes, created_at) FROM stdin;
f21a3f23-a4b3-4068-907f-9b4255617ec9	65cfccdb-f436-4961-b629-eabe39748d22	2025-11-15	Normal cervical exam	Negative for intraepithelial lesion	Annual exam normal	2025-12-01 05:51:27.745545+02
5b13addd-74a9-4245-b2c1-877ce9974d12	b7064c1a-9830-41e1-8939-a561df6e89e0	2025-10-20	Cervix closed	Not performed - pregnant	First prenatal visit	2025-12-01 05:51:27.745545+02
3456aa85-e23b-4ab3-b174-cb6b31d5ccfa	1fb056f7-a7ca-4b54-baef-0d6c92117812	2025-09-10	Normal findings	Negative	Routine screening	2025-12-01 05:51:27.745545+02
03453a46-3df5-4b62-8942-9c0c269a8bb8	4257a240-2972-4424-8acd-a273188f37a3	2025-11-01	Normal external genitalia	Negative	Well woman exam	2025-12-01 05:51:27.745545+02
f58bf8e2-4901-4e9b-a5fa-012c369816b5	9d29df28-9c05-4009-b6b0-e2c01f3b85c8	2025-08-12	Gravid uterus	Not performed	Second trimester exam	2025-12-01 05:51:27.745545+02
c32f4e2f-16dd-4836-b301-264c17a245df	7dba7916-2de9-447e-b9c7-11ed48346524	2025-10-05	Postpartum exam normal	Deferred	6-week postpartum check	2025-12-01 05:51:27.745545+02
61fa8f8e-1aef-486c-a168-c5470774659e	7f45163c-3ef5-41b6-b5d7-5c833c0ce6c1	2025-11-20	Normal exam	Negative for intraepithelial lesion	Annual screening	2025-12-01 05:51:27.745545+02
d8ebfb45-26b3-4f3f-9b1b-b66daf00e01b	a5bce3f9-4624-45c9-9f05-3f87ba722aa5	2025-09-25	Normal findings	Negative	Routine visit	2025-12-01 05:51:27.745545+02
c0f90eea-c69a-4a9b-85df-3ac4aab8058c	0bf38974-07fa-405a-b739-db0bb9613ac3	2025-10-30	Normal exam	Negative	Follow-up exam	2025-12-01 05:51:27.745545+02
29f9829c-bbda-4bbf-9c32-68cf65359a09	41023f41-a7b7-4ff2-8110-dc18f657327f	2025-11-10	Cervix closed	Not performed - pregnant	Third trimester check	2025-12-01 05:51:27.745545+02
\.


--
-- Data for Name: imaging; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.imaging (id, visit_id, patient_id, modality, report, measurements, performed_at, created_at) FROM stdin;
46ddf745-9be1-4db7-b360-b4624e00e147	05ec5c6d-33f5-4348-bcac-70ce619df7f1	65cfccdb-f436-4961-b629-eabe39748d22	Ultrasound	Normal pelvic ultrasound findings	\N	2025-11-06 19:42:42.163392+02	2025-12-01 05:51:33.173614+02
0bb40f07-48cb-4b9c-b028-e4ee17814e8a	f56d0683-7917-4432-9668-b14c71988332	b7064c1a-9830-41e1-8939-a561df6e89e0	Ultrasound	Normal pelvic ultrasound findings	\N	2025-11-18 13:26:12.534133+02	2025-12-01 05:51:33.173614+02
9a0eb7b7-89c3-4914-95a0-b6b2f169285b	a3f94806-86fa-40bd-8527-e1155e6dbc5d	1fb056f7-a7ca-4b54-baef-0d6c92117812	Ultrasound	Normal pelvic ultrasound findings	\N	2025-11-02 22:51:53.304816+02	2025-12-01 05:51:33.173614+02
3c117d2b-68b7-4485-8365-e4954a6207b3	fdd0c2ff-8b7d-4ea8-8e25-14c9a56034c9	4257a240-2972-4424-8acd-a273188f37a3	Ultrasound	Normal pelvic ultrasound findings	\N	2025-11-12 18:55:30.25291+02	2025-12-01 05:51:33.173614+02
dad6e3b9-a621-4224-aa37-89d9ea36967c	aedd176d-3593-4f68-92f1-f84b3d0282d1	9d29df28-9c05-4009-b6b0-e2c01f3b85c8	Ultrasound	Normal pelvic ultrasound findings	\N	2025-11-10 00:37:07.197631+02	2025-12-01 05:51:33.173614+02
3648eaaa-37d6-4106-b463-dfb4ca371bc9	7917f0dd-9bb2-4c20-8b7f-fadf7a598bad	7dba7916-2de9-447e-b9c7-11ed48346524	Ultrasound	Normal pelvic ultrasound findings	\N	2025-11-14 12:03:20.314527+02	2025-12-01 05:51:33.173614+02
f7b30616-ff1a-4861-8253-f5ebefe360ea	b59c6966-e359-499e-a5b0-bbed111731e2	7f45163c-3ef5-41b6-b5d7-5c833c0ce6c1	Ultrasound	Normal pelvic ultrasound findings	\N	2025-11-20 08:28:16.253491+02	2025-12-01 05:51:33.173614+02
508429f5-86f9-4148-833a-349e910e7672	d1356c4d-45df-404b-9b8e-9388f58afdb6	a5bce3f9-4624-45c9-9f05-3f87ba722aa5	Ultrasound	Normal pelvic ultrasound findings	\N	2025-11-28 09:25:34.505068+02	2025-12-01 05:51:33.173614+02
21234c21-b529-49f8-b1cb-c6618bd14ceb	8d70e5ae-57e1-4ac4-a9c5-0f312d30ee42	0bf38974-07fa-405a-b739-db0bb9613ac3	Ultrasound	Normal pelvic ultrasound findings	\N	2025-11-22 04:41:02.553867+02	2025-12-01 05:51:33.173614+02
c9c82e93-2935-435a-8a82-ab2f1da8e403	d0442210-94e1-42ad-a66f-205d4fb371b9	41023f41-a7b7-4ff2-8110-dc18f657327f	Ultrasound	Normal pelvic ultrasound findings	\N	2025-11-10 16:34:04.096347+02	2025-12-01 05:51:33.173614+02
\.


--
-- Data for Name: inventory_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory_items (id, name, sku, quantity, expiry_date, created_at, updated_at) FROM stdin;
253de312-f8bb-4a97-aa09-c6adfdf497d0	Pregnancy Test Strips	PT-001	250	2026-12-31	2025-12-01 05:51:53.679703+02	2025-12-01 05:51:53.679703+02
eb0e0548-3e6d-434e-bb09-cca16cf7fc62	Sterile Gloves - Small	SG-S-001	1000	2027-06-30	2025-12-01 05:51:53.679703+02	2025-12-01 05:51:53.679703+02
33acdf54-b554-4993-a68c-25233bdd72d1	Sterile Gloves - Medium	SG-M-001	1500	2027-06-30	2025-12-01 05:51:53.679703+02	2025-12-01 05:51:53.679703+02
4f8779b0-736f-4b95-a41a-78537c4b1a3f	Sterile Gloves - Large	SG-L-001	800	2027-06-30	2025-12-01 05:51:53.679703+02	2025-12-01 05:51:53.679703+02
6d241f16-1054-41d4-a80d-858dafdd833c	Blood Collection Tubes	BCT-001	500	2026-08-15	2025-12-01 05:51:53.679703+02	2025-12-01 05:51:53.679703+02
cca04dde-551c-4205-b3ae-cb9a8da0229d	Syringes 5ml	SYR-5ML	600	2027-01-20	2025-12-01 05:51:53.679703+02	2025-12-01 05:51:53.679703+02
9504847c-77d3-497f-8fd8-2a07ded9f98e	Cotton Swabs	CS-001	2000	2028-12-31	2025-12-01 05:51:53.679703+02	2025-12-01 05:51:53.679703+02
ff601fd5-51f8-470f-9adf-15779060ed95	Alcohol Prep Pads	APP-001	1200	2026-10-10	2025-12-01 05:51:53.679703+02	2025-12-01 05:51:53.679703+02
7760986a-c38a-4e26-a379-49a7a5620d03	Ultrasound Gel	UG-001	150	2026-05-25	2025-12-01 05:51:53.679703+02	2025-12-01 05:51:53.679703+02
f9f1899c-336c-4865-bba6-0ce2c200cc35	Speculum - Medium	SPEC-M-001	300	2030-12-31	2025-12-01 05:51:53.679703+02	2025-12-01 05:51:53.679703+02
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoices (id, patient_id, visit_id, total_amount, status, issued_at, created_at) FROM stdin;
42d36e29-0816-47ff-851c-a049e5d6f7e7	65cfccdb-f436-4961-b629-eabe39748d22	05ec5c6d-33f5-4348-bcac-70ce619df7f1	394.02	paid	2025-12-01 05:51:44.472161+02	2025-12-01 05:51:44.472161+02
b40bed08-0dbb-4a25-88b9-ba25312cc92b	b7064c1a-9830-41e1-8939-a561df6e89e0	f56d0683-7917-4432-9668-b14c71988332	266.07	pending	2025-12-01 05:51:44.472161+02	2025-12-01 05:51:44.472161+02
3439e9d5-b376-406f-88a3-e0f3488fff84	1fb056f7-a7ca-4b54-baef-0d6c92117812	a3f94806-86fa-40bd-8527-e1155e6dbc5d	178.27	paid	2025-12-01 05:51:44.472161+02	2025-12-01 05:51:44.472161+02
86f1c0b5-305b-4ac4-9a3a-4e5b33deab81	4257a240-2972-4424-8acd-a273188f37a3	fdd0c2ff-8b7d-4ea8-8e25-14c9a56034c9	123.27	paid	2025-12-01 05:51:44.472161+02	2025-12-01 05:51:44.472161+02
cab96694-5fd4-484b-9f21-4cc9794feb13	9d29df28-9c05-4009-b6b0-e2c01f3b85c8	aedd176d-3593-4f68-92f1-f84b3d0282d1	445.26	paid	2025-12-01 05:51:44.472161+02	2025-12-01 05:51:44.472161+02
3f52ebf7-c957-4cc6-8f3f-a29f5f314447	7dba7916-2de9-447e-b9c7-11ed48346524	7917f0dd-9bb2-4c20-8b7f-fadf7a598bad	408.39	paid	2025-12-01 05:51:44.472161+02	2025-12-01 05:51:44.472161+02
f8ba6364-a978-43b8-8885-049ffef9ddac	7f45163c-3ef5-41b6-b5d7-5c833c0ce6c1	b59c6966-e359-499e-a5b0-bbed111731e2	184.83	paid	2025-12-01 05:51:44.472161+02	2025-12-01 05:51:44.472161+02
12de31e6-1718-431d-aad1-c222448da826	a5bce3f9-4624-45c9-9f05-3f87ba722aa5	d1356c4d-45df-404b-9b8e-9388f58afdb6	360.88	pending	2025-12-01 05:51:44.472161+02	2025-12-01 05:51:44.472161+02
dff14b1e-b5d7-424f-b42c-23acda5230c6	0bf38974-07fa-405a-b739-db0bb9613ac3	8d70e5ae-57e1-4ac4-a9c5-0f312d30ee42	552.67	paid	2025-12-01 05:51:44.472161+02	2025-12-01 05:51:44.472161+02
9eeff4b2-621e-4f06-b26f-427c457dbac9	41023f41-a7b7-4ff2-8110-dc18f657327f	d0442210-94e1-42ad-a66f-205d4fb371b9	460.61	paid	2025-12-01 05:51:44.472161+02	2025-12-01 05:51:44.472161+02
\.


--
-- Data for Name: lab_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lab_orders (id, visit_id, patient_id, test_type, status, ordered_at) FROM stdin;
a264c189-b445-4ece-bbf3-6cef075d69fe	05ec5c6d-33f5-4348-bcac-70ce619df7f1	65cfccdb-f436-4961-b629-eabe39748d22	Urinalysis	pending	2025-12-01 05:51:09.408162+02
1e690dba-74fb-467c-a67a-fe1abcbcb128	f56d0683-7917-4432-9668-b14c71988332	b7064c1a-9830-41e1-8939-a561df6e89e0	Glucose Test	pending	2025-12-01 05:51:09.408162+02
5d3410df-9fcd-4bc4-825e-c3117e0ad40e	a3f94806-86fa-40bd-8527-e1155e6dbc5d	1fb056f7-a7ca-4b54-baef-0d6c92117812	Blood Count	completed	2025-12-01 05:51:09.408162+02
d623443d-8894-4482-9d30-c2861f054b91	fdd0c2ff-8b7d-4ea8-8e25-14c9a56034c9	4257a240-2972-4424-8acd-a273188f37a3	Urinalysis	pending	2025-12-01 05:51:09.408162+02
28003fc8-6787-40cd-b79b-de9aa4150ef2	aedd176d-3593-4f68-92f1-f84b3d0282d1	9d29df28-9c05-4009-b6b0-e2c01f3b85c8	Glucose Test	completed	2025-12-01 05:51:09.408162+02
4fe5ce39-cf7f-4728-885d-5d8ff26f40d5	7917f0dd-9bb2-4c20-8b7f-fadf7a598bad	7dba7916-2de9-447e-b9c7-11ed48346524	Glucose Test	pending	2025-12-01 05:51:09.408162+02
654b86bb-c35f-48c8-a7ba-27d76696163f	b59c6966-e359-499e-a5b0-bbed111731e2	7f45163c-3ef5-41b6-b5d7-5c833c0ce6c1	Blood Count	pending	2025-12-01 05:51:09.408162+02
89e9d852-8a68-4f24-b457-0cc9e5d0bb28	d1356c4d-45df-404b-9b8e-9388f58afdb6	a5bce3f9-4624-45c9-9f05-3f87ba722aa5	Urinalysis	pending	2025-12-01 05:51:09.408162+02
2179696a-5754-410f-8c11-1ac44be9fd32	8d70e5ae-57e1-4ac4-a9c5-0f312d30ee42	0bf38974-07fa-405a-b739-db0bb9613ac3	Glucose Test	completed	2025-12-01 05:51:09.408162+02
4cf4193d-4ea8-44ed-90f9-e980c0a8f984	d0442210-94e1-42ad-a66f-205d4fb371b9	41023f41-a7b7-4ff2-8110-dc18f657327f	Blood Count	completed	2025-12-01 05:51:09.408162+02
\.


--
-- Data for Name: lab_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lab_results (id, lab_order_id, result_summary, full_result, result_at, abnormal, created_at) FROM stdin;
cd306e97-946d-427f-9811-28e92a6b31ee	5d3410df-9fcd-4bc4-825e-c3117e0ad40e	WBC: 7.5, RBC: 4.8, Platelets: 250	\N	2025-11-25 21:00:46.795918+02	f	2025-12-01 05:56:25.242099+02
40887441-fb73-47a6-834e-a7f63ee8d985	28003fc8-6787-40cd-b79b-de9aa4150ef2	Fasting glucose: 92 mg/dL	\N	2025-11-30 06:15:39.574829+02	f	2025-12-01 05:56:25.242099+02
e56d557d-e879-414a-8422-c0b94505ea2a	2179696a-5754-410f-8c11-1ac44be9fd32	Fasting glucose: 92 mg/dL	\N	2025-11-30 10:21:25.085864+02	f	2025-12-01 05:56:25.242099+02
1978eef9-a9e8-4bf1-a0d2-d03cf7cd4702	4cf4193d-4ea8-44ed-90f9-e980c0a8f984	WBC: 7.5, RBC: 4.8, Platelets: 250	\N	2025-11-24 01:51:55.955954+02	f	2025-12-01 05:56:25.242099+02
\.


--
-- Data for Name: medications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.medications (id, name, generic_name, indications, pregnancy_safe, created_at) FROM stdin;
3ef940fa-634b-4cc1-b7ca-8662df10a67d	Prenatal Vitamins	Multivitamin with Folic Acid	Pregnancy supplementation	t	2025-12-01 05:51:03.177117+02
4c2cb33f-32a6-4b2e-a0c3-a1d25852aa31	Metformin	Metformin HCl	Type 2 Diabetes	t	2025-12-01 05:51:03.177117+02
c952fdb7-d30c-4c2e-b6ba-231502092e2e	Levothyroxine	Levothyroxine Sodium	Hypothyroidism	t	2025-12-01 05:51:03.177117+02
9ed4ff44-5860-4a63-a9a9-10ede6aaf79a	Lisinopril	Lisinopril	Hypertension	f	2025-12-01 05:51:03.177117+02
706781c5-e892-46a0-935f-6aeff5fb7cbe	Albuterol	Albuterol Sulfate	Asthma	t	2025-12-01 05:51:03.177117+02
48bd3727-ba29-4ab8-88e0-d940b06ab734	Synthroid	Levothyroxine	Thyroid hormone replacement	t	2025-12-01 05:51:03.177117+02
cfb560b7-75ca-4b56-96d5-cfa7d1fbd7f5	Sumatriptan	Sumatriptan Succinate	Migraine	f	2025-12-01 05:51:03.177117+02
6534e651-022c-43d7-8ff0-211865a512af	Amoxicillin	Amoxicillin	Bacterial infections	t	2025-12-01 05:51:03.177117+02
096d7077-11b4-4e1c-a209-796e8ab596de	Ibuprofen	Ibuprofen	Pain and inflammation	f	2025-12-01 05:51:03.177117+02
8892ebfc-f536-4fe5-8f67-0eb56591ed92	Folic Acid	Folic Acid	Neural tube defect prevention	t	2025-12-01 05:51:03.177117+02
\.


--
-- Data for Name: ob_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ob_records (id, pregnancy_id, record_date, weight_kg, bp_systolic, bp_diastolic, fundal_height_cm, fetal_heart_rate, notes, created_at, pregnancy_week, visit_id) FROM stdin;
b57dc0bc-69ca-47b5-b739-88c314c95785	79a814b9-4877-4160-b0ce-9906e5bee13f	2025-11-07	65.72	116	83	25.89	140-150 bpm	Normal prenatal checkup	2025-12-01 05:56:17.392548+02	\N	\N
024fea1a-7b13-4220-814b-d4cb4e180c7f	315d0f3c-637b-4f31-bad8-172b986d86ab	2025-11-20	73.45	122	73	29.03	140-150 bpm	Normal prenatal checkup	2025-12-01 05:56:17.392548+02	\N	\N
1f0a76a2-d49a-4d33-944b-65422033ac49	2c7c7a4f-5b4b-4986-aa3f-a3f12a2ff20d	2025-11-12	78.19	120	82	27.28	140-150 bpm	Normal prenatal checkup	2025-12-01 05:56:17.392548+02	\N	\N
738bb8c1-51b9-4a67-ada1-88e709fd3706	08784720-0b43-418a-b387-21c723b99731	2025-11-13	65.69	119	81	20.43	140-150 bpm	Normal prenatal checkup	2025-12-01 05:56:17.392548+02	\N	\N
1833588c-bfa9-4ba5-9993-bf19972dc0c7	61ed94d5-3142-40e5-83b2-2f91fe5d63af	2025-11-21	78.45	112	76	21.47	140-150 bpm	Normal prenatal checkup	2025-12-01 05:56:17.392548+02	\N	\N
e42a649b-71ab-4004-a166-c7ed244ed8b0	4b50ce41-342e-43e0-9f0f-98ea4eea9096	2025-11-24	70.66	124	74	33.75	140-150 bpm	Normal prenatal checkup	2025-12-01 05:56:17.392548+02	\N	\N
\.


--
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.patients (id, first_name, last_name, date_of_birth, gender, phone, email, address, emergency_contact_name, chronic_conditions, allergies, color_code_id, color_note, created_at, updated_at, emergency_contact_phone, blood_type, current_medications, insurance_provider, insurance_number, is_pregnant, lmp, edd, pregnancy_status, current_pregnancy_week, gravida, para, abortion, living) FROM stdin;
1fb056f7-a7ca-4b54-baef-0d6c92117812	Jessica	Brown	1992-11-08	Female	555-0301	jess.brown@email.com	789 Pine Rd, Cambridge, MA	David Brown	Asthma	Latex, Pollen	3	\N	2025-12-01 05:39:55.382904+02	2025-12-01 05:39:55.382904+02	555-0302	B+	Albuterol	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N
4257a240-2972-4424-8acd-a273188f37a3	Amanda	Davis	1988-05-30	Female	555-0401	amanda.d@email.com	321 Elm St, Somerville, MA	Robert Davis	\N	\N	4	\N	2025-12-01 05:39:55.382904+02	2025-12-01 05:39:55.382904+02	555-0402	AB+	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N
9d29df28-9c05-4009-b6b0-e2c01f3b85c8	Michelle	Martinez	1995-09-12	Female	555-0501	michelle.m@email.com	654 Cedar Ln, Brookline, MA	Carlos Martinez	\N	Shellfish	5	\N	2025-12-01 05:39:55.382904+02	2025-12-01 05:39:55.382904+02	555-0502	A-	Levothyroxine	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N
0bf38974-07fa-405a-b739-db0bb9613ac3	Rebecca	Anderson	1989-12-19	Female	555-0901-16565	rebecca.a@email.com	369 Ash Blvd, Medford, MA	James Anderson	Migraine	Cats, Dust	4	\N	2025-12-01 05:39:55.382904+02	2025-12-15 23:50:05.20345+02	01284430591	A+	Sumatriptan	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N
7f45163c-3ef5-41b6-b5d7-5c833c0ce6c1	Lisa	Rodriguez	1993-04-18	Female	555-0701	lisa.r@email.com	147 Spruce Dr, Quincy, MA	Antonio Rodriguez	\N	Aspirin	5	\N	2025-12-01 05:39:55.382904+02	2025-12-01 20:15:50.922362+02	555-0702	B-	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N
b7064c1a-9830-41e1-8939-a561df6e89e0	Emily	Williams	1985-07-22	Female	555-0201	emily.w@email.com	456 Oak Ave, Boston, MA	Michael Williams	Diabetes Type 2	\N	4	\N	2025-12-01 05:39:55.382904+02	2025-12-01 20:32:15.006792+02	555-0202	O+	Metformin	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N
41023f41-a7b7-4ff2-8110-dc18f657327f	Rachel	Taylor	1994-06-07	Female	555-1001	rachel.t@email.com	741 Poplar Pl, Arlington, MA	Matthew Taylor	\N	\N	5	\N	2025-12-01 05:39:55.382904+02	2026-01-09 01:01:14.755559+02	555-1002	O+	Prenatal Vitamins	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N
c6bd8ff1-c957-4081-b68f-42f73bc873a4	Sama	ezzat	1997-01-08	Female	+201277179033	\N	\N	\N	\N	\N	9	\N	2026-01-09 00:57:27.546016+02	2026-01-09 01:01:39.030941+02	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N
95aeb430-e169-44b5-a460-5a33a87fa233	Flora	Victor 	1998-10-01	Female	01013880194	floravictor98@gmail.com	\N	\N	\N	\N	4	\N	2025-12-05 03:18:41.856108+02	2025-12-05 23:08:30.898303+02	\N	A+	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N
6d2bdbaa-ac91-474b-9014-65e8e0da0a3d	Rehab	Helmy	1996-05-14	Female	01256964989	\N	\N	\N	\N	\N	8	\N	2025-12-12 03:36:33.494149+02	2026-01-14 00:08:54.03354+02	\N	\N	\N	\N	\N	t	2025-08-31	2026-06-07	ongoing	15	2	1	0	1
7dba7916-2de9-447e-b9c7-11ed48346524	Jennifer	Garcia	1987-01-25	Female	555-0601	jen.garcia@email.com	987 Birch Ct, Newton, MA	Jose Garcia	Hypertension	\N	1	\N	2025-12-01 05:39:55.382904+02	2025-12-09 16:14:05.173966+02	555-0602	O-	Lisinopril	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N
af0e04e5-0aff-421c-9426-3c74c8289e90	Emilis	Jackson	1999-02-10	Female	015556564848	\N	\N	\N	\N	\N	2	\N	2025-12-10 04:12:24.848471+02	2025-12-10 04:17:23.016072+02	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N
3494cf07-3954-4cd6-8401-6c0a66419186	Kamalia	Lotfy	2000-02-02	Female	01256489415	\N	\N	\N	\N	\N	4	\N	2025-12-10 04:10:52.671685+02	2025-12-11 23:25:34.280798+02	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N
a5bce3f9-4624-45c9-9f05-3f87ba722aa5	Angela	Wilson	1991-08-03	Female	555-0801	angela.w@email.com	258 Walnut Way, Waltham, MA	Thomas Wilson	Hypothyroidism	\N	5	\N	2025-12-01 05:39:55.382904+02	2025-12-11 23:40:46.039849+02	555-0802	AB-	Synthroid	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N
65cfccdb-f436-4961-b629-eabe39748d22	Sarah	Johnson	1990-03-15	Female	555-0101	sarah.johnson@email.com	123 Maple St, Boston, MA	John Johnson	\N	Penicillin	3	\N	2025-12-01 05:39:55.382904+02	2025-12-11 23:40:56.049991+02	555-0102	A+	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N
d0bbf489-8719-444a-9e7c-d95806e88cc2	Heba	Victor 	1998-10-01	Female	031565155516	\N	\N	\N	\N	\N	5	\N	2025-12-10 03:48:11.06725+02	2025-12-14 05:13:00.83373+02	\N	\N	\N	\N	\N	t	2025-07-27	2026-05-03	ongoing	20	1	0	0	0
4ea60de4-53c8-47db-840d-e57cdd584934	Reham	Othman	1998-01-01	Female	+201226470484	\N	\N	Othman	\N	\N	8	\N	2026-01-18 01:51:05.064613+02	2026-01-18 03:44:28.640938+02	01256486897	A-	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, invoice_id, amount, method, paid_at, created_at) FROM stdin;
af174b42-160c-44e0-b0dd-5dc0af9974b0	42d36e29-0816-47ff-851c-a049e5d6f7e7	394.02	Cash	2025-12-01 05:56:31.312397+02	2025-12-01 05:56:31.312397+02
2bfd9a13-3563-4b45-8f29-c1e35ee7bdc0	3439e9d5-b376-406f-88a3-e0f3488fff84	178.27	Cash	2025-12-01 05:56:31.312397+02	2025-12-01 05:56:31.312397+02
616957e7-06a4-4bd4-a108-1cb315aa6ef5	86f1c0b5-305b-4ac4-9a3a-4e5b33deab81	123.27	Insurance	2025-12-01 05:56:31.312397+02	2025-12-01 05:56:31.312397+02
b409328e-35cf-40bd-a395-700ebe4cba69	cab96694-5fd4-484b-9f21-4cc9794feb13	445.26	Credit Card	2025-12-01 05:56:31.312397+02	2025-12-01 05:56:31.312397+02
fc21f054-bc56-4d8a-88a9-f15f9bee52c2	3f52ebf7-c957-4cc6-8f3f-a29f5f314447	408.39	Cash	2025-12-01 05:56:31.312397+02	2025-12-01 05:56:31.312397+02
4e83e069-7937-4de6-b9a8-1d909eafccda	f8ba6364-a978-43b8-8885-049ffef9ddac	184.83	Credit Card	2025-12-01 05:56:31.312397+02	2025-12-01 05:56:31.312397+02
63164a33-6e07-4543-b566-ef1c5e2b1034	dff14b1e-b5d7-424f-b42c-23acda5230c6	552.67	Cash	2025-12-01 05:56:31.312397+02	2025-12-01 05:56:31.312397+02
4191774a-1eb2-43d2-b4c0-199acc1b943e	9eeff4b2-621e-4f06-b26f-427c457dbac9	460.61	Cash	2025-12-01 05:56:31.312397+02	2025-12-01 05:56:31.312397+02
\.


--
-- Data for Name: pregnancies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pregnancies (id, patient_id, lmp, edd, gravida, para, risk_flags, status, created_at, updated_at, abortion, living, pregnancy_number, delivery_date, delivery_type, baby_weight_kg, complications, outcome) FROM stdin;
2c7c7a4f-5b4b-4986-aa3f-a3f12a2ff20d	41023f41-a7b7-4ff2-8110-dc18f657327f	2025-04-10	2026-01-15	1	0	\N	active	2025-12-01 05:50:38.30891+02	2025-12-01 05:50:38.30891+02	0	0	1	\N	\N	\N	\N	\N
08784720-0b43-418a-b387-21c723b99731	4257a240-2972-4424-8acd-a273188f37a3	2025-07-25	2026-05-01	1	0	\N	active	2025-12-01 05:50:38.30891+02	2025-12-01 05:50:38.30891+02	0	0	1	\N	\N	\N	\N	\N
61ed94d5-3142-40e5-83b2-2f91fe5d63af	7f45163c-3ef5-41b6-b5d7-5c833c0ce6c1	2025-05-18	2026-02-22	1	0	\N	active	2025-12-01 05:50:38.30891+02	2025-12-01 05:50:38.30891+02	0	0	1	\N	\N	\N	\N	\N
315d0f3c-637b-4f31-bad8-172b986d86ab	9d29df28-9c05-4009-b6b0-e2c01f3b85c8	2025-06-01	2026-03-08	2	1	\N	active	2025-12-01 05:50:38.30891+02	2025-12-01 05:50:38.30891+02	0	0	1	\N	\N	\N	\N	\N
4b50ce41-342e-43e0-9f0f-98ea4eea9096	a5bce3f9-4624-45c9-9f05-3f87ba722aa5	2025-03-22	2025-12-27	2	1	\N	active	2025-12-01 05:50:38.30891+02	2025-12-01 05:50:38.30891+02	0	0	1	\N	\N	\N	\N	\N
79a814b9-4877-4160-b0ce-9906e5bee13f	b7064c1a-9830-41e1-8939-a561df6e89e0	2025-08-15	2026-05-22	1	0	\N	active	2025-12-01 05:50:38.30891+02	2025-12-01 05:50:38.30891+02	0	0	1	\N	\N	\N	\N	\N
d427c666-7b37-4149-b182-3ee5b93e149a	1fb056f7-a7ca-4b54-baef-0d6c92117812	2024-09-05	2025-06-12	2	1	\N	delivered	2025-12-01 05:50:38.30891+02	2025-12-01 05:50:38.30891+02	0	0	1	\N	\N	\N	\N	\N
c1f44277-c44a-412a-af06-335f2890a4ed	65cfccdb-f436-4961-b629-eabe39748d22	2024-11-20	2025-08-27	3	2	\N	delivered	2025-12-01 05:50:38.30891+02	2025-12-01 05:50:38.30891+02	0	0	1	\N	\N	\N	\N	\N
84152482-dc06-4d6f-bef7-652fb0274ccd	7dba7916-2de9-447e-b9c7-11ed48346524	2024-12-10	2025-09-16	4	3	\N	delivered	2025-12-01 05:50:38.30891+02	2025-12-01 05:50:38.30891+02	0	0	1	\N	\N	\N	\N	\N
d45c6e96-fb0b-46d6-8e1f-f06ec4d0f7b9	6d2bdbaa-ac91-474b-9014-65e8e0da0a3d	2024-10-13	2025-07-20	1	0	Normal	active	2025-12-14 13:54:34.791367+02	2025-12-14 14:06:13.13775+02	0	1	2	\N	\N	\N	\N	\N
412baad7-d056-4037-9672-ace95e006d31	6d2bdbaa-ac91-474b-9014-65e8e0da0a3d	2025-10-13	2026-07-20	1	0	\N	active	2025-12-14 13:46:04.90169+02	2025-12-15 23:47:10.793328+02	0	1	1	\N	\N	\N	\N	\N
8e4ac734-ae61-4983-a45b-dd320ffbd88a	0bf38974-07fa-405a-b739-db0bb9613ac3	2025-10-29	2026-08-05	1	0	\N	active	2025-12-01 05:50:38.30891+02	2025-12-15 23:51:27.012069+02	0	0	1	\N	\N	\N	\N	\N
9e6bbe0a-1d52-4ddd-b496-c83a6cd425e3	4ea60de4-53c8-47db-840d-e57cdd584934	2025-12-15	2026-09-20	1	0	\N	active	2026-01-18 02:34:27.479283+02	2026-01-18 02:34:27.479283+02	0	0	1	\N	\N	\N	\N	\N
\.


--
-- Data for Name: prescription_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.prescription_items (id, prescription_id, medication_id, dosage, frequency, duration_days, created_at) FROM stdin;
3dc8fb17-60a0-47a7-8eaf-fb6a610db0c8	a296f930-f57a-438f-b379-b566315923c2	4c2cb33f-32a6-4b2e-a0c3-a1d25852aa31	500mg	Twice daily	14	2025-12-01 05:55:53.356273+02
c6a4d9e6-c48b-49fd-9a63-686bde6fccc8	a296f930-f57a-438f-b379-b566315923c2	c952fdb7-d30c-4c2e-b6ba-231502092e2e	500mg	Twice daily	14	2025-12-01 05:55:53.356273+02
bd59f0a4-d260-45e2-a214-a2bd9cecd69b	a296f930-f57a-438f-b379-b566315923c2	6534e651-022c-43d7-8ff0-211865a512af	500mg	Twice daily	14	2025-12-01 05:55:53.356273+02
4e0b8d03-0341-415d-acc2-86b4212e014d	e36b56c3-beed-4333-ab43-4ddd79db5a90	4c2cb33f-32a6-4b2e-a0c3-a1d25852aa31	500mg	Twice daily	14	2025-12-01 05:55:53.356273+02
8062bd1c-4a66-4e02-ae50-ac74b04dbf2c	e36b56c3-beed-4333-ab43-4ddd79db5a90	c952fdb7-d30c-4c2e-b6ba-231502092e2e	500mg	Twice daily	14	2025-12-01 05:55:53.356273+02
e763d07d-cbe7-4d0e-b0bd-d2ca593a761d	e36b56c3-beed-4333-ab43-4ddd79db5a90	6534e651-022c-43d7-8ff0-211865a512af	500mg	Twice daily	14	2025-12-01 05:55:53.356273+02
344e4d36-f508-4f53-9a83-f674f2dcfee8	b61db3f5-a469-4464-851e-ad5d72e107d7	4c2cb33f-32a6-4b2e-a0c3-a1d25852aa31	500mg	Twice daily	14	2025-12-01 05:55:53.356273+02
4a2e7751-624c-497b-9ac7-2ccb9218c685	b61db3f5-a469-4464-851e-ad5d72e107d7	c952fdb7-d30c-4c2e-b6ba-231502092e2e	500mg	Twice daily	14	2025-12-01 05:55:53.356273+02
d9891d03-bacf-433e-afbc-579e347db497	b61db3f5-a469-4464-851e-ad5d72e107d7	6534e651-022c-43d7-8ff0-211865a512af	500mg	Twice daily	14	2025-12-01 05:55:53.356273+02
08b1073c-a966-4049-9773-222cac9f2b98	193f3c9f-f191-46bf-a046-08a083cf36c1	4c2cb33f-32a6-4b2e-a0c3-a1d25852aa31	500mg	Twice daily	14	2025-12-01 05:55:53.356273+02
\.


--
-- Data for Name: prescriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.prescriptions (id, visit_id, patient_id, doctor_id, issued_at, instructions, created_at) FROM stdin;
a296f930-f57a-438f-b379-b566315923c2	05ec5c6d-33f5-4348-bcac-70ce619df7f1	65cfccdb-f436-4961-b629-eabe39748d22	b258c852-0f82-4c96-9ca7-c4609c091e29	2025-12-01	Take as directed with food	2025-12-01 05:55:45.0172+02
e36b56c3-beed-4333-ab43-4ddd79db5a90	f56d0683-7917-4432-9668-b14c71988332	b7064c1a-9830-41e1-8939-a561df6e89e0	3bb6cd6c-4a7c-49ef-b2f5-9a4b39444abb	2025-12-01	Take as directed with food	2025-12-01 05:55:45.0172+02
b61db3f5-a469-4464-851e-ad5d72e107d7	a3f94806-86fa-40bd-8527-e1155e6dbc5d	1fb056f7-a7ca-4b54-baef-0d6c92117812	828ce74d-1e19-4a15-8388-292aa0001fcd	2025-12-01	Take as directed with food	2025-12-01 05:55:45.0172+02
193f3c9f-f191-46bf-a046-08a083cf36c1	fdd0c2ff-8b7d-4ea8-8e25-14c9a56034c9	4257a240-2972-4424-8acd-a273188f37a3	522429a1-69e3-4472-8af9-309975818e8d	2025-12-01	Take as directed with food	2025-12-01 05:55:45.0172+02
72f4b25c-5fbc-4d09-b3dd-c9a0a0865c53	aedd176d-3593-4f68-92f1-f84b3d0282d1	9d29df28-9c05-4009-b6b0-e2c01f3b85c8	ebaba171-3194-4c6c-9bba-052689078eaf	2025-12-01	Take as directed with food	2025-12-01 05:55:45.0172+02
071c9c44-47dc-4991-a173-83be4b102813	7917f0dd-9bb2-4c20-8b7f-fadf7a598bad	7dba7916-2de9-447e-b9c7-11ed48346524	0fda0e91-654f-4c1b-9674-cb38bd94e877	2025-12-01	Take as directed with food	2025-12-01 05:55:45.0172+02
27ce1105-be47-4847-8396-06365a77a44d	b59c6966-e359-499e-a5b0-bbed111731e2	7f45163c-3ef5-41b6-b5d7-5c833c0ce6c1	addaf0b2-2010-4124-af40-4cc186a38a52	2025-12-01	Take as directed with food	2025-12-01 05:55:45.0172+02
7f1a6632-78e1-413c-8d9e-5e18a5933418	d1356c4d-45df-404b-9b8e-9388f58afdb6	a5bce3f9-4624-45c9-9f05-3f87ba722aa5	6453a2e8-a027-45bd-af26-a477acbea7f2	2025-12-01	Take as directed with food	2025-12-01 05:55:45.0172+02
6625719b-630b-4ae9-a3a3-ce76b5447c4e	8d70e5ae-57e1-4ac4-a9c5-0f312d30ee42	0bf38974-07fa-405a-b739-db0bb9613ac3	3cca1e2a-04ed-42fd-a908-207a231f6207	2025-12-01	Take as directed with food	2025-12-01 05:55:45.0172+02
695b206f-f659-4e42-a84f-527adbd1286e	d0442210-94e1-42ad-a66f-205d4fb371b9	41023f41-a7b7-4ff2-8110-dc18f657327f	df3402a6-4522-4745-a193-0d36e9753fa7	2025-12-01	Take as directed with food	2025-12-01 05:55:45.0172+02
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name, permissions, created_at) FROM stdin;
3dddaea4-fd98-4ec2-9060-419892851ed5	Doctor	["patients.view", "patients.create", "patients.update", "appointments.view", "appointments.viewOwn", "appointments.updateOwn", "visits.*", "pregnancy.*", "calendars.viewOwn", "calendars.updateOwn", "calendars.manageWorkingHours", "calendars.manageTimeSlots", "calendars.manageExceptions", "stats.viewOwn", "colorcodes.view"]	2025-12-13 02:19:26.180642+02
efaf6b86-2456-4751-9360-5f69b1eaac2d	Receptionist	["patients.*", "doctors.view", "appointments.*", "visits.view", "calendars.view", "calendars.viewAvailableSlots", "whatsapp.send", "whatsapp.viewMessages", "colorcodes.view", "colorcodes.update", "stats.viewBasic"]	2025-12-13 02:19:26.180642+02
993f8015-f757-4da9-8424-31e88c89294e	Super Admin	["users.*", "roles.*", "patients.*", "doctors.*", "appointments.*", "visits.*", "pregnancy.*", "calendars.*", "whatsapp.*", "colorcodes.*", "stats.*", "settings.*"]	2025-12-13 02:19:26.180642+02
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password_hash, full_name, role_id, email, phone, created_at, updated_at) FROM stdin;
a9551bc7-e190-4017-a256-bd1c48c70eea	superadmin	$2b$10$hc/HmxnhRWQS5HILDJ0.Lu0R8O.XBheyeKp/p8XGABXBC3ACU.WD.	System Administrator	993f8015-f757-4da9-8424-31e88c89294e	admin@herhealth.clinic	\N	2025-12-13 02:19:26.180642+02	2025-12-13 03:00:08.774905+02
b9796075-179f-4a0c-a266-36d01aebd524	soha	$2b$10$k8tSSaxr7M9gi08e3z72Ru562iJ9V4ryYwQEBTP7/SQWqCYGV.1Ya	Soha Mohamed	3dddaea4-fd98-4ec2-9060-419892851ed5	soha@herhealth.com	0123698547	2025-12-13 02:45:42.148433+02	2026-01-09 01:06:04.166936+02
839cf3a8-85b8-4acd-91ed-7753192c167b	admin	$2b$10$E/n4wsJzgym0rVakDKs/U.UMmdiSnrpIRB8WBPrfoELxcVJMnPEmi	System Administrator	993f8015-f757-4da9-8424-31e88c89294e	admin@herhealth.com	01226470484	2025-12-01 04:19:55.792667+02	2026-01-09 01:06:34.600201+02
\.


--
-- Data for Name: visits; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.visits (id, appointment_id, patient_id, doctor_id, visit_date, reason, clinical_notes, diagnosis, treatment_plan, created_at, updated_at, pregnancy_id, pregnancy_notes, pregnancy_week) FROM stdin;
05ec5c6d-33f5-4348-bcac-70ce619df7f1	5b683eed-6c75-4908-a802-484dc0a84714	65cfccdb-f436-4961-b629-eabe39748d22	b258c852-0f82-4c96-9ca7-c4609c091e29	2025-12-05	Annual Checkup	Patient presented for Annual Checkup	Healthy	Continue current care plan	2025-12-01 05:50:02.630405+02	2025-12-01 05:50:02.630405+02	\N	\N	\N
f56d0683-7917-4432-9668-b14c71988332	eeabdff9-bbcc-4884-8068-8cf15dd8a719	b7064c1a-9830-41e1-8939-a561df6e89e0	3bb6cd6c-4a7c-49ef-b2f5-9a4b39444abb	2025-12-05	Prenatal Visit	Patient presented for Prenatal Visit	Normal pregnancy progression	Continue current care plan	2025-12-01 05:50:02.630405+02	2025-12-01 05:50:02.630405+02	\N	\N	\N
a3f94806-86fa-40bd-8527-e1155e6dbc5d	7a211d20-961b-44ab-ad55-b7808096e584	1fb056f7-a7ca-4b54-baef-0d6c92117812	828ce74d-1e19-4a15-8388-292aa0001fcd	2025-12-06	Follow-up	Patient presented for Follow-up	Stable condition	Continue current care plan	2025-12-01 05:50:02.630405+02	2025-12-01 05:50:02.630405+02	\N	\N	\N
fdd0c2ff-8b7d-4ea8-8e25-14c9a56034c9	a42091e2-c195-4863-8d42-d6fdf4b88818	4257a240-2972-4424-8acd-a273188f37a3	522429a1-69e3-4472-8af9-309975818e8d	2025-12-07	Consultation	Patient presented for Consultation	Healthy	Continue current care plan	2025-12-01 05:50:02.630405+02	2025-12-01 05:50:02.630405+02	\N	\N	\N
aedd176d-3593-4f68-92f1-f84b3d0282d1	84b67325-ce68-4fe3-bab1-545e68423a39	9d29df28-9c05-4009-b6b0-e2c01f3b85c8	ebaba171-3194-4c6c-9bba-052689078eaf	2025-12-08	Prenatal Visit	Patient presented for Prenatal Visit	Normal pregnancy progression	Continue current care plan	2025-12-01 05:50:02.630405+02	2025-12-01 05:50:02.630405+02	\N	\N	\N
7917f0dd-9bb2-4c20-8b7f-fadf7a598bad	38fce55f-2e7a-4519-846f-ab282e3b14c4	7dba7916-2de9-447e-b9c7-11ed48346524	0fda0e91-654f-4c1b-9674-cb38bd94e877	2025-12-09	Follow-up	Patient presented for Follow-up	Stable condition	Continue current care plan	2025-12-01 05:50:02.630405+02	2025-12-01 05:50:02.630405+02	\N	\N	\N
b59c6966-e359-499e-a5b0-bbed111731e2	44a4523d-e4c1-4316-8d61-5d3bc4a99356	7f45163c-3ef5-41b6-b5d7-5c833c0ce6c1	addaf0b2-2010-4124-af40-4cc186a38a52	2025-12-10	Annual Checkup	Patient presented for Annual Checkup	Healthy	Continue current care plan	2025-12-01 05:50:02.630405+02	2025-12-01 05:50:02.630405+02	\N	\N	\N
d1356c4d-45df-404b-9b8e-9388f58afdb6	6b6474cf-8b54-4119-a5e1-464c1e775900	a5bce3f9-4624-45c9-9f05-3f87ba722aa5	6453a2e8-a027-45bd-af26-a477acbea7f2	2025-12-11	Consultation	Patient presented for Consultation	Healthy	Continue current care plan	2025-12-01 05:50:02.630405+02	2025-12-01 05:50:02.630405+02	\N	\N	\N
8d70e5ae-57e1-4ac4-a9c5-0f312d30ee42	625563cc-36f5-4bfb-b388-add6557dee78	0bf38974-07fa-405a-b739-db0bb9613ac3	3cca1e2a-04ed-42fd-a908-207a231f6207	2025-12-12	Follow-up	Patient presented for Follow-up	Stable condition	Continue current care plan	2025-12-01 05:50:02.630405+02	2025-12-01 05:50:02.630405+02	\N	\N	\N
2a91feb8-7426-4cd5-b00d-e469ac9eff41	\N	0bf38974-07fa-405a-b739-db0bb9613ac3	6453a2e8-a027-45bd-af26-a477acbea7f2	2025-12-15	follow up	normal	normal pregnancy	vitamins medications	2025-12-15 23:45:55.616387+02	2025-12-15 23:45:55.616387+02	\N	\N	\N
d0442210-94e1-42ad-a66f-205d4fb371b9	d2f3c9d3-1c41-4cf6-a8b0-ea9dcb764708	41023f41-a7b7-4ff2-8110-dc18f657327f	df3402a6-4522-4745-a193-0d36e9753fa7	2025-12-11	Prenatal Visit	Patient presented for Prenatal Visit	Normal pregnancy progression	Continue current care plan	2025-12-01 05:50:02.630405+02	2026-01-09 01:02:59.576333+02	2c7c7a4f-5b4b-4986-aa3f-a3f12a2ff20d	the the pregnancy normal 	20
5ddfea35-4dc3-4c82-88fe-bf51ba847dc0	\N	4ea60de4-53c8-47db-840d-e57cdd584934	6453a2e8-a027-45bd-af26-a477acbea7f2	2026-01-18	Routine checkup 	\N	\N	\N	2026-01-18 02:23:55.188543+02	2026-01-18 02:23:55.188543+02	\N	\N	\N
\.


--
-- Data for Name: whatsapp_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.whatsapp_messages (id, appointment_id, patient_id, phone_number, message_type, message_content, status, whatsapp_message_id, error_message, sent_at, delivered_at, read_at, created_at, template_id) FROM stdin;
80b37557-2d80-4ee2-952e-1403838d9faa	120b3094-cf99-4400-9b19-4e68085da175	d0bbf489-8719-444a-9e7c-d95806e88cc2	031565155516	scheduled	Hello Heba Victor ! Your appointment has been scheduled.\r\n\r\nDate: December 12, 2025\r\nTime: 09:00 AM\r\nDoctor: Dr. Dr. Barbara Jackson\r\n\r\nLocation: {clinic_name}\r\nFor questions, call: {clinic_phone}	failed	\N	Invalid OAuth access token - Cannot parse access token	\N	\N	\N	2025-12-10 03:48:11.101077+02	\N
c5c0eb8c-0353-4371-80c1-40212f1be547	a91d4c9f-3641-4f81-8e20-7f06c3b4cf7b	3494cf07-3954-4cd6-8401-6c0a66419186	01256489415	scheduled	Hello Kamalia Lotfy! Your appointment has been scheduled.\r\n\r\nDate: December 13, 2025\r\nTime: 09:00 AM\r\nDoctor: Dr. Dr. Barbara Jackson\r\n\r\nLocation: {clinic_name}\r\nFor questions, call: {clinic_phone}	failed	\N	Invalid OAuth access token - Cannot parse access token	\N	\N	\N	2025-12-10 04:10:52.730101+02	\N
790ade1b-624e-4e8c-9633-dd03a4b4fa47	61723856-5ab6-4b15-b239-74ac23d956e5	af0e04e5-0aff-421c-9426-3c74c8289e90	015556564848	scheduled	Hello Emilis Jackson! Your appointment has been scheduled.\r\n\r\nDate: December 13, 2025\r\nTime: 09:20 AM\r\nDoctor: Dr. Dr. Barbara Jackson\r\n\r\nLocation: {clinic_name}\r\nFor questions, call: {clinic_phone}	failed	\N	Invalid OAuth access token - Cannot parse access token	\N	\N	\N	2025-12-10 04:12:24.899189+02	\N
6efa42be-78db-42e8-b3cb-4ed49c0918e8	7c6ac308-7af2-4506-8bf1-859245c754a4	af0e04e5-0aff-421c-9426-3c74c8289e90	015556564848	scheduled	Hello Emilis Jackson! Your appointment has been scheduled.\r\n\r\nDate: December 13, 2025\r\nTime: 09:20 AM\r\nDoctor: Dr. Dr. Barbara Jackson\r\n\r\nLocation: {clinic_name}\r\nFor questions, call: {clinic_phone}	failed	\N	Invalid OAuth access token - Cannot parse access token	\N	\N	\N	2025-12-10 04:16:20.621083+02	\N
cc81ddfb-847e-438a-ba74-45c2abd83c69	97897d98-e2f3-4b5d-aa4e-ece80ad493d0	af0e04e5-0aff-421c-9426-3c74c8289e90	015556564848	scheduled	Hello Emilis Jackson! Your appointment has been scheduled.\r\n\r\nDate: December 13, 2025\r\nTime: 01:00 PM\r\nDoctor: Dr. Dr. Barbara Jackson\r\n\r\nLocation: {clinic_name}\r\nFor questions, call: {clinic_phone}	failed	\N	Invalid OAuth access token - Cannot parse access token	\N	\N	\N	2025-12-10 04:31:09.055859+02	\N
972e30a6-24c6-4770-aa9b-9493b3cdcf7b	86697c39-bb12-43e3-93ea-00cb05ebfac6	d0bbf489-8719-444a-9e7c-d95806e88cc2	031565155516	scheduled	Hello Heba Victor ! Your appointment has been scheduled.\r\n\r\nDate: December 13, 2025\r\nTime: 09:00 AM\r\nDoctor: Dr. Dr. Barbara Jackson\r\n\r\nLocation: {clinic_name}\r\nFor questions, call: {clinic_phone}	failed	\N	Invalid OAuth access token - Cannot parse access token	\N	\N	\N	2025-12-10 04:32:06.864385+02	\N
c6469be3-644f-4c02-a5da-86bd12040954	6a6911ac-035a-438e-ace4-a634c549eb84	41023f41-a7b7-4ff2-8110-dc18f657327f	555-1001	scheduled	Hello Rachel Taylor! Your appointment has been scheduled.\r\n\r\nDate: January 10, 2026\r\nTime: 09:00 AM\r\nDoctor: Dr. Dr. Barbara Jackson\r\n\r\nLocation: {clinic_name}\r\nFor questions, call: {clinic_phone}	failed	\N	Invalid OAuth access token - Cannot parse access token	\N	\N	\N	2025-12-12 00:49:19.70173+02	\N
278f32b7-da8e-44e8-93c9-154776c61f83	d9321c25-38d9-4edf-b533-2b8b4a1b3811	41023f41-a7b7-4ff2-8110-dc18f657327f	555-1001	scheduled	Hello Rachel Taylor! Your appointment has been scheduled.\r\n\r\nDate: January 31, 2026\r\nTime: 09:00 AM\r\nDoctor: Dr. Dr. Patricia Kumar\r\n\r\nLocation: {clinic_name}\r\nFor questions, call: {clinic_phone}	failed	\N	Invalid OAuth access token - Cannot parse access token	\N	\N	\N	2025-12-12 02:03:33.024408+02	\N
7b416769-a315-420e-8b4f-097f86ac382c	610308cf-7181-498c-9bd8-d01d64baefcc	6d2bdbaa-ac91-474b-9014-65e8e0da0a3d	01256964989	scheduled	Hello Rehab Helmy! Your appointment has been scheduled.\r\n\r\nDate: January 15, 2026\r\nTime: 09:00 AM\r\nDoctor: Dr. Dr. Barbara Jackson\r\n\r\nLocation: {clinic_name}\r\nFor questions, call: {clinic_phone}	failed	\N	Invalid OAuth access token - Cannot parse access token	\N	\N	\N	2025-12-12 03:36:33.560897+02	\N
dd1a2e09-051d-4d4e-b1ba-7c64b85d1e1f	\N	95aeb430-e169-44b5-a460-5a33a87fa233	01013880194	template	Hello {patient_name}! Your appointment is confirmed.\r\n\r\nDate: {appointment_date}\r\nTime: {appointment_time}\r\nDoctor: {doctor_name}\r\n\r\nPlease arrive 10 minutes early. Thank you!	pending	\N	\N	\N	\N	\N	2025-12-16 03:21:55.855162+02	302b59d8-1d78-4563-8259-c57ac3c48abf
5290ec66-c823-4be5-8b99-353e66544878	\N	95aeb430-e169-44b5-a460-5a33a87fa233	01013880194	template	Hello {patient_name}! Your appointment is confirmed.\r\n\r\nDate: {appointment_date}\r\nTime: {appointment_time}\r\nDoctor: {doctor_name}\r\n\r\nPlease arrive 10 minutes early. Thank you!	pending	\N	\N	\N	\N	\N	2025-12-16 03:22:41.661796+02	302b59d8-1d78-4563-8259-c57ac3c48abf
a69376c3-cbd3-4e83-9f7f-61327dded819	\N	95aeb430-e169-44b5-a460-5a33a87fa233	01013880194	template	Hello {patient_name}! Your appointment is confirmed.\r\n\r\nDate: {appointment_date}\r\nTime: {appointment_time}\r\nDoctor: {doctor_name}\r\n\r\nPlease arrive 10 minutes early. Thank you!	failed	\N	Invalid OAuth access token - Cannot parse access token	\N	\N	\N	2025-12-16 03:25:19.58527+02	302b59d8-1d78-4563-8259-c57ac3c48abf
f2457934-e05d-4855-8a3c-013bc14e3545	\N	95aeb430-e169-44b5-a460-5a33a87fa233	01013880194	template	Hello {patient_name}! Your appointment is confirmed.\r\n\r\nDate: {appointment_date}\r\nTime: {appointment_time}\r\nDoctor: {doctor_name}\r\n\r\nPlease arrive 10 minutes early. Thank you!	failed	\N	Evaluation failed: t	\N	\N	\N	2025-12-16 03:26:02.286855+02	302b59d8-1d78-4563-8259-c57ac3c48abf
6557069e-f639-4196-8bf8-971e823d1b28	\N	95aeb430-e169-44b5-a460-5a33a87fa233	01013880194	template	Hello {patient_name}! Your appointment is confirmed.\r\n\r\nDate: {appointment_date}\r\nTime: {appointment_time}\r\nDoctor: {doctor_name}\r\n\r\nPlease arrive 10 minutes early. Thank you!	failed	\N	Invalid OAuth access token - Cannot parse access token	\N	\N	\N	2025-12-16 03:28:03.422675+02	302b59d8-1d78-4563-8259-c57ac3c48abf
bcab3260-0aa1-4761-8a6f-aaed310cba99	\N	95aeb430-e169-44b5-a460-5a33a87fa233	01013880194	template	Hello {patient_name}! Your appointment is confirmed.\r\n\r\nDate: {appointment_date}\r\nTime: {appointment_time}\r\nDoctor: {doctor_name}\r\n\r\nPlease arrive 10 minutes early. Thank you!	failed	\N	Evaluation failed: t	\N	\N	\N	2025-12-16 03:28:35.570428+02	302b59d8-1d78-4563-8259-c57ac3c48abf
c337931f-0fa5-42b5-87c9-1637b5433e4b	\N	95aeb430-e169-44b5-a460-5a33a87fa233	01013880194	template	Hello {patient_name}! Your appointment is confirmed.\r\n\r\nDate: {appointment_date}\r\nTime: {appointment_time}\r\nDoctor: {doctor_name}\r\n\r\nPlease arrive 10 minutes early. Thank you!	sent	3EB0653B8D69C4C7F80A72	\N	2025-12-16 03:30:36.221+02	\N	\N	2025-12-16 03:30:35.870681+02	302b59d8-1d78-4563-8259-c57ac3c48abf
66da0eb5-83f4-45af-9c3a-a97cf7ad47a7	\N	95aeb430-e169-44b5-a460-5a33a87fa233	01013880194	template	Hello Flora Victor! Your appointment is confirmed.\r\n\r\nDate: N/A\r\nTime: N/A\r\nDoctor: N/A\r\n\r\nPlease arrive 10 minutes early. Thank you!	sent	3EB0C71E633A248DF3F472	\N	2025-12-16 03:40:10.023+02	\N	\N	2025-12-16 03:40:09.789147+02	302b59d8-1d78-4563-8259-c57ac3c48abf
89644731-bbb6-42b1-8255-18c6b119a8f9	05483674-599b-4513-810d-2ee159e88166	95aeb430-e169-44b5-a460-5a33a87fa233	01013880194	scheduled	Hello Flora Victor ! Your appointment has been scheduled.\r\n\r\nDate: December 21, 2025\r\nTime: 01:00 PM\r\nDoctor: Dr. Dr. Barbara Jackson\r\n\r\nLocation: {clinic_name}\r\nFor questions, call: {clinic_phone}	sent	3EB01EB9E10AA8987AF3E0	\N	2025-12-16 03:45:40.934+02	\N	\N	2025-12-16 03:45:40.865253+02	\N
c23bcb87-e4bd-4927-ade5-d66b014a494a	\N	95aeb430-e169-44b5-a460-5a33a87fa233	01013880194	template	Hello Flora Victor! Your appointment is confirmed.\r\n\r\nDate: N/A\r\nTime: N/A\r\nDoctor: N/A\r\n\r\nPlease arrive 10 minutes early. Thank you!	sent	3EB0E4C184822B9DD51874	\N	2025-12-16 03:48:03.838+02	\N	\N	2025-12-16 03:48:03.740531+02	302b59d8-1d78-4563-8259-c57ac3c48abf
84a5f0ad-4de4-4936-be8c-b01e79eee2b3	\N	95aeb430-e169-44b5-a460-5a33a87fa233	01013880194	template	Hello Flora Victor! Your appointment is confirmed.\r\n\r\nDate: 21/12/2025\r\nTime: 11:00\r\nDoctor: Dr. Dr. Barbara Jackson\r\n\r\nPlease arrive 10 minutes early. Thank you!	failed	\N	WhatsApp Web client is not ready. Please scan QR code first.	\N	\N	\N	2025-12-16 04:00:31.271999+02	302b59d8-1d78-4563-8259-c57ac3c48abf
b12ebf22-8faa-4f38-92e5-f91304340a9f	\N	95aeb430-e169-44b5-a460-5a33a87fa233	01013880194	template	Hello Flora Victor! Your appointment is confirmed.\r\n\r\nDate: 21/12/2025\r\nTime: 11:00\r\nDoctor: Dr. Dr. Barbara Jackson\r\n\r\nPlease arrive 10 minutes early. Thank you!	sent	3EB0FFBF8BB98B6D85F7A1	\N	2025-12-16 04:01:07.936+02	\N	\N	2025-12-16 04:01:07.707208+02	302b59d8-1d78-4563-8259-c57ac3c48abf
4b426e2d-5b60-47a5-9eb9-c3439977b591	\N	95aeb430-e169-44b5-a460-5a33a87fa233	01013880194	template	Hello Flora Victor! Due to an emergency, your appointment has been cancelled.\r\n\r\nDate: 21/12/2025\r\nTime: 11:00\r\nDoctor: Dr. Dr. Barbara Jackson\r\n\r\nWe apologize for the inconvenience. We will contact you shortly to reschedule.	sent	3EB02BB9CF5DA268379BB4	\N	2025-12-16 04:01:42.712+02	\N	\N	2025-12-16 04:01:42.62191+02	1a3033c1-5ac9-482a-941b-9b005887e1b5
7be69b42-d40c-499c-a599-d07c6e61c391	\N	95aeb430-e169-44b5-a460-5a33a87fa233	01013880194	template	Reminder: You have an appointment tomorrow.\r\n\r\nDate: 21/12/2025\r\nTime: 11:00\r\nDoctor: Dr. Dr. Barbara Jackson\r\nLocation: HerHealth Clinic\r\n\r\nPlease confirm or call 0100 000 3626 if you need to reschedule.	sent	3EB0B407BBC5BD4A2C0B08	\N	2025-12-16 04:02:32.018+02	\N	\N	2025-12-16 04:02:31.926292+02	1b5c48b7-a783-44bd-8ec0-2354fe2c489f
85bc74fb-f93a-4073-8654-297cdbfdea01	\N	95aeb430-e169-44b5-a460-5a33a87fa233	01013880194	template	Reminder: You have an appointment tomorrow.\n\nDate: 25/12/2025\nTime: 09:00\nDoctor: Dr. Dr. Barbara Jackson\nClinic Name: HerHealth Clinic\nLocation: شارع 151 - عمارة 9 - ميدان الحرية - بجوار بنك أبو ظبي - الدور الأول شقة رقم 1\nPlease confirm or call 0100 000 3626 if you need to reschedule.	sent	3EB0E381E0E7FE555B53C4	\N	2025-12-16 04:06:30.608+02	\N	\N	2025-12-16 04:06:30.524964+02	1b5c48b7-a783-44bd-8ec0-2354fe2c489f
d1f115a6-f2a3-44bd-882b-829dfa56881b	\N	95aeb430-e169-44b5-a460-5a33a87fa233	01013880194	template	Hello Flora Victor! Due to an emergency, your appointment has been cancelled.\r\n\r\nDate: 25/12/2025\r\nTime: 09:00\r\nDoctor: Dr. Dr. Barbara Jackson\r\n\r\nWe apologize for the inconvenience. We will contact you shortly to reschedule.	sent	3EB0033CE6B742CD35A75A	\N	2025-12-16 04:10:35.853+02	\N	\N	2025-12-16 04:10:35.765728+02	1a3033c1-5ac9-482a-941b-9b005887e1b5
8f6b1dbf-684c-4f84-99b0-57a7b89b51d9	\N	95aeb430-e169-44b5-a460-5a33a87fa233	01013880194	template	Hello Flora Victor. Your appointment has been cancelled.\r\n\r\nDate: 25/12/2025\r\nTime: 09:00\r\nDoctor: Dr. Dr. Barbara Jackson\r\nReason: N/A\r\n\r\nTo reschedule, please contact us at 0100 666 8289.	failed	\N	WhatsApp Web client is not ready. Please scan QR code first.	\N	\N	\N	2026-01-14 00:10:24.445317+02	5587da00-0009-44f1-a91b-cb927aaf01a8
76e9900a-f60d-40b2-b1f8-1d7b4af61ae2	a251c3f1-d665-4070-b57b-28c937ff1944	4ea60de4-53c8-47db-840d-e57cdd584934	01226470484	scheduled	Hello Reham Othman! Your appointment has been scheduled.\r\n\r\nDate: January 22, 2026\r\nTime: 09:00 AM\r\nDoctor: Dr. Dr. Barbara Jackson\r\n\r\nLocation: {clinic_name}\r\nFor questions, call: {clinic_phone}	failed	\N	WhatsApp Web client is not ready. Please scan QR code first.	\N	\N	\N	2026-01-18 01:51:05.114168+02	\N
e0898708-3fd2-4601-9629-ce8dfa609d97	\N	4ea60de4-53c8-47db-840d-e57cdd584934	01226470484	template	Hello Reham Othman. Your appointment has been cancelled.\r\n\r\nDate: 22/01/2026\r\nTime: 07:00\r\nDoctor: Dr. Dr. Barbara Jackson\r\nReason: N/A\r\n\r\nTo reschedule, please contact us at 0100 666 8289.	failed	\N	Evaluation failed: TypeError: Cannot read properties of undefined (reading 'markedUnread')\n    at I (https://static.whatsapp.net/rsrc.php/v4ivYF4/y1/l/en_US-j/v6r9uR-QSIK.js:1541:4171)\n    at Object.<anonymous> (https://static.whatsapp.net/rsrc.php/v4ivYF4/y1/l/en_US-j/v6r9uR-QSIK.js:1541:1751)\n    at Generator.next (<anonymous>)\n    at l (https://static.whatsapp.net/rsrc.php/v4/y-/r/HA6KjfwtAw6.js:107:125)\n    at i (https://static.whatsapp.net/rsrc.php/v4/y-/r/HA6KjfwtAw6.js:107:349)\n    at https://static.whatsapp.net/rsrc.php/v4/y-/r/HA6KjfwtAw6.js:107:408\n    at new Promise (<anonymous>)\n    at Object.<anonymous> (https://static.whatsapp.net/rsrc.php/v4/y-/r/HA6KjfwtAw6.js:107:277)\n    at Object.S (https://static.whatsapp.net/rsrc.php/v4ivYF4/y1/l/en_US-j/v6r9uR-QSIK.js:1541:2045)\n    at Object.v [as sendSeen] (https://static.whatsapp.net/rsrc.php/v4ivYF4/y1/l/en_US-j/v6r9uR-QSIK.js:1541:1312)	\N	\N	\N	2026-01-18 02:47:43.95747+02	5587da00-0009-44f1-a91b-cb927aaf01a8
b8902bcb-f5d4-4109-a7ce-f164df6d31ad	\N	c6bd8ff1-c957-4081-b68f-42f73bc873a4	201277179033	template	Hello Sama ezzat. Your appointment has been cancelled.\r\n\r\nDate: N/A\r\nTime: N/A\r\nDoctor: N/A\r\nReason: N/A\r\n\r\nTo reschedule, please contact us at 0100 666 8289.	failed	\N	Evaluation failed: TypeError: Cannot read properties of undefined (reading 'markedUnread')\n    at I (https://static.whatsapp.net/rsrc.php/v4ivYF4/y1/l/en_US-j/v6r9uR-QSIK.js:1541:4171)\n    at Object.<anonymous> (https://static.whatsapp.net/rsrc.php/v4ivYF4/y1/l/en_US-j/v6r9uR-QSIK.js:1541:1751)\n    at Generator.next (<anonymous>)\n    at l (https://static.whatsapp.net/rsrc.php/v4/y-/r/HA6KjfwtAw6.js:107:125)\n    at i (https://static.whatsapp.net/rsrc.php/v4/y-/r/HA6KjfwtAw6.js:107:349)\n    at https://static.whatsapp.net/rsrc.php/v4/y-/r/HA6KjfwtAw6.js:107:408\n    at new Promise (<anonymous>)\n    at Object.<anonymous> (https://static.whatsapp.net/rsrc.php/v4/y-/r/HA6KjfwtAw6.js:107:277)\n    at Object.v [as sendSeen] (https://static.whatsapp.net/rsrc.php/v4ivYF4/y1/l/en_US-j/v6r9uR-QSIK.js:1541:1312)\n    at window.WWebJS.sendSeen (pptr://__puppeteer_evaluation_script__:14:41)	\N	\N	\N	2026-01-18 02:48:08.941629+02	5587da00-0009-44f1-a91b-cb927aaf01a8
c9d3291a-c6c2-4fd0-96e1-e6d9b3516726	73e60553-2392-4af0-b5e1-a60372e7c81d	95aeb430-e169-44b5-a460-5a33a87fa233	01013880194	scheduled	Hello Flora Victor ! Your appointment has been scheduled.\r\n\r\nDate: January 19, 2026\r\nTime: 01:00 PM\r\nDoctor: Dr. Dr. Barbara Jackson\r\n\r\nLocation: {clinic_name}\r\nFor questions, call: {clinic_phone}	failed	\N	WhatsApp Web client is not ready. Please scan QR code first.	\N	\N	\N	2026-01-18 03:23:56.530832+02	\N
b100de73-e02d-44c2-8381-3d68887c796c	dc13785c-f9a8-42f0-8571-6004e66ceaa9	6d2bdbaa-ac91-474b-9014-65e8e0da0a3d	01256964989	scheduled	Hello Rehab Helmy! Your appointment has been scheduled.\r\n\r\nDate: January 19, 2026\r\nTime: 01:20 PM\r\nDoctor: Dr. Dr. Barbara Jackson\r\n\r\nLocation: {clinic_name}\r\nFor questions, call: {clinic_phone}	failed	\N	WhatsApp Web client is not ready. Please scan QR code first.	\N	\N	\N	2026-01-18 03:24:53.737115+02	\N
f9f08c50-79c1-427f-8653-0a596f7fc45c	df5967ce-2d61-41c3-9395-8fafdee1fef9	4ea60de4-53c8-47db-840d-e57cdd584934	01226470484	scheduled	Hello Reham Othman! Your appointment has been scheduled.\r\n\r\nDate: January 19, 2026\r\nTime: 02:00 PM\r\nDoctor: Dr. Dr. Barbara Jackson\r\n\r\nLocation: {clinic_name}\r\nFor questions, call: {clinic_phone}	failed	\N	WhatsApp Web client is not ready. Please scan QR code first.	\N	\N	\N	2026-01-18 03:31:17.573097+02	\N
53bd64f3-2c59-48bc-9b53-a3c8fd086293	\N	4ea60de4-53c8-47db-840d-e57cdd584934	01226470484	template	Hello Reham Othman. Your appointment has been cancelled.\r\n\r\nDate: 22/01/2026\r\nTime: 07:00\r\nDoctor: Dr. Dr. Barbara Jackson\r\nReason: N/A\r\n\r\nTo reschedule, please contact us at 0100 666 8289.	failed	\N	WhatsApp Web client is not ready. Please scan QR code first.	\N	\N	\N	2026-01-18 03:36:43.025409+02	5587da00-0009-44f1-a91b-cb927aaf01a8
838a93b4-8ad3-4e37-96ab-8ea1de6a96ec	\N	4ea60de4-53c8-47db-840d-e57cdd584934	01226470484	template	Hello Reham Othman. Your appointment has been cancelled.\r\n\r\nDate: 22/01/2026\r\nTime: 07:00\r\nDoctor: Dr. Dr. Barbara Jackson\r\nReason: N/A\r\n\r\nTo reschedule, please contact us at 0100 666 8289.	failed	\N	Message may have sent but failed to mark chat as seen. This is expected for first-time contacts.	\N	\N	\N	2026-01-18 03:37:16.938311+02	5587da00-0009-44f1-a91b-cb927aaf01a8
9461ddf9-a980-4eb7-8162-f0c4dab376bd	\N	c6bd8ff1-c957-4081-b68f-42f73bc873a4	201277179033	template	Hello Sama ezzat. Your appointment has been cancelled.\r\n\r\nDate: N/A\r\nTime: N/A\r\nDoctor: N/A\r\nReason: N/A\r\n\r\nTo reschedule, please contact us at 0100 666 8289.	failed	\N	Message may have sent but failed to mark chat as seen. This is expected for first-time contacts.	\N	\N	\N	2026-01-18 03:37:59.890108+02	5587da00-0009-44f1-a91b-cb927aaf01a8
8fbf698d-314a-45d0-8f64-2cf841f4cdb4	\N	4ea60de4-53c8-47db-840d-e57cdd584934	01226470484	template	Hello Reham Othman. Your appointment has been cancelled.\r\n\r\nDate: 22/01/2026\r\nTime: 07:00\r\nDoctor: Dr. Dr. Barbara Jackson\r\nReason: N/A\r\n\r\nTo reschedule, please contact us at 0100 666 8289.	failed	\N	WhatsApp Web client is not ready. Please scan QR code first.	\N	\N	\N	2026-01-18 03:42:29.894678+02	5587da00-0009-44f1-a91b-cb927aaf01a8
35bf865f-07dc-45fc-be62-cf03aaa2d59e	\N	4ea60de4-53c8-47db-840d-e57cdd584934	01226470484	template	Hello Reham Othman. Your appointment has been cancelled.\r\n\r\nDate: 22/01/2026\r\nTime: 07:00\r\nDoctor: Dr. Dr. Barbara Jackson\r\nReason: N/A\r\n\r\nTo reschedule, please contact us at 0100 666 8289.	sent	sent_but_no_receipt	\N	2026-01-18 03:42:59.74+02	\N	\N	2026-01-18 03:42:59.7042+02	5587da00-0009-44f1-a91b-cb927aaf01a8
25ee6c04-3413-4243-90a9-1cf80c43077f	\N	4ea60de4-53c8-47db-840d-e57cdd584934	01226470484	template	Hello Reham Othman! Due to an emergency, your appointment has been cancelled.\r\n\r\nDate: 22/01/2026\r\nTime: 07:00\r\nDoctor: Dr. Dr. Barbara Jackson\r\n\r\nWe apologize for the inconvenience. We will contact you shortly to reschedule.	sent	sent_but_no_receipt	\N	2026-01-18 03:44:02.416+02	\N	\N	2026-01-18 03:44:02.382822+02	1a3033c1-5ac9-482a-941b-9b005887e1b5
0c66620c-d908-4a32-9d78-25e4cdde2c1d	\N	4ea60de4-53c8-47db-840d-e57cdd584934	201226470484	template	Hello Reham Othman! Due to an emergency, your appointment has been cancelled.\r\n\r\nDate: 22/01/2026\r\nTime: 07:00\r\nDoctor: Dr. Dr. Barbara Jackson\r\n\r\nWe apologize for the inconvenience. We will contact you shortly to reschedule.	sent	sent_but_no_receipt	\N	2026-01-18 03:44:47.662+02	\N	\N	2026-01-18 03:44:47.632894+02	1a3033c1-5ac9-482a-941b-9b005887e1b5
26acb7a6-fa17-4f84-84ed-3501aef7aacf	\N	4ea60de4-53c8-47db-840d-e57cdd584934	201226470484	template	Hello Reham Othman! Due to an emergency, your appointment has been cancelled.\r\n\r\nDate: 19/01/2026\r\nTime: 14:00\r\nDoctor: Dr. Dr. Barbara Jackson\r\n\r\nWe apologize for the inconvenience. We will contact you shortly to reschedule.	failed	\N	WhatsApp send failed: Evaluation failed: TypeError: Cannot read properties of undefined (reading 'markedUnread')\n    at I (https://static.whatsapp.net/rsrc.php/v4ivYF4/y1/l/en_US-j/v6r9uR-QSIK.js:1541:4171)\n    at Object.<anonymous> (https://static.whatsapp.net/rsrc.php/v4ivYF4/y1/l/en_US-j/v6r9uR-QSIK.js:1541:1751)\n    at Generator.next (<anonymous>)\n    at l (https://static.whatsapp.net/rsrc.php/v4/y-/r/HA6KjfwtAw6.js:107:125)\n    at i (https://static.whatsapp.net/rsrc.php/v4/y-/r/HA6KjfwtAw6.js:107:349)\n    at https://static.whatsapp.net/rsrc.php/v4/y-/r/HA6KjfwtAw6.js:107:408\n    at new Promise (<anonymous>)\n    at Object.<anonymous> (https://static.whatsapp.net/rsrc.php/v4/y-/r/HA6KjfwtAw6.js:107:277)\n    at Object.S (https://static.whatsapp.net/rsrc.php/v4ivYF4/y1/l/en_US-j/v6r9uR-QSIK.js:1541:2045)\n    at Object.v [as sendSeen] (https://static.whatsapp.net/rsrc.php/v4ivYF4/y1/l/en_US-j/v6r9uR-QSIK.js:1541:1312)	\N	\N	\N	2026-01-18 03:51:23.985891+02	1a3033c1-5ac9-482a-941b-9b005887e1b5
c88d94fc-2af3-4016-a06e-0e9549dfc35e	\N	4ea60de4-53c8-47db-840d-e57cdd584934	201226470484	template	Hello Reham Othman! Due to an emergency, your appointment has been cancelled.\r\n\r\nDate: 19/01/2026\r\nTime: 14:00\r\nDoctor: Dr. Dr. Barbara Jackson\r\n\r\nWe apologize for the inconvenience. We will contact you shortly to reschedule.	sent	3EB06D8A67F1144CB94496	\N	2026-01-18 03:53:11.226+02	\N	\N	2026-01-18 03:53:10.883228+02	1a3033c1-5ac9-482a-941b-9b005887e1b5
234deba2-44c1-4168-ab24-eda651988d44	\N	4ea60de4-53c8-47db-840d-e57cdd584934	201226470484	template	Hello Reham Othman! Your appointment has been rescheduled.\r\n\r\nPrevious: {old_date} at {old_time}\r\nNew: {new_date} at {new_time}\r\nDoctor: Dr. Dr. Barbara Jackson\r\n\r\nSee you at the new time!	sent	3EB05F1F4EAC28A8C758EA	\N	2026-01-18 03:54:27.329+02	\N	\N	2026-01-18 03:54:27.035938+02	868c3766-4712-4d45-8921-099d5dd251dd
\.


--
-- Data for Name: whatsapp_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.whatsapp_templates (id, template_name, template_type, template_content, variables, is_active, created_at, updated_at) FROM stdin;
989c40f3-5c99-4222-be67-c147367eb641	appointment_scheduled	scheduled	Hello {patient_name}! Your appointment has been scheduled.\r\n\r\nDate: {appointment_date}\r\nTime: {appointment_time}\r\nDoctor: {doctor_name}\r\n\r\nLocation: {clinic_name}\r\nFor questions, call: {clinic_phone}	{"clinic_name": "string", "doctor_name": "string", "clinic_phone": "string", "patient_name": "string", "appointment_date": "string", "appointment_time": "string"}	t	2025-12-04 18:43:05.920373+02	2025-12-04 18:43:05.920373+02
302b59d8-1d78-4563-8259-c57ac3c48abf	appointment_confirmed	confirmed	Hello {patient_name}! Your appointment is confirmed.\r\n\r\nDate: {appointment_date}\r\nTime: {appointment_time}\r\nDoctor: {doctor_name}\r\n\r\nPlease arrive 10 minutes early. Thank you!	{"doctor_name": "string", "patient_name": "string", "appointment_date": "string", "appointment_time": "string"}	t	2025-12-04 18:43:05.920373+02	2025-12-04 18:43:05.920373+02
868c3766-4712-4d45-8921-099d5dd251dd	appointment_rescheduled	rescheduled	Hello {patient_name}! Your appointment has been rescheduled.\r\n\r\nPrevious: {old_date} at {old_time}\r\nNew: {new_date} at {new_time}\r\nDoctor: {doctor_name}\r\n\r\nSee you at the new time!	{"new_date": "string", "new_time": "string", "old_date": "string", "old_time": "string", "doctor_name": "string", "patient_name": "string"}	t	2025-12-04 18:43:05.920373+02	2025-12-04 18:43:05.920373+02
1b5c48b7-a783-44bd-8ec0-2354fe2c489f	appointment_reminder	reminder	Reminder: You have an appointment tomorrow.\r\n\r\nDate: {appointment_date}\r\nTime: {appointment_time}\r\nDoctor: {doctor_name}\r\nLocation: {clinic_name}\r\n\r\nPlease confirm or call {clinic_phone} if you need to reschedule.	{"clinic_name": "string", "doctor_name": "string", "clinic_phone": "string", "patient_name": "string", "appointment_date": "string", "appointment_time": "string"}	t	2025-12-04 18:43:05.920373+02	2025-12-04 18:43:05.920373+02
1a3033c1-5ac9-482a-941b-9b005887e1b5	emergency_cancellation	cancelled	Hello {patient_name}! Due to an emergency, your appointment has been cancelled.\r\n\r\nDate: {appointment_date}\r\nTime: {appointment_time}\r\nDoctor: {doctor_name}\r\n\r\nWe apologize for the inconvenience. We will contact you shortly to reschedule.	{"doctor_name": "string", "patient_name": "string", "appointment_date": "string", "appointment_time": "string"}	t	2025-12-04 18:43:05.920373+02	2025-12-04 18:43:05.920373+02
5587da00-0009-44f1-a91b-cb927aaf01a8	appointment_cancelled	cancelled	Hello {patient_name}. Your appointment has been cancelled.\r\n\r\nDate: {appointment_date}\r\nTime: {appointment_time}\r\nDoctor: {doctor_name}\r\nReason: {cancellation_reason}\r\n\r\nTo reschedule, please contact us at {clinic_phone}.	{"doctor_name": "string", "clinic_phone": "string", "patient_name": "string", "appointment_date": "string", "appointment_time": "string", "cancellation_reason": "string"}	t	2025-12-04 18:43:05.920373+02	2025-12-07 03:45:46.484003+02
\.


--
-- Name: color_code_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.color_code_id_seq', 9, true);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: calendar_exceptions calendar_exceptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendar_exceptions
    ADD CONSTRAINT calendar_exceptions_pkey PRIMARY KEY (id);


--
-- Name: color_code color_code_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.color_code
    ADD CONSTRAINT color_code_pkey PRIMARY KEY (id);


--
-- Name: consent_forms consent_forms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consent_forms
    ADD CONSTRAINT consent_forms_pkey PRIMARY KEY (id);


--
-- Name: doctor_calendars doctor_calendars_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_calendars
    ADD CONSTRAINT doctor_calendars_pkey PRIMARY KEY (id);


--
-- Name: doctor_time_slots doctor_time_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_time_slots
    ADD CONSTRAINT doctor_time_slots_pkey PRIMARY KEY (id);


--
-- Name: doctor_working_hours doctor_working_hours_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_working_hours
    ADD CONSTRAINT doctor_working_hours_pkey PRIMARY KEY (id);


--
-- Name: gyne_records gyne_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gyne_records
    ADD CONSTRAINT gyne_records_pkey PRIMARY KEY (id);


--
-- Name: imaging imaging_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imaging
    ADD CONSTRAINT imaging_pkey PRIMARY KEY (id);


--
-- Name: inventory_items inventory_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: lab_orders lab_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lab_orders
    ADD CONSTRAINT lab_orders_pkey PRIMARY KEY (id);


--
-- Name: lab_results lab_results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lab_results
    ADD CONSTRAINT lab_results_pkey PRIMARY KEY (id);


--
-- Name: medications medications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medications
    ADD CONSTRAINT medications_pkey PRIMARY KEY (id);


--
-- Name: ob_records ob_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ob_records
    ADD CONSTRAINT ob_records_pkey PRIMARY KEY (id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: pregnancies pregnancies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pregnancies
    ADD CONSTRAINT pregnancies_pkey PRIMARY KEY (id);


--
-- Name: prescription_items prescription_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescription_items
    ADD CONSTRAINT prescription_items_pkey PRIMARY KEY (id);


--
-- Name: prescriptions prescriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_pkey PRIMARY KEY (id);


--
-- Name: doctors providers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT providers_pkey PRIMARY KEY (id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: visits visits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_pkey PRIMARY KEY (id);


--
-- Name: whatsapp_messages whatsapp_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.whatsapp_messages
    ADD CONSTRAINT whatsapp_messages_pkey PRIMARY KEY (id);


--
-- Name: whatsapp_templates whatsapp_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.whatsapp_templates
    ADD CONSTRAINT whatsapp_templates_pkey PRIMARY KEY (id);


--
-- Name: whatsapp_templates whatsapp_templates_template_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.whatsapp_templates
    ADD CONSTRAINT whatsapp_templates_template_name_key UNIQUE (template_name);


--
-- Name: idx_appointment_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointment_date ON public.appointments USING btree (start_at);


--
-- Name: idx_appointment_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointment_patient ON public.appointments USING btree (patient_id);


--
-- Name: idx_appointment_provider; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointment_provider ON public.appointments USING btree (doctor_id);


--
-- Name: idx_appointments_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointments_created_by ON public.appointments USING btree (created_by);


--
-- Name: idx_doctor_calendars_doctor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_doctor_calendars_doctor ON public.doctor_calendars USING btree (doctor_id);


--
-- Name: idx_exceptions_calendar; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_exceptions_calendar ON public.calendar_exceptions USING btree (calendar_id);


--
-- Name: idx_exceptions_datetime; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_exceptions_datetime ON public.calendar_exceptions USING btree (start_datetime, end_datetime);


--
-- Name: idx_invoice_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoice_patient ON public.invoices USING btree (patient_id);


--
-- Name: idx_lab_order_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lab_order_patient ON public.lab_orders USING btree (patient_id);


--
-- Name: idx_patient_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_patient_email ON public.patients USING btree (email);


--
-- Name: idx_patient_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_patient_phone ON public.patients USING btree (phone);


--
-- Name: idx_patients_is_pregnant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_patients_is_pregnant ON public.patients USING btree (is_pregnant);


--
-- Name: idx_pregnancies_patient_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pregnancies_patient_id ON public.pregnancies USING btree (patient_id);


--
-- Name: idx_pregnancies_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pregnancies_status ON public.pregnancies USING btree (status);


--
-- Name: idx_pregnancy_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pregnancy_patient ON public.pregnancies USING btree (patient_id);


--
-- Name: idx_time_slots_calendar; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_time_slots_calendar ON public.doctor_time_slots USING btree (calendar_id);


--
-- Name: idx_visit_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_visit_date ON public.visits USING btree (visit_date);


--
-- Name: idx_visit_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_visit_patient ON public.visits USING btree (patient_id);


--
-- Name: idx_visits_pregnancy_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_visits_pregnancy_id ON public.visits USING btree (pregnancy_id);


--
-- Name: idx_whatsapp_appointment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_whatsapp_appointment ON public.whatsapp_messages USING btree (appointment_id);


--
-- Name: idx_whatsapp_messages_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_whatsapp_messages_created_at ON public.whatsapp_messages USING btree (created_at);


--
-- Name: idx_whatsapp_messages_patient_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_whatsapp_messages_patient_id ON public.whatsapp_messages USING btree (patient_id);


--
-- Name: idx_whatsapp_messages_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_whatsapp_messages_status ON public.whatsapp_messages USING btree (status);


--
-- Name: idx_whatsapp_messages_template_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_whatsapp_messages_template_id ON public.whatsapp_messages USING btree (template_id);


--
-- Name: idx_whatsapp_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_whatsapp_patient ON public.whatsapp_messages USING btree (patient_id);


--
-- Name: idx_whatsapp_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_whatsapp_status ON public.whatsapp_messages USING btree (status);


--
-- Name: idx_whatsapp_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_whatsapp_type ON public.whatsapp_messages USING btree (message_type);


--
-- Name: idx_working_hours_calendar; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_working_hours_calendar ON public.doctor_working_hours USING btree (calendar_id);


--
-- Name: idx_working_hours_day; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_working_hours_day ON public.doctor_working_hours USING btree (day_of_week);


--
-- Name: appointments appointments_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: appointments appointments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: appointments appointments_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_provider_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id);


--
-- Name: calendar_exceptions calendar_exceptions_calendar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendar_exceptions
    ADD CONSTRAINT calendar_exceptions_calendar_id_fkey FOREIGN KEY (calendar_id) REFERENCES public.doctor_calendars(id) ON DELETE CASCADE;


--
-- Name: calendar_exceptions calendar_exceptions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendar_exceptions
    ADD CONSTRAINT calendar_exceptions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: consent_forms consent_forms_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consent_forms
    ADD CONSTRAINT consent_forms_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: consent_forms consent_forms_visit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consent_forms
    ADD CONSTRAINT consent_forms_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id);


--
-- Name: doctor_calendars doctor_calendars_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_calendars
    ADD CONSTRAINT doctor_calendars_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE CASCADE;


--
-- Name: doctor_time_slots doctor_time_slots_calendar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_time_slots
    ADD CONSTRAINT doctor_time_slots_calendar_id_fkey FOREIGN KEY (calendar_id) REFERENCES public.doctor_calendars(id) ON DELETE CASCADE;


--
-- Name: doctor_working_hours doctor_working_hours_calendar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_working_hours
    ADD CONSTRAINT doctor_working_hours_calendar_id_fkey FOREIGN KEY (calendar_id) REFERENCES public.doctor_calendars(id) ON DELETE CASCADE;


--
-- Name: gyne_records gyne_records_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gyne_records
    ADD CONSTRAINT gyne_records_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: imaging imaging_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imaging
    ADD CONSTRAINT imaging_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: imaging imaging_visit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imaging
    ADD CONSTRAINT imaging_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id);


--
-- Name: invoices invoices_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: invoices invoices_visit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id);


--
-- Name: lab_orders lab_orders_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lab_orders
    ADD CONSTRAINT lab_orders_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: lab_orders lab_orders_visit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lab_orders
    ADD CONSTRAINT lab_orders_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id);


--
-- Name: lab_results lab_results_lab_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lab_results
    ADD CONSTRAINT lab_results_lab_order_id_fkey FOREIGN KEY (lab_order_id) REFERENCES public.lab_orders(id) ON DELETE CASCADE;


--
-- Name: ob_records ob_records_pregnancy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ob_records
    ADD CONSTRAINT ob_records_pregnancy_id_fkey FOREIGN KEY (pregnancy_id) REFERENCES public.pregnancies(id) ON DELETE CASCADE;


--
-- Name: ob_records ob_records_visit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ob_records
    ADD CONSTRAINT ob_records_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id) ON DELETE SET NULL;


--
-- Name: patients patients_color_code_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_color_code_id_fkey FOREIGN KEY (color_code_id) REFERENCES public.color_code(id);


--
-- Name: payments payments_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: pregnancies pregnancies_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pregnancies
    ADD CONSTRAINT pregnancies_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: prescription_items prescription_items_medication_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescription_items
    ADD CONSTRAINT prescription_items_medication_id_fkey FOREIGN KEY (medication_id) REFERENCES public.medications(id);


--
-- Name: prescription_items prescription_items_prescription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescription_items
    ADD CONSTRAINT prescription_items_prescription_id_fkey FOREIGN KEY (prescription_id) REFERENCES public.prescriptions(id) ON DELETE CASCADE;


--
-- Name: prescriptions prescriptions_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: prescriptions prescriptions_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_provider_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id);


--
-- Name: prescriptions prescriptions_visit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id);


--
-- Name: doctors providers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT providers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: visits visits_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id);


--
-- Name: visits visits_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: visits visits_pregnancy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_pregnancy_id_fkey FOREIGN KEY (pregnancy_id) REFERENCES public.pregnancies(id) ON DELETE CASCADE;


--
-- Name: visits visits_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_provider_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id);


--
-- Name: whatsapp_messages whatsapp_messages_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.whatsapp_messages
    ADD CONSTRAINT whatsapp_messages_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE CASCADE;


--
-- Name: whatsapp_messages whatsapp_messages_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.whatsapp_messages
    ADD CONSTRAINT whatsapp_messages_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: whatsapp_messages whatsapp_messages_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.whatsapp_messages
    ADD CONSTRAINT whatsapp_messages_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.whatsapp_templates(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

