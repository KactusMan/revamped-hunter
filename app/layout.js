import './globals.css';

export const metadata = {
  title: 'PitchDeck — Lead Intelligence',
  description: 'AI-powered cold outreach intelligence for freelancers',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
