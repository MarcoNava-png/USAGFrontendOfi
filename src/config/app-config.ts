import packageJson from "../../package.json";

export const APP_CONFIG = {
  name: "USAG",
  fullName: "Universidad San Andrés de Guanajuato",
  version: packageJson.version,
  copyright: "© 2026, Universidad San Andrés de Guanajuato.",
  domain: process.env.NEXT_PUBLIC_DOMAIN ?? "saciusag.com.mx",
  emailDomain: process.env.NEXT_PUBLIC_EMAIL_DOMAIN ?? "usaguanajuato.edu.mx",
  meta: {
    title: "USAG - Sistema Académico",
    description: "Sistema de Gestión Académica - Universidad San Andrés de Guanajuato",
  },
};
