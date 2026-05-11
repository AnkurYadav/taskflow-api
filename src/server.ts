import fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import config from "./config/config";

const server = fastify({
    logger: true,
});

server.get("/health", (req: FastifyRequest, res: FastifyReply) => {
    res.send({ status: "ok" });
});

try {
    server.listen({ port: config.port }).then(() => {
        console.log(`Server is running on http://localhost:${config.port}`);
    });
} catch (err) {
    server.log.error(err);
    process.exit(1);
}