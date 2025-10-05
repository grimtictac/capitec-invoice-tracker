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

// Create the customers table
db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Insert sample users
const testUsers = [
  ["test", "$2a$10$Aj8kkwrul89SOQ4.IqrA.OV.GxFBnC9TvXSTJDUNd1TN7uqEEM.U6"] // password is "test"
];

const userStmt = db.prepare("INSERT INTO users (username, password) VALUES (:username, :password)");

for (const [username, password] of testUsers) {
  try {
    userStmt.run({ username, password });
    console.log(`Added user: ${username}`);
  } catch (error) {
    const err = error as Error;
    if (err.message.includes("UNIQUE constraint failed")) {
      console.log(`User '${username}' already exists, skipping...`);
    } else {
      console.error(`Error adding user '${username}':`, err.message);
    }
  }
}

// Insert sample customers
const sampleCustomers = [
  ["Bob", "bob@email.com"],
  ["Bill", "bill@email.com"],
  ["Tom", "tom@email.com"],
  ["Jeff", "jeff@email.com"],
  ["Sally", "sally@email.com"]
];

const customerStmt = db.prepare("INSERT INTO customers (name, email) VALUES (:name, :email)");

for (const [name, email] of sampleCustomers) {
  try {
    customerStmt.run({ name, email });
    console.log(`Added customer: ${name} (${email})`);
  } catch (error) {
    const err = error as Error;
    if (err.message.includes("UNIQUE constraint failed")) {
      console.log(`Customer with email '${email}' already exists, skipping...`);
    } else {
      console.error(`Error adding customer '${name}':`, err.message);
    }
  }
}

console.log("Database setup complete!");
db.close();