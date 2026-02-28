import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f2f5] dark:bg-gray-950 transition-colors duration-300 relative selection:bg-indigo-500/30">
      {/* Animated Liquid Background Elements (Mesh Gradient) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Top left blob */}
        <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-violet-400/40 to-fuchsia-400/20 blur-[130px] dark:from-violet-900/40 dark:to-fuchsia-900/20 mix-blend-multiply dark:mix-blend-screen animate-blob" />
        {/* Top right blob */}
        <div className="absolute top-[0%] -right-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-bl from-cyan-400/40 to-blue-400/20 blur-[140px] dark:from-cyan-900/40 dark:to-blue-900/20 mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000" />
        {/* Bottom center blob */}
        <div className="absolute -bottom-[20%] left-[10%] w-[80%] h-[60%] rounded-full bg-gradient-to-tr from-indigo-400/40 to-violet-400/20 blur-[150px] dark:from-indigo-900/40 dark:to-violet-900/20 mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-4000" />
      </div>

      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 lg:pl-64">
        <Header />
        <main className="flex-1 overflow-y-auto bg-transparent transition-colors duration-300 relative z-10 w-full">
          <div className="p-4 md:p-8 2xl:p-10 w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
