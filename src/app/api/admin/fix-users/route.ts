import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function POST() {
  try {
    // Find all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true
      }
    });
    
    let updated = 0;
    
    for (const user of users) {
      const updates: { avatar?: string } = {};
      
      // If user has no avatar, set it to empty string
      if (!user.avatar) {
        updates.avatar = '';
      }
      
      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: updates
        });
        updated++;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Updated ${updated} users`,
      totalUsers: users.length
    });
    
  } catch (error) {
    console.error("Error fixing users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
