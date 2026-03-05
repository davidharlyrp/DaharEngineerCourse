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

  useEffect(() => {
    const handleDownload = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const downloadButton = target.closest('a.download-button') as HTMLAnchorElement;

      if (downloadButton && !downloadButton.classList.contains('downloading')) {
        e.preventDefault();
        e.stopPropagation();

        const href = downloadButton.href;
        const filename = downloadButton.getAttribute('download') || 'download';
        const originalContent = downloadButton.innerHTML;

        try {
          downloadButton.classList.add('downloading');
          downloadButton.innerHTML = `
            <div class="progress-bar" style="width: 0%"></div>
            <span><div class="spinner"></div> Downloading... 0%</span>
          `;

          const response = await fetch(href);
          if (!response.ok) throw new Error('Download failed');

          const contentLength = response.headers.get('content-length');
          const total = contentLength ? parseInt(contentLength, 10) : 0;
          let loaded = 0;

          const reader = response.body?.getReader();
          if (!reader) throw new Error('Could not read response body');

          const chunks = [];

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            chunks.push(value);
            loaded += value.length;

            if (total > 0) {
              const percent = Math.round((loaded / total) * 100);
              const progressBar = downloadButton.querySelector('.progress-bar') as HTMLElement;
              const textSpan = downloadButton.querySelector('span') as HTMLElement;

              if (progressBar) progressBar.style.width = `${percent}%`;
              if (textSpan) textSpan.innerHTML = `<div class="spinner"></div> Downloading... ${percent}%`;
            }
          }

          const blob = new Blob(chunks);
          const blobUrl = URL.createObjectURL(blob);

          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(blobUrl);

          // Success state
          downloadButton.innerHTML = `<span>Completed!</span>`;
          setTimeout(() => {
            downloadButton.classList.remove('downloading');
            downloadButton.innerHTML = originalContent;
          }, 2000);

        } catch (err) {
          console.error('Download error:', err);
          downloadButton.classList.remove('downloading');
          downloadButton.innerHTML = originalContent;

          // Fallback if fetch fails (e.g., CORS)
          const downloadUrl = href.includes('?') ? `${href}&download=1` : `${href}?download=1`;
          window.open(downloadUrl, '_blank');
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('click', handleDownload);
    }

    return () => {
      if (container) {
        container.removeEventListener('click', handleDownload);
      }
    };
  }, []);

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
            ADD_ATTR: [
              'allow', 'allowfullscreen', 'frameborder', 'scrolling', 'style', 'target',
              'data-type', 'filename', 'filesize', 'download', 'rel'
            ],
            FORBID_TAGS: ['script', 'style'],
          })
        }}
      />
    </div>
  );
}
