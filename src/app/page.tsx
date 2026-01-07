
import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();

  // Хэрэв хэрэглэгч нэвтэрсэн байвал шууд Dashboard руу явуулна
  if (userId) {
    redirect("/dashboard");
  }

  // Нэвтрээгүй бол Clerk-ийн бэлэн SignIn-ийг харуулна
  return (
    <main className="min-h-screen flex items-center justify-center">
      <SignIn />
    </main>
  );
}
