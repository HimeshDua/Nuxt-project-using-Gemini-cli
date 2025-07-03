<template>
  <div class="container mt-5">
    <h1 class="mb-4">Habit Tracker</h1>
    <HabitForm @habit-created="fetchHabits" />
    <hr />
    <div v-if="habits.length > 0">
      <div v-for="habit in habits" :key="habit.id" class="card mb-3">
        <div
          class="card-header d-flex justify-content-between align-items-center"
        >
          <div v-if="!habit.isEditing">
            <h5>{{ habit.name }}</h5>
          </div>
          <div v-else class="d-flex align-items-center flex-grow-1">
            <input
              type="text"
              class="form-control form-control-sm me-2"
              v-model="habit.editedName"
            />
            <button class="btn btn-sm btn-success me-2" @click="saveHabit(habit)">
              Save
            </button>
            <button class="btn btn-sm btn-secondary" @click="cancelEdit(habit)">
              Cancel
            </button>
          </div>
          <div>
            <button
              class="btn btn-sm btn-info me-2"
              @click="editHabit(habit)"
              v-if="!habit.isEditing"
            >
              Edit
            </button>
            <button
              class="btn btn-sm btn-danger me-2"
              @click="deleteHabit(habit.id)"
              v-if="!habit.isEditing"
            >
              Delete
            </button>
            <button
              class="btn btn-sm btn-primary"
              @click="toggleCalendar(habit.id)"
            >
              {{ showCalendar[habit.id] ? 'Hide Calendar' : 'Show Calendar' }}
            </button>
          </div>
        </div>
        <div class="card-body" v-if="showCalendar[habit.id]">
          <Calendar :habit="habit" @date-completed="fetchHabits" />
        </div>
      </div>
    </div>
    <div v-else class="alert alert-info">No habits yet. Create one above!</div>
  </div>
</template>

<script setup>
import {ref, onMounted} from 'vue';
import HabitForm from '~/components/HabitForm.vue';
import Calendar from '~/components/Calendar.vue';

const habits = ref([]);
const showCalendar = ref({});

const fetchHabits = async () => {
  try {
    const response = await fetch('/api/habits');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    habits.value = await response.json();
    habits.value.forEach((habit) => {
      if (habit.completedDates) {
        habit.completedDates = habit.completedDates.map((d) => new Date(d));
      } else {
        habit.completedDates = [];
      }
      habit.isEditing = false; // Add editing state
      habit.editedName = habit.name; // Store original name for editing
    });
  } catch (error) {
    console.error('Error fetching habits:', error);
  }
};

const toggleCalendar = (habitId) => {
  showCalendar.value[habitId] = !showCalendar.value[habitId];
};

const deleteHabit = async (habitId) => {
  if (confirm('Are you sure you want to delete this habit?')) {
    try {
      const response = await fetch(`/api/habits/${habitId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Habit deleted:', habitId);
      fetchHabits(); // Re-fetch habits to update the list
    } catch (error) {
      console.error("Error deleting habit:", error);
    }
  }
};

const editHabit = (habit) => {
  habit.isEditing = true;
  habit.editedName = habit.name; // Reset editedName to current name
};

const saveHabit = async (habit) => {
  try {
    const response = await fetch(`/api/habits/${habit.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: habit.editedName }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('Habit updated:', habit);
    habit.name = habit.editedName;
    habit.isEditing = false;
  } catch (error) {
    console.error("Error updating habit:", error);
  }
};

const cancelEdit = (habit) => {
  habit.isEditing = false;
  habit.editedName = habit.name; // Revert to original name
};

onMounted(() => {
  fetchHabits();
});
</script>
