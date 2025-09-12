import React, { useState, useRef, useEffect } from 'react';

export interface ProgressiveDisclosureProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  animationDuration?: number;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export const ProgressiveDisclosure: React.FC<ProgressiveDisclosureProps> = ({
  title,
  children,
  defaultExpanded = false,
  animationDuration = 300,
  className = '',
  headerClassName = '',
  contentClassName = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children, isExpanded]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`border border-gray-200 rounded-md mb-2 overflow-hidden ${className}`}>
      <button
        onClick={toggleExpanded}
        className={`w-full py-3 px-4 bg-gray-50 border-none text-left cursor-pointer flex items-center text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${headerClassName}`}
        aria-expanded={isExpanded}
        aria-controls={`content-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <span className="mr-2 text-xs text-gray-500 transition-transform duration-200">
          {isExpanded ? '▼' : '▶'}
        </span>
        <span className="flex-1">{title}</span>
      </button>

      <div
        id={`content-${title.replace(/\s+/g, '-').toLowerCase()}`}
        ref={contentRef}
        className={`bg-white overflow-hidden transition-all ease-in-out ${contentClassName}`}
        style={{
          maxHeight: isExpanded ? `${contentHeight}px` : '0px',
          opacity: isExpanded ? 1 : 0,
          transitionDuration: `${animationDuration}ms`
        }}
      >
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

// Specialized component for column analysis details
export interface ColumnAnalysisDisclosureProps {
  column: number;
  title?: string;
  children: React.ReactNode;
  stats?: {
    totalNumbers: number;
    hotNumbers: number;
    coldNumbers: number;
    avgGap: number;
  };
}

export const ColumnAnalysisDisclosure: React.FC<ColumnAnalysisDisclosureProps> = ({
  column,
  title,
  children,
  stats
}) => {
  const displayTitle = title || `Column ${column} Analysis`;

  return (
    <ProgressiveDisclosure
      title={displayTitle}
      className="border-l-4 border-blue-500"
      headerClassName="bg-blue-50 font-semibold"
      contentClassName="bg-white"
    >
      {stats && (
        <div className="mb-4 p-3 bg-gray-50 rounded border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1 font-medium">Total Numbers</div>
              <div className="text-lg font-bold text-gray-800">{stats.totalNumbers}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1 font-medium">Hot Numbers</div>
              <div className="text-lg font-bold text-red-600">{stats.hotNumbers}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1 font-medium">Cold Numbers</div>
              <div className="text-lg font-bold text-blue-600">{stats.coldNumbers}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1 font-medium">Avg Gap</div>
              <div className="text-lg font-bold text-gray-800">{stats.avgGap.toFixed(1)}</div>
            </div>
          </div>
        </div>
      )}
      {children}
    </ProgressiveDisclosure>
  );
};

// Accordion component for multiple progressive disclosures
export interface AccordionProps {
  items: {
    id: string;
    title: string;
    content: React.ReactNode;
    defaultExpanded?: boolean;
  }[];
  allowMultiple?: boolean;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = false,
  className = ''
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    new Set(items.filter(item => item.defaultExpanded).map(item => item.id))
  );

  const toggleItem = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        if (!allowMultiple) {
          newSet.clear();
        }
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {items.map(item => (
        <ProgressiveDisclosure
          key={item.id}
          title={item.title}
          defaultExpanded={expandedItems.has(item.id)}
          className="rounded-md"
        >
          {item.content}
        </ProgressiveDisclosure>
      ))}
    </div>
  );
};
