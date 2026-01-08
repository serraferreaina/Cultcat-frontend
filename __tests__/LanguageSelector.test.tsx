import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { LanguageSelector } from '../components/LanguageSelector';
import { Animated } from 'react-native';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Soft: 'soft' },
}));

describe('LanguageSelector', () => {
  const colors = {
    accent: '#000',
    card: '#fff',
    text: '#111',
    border: '#222',
  };

  let timingSpy: jest.SpyInstance;
  let springSpy: jest.SpyInstance;
  let parallelSpy: jest.SpyInstance;
  let sequenceSpy: jest.SpyInstance;
  let loopSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();

    timingSpy = jest.spyOn(Animated, 'timing').mockImplementation(
      (_, __) =>
        ({
          start: (cb?: () => void) => cb && cb(),
        }) as any,
    );

    springSpy = jest.spyOn(Animated, 'spring').mockImplementation(
      (_, __) =>
        ({
          start: (cb?: () => void) => cb && cb(),
        }) as any,
    );

    parallelSpy = jest.spyOn(Animated, 'parallel').mockImplementation(
      (anims: any[]) =>
        ({
          start: (cb?: () => void) => {
            anims.forEach((a) => a?.start?.());
            cb && cb();
          },
        }) as any,
    );

    sequenceSpy = jest.spyOn(Animated, 'sequence').mockImplementation(
      (anims: any[]) =>
        ({
          start: (cb?: () => void) => {
            anims.forEach((a) => a?.start?.());
            cb && cb();
          },
        }) as any,
    );

    loopSpy = jest.spyOn(Animated, 'loop').mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
    } as any);
  });

  afterEach(() => {
    timingSpy.mockRestore();
    springSpy.mockRestore();
    parallelSpy.mockRestore();
    sequenceSpy.mockRestore();
    loopSpy.mockRestore();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('changes language when an option is selected', async () => {
    const onLanguageChange = jest.fn();
    const { getByText, queryByText } = render(
      <LanguageSelector currentLanguage="en" colors={colors} onLanguageChange={onLanguageChange} />,
    );

    await act(async () => {
      fireEvent.press(getByText('English'));
      jest.runAllTimers();
    });

    const spanishOption = getByText('Español');
    expect(spanishOption).toBeTruthy();

    await act(async () => {
      fireEvent.press(spanishOption);
      jest.runAllTimers();
    });

    expect(onLanguageChange).toHaveBeenCalledWith('es');
    expect(queryByText('Español')).toBeNull();
  });
});
