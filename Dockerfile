FROM oven/bun:1

WORKDIR /usr/src/app

COPY package.json ./
RUN bun run setup

COPY . .

CMD ["bun", "index.ts"]