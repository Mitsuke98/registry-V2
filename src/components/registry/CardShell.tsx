import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CardShellProps {
  variant: 'entity' | 'tile';
  icon: React.ReactNode;
  title: string;
  subTitle?: string;
  actionSlot?: React.ReactNode;
  description?: string;
  metaPills?: React.ReactNode[];
  footer?: React.ReactNode;
  linkTo?: string;
  count?: number;
}

export const CardShell: React.FC<CardShellProps> = ({
  variant,
  icon,
  title,
  subTitle,
  actionSlot,
  description,
  metaPills,
  footer,
  linkTo,
  count
}) => {
  if (variant === 'tile') {
    const content = (
      <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card shadow-sm hover:bg-accent/60 transition-all cursor-pointer select-none">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <h4 className="text-[14px] font-bold text-foreground leading-tight">{title}</h4>
            {count !== undefined && (
              <span className="text-[12px] text-muted-foreground font-mono mt-0.5 block tabular-nums">{count} items</span>
            )}
          </div>
        </div>
        <ArrowRight className="size-4 text-muted-foreground" />
      </div>
    );

    return linkTo ? <Link to={linkTo}>{content}</Link> : content;
  }

  // Entity variant (requires standard structure with mt-auto flush footer)
  const cardBody = (
    <div className="flex flex-col h-full rounded-xl border border-border bg-card shadow-sm hover:bg-accent/40 transition-all overflow-hidden">
      <div className="p-5 flex flex-col flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <h3 className="text-[14px] font-bold text-foreground leading-snug">{title}</h3>
              {subTitle && <span className="text-[12px] text-muted-foreground block mt-0.5">{subTitle}</span>}
            </div>
          </div>
          {actionSlot}
        </div>

        {/* Description clamp-2 */}
        {description && (
          <p className="text-[13px] text-muted-foreground line-clamp-2 leading-relaxed mb-4">
            {description}
          </p>
        )}

        {/* Meta pill row */}
        {metaPills && metaPills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
            {metaPills}
          </div>
        )}
      </div>

      {/* Flush footer */}
      {footer && (
        <div className="mt-auto border-t border-border bg-muted/50 px-5 py-3 text-[12px] text-muted-foreground rounded-b-xl flex items-center justify-between select-none">
          {footer}
        </div>
      )}
    </div>
  );

  return linkTo ? <Link to={linkTo} className="block h-full">{cardBody}</Link> : cardBody;
};
