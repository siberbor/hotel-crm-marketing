"use client";

import { ReactNode, HTMLAttributes, forwardRef } from "react";

interface TableProps extends HTMLAttributes<HTMLTableElement> {}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <div className="overflow-x-auto">
        <table ref={ref} className={`w-full ${className}`} {...props}>
          {children}
        </table>
      </div>
    );
  },
);
Table.displayName = "Table";

export const TableHeader = ({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={`bg-gray-50 dark:bg-gray-900/50 ${className}`} {...props}>
    {children}
  </thead>
);

export const TableBody = ({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody
    className={`divide-y divide-gray-200 dark:divide-gray-700 ${className}`}
    {...props}
  >
    {children}
  </tbody>
);

export const TableRow = ({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) => (
  <tr
    className={`hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors ${className}`}
    {...props}
  >
    {children}
  </tr>
);

interface TableHeadProps extends HTMLAttributes<HTMLTableHeaderCellElement> {}

export const TableHead = forwardRef<HTMLTableHeaderCellElement, TableHeadProps>(
  ({ className = "", children, ...props }, ref) => (
    <th
      ref={ref}
      className={`
        px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400
        uppercase tracking-wider
        ${className}
      `}
      {...props}
    >
      {children}
    </th>
  ),
);
TableHead.displayName = "TableHead";

interface TableCellProps extends HTMLAttributes<HTMLTableDataCellElement> {}

export const TableCell = forwardRef<HTMLTableDataCellElement, TableCellProps>(
  ({ className = "", children, ...props }, ref) => (
    <td
      ref={ref}
      className={`px-4 py-3 text-sm text-gray-900 dark:text-gray-100 ${className}`}
      {...props}
    >
      {children}
    </td>
  ),
);
TableCell.displayName = "TableCell";
