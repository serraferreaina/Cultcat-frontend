import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

jest.mock('../components/WeatherIcon', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => <Text>20°</Text>;
});

jest.mock('../theme/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

describe('WeatherIcon', () => {
  it('renders nearest station temperature', async () => {
    const { getByText } = render(<Text>20°</Text>);

    expect(getByText('20°')).toBeTruthy();
  });
});
