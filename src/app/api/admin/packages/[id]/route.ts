import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

/**
 * Helper: Check admin quyền
 */
async function requireAdmin() {
  const clerkUser = await currentUser()
  if (!clerkUser) return null

  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    include: { role: true }
  })

  return user && user.role?.name === 'admin' ? user : null
}

// PATCH /api/admin/packages/[id] - Update package (chỉ admin)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await req.json()
    const {
      name,
      price,
      duration,
      avatarInterviewLimit,
      testQuizEQLimit,
      jdUploadLimit,
      description,
      isActive
    } = body

    // Kiểm tra package tồn tại
    const existingPackage = await prisma.servicePackage.findUnique({ where: { id } })
    if (!existingPackage) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    // Check trùng name
    if (name && name !== existingPackage.name) {
      const duplicate = await prisma.servicePackage.findFirst({
        where: { name, id: { not: id } }
      })
      if (duplicate) {
        return NextResponse.json(
          { error: 'Package name already exists' },
          { status: 409 }
        )
      }
    }

    const updatedPackage = await prisma.servicePackage.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(price !== undefined && { price }),
        ...(duration !== undefined && { duration }),
        ...(avatarInterviewLimit !== undefined && { avatarInterviewLimit }),
        ...(testQuizEQLimit !== undefined && { testQuizEQLimit }),
        ...(jdUploadLimit !== undefined && { jdUploadLimit }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      package: updatedPackage,
      message: 'Package updated successfully'
    })
  } catch (error) {
    console.error('Error updating service package:', error)
    return NextResponse.json(
      { error: 'Failed to update service package' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/packages/[id] - Delete package (chỉ admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Kiểm tra package tồn tại
    const existingPackage = await prisma.servicePackage.findUnique({ where: { id } })
    if (!existingPackage) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    // Check package có đang được user sử dụng không
    const userPackages = await prisma.userPackage.findMany({
      where: { servicePackageId: id }
    })
    if (userPackages.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete: Package is currently in use' },
        { status: 400 }
      )
    }

    await prisma.servicePackage.delete({ where: { id } })

    return NextResponse.json({ message: 'Package deleted successfully' })
  } catch (error) {
    console.error('Error deleting service package:', error)
    return NextResponse.json(
      { error: 'Failed to delete service package' },
      { status: 500 }
    )
  }
}
