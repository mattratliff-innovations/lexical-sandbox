import { getApplicantOrPetitionerAnumber, getReceiptNumberWithAnumber, isShowPetitionerAnumber, primaryApplicant } from './DraftSerializerUtil';

describe('primaryApplicant', () => {
  it('finds the primary applicant', () => {
    const draft = {
      applicantTypes: [
        {
          lastName: 'Primary',
          primaryApplicant: true,
        },
        { lastName: 'Not primary' },
      ],
    };

    const result = primaryApplicant(draft);
    expect(result.lastName).toBe('Primary');
  });

  it('returns null if there is no primary applicant', () => {
    const draft = { applicantTypes: [] };

    const result = primaryApplicant(draft);
    expect(result).toBe(null);
  });
});

describe('isShowPetitionerAnumber', () => {
  it('returns true if form found and flag true', () => {
    const draft = {
      registration: { id: '1', formTypeName: 'F123' },
      letterType: {
        id: 'a93d7e92-a8c8-4791-a6ca-7d5aec52918f',
        formTypes: [
          { id: '888', name: 'F-123', code: 'F123', showPetitionerAnumber: true },
          { id: '999', name: 'N-300', code: 'N300', showPetitionerAnumber: false },
        ],
      },
    };

    const result = isShowPetitionerAnumber(draft);
    expect(result).toBe(true);
  });

  it('returns false if form found and flag false', () => {
    const draft = {
      registration: { id: '1', formTypeName: 'F123' },
      letterType: {
        id: 'a93d7e92-a8c8-4791-a6ca-7d5aec52918f',
        formTypes: [
          { id: '888', name: 'F-123', code: 'F123', showPetitionerAnumber: false },
          { id: '999', name: 'N-300', code: 'N300', showPetitionerAnumber: true },
        ],
      },
    };

    const result = isShowPetitionerAnumber(draft);
    expect(result).toBe(false);
  });

  it('returns false if form not found', () => {
    const draft = {
      registration: { id: '1', formTypeName: 'F123' },
      letterType: {
        id: 'a93d7e92-a8c8-4791-a6ca-7d5aec52918f',
        formTypes: [
          { id: '888', name: 'N-400', code: 'N400', showPetitionerAnumber: true },
          { id: '999', name: 'N-300', code: 'N300', showPetitionerAnumber: true },
        ],
      },
    };

    const result = isShowPetitionerAnumber(draft);
    expect(result).toBe(false);
  });
});

describe('getReceiptNumberWithAnumber', () => {
  it('returns receipt number with anumber concatenated', () => {
    const receiptNumber = '1234';
    const alienNumber = 'A222';
    const draft = {
      registration: { id: '1', formTypeName: 'F123', receiptNumber },
      letterType: { id: 'a93d7e92-a8c8-4791-a6ca-7d5aec52918f' },
      applicantTypes: [{ lastName: 'Primary', primaryApplicant: true, aNumber: alienNumber }],
    };

    const result = getReceiptNumberWithAnumber(draft);
    expect(result).toBe(`${receiptNumber}-${alienNumber}`);
    // expect(result).toBe('1234-A222');
  });

  it('returns just anumber when no receipt number ', () => {
    const primaryAnumber = 'A7755';
    const draft = {
      registration: { id: '1', formTypeName: 'F123', receiptNumber: null },
      applicantTypes: [{ lastName: 'Primary', primaryApplicant: true, aNumber: primaryAnumber }],
    };

    const result = getReceiptNumberWithAnumber(draft);
    expect(result).toBe(primaryAnumber);
  });

  it('returns just receipt number when no anumber ', () => {
    const receiptNumber = '4444';
    const draft = { registration: { id: '1', formTypeName: 'F123', receiptNumber } };

    const result = getReceiptNumberWithAnumber(draft);
    expect(result).toBe(receiptNumber);
  });
});

describe('getApplicantOrPetitionerAnumber', () => {
  it('returns applicant Anumber if there is a primary applicant', () => {
    const primaryAnumber = 'A888';
    const draft = {
      registration: { id: '1', formTypeName: 'F123', receiptNumber: '1234' },
      applicantTypes: [{ lastName: 'Primary', primaryApplicant: true, aNumber: primaryAnumber }],
      petitionerType: { aNumber: 'PET7' },
      letterType: {
        id: 'a93d7e92-a8c8-4791-a6ca-7d5aec52918f',
        formTypes: [
          { id: '888', name: 'F-123', code: 'F123', showPetitionerAnumber: true },
          { id: '999', name: 'N-300', code: 'N300', showPetitionerAnumber: false },
        ],
      },
    };

    const result = getApplicantOrPetitionerAnumber(draft);
    expect(result).toBe(primaryAnumber);
  });

  it('returns petitioner Anumber if noprimary applicant and showPetitioner flag is true', () => {
    const petitionerAnumber = 'PET7';
    const draft = {
      registration: { id: '1', formTypeName: 'F123', receiptNumber: '1234' },
      petitionerType: { aNumber: petitionerAnumber },
      letterType: {
        id: 'a93d7e92-a8c8-4791-a6ca-7d5aec52918f',
        formTypes: [
          { id: '888', name: 'F-123', code: 'F123', showPetitionerAnumber: true },
          { id: '999', name: 'N-300', code: 'N300', showPetitionerAnumber: false },
        ],
      },
    };

    const result = getApplicantOrPetitionerAnumber(draft);
    expect(result).toBe(petitionerAnumber);
  });
});
