import { LEGAL_PLACEHOLDERS as P, type LegalDocument } from "@/lib/legal/types";

// Written to match what the code actually does. When a data flow changes
// (a new provider, analytics, payments), update this file in the same change.

const en: LegalDocument = {
  title: "Privacy policy",
  updated: "Last updated: September 30, 2026",
  intro:
    "Perch is a personal finance app operated by an individual developer based in Costa Rica (\"we\", \"us\"). This policy explains what information Perch handles, why, who else processes it, and the choices you have.",
  sections: [
    {
      heading: "What we collect",
      blocks: [
        { p: "When you sign in with Google, we receive your name, email address, profile photo and a unique account ID from Google. We don't receive or store your Google password." },
        { p: "Everything else in Perch is information you enter yourself:" },
        {
          list: [
            "Accounts, cards and their balances, credit limits and statement days",
            "Transactions, transfers, refunds, installments and their descriptions, categories and tags",
            "Budgets, saving goals, recurring items, investment holdings and valuations",
            "Preferences such as language and display currency, and nicknames for people you connect with",
          ],
        },
        { p: "Perch does not connect to your bank and never asks for bank credentials." },
      ],
    },
    {
      heading: "What stays on your device",
      blocks: [
        { p: "To work offline and remember your choices, Perch stores some data in your browser's local storage and IndexedDB: a copy of your data for offline use, your language, the last exchange rates, and, if you turn on app lock, a salted hash of your PIN. The PIN itself is never sent anywhere. Signing out clears the offline copy from that device." },
        { p: "Perch does not use advertising or analytics cookies and does not track you across websites. The storage above is necessary for the app to work or reflects a choice you made, so no cookie consent banner is shown." },
      ],
    },
    {
      heading: "How we use it",
      blocks: [
        { list: [
          "To show you your accounts, budgets, goals and reports",
          "To convert amounts between currencies and price your investments",
          "To let people you choose share a budget with you",
          "To keep the service secure and working",
        ] },
        { p: "We don't sell your data, use it for advertising, or share it with anyone except the service providers below." },
      ],
    },
    {
      heading: "Service providers",
      blocks: [
        { list: [
          `Google Firebase (Google LLC): sign-in and database. Your data is stored in Google Cloud in ${P.dataRegion}.`,
          "Vercel Inc.: hosts the website; its servers log standard request data such as IP addresses.",
          "Twelve Data: provides market prices. Our server sends it ticker symbols and dates only, never your identity.",
          "open.er-api.com: provides exchange rates. Your browser requests the rates directly, so the provider sees your IP address.",
          "tipodecambio.info: the source of Costa Rican bank window rates. Our server fetches them; no personal information is sent.",
        ] },
        { p: "These providers may process data outside Costa Rica, including in the United States." },
      ],
    },
    {
      heading: "Sharing a budget",
      blocks: [
        { p: "If you connect with someone using a connection code, they can see and edit your accounts, transactions and other data, and you can see theirs. You can end a connection at any time from Settings. Entries you add to someone else's budget belong to that budget and stay there if you leave." },
      ],
    },
    {
      heading: "How long we keep it",
      blocks: [
        { p: "We keep your data while your account exists. Items you delete go to Recently deleted and are removed for good after 30 days. When you delete your account, your data is erased immediately from our database." },
      ],
    },
    {
      heading: "Your rights",
      blocks: [
        { p: "Under Costa Rica's Law 8968 on the Protection of Individuals with regard to the Processing of their Personal Data, and similar laws where you live, you can access, correct and delete your information and object to how it's used. In Perch you can:" },
        { list: [
          "See and edit everything you've entered, at any time",
          "Export all your transactions as CSV from Settings → Import & export",
          "Delete your account and all its data from Settings → Delete account",
        ] },
        { p: `For anything else, write to ${P.contactEmail}.` },
      ],
    },
    {
      heading: "Security",
      blocks: [
        { p: "Your data is transferred over encrypted connections and protected by Google sign-in and database rules that only let you, and people you connect with, read it. App lock adds a PIN or fingerprint on your device; it doesn't encrypt the data stored on that device. No system is perfectly secure, so keep your Google account protected." },
      ],
    },
    {
      heading: "Children",
      blocks: [
        { p: "Perch is not intended for people under 18, and we don't knowingly collect their information." },
      ],
    },
    {
      heading: "Changes and contact",
      blocks: [
        { p: "If we change this policy, we'll update the date above and, for significant changes, tell you in the app." },
        { p: `Questions or requests: ${P.contactEmail}.` },
      ],
    },
  ],
};

