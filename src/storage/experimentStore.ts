import { ExperimentRecord } from '../types/terrarium';

const STORAGE_KEY = 'terrarium_experiment_records_v1';

export function getStoredExperiments(): ExperimentRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to parse stored experiments:', err);
    return [];
  }
}

export function saveStoredExperiment(record: ExperimentRecord): void {
  try {
    const existing = getStoredExperiments();
    const filtered = existing.filter((e) => e.id !== record.id);
    const updated = [record, ...filtered];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save experiment to storage:', err);
  }
}

export function deleteStoredExperiment(id: string): void {
  try {
    const existing = getStoredExperiments();
    const updated = existing.filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to delete experiment:', err);
  }
}

export function clearAllStoredExperiments(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear experiments:', err);
  }
}
