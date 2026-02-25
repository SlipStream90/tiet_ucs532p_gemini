export const metadata = {
  title: "AI Kitchen Documentation",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex bg-slate-950 text-white">

        {/* Sidebar */}
        <div className="w-64 h-screen bg-slate-900 p-6 fixed">
          <h2 className="text-xl font-bold mb-6">
            AI Kitchen Docs
          </h2>

          <nav className="space-y-3">
            <a href="/">Overview</a>
            <a href="/problem">Problem</a>
            <a href="/methodology">Methodology</a>
            <a href="/architecture">Architecture</a>
            <a href="/grocery">Smart Grocery</a>
            <a href="/weekly">Weekly Updates</a>
            <a href="/team">Team</a>
          </nav>
        </div>

        {/* Page Content */}
        <main className="ml-64 p-10 w-full">
          {children}
        </main>

      </body>
    </html>
  );
}