require('dotenv').config();
const axios = require('axios');

async function getNutritionData(query) {
  const options = {
    method: 'POST',
    url: 'https://trackapi.nutritionix.com/v2/natural/nutrients',
    headers: {
      'x-app-id': process.env.NUTRITIONIX_APP_ID,
      'x-app-key': process.env.NUTRITIONIX_API_KEY,
      'Content-Type': 'application/json'
    },
    data: { query }
  };

  try {
    const response = await axios(options);
    return response.data;
  } catch (err) {
    console.error("Nutritionix API error:", err.response?.data || err.message);
    return null;
  }
}

module.exports = { getNutritionData };