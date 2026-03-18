import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    let message: string;
    let requestId: string | null = null;

    if (body.type === "INSERT" && body.record) {
      const record = body.record;
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Fetch user email from profiles
      let userEmail = "Unknown";
      if (record.user_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", record.user_id)
          .single();
        if (profile?.email) userEmail = profile.email;
      }

      // Get the request ID for callback buttons
      if (record.id) {
        requestId = record.id;
      } else {
        // Look up the latest pending request for this user
        const { data: latestReq } = await supabase
          .from("payment_requests")
          .select("id")
          .eq("user_id", record.user_id)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        if (latestReq) requestId = latestReq.id;
      }

      const receiptUrl = record.receipt_url
        ? `${supabaseUrl}/storage/v1/object/public/receipts/${record.receipt_url}`
        : "No receipt";

      message = [
        "💰 <b>New Payment Request!</b>",
        "",
        `👤 Email: ${userEmail}`,
        `💵 Amount: $${record.amount ?? "0"}`,
        `📅 Plan: ${record.duration_days ?? 30} days`,
        `🖼 <a href="${receiptUrl}">View Receipt</a>`,
      ].join("\n");
    } else if (body.message) {
      // Manual admin call — validate JWT + admin role
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: "Missing authorization header" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!roleData) {
        return new Response(
          JSON.stringify({ error: "Forbidden: admin role required" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      message = body.message;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const chatId = Deno.env.get("TELEGRAM_CHAT_ID");

    if (!botToken || !chatId) {
      console.error("Telegram credentials not configured");
      return new Response(
        JSON.stringify({ error: "An internal error occurred" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build request body with optional inline keyboard
    const telegramBody: Record<string, unknown> = {
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
    };

    // Add approve/reject inline buttons if we have a request ID
    if (requestId) {
      telegramBody.reply_markup = {
        inline_keyboard: [
          [
            { text: "✅ Approve", callback_data: `approve:${requestId}` },
            { text: "❌ Reject", callback_data: `reject:${requestId}` },
          ],
        ],
      };
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(telegramBody),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error(`Telegram API error [${response.status}]:`, JSON.stringify(data));
      throw new Error("Telegram API call failed");
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Telegram notify error:", error instanceof Error ? error.message : error);
    return new Response(
      JSON.stringify({ error: "An internal error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
