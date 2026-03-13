export const metadata = {
  title: 'PitchDeck — Lead Intelligence',
  description: 'AI-powered cold outreach intelligence for freelancers',
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#080a0e' }}>{children}</body>
    </html>
  );
}
