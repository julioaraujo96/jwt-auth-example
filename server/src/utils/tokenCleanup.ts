import { prisma } from './db';

export const cleanupExpiredTokens = async (): Promise<number> => {
  try {
    const refreshLifetime = process.env.JWT_REFRESHLIFETIME || '7d';
    // Convert refresh lifetime to milliseconds
    const lifetimeMs = parseDuration(refreshLifetime);

    // Calculate cutoff time
    const cutoffDate = new Date(Date.now() - lifetimeMs);

    // Delete tokens created before the cutoff date
    const result = await prisma.refreshToken.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  } catch (error) {
    console.error('Error cleaning up tokens:', error);
    return 0;
  }
};

// Helper function to parse duration strings like "7d", "1h", etc.
function parseDuration(duration: string): number {
  const unit = duration.charAt(duration.length - 1);
  const value = parseInt(duration.slice(0, -1));

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000; // Default to 7 days
  }
}
