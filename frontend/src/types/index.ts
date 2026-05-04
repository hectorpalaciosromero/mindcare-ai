// Shared type definitions — frontend/backend data contracts.

// Auth

export interface User {
  id: string;
  email: string;
  role: "patient" | "psychologist" | "admin";
  first_name: string;
  last_name: string;
  age: number | null;
  phone: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  role: "patient" | "psychologist";
  first_name: string;
  last_name: string;
  age?: number;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// Check-in

export type Emotion = "happy" | "calm" | "sad" | "anxious" | "stressed" | "angry";

export interface CheckinPayload {
  emotion: Emotion;
  intensity: number;
  note?: string;
}

export interface Checkin {
  id: string;
  emotion: Emotion;
  intensity: number;
  note: string | null;
  ai_analysis: AIAnalysis | null;
  created_at: string;
}

export interface AIAnalysis {
  analysis_text: string;
  risk_level: "low" | "medium" | "high";
  detected_patterns: string[];
  tags: string[];
  recommendation: string;
}

// Patient

export interface PatientDashboard {
  first_name?: string;
  current_streak: number;
  general_state: string;
  exercises_completed: number;
  next_session: string | null;
  avg_emotional_state: number;
}

// Psychologist

export interface PsychologistDashboard {
  active_patients: number;
  pending_alerts: number;
  sessions_this_week: number;
  avg_improvement: number;
}

export interface PatientSummary {
  id: string;
  user_id: string;
  name: string;
  age: number | null;
  status: "stable" | "improving" | "needs_attention" | "critical";
  avg_emotional_state: number;
  total_checkins: number;
  last_checkin_at: string | null;
}

export interface PatientDetail {
  id: string;
  name: string;
  age: number | null;
  email: string;
  phone: string | null;
  status: string;
  enrollment_date: string;
  avg_emotional_state: number;
  total_checkins: number;
  total_sessions: number;
  exercises_completed: number;
  error?: string;
}

export interface WeeklyEvolution {
  day: string;
  score: number;
}

export interface AIAlert {
  id: string;
  patient_name: string;
  priority: "low" | "medium" | "high";
  description: string;
  tags: string[] | null;
  acknowledged: boolean;
  created_at: string;
}

export interface WeeklyReport {
  id: string;
  patient_name: string;
  week_start: string;
  week_end: string;
  avg_state: number;
  checkins_count: number;
  exercises_count: number;
  main_emotions: string[] | null;
  ai_summary: string | null;
  session_recommendations: string[] | null;
  generated_at: string;
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  type: "breathing" | "mindfulness" | "journaling" | "relaxation";
  duration_minutes: number;
  completed: boolean;
}

export interface Session {
  id: string;
  patient_id: string;
  patient_name: string;
  psychologist_name?: string;
  scheduled_at: string;
  status: "scheduled" | "completed" | "cancelled";
  notes?: string;
  meeting_url?: string;
}

export interface AdminMetrics {
  total_patients: number;
  total_psychologists: number;
  total_checkins: number;
  active_ai_models: number;
  avg_intensity: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active?: boolean;
  created_at: string;
}

export interface AdminDashboardData {
  metrics: AdminMetrics;
  recent_users: AdminUser[];
}
