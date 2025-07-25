import { DateTime } from 'luxon';
import { addBusinessDays, federalHolidays, getCalculatedLetterDateFromDraft } from './dateHelpers';

// new Date (yyyy, m, d) is used. Where m for January is 0 and December is 11.
describe('addBusinessDays', () => {
  it('should account for business days', () => {
    const startDate = new Date(2024, 1, 23); // starts with Feb 23, 2024
    const holidays = federalHolidays(startDate);
    const received = addBusinessDays(startDate, 5, holidays);
    const receivedStr = DateTime.fromJSDate(received).toFormat('MM/dd/yyyy');
    const expected = new Date(2024, 2, 1); // five days later... Mar 1, 2024
    const expectedStr = DateTime.fromJSDate(expected).toFormat('MM/dd/yyyy');

    expect(receivedStr).toBe(expectedStr);
  });

  it('should skips thanksgiving', () => {
    const startDate = new Date(2023, 10, 22); // starts a day before thanksgiving and add a day
    const received = addBusinessDays(startDate, 1, federalHolidays(startDate));
    const receivedStr = DateTime.fromJSDate(received).toFormat('MM/dd/yyyy');
    const expected = new Date(2023, 10, 24); // skips Thanksgiving = Nov 24, 2023
    const expectedStr = DateTime.fromJSDate(expected).toFormat('MM/dd/yyyy');

    expect(receivedStr).toBe(expectedStr);
  });

  it('should forward 2 business days skipping weekend and xmas', () => {
    const startDate = new Date(2023, 11, 22); // starts Dec 22, 2023
    const received = addBusinessDays(startDate, 2, federalHolidays(startDate));
    const receivedStr = DateTime.fromJSDate(received).toFormat('MM/dd/yyyy');
    const expected = new Date(2023, 11, 27); // Sat + Sun + Xmas + 2 days = Dec 27, 2023
    const expectedStr = DateTime.fromJSDate(expected).toFormat('MM/dd/yyyy');

    expect(receivedStr).toBe(expectedStr);
  });

  it('should forward 5 business days skipping weekend, xmas, and new-year', () => {
    const startDate = new Date(2023, 11, 22); // starts Dec 22, 2023
    const received = addBusinessDays(startDate, 5, federalHolidays(startDate));
    const receivedStr = DateTime.fromJSDate(received).toFormat('MM/dd/yyyy');
    const expected = new Date(2024, 0, 2); // Sat + Sun + Xmas + NewYear + 5 business days = Jan 2, 2024
    const expectedStr = DateTime.fromJSDate(expected).toFormat('MM/dd/yyyy');

    expect(receivedStr).toBe(expectedStr);
  });
});

describe('getCalculatedLetterDateFromDraft', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2024, 4, 15)); // Wed May 15 2024. Just a normal day.
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('with no override', () => {
    it('returns the date + daysForward', () => {
      const draft = {
        letterDateOverride: undefined,
        daysForward: 1,
      };
      const letterDate = '5/16/2024';

      const result = getCalculatedLetterDateFromDraft(draft);
      expect(result).toEqual(letterDate);
    });
  });

  describe('with a date override', () => {
    it('returns the override date', () => {
      const draft = {
        letterDateOverride: '2024-01-01',
        daysForward: 1,
      };
      const letterDate = '1/1/2024';

      const result = getCalculatedLetterDateFromDraft(draft);
      expect(result).toEqual(letterDate);
    });
  });
});
