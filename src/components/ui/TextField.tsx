import React, { forwardRef, InputHTMLAttributes } from 'react';
import { motion } from 'framer-motion';

type TextFieldVariant = 'filled' | 'outlined';
type TextFieldSize = 'small' | 'medium' | 'large';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  variant?: TextFieldVariant;
  size?: TextFieldSize;
  error?: boolean;
  helperText?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      label,
      variant = 'filled',
      size = 'medium',
      error = false,
      helperText,
      leadingIcon,
      trailingIcon,
      fullWidth = true,
      className = '',
      disabled,
      value,
      ...props
    },
    ref
  ) => {
    // Size classes
    const sizeClasses = {
      small: {
        input: leadingIcon
          ? 'pl-10 pr-4 pt-4 pb-1 text-sm'
          : trailingIcon
          ? 'pl-4 pr-10 pt-4 pb-1 text-sm'
          : 'px-4 pt-4 pb-1 text-sm',
        label: 'left-4 top-3 peer-focus:top-1 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-xs',
        icon: 'w-4 h-4',
        container: 'min-h-[48px]',
      },
      medium: {
        input: leadingIcon
          ? 'pl-12 pr-4 pt-6 pb-2 text-base'
          : trailingIcon
          ? 'pl-4 pr-12 pt-6 pb-2 text-base'
          : 'px-4 pt-6 pb-2 text-base',
        label: 'left-4 top-4 peer-focus:top-2 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs',
        icon: 'w-5 h-5',
        container: 'min-h-[56px]',
      },
      large: {
        input: leadingIcon
          ? 'pl-14 pr-4 pt-7 pb-3 text-lg'
          : trailingIcon
          ? 'pl-4 pr-14 pt-7 pb-3 text-lg'
          : 'px-4 pt-7 pb-3 text-lg',
        label: 'left-4 top-5 peer-focus:top-2 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs',
        icon: 'w-6 h-6',
        container: 'min-h-[64px]',
      },
    };

    // Variant classes
    const variantClasses = {
      filled: {
        input: `bg-gray-100 dark:bg-gray-800 border-b-2 rounded-t-xl
                focus:bg-gray-50 dark:focus:bg-gray-900
                ${
                  error
                    ? 'border-red-500 dark:border-red-400'
                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400'
                }`,
        label: error
          ? 'text-red-500 dark:text-red-400 peer-focus:text-red-500 dark:peer-focus:text-red-400'
          : 'text-gray-500 dark:text-gray-400 peer-focus:text-blue-500 dark:peer-focus:text-blue-400',
      },
      outlined: {
        input: `bg-transparent border-2 rounded-xl
                ${
                  error
                    ? 'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400'
                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400'
                }`,
        label: error
          ? 'text-red-500 dark:text-red-400 peer-focus:text-red-500 dark:peer-focus:text-red-400'
          : 'text-gray-500 dark:text-gray-400 peer-focus:text-blue-500 dark:peer-focus:text-blue-400',
      },
    };

    const currentSizeClasses = sizeClasses[size];
    const currentVariantClasses = variantClasses[variant];

    // Icon position classes
    const leadingIconClasses = {
      small: 'left-3 top-1/2 -translate-y-1/2',
      medium: 'left-3 top-1/2 -translate-y-1/2',
      large: 'left-4 top-1/2 -translate-y-1/2',
    };

    const trailingIconClasses = {
      small: 'right-3 top-1/2 -translate-y-1/2',
      medium: 'right-3 top-1/2 -translate-y-1/2',
      large: 'right-4 top-1/2 -translate-y-1/2',
    };

    return (
      <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
        <div className={`relative ${currentSizeClasses.container}`}>
          {/* Leading Icon */}
          {leadingIcon && (
            <div
              className={`absolute ${leadingIconClasses[size]} ${currentSizeClasses.icon} pointer-events-none ${
                error
                  ? 'text-red-500 dark:text-red-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {leadingIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            value={value}
            disabled={disabled}
            className={`
              peer w-full
              ${currentSizeClasses.input}
              ${currentVariantClasses.input}
              text-gray-900 dark:text-white
              placeholder-transparent
              focus:outline-none
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            placeholder=" "
            {...props}
          />

          {/* Floating Label */}
          {label && (
            <label
              className={`
                absolute ${currentSizeClasses.label}
                ${currentVariantClasses.label}
                pointer-events-none
                transition-all duration-200
                font-medium
              `}
            >
              {label}
            </label>
          )}

          {/* Trailing Icon */}
          {trailingIcon && (
            <div
              className={`absolute ${trailingIconClasses[size]} ${currentSizeClasses.icon} ${
                error
                  ? 'text-red-500 dark:text-red-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {trailingIcon}
            </div>
          )}
        </div>

        {/* Helper Text */}
        {helperText && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-1 ml-4 text-xs ${
              error
                ? 'text-red-500 dark:text-red-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            {helperText}
          </motion.p>
        )}
      </div>
    );
  }
);

TextField.displayName = 'TextField';
