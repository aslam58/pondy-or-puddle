import './globals.css';
export const metadata={title:'Pondy or Puddle? — Live Pondicherry street reports',description:'Community rain and waterlogging reports for Pondicherry. Check your street, share conditions, and see the hourly rain forecast. No login needed.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><head><link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5.6.1/dist/maplibre-gl.css"/></head><body>{children}</body></html>}
