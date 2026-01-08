import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { UserCard } from '../components/UserCard';

jest.mock('../theme/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

describe('UserCard', () => {
  const baseUser = {
    username: 'Jane',
    profilePic: '',
    bio: 'Hello world',
  };

  it('renders username and bio', () => {
    const { getByText } = render(<UserCard user={baseUser} />);

    expect(getByText('Jane')).toBeTruthy();
    expect(getByText('Hello world')).toBeTruthy();
  });

  it('uses default avatar when profilePic is missing', () => {
    const user = { ...baseUser, profilePic: '' };
    const { getByTestId } = render(<UserCard user={user} />);

    const image = getByTestId('user-avatar');
    expect(image.props.source.uri).toContain('profile_pics');
  });

  it('fires onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(<UserCard user={baseUser} onPress={onPress} />);

    fireEvent.press(getByText('Jane'));

    expect(onPress).toHaveBeenCalled();
  });
});
