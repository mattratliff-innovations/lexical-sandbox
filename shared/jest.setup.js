// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import 'jest-canvas-mock';
import { enableFetchMocks } from 'jest-fetch-mock';

jest.mock('../src/pages/admin/flag/FeatureFlagsProvider', () => ({
  useFeatureFlags: () => ({
    featureFlags: [
      {
        id: 'spell_check',
        name: 'spell_check',
        description: 'Enables the Scribe Spell Checker in Lexical',
        state: false, // Default to off in tests
      },
      {
        id: 'endnotes',
        name: 'endnotes',
        description: 'Enables the Endnotes feature in Lexical',
        state: false, // Default to off in tests
      },
    ],
    lastUpdatedDate: null,
    refreshFlags: jest.fn(),
    hasFlag: jest.fn(),
  }),
  FeatureFlagsProvider: ({ children }) => children,
}));

enableFetchMocks();

window.PointerEvent = MouseEvent;

const defBP = customElements.define;

customElements.define = (name, constructor) => {
  try {
    defBP.call(customElements, name, constructor);
  } catch (e) {
    // This is necessary because App.test.jsx throws errors saying that SOMETHING (in our case a DrButton)
    // has already been defined. The Druid team will hopefully add a fix for this soon(ish).
    if (e instanceof DOMException && e.name === 'NotSupportedError' && e.message.includes('name has already been registered')) {
      console.info('Web Component has already been registered, ignoring duplicate register call');
    } else throw e;
  }
};

Object.defineProperty(Element.prototype, 'attachInternals', {
  value() {
    return {
      setFormValue: jest.fn(),
    };
  },
});

// JSDom does not support window.scrollTo
global.scrollTo = jest.fn();
global.__APP_VERSION_BUILD__ = '1.0.0';
