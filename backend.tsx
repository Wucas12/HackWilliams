import React, { useState, useEffect } from 'react';
import { Calendar, Upload, CheckCircle, Clock, Sparkles, Trash2, Edit2, Settings, X, Check } from 'lucide-react';

export default function SyllabusCalendarApp() {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [events, setEvents] = useState([]);
  const [step, setStep] = useState('upload');
  const [loaded, setLoaded] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState(new Set());
  const [academicYear, setAcademicYear] = useState('2026');
  const [semester, setSemester] = useState('Spring');
  const [showSettings, setShowSettings] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);

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
    presentation: {
      border: 'border-orange-400',
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      iconBg: 'bg-orange-100',
      label: 'Presentation',
      gradient: 'from-orange-50 to-amber-50'
    },
    optional: {
      border: 'border-green-400',
      bg: 'bg-green-50',
      text: 'text-green-700',
      iconBg: 'bg-green-100',
      label: 'Optional',
      gradient: 'from-green-50 to-emerald-50'
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

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile && uploadedFile.type === 'application/pdf') {
      setFile(uploadedFile);
    }
  };

  const processFile = async () => {
    setStep('processing');
    setProcessing(true);
    setProcessingStep(0);
    
    const interval = setInterval(() => {
      setProcessingStep(prev => {
        if (prev < processingSteps.length - 1) return prev + 1;
        return prev;
      });
    }, 600);

    setTimeout(() => {
      clearInterval(interval);
      const mockEvents = [
        { id: 1, title: 'Midterm Exam', date: '2026-02-15', time: '10:00 AM', type: 'exam' },
        { id: 2, title: 'Project Proposal Due', date: '2026-02-28', time: '11:59 PM', type: 'assignment' },
        { id: 3, title: 'Final Exam', date: '2026-04-20', time: '2:00 PM', type: 'exam' },
        { id: 4, title: 'Group Presentation', date: '2026-03-15', time: '1:00 PM', type: 'presentation' },
        { id: 5, title: 'Optional Office Hours', date: '2026-03-01', time: '3:00 PM', type: 'optional' }
      ];
      
      setEvents(mockEvents);
      setSelectedEvents(new Set(mockEvents.map(e => e.id)));
      setProcessing(false);
      setStep('review');
    }, 2500);
  };

  const addToCalendar = () => {
    const eventsToAdd = events.filter(e => selectedEvents.has(e.id));
    console.log('Adding to calendar:', eventsToAdd);
    setStep('complete');
  };

  const resetApp = () => {
    setFile(null);
    setEvents([]);
    setSelectedEvents(new Set());
    setEditingId(null);
    setStep('upload');
  };

  const toggleEventSelection = (id) => {
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
    if (selectedEvents.size === events.length) {
      setSelectedEvents(new Set());
    } else {
      setSelectedEvents(new Set(events.map(e => e.id)));
    }
  };

  const deleteEvent = (id) => {
    setEvents(events.filter(e => e.id !== id));
    setSelectedEvents(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const updateEvent = (id, field, value) => {
    setEvents(events.map(e => 
      e.id === id ? { ...e, [field]: value } : e
    ));
  };

  const selectedCount = selectedEvents.size;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-blue-50 overflow-hidden">
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      
      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-0 left-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse transition-all duration-2000"
          style={{ opacity: loaded ? 0.3 : 0, transform: loaded ? 'scale(1)' : 'scale(0.5)' }}
        ></div>
        <div 
          className="absolute top-1/3 right-1/4 w-96 h-96 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse transition-all duration-2000" 
          style={{animationDelay: '2s', opacity: loaded ? 0.3 : 0, transform: loaded ? 'scale(1)' : 'scale(0.5)', transitionDelay: '300ms'}}
        ></div>
        <div 
          className="absolute bottom-0 left-1/2 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse transition-all duration-2000" 
          style={{animationDelay: '4s', opacity: loaded ? 0.3 : 0, transform: loaded ? 'scale(1)' : 'scale(0.5)', transitionDelay: '600ms'}}
        ></div>
      </div>

      {/* Floating particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-400 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${10 + Math.random() * 10}s`,
              opacity: loaded ? 0.2 : 0,
              transition: 'opacity 2s'
            }}
          ></div>
        ))}
      </div>

      <div className="relative max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-16">
        {/* Hero Header */}
        <div className="text-center mb-8 md:mb-16 space-y-6">
          <div 
            className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-5 py-2 rounded-full border border-purple-200 shadow-lg mb-6 transition-all duration-1000"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(-20px)',
              transitionDelay: '200ms'
            }}
          >
            <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
            <span className="text-xs md:text-sm font-semibold text-purple-900 tracking-wide">AI-POWERED EXTRACTION</span>
          </div>
          
          {/* Animated Title */}
          <div className="overflow-visible pb-4">
            <h1 className="text-4xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-tight" style={{fontFamily: "'Playfair Display', serif"}}>
              <div 
                className="transition-all duration-1000 ease-out hover:scale-105"
                style={{
                  opacity: loaded ? 1 : 0,
                  transform: loaded ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.95)',
                  transitionDelay: '400ms'
                }}
              >
                <span className="inline-block bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 bg-clip-text text-transparent hover:from-purple-900 hover:via-gray-900 hover:to-purple-900 transition-all duration-500 cursor-default">
                  The syllabus
                </span>
              </div>
              <div 
                className="transition-all duration-1000 ease-out mt-2 hover:scale-105"
                style={{
                  opacity: loaded ? 1 : 0,
                  transform: loaded ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.95)',
                  transitionDelay: '600ms'
                }}
              >
                <span className="inline-block bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600 bg-clip-text text-transparent animate-gradient hover:from-blue-600 hover:via-violet-600 hover:to-purple-600 transition-all duration-500 cursor-default">
                  you need to sync
                </span>
              </div>
            </h1>
          </div>
          
          <p 
            className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto transition-all duration-1000 px-4"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? 'translateY(0)' : 'translateY(20px)',
              transitionDelay: '800ms',
              fontFamily: "'Inter', sans-serif"
            }}
          >
            Transform your syllabus into a living calendar.<br />
            <span className="text-purple-600 font-medium">Never miss a deadline again.</span>
          </p>

          {/* Decorative line */}
          <div 
            className="flex justify-center transition-all duration-1000"
            style={{
              opacity: loaded ? 1 : 0,
              transitionDelay: '1000ms'
            }}
          >
            <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-purple-400 to-transparent"></div>
          </div>
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
          
          {/* Upload Step */}
          {step === 'upload' && (
            <div className="space-y-6 md:space-y-8 relative z-10">
              {/* Settings Section */}
              <div className="bg-purple-50/50 rounded-xl p-4 border border-purple-100">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center gap-2 text-sm font-semibold text-purple-900 w-full"
                >
                  <Settings className="w-4 h-4" />
                  Semester Context
                  <span className="ml-auto text-xs text-purple-600">{showSettings ? '▼' : '▶'}</span>
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

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-all duration-500 animate-pulse-slow"></div>
                <div className="relative border-2 border-dashed border-purple-300 rounded-2xl p-12 md:p-16 text-center bg-white hover:border-purple-400 hover:bg-purple-50/50 transition-all duration-300">
                  <Upload className="w-12 md:w-16 h-12 md:h-16 mx-auto mb-4 text-purple-600 group-hover:scale-110 transition-transform duration-300" />
                  <label className="cursor-pointer">
                    <span className="text-base md:text-lg font-semibold text-gray-900 block mb-2" style={{fontFamily: "'Inter', sans-serif"}}>
                      {file ? file.name : 'Drop your syllabus here'}
                    </span>
                    <span className="text-xs md:text-sm text-gray-500">PDF only • Up to 10MB</span>
                    <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <button
                onClick={processFile}
                disabled={!file}
                className="w-full py-4 md:py-5 bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600 text-white rounded-xl font-semibold text-base md:text-lg hover:shadow-2xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 relative overflow-hidden group"
              >
                <span className="relative z-10">Extract Events with AI</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </button>
            </div>
          )}

          {/* Processing Step */}
          {step === 'processing' && (
            <div className="text-center py-16 md:py-20 relative z-10">
              <div className="relative inline-block mb-6">
                <div className="w-20 md:w-24 h-20 md:h-24 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-20 md:w-24 h-20 md:h-24 border-4 border-transparent border-b-violet-500 rounded-full animate-spin-reverse"></div>
                <Sparkles className="w-8 md:w-10 h-8 md:h-10 text-purple-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2" style={{fontFamily: "'Playfair Display', serif"}}>Processing your syllabus</h3>
              <p className="text-sm md:text-base text-purple-600 font-medium" style={{fontFamily: "'Inter', sans-serif"}}>{processingSteps[processingStep]}</p>
            </div>
          )}

          {/* Review Step */}
          {step === 'review' && (
            <div className="space-y-4 md:space-y-6 relative z-10">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div>
                  <h3 className="text-2xl md:text-4xl font-bold text-gray-900" style={{fontFamily: "'Playfair Display', serif"}}>{events.length} Events</h3>
                  <p className="text-xs md:text-sm text-gray-600 mt-1" style={{fontFamily: "'Inter', sans-serif"}}>{selectedCount} selected</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleSelectAll}
                    className="text-xs md:text-sm text-purple-600 hover:text-purple-700 font-semibold transition-colors flex items-center gap-1"
                  >
                    {selectedEvents.size === events.length ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                    {selectedEvents.size === events.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <button onClick={resetApp} className="text-xs md:text-sm text-gray-500 hover:text-gray-700 font-semibold transition-colors">
                    New Upload
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-[50vh] md:max-h-96 overflow-y-auto pr-2">
                {events.map((event, idx) => {
                  const colorScheme = eventTypeColors[event.type] || eventTypeColors.default;
                  return (
                  <div
                    key={event.id}
                    className={`group p-4 md:p-5 bg-gradient-to-br ${colorScheme.gradient} rounded-xl border-l-4 border-2 transition-all duration-300 opacity-0 animate-fade-in-up ${
                      selectedEvents.has(event.id) 
                        ? `${colorScheme.border} shadow-lg` 
                        : 'border-gray-200 hover:border-purple-300'
                    } ${editingId === event.id ? 'ring-2 ring-purple-400' : ''}`}
                    style={{
                      animationDelay: `${idx * 100}ms`,
                      animationFillMode: 'forwards'
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedEvents.has(event.id)}
                        onChange={() => toggleEventSelection(event.id)}
                        className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      
                      <div className="flex-1 min-w-0">
                        {editingId === event.id ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={event.title}
                              onChange={(e) => updateEvent(event.id, 'title', e.target.value)}
                              className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm md:text-base"
                              placeholder="Event title"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="date"
                                value={event.date}
                                onChange={(e) => updateEvent(event.id, 'date', e.target.value)}
                                className="px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-xs md:text-sm"
                              />
                              <input
                                type="text"
                                value={event.time}
                                onChange={(e) => updateEvent(event.id, 'time', e.target.value)}
                                className="px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-xs md:text-sm"
                                placeholder="Time"
                              />
                            </div>
                            <select
                              value={event.type}
                              onChange={(e) => updateEvent(event.id, 'type', e.target.value)}
                              className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-xs md:text-sm"
                            >
                              <option value="exam">Exam</option>
                              <option value="assignment">Assignment</option>
                              <option value="presentation">Presentation</option>
                              <option value="optional">Optional</option>
                            </select>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-gray-900 text-base md:text-lg break-words" style={{fontFamily: "'Inter', sans-serif"}}>{event.title}</h4>
                              <span className={`px-2 py-0.5 ${colorScheme.iconBg} ${colorScheme.text} text-xs font-semibold rounded-full`}>
                                {colorScheme.label}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-600">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                                <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3 md:w-4 md:h-4" />
                                <span>{event.time}</span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingId(editingId === event.id ? null : event.id)}
                          className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
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
                  disabled={selectedCount === 0}
                  className="w-full py-4 md:py-5 bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600 text-white rounded-xl font-semibold text-base md:text-lg hover:shadow-2xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Calendar className="w-4 h-4 md:w-5 md:h-5" />
                    Add {selectedCount > 0 ? `${selectedCount} ` : ''}to Google Calendar
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </button>
              </div>
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && (
            <div className="text-center py-16 md:py-20 relative z-10">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-green-400 rounded-full blur-2xl opacity-40 animate-pulse"></div>
                <CheckCircle className="relative w-20 md:w-24 h-20 md:h-24 text-green-600 animate-bounce-in" />
              </div>
              <h3 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3" style={{fontFamily: "'Playfair Display', serif"}}>You're all set!</h3>
              <p className="text-sm md:text-base text-gray-600 mb-8" style={{fontFamily: "'Inter', sans-serif"}}>{selectedCount} events synced to your calendar</p>
              <button
                onClick={resetApp}
                className="py-3 px-6 md:px-8 bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                Sync Another Syllabus
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div 
          className="text-center mt-8 md:mt-12 text-xs md:text-sm text-gray-500 transition-all duration-1000"
          style={{
            opacity: loaded ? 1 : 0,
            transitionDelay: '1200ms',
            fontFamily: "'Inter', sans-serif"
          }}
        >
          <p>Built for students • Powered by AI • Made with ♥</p>
        </div>
      </div>

      <style jsx>{`
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