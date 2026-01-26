import React, { Suspense } from "react";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import type { LucideProps } from "lucide-react";

export type DynamicIconName = keyof typeof dynamicIconImports;

export interface DynamicIconProps extends LucideProps {
  name: DynamicIconName;
  fallback?: React.ReactNode;
}

const iconCache = new Map<
  DynamicIconName,
  React.LazyExoticComponent<React.ComponentType<LucideProps>>
>();

function getLazyIcon(name: DynamicIconName) {
  const cached = iconCache.get(name);
  if (cached) return cached;

  const LazyIcon = React.lazy(dynamicIconImports[name]);
  iconCache.set(name, LazyIcon);
  return LazyIcon;
}

export function DynamicIcon({
  name,
  fallback,
  className,
  size,
  ...props
}: DynamicIconProps) {
  const LazyIcon = getLazyIcon(name);
  const fallbackNode =
    fallback ??
    React.createElement("span", {
      "aria-hidden": true,
      className: ["inline-block", className].filter(Boolean).join(" "),
      style: size ? { width: size, height: size } : undefined,
    });

  return (
    <Suspense fallback={fallbackNode}>
      <LazyIcon className={className} size={size} {...props} />
    </Suspense>
  );
}
