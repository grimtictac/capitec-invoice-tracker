FROM denoland/deno

EXPOSE 8000

WORKDIR /app

COPY . .

# Cache the dependencies
RUN deno cache src/main.ts

CMD ["run", "--allow-net", "--allow-read", "--allow-write", "--allow-ffi", "src/main.ts"]