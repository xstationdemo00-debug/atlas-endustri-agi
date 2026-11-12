export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/60 px-6 py-12 text-center">
      {Icon && (
        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon size={20} />
        </span>
      )}
      <p className="font-heading text-sm font-bold text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}