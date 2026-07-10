FROM oven/bun:1

WORKDIR /usr/src/app

COPY package.json ./
COPY . .
RUN bun run setup

CMD ["bun", "index.ts"]