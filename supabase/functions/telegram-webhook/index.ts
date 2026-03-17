import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // ១. ឆែក Method របស់ Request
  if (req.method !== "POST") {
    return new Response("OK", { status: 200 });
  }

  try {
    const update = await req.json();

    // ២. ឆែកតែពេលមានគេចុចប៊ូតុង Approve/Reject ប៉ុណ្ណោះ
    if (!update.callback_query) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    const callbackQuery = update.callback_query;
    const senderId = callbackQuery.from.id; // លេខ ID Telegram របស់អ្នកចុចប៊ូតុង
    const data = callbackQuery.data as string;
    const chatId = callbackQuery.message?.chat?.id;
    const messageId = callbackQuery.message?.message_id;

    const [action, requestId] = data.split(":");
    if (!action || !requestId) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // ៣. ទាញយក Environment Variables
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ៤. ឆែកមើលសិទ្ធិ Admin ពី Database (movie_admins Table)
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

    // ៥. ដំណើរការនៅពេល Admin ចុច Approve
    if (action === "approve") {
      // ក. Update ស្ថានភាពសំណើបង់ប្រាក់
      const { error: updateError } = await supabase
        .from("payment_requests")
        .update({ status: "approved", processed_at: new Date().toISOString() })
        .eq("id", requestId)
        .eq("status", "pending");

      if (updateError) {
        responseText = "❌ បញ្ហា Database: " + updateError.message;
      } else {
        // ខ. ទាញយកទិន្នន័យ User ដើម្បី Upgrade និងធ្វើ Receipt
        const { data: reqData } = await supabase
          .from("payment_requests")
          .select("user_id, duration_days, amount")
          .eq("id", requestId)
          .single();

        if (reqData) {
          const days = reqData.duration_days ?? 30;
          const expiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

          // គ. Update Profile ទៅជា VIP
          await supabase
            .from("profiles")
            .update({ is_premium: true, subscription_expiry: expiryDate })
            .eq("id", reqData.user_id);

          // ឃ. បញ្ចូលទិន្នន័យទៅក្នុង Table "payments" ដើម្បីឱ្យបង្ហាញ Receipt ក្នុង Profile
          // (បងត្រូវប្រាកដថាមាន Table ឈ្មោះ payments ក្នុង DB)
          await supabase.from("payments").insert({
            user_id: reqData.user_id,
            amount: reqData.amount || 0,
            status: "completed",
            payment_method: "Telegram Bot",
            created_at: new Date().toISOString(),
          });

          responseText = "✅ បានអនុម័ត! User ជា VIP ហើយ និងបានបង្កើតវិក្កយបត្ររួចរាល់។";
        }
      }
    }
    // ៦. ដំណើរការនៅពេល Admin ចុច Reject
    else if (action === "reject") {
      await supabase
        .from("payment_requests")
        .update({ status: "rejected", processed_at: new Date().toISOString() })
        .eq("id", requestId)
        .eq("status", "pending");

      responseText = "🚫 ការបង់ប្រាក់ត្រូវបានបដិសេធ។";
    }

    // ៧. ឆ្លើយតបទៅ Telegram វិញ
    await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackQuery.id, text: responseText }),
    });

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
        }),
      });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (error: any) {
    console.error("Webhook Error:", error.message);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }
});
