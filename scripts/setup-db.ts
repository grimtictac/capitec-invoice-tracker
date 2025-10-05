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

// Create the invoices table
db.exec(`
  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    created_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    paid_date TEXT,
    FOREIGN KEY(customer_id) REFERENCES customers(id)
  )
`);

// Create the invoice_items table
db.exec(`
  CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    FOREIGN KEY(invoice_id) REFERENCES invoices(id)
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

// Insert sample invoices
const sampleInvoices = [
  [1, "Kitchen Sink Installation and Plumbing", "2025-10-01", "2025-10-31", null],       // due soon... 
  [2, "Toilet Repair and Replacement Parts", "2025-09-01", "2025-10-01", "2025-09-15"],  // already paid
  [3, "Geyser Repair", "2025-08-01", "2025-09-01", null],                                // overdue!
];

const invoiceStmt = db.prepare("INSERT INTO invoices (customer_id, description, created_date, due_date, paid_date) VALUES (:customer_id, :description, :created_date, :due_date, :paid_date)");

for (const [customer_id, description, created_date, due_date, paid_date] of sampleInvoices) {
  try {
    invoiceStmt.run({ customer_id, description, created_date, due_date, paid_date });
    console.log(`Added invoice: ${description}`);
  } catch (error) {
    const err = error as Error;
    console.error(`Error adding invoice '${description}':`, err.message);
  }
}

// Insert sample invoice items (tasks and parts for each invoice)
const sampleInvoiceItems = [
  // Invoice 1: Kitchen Sink Installation and Plumbing -- total should be R800.00
  [1, "Kitchen sink unit", 400.00],
  [1, "Sink installation labor", 300.00],
  [1, "Plumbing pipes and fittings", 50.00],
  [1, "Tap and mixer installation", 50.00],

  // Invoice 2: Toilet Repair and Replacement Parts - total should be R500.00
  [2, "Toilet cistern mechanism", 250.00],
  [2, "Toilet seat replacement", 50.00],
  [2, "Labor for toilet repair", 200.00],

  // Invoice 3: Geyser Repair - total should be R400.00
  [3, "After hours fee", 150.00],
  [3, "New Valve", 100.00],
  [3, "Labor for geyser repair", 150.00]
];

const invoiceItemStmt = db.prepare("INSERT INTO invoice_items (invoice_id, description, amount) VALUES (:invoice_id, :description, :amount)");

for (const [invoice_id, description, amount] of sampleInvoiceItems) {
  try {
    invoiceItemStmt.run({ invoice_id, description, amount });
    console.log(`Added invoice item: ${description} (R${amount})`);
  } catch (error) {
    const err = error as Error;
    console.error(`Error adding invoice item '${description}':`, err.message);
  }
}

console.log("Database setup complete!");
db.close();