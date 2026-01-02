"use client";
import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { X, MessageSquare, Plus } from "lucide-react"; // Иконкууд
import HistoryIcon from "../icon/HistoryIcon";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  // Жишээ түүхүүд
  const chatHistory = [
    { id: 1, title: "Next.js 16 гэж юу вэ?" },
    { id: 2, title: "Clerk Middleware тохиргоо" },
    { id: 3, title: "Prisma Database холболт" },
  ];

  return (
    <>
      {/* Sidebar-ийг нээх товчлуур (Зөвхөн хаалттай үед харагдана) */}
      {!isOpen && (
        <div className="w-[72px] h-full border-r border-[#E4E4E7] bg-white">
          <button
            onClick={() => setIsOpen(true)}
            className="fixed top-4 left-4 p-2  text-white rounded-md mt-[50px] hover:bg-gray-700 transition-all z-50"
          >
            <HistoryIcon className="" />
          </button>
        </div>
      )}

      {/* Sidebar-ийн үндсэн хэсэг */}
      <div
        className={`fixed top-[56px] left-0 h-[calc(100vh-56px)] bg-[#f9f9f9] border-r border-gray-200 w-64 transform transition-transform duration-300 ease-in-out z-40 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-4">
          {/* Дээд хэсэг: Хаах товчлуур болон Шинэ чат */}
          <div className="flex justify-between items-center mb-6">
            <button className="flex items-center gap-2 bg-white border border-gray-300 p-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex-1">
              <Plus size={16} /> New Chat
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="ml-2 p-2 hover:bg-gray-200 rounded-md"
            >
              <X size={20} />
            </button>
          </div>

          {/* Дунд хэсэг: Түүх харуулах (Scrollable) */}
          <div className="flex-1 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-500 mb-4 px-2 uppercase">
              Түүх
            </p>
            <div className="space-y-1">
              {chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  className="flex items-center gap-3 p-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg cursor-pointer truncate"
                >
                  <MessageSquare size={16} className="shrink-0" />
                  <span className="truncate">{chat.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Доод хэсэг: Профайл хэсэг */}
          <div className="border-t pt-4 flex items-center gap-3">
            <UserButton />
            <span className="text-sm font-medium text-gray-700">
              Миний бүртгэл
            </span>
          </div>
        </div>
      </div>

      {/* Sidebar нээлттэй үед арын хэсгийг бүдгэрүүлэх (Overlay) */}
      {isOpen && (
        <div
          className="fixed inset-0 top-[56px] bg-black/10 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
