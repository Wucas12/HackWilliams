'use client';

import React, { useState } from 'react';
import { Calendar, Clock, Mail, Sparkles, CheckCircle, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MeetingDetails, TimeSlot } from '@/types/meeting';
import { findAvailableSlots, bookMeeting } from '@/app/actions/meetings';
import Link from 'next/link';

export default function BookMeetingPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [naturalLanguage, setNaturalLanguage] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState<number | string>(30);
  const [durationDisplay, setDurationDisplay] = useState('30');
  const [tone, setTone] = useState<'formal' | 'friendly'>('friendly');
  const [invitationMessage, setInvitationMessage] = useState<string>('');
  const [isParsing, setIsParsing] = useState(false);
  const [isFindingSlots, setIsFindingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
  const [meetingDetails, setMeetingDetails] = useState<MeetingDetails | null>(null);
  const [suggestedSlots, setSuggestedSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);

  const handleParseAndFindSlots = async () => {
    if (!email || !naturalLanguage) {
      setError('Please provide email and meeting description');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate duration
    const durationValue = typeof duration === 'string' ? parseInt(duration, 10) : duration;
    if (!durationValue || isNaN(durationValue) || durationValue < 15) {
      setError('Meeting duration must be at least 15 minutes');
      return;
    }

    setError(null);
    setIsParsing(true);

    try {
      // Parse natural language
      const parseResponse = await fetch('/api/parse-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ naturalLanguage }),
      });

      if (!parseResponse.ok) {
        const errorData = await parseResponse.json();
        throw new Error(errorData.error || 'Failed to parse meeting description');
      }

      const parsed: MeetingDetails = await parseResponse.json();
      setMeetingDetails(parsed);

      // Update duration display if parsed duration is different and user hasn't customized
      const durationValue = typeof duration === 'string' ? (duration === '' ? null : parseInt(duration, 10)) : duration;
      const finalDuration = (durationValue && durationValue >= 15) ? durationValue : (parsed.duration || 30);
      if (durationValue !== finalDuration) {
        setDuration(finalDuration);
        setDurationDisplay(finalDuration.toString());
      }
      const meetingDuration = finalDuration;

      // Determine time range
      const now = new Date();
      const defaultStart = new Date(now);
      defaultStart.setDate(defaultStart.getDate() + 1); // Start tomorrow
      defaultStart.setHours(9, 0, 0, 0);

      const defaultEnd = new Date(defaultStart);
      defaultEnd.setDate(defaultEnd.getDate() + 14); // Next 14 days
      defaultEnd.setHours(17, 0, 0, 0);

      const timeRange = {
        start: startDate ? new Date(startDate) : defaultStart,
        end: endDate ? new Date(endDate) : defaultEnd,
      };

      setIsParsing(false);
      setIsFindingSlots(true);

      // Find available slots
      const slots = await findAvailableSlots(email, meetingDuration, timeRange, parsed);
      setSuggestedSlots(slots);

      if (slots.length === 0) {
        setError('No available time slots found. Please try a different date range.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process meeting request');
      setIsParsing(false);
      setIsFindingSlots(false);
    } finally {
      setIsFindingSlots(false);
    }
  };

  const handleGenerateInvitation = async () => {
    if (!selectedSlot || !meetingDetails || !email) {
      setError('Please select a time slot and ensure meeting details are available');
      return;
    }

    setIsGeneratingMessage(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingDetails,
          selectedSlot,
          attendeeEmail: email,
          tone,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate invitation message');
      }

      const data = await response.json();
      setInvitationMessage(data.message || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate invitation message');
    } finally {
      setIsGeneratingMessage(false);
    }
  };

  const handleBookMeeting = async () => {
    if (!selectedSlot || !meetingDetails) {
      setError('Please select a time slot');
      return;
    }

    setIsBooking(true);
    setError(null);

    try {
      const result = await bookMeeting(email, selectedSlot, meetingDetails, invitationMessage);
      setEventId(result.eventId);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to book meeting');
    } finally {
      setIsBooking(false);
    }
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b overflow-hidden" style={{background: 'linear-gradient(to bottom, rgba(80, 0, 130, 0.1), white, rgb(219, 234, 254))'}}>
      <div className="relative max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-16">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm md:text-base text-gray-600 hover:text-purple-600 font-medium mb-6 transition-colors group">
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <h1 
            className="text-3xl md:text-5xl font-light tracking-tight leading-none text-left mb-4"
            style={{
              fontFamily: "'Canela Text', serif",
              fontWeight: 250,
              color: 'rgb(80, 0, 130)'
            }}
          >
            Book a Meeting
          </h1>
        </div>

        {/* Main Card */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 md:p-12 shadow-2xl border border-gray-100 relative overflow-hidden">
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
          
          <div className="relative z-10">
            {!success ? (
              <>
                {/* Error Display */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                {/* Form */}
                <div className="space-y-6">
                  {/* Email Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Attendee Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="unix@williams.edu"
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-sm md:text-base"
                      style={{borderColor: 'rgba(80, 0, 130, 0.4)'}}
                      onFocus={(e) => e.currentTarget.style.setProperty('--tw-ring-color', 'rgba(80, 0, 130, 0.6)')}
                      disabled={isParsing || isFindingSlots || isBooking}
                    />
                  </div>

                  {/* Natural Language Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Meeting Description
                    </label>
                    <textarea
                      value={naturalLanguage}
                      onChange={(e) => setNaturalLanguage(e.target.value)}
                      placeholder="e.g., 'Coffee chat next Monday afternoon' or '30-minute project sync on Wednesday at 2pm'"
                      rows={4}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-sm md:text-base"
                      style={{borderColor: 'rgba(80, 0, 130, 0.4)'}}
                      onFocus={(e) => e.currentTarget.style.setProperty('--tw-ring-color', 'rgba(80, 0, 130, 0.6)')}
                      disabled={isParsing || isFindingSlots || isBooking}
                    />
                  </div>

                  {/* Optional Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">Duration (minutes)</label>
                      <input
                        type="number"
                        value={durationDisplay}
                        onChange={(e) => {
                          const value = e.target.value;
                          setDurationDisplay(value); // Allow empty string or any input
                          if (value === '') {
                            setDuration(''); // Keep as empty string
                          } else {
                            const parsed = parseInt(value, 10);
                            if (!isNaN(parsed)) {
                              setDuration(parsed);
                            } else {
                              setDuration(value); // Keep as string if not a number
                            }
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value;
                          const parsed = parseInt(value, 10);
                          if (!value || isNaN(parsed) || parsed < 15) {
                            setDuration(30);
                            setDurationDisplay('30');
                          } else {
                            setDuration(parsed);
                            setDurationDisplay(parsed.toString());
                          }
                        }}
                        min="15"
                        max="480"
                        step="15"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-xs md:text-sm"
                        style={{borderColor: 'rgba(80, 0, 130, 0.4)'}}
                        onFocus={(e) => e.currentTarget.style.setProperty('--tw-ring-color', 'rgba(80, 0, 130, 0.6)')}
                        disabled={isParsing || isFindingSlots || isBooking}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">Start Date (optional)</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-xs md:text-sm"
                        style={{borderColor: 'rgba(80, 0, 130, 0.4)'}}
                        onFocus={(e) => e.currentTarget.style.setProperty('--tw-ring-color', 'rgba(80, 0, 130, 0.6)')}
                        disabled={isParsing || isFindingSlots || isBooking}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">End Date (optional)</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-xs md:text-sm"
                        style={{borderColor: 'rgba(80, 0, 130, 0.4)'}}
                        onFocus={(e) => e.currentTarget.style.setProperty('--tw-ring-color', 'rgba(80, 0, 130, 0.6)')}
                        disabled={isParsing || isFindingSlots || isBooking}
                      />
                    </div>
                  </div>

                  {/* Tone Selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Invitation Tone
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="tone"
                          value="friendly"
                          checked={tone === 'friendly'}
                          onChange={(e) => setTone(e.target.value as 'formal' | 'friendly')}
                          className="w-4 h-4"
                          style={{accentColor: 'rgb(80, 0, 130)'}}
                          disabled={isParsing || isFindingSlots || isBooking}
                        />
                        <span className="text-sm text-gray-700">For Everyday (friendly tone)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="tone"
                          value="formal"
                          checked={tone === 'formal'}
                          onChange={(e) => setTone(e.target.value as 'formal' | 'friendly')}
                          className="w-4 h-4"
                          style={{accentColor: 'rgb(80, 0, 130)'}}
                          disabled={isParsing || isFindingSlots || isBooking}
                        />
                        <span className="text-sm text-gray-700">For Professors (formal tone)</span>
                      </label>
                    </div>
                  </div>

                  {/* Parse and Find Slots Button */}
                  <button
                    onClick={handleParseAndFindSlots}
                    disabled={isParsing || isFindingSlots || isBooking || !email || !naturalLanguage}
                    className="w-full py-4 text-white rounded-xl font-semibold text-base md:text-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300"
                    style={{background: 'linear-gradient(to right, rgb(80, 0, 130), #9333ea, #2563eb)'}}
                  >
                    {isParsing ? (
                      <span className="flex items-center justify-center gap-2">
                        <Sparkles className="w-5 h-5 animate-pulse" />
                        Parsing meeting details...
                      </span>
                    ) : isFindingSlots ? (
                      <span className="flex items-center justify-center gap-2">
                        <Clock className="w-5 h-5 animate-spin" />
                        Finding available slots...
                      </span>
                    ) : (
                      'Find Available Times'
                    )}
                  </button>

                  {/* Parsed Meeting Details */}
                  {meetingDetails && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <h3 className="font-semibold text-purple-900 mb-2 text-sm md:text-base">Meeting Details</h3>
                      <div className="space-y-1 text-xs md:text-sm text-purple-800">
                        <p><strong>Title:</strong> {meetingDetails.title}</p>
                        <p><strong>Duration:</strong> {meetingDetails.duration} minutes</p>
                        {meetingDetails.description && (
                          <p><strong>Description:</strong> {meetingDetails.description}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Suggested Slots */}
                  {suggestedSlots.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900 text-lg md:text-xl flex items-center gap-2">
                        <Calendar className="w-5 h-5" style={{color: 'rgb(80, 0, 130)'}} />
                        Available Time Slots
                      </h3>
                      <div className="space-y-3">
                        {suggestedSlots.map((slot, index) => {
                          const { date, time } = formatDateTime(slot.startTime);
                          const isSelected = selectedSlot?.startTime === slot.startTime;
                          return (
                            <button
                              key={index}
                              onClick={() => setSelectedSlot(slot)}
                              className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                                isSelected
                                  ? 'border-purple-600 bg-purple-50 shadow-lg'
                                  : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/50'
                              }`}
                              disabled={isBooking}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold text-gray-900 text-sm md:text-base">{date}</p>
                                  <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                    <Clock className="w-4 h-4" />
                                    {time}
                                  </p>
                                </div>
                                {isSelected && (
                                  <CheckCircle className="w-6 h-6" style={{color: 'rgb(80, 0, 130)'}} />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Generate Invitation Message Section */}
                      {selectedSlot && (
                        <div className="space-y-4">
                          <button
                            onClick={handleGenerateInvitation}
                            disabled={isGeneratingMessage || isBooking}
                            className="w-full py-3 text-white rounded-xl font-semibold text-sm md:text-base hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center gap-2"
                            style={{background: 'linear-gradient(to right, rgb(80, 0, 130), #9333ea, #2563eb)'}}
                          >
                            {isGeneratingMessage ? (
                              <>
                                <Sparkles className="w-4 h-4 animate-pulse" />
                                Generating invitation message...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" />
                                Generate Invitation Message
                              </>
                            )}
                          </button>

                          {invitationMessage && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Invitation Message (editable)
                              </label>
                              <textarea
                                value={invitationMessage}
                                onChange={(e) => setInvitationMessage(e.target.value)}
                                rows={6}
                                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-sm md:text-base"
                                style={{borderColor: 'rgba(80, 0, 130, 0.4)'}}
                                onFocus={(e) => e.currentTarget.style.setProperty('--tw-ring-color', 'rgba(80, 0, 130, 0.6)')}
                                disabled={isBooking}
                                placeholder="Invitation message will appear here..."
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Book Meeting Button */}
                      {selectedSlot && (
                        <button
                          onClick={handleBookMeeting}
                          disabled={isBooking}
                          className="w-full py-4 text-white rounded-xl font-semibold text-base md:text-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center gap-2"
                          style={{background: 'linear-gradient(to right, rgb(80, 0, 130), #9333ea, #2563eb)'}}
                        >
                          {isBooking ? (
                            <>
                              <Clock className="w-5 h-5 animate-spin" />
                              Sending invite...
                            </>
                          ) : (
                            <>
                              <Calendar className="w-5 h-5" />
                              Book Meeting & Send Invite
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Success State */
              <div className="text-center py-12">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-green-400 rounded-full blur-2xl opacity-40 animate-pulse"></div>
                  <CheckCircle className="relative w-20 md:w-24 h-20 md:h-24 text-green-600" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3" style={{fontFamily: "'Canela Text', serif"}}>
                  Meeting Booked!
                </h3>
                <p className="text-sm md:text-base text-gray-600 mb-6">
                  Calendar invite has been sent to {email}
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => {
                      setSuccess(false);
                      setEmail('');
                      setNaturalLanguage('');
                      setStartDate('');
                      setEndDate('');
                      setDuration(30);
                      setDurationDisplay('30');
                      setTone('friendly');
                      setInvitationMessage('');
                      setMeetingDetails(null);
                      setSuggestedSlots([]);
                      setSelectedSlot(null);
                      setEventId(null);
                    }}
                    className="px-6 py-3 text-white rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300"
                    style={{background: 'linear-gradient(to right, rgb(80, 0, 130), #9333ea, #2563eb)'}}
                  >
                    Book Another Meeting
                  </button>
                  <Link
                    href="/dashboard"
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-300"
                  >
                    Back to Dashboard
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
    </div>
  );
}
