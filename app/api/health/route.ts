export async function GET() {
  return Response.json({
    ok: true,
    app: "schedulia",
    timestamp: new Date().toISOString(),
  });
}
