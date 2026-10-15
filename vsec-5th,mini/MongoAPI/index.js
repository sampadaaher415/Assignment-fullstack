
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const PORT = 5000;

app.use(express.json());

const client = new MongoClient("mongodb://127.0.0.1:27017");

let students;

async function startServer() {
  try {
    await client.connect();

    const db = client.db("college");
    students = db.collection("students");

    console.log("Connected to MongoDB!");

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
  }
}

app.get("/", (req, res) => {
  res.send("Welcome to MongoAPI Student Management System!");
});

app.get("/students", async (req, res) => {
  try {
    const result = await students.find().toArray();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/students", async (req, res) => {
  try {
    const { name, age, course } = req.body;

    if (!name || age == null || !course) {
      return res.status(400).json({
        message: "Please provide name, age, and course."
      });
    }

    const result = await students.insertOne({
      name,
      age: Number(age),
      course
    });

    res.status(201).json({
      message: "Student added successfully!",
      studentId: result.insertedId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/students/:id", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid student ID." });
    }

    const { name, age, course } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name;
    if (age !== undefined) updates.age = Number(age);
    if (course !== undefined) updates.course = course;

    const result = await students.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Student not found." });
    }

    res.json({ message: "Student updated successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/students/:id", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid student ID." });
    }

    const result = await students.deleteOne({
      _id: new ObjectId(req.params.id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Student not found." });
    }

    res.json({ message: "Student deleted successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

startServer();
