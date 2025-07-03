<template>
  <div class="card mb-4">
    <div class="card-header">
      <h4>Create New Habit</h4>
    </div>
    <div class="card-body">
      <form @submit.prevent="createHabit">
        <div class="mb-3">
          <label for="habitName" class="form-label">Habit Name</label>
          <input type="text" class="form-control" id="habitName" v-model="newHabitName" required>
        </div>
        <button type="submit" class="btn btn-success">Add Habit</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const newHabitName = ref('');
const emit = defineEmits(['habit-created']);

const createHabit = async () => {
  try {
    const response = await fetch('/api/habits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: newHabitName.value }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const habit = await response.json();
    console.log('Habit created:', habit);
    newHabitName.value = '';
    emit('habit-created', habit);
  } catch (error) {
    console.error("Error creating habit:", error);
  }
};
</script>
