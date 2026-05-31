'use client';

interface DownloadButtonProps {
  url: string;
  filename: string;
  className?: string;
}

export function DownloadButton({ url, filename, className }: DownloadButtonProps) {
  async function handleClick() {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(href);
    } catch {
      window.open(url, '_blank');
    }
  }

  return (
    <button onClick={handleClick} className={className}>
      Download
    </button>
  );
}
