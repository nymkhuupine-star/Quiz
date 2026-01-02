// app/sso-callback/page.tsx
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallbackPage() {
  // Энэ компонент нь нэвтрэлтийн процессыг дуусгаж,
  // автоматаар redirect (шилжүүлэг) хийнэ.
  return <AuthenticateWithRedirectCallback />;
}
