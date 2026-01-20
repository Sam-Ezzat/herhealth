import api from './api';

export type PaymentMethod = 'Cash' | 'Instapay' | 'No Payment' | 'ReConsultation';

export interface VisitPayment {
  id: string;
  visit_id: string;
  patient_id: string;
  amount: number;
  method: PaymentMethod;
  notes?: string;
  payment_date: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  patient_name?: string;
  visit_date?: string;
  created_by_name?: string;
}

export interface CreateVisitPaymentData {
  visit_id: string;
  patient_id: string;
  amount: number;
  method: PaymentMethod;
  notes?: string;
  payment_date?: string;
}

export interface UpdateVisitPaymentData {
  amount?: number;
  method?: PaymentMethod;
  notes?: string;
  payment_date?: string;
}

export interface UnpaidVisit {
  id: string;
  visit_date: string;
  reason: string;
  diagnosis?: string;
  doctor_name: string;
}

export interface PaymentStats {
  total_payments: number;
  cash_count: number;
  instapay_count: number;
  no_payment_count: number;
  reconsultation_count: number;
  total_amount: number;
  average_amount: number;
}

const visitPaymentService = {
  // Get payment by visit ID
  getByVisitId: async (visitId: string): Promise<VisitPayment | null> => {
    const response = await api.get<{ success: boolean; data: VisitPayment | null }>(
      `/visits/${visitId}/payment`
    );
    return (response as any).data || response;
  },

  // Get payment by ID
  getById: async (paymentId: string): Promise<VisitPayment> => {
    const response = await api.get<{ success: boolean; data: VisitPayment }>(
      `/payments/${paymentId}`
    );
    return (response as any).data || response;
  },

  // Get all payments for a patient
  getPatientPayments: async (patientId: string): Promise<VisitPayment[]> => {
    const response = await api.get<{ success: boolean; data: VisitPayment[] }>(
      `/patients/${patientId}/payments`
    );
    return (response as any).data || response;
  },

  // Get unpaid visits for a patient
  getUnpaidVisits: async (patientId: string): Promise<UnpaidVisit[]> => {
    const response = await api.get<{ success: boolean; data: UnpaidVisit[] }>(
      `/patients/${patientId}/visits/unpaid`
    );
    return (response as any).data || response;
  },

  // Create payment
  create: async (data: CreateVisitPaymentData): Promise<VisitPayment> => {
    const response = await api.post<{ success: boolean; data: VisitPayment }>(
      '/payments',
      data
    );
    return (response as any).data || response;
  },

  // Update payment
  update: async (paymentId: string, data: UpdateVisitPaymentData): Promise<VisitPayment> => {
    const response = await api.put<{ success: boolean; data: VisitPayment }>(
      `/payments/${paymentId}`,
      data
    );
    return (response as any).data || response;
  },

  // Delete payment
  delete: async (paymentId: string): Promise<void> => {
    await api.delete(`/payments/${paymentId}`);
  },

  // Get patient payment statistics
  getPatientStats: async (patientId: string): Promise<PaymentStats> => {
    const response = await api.get<{ success: boolean; data: PaymentStats }>(
      `/patients/${patientId}/payments/stats`
    );
    return (response as any).data || response;
  },

  // Get today's payment statistics
  getTodayStats: async () => {
    const response = await api.get('/payments/stats/today');
    return (response as any).data || response;
  },
};

export default visitPaymentService;
