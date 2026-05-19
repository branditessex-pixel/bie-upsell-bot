// scheduler.js
// Calculates the correct send time for the Hayley upsell email
// Rules:
//   Mon-Fri 09:00-16:40 -> send 15-20 mins after order (randomised)
//   Mon-Fri after 16:40 -> 09:09 next business day
//   Saturday or Sunday  -> 09:09 Monday
//   UK Bank Holiday     -> 09:09 next working day

// UK Bank Holidays - update annually or swap for API
// Covers England & Wales
const UK_BANK_HOLIDAYS = new Set([
  // 2025
  '2025-01-01', '2025-04-18', '2025-04-21', '2025-05-05',
  '2025-05-26', '2025-08-25', '2025-12-25', '2025-12-26',
  // 2026
  '2026-01-01', '2026-04-03', '2026-04-06', '2026-05-04',
  '2026-05-25', '2026-08-31', '2026-12-25', '2026-12-28',
  // 2027
  '2027-01-01', '2027-03-26', '2027-03-29', '2027-05-03',
  '2027-05-31', '2027-08-30', '2027-12-27', '2027-12-28'
]);

function toUKDateString(date) {
  // Returns YYYY-MM-DD in UK local time
  return date.toLocaleDateString('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).split('/').reverse().join('-');
}

function isUKBankHoliday(date) {
  return UK_BANK_HOLIDAYS.has(toUKDateString(date));
}

function isWeekend(date) {
  // Day of week in UK time
  const day = new Date(date.toLocaleString('en-GB', { timeZone: 'Europe/London' })).getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

function isBusinessDay(date) {
  return !isWeekend(date) && !isUKBankHoliday(date);
}

function nextBusinessDay(fromDate) {
  const d = new Date(fromDate);
  d.setDate(d.getDate() + 1);
  while (!isBusinessDay(d)) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

function setUKTime(date, hours, minutes, seconds = 0) {
  // Set a specific time in Europe/London timezone
  const ukString = date.toLocaleDateString('en-GB', { timeZone: 'Europe/London' });
  const parts = ukString.split('/'); // dd/mm/yyyy
  const isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
  // Create a date at that UK time
  const utcAttempt = new Date(`${isoDate}T${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}Z`);
  // Adjust for UK offset (GMT or BST)
  const ukOffset = getUKOffsetMinutes(utcAttempt);
  return new Date(utcAttempt.getTime() - ukOffset * 60000);
}

function getUKOffsetMinutes(date) {
  // Gets the UK UTC offset in minutes for a given date (handles BST/GMT)
  const ukTime = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/London' }));
  const utcTime = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  return (utcTime - ukTime) / 60000;
}

function getUKHour(date) {
  return parseInt(date.toLocaleString('en-GB', { timeZone: 'Europe/London', hour: '2-digit', hour12: false }));
}

function getUKMinute(date) {
  return parseInt(date.toLocaleString('en-GB', { timeZone: 'Europe/London', minute: '2-digit' }));
}

/**
 * Given the order placement time (UTC Date), return the UTC Date to send the email
 */
function calculateSendTime(orderTime) {
  const ukHour = getUKHour(orderTime);
  const ukMinute = getUKMinute(orderTime);
  const ukTotalMinutes = ukHour * 60 + ukMinute;

  const windowStart = 9 * 60;       // 09:00
  const windowEnd = 16 * 60 + 40;   // 16:40

  // Randomise delay between 15 and 20 minutes
  const delayMinutes = 15 + Math.floor(Math.random() * 6);

  if (isBusinessDay(orderTime) && ukTotalMinutes >= windowStart && ukTotalMinutes <= windowEnd) {
    // Send 15-20 mins after order
    return new Date(orderTime.getTime() + delayMinutes * 60000);
  }

  // Otherwise send at 09:09 next business day
  let targetDay;

  if (isBusinessDay(orderTime)) {
    // After 16:40 on a business day — next business day
    targetDay = nextBusinessDay(orderTime);
  } else {
    // Weekend or bank holiday — find next business day
    targetDay = new Date(orderTime);
    while (!isBusinessDay(targetDay)) {
      targetDay.setDate(targetDay.getDate() + 1);
    }
  }

  return setUKTime(targetDay, 9, 9);
}

module.exports = { calculateSendTime };
