import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await getAuth(req);
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { email, firstName, lastName } = body;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (existingUser) {
            return NextResponse.json({
                message: 'User already exists in database',
                user: existingUser
            });
        }

        // Create new user
        const newUser = await prisma.user.create({
            data: {
                id: userId,
                email: email || '',
                clerkId: userId,
                firstName: firstName || '',
                lastName: lastName || '',
                roleId: 'user_role_id'
            }
        });

        return NextResponse.json({
            message: 'User synced successfully',
            user: newUser
        }, { status: 201 });

    } catch (error) {
        console.error('Error syncing user:', error);
        return NextResponse.json(
            {
                error: 'Failed to sync user',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 