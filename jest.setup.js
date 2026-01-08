// Silence act() warnings from icon components by mocking expo vector icons to simple views
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  const createIcon = (name) => (props) =>
    React.createElement(View, { ...props, accessibilityLabel: name });
  return new Proxy(
    {},
    {
      get: (_, prop) => createIcon(String(prop)),
    },
  );
});
