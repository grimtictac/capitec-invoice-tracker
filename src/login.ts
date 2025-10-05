import { Router, Context } from "oak";
import { renderFileToString } from "ejs";
import { join } from "path";
import { DatabaseSync } from "node:sqlite";
import * as bcrypt from "bcrypt";
import { encode as base64Encode } from "base64";

interface User {
  id: number;
  username: string;
  password: string;
}

interface State {
  user?: User;
}

export function createLoginRouter(db: DatabaseSync): Router<State> {
  const router = new Router<State>();

  // Login page
  router.get("/login", async (ctx: Context<State>) => {
    if (ctx.state.user) {
      ctx.response.redirect("/");
      return;
    }
    
    const html = await renderFileToString(join(Deno.cwd(), "views", "login.ejs"), { error: null });
    ctx.response.headers.set("Content-Type", "text/html");
    ctx.response.body = html;
  });

  // Login POST handler
  router.post("/login", async (ctx: Context<State>) => {
    const body = ctx.request.body();
    
    if (body.type === "form") {
      const formData = await body.value;
      const username = formData.get("username");
      const password = formData.get("password");

      if (!username || !password) {
        const html = await renderFileToString(join(Deno.cwd(), "views", "login.ejs"), { 
          error: "Username and password are required" 
        });
        ctx.response.headers.set("Content-Type", "text/html");
        ctx.response.body = html;
        return;
      }

      const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as User | undefined;
      if (!user || !await bcrypt.compare(password, user.password)) {
        const html = await renderFileToString(join(Deno.cwd(), "views", "login.ejs"), { 
          error: "Invalid username or password" 
        });
        ctx.response.headers.set("Content-Type", "text/html");
        ctx.response.body = html;
        return;
      }

      // Create session
      const session = `${user.id}.${base64Encode(crypto.getRandomValues(new Uint8Array(32)))}`;
      await ctx.cookies.set("session", session, { httpOnly: true });
      
      ctx.response.redirect("/");
    } else {
      ctx.response.status = 400;
      ctx.response.body = { error: "Invalid form submission" };
    }
  });

  // Logout handler
  router.get("/logout", async (ctx: Context<State>) => {
    await ctx.cookies.delete("session");
    ctx.response.redirect("/login");
  });

  return router;
}