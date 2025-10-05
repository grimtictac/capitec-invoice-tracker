FROM denoland/deno

EXPOSE 8000

WORKDIR /app

COPY . .

# Cache the dependencies
RUN deno cache src/main.ts

RUN rm invoice.db
RUN deno run --allow-write --allow-read --allow-ffi scripts/setup-db.ts

CMD ["run", "--allow-net", "--allow-read", "--allow-write", "--allow-ffi", "--allow-env", "src/main.ts"]