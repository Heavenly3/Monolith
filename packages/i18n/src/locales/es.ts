import type { Messages } from './en.ts';

const s = (count: number, word: string, plural = `${word}s`): string =>
  `${count} ${count === 1 ? word : plural}`;

export const es: Messages = {
  meta: { name: 'Español', flag: '🇪🇸' },

  common: {
    wallet: 'Cartera',
    bank: 'Banco',
    netWorth: 'Total',
    yourWallet: 'Tu cartera',
    none: 'Ninguno',
    by: 'Por {user}',
    invalidAmount: 'Escribe una cantidad válida, como `500`, `2.5k`, `mitad` o `todo`.',
    notEnoughWallet: 'Solo tienes {amount} en tu cartera.',
    notEnoughBank: 'Solo tienes {amount} en el banco.',
    emptyWallet: 'Tu cartera está vacía.',
    emptyBank: 'Tu banco está vacío.',
    botsNoAccount: 'Los bots no tienen créditos.',
    cooldown: 'Podrás {action} de nuevo {time}.',
    serverOnly: 'Monolith solo funciona dentro de un servidor.',
    adminOnly: 'Solo los administradores pueden hacer eso.',
    notYours: 'Este mensaje es de otra persona. Usa {command} para abrir el tuyo.',
    error: 'Algo salió mal. Inténtalo de nuevo. Referencia: `{ref}`',
    invalidDuration: 'Ese no es un tiempo válido. Usa formatos como `30m`, `12h` o `1d`.',
    moduleDisabled:
      'El módulo **{module}** está desactivado en este servidor. Un administrador puede activarlo en {command}.',
  },

  features: {
    balance: 'Saldo',
    bank: 'Banco',
    work: 'Trabajo',
    collect: 'Ingresos por rol',
    wheel: 'Rueda de la Fortuna',
    rob: 'Robo',
    leaderboard: 'Ranking',
    slots: 'Tragaperras',
    roulette: 'Ruleta',
    horserace: 'Carrera de drones',
    keno: 'Keno',
    raffle: 'Lotería',
    loans: 'Préstamos',
    shop: 'Tienda',
    inventory: 'Inventario',
    config: 'Ajustes',
    help: 'Ayuda',
    levels: 'Niveles',
  },

  modules: {
    economy: 'Economía',
    games: 'Juegos',
    shop: 'Tienda',
    loans: 'Préstamos',
    lottery: 'Lotería',
    levels: 'Niveles',
  },

  levels: {
    announce: '¡{user} subió al **nivel {level}**!',
    announceReward: '¡{user} subió al **nivel {level}** y ganó {role}!',
    announceTitle: 'Subida de nivel',
    coins: '+{amount} por subir de nivel',
    rankSubtitle: 'Experiencia de {user}',
    level: 'Nivel',
    rank: 'Puesto',
    xp: 'Experiencia',
    messages: 'Mensajes',
    voice: 'Tiempo en voz',
    progress: '{current} / {needed} XP para el nivel {next}',
    maxLevel: 'Nivel máximo alcanzado',
    noXp: '{user} todavía no tiene experiencia. ¡Chatea para ganarla!',
    nextReward: 'Próxima recompensa: {role} en el nivel {level}',
    boardSubtitle: 'Los miembros con más experiencia del servidor.',
    boardEmpty: 'Nadie tiene experiencia todavía. ¡Empezad a chatear!',
    boardLine: 'Nivel {level} · {xp} XP',
    disabledHint: 'Los niveles están desactivados en este servidor.',
  },

  status: 'Recorriendo la Estructura',

  balance: {
    subtitle: 'Créditos de {user}',
    rank: 'Puesto **#{rank}**',
    activeLoan: 'Préstamo activo',
    loanDue: '{amount} vence {time}',
  },

  bank: {
    depositTitle: 'Créditos depositados',
    depositBody: 'Pasaste {amount} al banco. Ahí nadie te lo puede robar.',
    withdrawTitle: 'Créditos retirados',
    withdrawBody: 'Pasaste {amount} del banco a tu cartera.',
  },

  pay: {
    self: 'No puedes pagarte a ti mismo.',
    bot: 'Los bots no necesitan créditos.',
    title: 'Pago enviado',
    body: '{sender} le dio {amount} a {target}.',
  },

  work: {
    action: 'trabajar',
    noJobs: 'No hay trabajos disponibles. Un administrador puede añadirlos en {command}.',
    title: 'Trabajo terminado',
    fallback: '{message} Ganaste {amount}.',
    next: 'Próximo trabajo',
    defaultMessages: [
      'Arrancaste cobre de un conducto derrumbado en el estrato 12 y lo vendiste por {amount}.',
      'Reparaste un relé de energía que parpadeaba en un asentamiento y te pagaron {amount}.',
      'Cartografiaste un sector inexplorado de la Estructura y vendiste el mapa por {amount}.',
      'Subiste chatarra por trescientos pisos de escaleras y ganaste {amount}.',
      'Recuperaste un núcleo de datos de una terminal muerta y lo cambiaste por {amount}.',
      'Limpiaste crecimiento de silicio de un pozo de ventilación y sacaste {amount}.',
      'Escoltaste una caravana de chatarreros por un pasillo a oscuras y ganaste {amount}.',
      'Vigilaste una barricada durante todo el ciclo nocturno y te pagaron {amount}.',
      'Sellaste una brecha antes de que el refrigerante inundara el nivel y recibiste {amount}.',
      'Descifraste una señal antigua de los estratos superiores y vendiste la clave por {amount}.',
      'Reconstruiste un reciclador de agua para los vecinos del bloque 7 y ganaste {amount}.',
      'Rescataste piezas de un dron constructor caído y sacaste {amount}.',
      'Guiaste a un explorador perdido de vuelta al hueco del ascensor y te recompensaron con {amount}.',
      'Recableaste un montacargas muerto desde hacía décadas y ganaste {amount}.',
      'Saqueaste una bóveda de almacén olvidada y vendiste su contenido por {amount}.',
    ],
  },

  collect: {
    action: 'cobrar tus ingresos',
    noRewards:
      'Ninguno de tus roles da ingresos todavía. Un administrador puede configurarlo en {command}.',
    title: 'Ingresos cobrados',
    body: 'Tus roles te pagaron {amount}.',
    next: 'Próximos ingresos',
  },

  wheel: {
    action: 'girar la rueda',
    empty: 'La rueda todavía no tiene premios. Un administrador puede añadirlos en {command}.',
    spinning: 'La rueda está girando... {label}',
    won: 'La rueda se fija en {label}. ¡Buena señal!',
    lost: 'La rueda se detuvo en {label}. Mejor suerte la próxima vez.',
    nothing: 'Nada',
    next: 'Próximo giro',
  },

  rob: {
    self: 'No puedes robarte a ti mismo.',
    bot: 'Los bots no tienen cartera que robar.',
    action: 'robar',
    thiefPoor: 'Necesitas al menos {amount} en tu cartera para pagar la multa si te atrapan.',
    targetPoor: '{target} tiene muy pocos créditos en su cartera; no vale la pena.',
    successTitle: 'Robo exitoso',
    successBody: 'Saliste de un conducto de mantenimiento y le quitaste {amount} a {target}.',
    failTitle: '¡Te atrapó un centinela!',
    failBody:
      'Un centinela de seguridad te pilló en el acto. Le pagaste a {target} {amount} de multa.',
    next: 'Próximo robo',
  },

  leaderboard: {
    subtitle: 'Los miembros más ricos del servidor (cartera + banco).',
    empty: 'Nadie tiene créditos todavía. ¡Sé el primero!',
    you: 'tú',
    yourRank: 'Tu puesto: #{rank}',
  },

  games: {
    action: 'jugar a {game}',
    minWallet: 'Necesitas al menos {min} en tu cartera para jugar. Tienes {wallet}.',
    invalidBet: 'Escribe una apuesta válida, como `500`, `2.5k`, `mitad` o `todo`.',
    minBet: 'La apuesta mínima es {min}.',
    won: 'Ganaste {amount}',
    refund: 'Recuperaste tu apuesta',
    lost: 'Perdiste {amount}',
    bet: 'Apuesta',
    payout: 'Ganancias',
  },

  slots: {
    spinning: 'Los rodillos están girando...',
    jackpot: '¡BOTE! ¡EL MONOLITO SE ALINEA!',
    triple: '¡Tres iguales!',
    pair: '¡Una pareja!',
    none: 'Sin premio',
    paytable: 'Pareja ×{pair} · Tres iguales ×{triple} · Tres monolitos ×{jackpot}',
  },

  roulette: {
    needsNumber: 'Elige el `numero` (0-36) para apostar a un número.',
    spinning: 'La ruleta está girando... apostaste a **{bet}**.',
    landed: 'La bola cayó en {icon} **{number} {color}**',
    win: '¡Tu apuesta a **{bet}** gana!',
    lose: 'Tu apuesta a **{bet}** pierde.',
    number: 'Número {n}',
    colors: { red: 'rojo', black: 'negro', green: 'verde' },
    bets: {
      red: 'Rojo',
      black: 'Negro',
      even: 'Par',
      odd: 'Impar',
      low: 'Bajo (1-18)',
      high: 'Alto (19-36)',
      dozen1: '1.ª docena (1-12)',
      dozen2: '2.ª docena (13-24)',
      dozen3: '3.ª docena (25-36)',
      column1: '1.ª columna',
      column2: '2.ª columna',
      column3: '3.ª columna',
      straight: 'Número único (0-36)',
    },
  },

  horserace: {
    backed: 'Apostaste por **{horse}**',
    results: 'Resultados',
    finished: '**{horse}** terminó en el puesto **{place}**.',
  },

  keno: {
    badRange: 'Cada número debe estar entre 1 y {max}.',
    repeated: 'No puedes elegir el mismo número dos veces.',
    badCount: 'Elige entre 1 y {max} números.',
    summary: 'Salieron **{hits}** de tus **{picks}** números.',
    yours: 'Tus números',
    drawn: 'Números sorteados ({count})',
    paytable: '{spots} números: {table}',
    hits: ({ n }: { n: number }) => s(n, 'acierto'),
  },

  raffle: {
    duplicate: 'Ya tienes el boleto {number}.',
    funds: 'Un boleto cuesta {price}. No tienes suficiente en tu cartera.',
    boughtTitle: 'Boleto comprado',
    boughtBody: 'Tienes el boleto {number} por {price}.',
    pot: 'Premio',
    draw: 'Sorteo',
    yourTickets: 'Tus boletos',
    announce: 'El ganador se anunciará en este canal',
    infoSubtitle:
      'Quienes tengan el número ganador se reparten el premio. ¿Sin ganador? ¡El premio sigue creciendo!',
    ticketPrice: 'Precio del boleto',
    sold: 'Boletos vendidos',
    afterFirst: '{duration} después del primer boleto',
    resultsTitle: 'Resultados de la lotería',
    winning: 'El número ganador es {number}',
    winnerSingle: '¡{winners} gana el premio de {pot}!',
    winnerSplit: '¡{winners} se reparten el premio de {pot}! Cada uno recibe {share}.',
    noWinner:
      'Nadie tenía el número ganador entre **{tickets}** boletos.\nEl premio pasa al próximo sorteo: {pot}',
    footer: 'Compra un boleto con {command}',
  },

  loans: {
    statusTitle: 'Tu préstamo',
    statusSubtitle: 'Devuélvelo antes del plazo o se te cobrará automáticamente.',
    borrowed: 'Prestado',
    interest: 'Interés',
    amountDue: 'Total a pagar',
    due: 'Plazo',
    repayButton: 'Pagar ahora',
    cannotRepayYet: 'Todavía no tienes suficiente en tu cartera para pagar',
    none: 'No tienes ningún préstamo. Puedes pedir hasta {max} con un {rate}% de interés.',
    noLoan: 'No tienes ningún préstamo.',
    needToRepay: 'Necesitas {amount} en tu cartera para pagar. Retira del banco si hace falta.',
    repaidTitle: 'Préstamo pagado',
    repaidBody: 'Devolviste {amount}. ¡Ya no debes nada!',
    already: 'Ya tienes un préstamo. Págalo primero con {command}.',
    negative: 'No puedes pedir un préstamo con el saldo en negativo.',
    range: 'Pide una cantidad entre 1 y {max}.',
    approvedTitle: 'Préstamo aprobado',
    approvedBody: 'Se añadieron {amount} a tu cartera.',
    term: '{time} · plazo de {duration}',
    footer: 'Los préstamos sin pagar se cobran de tu cartera y después de tu banco',
    notYours: 'Ese préstamo no es tuyo.',
    collectedTitle: 'Se cobró tu préstamo',
    collectedBody: 'Tu préstamo llegó a su plazo.',
    collectedAmount: 'Cantidad cobrada',
    debtLeft: 'Deuda pendiente',
    debtLeftValue: '{amount} — tu cartera ahora está en negativo.',
  },

  shop: {
    subtitle: 'Pulsa **Comprar** para llevarte uno, o usa {command} para comprar varios.',
    empty: 'La tienda aún no tiene nada a la venta. ¡Vuelve pronto!',
    consumable: 'Consumible',
    permanent: 'Permanente',
    grants: 'Da {role}',
    buy: 'Comprar',
    items: ({ count }: { count: number }) => s(count, 'objeto'),
    gone: 'Ese objeto ya no está a la venta.',
    boughtQuick: 'Compraste **{item}** por {amount}.',
    boughtRole: 'Recibiste {role}.',
    walletNow: 'Cartera: {amount}',
    notFound: 'Ese objeto no está a la venta. Mira lo que hay con {command}.',
    purchaseTitle: 'Compra realizada',
    purchaseBody: 'Compraste **{quantity}× {item}** por {amount}.',
    roleReceived: 'Rol recibido',
    owned: 'En tu inventario',
    useHint: 'Úsalo con {command}',
    alreadyOwned: 'Ya tienes **{item}** — solo se puede comprar una vez.',
    cantAfford: 'Cuesta {total}, pero solo tienes {wallet} en tu cartera.',
    refunded: '{reason} Se te devolvieron los créditos.',
    roleRejected: 'Discord no me dejó darte el rol. Se te devolvieron los créditos.',
    roleMissing: 'El rol de este objeto ya no existe.',
    roleNotEditable: 'No puedo dar {role} — sube mi rol por encima y dame **Gestionar roles**.',
  },

  use: {
    notFound: 'No tienes ese objeto.',
    permanent: '**{item}** es permanente y no se puede gastar.',
    roleOne: 'Los objetos que dan un rol solo se usan de uno en uno.',
    notEnough: 'Solo tienes **{quantity}× {item}**.',
    alreadyHad: 'Ya tienes {role} — el objeto no se gastó.',
    roleRejected: 'Discord no me dejó darte el rol. El objeto no se gastó.',
    title: 'Objeto usado',
    body: 'Usaste **{quantity}× {item}**.',
    remaining: 'Te quedan en el inventario',
  },

  inventory: {
    subtitle: 'Inventario de {user}',
    empty: 'Vacío — visita {command} para comprar algo.',
    value: 'Valor: {amount}',
  },

  moneyAdmin: {
    add: 'Se añadieron {amount} a la {account} de {user}.',
    remove: 'Se quitaron {amount} de la {account} de {user}.',
    set: 'La {account} de {user} ahora tiene {amount}.',
    reset: 'Se vaciaron la cartera y el banco de {user}.',
    accounts: { wallet: 'cartera', bank: 'cuenta del banco' },
  },

  incomeAdmin: {
    set: '{role} ahora da {amount} de ingresos.',
    removed: '{role} ya no da ingresos.',
    cleared: ({ count }: { count: number }) =>
      `Se quitaron los ingresos de ${s(count, 'rol', 'roles')}.`,
  },

  wheelAdmin: {
    full: 'La rueda ya tiene el máximo de {max} premios.',
    added: 'Se añadió {label} a la rueda.',
    missing: 'Ese premio no existe.',
    removed: 'Se quitó {label} de la rueda.',
    reset: 'La rueda recuperó sus premios originales.',
  },

  workAdmin: {
    full: 'Puedes tener como mucho {max} trabajos.',
    added: 'Trabajo #{n} añadido.',
    missing: 'Ese trabajo no existe.',
    removed: 'Quitado: “{message}”',
    reset: 'Los ajustes de trabajo volvieron a los valores por defecto.',
    noMessages: 'No hay trabajos — /trabajar seguirá cerrado hasta que añadas uno.',
    usingDefaults: 'Se usan los trabajos integrados, mostrados en el idioma de cada respuesta.',
  },

  shopAdmin: {
    notFound: 'Ese objeto no existe.',
    removed: '**{item}** se quitó de la tienda.',
    exists: 'Ya existe un objeto llamado **{item}**.',
    badRole: 'Los bots no pueden dar ese rol.',
    addedBody: '**{item}** ya está a la venta en la tienda.',
    price: 'Precio',
    type: 'Tipo',
    cantAssign: '— todavía no puedo dar este rol',
    description: 'Descripción',
  },

  loansAdmin: {
    cancelled: 'Se canceló el préstamo de {user}.',
    none: '{user} no tiene ningún préstamo.',
    cancelledAll: ({ count }: { count: number }) =>
      `Se ${count === 1 ? 'canceló' : 'cancelaron'} ${s(count, 'préstamo')}.`,
    listTitle: 'Préstamos activos',
    empty: 'Nadie tiene un préstamo.',
    due: 'vence {time}',
  },

  config: {
    subtitle: 'Los cambios se aplican al instante. Elige una sección abajo.',
    placeholder: 'Elige una sección',
    edit: 'Editar',
    reset: 'Restaurar valores',
    saved: 'Ajustes guardados.',
    restored: 'Valores por defecto restaurados.',
    invalid: 'Valor no válido en **{field}** — {hint}.',
    unknown: 'Sección desconocida.',
    modalTitle: 'Ajustes: {category}',
    languagePlaceholder: 'Elige el idioma del bot',
    languageSaved: 'Idioma actualizado.',
    minMax: 'El mínimo no puede ser mayor que el máximo.',
    channelRequired: 'Elige el canal donde se anuncian las subidas de nivel.',
    formulaEmpty: 'Al menos una parte de la fórmula debe ser mayor que cero.',
    on: 'Activado',
    off: 'Desactivado',
    notSet: 'Sin elegir',
    builtIn: 'Mensaje integrado',
    hints: {
      coins: 'Un número entero, p. ej. 2500',
      percent: 'Un número entero de 0 a 1000',
      duration: 'p. ej. 30s, 15m, 1h30m, 2d',
      number: 'Un número entero',
      decimal: 'Un número, con decimales si quieres, p. ej. 0.5',
      language: 'Elige un idioma',
      toggle: 'Márcalo para activarlo',
      choice: 'Elige una opción',
      channel: 'Elige un canal (o ninguno)',
      channels: 'Elige uno o varios canales',
      roles: 'Elige uno o varios roles',
      template: 'Vacío = mensaje integrado. Variables: {variables}',
    },
    choices: {
      curve: {
        gentle: 'Suave — los niveles llegan rápido',
        standard: 'Estándar — como la mayoría de bots de niveles',
        steep: 'Empinada — los niveles altos son raros',
        custom: 'Personalizada — tu propia fórmula',
      },
      mode: {
        channel: 'En el canal donde escribió',
        custom: 'En un canal fijo',
        dm: 'Por mensaje privado',
        off: 'No anunciar',
      },
      rewardMode: {
        stack: 'Conservar todos los roles de recompensa',
        replace: 'Conservar solo el rol de recompensa más alto',
      },
      syncMode: {
        xp: 'Siempre — corrige los roles con cada XP ganada',
        level: 'Solo al cambiar de nivel',
        never: 'Nunca — solo añade roles al subir',
      },
      roleMode: {
        largest: 'Usar el mayor',
        smallest: 'Usar el menor',
        highest: 'Usar el del rol más alto de la lista',
        add: 'Sumarlos',
        multiply: 'Multiplicarlos',
      },
      channelMode: {
        multiply: 'Multiplicar rol × canal',
        add: 'Sumar rol + canal',
        largest: 'Usar el mayor',
        channel: 'El canal sustituye al rol',
        role: 'El rol sustituye al canal',
      },
      style: {
        card: 'Tarjeta — con avatar y título',
        plain: 'Texto — un mensaje normal',
      },
    },
    languages: {
      auto: 'Automático',
      autoDescription: 'El idioma de Discord de cada miembro',
      en: 'English',
      es: 'Español',
    },
    categories: {
      general: { label: 'General', description: 'Idioma del bot' },
      modules: { label: 'Módulos', description: 'Activa o desactiva sistemas completos' },
      members: {
        label: 'Miembros',
        description: 'Cambia los créditos de los miembros y mira los totales',
      },
      work: { label: 'Trabajo', description: 'Recompensas, espera y trabajos de /trabajar' },
      collect: {
        label: 'Ingresos por rol',
        description: 'Ingresos de cada rol y espera de /cobrar',
      },
      wheel: { label: 'Rueda de la Fortuna', description: 'Premios y espera de /rueda' },
      games: { label: 'Juegos', description: 'Esperas de los juegos y de /robar' },
      shop: { label: 'Tienda', description: 'Añade o quita objetos a la venta' },
      loans: { label: 'Préstamos', description: 'Condiciones y préstamos activos' },
      raffle: {
        label: 'Lotería',
        description: 'Precio del boleto, premio inicial y hora del sorteo',
      },
      levels: { label: 'Experiencia', description: 'XP por mensaje, espera y créditos por nivel' },
      levelCurve: { label: 'Curva de niveles', description: 'Cuánta XP necesita cada nivel' },
      levelFormula: {
        label: 'Fórmula propia',
        description: 'XP por nivel de la curva personalizada, parte por parte',
      },
      levelMultipliers: {
        label: 'Reglas de multiplicadores',
        description: 'Cómo se combinan varios multiplicadores de XP',
      },
      levelRoles: {
        label: 'Reglas de recompensas',
        description: 'Si se conservan los roles inferiores y cuándo se revisan',
      },
      levelVoice: { label: 'XP de voz', description: 'Experiencia por estar en canales de voz' },
      levelAnnounce: {
        label: 'Mensajes de nivel',
        description: 'Dónde y cómo se anuncian las subidas',
      },
      levelAnnounceRules: {
        label: 'Cuándo anunciar',
        description: 'Qué niveles se anuncian, menciones y estilo',
      },
      levelFilters: {
        label: 'Filtros',
        description: 'Canales y roles que nunca ganan XP',
      },
      levelRewards: {
        label: 'Roles de recompensa',
        description: 'Roles que se dan al llegar a un nivel',
      },
      levelMembers: {
        label: 'XP de miembros',
        description: 'Cambia o reinicia la experiencia de los miembros',
      },
    },
    fields: {
      general: {
        language: {
          label: 'Idioma',
          help: 'Idioma de todas las respuestas. Automático sigue el idioma de Discord de cada miembro.',
        },
      },
      modules: {
        economy: {
          label: 'Economía',
          help: 'Saldo, banco, pagos, trabajo, ingresos, rueda y robos.',
        },
        games: { label: 'Juegos', help: 'Tragaperras, ruleta, carrera y keno.' },
        shop: { label: 'Tienda', help: 'Tienda, compras, inventario y uso de objetos.' },
        loans: { label: 'Préstamos', help: 'Pedir créditos prestados con interés.' },
        lottery: { label: 'Lotería', help: 'Boletos numerados y el premio compartido.' },
        levels: {
          label: 'Niveles',
          help: 'Experiencia por chatear, rangos y roles de recompensa.',
        },
      },
      levels: {
        min: { label: 'XP mínima por mensaje', help: 'Lo mínimo que puede dar un mensaje.' },
        max: { label: 'XP máxima por mensaje', help: 'Lo máximo que puede dar un mensaje.' },
        cooldown: {
          label: 'Espera',
          help: 'Tiempo antes de que los mensajes vuelvan a dar XP (evita el spam).',
        },
        coins: {
          label: 'Créditos por nivel',
          help: 'Créditos que se pagan en cada subida de nivel (0 = nada).',
        },
      },
      levelCurve: {
        curve: { label: 'Curva', help: 'Cuánto crece la XP necesaria de un nivel al siguiente.' },
        difficulty: {
          label: 'Dificultad (%)',
          help: '100% es lo normal; 200% necesita el doble de XP.',
        },
        maxLevel: { label: 'Nivel máximo', help: 'Los miembros dejan de subir en este nivel.' },
      },
      levelFormula: {
        cubic: {
          label: 'Nivel³ ×',
          help: 'Crece muy rápido en niveles altos. Normalmente 0 o menos de 1.',
        },
        quadratic: { label: 'Nivel² ×', help: 'Hace cada nivel algo más difícil que el anterior.' },
        linear: { label: 'Nivel ×', help: 'Añade la misma XP extra en cada nivel.' },
        constant: { label: 'XP base', help: 'XP que necesita todo nivel, incluso el 1.' },
        rounding: {
          label: 'Redondear a',
          help: 'La XP por nivel se redondea a un múltiplo de esto (1 = exacta).',
        },
      },
      levelMultipliers: {
        roleMode: {
          label: 'Varios multiplicadores de rol',
          help: 'Cuando un miembro tiene más de un rol con multiplicador.',
        },
        channelMode: {
          label: 'Rol y canal',
          help: 'Cuando tienen multiplicador un rol y el canal (o su categoría).',
        },
      },
      levelRoles: {
        rewardMode: {
          label: 'Roles de recompensa',
          help: 'Si los miembros conservan los roles de recompensa inferiores.',
        },
        syncMode: {
          label: 'Revisión de roles',
          help: 'Cuándo corrige el bot los roles que no cuadran con el nivel.',
        },
      },
      levelVoice: {
        enabled: {
          label: 'XP de voz',
          help: 'Da experiencia por estar en voz con otras personas.',
        },
        xp: { label: 'XP por minuto', help: 'Experiencia por minuto en un canal de voz.' },
      },
      levelAnnounce: {
        mode: { label: 'Dónde anunciar', help: 'Dónde se envían los mensajes de subida de nivel.' },
        channel: { label: 'Canal de anuncios', help: 'Se usa al anunciar en un canal fijo.' },
        message: { label: 'Mensaje', help: 'Texto del mensaje de subida de nivel.' },
      },
      levelAnnounceRules: {
        every: {
          label: 'Anunciar cada',
          help: 'Anuncia cada N niveles; los niveles con recompensa siempre se anuncian.',
        },
        until: {
          label: 'Hasta el nivel',
          help: 'A partir de este nivel se anuncian todos otra vez (0 = siempre cada N).',
        },
        rewardsOnly: {
          label: 'Solo niveles con recompensa',
          help: 'Anuncia únicamente los niveles que dan un rol.',
        },
        ping: {
          label: 'Mencionar al miembro',
          help: 'El anuncio le envía una notificación.',
        },
        style: { label: 'Estilo', help: 'Cómo se ve el anuncio en Discord.' },
      },
      levelFilters: {
        channels: { label: 'Canales sin XP', help: 'Los mensajes aquí nunca dan experiencia.' },
        roles: {
          label: 'Roles sin XP',
          help: 'Los miembros con estos roles nunca ganan experiencia.',
        },
      },
      work: {
        min: { label: 'Recompensa mínima', help: 'Lo mínimo que puede pagar /trabajar.' },
        max: { label: 'Recompensa máxima', help: 'Lo máximo que puede pagar /trabajar.' },
        cooldown: { label: 'Espera', help: 'Tiempo entre dos /trabajar del mismo miembro.' },
      },
      collect: {
        cooldown: { label: 'Espera', help: 'Tiempo entre dos /cobrar del mismo miembro.' },
      },
      wheel: {
        cooldown: { label: 'Espera', help: 'Tiempo entre dos giros de /rueda.' },
      },
      games: {
        slots: {
          label: 'Espera de la tragaperras',
          help: 'Tiempo entre dos partidas de /tragaperras.',
        },
        roulette: { label: 'Espera de la ruleta', help: 'Tiempo entre dos apuestas de /ruleta.' },
        horserace: {
          label: 'Espera de la carrera',
          help: 'Tiempo entre dos apuestas de /carrera.',
        },
        keno: { label: 'Espera del keno', help: 'Tiempo entre dos partidas de /keno.' },
        rob: { label: 'Espera del robo', help: 'Tiempo entre dos intentos de /robar.' },
      },
      loans: {
        rate: { label: 'Interés (%)', help: 'Porcentaje extra que se suma a cada préstamo nuevo.' },
        duration: {
          label: 'Plazo',
          help: 'Tiempo antes de que un préstamo sin pagar se cobre automáticamente.',
        },
        max: { label: 'Préstamo máximo', help: 'Lo máximo que un miembro puede pedir prestado.' },
      },
      raffle: {
        price: { label: 'Precio del boleto', help: 'Lo que cuesta un boleto de la lotería.' },
        pot: { label: 'Premio inicial', help: 'Premio de un sorteo nuevo cuando alguien gana.' },
        delay: {
          label: 'Hora del sorteo',
          help: 'Tiempo entre el primer boleto de una ronda y el sorteo.',
        },
      },
    },
  },

  levelsAdmin: {
    full: 'Puedes tener como mucho {max} roles de recompensa.',
    badRole: 'Elige un rol normal (no @everyone ni un rol de bot).',
    messagesFull: 'Puedes tener como mucho {max} mensajes por nivel.',
    messageSaved: 'El nivel {level} tiene ahora su propio mensaje.',
    messageRemoved: 'El nivel {level} vuelve a usar el mensaje habitual.',
    missing: 'Esa recompensa no existe.',
    rewardAdded: '{role} se da ahora en el nivel **{level}**.',
    rewardRemoved: '{role} ya no es una recompensa de nivel.',
    adjusted: '{user} ahora es nivel **{level}** con {xp} XP.',
    resetAll: ({ count }: { count: number }) =>
      `Se reinició la experiencia de ${s(count, 'miembro')}.`,
  },

  panel: {
    more: '…y {count} más',
    modules: {
      hint: 'Pulsa un botón para activar o desactivar un módulo. Los comandos desactivados avisan a los miembros.',
      enabled: '**{module}** activado.',
      disabled: '**{module}** desactivado.',
    },
    levels: {
      stats: '{members} miembros con XP · {xp} XP en total · nivel más alto {top}',
      noRewards: 'Todavía no hay roles de recompensa.',
      hint: 'Los multiplicadores de XP por rol y canal se configuran en el panel web.',
      addReward: 'Añadir rol de recompensa',
      removeReward: 'Quitar un rol de recompensa…',
      rewardTitle: 'Nuevo rol de recompensa',
      levelLabel: 'Nivel',
      roleLabel: 'Rol',
      messagesTitle: 'Mensajes por nivel',
      noMessages: 'Sin mensajes especiales: todos los niveles usan el habitual.',
      addMessage: 'Mensaje de nivel',
      removeMessage: 'Quitar un mensaje de nivel…',
      messageTitle: 'Mensaje para un nivel',
      messageLabel: 'Mensaje',
      messageLevelHint: 'El nivel que muestra este mensaje en vez del habitual (1–1000)',
      preview: 'Vista previa',
      previewTitle: 'Así se anunciaría tu nivel {level}:',
      keepLabel: 'Conservar al reemplazarse',
      keepHint: 'Con "solo el rol más alto", los miembros conservan este igualmente.',
      noSyncLabel: 'Dar una sola vez',
      noSyncHint: 'Se da al llegar al nivel; nunca se vuelve a dar ni se quita.',
      keepFlag: 'se conserva',
      noSyncFlag: 'una vez',
      adjust: 'Cambiar XP de un miembro',
      adjustTitle: 'Cambiar la experiencia de un miembro',
      member: 'Miembro',
      action: 'Acción',
      actions: {
        add: 'Añadir XP',
        remove: 'Quitar XP',
        setXp: 'Fijar XP exacta',
        setLevel: 'Fijar nivel',
        reset: 'Reiniciar a cero',
      },
      amount: 'Cantidad',
      amountHint: 'XP, o el nivel para "Fijar nivel". No hace falta para reiniciar.',
      resetAll: 'Reiniciar toda la XP',
      confirmResetAll:
        'Esto borra la experiencia de todos los miembros. Los roles de recompensa se ajustan cuando vuelvan a chatear.',
    },
    confirm: 'Confirmar',
    cancel: 'Cancelar',
    cancelled: 'Cancelado.',
    clearAll: 'Quitar todos',
    members: {
      adjust: 'Cambiar créditos',
      accounts: 'Miembros con créditos',
      inWallets: 'Créditos en carteras',
      inBanks: 'Créditos en bancos',
      hint: 'Añade, quita o fija los créditos de cualquier miembro, o reinícialos por completo.',
      modalTitle: 'Cambiar créditos',
      member: 'Miembro',
      action: 'Acción',
      actions: {
        add: 'Añadir créditos',
        remove: 'Quitar créditos',
        set: 'Fijar cantidad exacta',
        reset: 'Reiniciar todo',
      },
      account: 'Dónde',
      amount: 'Cantidad',
      amountHint: 'No hace falta para reiniciar todo',
      amountRequired: 'Escribe una cantidad para esa acción.',
    },
    work: {
      messages: 'Trabajos',
      add: 'Añadir trabajo',
      removePlaceholder: 'Quitar un trabajo…',
      modalTitle: 'Nuevo trabajo',
      messageLabel: 'Mensaje del trabajo',
      messageHint:
        'La recompensa se añade al final. Opcional: escribe {amount} para ponerla en otro sitio.',
      confirmReset: 'Esto restaura las recompensas, la espera y los trabajos integrados.',
    },
    collect: {
      roles: 'Roles con ingresos',
      empty: 'Ningún rol da ingresos todavía.',
      add: 'Fijar ingresos de un rol',
      removePlaceholder: 'Quitar los ingresos de un rol…',
      modalTitle: 'Ingresos por rol',
      roleLabel: 'Rol',
      amountLabel: 'Créditos por cobro',
      confirmClear: 'Esto quita los ingresos de todos los roles.',
    },
    wheel: {
      prizes: 'Premios',
      empty: 'La rueda no tiene premios.',
      add: 'Añadir premio',
      resetPrizes: 'Restaurar premios',
      removePlaceholder: 'Quitar un premio…',
      modalTitle: 'Nuevo premio',
      amountLabel: 'Créditos (0 = casilla vacía)',
      labelLabel: 'Nombre personalizado (opcional)',
      confirmReset: 'Esto reemplaza todos los premios por los originales.',
    },
    shop: {
      items: 'Objetos a la venta',
      add: 'Añadir objeto',
      removePlaceholder: 'Quitar un objeto…',
      hint: 'Los objetos permanentes con rol lo dan al comprarlos; los consumibles al usarlos.',
      modalTitle: 'Nuevo objeto',
      name: 'Nombre',
      nameRequired: 'El objeto necesita un nombre.',
      typeHint: 'Los consumibles se gastan con /usar',
      role: 'Rol (opcional)',
      roleHint: 'Se da al comprarlo (permanente) o al usarlo (consumible)',
      confirmRemove:
        '¿Quitar **{item}** de la tienda? También desaparecerá de todos los inventarios.',
    },
    loans: {
      cancelAll: 'Cancelar todos',
      cancelPlaceholder: 'Cancelar el préstamo de…',
      confirmCancelAll: 'Esto cancela todos los préstamos activos.',
    },
    raffle: {
      round: 'Sorteo actual',
      waiting: 'Esperando el primer boleto',
    },
  },

  help: {
    subtitle: 'Todo lo que necesitas saber: comandos, juegos y ajustes.',
    placeholder: 'Abre una sección',
    commandPlaceholder: 'Abre un comando',
    unknownCommand: 'No existe ningún comando llamado `{name}`.',
    usage: 'Uso',
    options: 'Opciones',
    optional: 'opcional',
    cooldown: 'Espera',
    adminOnly: 'Solo administradores',
    configuredIn: 'Se ajusta en {command}',
    currentValue: 'Valor actual',
    commandsTitle: 'Comandos',
    tip: 'Consejo: usa `/ayuda comando:<nombre>` para abrir directamente un comando.',
    home: {
      intro:
        'Bienvenido a Monolith, un bot de economía y niveles ambientado en una megaestructura sin fin. Trabaja los estratos para ganar créditos, guárdalos en el banco, prueba suerte en los juegos y gástalos en la tienda.',
      quickStart: 'Tus primeros pasos',
      steps: [
        '{work} para ganar tus primeros créditos',
        '{deposit} para protegerlo de los ladrones',
        '{slots} u otro juego para multiplicarlo',
        '{shop} para gastarlo',
      ],
      amounts: 'Las cantidades aceptan `500`, `1,500`, `2.5k`, `1m`, `mitad` o `todo`.',
    },
    sections: {
      economy: {
        label: 'Economía',
        description: 'Gana, guarda y envía créditos',
        intro:
          'Tus créditos están en dos sitios: la **cartera** (lista para gastar, pero otros pueden robarte) y el **banco** (a salvo de robos). Los juegos, los pagos y la tienda siempre usan la cartera.',
      },
      games: {
        label: 'Juegos',
        description: 'Juegos, premios y la lotería',
        intro:
          'Cada juego toma tu apuesta de la cartera y paga tu apuesta por el multiplicador (×2 devuelve el doble de tu apuesta). La apuesta mínima es {min}.',
        payouts: 'Premios',
      },
      loans: {
        label: 'Préstamos',
        description: 'Pide créditos prestados y devuélvelos',
        intro:
          'Pide créditos ahora y devuélvelos con interés. Si el préstamo llega a su plazo, se cobra automáticamente: primero de tu cartera, luego de tu banco, y lo que falte deja tu cartera en negativo.',
      },
      shop: {
        label: 'Tienda',
        description: 'Objetos, roles y tu inventario',
        intro:
          'Los objetos **permanentes** se quedan en tu inventario; si dan un rol lo recibes al momento y solo se pueden comprar una vez. Los **consumibles** se gastan con /usar y pueden dar un rol al usarlos.',
      },
      levels: {
        label: 'Niveles',
        description: 'Experiencia, rangos y roles de recompensa',
        intro:
          'Los miembros ganan experiencia (XP) por chatear — una vez por cada espera, así el spam no cuenta — y, si se activa, por estar en voz. Con suficiente XP subes de nivel; algunos niveles dan un rol o créditos.',
      },
      admin: {
        label: 'Administración',
        description: 'El panel de ajustes',
        intro:
          'Todo se configura desde {command}: idioma, créditos de los miembros, trabajo, ingresos por rol, la Rueda de la Fortuna, esperas de los juegos, la tienda, los préstamos y la lotería. Solo lo ven los administradores — puedes permitirlo a otros roles en Ajustes del servidor → Integraciones.',
      },
      config: {
        label: 'Ajustes',
        description: 'Cada ajuste y su valor actual',
        intro: 'Todo esto se puede cambiar al instante desde {command}.',
      },
    },
    payouts: {
      slots: 'Pareja ×{pair} · Tres iguales ×{triple} · Tres monolitos ×{jackpot}',
      roulette: 'Color, par/impar, bajo/alto ×2 · Docena o columna ×3 · Número único ×36',
      horserace: '1.º ×{first} · 2.º ×{second} · 3.º ×{third}',
      keno: 'Elige de 1 a 10 números; salen 20 de 80. Más aciertos pagan más — hasta ×{max}.',
    },
    commands: {
      balance: {
        about:
          'Muestra la cartera, el banco, el total y el puesto en el ranking tuyos o de otro miembro, además de cualquier préstamo activo.',
      },
      deposit: {
        about:
          'Pasa créditos de tu cartera al banco. Los créditos del banco no se pueden robar con /robar.',
      },
      withdraw: { about: 'Pasa créditos del banco a tu cartera para poder gastarlos.' },
      pay: { about: 'Da créditos de tu cartera a otro miembro al instante.' },
      work: {
        about:
          'Haz un trabajo en algún punto de la Estructura (chatarra, reparaciones, mapas…) y gana una recompensa aleatoria dentro del rango configurado. Hay una espera entre trabajos.',
      },
      collect: {
        about:
          'Cobra los ingresos de cada rol que tengas y que un administrador configuró en /config. Los ingresos de todos tus roles se suman.',
      },
      wheel: {
        about:
          'Gira la Rueda de la Fortuna para ganar un premio gratis. Todas las casillas tienen la misma probabilidad y algunas están vacías.',
      },
      rob: {
        about:
          'Intenta robar parte de la cartera de otro miembro. Si un centinela te atrapa, le pagas una multa a ese miembro. Necesitas algunos créditos y el objetivo debe tener suficiente en su cartera.',
      },
      leaderboard: {
        about: 'Ordena el servidor por créditos totales (cartera + banco), 10 miembros por página.',
      },
      slots: {
        about:
          'Una tragaperras de tres rodillos. Una pareja o tres iguales dan premio, y tres monolitos ganan el bote.',
      },
      roulette: {
        about:
          'Apuesta a un color, par o impar, bajo o alto, una docena, una columna o un número. La bola cae entre 0 y 36; el 0 es verde y solo gana en apuestas a número.',
      },
      race: {
        about:
          'Apuesta por uno de los 10 drones que corren por un conducto de servicio. Ganas si tu dron termina entre los 3 primeros, y puedes ver la carrera en directo.',
      },
      keno: {
        about:
          'Elige de 1 a 10 números del 1 al 80 (o deja que el bot los elija). Salen 20 números; tus ganancias dependen de cuántos elegiste y cuántos aciertas.',
      },
      lottery: {
        about:
          'Compra boletos numerados del 000 al 999. El sorteo es un tiempo después del primer boleto de la ronda; quienes tengan el número ganador se reparten el premio y, si nadie lo tiene, el premio sigue creciendo.',
      },
      loan: {
        about:
          'Pide créditos prestados, consulta tu préstamo o devuélvelo. Solo puedes tener un préstamo a la vez y el interés se suma al pedirlo.',
      },
      shop: {
        about: 'Mira los objetos a la venta, 5 por página, con un botón Comprar en cada uno.',
      },
      buy: {
        about: 'Compra una o varias unidades de un objeto. Empieza a escribir para buscarlo.',
      },
      use: {
        about: 'Usa objetos consumibles de tu inventario. Si el objeto da un rol, lo recibes.',
      },
      inventory: {
        about: 'Muestra los objetos que tienes tú (u otro miembro) y su valor total.',
      },
      help: { about: 'Abre esta guía.' },
      rank: {
        about:
          'Muestra el nivel, el progreso al siguiente nivel, el puesto, la experiencia total, los mensajes y el tiempo en voz tuyos o de otro miembro, además de la próxima recompensa.',
      },
      levels: { about: 'Ordena el servidor por experiencia, 10 miembros por página.' },
      config: {
        about:
          'Abre el panel de ajustes: idioma, créditos de los miembros, trabajo, ingresos por rol, la Rueda de la Fortuna, esperas de los juegos, objetos de la tienda, préstamos y la lotería — todo con botones, menús y formularios. Las acciones destructivas piden confirmación.',
      },
    },
  },
};
