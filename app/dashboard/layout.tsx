"use client";

//import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
//import { NavigationProvider } from "@/lib/context/navigation";
import { Authenticated } from "convex/react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Authenticated>
        <div className="hidden md:flex w-72 flex-col fixed inset-y-0 bg-black">
          <h1 className="text-white p-6">Sidebar Space</h1>
        </div>
      </Authenticated>
      <div className="md:pl-72 flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}