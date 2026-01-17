'use client';

import { useState, useCallback } from 'react';
import { SyllabusEvent, CalendarStressAnalysis, ClarificationQuestion, ExtractionResponse } from '@/types/syllabus';
import { syncToCalendar, analyzeCalendarStress } from '@/app/actions/calendar';

export function useSyllabusManager() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [events, setEvents] = useState<SyllabusEvent[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [stressAnalysis, setStressAnalysis] = useState<CalendarStressAnalysis | null>(null);
  const [isAnalyzingStress, setIsAnalyzingStress] = useState(false);
  const [clarificationQuestions, setClarificationQuestions] = useState<ClarificationQuestion[]>([]);
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string>>({});
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingText, setPendingText] = useState<string | null>(null);

  const processSyllabus = useCallback(async (fileOrText: File | string, clarifications?: Record<string, string>) => {
    setIsExtracting(true);
    try {
      const formData = new FormData();
      
      if (typeof fileOrText === 'string') {
        formData.append('text', fileOrText);
      } else {
        formData.append('file', fileOrText);
      }
      
      if (clarifications && Object.keys(clarifications).length > 0) {
        formData.append('clarifications', JSON.stringify(clarifications));
      }

      const response = await fetch('/api/process-syllabus', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process syllabus');
      }

      const data: ExtractionResponse = await response.json();
      setEvents(data.events || []);
      
      if (data.needsClarification && data.questions) {
        setClarificationQuestions(data.questions);
        if (typeof fileOrText === 'string') {
          setPendingText(fileOrText);
          setPendingFile(null);
        } else {
          setPendingFile(fileOrText);
          setPendingText(null);
        }
      } else {
        setClarificationQuestions([]);
        setPendingFile(null);
        setPendingText(null);
      }
      
      return data;
    } catch (error) {
      console.error('Error processing syllabus:', error);
      throw error;
    } finally {
      setIsExtracting(false);
    }
  }, []);

  const syncEvents = useCallback(async (eventsToSync: SyllabusEvent[] = events) => {
    setIsSyncing(true);
    try {
      const result = await syncToCalendar(eventsToSync);
      return result;
    } catch (error) {
      console.error('Error syncing to calendar:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [events]);

  const clearEvents = useCallback(() => {
    setEvents([]);
    setClarificationQuestions([]);
    setClarificationAnswers({});
    setPendingFile(null);
    setPendingText(null);
  }, []);

  const submitClarifications = useCallback(async () => {
    if (pendingFile) {
      await processSyllabus(pendingFile, clarificationAnswers);
    } else if (pendingText) {
      await processSyllabus(pendingText, clarificationAnswers);
    }
  }, [pendingFile, pendingText, clarificationAnswers, processSyllabus]);

  const checkStress = useCallback(async (totalDays: number = 28) => {
    setIsAnalyzingStress(true);
    try {
      const analysis = await analyzeCalendarStress(totalDays);
      setStressAnalysis(analysis);
      return analysis;
    } catch (error) {
      console.error('Error analyzing stress:', error);
      throw error;
    } finally {
      setIsAnalyzingStress(false);
    }
  }, []);

  return {
    isExtracting,
    events,
    isSyncing,
    stressAnalysis,
    isAnalyzingStress,
    clarificationQuestions,
    clarificationAnswers,
    setClarificationAnswers,
    submitClarifications,
    processSyllabus,
    syncEvents,
    clearEvents,
    checkStress,
  };
}
