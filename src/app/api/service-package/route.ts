import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// GET - Get all service packages and user's current package
export async function GET(req: NextRequest) {
    try {
        const packages = await prisma.servicePackage.findMany({
            orderBy: { price: 'asc' }
        });

        // Lấy tất cả các gói active của user nếu có user đăng nhập
    type UserPackageWithService = {
        id: string;
        userId: string;
        servicePackageId: string;
        orderCode?: string | null;
        startDate: Date;
        endDate: Date;
        avatarInterviewUsed: number;
        testQuizEQUsed: number;
        jdUploadUsed: number;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        servicePackage: {
            id: string;
            name: string;
            price: number;
            duration: number;
            avatarInterviewLimit: number;
            testQuizEQLimit: number;
            jdUploadLimit: number;
            description?: string | null;
            highlight: boolean;
            createdAt: Date;
            isActive: boolean;
            updatedAt: Date;
        };
    };
    let userPackages: UserPackageWithService[] = [];
        try {
            const { userId } = await getAuth(req);
            if (userId) {
                // Tìm user trong database theo clerkId
                const user = await prisma.user.findUnique({
                    where: { clerkId: userId }
                });
                if (user) {
                    // Tìm tất cả các gói active còn hạn
                    userPackages = await prisma.userPackage.findMany({
                        where: {
                            userId: user.id,
                            isActive: true,
                            endDate: { gte: new Date() }
                        },
                        include: { servicePackage: true }
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching user packages:', error);
        }

        return NextResponse.json({ packages, userPackages });
    } catch (error) {
        console.error('Error fetching service packages:', error);
        return NextResponse.json(
            { error: 'Failed to fetch service packages' },
            { status: 500 }
        );
    }
}

// POST - Create new service package
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
        const { name, description, price, duration, avatarInterviewLimit, testQuizEQLimit, jdUploadLimit, highlight } = body;

        if (!name || price === undefined || price === null || duration === undefined || duration === null) {
            return NextResponse.json(
                { error: 'Name, price, and duration are required' },
                { status: 400 }
            );
        }

        const newPackage = await prisma.servicePackage.create({
            data: {
                name,
                description: description || '',
                price: parseInt(price),
                duration: parseInt(duration),
                avatarInterviewLimit: parseInt(avatarInterviewLimit) || 0,
                testQuizEQLimit: parseInt(testQuizEQLimit) || 0,
                jdUploadLimit: parseInt(jdUploadLimit) || 0,
                highlight: highlight || false
            }
        });

        return NextResponse.json(newPackage, { status: 201 });
    } catch (error) {
        console.error('Error creating service package:', error);
        return NextResponse.json(
            {
                error: 'Failed to create service package',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// PATCH - Update service package
export async function PATCH(req: NextRequest) {
    try {
        const { userId } = await getAuth(req);
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'Package ID is required' },
                { status: 400 }
            );
        }

        const updatedPackage = await prisma.servicePackage.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(updatedPackage);
    } catch (error) {
        console.error('Error updating service package:', error);
        return NextResponse.json(
            { error: 'Failed to update service package' },
            { status: 500 }
        );
    }
}

// DELETE - Delete service package
export async function DELETE(req: NextRequest) {
    try {
        const { userId } = await getAuth(req);
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { servicePackageId } = body;

        if (!servicePackageId) {
            return NextResponse.json(
                { error: 'Package ID is required' },
                { status: 400 }
            );
        }

        // Check if package exists
        const existingPackage = await prisma.servicePackage.findUnique({
            where: { id: servicePackageId }
        });

        if (!existingPackage) {
            return NextResponse.json(
                { error: 'Service package not found' },
                { status: 404 }
            );
        }

        console.log('Found package:', existingPackage.name);

        // Check if any users are currently using this package
        const activeUsers = await prisma.userPackage.count({
            where: {
                servicePackageId: servicePackageId,
                isActive: true
            }
        });

        if (activeUsers > 0) {
            return NextResponse.json(
                { error: `Cannot delete package: ${activeUsers} users are currently using it` },
                { status: 409 }
            );
        }

        const deletedPackage = await prisma.servicePackage.delete({
            where: { id: servicePackageId }
        });

        return NextResponse.json({
            message: 'Service package deleted successfully',
            deletedPackage
        });
    } catch (error) {
        console.error('Error deleting service package:', error);
        return NextResponse.json(
            {
                error: 'Failed to delete service package',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 