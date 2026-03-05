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
    const { user_id, plan_name, duration_days, payment_method } = await req.json();

    if (!user_id || !plan_name || !duration_days) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Calculate expiry
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + duration_days);

    // Update user profile to premium
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        is_premium: true,
        subscription_expiry: expiry.toISOString(),
      })
      .eq("user_id", user_id);

    if (updateError) throw updateError;

    // Get user info for notification
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, username")
      .eq("user_id", user_id)
      .single();

    // Send Telegram notification
    try {
      const telegramBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
      const telegramChatId = Deno.env.get("TELEGRAM_CHAT_ID");

      if (telegramBotToken && telegramChatId) {
        const message = `💰 *New Payment Received!*\n\n` +
          `👤 User: ${profile?.username || profile?.email || user_id}\n` +
          `📦 Plan: ${plan_name}\n` +
          `💳 Method: ${payment_method?.toUpperCase() || "Unknown"}\n` +
          `📅 Expires: ${expiry.toLocaleDateString()}\n` +
          `🕐 Time: ${new Date().toLocaleString()}`;

        await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: telegramChatId,
            text: message,
            parse_mode: "Markdown",
          }),
        });
      }
    } catch (telegramError) {
      console.error("Telegram notification failed:", telegramError);
    }

    return new Response(
      JSON.stringify({ success: true, expiry: expiry.toISOString() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Payment simulation error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
