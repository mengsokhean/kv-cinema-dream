import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("OK", { status: 200 });
  }

  try {
    const update = await req.json();

    // Only handle callback_query (inline button presses)
    if (!update.callback_query) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    const callbackQuery = update.callback_query;
    const data = callbackQuery.data as string; // e.g. "approve:uuid" or "reject:uuid"
    const chatId = callbackQuery.message?.chat?.id;
    const messageId = callbackQuery.message?.message_id;

    const [action, requestId] = data.split(":");
    if (!action || !requestId) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let responseText: string;

    if (action === "approve") {
      // Approve: update status → trigger handles premium activation
      const { error } = await supabase
        .from("payment_requests")
        .update({ status: "approved", processed_at: new Date().toISOString() })
        .eq("id", requestId)
        .eq("status", "pending");

      if (error) {
        console.error("Approve error:", error.message);
        responseText = "❌ Failed to approve: " + error.message;
      } else {
        // Also activate premium on the user's profile
        const { data: reqData } = await supabase
          .from("payment_requests")
          .select("user_id, duration_days")
          .eq("id", requestId)
          .single();

        if (reqData) {
          const durationDays = reqData.duration_days ?? 30;
          await supabase
            .from("profiles")
            .update({
              is_premium: true,
              subscription_expiry: new Date(
                Date.now() + durationDays * 24 * 60 * 60 * 1000
              ).toISOString(),
            })
            .eq("id", reqData.user_id);
        }

        responseText = "✅ Payment approved! User upgraded to VIP.";
      }
    } else if (action === "reject") {
      const { error } = await supabase
        .from("payment_requests")
        .update({ status: "rejected", processed_at: new Date().toISOString() })
        .eq("id", requestId)
        .eq("status", "pending");

      if (error) {
        console.error("Reject error:", error.message);
        responseText = "❌ Failed to reject: " + error.message;
      } else {
        responseText = "🚫 Payment rejected.";
      }
    } else {
      responseText = "Unknown action.";
    }

    // Answer the callback query (removes loading indicator)
    await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: callbackQuery.id,
        text: responseText,
      }),
    });

    // Edit the original message to show result (remove buttons)
    if (chatId && messageId) {
      const originalText = callbackQuery.message?.text || "";
      const updatedText = originalText + "\n\n" + responseText;

      await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text: updatedText,
          parse_mode: "Markdown",
        }),
      });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (error: unknown) {
    console.error("Webhook error:", error instanceof Error ? error.message : error);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }
});
