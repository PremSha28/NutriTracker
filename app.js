require('dotenv').config();

const express = require('express');
const path = require('path');
const readline = require('readline');
const { MongoClient } = require('mongodb');

const app = express();
const portNum = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'templates'));

const username = process.env.MONGO_DB_USERNAME;
const password = encodeURIComponent(process.env.MONGO_DB_PASSWORD);
const cluster = process.env.MONGO_CLUSTER;
const dbName = process.env.MONGO_DB_NAME;
const collectionName = process.env.MONGO_COLLECTION;

const uri = `mongodb+srv://${username}:${password}@${cluster}/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

let db, mealsCollection;

async function connectToDB() {
  try {
    await client.connect();
    db = client.db(dbName);
    mealsCollection = db.collection(collectionName);
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}
connectToDB();

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/test-db', async (req, res) => {
  try {
    const count = await mealsCollection.countDocuments();
    res.send(`MongoDB connected — you have ${count} meal(s) logged.`);
  } catch (err) {
    res.status(500).send("Could not read from MongoDB");
  }
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${portNum}`);
  rl.setPrompt("Stop to shutdown the server: ");
  rl.prompt();
});

rl.on('line', (input) => {
  if (input.trim().toLowerCase() === 'stop') {
    console.log("Shutting down the server");
    rl.close();
    client.close();
    process.exit(0);
  }
});



app.get('/log', (req, res) => {
    res.render('logMeal');
  });
  
  const { getNutritionData } = require('./nutrition');
  
  app.post('/log', async (req, res) => {
    const userInput = req.body.food;
    try {
      const data = await getNutritionData(userInput);
  
      if (!data || !data.foods || data.foods.length === 0) {
        return res.send("No nutrition data found.");
      }
  
      const food = data.foods[0];
  
      const meal = {
        name: food.food_name,
        calories: food.nf_calories,
        protein: food.nf_protein,
        fat: food.nf_total_fat,
        carbs: food.nf_total_carbohydrate,
        date: new Date()
      };
  
      await mealsCollection.insertOne(meal);
  
      res.send(`
  <h2>Meal Logged</h2>
  <p><strong>${meal.name}</strong></p>
  <ul>
    <li>Calories: ${meal.calories}</li>
    <li>Protein: ${meal.protein}g</li>
    <li>Fat: ${meal.fat}g</li>
    <li>Carbohydrates: ${meal.carbs}g</li>
  </ul>
  <a href="/log">Log another meal</a> | <a href="/">Home</a>
`);
    } catch (err) {
      console.error("Error in log:", err);
      res.status(500).send("Something went wrong.");
    }
  });


  app.get('/meals', async (req, res) => {
    try {
      const meals = await mealsCollection.find().sort({ date: -1 }).toArray();
      res.render('viewMeals', { meals });
    } catch (err) {
      console.error("Error fetching meals:", err);
      res.status(500).send("Error retrieving meals.");
    }
  });

  app.post('/clear', async (req, res) => {
    try {
      await mealsCollection.deleteMany({});
      res.redirect('/meals');
    } catch (err) {
      res.status(500).send("Could not clear meals.");
    }
  });

