export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      {/* <Messages /> */}
      <div className="overscroll-behavior-contain -webkit-overflow-scrolling-touch flex-1 touch-pan-y overflow-y-scroll">
        {children}
      </div>
    </div>
  );
}
