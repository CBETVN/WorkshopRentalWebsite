"use client";

import { useState } from "react";
import Link from "next/link";
import Panel from "@/components/Panel/Panel"; // reusable boxed container
import styles from "./page.module.css"; // scoped plain-CSS styles for this page

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
    <main className={styles.main}>

      {/* Header */}
      <header className={styles.header}>
        <Link href="/" className={styles.backLink}>
          ← Back
        </Link>
        <div>
          <h1 className={styles.title}>Book Workshop Room A</h1>
          <p className={styles.subtitle}>Select a date, then pick your hours</p>
        </div>
      </header>

      <div className={styles.panels}>

        {/* Calendar */}
        <Panel>

          {/* Month navigation */}
          <div className={styles.monthNav}>
            <button onClick={prevMonth} className={styles.navButton}>
              ←
            </button>
            <h2 className={styles.monthLabel}>
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <button onClick={nextMonth} className={styles.navButton}>
              →
            </button>
          </div>

          {/* Day labels */}
          <div className={styles.weekLabels}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className={styles.weekLabel}>
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className={styles.daysGrid}>
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

              // Build the class list: base cell + any state-specific styles
              const dayClasses = [
                styles.dayCell,
                past ? styles.dayPast : "",
                selected ? styles.daySelected : "",
                todayMark && !selected ? styles.dayToday : "",
              ].join(" ");

              return (
                <button
                  key={day}
                  onClick={() => selectDate(day)}
                  disabled={past}
                  className={dayClasses}
                >
                  {day}
                  {hasBookings && !past && (
                    <span className={styles.bookingDot} />
                  )}
                </button>
              );
            })}
          </div>
        </Panel>

        {/* Time slots */}
        {selectedDate && (
          <Panel>
            <h3 className={styles.sectionTitle}>Select Hours</h3>
            <p className={styles.sectionHint}>
              {selectedDate} · €{PRICE_PER_HOUR}/hr · Click to select multiple hours
            </p>

            <div className={styles.slotsGrid}>
              {TIME_SLOTS.map((slot) => {
                const booked = bookedForDay.includes(slot);
                const selected = selectedSlots.includes(slot);

                // Base slot + booked/selected state
                const slotClasses = [
                  styles.slot,
                  booked ? styles.slotBooked : "",
                  selected ? styles.slotSelected : "",
                ].join(" ");

                return (
                  <button
                    key={slot}
                    onClick={() => toggleSlot(slot)}
                    disabled={booked}
                    className={slotClasses}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>

            <p className={styles.legend}>
              <span className={`${styles.legendDot} ${styles.legendAvailable}`} /> Available
              <span className={`${styles.legendDot} ${styles.legendSelected}`} /> Selected
              <span className={`${styles.legendDot} ${styles.legendBooked}`} /> Booked
            </p>
          </Panel>
        )}

        {/* Booking summary */}
        {selectedSlots.length > 0 && (
          <Panel accent>
            <h3 className={styles.sectionTitle}>Booking Summary</h3>

            <div className={styles.summaryRows}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Date</span>
                <span className={styles.summaryValue}>{selectedDate}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Hours</span>
                <span className={styles.summaryValue}>{selectedSlots.sort().join(", ")}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Duration</span>
                <span className={styles.summaryValue}>{totalHours} hour{totalHours > 1 ? "s" : ""}</span>
              </div>
              <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                <span className={styles.summaryLabel}>Total</span>
                <span className={styles.summaryTotalValue}>€{totalPrice}</span>
              </div>
            </div>

            <button className={styles.payButton}>
              Proceed to Payment →
            </button>
            <p className={styles.payNote}>Card payment only · Secure checkout via Stripe</p>
          </Panel>
        )}

      </div>
    </main>
  );
}
