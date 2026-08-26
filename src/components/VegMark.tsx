import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { Diet } from '../utils/diet';

// The worldwide veg/non-veg mark: a square outline with a filled dot inside —
// green for vegetarian, maroon/red for non-vegetarian. Purely presentational.
const VEG = '#3C8C3C';
const NONVEG = '#B00020';

interface Props {
  diet: Diet;
  size?: number;
}

export const VegMark: React.FC<Props> = ({ diet, size = 16 }) => {
  const color = diet === 'nonveg' ? NONVEG : VEG;
  const dot = size * 0.5;
  return (
    <View
      style={[
        styles.box,
        { width: size, height: size, borderRadius: size * 0.18, borderColor: color },
      ]}
      accessibilityLabel={diet === 'nonveg' ? 'Non-vegetarian' : 'Vegetarian'}
    >
      <View style={{ width: dot, height: dot, borderRadius: dot / 2, backgroundColor: color }} />
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});

export default VegMark;
