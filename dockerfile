FROM node:14-slim
RUN mkdir TestApp
WORKDIR /TestApp
COPY . .
RUN npm install
EXPOSE 80
ENTRYPOINT [ "npm","run","dev" ]