import { DateTime } from 'luxon';
import fedHolidays from '@18f/us-federal-holidays';

const WEEKDAY_MONDAY = Object.freeze(1);
const WEEKDAY_FRIDAY = Object.freeze(5);
const WEEKDAY_SATURDAY = Object.freeze(6);
const WEEKDAY_SUNDAY = Object.freeze(7);

const federalHolidays = (startDate) => {
  // Consider the actually in lieu of holiday.
  // Consider a federal holiday range of, from letter-date to letter-date plus a full year.
  const options = { shiftSaturdayHolidays: true, shiftSundayHolidays: true };
  const currentDate = DateTime.fromJSDate(startDate);
  const endDate = currentDate.plus({ years: 1 }).toJSDate();
  return fedHolidays.inRange(currentDate.toJSDate(), endDate, options);
};

const isFederalHoliday = (date, holidays) => {
  const dateString = date.toFormat('yyyy-MM-dd'); // must match holidays format
  return holidays.some((holiday) => holiday.dateString === dateString);
};

const isBusinessDay = (date, holidays) => date.weekday >= WEEKDAY_MONDAY && date.weekday <= WEEKDAY_FRIDAY && !isFederalHoliday(date, holidays);

const addBusinessDays = (startDate, numberOfDaysToAdd, holidays) => {
  let daysToAdd = numberOfDaysToAdd;
  let currentDate = DateTime.fromJSDate(startDate);
  if (daysToAdd === 0 && !isBusinessDay(currentDate, holidays)) {
    currentDate = currentDate.plus({ days: 1 });
  }

  while (daysToAdd > 0 || !isBusinessDay(currentDate, holidays)) {
    currentDate = currentDate.plus({ days: 1 });
    if (currentDate.weekday !== WEEKDAY_SATURDAY && currentDate.weekday !== WEEKDAY_SUNDAY && !isFederalHoliday(currentDate, holidays)) {
      daysToAdd -= 1;
    }
  }
  return currentDate.toJSDate();
};

const getCalculatedLetterDateFromDraft = (draft) => {
  if (draft.letterDateOverride) {
    return DateTime.fromISO(draft.letterDateOverride).toLocaleString(DateTime.DATE_SHORT);
  }
  const theDate = new Date();
  const daysForward = draft?.daysForward || 0;
  const newDate = addBusinessDays(theDate, daysForward, federalHolidays(theDate));

  return DateTime.fromJSDate(newDate).toLocaleString(DateTime.DATE_SHORT);
};

export { addBusinessDays, federalHolidays, getCalculatedLetterDateFromDraft };
