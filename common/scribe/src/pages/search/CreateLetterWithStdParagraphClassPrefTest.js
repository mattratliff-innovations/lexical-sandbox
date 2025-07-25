import { within, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

export default function CreateLetterWithStdParagraphClassPref(
  mockLetterTypesApiCall,
  mockClassPreferencesApiCall,
  mockCreateApiCall,
  mockAvailableStdParagraphsLetterTypeApiCall,
  mockAvailableStdParagraphsClassPrefApiCall,
  renderComponent,
  standardParagraphData,
  letterTypesData,
  classPreferencesData,
  formTypesData = null,
  mockFormTypesApiCall = null
) {
  describe('Standard Paragraph with Class Preference', () => {
    beforeEach(() => {
      if (formTypesData) {
        mockFormTypesApiCall(formTypesData);
      }
      mockLetterTypesApiCall(letterTypesData);
      mockClassPreferencesApiCall(classPreferencesData);
      mockCreateApiCall({});
    });

    const checkParagraphs = async (paragraphs, shouldBePresent) => {
      const availableParagraphDiv = screen.queryByTestId('available-standard-paragraphs-div');
      await Promise.all(
        paragraphs.map(async (paragraph) => {
          if (shouldBePresent) {
            const query = within(availableParagraphDiv).findByText(`${paragraph.name} | ${paragraph.code}`);
            expect(await query).toBeInTheDocument();
          } else {
            const query = within(availableParagraphDiv).queryByText(`${paragraph.name} | ${paragraph.code}`);
            expect(query).not.toBeInTheDocument();
          }
        })
      );
    };

    it('shows filtered standard-paragraphs with Class Preference selection', async () => {
      renderComponent();
      const userInstance = userEvent.setup();

      if (formTypesData) {
        await userInstance.selectOptions(await screen.findByLabelText(/Choose Form Type/), formTypesData[0].name);
      }

      // Selecting Letter Type only, should see all SP
      mockAvailableStdParagraphsLetterTypeApiCall(standardParagraphData);
      await userInstance.selectOptions(await screen.findByLabelText(/Choose Letter Type/), letterTypesData[0].name);
      await checkParagraphs(standardParagraphData, true);

      // Selecting Letter Type & Selecting Class Preference, should see SP1 & SP3
      mockAvailableStdParagraphsClassPrefApiCall([standardParagraphData[0], standardParagraphData[2]]);
      await userInstance.selectOptions(await screen.findByLabelText(/Choose Class Preference/), classPreferencesData[0].name);
      await checkParagraphs([standardParagraphData[0], standardParagraphData[2]], true);
      await checkParagraphs([standardParagraphData[1]], false);

      // Selecting a different Class Preference, should see SP2 only
      mockAvailableStdParagraphsClassPrefApiCall([standardParagraphData[1]]);
      await userInstance.selectOptions(await screen.findByLabelText(/Choose Class Preference/), classPreferencesData[1].name);
      await checkParagraphs([standardParagraphData[1]], true);
      await checkParagraphs([standardParagraphData[0], standardParagraphData[2]], false);

      // Selecting no Class Preference, should see all the original SPs
      mockAvailableStdParagraphsClassPrefApiCall([]);
      await userInstance.selectOptions(await screen.findByLabelText(/Choose Class Preference/), '--- Select Class Preference ---');
      await checkParagraphs(standardParagraphData, true);
    });

    it('allows standard-paragraphs selection with Class Preference', async () => {
      renderComponent();
      const userInstance = userEvent.setup();
      mockAvailableStdParagraphsLetterTypeApiCall(standardParagraphData);
      mockAvailableStdParagraphsClassPrefApiCall([standardParagraphData[0], standardParagraphData[2]]);

      if (formTypesData) {
        await userInstance.selectOptions(await screen.findByLabelText(/Choose Form Type/), formTypesData[0].name);
      }
      await userInstance.selectOptions(await screen.findByLabelText(/Choose Letter Type/), letterTypesData[0].name);

      // included paragraph bin is empty to start
      let includedParagraphDiv = screen.queryByTestId('included-standard-paragraphs-div');
      expect(includedParagraphDiv).toBeNull();

      // select the only 2 paragraphs within available bin
      await userInstance.click(screen.getByTestId(`available-standard-paragraph-${standardParagraphData[0].id}`));
      await userInstance.click(screen.getByTestId(`available-standard-paragraph-${standardParagraphData[2].id}`));

      // included paragraph bin should be availabled
      includedParagraphDiv = screen.getByTestId('included-standard-paragraphs-div');
      expect(
        await within(includedParagraphDiv).findByText(`${standardParagraphData[0].name} | ${standardParagraphData[0].code}`)
      ).toBeInTheDocument();
      expect(within(includedParagraphDiv).queryByText(`${standardParagraphData[1].name} | ${standardParagraphData[1].code}`)).not.toBeInTheDocument(); // got filtered out
      expect(
        await within(includedParagraphDiv).findByText(`${standardParagraphData[2].name} | ${standardParagraphData[2].code}`)
      ).toBeInTheDocument();

      // available paragraph bin should be empty
      const availableParagraphDiv = screen.getByTestId('available-standard-paragraphs-div');
      expect(await within(availableParagraphDiv).findByText('No Associated Standard Paragraphs')).toBeInTheDocument();
    });

    it('Disables or enables Class Preference upon Letter Type selection', async () => {
      renderComponent();
      const userInstance = userEvent.setup();

      if (formTypesData) {
        await userInstance.selectOptions(await screen.findByLabelText(/Choose Form Type/), formTypesData[0].name);
      }

      // Class Preference is initially disabled
      expect(await screen.findByTestId('classPreferenceId')).toBeDisabled();

      // Class Preference is enabled after changing Letter Type
      mockAvailableStdParagraphsLetterTypeApiCall(standardParagraphData);
      await userInstance.selectOptions(await screen.findByLabelText(/Choose Letter Type/), letterTypesData[1].name);
      expect(await screen.findByTestId('classPreferenceId')).not.toBeDisabled();

      // Selecting '--- Select Letter Type ---', should see no SP
      mockAvailableStdParagraphsLetterTypeApiCall([]);
      await userInstance.selectOptions(await screen.findByLabelText(/Choose Letter Type/), '--- Select Letter Type ---');

      const availableParagraphDiv = screen.queryByTestId('available-standard-paragraphs-div');
      expect(await within(availableParagraphDiv).findByText('No Associated Standard Paragraphs')).toBeInTheDocument();

      // Class Preference is again disabled
      expect(await screen.findByTestId('classPreferenceId')).toBeDisabled();
    });
  });
}
