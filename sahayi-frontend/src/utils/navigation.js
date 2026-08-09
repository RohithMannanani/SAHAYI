/**
 * Dynamic back navigation helper based on browser history.
 * @param {Function} navigate - React Router's navigate function
 * @param {string} fallback - Fallback route if no previous history exists
 */
export const handleDynamicBack = (navigate, fallback = '/') => {
  // Check if browser history has a previous entry created by React Router or browser session
  const hasPreviousState = window.history.state && typeof window.history.state.idx === 'number'
    ? window.history.state.idx > 0
    : window.history.length > 1;

  if (hasPreviousState) {
    navigate(-1);
  } else if (fallback) {
    navigate(fallback);
  } else {
    navigate(-1);
  }
};
