import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { NextButton } from '../components/NextButton';
import { Animated } from 'react-native';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Heavy: 'heavy', Medium: 'medium' },
}));

describe('NextButton', () => {
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

    loopSpy = jest.spyOn(Animated, 'loop').mockReturnValue({ start: jest.fn() } as any);
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

  it('invokes onPress after press sequence', async () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<NextButton accentColor="#123" onPress={onPress} />);

    const button = getByTestId('next-button');
    await act(async () => {
      fireEvent(button, 'pressIn');
      jest.advanceTimersByTime(100);
      fireEvent(button, 'pressOut');
      await Promise.resolve();
      jest.runAllTimers();
    });

    expect(onPress).toHaveBeenCalled();
  });
});
