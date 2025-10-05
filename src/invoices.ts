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
      
      const invoices = db.prepare(query).all();
      
      const html = await renderFileToString(join(Deno.cwd(), "views", "invoices.ejs"), { 
        invoices: invoices,
        title: "All Invoices"
      });
      
      ctx.response.body = html;
    } catch (error) {
      console.error("Error fetching invoices:", error);
      ctx.response.status = 500;
      ctx.response.body = "Internal server error";
    }
  });

  return router;
}