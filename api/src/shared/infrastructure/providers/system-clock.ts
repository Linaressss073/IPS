import { Clock } from '../../application/ports/clock.port.js';

export const systemClock: Clock = { now: () => new Date() };
