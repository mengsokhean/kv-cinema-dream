import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("OK", { status: 200 });
  }

  // ✅ FIX 1: Verify request comes from Telegram using secret token
  const secretToken = Deno.env.get("TELEGRAM_WEBHOOK_SECRET");
  const requestToken = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
  if (secretToken && requestToken !== secretToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const update = await req.json();

    if (!update.callback_query) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    const callbackQuery = update.callback_query;
    const senderId = callbackQuery.from.id;
    const data = callbackQuery.data as string;
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

    // ✅ FIX 2: Check admin using maybeSingle
    const { data: adminCheck } = await supabase
      .from("movie_admins")
      .select("telegram_id")
      .eq("telegram_id", senderId)
      .maybeSingle();

    if (!adminCheck) {
      await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: callbackQuery.id,
          text: "❌ អ្នកមិនមានសិទ្ធិជា Admin!",
          show_alert: true,
        }),
      });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    let responseText = "";

    if (action === "approve") {
      // ✅ FIX 3: Update status → triggers handle_manual_approval → sets is_premium
      const { error } = await supabase
        .from("payment_requests")
        .update({
          status: "approved",
          processed_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .eq("status", "pending");

      responseText = error ? "❌ Error: " + error.message : "✅ អនុម័តហើយ! User ជា VIP រួចរាល់!";
    } else if (action === "reject") {
      const { error } = await supabase
        .from("payment_requests")
        .update({
          status: "rejected",
          processed_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .eq("status", "pending");

      responseText = error ? "❌ Error: " + error.message : "🚫 បានបដិសេធ!";
    }

    // Answer Telegram callback
    await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: callbackQuery.id,
        text: responseText,
        show_alert: true,
      }),
    });

    // Edit message and remove buttons
    if (chatId && messageId) {
      const oldText = callbackQuery.message?.text || "";
      await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text: `${oldText}\n\n${responseText}`,
          reply_markup: { inline_keyboard: [] },
        }),
      });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err: any) {
    console.error("Error:", err.message);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }
});
