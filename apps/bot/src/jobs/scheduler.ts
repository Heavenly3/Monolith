import type { Client } from 'discord.js';
import { cooldowns, logger } from '@mythcore/core';
import { collectLoans } from './loanCollector.ts';
import { drawRaffles } from './raffleDraw.ts';
import { awardVoiceXp } from './voiceXp.ts';

const log = logger.child('jobs');

interface Job {
  name: string;
  every: number;
  run(client: Client<true>): Promise<unknown> | unknown;
}

const JOBS: Job[] = [
  { name: 'loans', every: 60_000, run: collectLoans },
  { name: 'raffle', every: 15_000, run: drawRaffles },
  { name: 'voice-xp', every: 60_000, run: awardVoiceXp },
  { name: 'cooldowns', every: 60 * 60_000, run: () => cooldowns.purgeExpired() },
];

const timers: NodeJS.Timeout[] = [];

export function start(client: Client<true>): void {
  for (const job of JOBS) {
    let running = false;
    const tick = async (): Promise<void> => {
      if (running) return;
      running = true;
      try {
        await job.run(client);
      } catch (error) {
        log.error(`Job "${job.name}" failed:`, error);
      } finally {
        running = false;
      }
    };
    void tick();
    timers.push(setInterval(tick, job.every));
  }
  log.info(`Started ${JOBS.length} background jobs.`);
}

export function stop(): void {
  for (const timer of timers.splice(0)) clearInterval(timer);
}
