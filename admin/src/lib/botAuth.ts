export function isBotAuthorized(request: Request): boolean {
  const auth = request.headers.get("Authorization");
  const secret = process.env.ADMIN_BOT_SECRET;
  if (!secret) return false;
  return auth === `Bearer ${secret}`;
}

export function unauthorizedResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
