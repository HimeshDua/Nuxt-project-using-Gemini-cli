import prisma from '~/server/utils/prisma';

export default defineEventHandler(async (event) => {
  const habitId = event.context.params.id;

  try {
    await prisma.habit.delete({
      where: { id: habitId },
    });
    return { message: 'Habit deleted successfully' };
  } catch (error) {
    if (error.code === 'P2025') { // Prisma error code for record not found
      throw createError({
        statusCode: 404,
        statusMessage: 'Habit not found',
      });
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete habit',
    });
  }
});