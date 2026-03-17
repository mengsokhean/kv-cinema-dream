import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("OK", { status: 200 });
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

    // ឆែក Admin សិទ្ធិ
    const { data: adminCheck, error: adminError } = await supabase
      .from("movie_admins")
      .select("telegram_id")
      .eq("telegram_id", senderId)
      .single();

    if (adminError || !adminCheck) {
      await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: callbackQuery.id,
          text: "❌ អ្នកមិនមានសិទ្ធិជា Admin ឡើយ!",
          show_alert: true,
        }),
      });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    let responseText = "";

    if (action === "approve") {
      // ✅ Update status → "approved" នេះនឹង trigger handle_manual_approval ដោយស្វ័យប្រវត្តិ
      // trigger នឹង update profiles.is_premium និង subscription_expiry ដោយខ្លួនឯង
      const { error: updateError } = await supabase
        .from("payment_requests")
        .update({ status: "approved" })
        .eq("id", requestId)
        .eq("status", "pending");

      if (updateError) {
        responseText = "❌ បញ្ហា Database: " + updateError.message;
      } else {
        // ✅ ទាញ data មកបង្ហាញ message ប៉ុណ្ណោះ — trigger handle ការ update profile ហើយ
        const { data: reqData } = await supabase
          .from("payment_requests")
          .select("user_id, duration_days, amount")
          .eq("id", requestId)
          .single();

        const days = reqData?.duration_days ?? 30;
        responseText = `✅ បានអនុម័ត! User ជា VIP រយៈពេល ${days} ថ្ងៃហើយ!`;
      }
    } else if (action === "reject") {
      const { error: rejectError } = await supabase
        .from("payment_requests")
        .update({ status: "rejected", processed_at: new Date().toISOString() })
        .eq("id", requestId)
        .eq("status", "pending");

      if (rejectError) {
        responseText = "❌ បញ្ហា: " + rejectError.message;
      } else {
        responseText = "🚫 ការបង់ប្រាក់ត្រូវបានបដិសេធ។";
      }
    }

    // ឆ្លើយតបទៅ Telegram
    await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: callbackQuery.id,
        text: responseText,
        show_alert: true,
      }),
    });

    // Edit message បង្ហាញ status ថ្មី
    if (chatId && messageId) {
      const oldText = callbackQuery.message?.text || "";
      await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text: `${oldText}\n\n${responseText}`,
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard: [] }, // លុប button បន្ទាប់ approve/reject
        }),
      });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (error: any) {
    console.error("Webhook Error:", error.message);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }
});
