/** Short tactile tick on save/payment where supported. Silent no-op elsewhere. */
export function haptic(ms = 10) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(ms);
  } catch { /* unsupported */ }
}
