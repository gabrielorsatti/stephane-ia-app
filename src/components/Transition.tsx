import type { ReactNode } from "react";

interface Props {
  id: string;
  children: ReactNode;
  className?: string;
}

export function FadeIn({ id, children, className = "" }: Props) {
  return (
    <div key={id} className={`animate-fadeIn ${className}`}>
      {children}
    </div>
  );
}

export function SlideIn({ id, children, className = "" }: Props) {
  return (
    <div key={id} className={`animate-slideInRight ${className}`}>
      {children}
    </div>
  );
}

export function SlideBack({ id, children, className = "" }: Props) {
  return (
    <div key={id} className={`animate-slideInLeft ${className}`}>
      {children}
    </div>
  );
}
