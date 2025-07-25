import primaryApplicant from './DraftSerializerUtil';

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
