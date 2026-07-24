import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/app/lib/cloudinary";
import prisma from "@/app/lib/prisma";
import { auth } from "@/app/auth";
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream((error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
      stream.end(buffer);
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: uploadResult.secure_url },
    });

    return NextResponse.json({ url: uploadResult.secure_url });
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
