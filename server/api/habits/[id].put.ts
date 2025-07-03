import prisma from '~/server/utils/prisma';

export default defineEventHandler(async (event) => {
  const habitId = event.context.params.id;
  const body = await readBody(event);
  const { name } = body;

  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Habit name is required',
    });
  }

  try {
    const updatedHabit = await prisma.habit.update({
      where: { id: habitId },
      data: { name },
    });
    return updatedHabit;
  } catch (error) {
    if (error.code === 'P2025') { // Prisma error code for record not found
      throw createError({
        statusCode: 404,
        statusMessage: 'Habit not found',
      });
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update habit',
    });
  }
});