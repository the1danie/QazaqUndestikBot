import "dotenv/config";

function require_env(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
}

export const config = {
  get BOT_TOKEN(): string {
    return require_env("BOT_TOKEN");
  },
  get ALEM_API_KEY(): string {
    return require_env("ALEM_API_KEY");
  },
  get DATABASE_URL(): string {
    return require_env("DATABASE_URL");
  },
  get STRAPI_URL(): string {
    return require_env("STRAPI_URL");
  },
  get STRAPI_API_TOKEN(): string {
    return require_env("STRAPI_API_TOKEN");
  },
  get STRAPI_PUBLIC_URL(): string {
    // URL accessible from outside Docker (for images sent to Telegram)
    return process.env.STRAPI_PUBLIC_URL || "http://localhost:1337";
  },
};
