export function PageSpinner() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a1a2e] border-t-[#818cf8]" />
    </div>
  );
}
