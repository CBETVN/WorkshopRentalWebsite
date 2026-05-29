"use client";

import { useState } from "react";
import Link from "next/link";

// Available time slots (9am - 9pm)
const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00",
  "17:00", "18:00", "19:00", "20:00",
];

// Fake booked slots for now (will come from database later)
const BOOKED_SLOTS = {
  "2026-06-05": ["10:00", "11:00", "14:00"],
  "2026-06-07": ["09:00", "10:00", "11:00", "12:00"],
  "2026-06-10": ["15:00", "16:00", "17:00"],
};

const PRICE_PER_HOUR = 10;

// Get days in a month
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

// Get day of week the month starts on (0=Sun)
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function formatDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isToday(year, month, day) {
  const today = new Date();
  return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
}

function isPast(year, month, day) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(year, month, day) < today;
}

export default function BookingPage() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate(null);
    setSelectedSlots([]);
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate(null);
    setSelectedSlots([]);
  }

  function selectDate(day) {
    if (isPast(currentYear, currentMonth, day)) return;
    const date = formatDate(currentYear, currentMonth, day);
    setSelectedDate(date);
    setSelectedSlots([]);
  }

  function toggleSlot(slot) {
    const booked = BOOKED_SLOTS[selectedDate] || [];
    if (booked.includes(slot)) return;
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  }

  const bookedForDay = selectedDate ? (BOOKED_SLOTS[selectedDate] || []) : [];
  const totalHours = selectedSlots.length;
  const totalPrice = totalHours * PRICE_PER_HOUR;

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">

      {/* Header */}
      <header className="max-w-3xl mx-auto mb-10 flex items-center gap-4">
        <Link href="/" className="text-zinc-500 hover:text-white transition text-sm">
          ← Back
        </Link>
        <div>
          <h1 className="text-3xl font-black text-white">Book Workshop Room A</h1>
          <p className="text-zinc-400 text-sm mt-1">Select a date, then pick your hours</p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto grid gap-6">

        {/* Calendar */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">

          {/* Month navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              className="text-zinc-400 hover:text-white transition px-3 py-1 rounded-lg hover:bg-zinc-800"
            >
              ←
            </button>
            <h2 className="text-lg font-bold text-white">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <button
              onClick={nextMonth}
              className="text-zinc-400 hover:text-white transition px-3 py-1 rounded-lg hover:bg-zinc-800"
            >
              →
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-zinc-600 text-xs uppercase tracking-wider py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for offset */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const date = formatDate(currentYear, currentMonth, day);
              const past = isPast(currentYear, currentMonth, day);
              const selected = selectedDate === date;
              const todayMark = isToday(currentYear, currentMonth, day);
              const hasBookings = BOOKED_SLOTS[date]?.length > 0;

              return (
                <button
                  key={day}
                  onClick={() => selectDate(day)}
                  disabled={past}
                  className={`
                    relative aspect-square rounded-xl text-sm font-medium transition flex items-center justify-center
                    ${past ? "text-zinc-700 cursor-not-allowed" : "hover:bg-zinc-700 cursor-pointer"}
                    ${selected ? "bg-amber-500 text-black font-bold hover:bg-amber-400" : ""}
                    ${todayMark && !selected ? "border border-amber-500 text-amber-400" : ""}
                    ${!selected && !past ? "text-white" : ""}
                  `}
                >
                  {day}
                  {hasBookings && !past && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-500 opacity-60" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time slots */}
        {selectedDate && (
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
            <h3 className="text-white font-bold mb-1">Select Hours</h3>
            <p className="text-zinc-500 text-sm mb-4">
              {selectedDate} · €{PRICE_PER_HOUR}/hr · Click to select multiple hours
            </p>

            <div className="grid grid-cols-4 gap-2">
              {TIME_SLOTS.map((slot) => {
                const booked = bookedForDay.includes(slot);
                const selected = selectedSlots.includes(slot);

                return (
                  <button
                    key={slot}
                    onClick={() => toggleSlot(slot)}
                    disabled={booked}
                    className={`
                      py-3 rounded-xl text-sm font-medium transition
                      ${booked ? "bg-zinc-800 text-zinc-600 cursor-not-allowed line-through" : ""}
                      ${selected ? "bg-amber-500 text-black font-bold" : ""}
                      ${!booked && !selected ? "bg-zinc-800 text-white hover:bg-zinc-700" : ""}
                    `}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>

            <p className="text-zinc-600 text-xs mt-4">
              <span className="inline-block w-3 h-3 rounded bg-zinc-800 border border-zinc-700 mr-1 align-middle" /> Available
              <span className="inline-block w-3 h-3 rounded bg-amber-500 ml-4 mr-1 align-middle" /> Selected
              <span className="inline-block w-3 h-3 rounded bg-zinc-800 ml-4 mr-1 align-middle line-through text-zinc-600" /> Booked
            </p>
          </div>
        )}

        {/* Booking summary */}
        {selectedSlots.length > 0 && (
          <div className="bg-zinc-900 rounded-2xl border border-amber-500/30 p-6">
            <h3 className="text-white font-bold mb-4">Booking Summary</h3>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Date</span>
                <span className="text-white font-medium">{selectedDate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Hours</span>
                <span className="text-white font-medium">{selectedSlots.sort().join(", ")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Duration</span>
                <span className="text-white font-medium">{totalHours} hour{totalHours > 1 ? "s" : ""}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-zinc-800 pt-2 mt-2">
                <span className="text-zinc-400">Total</span>
                <span className="text-amber-500 font-black text-xl">€{totalPrice}</span>
              </div>
            </div>

            <button className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-4 rounded-xl transition text-lg">
              Proceed to Payment →
            </button>
            <p className="text-center text-zinc-600 text-xs mt-3">Card payment only · Secure checkout via Stripe</p>
          </div>
        )}

      </div>
    </main>
  );
}
