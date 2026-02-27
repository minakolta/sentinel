import { NextResponse } from "next/server";
import { SettingsService } from "@/server/services/settings";

// GET /api/branding - Public endpoint for branding info
export async function GET() {
  try {
    const settings = await SettingsService.getMany<{
      "org.name": string;
      "org.logo": string | null;
    }>(["org.name", "org.logo"]);

    return NextResponse.json({
      name: settings["org.name"] || "Sentinel",
      logo: settings["org.logo"] || null,
    });
  } catch (error) {
    console.error("Failed to get branding:", error);
    return NextResponse.json({
      name: "Sentinel",
      logo: null,
    });
  }
}
