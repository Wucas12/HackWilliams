'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Upload, CheckCircle, Clock, Sparkles, Trash2, Edit2, Settings, X, Check, AlertTriangle, ChevronLeft, Repeat } from 'lucide-react';
import { useSyllabusManager } from '@/hooks/useSyllabusManager';
import { SyllabusEvent, EventType } from '@/types/syllabus';
import Link from 'next/link';

export default function Dashboard() {
  const {
    isExtracting,
    events,
    isSyncing,
    stressAnalysis,
    clarificationQuestions,
    clarificationAnswers,
    setClarificationAnswers,
    submitClarifications,
    processSyllabus,
    syncEvents,
    clearEvents,
    checkStress,
  } = useSyllabusManager();

  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState<string>('');
  const [mode, setMode] = useState<'pdf' | 'text'>('pdf');
  const [extractMultiple, setExtractMultiple] = useState<boolean>(false);
  const [step, setStep] = useState<'upload' | 'processing' | 'clarification' | 'review' | 'complete'>('upload');
  const [previousStep, setPreviousStep] = useState<'upload' | 'processing' | 'clarification' | 'review' | 'complete' | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [localEvents, setLocalEvents] = useState<SyllabusEvent[]>([]);
  const [academicYear, setAcademicYear] = useState('2026');
  const [semester, setSemester] = useState('Spring');
  const [showSettings, setShowSettings] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Sync local events with hook events for editing/deletion
  useEffect(() => {
    setLocalEvents(events);
  }, [events]);

  const processingSteps = [
    "Parsing PDF text...",
    "Identifying key dates...",
    "Extracting event details...",
    "Formatting for Google Calendar..."
  ];

  const eventTypeColors = {
    exam: {
      border: 'border-red-400',
      bg: 'bg-red-50',
      text: 'text-red-700',
      iconBg: 'bg-red-100',
      label: 'Exam',
      gradient: 'from-red-50 to-pink-50'
    },
    assignment: {
      border: 'border-blue-400',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      iconBg: 'bg-blue-100',
      label: 'Assignment',
      gradient: 'from-blue-50 to-sky-50'
    },
    project: {
      border: 'border-orange-400',
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      iconBg: 'bg-orange-100',
      label: 'Project',
      gradient: 'from-orange-50 to-amber-50'
    },
    office_hours: {
      border: 'border-green-400',
      bg: 'bg-green-50',
      text: 'text-green-700',
      iconBg: 'bg-green-100',
      label: 'Office Hours',
      gradient: 'from-green-50 to-emerald-50'
    },
    reading: {
      border: 'border-indigo-400',
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      iconBg: 'bg-indigo-100',
      label: 'Reading',
      gradient: 'from-indigo-50 to-purple-50'
    },
    class: {
      border: 'border-gray-400',
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      iconBg: 'bg-gray-100',
      label: 'Class',
      gradient: 'from-gray-50 to-slate-50'
    },
    default: {
      border: 'border-gray-400',
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      iconBg: 'bg-gray-100',
      label: 'Event',
      gradient: 'from-gray-50 to-slate-50'
    }
  };

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
  }, []);

  // Sync step with events and clarification state
  useEffect(() => {
    if (!isExtracting && step === 'processing') {
      // Processing is complete, check what to do next
      if (clarificationQuestions.length > 0) {
        setPreviousStep('processing');
        setStep('clarification');
      } else if (localEvents.length > 0) {
        setPreviousStep('processing');
        setStep('review');
        setSelectedEvents(new Set(localEvents.map(e => e.id)));
      } else {
        // No events extracted, go back to upload
        setPreviousStep(null);
        setStep('upload');
      }
    } else if (!isExtracting && step === 'clarification' && clarificationQuestions.length === 0 && localEvents.length > 0) {
      // After clarification is submitted and processed, move to review
      setPreviousStep('clarification');
      setStep('review');
      setSelectedEvents(new Set(localEvents.map(e => e.id)));
    }
  }, [isExtracting, clarificationQuestions.length, localEvents, step]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile && uploadedFile.type === 'application/pdf') {
      setFile(uploadedFile);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setError(null);
    } else if (droppedFile) {
      setError('Please upload a PDF file');
    }
  };

  const goBack = () => {
    if (step === 'clarification') {
      // Go back to upload (cancel clarification)
      resetApp();
    } else if (step === 'review') {
      // Go back to upload (start over) - user can re-upload or edit text
      resetApp();
    } else if (step === 'complete') {
      // Go back to upload to start a new extraction
      resetApp();
    }
  };

  const processFile = async () => {
    setPreviousStep('upload');
    setStep('processing');
    setProcessingStep(0);
    setError(null);
    
    const interval = setInterval(() => {
      setProcessingStep(prev => {
        if (prev < processingSteps.length - 1) return prev + 1;
        return prev;
      });
    }, 600);

    try {
      if (mode === 'pdf' && file) {
        await processSyllabus(file);
      } else if (mode === 'text' && textInput.trim()) {
        const textToProcess = extractMultiple ? textInput : `Extract only ONE event from: ${textInput}`;
        await processSyllabus(textToProcess);
      } else {
        throw new Error('Please provide a file or text input');
      }
      clearInterval(interval);
      // Step transitions will be handled by useEffect based on clarificationQuestions and events
    } catch (err) {
      clearInterval(interval);
      setError(err instanceof Error ? err.message : 'Failed to process');
      setStep('upload');
    }
  };

  const handleClarificationSubmit = async () => {
    setError(null);
    setPreviousStep('clarification');
    setStep('processing');
    setProcessingStep(0);
    try {
      await submitClarifications();
      // Step transition will be handled by useEffect when processing completes
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit clarification');
      // If error, go back to clarification step
      if (clarificationQuestions.length > 0) {
        setStep('clarification');
      } else {
        setStep('upload');
      }
    }
  };

  const addToCalendar = async () => {
    const eventsToAdd = localEvents.filter(e => selectedEvents.has(e.id));
    if (eventsToAdd.length === 0) return;

    setError(null);
    try {
      const result = await syncEvents(eventsToAdd);
      // Auto-check stress after syncing
      await checkStress(28);
      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync to calendar');
    }
  };

  const resetApp = () => {
    setFile(null);
    setTextInput('');
    clearEvents();
    setLocalEvents([]);
    setSelectedEvents(new Set());
    setEditingId(null);
    setStep('upload');
    setPreviousStep(null);
    setError(null);
  };

  const toggleEventSelection = (id: string) => {
    setSelectedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedEvents.size === localEvents.length) {
      setSelectedEvents(new Set());
    } else {
      setSelectedEvents(new Set(localEvents.map(e => e.id)));
    }
  };

  const deleteEvent = (id: string) => {
    setLocalEvents(prev => prev.filter(e => e.id !== id));
    setSelectedEvents(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const updateEvent = (id: string, field: string, value: any) => {
    setLocalEvents(prev => prev.map(e => {
      if (e.id === id) {
        if (field === 'time') {
          // Convert display time back to 24-hour format
          const time24 = convertDisplayTimeTo24(value);
          return { ...e, startTime: time24 || e.startTime };
        } else if (field === 'type') {
          return { ...e, type: value as EventType };
        } else {
          return { ...e, [field]: value };
        }
      }
      return e;
    }));
  };

  const convertDisplayTimeTo24 = (displayTime: string): string | undefined => {
    // Convert "10:00 AM" to "10:00" or "2:00 PM" to "14:00"
    const match = displayTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return undefined;
    const [, hours, minutes, period] = match;
    let hour24 = parseInt(hours);
    if (period.toUpperCase() === 'PM' && hour24 !== 12) hour24 += 12;
    if (period.toUpperCase() === 'AM' && hour24 === 12) hour24 = 0;
    return `${hour24.toString().padStart(2, '0')}:${minutes}`;
  };

  // Convert SyllabusEvent to display format
  const formatEventForDisplay = (event: SyllabusEvent) => {
    return {
      id: event.id,
      title: event.title,
      date: event.date,
      time: event.startTime ? formatTimeForDisplay(event.startTime) : 'TBD',
      type: event.type,
      location: event.location,
      description: event.description,
      courseName: event.courseName,
      isRecurring: event.isRecurring || false,
      recurrenceFrequency: event.recurrenceFrequency,
      recurrenceEndDate: event.recurrenceEndDate,
      recurrenceDaysOfWeek: event.recurrenceDaysOfWeek,
    };
  };

  const formatTimeForDisplay = (time24: string): string => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const parseLocalDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const formatRecurrenceInfo = (event: any) => {
    if (!event.isRecurring) return null;
    
    const startDate = parseLocalDate(event.date);
    const endDate = event.recurrenceEndDate ? parseLocalDate(event.recurrenceEndDate) : null;
    
    const frequencyText = event.recurrenceFrequency === 'daily' ? 'Daily' 
      : event.recurrenceFrequency === 'weekly' ? 'Weekly'
      : event.recurrenceFrequency === 'biweekly' ? 'Biweekly'
      : 'Recurring';
    
    const daysText = event.recurrenceDaysOfWeek || '';
    const endDateText = endDate ? endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
    
    // Calculate duration in weeks
    let durationText = '';
    if (endDate) {
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const weeks = Math.ceil(daysDiff / 7);
      if (weeks > 0) {
        durationText = `for ${weeks} week${weeks !== 1 ? 's' : ''}`;
      }
    }
    
    return {
      frequencyText,
      daysText,
      endDateText,
      durationText,
    };
  };

  // Use localEvents for display to allow editing/deletion
  const displayEvents = localEvents.map(formatEventForDisplay);
  const selectedCount = selectedEvents.size;

  return (
    <div className="min-h-screen bg-gradient-to-b overflow-hidden" style={{background: 'linear-gradient(to bottom, rgba(80, 0, 130, 0.1), white, rgb(219, 234, 254))'}}>
      <div className="relative max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-16">
        {/* Header with Title and Navigation */}
        <div className="flex items-center justify-between mb-6">
          <h1 
            className="text-2xl md:text-4xl lg:text-5xl font-light tracking-tight leading-none text-left"
            style={{
              fontFamily: "'Canela Text', serif",
              fontWeight: 250,
              color: 'rgb(80, 0, 130)',
              marginLeft: '6.5rem'
            }}
          >
            SATURDAY.SOLUTIONS
          </h1>
          <Link
            href="/book-meeting"
            className="px-4 py-2 text-white rounded-lg font-semibold text-sm md:text-base hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2"
            style={{background: 'linear-gradient(to right, rgb(80, 0, 130), #9333ea, #2563eb)',
                marginRight: '6.5rem'
            }}
          >
            <Calendar className="w-4 h-4" />
            Book Meeting
          </Link>
        </div>

        {/* Main Card */}
        <div 
          className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 md:p-12 shadow-2xl border border-gray-100 max-w-3xl mx-auto transition-all duration-1200 ease-out relative overflow-hidden"
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0) scale(1)' : 'translateY(60px) scale(0.9)',
            transitionDelay: '1000ms'
          }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
          
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 relative z-10">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
                <button onClick={() => setError(null)} className="ml-auto">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Stress Alert */}
          {stressAnalysis && (stressAnalysis.isHighStressWeek || stressAnalysis.highStressDays.length > 0) && step === 'complete' && (
            <div className="mb-4 space-y-2 relative z-10">
              {stressAnalysis.isHighStressWeek && (
                <div className="p-4 bg-red-50 border border-red-300 rounded-lg">
                  <h3 className="font-bold text-red-800 mb-1 text-sm">⚠️ High Stress Period</h3>
                  <p className="text-red-700 text-xs">
                    Average of {stressAnalysis.averageEventsPerDay.toFixed(1)} events/day over {stressAnalysis.totalDays} days
                  </p>
                </div>
              )}
              {stressAnalysis.highStressDays.length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                  <h3 className="font-bold text-yellow-800 mb-2 text-sm">🚨 High Stress Days</h3>
                  <ul className="space-y-1 text-xs text-yellow-700">
                    {stressAnalysis.highStressDays.map((day) => (
                      <li key={day.date}>
                        <strong>{new Date(day.date).toLocaleDateString()}:</strong> {day.eventCount} events
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          {/* Upload Step */}
          {step === 'upload' && (
            <div className="space-y-6 md:space-y-8 relative z-10">
              {/* Settings Section */}
              <div className="rounded-xl p-4" style={{backgroundColor: 'rgba(80, 0, 130, 0.05)', borderColor: 'rgba(80, 0, 130, 0.2)', borderWidth: '1px', borderStyle: 'solid'}}>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center gap-2 text-sm font-semibold w-full"
                  style={{color: 'rgb(32, 0, 52)'}}
                >
                  <Settings className="w-4 h-4" />
                  Semester Context
                  <span className="ml-auto text-xs" style={{color: 'rgb(80, 0, 130)'}}>{showSettings ? '▼' : '▶'}</span>
                </button>
                
                {showSettings && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">Academic Year</label>
                      <input
                        type="number"
                        value={academicYear}
                        onChange={(e) => setAcademicYear(e.target.value)}
                        className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                        placeholder="2026"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">Semester</label>
                      <select
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                      >
                        <option>Spring</option>
                        <option>Fall</option>
                        <option>Summer</option>
                        <option>Winter</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center gap-3 rounded-xl p-3" style={{backgroundColor: 'rgba(80, 0, 130, 0.05)', borderColor: 'rgba(80, 0, 130, 0.2)', borderWidth: '1px', borderStyle: 'solid'}}>
                <label className="text-sm font-medium text-gray-700">Add event:</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={mode === 'pdf'}
                    onChange={() => setMode('pdf')}
                    className="cursor-pointer"
                  />
                  <span className="text-sm">Upload PDF</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={mode === 'text'}
                    onChange={() => setMode('text')}
                    className="cursor-pointer"
                  />
                  <span className="text-sm">Custom Event</span>
                </label>
              </div>

              {/* PDF Upload Mode */}
              {mode === 'pdf' && (
                <div className="relative group">
                  <div className="absolute -inset-1 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-all duration-500 animate-pulse-slow" style={{background: 'linear-gradient(to right, rgb(80, 0, 130), #9333ea, #2563eb)'}}></div>
                  <div 
                    className="relative border-2 border-dashed rounded-2xl p-12 md:p-16 text-center transition-all duration-300" 
                    style={{
                      borderColor: isDragging ? 'rgba(80, 0, 130, 0.8)' : 'rgba(80, 0, 130, 0.4)',
                      backgroundColor: isDragging ? 'rgba(80, 0, 130, 0.1)' : 'white'
                    }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onMouseEnter={(e) => { if (!isDragging) { e.currentTarget.style.borderColor = 'rgba(80, 0, 130, 0.6)'; e.currentTarget.style.backgroundColor = 'rgba(80, 0, 130, 0.05)'; } }}
                    onMouseLeave={(e) => { if (!isDragging) { e.currentTarget.style.borderColor = 'rgba(80, 0, 130, 0.4)'; e.currentTarget.style.backgroundColor = 'white'; } }}
                  >
                    <Upload className="w-12 md:w-16 h-12 md:h-16 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" style={{color: 'rgb(80, 0, 130)'}} />
                    <label className="cursor-pointer">
                      <span className="text-base md:text-lg font-semibold text-gray-900 block mb-2" style={{fontFamily: "'Canela Text', serif"}}>
                        {file ? file.name : 'Drop your syllabus here'}
                      </span>
                      <span className="text-xs md:text-sm text-gray-500">PDF only • Up to 10MB</span>
                      <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              )}

              {/* Text Input Mode */}
              {mode === 'text' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700">Add event:</label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!extractMultiple}
                        onChange={() => setExtractMultiple(false)}
                        className="cursor-pointer"
                      />
                      <span className="text-sm">Single Event</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={extractMultiple}
                        onChange={() => setExtractMultiple(true)}
                        className="cursor-pointer"
                      />
                      <span className="text-sm">Multiple Events</span>
                    </label>
                  </div>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    rows={8}
                    placeholder={extractMultiple 
                      ? "e.g., 'Midterm Exam on March 15th at 2:00 PM and Final Exam on May 1st at 10:00 AM'"
                      : "e.g., 'Midterm Exam for CS 101 on March 15th at 2:00 PM in Room 205'"}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                    style={{borderColor: 'rgba(80, 0, 130, 0.4)'}}
                    onFocus={(e) => e.currentTarget.style.setProperty('--tw-ring-color', 'rgba(80, 0, 130, 0.6)')}
                  />
                </div>
              )}

              <button
                onClick={processFile}
                disabled={(!file && mode === 'pdf') || (!textInput.trim() && mode === 'text') || isExtracting}
                className="w-full py-4 md:py-5 text-white rounded-xl font-semibold text-base md:text-lg hover:shadow-2xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 relative overflow-hidden group"
                style={{background: 'linear-gradient(to right, rgb(80, 0, 130), #9333ea, #2563eb)'}}
              >
                <span className="relative z-10">{mode === 'pdf' ? 'Extract Events with AI' : 'Add to my Calendar'}</span>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{background: 'linear-gradient(to right, #2563eb, #9333ea, rgb(80, 0, 130))'}}></div>
              </button>
            </div>
          )}

          {/* Processing Step */}
          {step === 'processing' && isExtracting && (
            <div className="text-center py-16 md:py-20 relative z-10">
              <div className="relative inline-block mb-6">
                <div className="w-20 md:w-24 h-20 md:h-24 border-4 rounded-full animate-spin" style={{borderColor: 'rgba(80, 0, 130, 0.2)', borderTopColor: 'rgb(80, 0, 130)'}}></div>
                <div className="absolute inset-0 w-20 md:w-24 h-20 md:h-24 border-4 border-transparent border-b-violet-500 rounded-full animate-spin-reverse"></div>
                <Sparkles className="w-8 md:w-10 h-8 md:h-10 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{color: 'rgb(80, 0, 130)'}} />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2" style={{fontFamily: "'Canela Text', serif"}}>Processing your syllabus</h3>
              <p className="text-sm md:text-base font-medium" style={{fontFamily: "'Canela Text', serif", color: 'rgb(80, 0, 130)'}}>
                {processingStep < processingSteps.length ? processingSteps[processingStep] : processingSteps[processingSteps.length - 1]}
              </p>
            </div>
          )}

          {/* Clarification Step */}
          {step === 'clarification' && clarificationQuestions.length > 0 && (
            <div className="space-y-4 md:space-y-6 relative z-10">
              <button
                onClick={goBack}
                className="flex items-center gap-2 text-sm md:text-base text-gray-600 font-medium mb-4 transition-colors group"
                style={{color: 'inherit'}}
                onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(80, 0, 130)'}
                onMouseLeave={(e) => e.currentTarget.style.color = ''}
              >
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
                Back
              </button>
              <div className="text-center mb-6">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2" style={{fontFamily: "'Canela Text', serif"}}>Clarification Needed</h3>
                <p className="text-sm md:text-base text-gray-600" style={{fontFamily: "'Canela Text', serif"}}>
                  We need a bit more information to extract events accurately
                </p>
              </div>

              <div className="space-y-4">
                {clarificationQuestions.map((question) => (
                  <div key={question.id} className="p-4 md:p-5 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border-l-4 border-yellow-400">
                    <label className="block font-semibold text-gray-900 mb-2 text-sm md:text-base">
                      {question.question}
                    </label>
                    {question.context && question.context.trim() && (
                      <p className="text-xs md:text-sm text-gray-600 mb-3">Context: {question.context}</p>
                    )}
                    <input
                      type="text"
                      value={clarificationAnswers[question.id] || ''}
                      onChange={(e) =>
                        setClarificationAnswers({
                          ...clarificationAnswers,
                          [question.id]: e.target.value,
                        })
                      }
                      placeholder="Enter your answer..."
                      className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleClarificationSubmit}
                  disabled={isExtracting || clarificationQuestions.some(q => !clarificationAnswers[q.id])}
                  className="flex-1 py-4 text-white rounded-xl font-semibold hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300"
                  style={{background: 'linear-gradient(to right, rgb(80, 0, 130), #9333ea, #2563eb)'}}
                >
                  {isExtracting ? 'Processing...' : 'Submit Answer'}
                </button>
              </div>
            </div>
          )}

          {/* Review Step */}
          {step === 'review' && displayEvents.length > 0 && (
            <div className="space-y-4 md:space-y-6 relative z-10">
              <button
                onClick={goBack}
                className="flex items-center gap-2 text-sm md:text-base text-gray-600 hover:text-purple-600 font-medium mb-2 transition-colors group"
              >
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
                {previousStep === 'clarification' ? 'Back to Clarification' : 'Back to Upload'}
              </button>
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div>
                  <h3 className="text-2xl md:text-4xl font-bold text-gray-900" style={{fontFamily: "'Canela Text', serif"}}>{displayEvents.length} Events</h3>
                  <p className="text-xs md:text-sm text-gray-600 mt-1" style={{fontFamily: "'Canela Text', serif"}}>{selectedCount} selected</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleSelectAll}
                    className="text-xs md:text-sm font-semibold transition-colors flex items-center gap-1"
                    style={{color: 'rgb(80, 0, 130)'}}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(64, 0, 104)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(80, 0, 130)'}
                  >
                    {selectedEvents.size === displayEvents.length ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                    {selectedEvents.size === displayEvents.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <button onClick={resetApp} className="text-xs md:text-sm text-gray-500 hover:text-gray-700 font-semibold transition-colors">
                    New Upload
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-[50vh] md:max-h-96 overflow-y-auto pr-2">
                {displayEvents.map((event, idx) => {
                  const colorScheme = eventTypeColors[event.type] || eventTypeColors.default;
                  const originalEvent = localEvents.find(e => e.id === event.id);
                  return (
                  <div
                    key={event.id}
                    className={`group p-4 md:p-5 bg-gradient-to-br ${colorScheme.gradient} rounded-xl border-l-4 border-2 transition-all duration-300 opacity-0 animate-fade-in-up ${
                      selectedEvents.has(event.id) 
                        ? `${colorScheme.border} shadow-lg` 
                        : 'border-gray-200'}`}
                    onMouseEnter={(e) => !selectedEvents.has(event.id) && (e.currentTarget.style.borderColor = 'rgba(80, 0, 130, 0.4)')}
                    onMouseLeave={(e) => !selectedEvents.has(event.id) && (e.currentTarget.style.borderColor = '')}
                    style={{
                      ...(editingId === event.id ? {borderColor: 'rgba(80, 0, 130, 0.6)', boxShadow: '0 0 0 2px rgba(80, 0, 130, 0.6)'} : {}),
                      animationDelay: `${idx * 100}ms`,
                      animationFillMode: 'forwards'
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedEvents.has(event.id)}
                        onChange={() => toggleEventSelection(event.id)}
                        className="mt-1 w-4 h-4 border-gray-300 rounded"
                        style={{accentColor: 'rgb(80, 0, 130)'}}
                      />
                      
                      <div className="flex-1 min-w-0">
                        {editingId === event.id ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={event.title}
                              onChange={(e) => updateEvent(event.id, 'title', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm md:text-base"
                              style={{borderColor: 'rgba(80, 0, 130, 0.4)'}}
                              onFocus={(e) => e.currentTarget.style.setProperty('--tw-ring-color', 'rgba(80, 0, 130, 0.6)')}
                              placeholder="Event title"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="date"
                                value={event.date}
                                onChange={(e) => updateEvent(event.id, 'date', e.target.value)}
                                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-xs md:text-sm"
                                style={{borderColor: 'rgba(80, 0, 130, 0.4)'}}
                                onFocus={(e) => e.currentTarget.style.setProperty('--tw-ring-color', 'rgba(80, 0, 130, 0.6)')}
                                title="Starting date"
                              />
                              <input
                                type="text"
                                value={event.time}
                                onChange={(e) => updateEvent(event.id, 'time', e.target.value)}
                                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-xs md:text-sm"
                                style={{borderColor: 'rgba(80, 0, 130, 0.4)'}}
                                onFocus={(e) => e.currentTarget.style.setProperty('--tw-ring-color', 'rgba(80, 0, 130, 0.6)')}
                                placeholder="Time"
                              />
                            </div>
                            <select
                              value={event.type}
                              onChange={(e) => updateEvent(event.id, 'type', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-xs md:text-sm"
                              style={{borderColor: 'rgba(80, 0, 130, 0.4)'}}
                              onFocus={(e) => e.currentTarget.style.setProperty('--tw-ring-color', 'rgba(80, 0, 130, 0.6)')}
                            >
                              <option value="exam">Exam</option>
                              <option value="assignment">Assignment</option>
                              <option value="project">Project</option>
                              <option value="reading">Reading</option>
                              <option value="class">Class</option>
                              <option value="office_hours">Office Hours</option>
                            </select>
                            
                            {/* Recurring Event Options */}
                            {(() => {
                              const editingEvent = localEvents.find(e => e.id === event.id);
                              const isRecurring = editingEvent?.isRecurring || false;
                              
                              return (
                                <div className="space-y-3 pt-2 border-t" style={{borderColor: 'rgba(80, 0, 130, 0.3)'}}>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={isRecurring}
                                      onChange={(e) => {
                                        const newValue = e.target.checked;
                                        updateEvent(event.id, 'isRecurring', newValue);
                                        // If disabling recurring, clear recurrence fields
                                        if (!newValue) {
                                          updateEvent(event.id, 'recurrenceFrequency', '');
                                          updateEvent(event.id, 'recurrenceEndDate', '');
                                          updateEvent(event.id, 'recurrenceDaysOfWeek', '');
                                        }
                                      }}
                                      className="w-4 h-4 border-gray-300 rounded"
                                      style={{accentColor: 'rgb(80, 0, 130)'}}
                                    />
                                    <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                      <Repeat className="w-4 h-4" />
                                      Recurring Event
                                    </span>
                                  </label>
                                  
                                  {isRecurring && (
                                    <div className="space-y-2 pl-6 border-l-2" style={{borderColor: 'rgba(80, 0, 130, 0.3)'}}>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                          Frequency
                                        </label>
                                        <select
                                          value={editingEvent?.recurrenceFrequency || 'weekly'}
                                          onChange={(e) => updateEvent(event.id, 'recurrenceFrequency', e.target.value)}
                                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-xs md:text-sm"
                              style={{borderColor: 'rgba(80, 0, 130, 0.4)'}}
                              onFocus={(e) => e.currentTarget.style.setProperty('--tw-ring-color', 'rgba(80, 0, 130, 0.6)')}
                                        >
                                          <option value="daily">Daily</option>
                                          <option value="weekly">Weekly</option>
                                          <option value="biweekly">Biweekly</option>
                                        </select>
                                      </div>
                                      
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                          Days of Week (e.g., &quot;Monday, Wednesday, Friday&quot; or &quot;MWF&quot;)
                                        </label>
                                        <input
                                          type="text"
                                          value={editingEvent?.recurrenceDaysOfWeek || ''}
                                          onChange={(e) => updateEvent(event.id, 'recurrenceDaysOfWeek', e.target.value)}
                                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-xs md:text-sm"
                              style={{borderColor: 'rgba(80, 0, 130, 0.4)'}}
                              onFocus={(e) => e.currentTarget.style.setProperty('--tw-ring-color', 'rgba(80, 0, 130, 0.6)')}
                                          placeholder="Monday, Wednesday, Friday"
                                        />
                                      </div>
                                      
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                          Ending Date
                                        </label>
                                        <input
                                          type="date"
                                          value={editingEvent?.recurrenceEndDate || ''}
                                          onChange={(e) => updateEvent(event.id, 'recurrenceEndDate', e.target.value)}
                                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-xs md:text-sm"
                              style={{borderColor: 'rgba(80, 0, 130, 0.4)'}}
                              onFocus={(e) => e.currentTarget.style.setProperty('--tw-ring-color', 'rgba(80, 0, 130, 0.6)')}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-gray-900 text-base md:text-lg break-words" style={{fontFamily: "'Canela Text', serif"}}>
                                {event.courseName ? `${event.courseName}: ${event.title}` : event.title}
                              </h4>
                              <span className={`px-2 py-0.5 ${colorScheme.iconBg} ${colorScheme.text} text-xs font-semibold rounded-full`}>
                                {colorScheme.label}
                              </span>
                              {event.isRecurring && (
                                <span className={`px-2 py-0.5 ${colorScheme.iconBg} ${colorScheme.text} text-xs font-semibold rounded-full flex items-center gap-1`}>
                                  <Repeat className="w-3 h-3" />
                                  Recurring
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-600">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                                <span>
                                  {event.isRecurring 
                                    ? `Starts ${parseLocalDate(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
                                    : parseLocalDate(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
                                  }
                                </span>
                              </div>
                              {event.time !== 'TBD' && (
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3 h-3 md:w-4 md:h-4" />
                                  <span>{event.time}</span>
                                </div>
                              )}
                              {event.location && (
                                <div className="flex items-center gap-1.5">
                                  <span>📍</span>
                                  <span>{event.location}</span>
                                </div>
                              )}
                            </div>
                            {event.isRecurring && (() => {
                              const recurrenceInfo = formatRecurrenceInfo(event);
                              if (!recurrenceInfo) return null;
                              // Get lighter border color by using the border class with lower opacity or using iconBg
                              const borderColorClass = colorScheme.iconBg.replace('bg-', 'border-');
                              return (
                                <div className={`mt-2 p-2 ${colorScheme.bg} border ${borderColorClass} rounded-lg`}>
                                  <div className={`flex items-center gap-2 text-xs md:text-sm ${colorScheme.text}`}>
                                    <Repeat className="w-3 h-3 md:w-4 md:h-4" />
                                    <span className="font-semibold">{recurrenceInfo.frequencyText}</span>
                                    {recurrenceInfo.daysText && (
                                      <span className="opacity-90">on {recurrenceInfo.daysText}</span>
                                    )}
                                    {recurrenceInfo.durationText && (
                                      <span className="opacity-75">• {recurrenceInfo.durationText}</span>
                                    )}
                                    {recurrenceInfo.endDateText && (
                                      <span className="opacity-75">• Until {recurrenceInfo.endDateText}</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                            {originalEvent?.description && (
                              <p className="mt-2 text-xs md:text-sm text-gray-700">{originalEvent.description}</p>
                            )}
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingId(editingId === event.id ? null : event.id)}
                          className="p-2 rounded-lg transition-colors"
                          style={{color: 'rgb(80, 0, 130)'}}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(80, 0, 130, 0.2)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                          title={editingId === event.id ? "Done editing" : "Edit event"}
                        >
                          {editingId === event.id ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => deleteEvent(event.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )})}
              </div>

              {/* Sticky button on mobile */}
              <div className="sticky bottom-0 pt-4 bg-gradient-to-t from-white via-white to-transparent">
                <button
                  onClick={addToCalendar}
                  disabled={selectedCount === 0 || isSyncing}
                  className="w-full py-4 md:py-5 bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600 text-white rounded-xl font-semibold text-base md:text-lg hover:shadow-2xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Calendar className="w-4 h-4 md:w-5 md:h-5" />
                    {isSyncing ? 'Syncing...' : `Add ${selectedCount > 0 ? `${selectedCount} ` : ''}to Google Calendar`}
                  </span>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{background: 'linear-gradient(to right, #2563eb, #9333ea, rgb(80, 0, 130))'}}></div>
                </button>
              </div>
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && (
            <div className="text-center py-16 md:py-20 relative z-10">
              <button
                onClick={resetApp}
                className="absolute top-0 left-0 flex items-center gap-2 text-sm md:text-base text-gray-600 hover:text-purple-600 font-medium transition-colors group"
              >
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
                Back
              </button>
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-green-400 rounded-full blur-2xl opacity-40 animate-pulse"></div>
                <CheckCircle className="relative w-20 md:w-24 h-20 md:h-24 text-green-600 animate-bounce-in" />
              </div>
              <h3 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3" style={{fontFamily: "'Canela Text', serif"}}>You&apos;re all set!</h3>
              <p className="text-sm md:text-base text-gray-600 mb-8" style={{fontFamily: "'Canela Text', serif"}}>{selectedCount} events synced to your calendar</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a
                  href="https://calendar.google.com/calendar/r"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-6 md:px-8 text-white rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
                  style={{background: 'linear-gradient(to right, rgb(80, 0, 130), #9333ea, #2563eb)'}}
                >
                  <Calendar className="w-5 h-5" />
                  View in Google Calendar
                </a>
                <button
                  onClick={resetApp}
                  className="py-3 px-6 md:px-8 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  Sync Another Syllabus
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div 
          className="text-center mt-8 md:mt-12 text-xs md:text-sm text-gray-500 transition-all duration-1000"
          style={{
            opacity: loaded ? 1 : 0,
            transitionDelay: '1200ms',
            fontFamily: "'Canela Text', serif"
          }}
        >
          <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <span>© 2026 Saturday.solutions</span>
            <Link href="/privacy" className="hover:underline" style={{ color: 'rgb(80, 0, 130)' }}>Privacy Policy</Link>
            <Link href="/terms" className="hover:underline" style={{ color: 'rgb(80, 0, 130)' }}>Terms of Service</Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        :global(html) {
          --custom-purple: rgb(80, 0, 130);
          --custom-purple-50: rgba(80, 0, 130, 0.1);
          --custom-purple-100: rgba(80, 0, 130, 0.2);
          --custom-purple-200: rgba(80, 0, 130, 0.3);
          --custom-purple-300: rgba(80, 0, 130, 0.4);
          --custom-purple-400: rgba(80, 0, 130, 0.6);
          --custom-purple-600: rgb(80, 0, 130);
          --custom-purple-700: rgb(64, 0, 104);
          --custom-purple-800: rgb(48, 0, 78);
          --custom-purple-900: rgb(32, 0, 52);
        }
        .custom-purple-bg-50 { background-color: var(--custom-purple-50); }
        .custom-purple-bg-100 { background-color: var(--custom-purple-100); }
        .custom-purple-bg-200 { background-color: var(--custom-purple-200); }
        .custom-purple-bg-600 { background-color: var(--custom-purple-600); }
        .custom-purple-text { color: var(--custom-purple); }
        .custom-purple-text-600 { color: var(--custom-purple-600); }
        .custom-purple-text-700 { color: var(--custom-purple-700); }
        .custom-purple-text-800 { color: var(--custom-purple-800); }
        .custom-purple-text-900 { color: var(--custom-purple-900); }
        .custom-purple-border { border-color: var(--custom-purple); }
        .custom-purple-border-100 { border-color: var(--custom-purple-100); }
        .custom-purple-border-200 { border-color: var(--custom-purple-200); }
        .custom-purple-border-300 { border-color: var(--custom-purple-300); }
        .custom-purple-border-400 { border-color: var(--custom-purple-400); }
        .custom-purple-ring { --tw-ring-color: var(--custom-purple-400); }
        .custom-purple-gradient { background: linear-gradient(to right, var(--custom-purple-600), #9333ea, #2563eb); }
        .custom-purple-gradient-reverse { background: linear-gradient(to right, #2563eb, #9333ea, var(--custom-purple-600)); }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }
        @keyframes bounce-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.5;
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }
        .animate-float {
          animation: float ease-in-out infinite;
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        .animate-spin-reverse {
          animation: spin-reverse 1.5s linear infinite;
        }
        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out;
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
