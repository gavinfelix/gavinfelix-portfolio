interface ComplexityCardProps {
  time: string;
  space: string;
  note?: string;
}

export default function ComplexityCard({
  time,
  space,
  note,
}: ComplexityCardProps) {
  return (
    <section className="mt-4 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm">
      <div className="font-semibold text-gray-800 mb-1">复杂度分析</div>
      <div className="flex flex-wrap gap-4 text-gray-700">
        <span>
          Time: <strong>{time}</strong>
        </span>
        <span>
          Space: <strong>{space}</strong>
        </span>
      </div>
      {note && (
        <p className="mt-2 text-xs text-gray-500">{note}</p>
      )}
    </section>
  );
}

