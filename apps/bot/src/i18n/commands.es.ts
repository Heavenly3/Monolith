// Spanish names and descriptions shown by the Discord client. The bot always
// receives the English names, so the code only uses those. Discord limits
// names to 32 lowercase characters and descriptions to 100.
import { ROULETTE_BETS } from '@mythcore/core';
import { LOCALES } from '@mythcore/i18n';

const es = LOCALES.es;

const amount = { name: 'cantidad', description: 'Cantidad — p. ej. 500, 2.5k, mitad o todo' };
const bet = { name: 'apuesta', description: 'Tu apuesta — p. ej. 500, 2.5k, mitad o todo' };

export interface OptionTexts {
  name?: string;
  description?: string;
  choices?: Record<string, string>;
}

export interface CommandTexts {
  name?: string;
  description?: string;
  options?: Record<string, OptionTexts>;
  subcommands?: Record<string, CommandTexts>;
}

export const commandsEs: Record<string, CommandTexts> = {
  balance: {
    name: 'saldo',
    description: 'Mira tu oro (cartera y banco) o el de otro miembro.',
    options: { user: { name: 'usuario', description: 'Miembro a consultar' } },
  },
  deposit: {
    name: 'depositar',
    description: 'Pasa oro de tu cartera al banco, a salvo de ladrones.',
    options: { amount },
  },
  withdraw: {
    name: 'retirar',
    description: 'Pasa oro del banco a tu cartera.',
    options: { amount },
  },
  pay: {
    name: 'pagar',
    description: 'Da oro de tu cartera a otro miembro.',
    options: { user: { name: 'usuario', description: 'Quién recibe el oro' }, amount },
  },
  work: { name: 'trabajar', description: 'Haz una misión y gana oro.' },
  collect: { name: 'cobrar', description: 'Cobra los ingresos de tus roles.' },
  wheel: { name: 'rueda', description: 'Gira la Rueda de la Fortuna para ganar un premio gratis.' },
  rob: {
    name: 'robar',
    description: 'Intenta robar oro de la cartera de otro miembro. ¡Es arriesgado!',
    options: { user: { name: 'usuario', description: 'A quién robar' } },
  },
  leaderboard: { name: 'ranking', description: 'Mira a los miembros más ricos del servidor.' },

  slots: {
    name: 'tragaperras',
    description: 'Juega a la tragaperras: gira tres rodillos.',
    options: { bet },
  },
  roulette: {
    name: 'ruleta',
    description: 'Apuesta en la ruleta.',
    options: {
      bet,
      on: {
        name: 'jugada',
        description: 'A qué apuestas',
        choices: Object.fromEntries(
          Object.entries(ROULETTE_BETS).map(([value, { multiplier }]) => [
            value,
            `${es.roulette.bets[value as keyof typeof es.roulette.bets]} — paga ×${multiplier}`,
          ]),
        ),
      },
      number: {
        name: 'numero',
        description: 'El número al que apuestas (solo para "Número único")',
      },
    },
  },
  race: {
    name: 'carrera',
    description: 'Apuesta por un caballero en la carrera de caballos.',
    options: {
      bet,
      knight: { name: 'caballero', description: 'El caballero por el que apuestas' },
    },
  },
  keno: {
    name: 'keno',
    description: 'Keno: elige hasta 10 números y mira cuántos salen.',
    options: {
      bet,
      numbers: {
        name: 'numeros',
        description: 'Hasta 10 números del 1 al 80, p. ej. "4 8 15 16 23 42"',
      },
      random: {
        name: 'aleatorio',
        description: 'El bot elige esta cantidad de números al azar por ti',
      },
    },
  },
  lottery: {
    name: 'loteria',
    description: 'Lotería: compra un boleto con número y gana el premio.',
    subcommands: {
      buy: {
        name: 'comprar',
        description: 'Compra un boleto con un número del 000 al 999.',
        options: { number: { name: 'numero', description: 'Tu número de la suerte (0-999)' } },
      },
      info: { name: 'info', description: 'Mira el premio, la hora del sorteo y tus boletos.' },
    },
  },

  loan: {
    name: 'prestamo',
    description: 'Pide oro prestado y devuélvelo con interés.',
    subcommands: {
      request: {
        name: 'pedir',
        description: 'Pide un préstamo.',
        options: {
          amount: { name: 'cantidad', description: 'Cuánto oro pedir — p. ej. 5000 o 10k' },
        },
      },
      status: { name: 'estado', description: 'Mira cuánto debes.' },
      repay: { name: 'pagar', description: 'Paga toda tu deuda.' },
    },
  },

  shop: { name: 'tienda', description: 'Mira los objetos a la venta.' },
  buy: {
    name: 'comprar',
    description: 'Compra un objeto de la tienda.',
    options: {
      item: { name: 'objeto', description: 'El objeto que quieres comprar' },
      quantity: { name: 'cantidad', description: 'Cuántos (por defecto 1)' },
    },
  },
  use: {
    name: 'usar',
    description: 'Usa un objeto consumible de tu inventario.',
    options: {
      item: { name: 'objeto', description: 'El objeto que quieres usar' },
      quantity: { name: 'cantidad', description: 'Cuántos (por defecto 1)' },
    },
  },
  inventory: {
    name: 'inventario',
    description: 'Mira tus objetos o los de otro miembro.',
    options: { user: { name: 'usuario', description: 'Miembro a consultar' } },
  },

  help: {
    name: 'ayuda',
    description: 'Aprende cómo funciona el bot: comandos, juegos y ajustes.',
    options: {
      command: { name: 'comando', description: 'Abre directamente la página de un comando' },
    },
  },

  config: {
    name: 'config',
    description: 'Abre el panel de ajustes del bot (solo administradores).',
  },
};
