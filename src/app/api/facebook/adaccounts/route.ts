import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = `https://graph.facebook.com/v19.0/me/adaccounts?fields=name,account_id&limit=100&access_token=${session.accessToken}`;
    const fbRes = await fetch(url);
    const data = await fbRes.json();

    if (data.error) {
      console.error("Facebook API Error:", data.error);
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    // Filtra contas específicas que o usuário quer ocultar
    const filteredAccounts = data.data.filter((acc: any) => acc.name !== "CT Barra Mansa - RJ");

    // Retorna as contas encontradas
    return NextResponse.json({ adAccounts: filteredAccounts });
  } catch (error) {
    console.error("Error fetching ad accounts:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
