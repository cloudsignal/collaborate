import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { name } = await request.json();

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const tokenServiceUrl = process.env.CLOUDSIGNAL_TOKEN_SERVICE_URL;
  const secretKey = process.env.CLOUDSIGNAL_SECRET_KEY;
  const orgId = process.env.CLOUDSIGNAL_ORG_ID;

  if (!tokenServiceUrl || !secretKey || !orgId) {
    return NextResponse.json(
      { error: "Server not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${tokenServiceUrl}/v1/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organization_id: orgId,
        secret_key: secretKey,
        user_email: `${name.trim().toLowerCase().replace(/\s+/g, "-")}@demo.cloudsignal.app`,
        replace_existing: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Token creation failed" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      username: data.mqtt_username,
      password: data.token_password,
      orgShortId: data.org_short_id,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to token service" },
      { status: 502 }
    );
  }
}
