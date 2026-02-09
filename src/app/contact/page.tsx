import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Have a question about TapSafe or found a data issue? Send us a message.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Contact Us</h1>
      </div>

      <p className="text-muted-foreground mb-8 leading-relaxed">
        Found a data error? Have a question about a specific water system?
        Want to suggest a feature? We read every message and will get back to
        you if you include your email address.
      </p>

      <ContactForm siteName="TapSafe" />
    </div>
  );
}
