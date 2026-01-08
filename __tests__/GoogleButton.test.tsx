import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import GoogleButton from '../components/GoogleButton';

describe('GoogleButton', () => {
  it('calls onPress when enabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(<GoogleButton onPress={onPress} />);

    fireEvent.press(getByText('Continuar amb Google'));

    expect(onPress).toHaveBeenCalled();
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(<GoogleButton onPress={onPress} disabled />);

    fireEvent.press(getByText('Continuar amb Google'));

    expect(onPress).not.toHaveBeenCalled();
  });
});
