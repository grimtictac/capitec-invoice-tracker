import { Router, Context } from "oak";
import { renderFileToString } from "ejs";
import { join } from "path";
import { DatabaseSync } from "node:sqlite";

interface User {
  id: number;
  username: string;
  password: string;
}

interface State {
  user?: User;
}

interface Invoice {
  id: number;
  customer_name: string;
  description: string;
  created_date: string;
  due_date: string;
  paid_date: string | null;
  total: number;
}

interface InvoiceWithStatus extends Invoice {
  status: string;
}

interface InvoiceItem {
  id: number;
  invoice_id: number;
  description: string;
  amount: number;
}

// Function to set status for a single invoice based on payment and due dates
function setStatus(invoice: Invoice): InvoiceWithStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
  
  let status: string;
  
  if (invoice.paid_date) {
    status = "PAID";
  } else {
    const dueDate = new Date(invoice.due_date);
    dueDate.setHours(0, 0, 0, 0); // Reset time to start of day
    
    if (dueDate >= today) {
      status = "PENDING";
    } else {
      status = "OVERDUE";
    }
  }
  
  return {
    ...invoice,
    status
  };
}

export function createInvoicesRouter(db: DatabaseSync): Router<State> {
  const router = new Router<State>();

  // Middleware to check authentication
  router.use(async (ctx: Context<State>, next) => {
    if (!ctx.state.user) {
      ctx.response.redirect("/login");
      return;
    }
    await next();
  });

  // GET /invoices - Show all invoices with customer names and totals
  router.get("/invoices", async (ctx: Context<State>) => {
    try {
      // Query to get invoices with customer names and calculated totals
      const query = `
        SELECT 
          i.id,
          c.name as customer_name,
          i.description,
          i.created_date,
          i.due_date,
          i.paid_date,
          COALESCE(SUM(ii.amount), 0) as total
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
        GROUP BY i.id, c.name, i.description, i.created_date, i.due_date, i.paid_date
        ORDER BY i.created_date DESC
      `;
      
      const invoices = db.prepare(query).all() as unknown as Invoice[];
      
      // Set status for each invoice
      const invoicesWithStatus = invoices.map(setStatus);
      
      const html = await renderFileToString(join(Deno.cwd(), "views", "invoices.ejs"), { 
        invoices: invoicesWithStatus,
        title: "All Invoices"
      });
      
      ctx.response.body = html;
    } catch (error) {
      console.error("Error fetching invoices:", error);
      ctx.response.status = 500;
      ctx.response.body = "Internal server error";
    }
  });

  // GET /invoice/:id - Show individual invoice with items
  router.get("/invoice/:id", async (ctx: Context<State>) => {
    try {
      const url = new URL(ctx.request.url);
      const pathSegments = url.pathname.split('/');
      const invoiceId = pathSegments[pathSegments.length - 1];
      
      if (!invoiceId) {
        ctx.response.status = 400;
        ctx.response.body = "Invoice ID is required";
        return;
      }
      
      // Get invoice details with customer name
      const invoiceQuery = `
        SELECT 
          i.id,
          c.name as customer_name,
          i.description,
          i.created_date,
          i.due_date,
          i.paid_date
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        WHERE i.id = ?
      `;
      
      const invoice = db.prepare(invoiceQuery).get(invoiceId) as unknown as Invoice | undefined;
      
      if (!invoice) {
        ctx.response.status = 404;
        ctx.response.body = "Invoice not found";
        return;
      }
      
      // Get invoice items
      const itemsQuery = `
        SELECT id, invoice_id, description, amount
        FROM invoice_items
        WHERE invoice_id = ?
        ORDER BY id
      `;
      
      const items = db.prepare(itemsQuery).all(invoiceId) as unknown as InvoiceItem[];
      
      // Calculate total from items
      const total = items.reduce((sum, item) => sum + item.amount, 0);
      
      // Set status for the invoice
      const invoiceWithTotal = { ...invoice, total };
      const invoiceWithStatus = setStatus(invoiceWithTotal);
      
      const html = await renderFileToString(join(Deno.cwd(), "views", "invoice-detail.ejs"), {
        invoice: invoiceWithStatus,
        items: items,
        title: `Invoice #${invoice.id}`
      });
      
      ctx.response.body = html;
    } catch (error) {
      console.error("Error fetching invoice details:", error);
      ctx.response.status = 500;
      ctx.response.body = "Internal server error";
    }
  });

  return router;
}