import { NextResponse } from "next/server";
import { invalidateUserListCache } from "../../../../lib/userCache";

// This endpoint is used to invalidate the user list cache from other routes
export async function POST() {
  try {
    invalidateUserListCache();
    
    return NextResponse.json({
      success: true,
      message: "User list cache invalidated"
    });
  } catch (error) {
    console.error("Error invalidating cache:", error);
    return NextResponse.json(
      { error: "Failed to invalidate cache" },
      { status: 500 }
    );
  }
}
