import Card from "@/components/atoms/Card";
import Amount from "@/components/atoms/Amount";
import { cn } from "@/lib/utils/cn";

type Tone = "income" | "expense" | "neutral";

interface SummaryCardProps {
  label: string;
  amount: number;
  tone?: Tone;
  emphasized?: boolean;
}

export default function SummaryCard({
  label,
  amount,
  tone = "neutral",
  emphasized,
}: SummaryCardProps) {
  return (
    <Card
      className={cn(
        "flex flex-col gap-2",
        emphasized && "col-span-2",
      )}
    >
      <span className="label-sm">{label}</span>
      <Amount
        value={amount}
        tone={tone}
        size={emphasized ? "xl" : "lg"}
      />
    </Card>
  );
}
