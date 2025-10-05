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
  [1, "Kitchen Sink Installation and Plumbing", "2025-10-01", "2025-10-31", null],
  [2, "Toilet Repair and Replacement Parts", "2025-10-02", "2025-11-01", "2025-10-15"],
  [3, "Bathroom Renovation - Full Plumbing", "2025-10-03", "2025-11-02", null],
  [1, "Drain Cleaning and Unblocking", "2025-10-04", "2025-11-03", "2025-10-20"],
  [4, "Hot Water Cylinder Installation", "2025-10-05", "2025-11-04", null],
  [5, "Pipe Leak Repair - Emergency Call", "2025-09-15", "2025-10-15", "2025-10-10"],
  [2, "Tap Replacement and Basin Repair", "2025-09-20", "2025-10-20", null],
  [3, "Geyser Replacement and Installation", "2025-09-25", "2025-10-25", "2025-10-22"],
  [1, "Shower Head and Mixer Installation", "2025-09-30", "2025-10-30", null],
  [4, "Main Water Line Repair and Replacement", "2025-10-01", "2025-11-15", null]
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
  // Invoice 1: Kitchen Sink Installation and Plumbing
  [1, "Kitchen sink unit", 320.00],
  [1, "Sink installation labor", 280.00],
  [1, "Plumbing pipes and fittings", 150.00],
  [1, "Tap and mixer installation", 100.00],

  // Invoice 2: Toilet Repair and Replacement Parts
  [2, "Toilet cistern mechanism", 180.00],
  [2, "Toilet seat replacement", 120.00],
  [2, "Labor for toilet repair", 150.00],

  // Invoice 3: Bathroom Renovation - Full Plumbing
  [3, "Bathroom pipes rerouting", 800.00],
  [3, "Shower installation labor", 450.00],
  [3, "Toilet installation", 320.00],
  [3, "Basin and taps installation", 280.00],
  [3, "Waterproofing materials", 200.00],

  // Invoice 4: Drain Cleaning and Unblocking
  [4, "Drain cleaning labor", 180.00],
  [4, "Drain snake equipment usage", 100.00],

  // Invoice 5: Hot Water Cylinder Installation
  [5, "150L hot water cylinder", 650.00],
  [5, "Installation labor", 270.00],

  // Invoice 6: Pipe Leak Repair - Emergency Call
  [6, "Emergency call-out fee", 200.00],
  [6, "Pipe repair materials", 150.00],
  [6, "Leak repair labor", 300.00],

  // Invoice 7: Tap Replacement and Basin Repair
  [7, "Kitchen tap replacement", 180.00],
  [7, "Basin repair materials", 80.00],
  [7, "Labor for tap and basin work", 160.00],

  // Invoice 8: Geyser Replacement and Installation
  [8, "200L electric geyser", 800.00],
  [8, "Geyser installation labor", 400.00],

  // Invoice 9: Shower Head and Mixer Installation
  [9, "Shower head and mixer set", 220.00],
  [9, "Installation labor", 160.00],

  // Invoice 10: Main Water Line Repair and Replacement
  [10, "Main water line piping", 600.00],
  [10, "Excavation and trenching", 450.00],
  [10, "Connection and testing labor", 450.00]
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