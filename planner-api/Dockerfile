FROM node:24.21.0-alpine

WORKDIR /usr/src/app

COPY package.json yarn.lock ./
# O postinstall (prisma generate) precisa do schema, copiado só no passo seguinte.
RUN yarn install --frozen-lockfile --ignore-scripts

COPY . .
RUN yarn prisma generate

EXPOSE 3000

CMD ["yarn", "start:dev"]
