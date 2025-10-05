import { DatabaseSync } from "node:sqlite";

// Create a new database
const db = new DatabaseSync("invoice.db");

// Create the users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Insert sample users
const testUsers = [
  ["test", "$2a$10$Aj8kkwrul89SOQ4.IqrA.OV.GxFBnC9TvXSTJDUNd1TN7uqEEM.U6"] // password is "test"
];

const userStmt = db.prepare("INSERT INTO users (username, password) VALUES (:username, :password)");

for (const [username, password] of testUsers) {
  userStmt.run({ username, password });
}

console.log("Database setup complete!");
db.close();