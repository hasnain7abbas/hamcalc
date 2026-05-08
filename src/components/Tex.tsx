import { useEffect, useRef } from "react";
import katex from "katex";

type Props = {
  children: string;
  display?: boolean;
  className?: string;
};

export function Tex({ children, display = false, className }: Props) {
  const ref = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    try {
      katex.render(children || "", ref.current, {
        displayMode: display,
        throwOnError: false,
        strict: "ignore",
        output: "html",
      });
    } catch (e) {
      if (ref.current) ref.current.textContent = children;
    }
  }, [children, display]);
  return <span ref={ref} className={className} />;
}
