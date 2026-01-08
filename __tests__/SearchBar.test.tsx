import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import SearchBar from '../components/SearchBar';

jest.mock('../theme/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('SearchBar', () => {
  it('calls onSearch when submitting non-empty text', () => {
    const onSearch = jest.fn();
    const { getByPlaceholderText } = render(<SearchBar onSearch={onSearch} />);

    const input = getByPlaceholderText('search');
    fireEvent.changeText(input, ' Hello ');
    fireEvent(input, 'submitEditing');

    expect(onSearch).toHaveBeenCalledWith('Hello');
  });

  it('uses controlled value and onChangeText', () => {
    const onChangeText = jest.fn();
    const { getByDisplayValue, getByPlaceholderText } = render(
      <SearchBar value="test" onChangeText={onChangeText} />,
    );

    const input = getByDisplayValue('test');
    fireEvent.changeText(input, 'updated');

    expect(onChangeText).toHaveBeenCalledWith('updated');
  });
});
