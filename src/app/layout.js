import "./globals.css";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export const metadata = {
  title: "AI Kitchen Safety & Smart Grocery System",
  description: "Real-time computer vision for kitchen safety, hazard detection, and smart grocery intelligence.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <div style={{ display: "flex", minHeight: "100vh", paddingTop: "60px" }}>
          <Sidebar />
          <main style={{ flex: 1, overflowY: "auto" }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}