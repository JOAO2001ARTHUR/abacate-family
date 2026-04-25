import { cn, StatusExibicao } from "@/lib/utils";

const cores: Record<StatusExibicao, string> = {
  PENDENTE:  'bg-amber-100  text-amber-800 border-amber-200',
  ATRASADA:  'bg-red-100    text-red-800    border-red-200',
  BAIXADA:   'bg-gray-100   text-gray-600   border-gray-200',
  CANCELADA: 'bg-gray-50    text-gray-400   border-gray-100 line-through',
};

interface BadgeStatusProps {
  status: StatusExibicao;
  className?: string;
}

export function BadgeStatus({ status, className }: BadgeStatusProps) {
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
      cores[status],
      className
    )}>
      {status}
    </span>
  );
}
