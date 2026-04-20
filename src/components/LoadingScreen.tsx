export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="animate-splash-text">
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Gym Track
        </h1>
      </div>
    </div>
  );
}
