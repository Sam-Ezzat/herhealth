import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import { Login, Register, Dashboard, PatientList, PatientForm, PatientDetail, PregnancyJourney } from './pages';
import { DoctorList, DoctorForm, DoctorDetail } from './pages/doctors';
import { AppointmentList, AppointmentForm, AppointmentDetail } from './pages/appointments';
import AppointmentCalendar from './pages/appointments/AppointmentCalendar';
import { VisitList, VisitForm, VisitDetail, PatientVisitHistory } from './pages/visits';
import { DoctorCalendars, WhatsAppTemplates, WhatsAppSettings, WhatsAppMessages, RoleManagement, UserManagement } from './pages/settings';
import ColorCodes from './pages/settings/ColorCodes';
import Profile from './pages/Profile';
import PregnancyJourneyList from './pages/pregnancy/PregnancyJourneyList';
import PregnancyJourneyDetail from './pages/pregnancy/PregnancyJourneyDetail';
import PregnancyForm from './pages/pregnancy/PregnancyForm';

function App() {
  const { isAuthenticated, loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <>
      <ToastContainer 
        position="top-right" 
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Routes>
        <Route 
          path="/login" 
          element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/register" 
          element={!isAuthenticated ? <Register /> : <Navigate to="/" replace />} 
        />
        
        {/* Protected routes with Layout */}
        <Route
          path="/"
          element={isAuthenticated ? <Layout /> : <Navigate to="/login" replace />}
        >
          <Route index element={<Dashboard />} />
          <Route path="patients" element={<PatientList />} />
          <Route path="patients/new" element={<PatientForm />} />
          <Route path="patients/:id" element={<PatientDetail />} />
          <Route path="patients/:id/edit" element={<PatientForm />} />
          <Route path="patients/:patientId/pregnancies" element={<PregnancyJourneyList />} />
          <Route path="patients/:patientId/pregnancy/new" element={<PregnancyForm />} />
          <Route path="patients/:patientId/pregnancy/:pregnancyId" element={<PregnancyJourneyDetail />} />
          <Route path="patients/:patientId/pregnancy/:pregnancyId/edit" element={<PregnancyForm />} />
          <Route path="visits/patient/:patientId/pregnancy-journey" element={<PregnancyJourney />} />
          
          <Route path="doctors" element={<DoctorList />} />
          <Route path="doctors/new" element={<DoctorForm />} />
          <Route path="doctors/:id" element={<DoctorDetail />} />
          <Route path="doctors/:id/edit" element={<DoctorForm />} />
          
          <Route path="appointments" element={<AppointmentList />} />
          <Route path="appointments/calendar" element={<AppointmentCalendar />} />
          <Route path="appointments/new" element={<AppointmentForm />} />
          <Route path="appointments/:id" element={<AppointmentDetail />} />
          <Route path="appointments/:id/edit" element={<AppointmentForm />} />
          
          <Route path="visits" element={<VisitList />} />
          <Route path="visits/new" element={<VisitForm />} />
          <Route path="visits/patient/:patientId/history" element={<PatientVisitHistory />} />
          <Route path="visits/:id" element={<VisitDetail />} />
          <Route path="visits/:id/edit" element={<VisitForm />} />
          
          <Route path="profile" element={<Profile />} />
          
          <Route path="settings/calendars" element={<DoctorCalendars />} />
          <Route path="settings/users" element={<UserManagement />} />
          <Route path="settings/roles" element={<RoleManagement />} />
          <Route path="settings/whatsapp" element={<WhatsAppSettings />} />
          <Route path="settings/whatsapp/templates" element={<WhatsAppTemplates />} />
          <Route path="settings/whatsapp/messages" element={<WhatsAppMessages />} />
          <Route path="settings/color-codes" element={<ColorCodes />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
