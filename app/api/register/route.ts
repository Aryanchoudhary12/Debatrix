import prisma from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
export async function POST(req: Request) {
  const { name, email, password } = await req.json();
  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 },
      );
    }
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: await bcrypt.hash(password, 12),
      },
    });
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 },
    );
  }
}
