// import { SignedIn, SignedOut, SignIn } from "@clerk/nextjs";
// import { redirect } from "next/navigation";

// export default function Home() {
//   return (
//     <main className="min-h-screen flex items-center justify-center">
//       <SignedOut>
//         <SignIn
//           forceRedirectUrl="/dashboard"
//           appearance={{
//             elements: {
//               rootBox: "mx-auto",
//             },
//           }}
//         />
//       </SignedOut>

//       <SignedIn>{redirect("/dashboard")}</SignedIn>
//     </main>
//   );
// }

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
