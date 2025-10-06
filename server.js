const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve games folder
app.use("/games", express.static(path.join(__dirname, "games")));

// Serve assets folder
app.use("/assets", express.static(path.join(__dirname, "assets")));

// Serve home folder
app.use("/", express.static(path.join(__dirname, "home")));

// Default route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "home", "index.html"));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
