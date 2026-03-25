import type { Metadata } from "next";
import { HomeLanding } from "@/components/landing/HomeLanding";

export const metadata: Metadata = {
  title: "ScrumIQ",
  description:
    "Ship better software with agile that actually works. Sign up or log in to get started.",
};

export default function Home() {
  return <HomeLanding />;
}
