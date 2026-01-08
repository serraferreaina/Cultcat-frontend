import React from 'react';
import { render } from '@testing-library/react-native';
import ChatBubble from '../components/ChatBubble';

jest.mock('../theme/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

jest.mock('../components/EventShareBubble', () => {
  const ReactNative = jest.requireActual('react-native');
  const { Text } = ReactNative;
  return function MockEventShareBubble({ eventData, senderName }: any) {
    return (
      <Text testID="event-share">
        Shared event: {eventData?.title || 'unknown'} by {senderName || 'unknown'}
      </Text>
    );
  };
});

describe('ChatBubble', () => {
  it('renders a regular text message', () => {
    const message = {
      id: '1',
      text: 'Hello there',
      sender: 'me' as const,
    };

    const { getByText, queryByTestId } = render(<ChatBubble message={message} />);

    expect(getByText('Hello there')).toBeTruthy();
    expect(queryByTestId('event-share')).toBeNull();
  });

  it('renders sender info for other users', () => {
    const message = {
      id: '2',
      text: 'Hi team',
      sender: 'other' as const,
      senderName: 'Alex',
    };

    const { getByText } = render(<ChatBubble message={message} />);

    expect(getByText('Alex')).toBeTruthy();
    expect(getByText('Hi team')).toBeTruthy();
  });

  it('uses the event share bubble when the message contains an event share payload', () => {
    const message = {
      id: '3',
      text: JSON.stringify({ type: 'event_share', title: 'Concert Night' }),
      sender: 'other' as const,
      senderName: 'Jamie',
    };

    const { getByTestId, getByText } = render(<ChatBubble message={message} />);

    expect(getByTestId('event-share')).toBeTruthy();
    expect(getByText(/Concert Night/i)).toBeTruthy();
  });
});
