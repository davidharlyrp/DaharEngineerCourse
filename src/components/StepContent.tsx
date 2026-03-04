import { useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import type { Step } from '../types';

interface StepContentProps {
  step: Step;
  className?: string;
}

export function StepContent({ step, className = '' }: StepContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderMath = () => {
      if (!containerRef.current) return;

      const renderMathInElement = (window as any).renderMathInElement;
      const katex = (window as any).katex;

      if (renderMathInElement && katex) {
        try {
          // Render standard text delimiters
          renderMathInElement(containerRef.current, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '$', right: '$', display: false },
              { left: '\\(', right: '\\)', display: false },
              { left: '\\[', right: '\\]', display: true }
            ],
            throwOnError: false
          });

          // Render span.math-tex elements
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

    // Initial render attempt with retry
    const tryRender = () => {
      if (!renderMath()) {
        setTimeout(tryRender, 100);
      }
    };
    tryRender();

    return () => {
      observer.disconnect();
    };
  }, [step.content]);

  return (
    <div className={className}>
      {/* Step Title */}
      <h1 className="text-2xl font-bold text-gray-100 mb-6">{step.title}</h1>

      {/* Step Content */}
      <div
        ref={containerRef}
        className="content-html"
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(step.content, {
            ADD_TAGS: ['iframe', 'video', 'source', 'audio'],
            ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'style', 'target'],
            FORBID_TAGS: ['script', 'style'], // Allow inline style but forbid <style> block for safety unless needed
          })
        }}
      />
    </div>
  );
}
