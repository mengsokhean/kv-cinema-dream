import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { payment_id } = await req.json();

    if (!payment_id) {
      return new Response(
        JSON.stringify({ error: "Missing payment_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get payment details
    const { data: payment, error: fetchError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("id", payment_id)
      .single();

    if (fetchError || !payment) {
      return new Response(
        JSON.stringify({ error: "Payment not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (payment.status === "completed") {
      return new Response(
        JSON.stringify({ error: "Payment already completed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Simulate processing delay (2 seconds)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mark payment as completed
    const { error: updateError } = await supabaseAdmin
      .from("payments")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", payment_id);

    if (updateError) throw updateError;

    // Activate premium via secure function
    const { error: activateError } = await supabaseAdmin.rpc("activate_premium", {
      p_payment_id: payment_id,
    });

    if (activateError) throw activateError;

    // Get user info for Telegram notification
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, username")
      .eq("user_id", payment.user_id)
      .single();

    // Send Telegram notification
    try {
      const telegramBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
      const telegramChatId = Deno.env.get("TELEGRAM_CHAT_ID");

      if (telegramBotToken && telegramChatId) {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + payment.duration_days);

        const message =
          `💰 *New Payment Received!*\n\n` +
          `👤 User: ${profile?.username || profile?.email || payment.user_id}\n` +
          `📦 Plan: ${payment.plan_name}\n` +
          `💳 Method: ${payment.payment_method?.toUpperCase() || "Unknown"}\n` +
          `💵 Amount: $${payment.amount}\n` +
          `📅 Expires: ${expiry.toLocaleDateString()}\n` +
          `🕐 Time: ${new Date().toLocaleString()}`;

        await fetch(
          `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: telegramChatId,
              text: message,
              parse_mode: "Markdown",
            }),
          }
        );
      }
    } catch (telegramError) {
      console.error("Telegram notification failed:", telegramError);
    }

    return new Response(
      JSON.stringify({ success: true }),
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
