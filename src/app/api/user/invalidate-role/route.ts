import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const currentClerkUser = await currentUser();
    
    if (!currentClerkUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    try {
      const user = await prisma.user.findUnique({
        where: { clerkId: currentClerkUser.id },
        include: { role: true }
      });
      
      if (!user || user.role?.name !== 'admin') {
        return NextResponse.json(
          { 
            error: "Access Denied", 
            message: "You don't have permission to access this admin API."
          },
          { status: 403 }
        );
      }
    } catch (dbError) {
      console.error('Error checking admin role:', dbError);
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }

    const { clerkId } = await request.json();
    
    if (!clerkId) {
      return NextResponse.json(
        { error: "Clerk ID is required" },
        { status: 400 }
      );
    }

    // Broadcast to all clients to invalidate role cache for this user
    // This will trigger the storage event listener in RoleContext
    return NextResponse.json({
      success: true,
      message: "Role invalidation signal sent",
      clerkId,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error("Error invalidating role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
