import "dotenv/config";

function require_env(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
}

export const config = {
  BOT_TOKEN: require_env("BOT_TOKEN"),
  ANTHROPIC_API_KEY: require_env("ANTHROPIC_API_KEY"),
  DATABASE_URL: require_env("DATABASE_URL"),
  STRAPI_URL: require_env("STRAPI_URL"),
  STRAPI_API_TOKEN: require_env("STRAPI_API_TOKEN"),
};
