import { SignedIn, SignedOut, SignIn} from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <SignedOut>
        <SignIn 
          appearance={{
            elements: {
              rootBox: "mx-auto",
            }
          }}
        />
      </SignedOut>

      <SignedIn>
        <div className="text-2xl font-bold">Dashboard маань энд байна</div>
      </SignedIn>
    </main>
  );
}