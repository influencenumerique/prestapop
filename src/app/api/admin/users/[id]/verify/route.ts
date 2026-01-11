import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { DocumentType, DocumentStatus } from "@prisma/client"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: userId } = await params
    const body = await request.json()
    const { status, reason, docsStatus } = body

    if (!status || !["ACTIVE", "PENDING_VERIF", "VERIFIED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Validate rejection reason
    if (status === "REJECTED" && !reason) {
      return NextResponse.json({ error: "Rejection reason required" }, { status: 400 })
    }

    // Fetch user with profile data
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        company: true,
        driverProfile: true,
        documents: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update user status
    const updateData: Record<string, unknown> = {
      status,
      verifiedById: session.user?.id
    }

    if (status === "REJECTED") {
      updateData.rejectionReason = reason
    } else {
      updateData.rejectionReason = null
    }

    await db.user.update({
      where: { id: userId },
      data: updateData
    })

    // Update documents status if provided
    if (docsStatus && typeof docsStatus === "object") {
      for (const [docType, docStatus] of Object.entries(docsStatus)) {
        // Validate document type and status are valid enum values
        if (Object.values(DocumentType).includes(docType as DocumentType) &&
            Object.values(DocumentStatus).includes(docStatus as DocumentStatus)) {
          await db.document.updateMany({
            where: { userId, type: docType as DocumentType },
            data: { status: docStatus as DocumentStatus }
          })
        }
      }
    }

    // If validated (ACTIVE or VERIFIED), also verify the company/driver profile
    if (status === "ACTIVE" || status === "VERIFIED") {
      if (user.company) {
        await db.company.update({
          where: { userId },
          data: { isVerified: true }
        })
      }
      if (user.driverProfile) {
        await db.driverProfile.update({
          where: { userId },
          data: { isVerified: true, isAvailable: true }
        })
      }
    }

    // TODO: Send email notification to user
    // await sendVerificationEmail(user.email, status, reason)

    const roleLabel = user.role === "COMPANY" ? "Entreprise" : "Chauffeur"
    let message = ""
    switch (status) {
      case "ACTIVE":
      case "VERIFIED":
        message = `${roleLabel} validé ! Email envoyé`
        break
      case "PENDING_VERIF":
        message = `${roleLabel} en attente de documents`
        break
      case "REJECTED":
        message = `${roleLabel} refusé. Email envoyé`
        break
    }

    return NextResponse.json({
      success: true,
      message,
      user: { id: userId, status }
    })
  } catch (error) {
    console.error("Error verifying user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
