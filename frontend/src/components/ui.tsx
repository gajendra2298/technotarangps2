import * as React from "react"
import { cn } from "../lib/utils"

export { cn }

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' | 'ghost' | 'destructive', size?: 'default' | 'sm' | 'lg' | 'icon' }>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        variant === 'default' && "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        variant === 'outline' && "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
        variant === 'ghost' && "hover:bg-accent hover:text-accent-foreground shadow-none",
        variant === 'destructive' && "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        size === 'default' && "h-9 px-4 py-2",
        size === 'sm' && "h-8 rounded-md px-3 text-xs",
        size === 'lg' && "h-10 rounded-md px-8",
        size === 'icon' && "h-9 w-9",
        className
      )}
      {...props}
    />
  )
)

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("rounded-xl border bg-card text-card-foreground shadow glass", className)} {...props} />
  )
)

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
)

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("font-semibold leading-none tracking-tight text-xl", className)} {...props} />
  )
)

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
)

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

const TabsContext = React.createContext<{ activeTab: string; setActiveTab: (value: string) => void } | null>(null);

export const Tabs = ({ children, defaultValue }: { children: React.ReactNode, defaultValue: string }) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="space-y-4">
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ children, className }: any) => (
  <div className={cn("inline-flex h-12 items-center justify-center rounded-2xl bg-muted/50 p-1 text-muted-foreground glass border border-border/50", className)}>
    {children}
  </div>
);

export const TabsTrigger = ({ value, children, className }: any) => {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error("TabsTrigger must be used within a Tabs component");
  const { activeTab, setActiveTab } = context;

  return (
    <button
      onClick={() => setActiveTab(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 uppercase tracking-widest text-[10px]",
        activeTab === value ? "bg-background text-foreground shadow-lg scale-105" : "hover:bg-background/50 hover:text-foreground",
        className
      )}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, children }: any) => {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error("TabsContent must be used within a Tabs component");
  const { activeTab } = context;

  if (activeTab !== value) return null;
  return <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">{children}</div>;
};
