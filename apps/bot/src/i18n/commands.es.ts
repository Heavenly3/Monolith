// Spanish names and descriptions shown by the Discord client. The bot always
// receives the English names, so the code only uses those. Discord limits
// names to 32 lowercase characters and descriptions to 100.
import { ROULETTE_BETS } from '@monolith/core';
import { LOCALES } from '@monolith/i18n';

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
    description: 'Mira tus créditos (cartera y banco) o el de otro miembro.',
    options: { user: { name: 'usuario', description: 'Miembro a consultar' } },
  },
  deposit: {
    name: 'depositar',
    description: 'Pasa créditos de tu cartera al banco, a salvo de ladrones.',
    options: { amount },
  },
  withdraw: {
    name: 'retirar',
    description: 'Pasa créditos del banco a tu cartera.',
    options: { amount },
  },
  pay: {
    name: 'pagar',
    description: 'Da créditos de tu cartera a otro miembro.',
    options: { user: { name: 'usuario', description: 'Quién recibe los créditos' }, amount },
  },
  work: { name: 'trabajar', description: 'Haz un trabajo en la Estructura y gana créditos.' },
  collect: { name: 'cobrar', description: 'Cobra los ingresos de tus roles.' },
  wheel: { name: 'rueda', description: 'Gira la Rueda de la Fortuna para ganar un premio gratis.' },
  rob: {
    name: 'robar',
    description: 'Intenta robar créditos de la cartera de otro miembro. ¡Es arriesgado!',
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
    description: 'Apuesta por un dron que corre por un conducto de servicio.',
    options: {
      bet,
      drone: { name: 'dron', description: 'El dron por el que apuestas' },
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
    description: 'Pide créditos prestados y devuélvelos con interés.',
    subcommands: {
      request: {
        name: 'pedir',
        description: 'Pide un préstamo.',
        options: {
          amount: { name: 'cantidad', description: 'Cuántos créditos pedir — p. ej. 5000 o 10k' },
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

  rank: {
    name: 'rango',
    description: 'Mira tu nivel y experiencia, o los de otro miembro.',
    options: { user: { name: 'usuario', description: 'Miembro a consultar' } },
  },
  levels: { name: 'niveles', description: 'Mira a los miembros con más experiencia del servidor.' },
  calculate: {
    name: 'calcular',
    description: 'Mira cuánta XP y cuánto chat necesita un nivel.',
    options: {
      level: { name: 'nivel', description: 'Nivel a calcular' },
      user: { name: 'usuario', description: 'Miembro para el que calcular' },
    },
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
