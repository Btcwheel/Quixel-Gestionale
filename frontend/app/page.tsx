import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/api";

export default function Home() {
  if (isAuthenticated()) {
    redirect("/dashboard");
  }
  redirect("/login");
}
