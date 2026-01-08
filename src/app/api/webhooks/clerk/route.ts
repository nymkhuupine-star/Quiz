// app/api/webhooks/clerk/route.ts
import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("CLERK_WEBHOOK_SECRET байхгүй байна");
  }

  // Headers авах - Request object ашиглана
  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  // Verify webhook
  const payload = await req.json();
  const body = JSON.stringify(payload);
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
    console.log("✅ Webhook verified:", evt.type);
  } catch (err) {
    console.error("❌ Webhook verification failed:", err);
    return new Response("Verification failed", { status: 400 });
  }

  // USER CREATED
  if (evt.type === "user.created") {
    const { id, email_addresses, first_name, last_name, image_url, username } = evt.data;

    console.log("👤 Creating user:", { id, email: email_addresses?.[0]?.email_address });

    // Prisma (NeonDB)
    try {
      await prisma.user.create({
        data: {
          clerkId: id,
          email: email_addresses?.[0]?.email_address || "",
          firstName: first_name || null,
          lastName: last_name || null,
          imageUrl: image_url || null,
        },
      });
      console.log("✅ Prisma: User created");
    } catch (error) {
      console.error("❌ Prisma error:", error);
    }

    // Supabase (Chat app)
    try {
      const { error } = await supabase
        .from("users")
        .insert({
          clerk_id: id,
          username: username || first_name || email_addresses?.[0]?.email_address.split('@')[0] || "User",
          email: email_addresses?.[0]?.email_address || "",
          image_url: image_url || null,
        });

      if (error) {
        console.error("❌ Supabase error:", error);
      } else {
        console.log("✅ Supabase: Chat user created");
      }
    } catch (err) {
      console.error("❌ Supabase insert failed:", err);
    }
  }

  // USER UPDATED
  if (evt.type === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url, username } = evt.data;

    // Update Prisma
    try {
      await prisma.user.update({
        where: { clerkId: id },
        data: {
          email: email_addresses?.[0]?.email_address || "",
          firstName: first_name || null,
          lastName: last_name || null,
          imageUrl: image_url || null,
        },
      });
      console.log("✅ Prisma: User updated");
    } catch (error) {
      console.error("❌ Prisma update error:", error);
    }

    // Update Supabase
    try {
      await supabase
        .from("users")
        .update({
          username: username || first_name || email_addresses?.[0]?.email_address.split('@')[0] || "User",
          email: email_addresses?.[0]?.email_address || "",
          image_url: image_url || null,
        })
        .eq("clerk_id", id);
      
      console.log("✅ Supabase: User updated");
    } catch (err) {
      console.error("❌ Supabase update failed:", err);
    }
  }

  return new Response("Webhook processed", { status: 200 });
}