import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    
    // Find user by clerkId - include role relation for faster query
    const user = await prisma.user.findUnique({
      where: { clerkId: id },
      select: {
        clerkId: true,
        role: {
          select: {
            name: true,
            displayName: true
          }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      clerkId: user.clerkId,
      role: user.role?.name || user.role?.displayName || 'user'
    });
    
  } catch (error) {
    console.error("Error fetching user role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
