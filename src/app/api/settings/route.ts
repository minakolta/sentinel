import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireAuth, requireRole, Role } from "@/lib/auth";
import { SettingsService } from "@/server/services/settings";
import {
  orgSettingsSchema,
  alertSettingsSchema,
  smtpSettingsSchema,
  slackSettingsSchema,
} from "@/lib/validations/settings";
import { z } from "zod";

// GET /api/settings - Get all settings (ADMIN only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);
    requireRole(session!, [Role.ADMIN]);

    const settings = await SettingsService.getAll();
    return NextResponse.json(settings);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized" || error.message === "Forbidden") {
        return NextResponse.json({ error: error.message }, { status: error.message === "Unauthorized" ? 401 : 403 });
      }
    }
    console.error("Failed to get settings:", error);
    return NextResponse.json({ error: "Failed to get settings" }, { status: 500 });
  }
}

// PATCH /api/settings - Update settings (ADMIN only)
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);
    requireRole(session!, [Role.ADMIN]);

    const body = await request.json();
    const { section } = body;

    switch (section) {
      case "org": {
        const data = orgSettingsSchema.parse(body.data);
        await SettingsService.setMany(
          {
            "org.name": data.name,
            "org.allowedDomains": data.allowedDomains,
            "org.logo": data.logo || null,
          },
          session!.user.id
        );
        break;
      }

      case "alerts": {
        const data = alertSettingsSchema.parse(body.data);
        await SettingsService.set("alerts.windows", data.windows, session!.user.id);
        break;
      }

      case "smtp": {
        const data = smtpSettingsSchema.parse(body.data);
        await SettingsService.set("smtp.enabled", data.enabled, session!.user.id);
        if (data.host && data.port && data.user) {
          await SettingsService.set(
            "smtp.config",
            {
              host: data.host,
              port: data.port,
              user: data.user,
              pass: data.pass || "",
            },
            session!.user.id
          );
        }
        break;
      }

      case "slack": {
        const data = slackSettingsSchema.parse(body.data);
        await SettingsService.set("slack.enabled", data.enabled, session!.user.id);
        if (data.webhookUrl) {
          await SettingsService.set("slack.webhookUrl", data.webhookUrl, session!.user.id);
        }
        break;
      }

      default:
        return NextResponse.json({ error: "Invalid section" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof Error) {
      if (error.message === "Unauthorized" || error.message === "Forbidden") {
        return NextResponse.json({ error: error.message }, { status: error.message === "Unauthorized" ? 401 : 403 });
      }
    }
    console.error("Failed to update settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
