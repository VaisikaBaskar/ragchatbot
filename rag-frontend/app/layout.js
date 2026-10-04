import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Antigravity RAG Platform",
  description: "Secure Admin and User RAG Interface",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          {children}
          <Toaster 
            position="bottom-right" 
            toastOptions={{ 
              style: { 
                background: '#18181b', 
                color: '#fff', 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
              } 
            }} 
          />
        </AuthProvider>
      </body>
    </html>
  );
}

