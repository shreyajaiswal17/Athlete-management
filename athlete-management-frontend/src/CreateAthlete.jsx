import React, { useState } from 'react';

const CreateAthlete = () => {
  const [formData, setFormData] = useState({
    name: '',
    sport: '',
    goal: '',
    age: '',
    gender: '',
    location: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(formData)
    try {
      const response = await fetch('http://localhost:3000/api/athlete/create', {
        method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData),

      });
      const data = await response.json();
   console.log("formData",formData);
   console.log("data",data);
      console.log(response);
       if (response.ok) {
        alert('Athlete created successfully!');
        setFormData({
          name: '',
          sport: '',
          goal: '',
          age: '',
          gender: '',
          location: ''
        });
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error:', error.message);
      alert('An error occurred while creating the athlete.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create Athlete</h2>
      <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} required />
      <input type="text" name="sport" placeholder="Sport" value={formData.sport} onChange={handleChange} required />
      <input type="text" name="goal" placeholder="Goal" value={formData.goal} onChange={handleChange} />
      <input type="number" name="age" placeholder="Age" value={formData.age} onChange={handleChange} />
      <input type="text" name="gender" placeholder="Gender" value={formData.gender} onChange={handleChange} />
      <input type="text" name="location" placeholder="Location" value={formData.location} onChange={handleChange} />
      <button type="submit">Create Athlete</button>
    </form>
  );
};

export default CreateAthlete;
