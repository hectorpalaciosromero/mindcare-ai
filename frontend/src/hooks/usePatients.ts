// Patient data hooks for the psychologist dashboard.

import { useState, useEffect, useCallback } from "react";
import type { PatientSummary, PatientDetail, WeeklyEvolution, Checkin } from "@/types";

interface UsePatientsReturn {
  patients: PatientSummary[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filteredPatients: PatientSummary[];
  refetch: () => Promise<void>;
}

export function usePatients(): UsePatientsReturn {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/proxy/psychologists/patients");
      if (!res.ok) throw new Error("Failed to load patients");
      const data = await res.json();
      setPatients(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading patients");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/proxy/psychologists/patients");
        if (!res.ok) throw new Error("Failed to load patients");
        const data = await res.json();
        if (!cancelled) {
          setPatients(data);
          setError(null);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error loading patients");
          setIsLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return {
    patients, isLoading, error, searchQuery, setSearchQuery,
    filteredPatients, refetch: fetchPatients,
  };
}

interface UsePatientDetailReturn {
  patient: PatientDetail | null;
  checkins: Checkin[];
  evolution: WeeklyEvolution[];
  isLoading: boolean;
}

export function usePatientDetail(patientId: string): UsePatientDetailReturn {
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [evolution, setEvolution] = useState<WeeklyEvolution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [pRes, cRes, eRes] = await Promise.all([
          fetch(`/api/proxy/psychologists/patients/${patientId}`),
          fetch(`/api/proxy/psychologists/patients/${patientId}/checkins`),
          fetch(`/api/proxy/psychologists/patients/${patientId}/evolution`),
        ]);
        if (pRes.ok) setPatient(await pRes.json());
        if (cRes.ok) setCheckins(await cRes.json());
        if (eRes.ok) setEvolution(await eRes.json());
      } catch {
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [patientId]);

  return { patient, checkins, evolution, isLoading };
}
