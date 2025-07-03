<template>
  <div class="calendar">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <button class="btn btn-sm btn-outline-secondary" @click="prevMonth">&lt;</button>
      <h4>{{ currentMonthName }} {{ currentYear }}</h4>
      <button class="btn btn-sm btn-outline-secondary" @click="nextMonth">&gt;</button>
    </div>

    <div class="calendar-grid">
      <div class="day-header" v-for="day in daysOfWeek" :key="day">{{ day }}</div>
      <div
        class="day-cell"
        v-for="(day, index) in calendarDays"
        :key="index"
        :class="{
          'empty': !day,
          'completed': day && isCompleted(day),
          'missed': day && isMissed(day),
          'today': day && isToday(day),
          'clickable': day && !isFuture(day)
        }"
        @click="day && !isFuture(day) && toggleCompletion(day)"
      >
        {{ day ? day.getDate() : '' }}
      </div>
    </div>

    <div v-if="missedDaysCount > 0" class="alert alert-warning mt-3">
      You missed {{ missedDaysCount }} days for this habit!
    </div>
    <div class="mt-3">
      <p>Current Streak: <strong>{{ currentStreak }} days</strong></p>
      <p>Longest Streak: <strong>{{ longestStreak }} days</strong></p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  habit: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['date-completed']);

const today = new Date();
const currentMonth = ref(today.getMonth());
const currentYear = ref(today.getFullYear());

watch(() => props.habit, () => {
  const now = new Date();
  currentMonth.value = now.getMonth();
  currentYear.value = now.getFullYear();
}, { immediate: true });

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const currentMonthName = computed(() => {
  return new Date(currentYear.value, currentMonth.value).toLocaleString('default', { month: 'long' });
});

const calendarDays = computed(() => {
  const days = [];
  const firstDayOfMonth = new Date(currentYear.value, currentMonth.value, 1);
  const lastDayOfMonth = new Date(currentYear.value, currentMonth.value + 1, 0);

  // Add empty cells for days before the 1st of the month
  for (let i = 0; i < firstDayOfMonth.getDay(); i++) {
    days.push(null);
  }

  // Add days of the month
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    days.push(new Date(currentYear.value, currentMonth.value, i));
  }

  return days;
});

const isCompleted = (date) => {
  return props.habit.completedDates.some(d => d.toDateString() === date.toDateString());
};

const isMissed = (date) => {
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return checkDate < todayDate && !isCompleted(date);
};

const isToday = (date) => {
  return date.toDateString() === today.toDateString();
};

const isFuture = (date) => {
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return checkDate > todayDate;
};

const missedDaysCount = computed(() => {
  let count = 0;
  calendarDays.value.forEach(day => {
    if (day && isMissed(day)) {
      count++;
    }
  });
  return count;
});

const toggleCompletion = async (date) => {
  const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD

  try {
    const response = await fetch(`/api/habits/${props.habit.id}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ date: formattedDate }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    emit('date-completed'); // Notify parent to re-fetch habits
  } catch (error) {
    console.error("Error toggling habit completion:", error);
  }
};

const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
};

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
};

const calculateStreaks = () => {
  const sortedDates = props.habit.completedDates
    .map(d => new Date(d.getFullYear(), d.getMonth(), d.getDate())) // Normalize to start of day
    .sort((a, b) => a.getTime() - b.getTime());

  let current = 0;
  let longest = 0;
  let lastDate = null;

  for (let i = 0; i < sortedDates.length; i++) {
    const currentDate = sortedDates[i];

    if (lastDate) {
      const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        current++;
      } else if (diffDays > 1) {
        current = 1;
      }
    } else {
      current = 1;
    }
    longest = Math.max(longest, current);
    lastDate = currentDate;
  }

  // Adjust for today if completed
  const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (isCompleted(todayNormalized)) {
    // If today is completed and it's the last date in the sorted list, current streak is accurate
    // If not, we need to check if the last completed date was yesterday
    if (sortedDates.length > 0) {
      const lastCompletedNormalized = sortedDates[sortedDates.length - 1];
      const diffTime = Math.abs(todayNormalized.getTime() - lastCompletedNormalized.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        // If last completed was yesterday, and today is completed, current streak is correct
      } else if (diffDays > 1 && !isCompleted(todayNormalized)) {
        // If today is completed but there was a gap, reset current streak to 1
        current = 1;
      }
    } else {
      current = 1; // Only today is completed
    }
  } else {
    // If today is not completed, and the last completed date was yesterday, current streak is that.
    // Otherwise, it's 0.
    if (sortedDates.length > 0) {
      const lastCompletedNormalized = sortedDates[sortedDates.length - 1];
      const yesterdayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
      if (lastCompletedNormalized.toDateString() === yesterdayNormalized.toDateString()) {
        // Current streak is the streak up to yesterday
      } else {
        current = 0;
      }
    } else {
      current = 0;
    }
  }

  return { current, longest };
};

const currentStreak = computed(() => calculateStreaks().current);
const longestStreak = computed(() => calculateStreaks().longest);

// Watch for changes in habit.completedDates to re-render calendar if needed
watch(() => props.habit.completedDates, () => {
  // No explicit action needed here, computed properties will react
}, { deep: true });
</script>

<style scoped>
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
  text-align: center;
}

.day-header {
  font-weight: bold;
  padding: 5px;
  background-color: #f0f0f0;
  border-radius: 5px;
}

.day-cell {
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 5px;
  cursor: default;
  background-color: #f8f9fa;
  transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;
}

.day-cell.clickable:hover {
  background-color: #e9ecef;
  cursor: pointer;
}

.day-cell.empty {
  background-color: transparent;
  border: none;
}

.day-cell.completed {
  background-color: #d4edda; /* Light green */
  border-color: #28a745;
  color: #155724;
}

.day-cell.missed {
  background-color: #f8d7da; /* Light red */
  border-color: #dc3545;
  color: #721c24;
}

.day-cell.today {
  border: 2px solid #007bff;
  background-color: #e0f7fa; /* Light blue */
  color: #004085;
  font-weight: bold;
}
</style>
