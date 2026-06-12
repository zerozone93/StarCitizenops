import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { OrganizationFocusType, OrganizationVisibility } from "@prisma/client";
import { isPrismaUniqueError, registerSchema } from "@/lib/auth";
import { TERMS_VERSION } from "@/lib/legal";
import { prisma } from "@/lib/prisma";
import { verifyStarCitizenOrganizationByTag } from "@/lib/star-citizen-org";
import { sendWelcomeEmail } from "@/server/mail";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid registration input",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  try {
    const passwordHash = await hash(parsed.data.password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name: parsed.data.name,
          email: parsed.data.email.trim().toLowerCase(),
          passwordHash,
          starCitizenHandle: parsed.data.starCitizenHandle || null,
          timezone: parsed.data.timezone || null,
          termsAcceptedAt: new Date(),
          termsAcceptedVersion: TERMS_VERSION,
        },
      });

      if (parsed.data.organizationIntent === "create") {
        const verification = await verifyStarCitizenOrganizationByTag(parsed.data.organizationTag!.trim());

        const organization = await tx.organization.create({
          data: {
            name: parsed.data.organizationName!.trim(),
            tag: parsed.data.organizationTag!.trim().toUpperCase(),
            description: parsed.data.organizationDescription?.trim() || null,
            starCitizenVerified: verification.verified,
            starCitizenVerificationCheckedAt: verification.checkedAt,
            ownerId: createdUser.id,
            focusType: OrganizationFocusType.MIXED,
            visibility: OrganizationVisibility.PUBLIC,
          },
        });

        await tx.organizationMember.create({
          data: {
            userId: createdUser.id,
            organizationId: organization.id,
            role: "OWNER",
            title: "Founder",
          },
        });
      }

      if (parsed.data.organizationIntent === "join") {
        const organization = await tx.organization.findUnique({
          where: { id: parsed.data.joinOrganizationId! },
          select: { id: true },
        });

        if (!organization) {
          throw new Error("Organization not found");
        }

        await tx.organizationJoinRequest.create({
          data: {
            organizationId: organization.id,
            userId: createdUser.id,
            applicantHandle:
              createdUser.starCitizenHandle?.trim() ||
              createdUser.name?.trim() ||
              createdUser.email?.split("@")[0] ||
              "Applicant",
            preferredRole: "Member",
            weeklyAvailability: "Not provided",
            reasonToJoin:
              parsed.data.joinRequestMessage?.trim() ||
              "Submitted during account registration.",
            message: parsed.data.joinRequestMessage?.trim() || null,
          },
        });
      }

      return createdUser;
    });

    if (user.email) {
      try {
        const mailInfo = await sendWelcomeEmail(user.email, user.name);
        console.info("Welcome email send accepted", {
          email: user.email,
          messageId: mailInfo.messageId,
          accepted: mailInfo.accepted,
          rejected: mailInfo.rejected,
          response: mailInfo.response,
        });
      } catch (mailError) {
        console.error("Welcome email send failed", mailError);
      }
    }

    return NextResponse.json({ id: user.id }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Organization not found") {
      return NextResponse.json({ error: "Selected organization was not found" }, { status: 404 });
    }

    if (isPrismaUniqueError(error)) {
      return NextResponse.json({ error: "Email or organization tag already exists" }, { status: 409 });
    }

    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
