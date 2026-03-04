import { useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';

interface LaTeXRendererProps {
  content: string;
  className?: string;
}

export function LaTeXRenderer({ content, className }: LaTeXRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderMath = () => {
      if (!containerRef.current) return;

      const renderMathInElement = (window as any).renderMathInElement;
      const katex = (window as any).katex;

      if (renderMathInElement && katex) {
        try {
          // 1. Render standard text delimiters
          renderMathInElement(containerRef.current, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '$', right: '$', display: false },
              { left: '\\(', right: '\\)', display: false },
              { left: '\\[', right: '\\]', display: true }
            ],
            throwOnError: false
          });

          // 2. Render span.math-tex elements (PocketBase/CMS output)
          const mathTexElements = containerRef.current.querySelectorAll('.math-tex');
          mathTexElements.forEach((el) => {
            const latex = el.getAttribute('data-latex');
            if (latex && !el.getAttribute('data-rendered')) {
              const isDisplay = (el.parentElement as HTMLElement)?.style.textAlign === 'center';
              katex.render(latex, el as HTMLElement, {
                throwOnError: false,
                displayMode: isDisplay
              });
              el.setAttribute('data-rendered', 'true');
            }
          });
        } catch (e) {
          console.error('KaTeX rendering error:', e);
        }
        return true;
      }
      return false;
    };

    // MutationObserver to watch for content changes
    const observer = new MutationObserver(() => {
      renderMath();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }

    // Initial render attempt with a small retry
    const tryRender = () => {
      if (!renderMath()) {
        setTimeout(tryRender, 100);
      }
    };
    tryRender();

    return () => {
      observer.disconnect();
    };
  }, [content]);

  return (
    <div
      ref={containerRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
    />
  );
}
