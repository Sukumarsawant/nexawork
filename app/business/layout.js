import BusinessNavbar from "@/component/BusinessNavbar";
import { Geist, Geist_Mono } from "next/font/google";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Student Portal",
  description: "Student freelancing platform",
};

export default function StudentLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#0E0E12]">
      <BusinessNavbar/>
      {children}
    </div>
  );
}
