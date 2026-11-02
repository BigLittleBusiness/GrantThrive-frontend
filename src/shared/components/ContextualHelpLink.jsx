import { HelpCircle } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/lib/utils';

export default function ContextualHelpLink({
  topicId,
  onNavigate,
  children = 'Need help?',
  ariaLabel,
  className,
}) {
  if (!topicId || typeof onNavigate !== 'function') return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn('text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900', className)}
      onClick={() => onNavigate(`help?topic=${encodeURIComponent(topicId)}`)}
      aria-label={ariaLabel || children}
      title={ariaLabel || children}
    >
      <HelpCircle className="h-4 w-4" />
      {children}
    </Button>
  );
}
