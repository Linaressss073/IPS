import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import transport from 'pino-opentelemetry-transport';

/**
 * pino transport that sends logs by OTLP (see logTransport). It runs in its own
 * thread, and OpenTelemetry reports failed exports (401, 403, 404…) only through
 * its diagnostic logger, which is off by default: without this line a wrong token
 * or endpoint fails silently. Warnings and errors go to the standard output, which
 * Render shows.
 */
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.WARN);

export default transport;
