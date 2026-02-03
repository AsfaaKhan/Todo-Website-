// Utility functions for parsing natural language dates and times

/**
 * Parses natural language date expressions into ISO 8601 format
 * @param input - Natural language date expression (e.g., "tomorrow", "next week", "in 3 days")
 * @returns Date object or null if parsing fails
 */
export function parseNaturalLanguageDate(input: string): Date | null {
  // Convert to lowercase for easier matching
  const lowerInput = input.toLowerCase().trim();

  // Current date for reference
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Handle "today"
  if (lowerInput.includes("today")) {
    return today;
  }

  // Handle "tomorrow"
  if (lowerInput.includes("tomorrow")) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  // Handle "yesterday"
  if (lowerInput.includes("yesterday")) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  }

  // Handle "next week"
  if (lowerInput.includes("next week")) {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek;
  }

  // Handle "next month"
  if (lowerInput.includes("next month")) {
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth;
  }

  // Handle "in X days/weeks/months"
  const timeUnitsMatch = lowerInput.match(/in (\d+)\s*(day|week|month|year)s?/);
  if (timeUnitsMatch) {
    const quantity = parseInt(timeUnitsMatch[1]);
    const unit = timeUnitsMatch[2];

    const futureDate = new Date(today);

    switch (unit) {
      case 'day':
        futureDate.setDate(futureDate.getDate() + quantity);
        break;
      case 'week':
        futureDate.setDate(futureDate.getDate() + (quantity * 7));
        break;
      case 'month':
        futureDate.setMonth(futureDate.getMonth() + quantity);
        break;
      case 'year':
        futureDate.setFullYear(futureDate.getFullYear() + quantity);
        break;
    }

    return futureDate;
  }

  // Handle "in X hours/minutes"
  const timeAmountMatch = lowerInput.match(/in (\d+)\s*(hour|minute|second)s?/);
  if (timeAmountMatch) {
    const quantity = parseInt(timeAmountMatch[1]);
    const unit = timeAmountMatch[2];

    const futureDate = new Date(now);

    switch (unit) {
      case 'hour':
        futureDate.setHours(futureDate.getHours() + quantity);
        break;
      case 'minute':
        futureDate.setMinutes(futureDate.getMinutes() + quantity);
        break;
      case 'second':
        futureDate.setSeconds(futureDate.getSeconds() + quantity);
        break;
    }

    return futureDate;
  }

  // Handle specific day of week (e.g., "next monday", "friday")
  const dayOfWeekMatch = lowerInput.match(/(next|this)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
  if (dayOfWeekMatch) {
    const dayName = dayOfWeekMatch[2].toLowerCase();
    const nextOrThis = dayOfWeekMatch[1]?.toLowerCase() || 'this';

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDayIndex = days.indexOf(dayName);
    const currentDayIndex = today.getDay(); // Sunday = 0

    let daysToAdd = targetDayIndex - currentDayIndex;

    if (daysToAdd <= 0 && nextOrThis === 'next') {
      daysToAdd += 7;
    } else if (daysToAdd < 0 && nextOrThis === 'this') {
      daysToAdd += 7;
    }

    if (daysToAdd === 0 && nextOrThis === 'next') {
      daysToAdd = 7;
    }

    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + daysToAdd);
    return targetDate;
  }

  // Handle relative dates like "in 2 days", "3 weeks from now"
  const relativeDateMatch = lowerInput.match(/(\d+)\s*(day|week|month|year)s?\s*(from now|later|ahead)/);
  if (relativeDateMatch) {
    const quantity = parseInt(relativeDateMatch[1]);
    const unit = relativeDateMatch[2];

    const futureDate = new Date(today);

    switch (unit) {
      case 'day':
        futureDate.setDate(futureDate.getDate() + quantity);
        break;
      case 'week':
        futureDate.setDate(futureDate.getDate() + (quantity * 7));
        break;
      case 'month':
        futureDate.setMonth(futureDate.getMonth() + quantity);
        break;
      case 'year':
        futureDate.setFullYear(futureDate.getFullYear() + quantity);
        break;
    }

    return futureDate;
  }

  // Try to parse standard date formats (YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY)
  const standardDateMatch = lowerInput.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b|\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b|\b(\d{1,2})\/(\d{1,2})\/(\d{2})\b/);
  if (standardDateMatch) {
    if (standardDateMatch[1]) { // YYYY-MM-DD format
      const year = parseInt(standardDateMatch[1]);
      const month = parseInt(standardDateMatch[2]) - 1; // Month is 0-indexed
      const day = parseInt(standardDateMatch[3]);
      return new Date(year, month, day);
    } else if (standardDateMatch[4]) { // MM/DD/YYYY format
      const month = parseInt(standardDateMatch[4]) - 1; // Month is 0-indexed
      const day = parseInt(standardDateMatch[5]);
      const year = parseInt(standardDateMatch[6]);
      return new Date(year, month, day);
    } else if (standardDateMatch[7]) { // MM/DD/YY format
      const month = parseInt(standardDateMatch[7]) - 1; // Month is 0-indexed
      const day = parseInt(standardDateMatch[8]);
      let year = parseInt(standardDateMatch[9]);
      // Handle 2-digit years (assuming 20xx for years < 50, 19xx for years >= 50)
      if (year < 50) year += 2000;
      else year += 1900;
      return new Date(year, month, day);
    }
  }

  // If nothing matched, return null
  return null;
}

