export default function Spinner({ text }: { text?: string }) {
  return (
    <div className="text-center p-8">
      <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-2" />
      {text && <p className="text-gray-500 text-sm">{text}</p>}
    </div>
  );
}
