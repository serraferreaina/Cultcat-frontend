import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ThemeToggle } from '../components/ThemeToggle';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Soft: 'soft' },
}));

describe('ThemeToggle', () => {
  it('triggers onToggle when pressed', async () => {
    const onToggle = jest.fn();
    const { getByTestId } = render(
      <ThemeToggle theme="light" accentColor="#000" onToggle={onToggle} />,
    );

    fireEvent.press(getByTestId('theme-toggle'));

    await waitFor(() => expect(onToggle).toHaveBeenCalled());
  });
});
