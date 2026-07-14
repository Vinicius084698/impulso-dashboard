import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { selectedAccounts } = body;

    if (!selectedAccounts || !Array.isArray(selectedAccounts)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    // Deleta as contas antigas desse usuario (para limpar selecoes passadas)
    await prisma.adAccount.deleteMany({
      where: { userId: session.user.id },
    });

    // Insere as novas contas selecionadas
    const accountsToInsert = selectedAccounts.map((acc: any) => ({
      userId: session.user.id,
      actId: acc.account_id,
      name: acc.name,
    }));

    if (accountsToInsert.length > 0) {
      await prisma.adAccount.createMany({
        data: accountsToInsert,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving ad accounts:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
