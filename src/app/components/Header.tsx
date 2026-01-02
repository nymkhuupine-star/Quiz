import { UserButton } from "@clerk/nextjs";

export default function Header() {
  return (
    <div className="border border-[#E4E4E7] bg-white w-full h-[56px] flex justify-between ">
      <div className="flex items-center ml-[20px]">Quiz app</div>
      <div className="flex  items-center mr-[20px]">
        <h1 className="text-2xl font-bold"></h1>
        <UserButton showName />
      </div>
    </div>
  );
}
