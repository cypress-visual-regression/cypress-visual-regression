const path = require("node:path");
const http = require("node:http");
const connect = require("connect");
const serveStatic = require("serve-static");

const { HTTP_PORT, PORT } = process.env;
const port = parseInt(HTTP_PORT ?? PORT ?? "8080", 10);
const app = connect();

app.use(serveStatic(path.join(__dirname, "cypress-web")));

http.createServer(app).listen(port, "::", () => {
    /* eslint-disable-next-line no-console -- expected to log */
    console.log(`Started webserver on http://localhost:${port}`);
});
