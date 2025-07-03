import prisma from '~/server/utils/prisma';

export default defineEventHandler(async (event) => {
  const habitId = event.context.params.id;
  const body = await readBody(event);
  const { date } = body;

  if (!date) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Date is required',
    });
  }

  try {
    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
      include: { completedDates: true },
    });

    if (!habit) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Habit not found',
      });
    }

    const existingCompletion = habit.completedDates.find(
      (cd) => cd.date.toISOString().split('T')[0] === date
    );

    if (existingCompletion) {
      // If already completed, remove it
      await prisma.completedDate.delete({
        where: { id: existingCompletion.id },
      });
    } else {
      // If not completed, add it
      await prisma.completedDate.create({
        data: {
          date: new Date(date),
          habit: {
            connect: { id: habitId },
          },
        },
      });
    }

    // Fetch the updated habit with completed dates
    const updatedHabit = await prisma.habit.findUnique({
      where: { id: habitId },
      include: { completedDates: true },
    });

    return updatedHabit;
  } catch (error) {
    console.error("Error toggling habit completion:", error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update habit completion',
    });
  }
});