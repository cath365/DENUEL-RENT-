export function isDatabaseUnavailableError(error: unknown) {
  const message =
    error instanceof Error ? error.message : String(error ?? '');

  return (
    message.includes("Can't reach database server") ||
    message.includes('P1001') ||
    message.includes('railway.internal') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ETIMEDOUT')
  );
}

export function publicServerError(error: unknown, fallback = 'Something went wrong. Please try again.') {
  if (isDatabaseUnavailableError(error)) {
    return {
      message: 'Database temporarily unavailable. Please try again shortly.',
      status: 503,
    };
  }

  return {
    message: fallback,
    status: 500,
  };
}
