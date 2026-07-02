import "./globals.css";

export const metadata = {
  title: "Prachin Baurahwa Mahadev Shiv Mandir | Kushinagar",
  description: "Official website for the ancient Prachin Baurahwa Mahadev Shiv Mandir located in Gram Patharwa, Kushinagar, UP.",
  icons: {
    icon: "/images/shivaling_canopy.jpg",
    apple: "/images/shivaling_canopy.jpg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
