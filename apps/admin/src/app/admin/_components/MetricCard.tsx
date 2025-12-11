import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: number | string;
  description?: string;
  error?: boolean;
}

export function MetricCard({
  title,
  value,
  description,
  error,
}: MetricCardProps) {
  return (
    <Card className={error ? "border-destructive" : ""}>
      <CardHeader className="pb-3">
        <CardDescription>{title}</CardDescription>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          {error ? (
            <span className="text-destructive">Error</span>
          ) : (
            typeof value === "number" ? (
              new Intl.NumberFormat("en-US").format(value)
            ) : (
              value
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}



