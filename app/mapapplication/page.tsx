// 'use client';

// import dynamic from 'next/dynamic';

// // ✅ Import dynamically so SSR doesn’t break
// const MapView = dynamic(() => import('../components/MapView'), { ssr: false });

// export default function Page() {
//   return <MapView />;
// }




'use client';

export const dynamic = 'force-dynamic'; // ✅ This stays for Next.js config

import nextDynamic from 'next/dynamic'; // ✅ Renamed to avoid name conflict

const MapView = nextDynamic(() => import('../components/MapView'), {
  ssr: false,
  loading: () => <p>Loading map...</p>,
});

export default function Page() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <MapView />
    </div>
  );
}
