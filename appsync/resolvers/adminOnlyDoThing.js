export function request(ctx) {
  const groups = ctx.identity?.groups ?? [];
  const allowed = ["ADMIN", "PRIME"];
  if (!allowed.some(g => groups.includes(g))) {
    util.unauthorized(); // 401 if not in allowed groups
  }
  return { payload: {} }; // no data source needed if you just return a string
}

export function response(ctx) {
  return `ok: ${ctx.args.note}`;
}