/**
 * Parses natural language time expressions into 24-hour format
 * @param input - Natural language time expression (e.g., "at 6pm", "6:30pm", "in 2 hours")
 * @returns Hours and minutes as [hours, minutes] or null if parsing fails
 */
export function parseNaturalLanguageTime(input: string): [number, number] | null {
  // Convert to lowercase for easier matching
  const lowerInput = input.toLowerCase().trim();

  // Handle "at X o'clock", "X o'clock", "X AM/PM", "X:XX AM/PM"
  const timeMatch = lowerInput.match(/(\d{1,2})(:(\d{2}))?\s*(am|pm)?/);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[3] ? parseInt(timeMatch[3]) : 0;
    const period = timeMatch[4]?.toLowerCase();

    // Convert to 24-hour format if needed
    if (period === 'pm' && hours !== 12) {
      hours += 12;
    } else if (period === 'am' && hours === 12) {
      hours = 0;
    }

    return [hours, minutes];
  }

  // Handle "noon" and "midnight"
  if (lowerInput.includes("noon")) {
    return [12, 0];
  }
  if (lowerInput.includes("midnight")) {
    return [0, 0];
  }

  // Handle "in X hours/minutes" relative to current time
  const relativeTimeMatch = lowerInput.match(/in (\d+)\s*(hour|minute)s?/);
  if (relativeTimeMatch) {
    const quantity = parseInt(relativeTimeMatch[1]);
    const unit = relativeTimeMatch[2];

    const now = new Date();
    let futureTime = new Date(now);

    if (unit === 'hour') {
      futureTime.setHours(futureTime.getHours() + quantity);
    } else if (unit === 'minute') {
      futureTime.setMinutes(futureTime.getMinutes() + quantity);
    }

    return [futureTime.getHours(), futureTime.getMinutes()];
  }

  // Handle "X hours from now"
  const fromNowMatch = lowerInput.match(/(\d+)\s*(hour|minute)s?\s*(from now|later|ahead)/);
  if (fromNowMatch) {
    const quantity = parseInt(fromNowMatch[1]);
    const unit = fromNowMatch[2];

    const now = new Date();
    let futureTime = new Date(now);

    if (unit === 'hour') {
      futureTime.setHours(futureTime.getHours() + quantity);
    } else if (unit === 'minute') {
      futureTime.setMinutes(futureTime.getMinutes() + quantity);
    }

    return [futureTime.getHours(), futureTime.getMinutes()];
  }

  return null;
}

/**
 * Combines date and time parsing to create a complete datetime
 * @param input - Natural language datetime expression
 * @returns ISO string of the parsed datetime or null if parsing fails
 */
export function parseNaturalLanguageDateTime(input: string): string | null {
  // First try to parse the date
  const date = parseNaturalLanguageDate(input);

  // Then try to parse the time
  const time = parseNaturalLanguageTime(input);

  if (date && time) {
    const [hours, minutes] = time;
    date.setHours(hours, minutes, 0, 0); // Set hours and minutes, zero out seconds and milliseconds
    return date.toISOString();
  } else if (date) {
    // If only date is found, set time to 00:00 (beginning of the day)
    date.setHours(0, 0, 0, 0);
    return date.toISOString();
  } else if (time) {
    // If only time is found, use today's date with the specified time
    const today = new Date();
    const [hours, minutes] = time;
    today.setHours(hours, minutes, 0, 0);
    return today.toISOString();
  }

  return null;
}

/**
 * Formats a date for display
 * @param date - Date object to format
 * @returns Formatted date string
 */
export function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Formats a time for display
 * @param date - Date object to format
 * @returns Formatted time string
 */
export function formatTimeForDisplay(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}