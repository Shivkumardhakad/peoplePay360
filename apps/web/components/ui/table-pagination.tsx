"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface TablePaginationProps {
  currentPage: number;
  totalPages?: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10],
  className = "",
}: TablePaginationProps) {
  const calculatedTotalPages = totalPages ?? Math.ceil(totalItems / pageSize);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={`p-2.5 rounded-lg border border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${className}`}>
      {/* Left: Info & Page Size */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-mono text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{startItem}</span>-
          <span className="font-semibold text-foreground">{endItem}</span> of{" "}
          <span className="font-semibold text-foreground">{totalItems}</span> entries
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-3 border-l border-border">
            <span className="text-[11px] text-muted-foreground font-mono">Show</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-6 rounded border border-input bg-background px-1.5 text-[11px] font-mono focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-muted-foreground font-mono">per page</span>
          </div>
        )}
      </div>

      {/* Right: Pagination Controls */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-mono text-muted-foreground mr-2">
          Page <span className="font-semibold text-foreground">{calculatedTotalPages === 0 ? 0 : currentPage}</span> of{" "}
          <span className="font-semibold text-foreground">{calculatedTotalPages}</span>
        </span>

        <Button
          variant="outline"
          size="iconSm"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1 || calculatedTotalPages === 0}
          title="First Page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </Button>

        <Button
          variant="outline"
          size="iconSm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || calculatedTotalPages === 0}
          title="Previous Page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>

        <Button
          variant="outline"
          size="iconSm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= calculatedTotalPages || calculatedTotalPages === 0}
          title="Next Page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>

        <Button
          variant="outline"
          size="iconSm"
          onClick={() => onPageChange(calculatedTotalPages)}
          disabled={currentPage >= calculatedTotalPages || calculatedTotalPages === 0}
          title="Last Page"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

