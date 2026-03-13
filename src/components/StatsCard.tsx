interface StatsCardProps {
  value: string;
  label: string;
  icon: React.ReactNode;
}

const StatsCard = ({ value, label, icon }: StatsCardProps) => {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-6 shadow-sm animate-fade-in">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <p className="font-display text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
};

export default StatsCard;
