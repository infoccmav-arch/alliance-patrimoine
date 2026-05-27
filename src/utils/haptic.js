// Haptic feedback via Web Vibration API
export const haptic = {
  light:   () => navigator.vibrate?.([8]),
  medium:  () => navigator.vibrate?.([18]),
  heavy:   () => navigator.vibrate?.([30]),
  success: () => navigator.vibrate?.([10, 60, 10]),
  error:   () => navigator.vibrate?.([40, 30, 40]),
  tap:     () => navigator.vibrate?.([5]),
};
