"use client";

import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", padding = "md", children, ...props }, ref) => {
    const paddings = {
      none: "",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
    };

    return (
      <div
        ref={ref}
        className={`
          bg-white dark:bg-gray-800 
          rounded-xl shadow-sm 
          border border-gray-200 dark:border-gray-700
          ${paddings[padding]}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";

export const CardHeader = ({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div className={`mb-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={`text-lg font-semibold text-gray-900 dark:text-gray-100 ${className}`}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription = ({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={`text-sm text-gray-500 dark:text-gray-400 mt-1 ${className}`}
    {...props}
  >
    {children}
  </p>
);

export const CardContent = ({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div className={className} {...props}>
    {children}
  </div>
);

export const CardFooter = ({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 ${className}`}
    {...props}
  >
    {children}
  </div>
);
