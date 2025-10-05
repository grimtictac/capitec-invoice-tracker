import { Router, Context } from "oak";
import { renderFileToString } from "ejs";
import { join } from "path";
import { DatabaseSync } from "node:sqlite";
import * as bcrypt from "bcrypt";

interface User {
  id: number;
  username: string;
  password: string;
}

interface State {
  user?: User;
}

export function createRegisterRouter(db: DatabaseSync): Router<State> {
  const router = new Router<State>();

  // Register page
  router.get("/register", async (ctx: Context<State>) => {
    if (ctx.state.user) {
      ctx.response.redirect("/disputes");
      return;
    }
    
    const html = await renderFileToString(join(Deno.cwd(), "views", "register.ejs"), { error: null });
    ctx.response.headers.set("Content-Type", "text/html");
    ctx.response.body = html;
  });

  // Register POST handler
  router.post("/register", async (ctx: Context<State>) => {
    const body = ctx.request.body();
    
    if (body.type === "form") {
      const formData = await body.value;
      const username = formData.get("username");
      const password = formData.get("password");
      const confirmPassword = formData.get("confirmPassword");

      if (!username || !password || !confirmPassword) {
        const html = await renderFileToString(join(Deno.cwd(), "views", "register.ejs"), { 
          error: "All fields are required" 
        });
        ctx.response.headers.set("Content-Type", "text/html");
        ctx.response.body = html;
        return;
      }

      if (password !== confirmPassword) {
        const html = await renderFileToString(join(Deno.cwd(), "views", "register.ejs"), { 
          error: "Passwords do not match" 
        });
        ctx.response.headers.set("Content-Type", "text/html");
        ctx.response.body = html;
        return;
      }

      try {
        const hashedPassword = await bcrypt.hash(password);
        db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run(username, hashedPassword);
        ctx.response.redirect("/login");
      } catch (_error) {
        const html = await renderFileToString(join(Deno.cwd(), "views", "register.ejs"), { 
          error: "Username already taken" 
        });
        ctx.response.headers.set("Content-Type", "text/html");
        ctx.response.body = html;
      }
    } else {
      ctx.response.status = 400;
      ctx.response.body = { error: "Invalid form submission" };
    }
  });

  return router;
}