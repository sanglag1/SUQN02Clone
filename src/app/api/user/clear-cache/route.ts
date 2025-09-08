import { NextResponse } from "next/server";
import { invalidateUserListCache } from "../../../../lib/userCache";

export async function POST() {
  try {
    // Clear user list cache
    invalidateUserListCache();
    
    return NextResponse.json({ 
      success: true, 
      message: "User list cache cleared" 
    });
  } catch (error) {
    console.error("Error clearing cache:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
