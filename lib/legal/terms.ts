import { LEGAL_PLACEHOLDERS as P, type LegalDocument } from "@/lib/legal/types";

const en: LegalDocument = {
  title: "Terms of service",
  updated: "Last updated: October 2, 2026",
  intro:
    "These terms govern your use of PerchCR, a personal finance app operated by an individual developer based in Costa Rica (\"we\", \"us\"). By signing in, you agree to them.",
  sections: [
    {
      heading: "What PerchCR is",
      blocks: [
        { p: "PerchCR helps you record and review your own money: accounts, transactions, budgets, goals and investments. Everything in it is information you enter or import yourself. PerchCR does not connect to banks, move money, or hold funds." },
      ],
    },
    {
      heading: "Not financial advice",
      blocks: [
        { p: "PerchCR shows calculations based on what you enter. It is not financial, investment, tax or legal advice, and nothing in it is a recommendation to buy, sell or hold anything. Make important decisions with a qualified professional." },
      ],
    },
    {
      heading: "Exchange rates and prices",
      blocks: [
        { p: "Exchange rates and market prices come from third parties and may be delayed, incomplete or wrong. Check your bank or broker for the figures that apply to you. Amounts you type in yourself are your responsibility." },
      ],
    },
    {
      heading: "Your account",
      blocks: [
        { list: [
          "You sign in with a Google account and are responsible for keeping it secure.",
          "You're responsible for the accuracy of what you enter and for who you share your budget with.",
          "You must be at least 18 years old to use PerchCR.",
        ] },
      ],
    },
    {
      heading: "Acceptable use",
      blocks: [
        { p: "Don't use PerchCR to break the law, to access other people's data without permission, to interfere with the service or its providers, or to scrape or overload it." },
      ],
    },
    {
      heading: "Your data",
      blocks: [
        { p: "Your data is yours. You give us permission to store and process it only to run PerchCR for you, as described in the privacy policy. You can export it or delete your account at any time from Settings." },
      ],
    },
    {
      heading: "Changes to the service",
      blocks: [
        { p: "We may change, add or remove features. PerchCR may introduce paid features in the future; we'll tell you before anything is charged, and you'll always be able to export your data." },
      ],
    },
    {
      heading: "Availability and liability",
      blocks: [
        { p: "PerchCR is provided \"as is\", without warranties of any kind. We work to keep it available and accurate but can't guarantee it will be uninterrupted or error-free. To the extent the law allows, we aren't liable for indirect or consequential losses, or for decisions made based on information shown in PerchCR." },
      ],
    },
    {
      heading: "Ending your use",
      blocks: [
        { p: "You can stop using PerchCR and delete your account at any time. We may suspend accounts that break these terms, and will tell you why when we can." },
      ],
    },
    {
      heading: "Governing law and contact",
      blocks: [
        { p: "These terms are governed by the laws of Costa Rica. If we change them, we'll update the date above and tell you in the app about significant changes." },
        { p: `Questions: ${P.contactEmail}.` },
      ],
    },
  ],
};

const es: LegalDocument = {
  title: "Términos del servicio",
  updated: "Última actualización: 2 de octubre de 2026",
  intro:
    "Estos términos rigen el uso de PerchCR, una aplicación de finanzas personales operada por un desarrollador independiente con sede en Costa Rica (\"nosotros\"). Al ingresar, los aceptas.",
  sections: [
    {
      heading: "Qué es PerchCR",
      blocks: [
        { p: "PerchCR te ayuda a registrar y revisar tu propio dinero: cuentas, transacciones, presupuestos, metas e inversiones. Todo lo que contiene lo ingresas o importas tú. PerchCR no se conecta a bancos, no mueve dinero ni custodia fondos." },
      ],
    },
    {
      heading: "No es asesoría financiera",
      blocks: [
        { p: "PerchCR muestra cálculos basados en lo que ingresas. No es asesoría financiera, de inversión, tributaria ni legal, y nada en la app es una recomendación de comprar, vender o mantener algo. Toma las decisiones importantes con un profesional calificado." },
      ],
    },
    {
      heading: "Tipos de cambio y precios",
      blocks: [
        { p: "Los tipos de cambio y precios de mercado vienen de terceros y pueden estar atrasados, incompletos o equivocados. Verifica con tu banco o bróker las cifras que te aplican. Los montos que escribes tú son tu responsabilidad." },
      ],
    },
    {
      heading: "Tu cuenta",
      blocks: [
        { list: [
          "Ingresas con una cuenta de Google y eres responsable de mantenerla segura.",
          "Eres responsable de la exactitud de lo que ingresas y de con quién compartes tu presupuesto.",
          "Debes tener al menos 18 años para usar PerchCR.",
        ] },
      ],
    },
    {
      heading: "Uso aceptable",
      blocks: [
        { p: "No uses PerchCR para infringir la ley, acceder a datos de otras personas sin permiso, interferir con el servicio o sus proveedores, ni para extraer datos o sobrecargarlo." },
      ],
    },
    {
      heading: "Tus datos",
      blocks: [
        { p: "Tus datos son tuyos. Nos das permiso para guardarlos y procesarlos solo para que PerchCR funcione para ti, como se describe en la política de privacidad. Puedes exportarlos o eliminar tu cuenta en cualquier momento desde Ajustes." },
      ],
    },
    {
      heading: "Cambios en el servicio",
      blocks: [
        { p: "Podemos cambiar, agregar o quitar funciones. PerchCR podría incluir funciones de pago en el futuro; te avisaremos antes de cobrar cualquier cosa y siempre podrás exportar tus datos." },
      ],
    },
    {
      heading: "Disponibilidad y responsabilidad",
      blocks: [
        { p: "PerchCR se ofrece \"tal cual\", sin garantías de ningún tipo. Trabajamos para mantenerlo disponible y exacto, pero no podemos garantizar que funcione sin interrupciones ni errores. En la medida en que la ley lo permita, no somos responsables por pérdidas indirectas o consecuentes, ni por decisiones tomadas con base en la información que muestra PerchCR." },
      ],
    },
    {
      heading: "Dejar de usar PerchCR",
      blocks: [
        { p: "Puedes dejar de usar PerchCR y eliminar tu cuenta en cualquier momento. Podemos suspender cuentas que incumplan estos términos y, cuando sea posible, te diremos por qué." },
      ],
    },
    {
      heading: "Ley aplicable y contacto",
      blocks: [
        { p: "Estos términos se rigen por las leyes de Costa Rica. Si los cambiamos, actualizaremos la fecha de arriba y te avisaremos en la app de los cambios importantes." },
        { p: `Preguntas: ${P.contactEmail}.` },
      ],
    },
  ],
};

export const termsOfService = { en, es };
