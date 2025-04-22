import React, { useState} from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const MealPlan = () => {
  const { id } = useParams();
  const [mealPlanInput, setMealPlanInput] = useState({ height: '', weight: '', goal: '' });
  const [mealPlan, setMealPlan] = useState(null);
  const [mealPlanError, setMealPlanError] = useState(null);

  function handleMealPlanInputChange(e) {
    const { name, value } = e.target;
    setMealPlanInput((prev) => ({ ...prev, [name]: value }));
  }

  const generateMealPlan = async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/nutrition/meal-plan`, {
        athleteId:id,
        height: parseFloat(mealPlanInput.height),
        weight: parseFloat(mealPlanInput.weight),
        goal: mealPlanInput.goal,
      });
      setMealPlan(response.data);
      setMealPlanError(null);
    } catch (err) {
      console.error('Error generating meal plan:', err);
      setMealPlanError('Failed to generate meal plan. Please check your inputs.');
    }
  };

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-300">Height (cm)</label>
        <input
          type="number"
          name="height"
          value={mealPlanInput.height}
          onChange={handleMealPlanInputChange}
          className="mt-1 block w-full bg-gradient-to-br from-[#023E8A] via-[#0077B6] to-[#000000] text-white border border-gray-600 rounded-md p-2"
          placeholder="Enter height in cm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300">Weight (kg)</label>
        <input
          type="number"
          name="weight"
          value={mealPlanInput.weight}
          onChange={handleMealPlanInputChange}
          className="mt-1 block w-full bg-gray-700 text-white border border-gray-600 rounded-md p-2"
          placeholder="Enter weight in kg"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300">Goal</label>
        <select
          name="goal"
          value={mealPlanInput.goal}
          onChange={handleMealPlanInputChange}
          className="mt-1 block w-full bg-gray-700 text-white border border-gray-600 rounded-md p-2"
        >
          <option value="">Select Goal</option>
          <option value="weight loss">Weight Loss</option>
          <option value="muscle gain">Muscle Gain</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      <button
        onClick={generateMealPlan}
        className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
      >
        Generate Meal Plan
      </button>
      {mealPlanError && <p className="text-red-400 mt-2">{mealPlanError}</p>}
      {mealPlan && (
        <div className="mt-4">
          <h3 className="text-lg font-medium text-blue-400">Weekly Meal Plan</h3>
          <p className="mt-2 text-gray-300">Total Calories: {mealPlan.totalCalories}</p>
          <p className="mt-2 text-gray-300">
            Macronutrients: Protein: {mealPlan.macronutrients.protein}, Carbs: {mealPlan.macronutrients.carbs}, Fats: {mealPlan.macronutrients.fats}
          </p>
          <div className="mt-4">
            {mealPlan.weeklyMealPlan.map((dayPlan, index) => (
              <div key={index} className="mb-4">
                <h4 className="text-md font-semibold text-teal-400 capitalize">{dayPlan.day}</h4>
                <ul className="list-disc pl-5 mt-2">
                  {dayPlan.meals.map((meal, mealIndex) => (
                    <li key={mealIndex} className="text-gray-300">
                      <strong>{meal.title}</strong> - Ready in {meal.readyInMinutes} minutes, Servings: {meal.servings}
                      <a
                        href={meal.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline ml-2"
                      >
                        View Recipe
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default MealPlan;
