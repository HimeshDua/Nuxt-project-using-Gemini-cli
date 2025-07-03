import prisma from '~/server/utils/prisma';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { name } = body;

  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Habit name is required',
    });
  }

  try {
    const newHabit = await prisma.habit.create({
      data: {
        name,
      },
    });
    return newHabit;
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create habit',
    });
  }
});