const es: LegalDocument = {
  title: "Política de privacidad",
  updated: "Última actualización: 30 de septiembre de 2026",
  intro:
    "Perch es una aplicación de finanzas personales operada por un desarrollador independiente con sede en Costa Rica (\"nosotros\"). Esta política explica qué información maneja Perch, para qué, quién más la procesa y qué opciones tienes.",
  sections: [
    {
      heading: "Qué recopilamos",
      blocks: [
        { p: "Cuando ingresas con Google, recibimos de Google tu nombre, correo electrónico, foto de perfil y un identificador único de cuenta. No recibimos ni guardamos tu contraseña de Google." },
        { p: "Todo lo demás en Perch es información que tú mismo ingresas:" },
        {
          list: [
            "Cuentas, tarjetas y sus saldos, límites de crédito y días de corte y pago",
            "Transacciones, transferencias, reembolsos, cuotas y sus descripciones, categorías y etiquetas",
            "Presupuestos, metas de ahorro, recurrentes, posiciones de inversión y valoraciones",
            "Preferencias como idioma y moneda, y apodos de las personas con las que te conectas",
          ],
        },
        { p: "Perch no se conecta a tu banco y nunca te pide credenciales bancarias." },
      ],
    },
    {
      heading: "Qué se queda en tu dispositivo",
      blocks: [
        { p: "Para funcionar sin conexión y recordar tus preferencias, Perch guarda algunos datos en el almacenamiento local y en IndexedDB de tu navegador: una copia de tus datos para uso sin conexión, tu idioma, los últimos tipos de cambio y, si activas el bloqueo, un hash con sal de tu PIN. El PIN nunca se envía a ningún lado. Al cerrar sesión se borra la copia sin conexión de ese dispositivo." },
        { p: "Perch no usa cookies de publicidad ni de analítica y no te rastrea entre sitios. El almacenamiento anterior es necesario para que la app funcione o refleja una elección tuya, por eso no se muestra un aviso de consentimiento de cookies." },
      ],
    },
    {
      heading: "Para qué la usamos",
      blocks: [
        { list: [
          "Para mostrarte tus cuentas, presupuestos, metas y reportes",
          "Para convertir montos entre monedas y valorar tus inversiones",
          "Para que las personas que elijas compartan un presupuesto contigo",
          "Para mantener el servicio seguro y funcionando",
        ] },
        { p: "No vendemos tus datos, no los usamos para publicidad y no los compartimos con nadie salvo los proveedores de servicio siguientes." },
      ],
    },
    {
      heading: "Proveedores de servicio",
      blocks: [
        { list: [
          `Google Firebase (Google LLC): inicio de sesión y base de datos. Tus datos se guardan en Google Cloud en ${P.dataRegion}.`,
          "Vercel Inc.: aloja el sitio; sus servidores registran datos estándar de las solicitudes, como direcciones IP.",
          "Twelve Data: provee precios de mercado. Nuestro servidor solo le envía símbolos y fechas, nunca tu identidad.",
          "open.er-api.com: provee tipos de cambio. Tu navegador los solicita directamente, así que el proveedor ve tu dirección IP.",
          "tipodecambio.info: la fuente de los tipos de cambio de ventanilla de los bancos de Costa Rica. Nuestro servidor los consulta; no se envía información personal.",
        ] },
        { p: "Estos proveedores pueden procesar datos fuera de Costa Rica, incluso en Estados Unidos." },
      ],
    },
    {
      heading: "Compartir un presupuesto",
      blocks: [
        { p: "Si te conectas con alguien mediante un código de conexión, esa persona puede ver y editar tus cuentas, transacciones y demás datos, y tú los de ella. Puedes terminar una conexión en cualquier momento desde Ajustes. Lo que agregues al presupuesto de otra persona pertenece a ese presupuesto y se queda ahí si te vas." },
      ],
    },
    {
      heading: "Cuánto tiempo la conservamos",
      blocks: [
        { p: "Conservamos tus datos mientras exista tu cuenta. Lo que eliminas pasa a Eliminados recientemente y se borra definitivamente a los 30 días. Si eliminas tu cuenta, tus datos se borran de inmediato de nuestra base de datos." },
      ],
    },
    {
      heading: "Tus derechos",
      blocks: [
        { p: "Según la Ley 8968 de Protección de la Persona frente al Tratamiento de sus Datos Personales, y leyes similares donde vivas, puedes acceder a tu información, corregirla, eliminarla y oponerte a su uso. En Perch puedes:" },
        { list: [
          "Ver y editar todo lo que has ingresado, en cualquier momento",
          "Exportar todas tus transacciones en CSV desde Ajustes → Importar y exportar",
          "Eliminar tu cuenta y todos sus datos desde Ajustes → Eliminar cuenta",
        ] },
        { p: `Para cualquier otra solicitud, escribe a ${P.contactEmail}.` },
      ],
    },
    {
      heading: "Seguridad",
      blocks: [
        { p: "Tus datos viajan por conexiones cifradas y están protegidos por el inicio de sesión de Google y reglas de base de datos que solo te permiten leerlos a ti y a las personas con las que te conectas. El bloqueo de la app agrega un PIN o tu huella en tu dispositivo; no cifra los datos guardados en él. Ningún sistema es perfectamente seguro, así que protege tu cuenta de Google." },
      ],
    },
    {
      heading: "Menores de edad",
      blocks: [
        { p: "Perch no está dirigido a personas menores de 18 años y no recopilamos su información a sabiendas." },
      ],
    },
    {
      heading: "Cambios y contacto",
      blocks: [
        { p: "Si cambiamos esta política, actualizaremos la fecha de arriba y, si el cambio es importante, te avisaremos en la app." },
        { p: `Preguntas o solicitudes: ${P.contactEmail}.` },
      ],
    },
  ],
};

export const privacyPolicy = { en, es };
