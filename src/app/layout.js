import "./globals.css";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0f]">
        <Navbar />

        <div className="flex min-h-screen">
          <Sidebar />

          <main className="flex-1 flex justify-center">
            <div className="
              w-full 
              max-w-4xl 
              px-12 
              py-20 
              relative
            ">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}