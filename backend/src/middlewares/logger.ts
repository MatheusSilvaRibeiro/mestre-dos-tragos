import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';

export const loggerMiddleware = pinoHttp({
  genReqId(req) {
    const id = randomUUID();
    req.id = id;
    return id;
  },

  customSuccessMessage(req, res) {
    return `${req.method} ${req.url} -> ${res.statusCode}`;
  },

  customErrorMessage(req, res) {
    return `${req.method} ${req.url} -> ${res.statusCode}`;
  },

  customProps(req) {
    return {
      userAgent: req.headers['user-agent'],
    };
  },

  autoLogging: true,
});