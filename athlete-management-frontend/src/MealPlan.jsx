


import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const MealPlan = () => {
  const { id } = useParams();
  const [mealPlanInput, setMealPlanInput] = useState({ height: '', weight: '', goal: '' });
  const [mealPlan, setMealPlan] = useState(null);
  const [mealPlanError, setMealPlanError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  function handleMealPlanInputChange(e) {
    const { name, value } = e.target;
    setMealPlanInput((prev) => ({ ...prev, [name]: value }));
  }

  const generateMealPlan = async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/nutrition/meal-plan`, {
        athleteId: id,
        height: parseFloat(mealPlanInput.height),
        weight: parseFloat(mealPlanInput.weight),
        goal: mealPlanInput.goal,
      });
      setMealPlan(response.data);
      setMealPlanError(null);
      setSubmitted(true);
    } catch (err) {
      console.error('Error generating meal plan:', err);
      setMealPlanError('Failed to generate meal plan. Please check your inputs.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001f3f] via-[#003566] to-[#000814] text-white px-6 py-10">
      <h1 className="text-3xl font-bold mb-8 text-center tracking-wide">🍽️ Personalized Meal Plan</h1>

      {!submitted && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Height (cm)</label>
              <input
                type="number"
                name="height"
                value={mealPlanInput.height}
                onChange={handleMealPlanInputChange}
                className="block w-full bg-white/5 text-white border border-gray-600 rounded-md p-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter height"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Weight (kg)</label>
              <input
                type="number"
                name="weight"
                value={mealPlanInput.weight}
                onChange={handleMealPlanInputChange}
                className="block w-full bg-white/5 text-white border border-gray-600 rounded-md p-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter weight"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Goal</label>
              <select
                name="goal"
                value={mealPlanInput.goal}
                onChange={handleMealPlanInputChange}
                className="block w-full bg-white/5 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Select Goal</option>
                <option value="weight loss">Weight Loss</option>
                <option value="muscle gain">Muscle Gain</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={generateMealPlan}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg shadow-lg transition"
            >
              Generate Meal Plan
            </button>
          </div>

          {mealPlanError && (
            <p className="text-red-400 mt-6 text-center bg-red-900/20 p-3 rounded border border-red-600 max-w-xl mx-auto">
              {mealPlanError}
            </p>
          )}
        </>
      )}

      {submitted && mealPlan && (
        <div className="mt-6 bg-white/10 backdrop-blur-xl rounded-xl p-6 shadow-xl space-y-4 text-sm border border-blue-800">
          <h3 className="text-lg font-semibold text-white border-b border-gray-600 pb-2">Weekly Meal Plan</h3>

          <p className="text-gray-300 text-sm">
            <strong className="text-blue-300">Total Calories:</strong> {mealPlan.totalCalories}
          </p>
          <p className="text-gray-300 text-sm">
            <strong className="text-blue-300">Macronutrients:</strong> Protein: {mealPlan.macronutrients.protein}g,
            Carbs: {mealPlan.macronutrients.carbs}g, Fats: {mealPlan.macronutrients.fats}g
          </p>

          {mealPlan.weeklyMealPlan.map((dayPlan, index) => (
            <div key={index} className="bg-[#001F3F]/50 p-3 rounded-lg border border-gray-600">
              <h4 className="text-md font-semibold text-white mb-2">{dayPlan.day}</h4>
              <ul className="space-y-1 pl-4 list-disc text-gray-300 text-sm">
                {dayPlan.meals.map((meal, mealIndex) => (
                  <li key={mealIndex}>
                    <span className="font-medium">{meal.title}</span> — {meal.readyInMinutes} min, {meal.servings} servings
                    <a
                      href={meal.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline ml-2 text-sm"
                    >
                      View Recipe
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MealPlan;
