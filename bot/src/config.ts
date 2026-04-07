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
  get ADMIN_URL(): string {
    return require_env("ADMIN_URL");
  },
  get ADMIN_BOT_SECRET(): string {
    return require_env("ADMIN_BOT_SECRET");
  },
};
