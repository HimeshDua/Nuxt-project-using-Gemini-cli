import prisma from '~/server/utils/prisma';

export default defineEventHandler(async (event) => {
  try {
    const habits = await prisma.habit.findMany({
      include: {
        completedDates: true,
      },
    });
    return habits;
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to read habits data',
    });
  }
});