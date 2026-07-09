import "bulma/css/bulma.min.css";
import "./brand.css";

export const metadata = {
  title: "Bella Vista Dedicated Logistics LLC",
  description: "Onboarding platform"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
