import { Application, Router, Context } from "oak";
import { DatabaseSync } from "node:sqlite";
import { renderFileToString } from "ejs";
import { join } from "path";
import { createRegisterRouter } from "./register.ts";
import { createLoginRouter } from "./login.ts";

interface User {
  id: number;
  username: string;
  password: string;
}

interface State {
  user?: User;
}

const app = new Application<State>();
const router = new Router<State>();

// Initialize database connection
const db = new DatabaseSync("invoice.db");

// Session middleware
async function sessionMiddleware(ctx: Context<State>, next: () => Promise<unknown>) {
  const sessionCookie = await ctx.cookies.get("session");
  if (sessionCookie) {
    try {
      const [userId, _] = sessionCookie.split(".");
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as User | undefined;
      if (user) {
        ctx.state.user = user;
      }
    } catch (error) {
      console.error("Session error:", error);
    }
  }
  await next();
}

// Add session middleware to all routes
app.use(sessionMiddleware);

// Home page route
router.get("/", async (ctx: Context<State>) => {
  const html = await renderFileToString(join(Deno.cwd(), "views", "home.ejs"), { 
    user: ctx.state.user 
  });
  ctx.response.headers.set("Content-Type", "text/html");
  ctx.response.body = html;
});

// Create and use the routers
const registerRouter = createRegisterRouter(db);
const loginRouter = createLoginRouter(db);

// Use the routers
app.use(router.routes());
app.use(router.allowedMethods());
app.use(registerRouter.routes());
app.use(registerRouter.allowedMethods());
app.use(loginRouter.routes());
app.use(loginRouter.allowedMethods());

// Start the server
console.log("Server running on http://localhost:8000");
await app.listen({ port: 8000 });