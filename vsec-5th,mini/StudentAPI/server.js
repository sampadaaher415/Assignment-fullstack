const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());

let students = [
    { id: 1, name: "Rahul", marks: 80 },
    { id: 2, name: "Priya", marks: 75 }
];

// Open homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Display students
app.get("/students", (req, res) => {
    res.json(students);
});

// Add student
app.post("/students", (req, res) => {
    students.push(req.body);
    res.send("Student added successfully");
});

// Update student
app.put("/students/:id", (req, res) => {
    const student = students.find(s => s.id === Number(req.params.id));

    if (!student) {
        return res.status(404).send("Student not found");
    }

    student.name = req.body.name;
    student.marks = req.body.marks;

    res.send("Student updated successfully");
});

// Delete student
app.delete("/students/:id", (req, res) => {
    const id = Number(req.params.id);
    const oldLength = students.length;

    students = students.filter(s => s.id !== id);

    if (oldLength === students.length) {
        return res.status(404).send("Student not found");
    }

    res.send("Student deleted successfully");
});

app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});