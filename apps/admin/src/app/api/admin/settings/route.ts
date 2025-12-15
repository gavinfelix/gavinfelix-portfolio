// API route handler for admin settings
import { requireAdmin } from "@/lib/auth";
import { getAdminSettings, updateAdminSettings } from "@/lib/db/queries";

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/**
 * GET /api/admin/settings
 * Get admin settings
 */
export async function GET(): Promise<Response> {
  try {
    await requireAdmin();

    const settings = await getAdminSettings();

    if (!settings) {
      return Response.json(
        { ok: false, error: "Settings not found" } as ApiResponse<null>,
        { status: 404 }
      );
    }

    return Response.json({
      ok: true,
      data: {
        siteName: settings.siteName,
        allowSignup: settings.allowSignup,
        dailyTokenLimit: settings.dailyTokenLimit,
      },
    } as ApiResponse<{
      siteName: string;
      allowSignup: boolean;
      dailyTokenLimit: number;
    }>);
  } catch (error) {
    console.error("[GET /api/admin/settings] Error:", error);
    return Response.json(
      { ok: false, error: "Internal server error" } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/settings
 * Update admin settings
 */
export async function PATCH(request: Request): Promise<Response> {
  try {
    await requireAdmin();

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return Response.json(
        { ok: false, error: "Invalid JSON body" } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const { siteName, allowSignup, dailyTokenLimit } = body;

    // Validate fields
    const updateData: {
      siteName?: string;
      allowSignup?: boolean;
      dailyTokenLimit?: number;
    } = {};

    if (siteName !== undefined) {
      if (typeof siteName !== "string") {
        return Response.json(
          { ok: false, error: "siteName must be a string" } as ApiResponse<null>,
          { status: 400 }
        );
      }
      if (siteName.trim().length === 0) {
        return Response.json(
          { ok: false, error: "siteName cannot be empty" } as ApiResponse<null>,
          { status: 400 }
        );
      }
      updateData.siteName = siteName.trim();
    }

    if (allowSignup !== undefined) {
      if (typeof allowSignup !== "boolean") {
        return Response.json(
          {
            ok: false,
            error: "allowSignup must be a boolean",
          } as ApiResponse<null>,
          { status: 400 }
        );
      }
      updateData.allowSignup = allowSignup;
    }

    if (dailyTokenLimit !== undefined) {
      if (typeof dailyTokenLimit !== "number") {
        return Response.json(
          {
            ok: false,
            error: "dailyTokenLimit must be a number",
          } as ApiResponse<null>,
          { status: 400 }
        );
      }
      if (dailyTokenLimit < 0) {
        return Response.json(
          {
            ok: false,
            error: "dailyTokenLimit must be non-negative",
          } as ApiResponse<null>,
          { status: 400 }
        );
      }
      updateData.dailyTokenLimit = dailyTokenLimit;
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return Response.json(
        { ok: false, error: "No fields to update" } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // Update settings
    const updated = await updateAdminSettings(updateData);

    if (!updated) {
      return Response.json(
        { ok: false, error: "Failed to update settings" } as ApiResponse<null>,
        { status: 500 }
      );
    }

    return Response.json({
      ok: true,
      data: {
        siteName: updated.siteName,
        allowSignup: updated.allowSignup,
        dailyTokenLimit: updated.dailyTokenLimit,
      },
    } as ApiResponse<{
      siteName: string;
      allowSignup: boolean;
      dailyTokenLimit: number;
    }>);
  } catch (error) {
    console.error("[PATCH /api/admin/settings] Error:", error);
    return Response.json(
      { ok: false, error: "Internal server error" } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

