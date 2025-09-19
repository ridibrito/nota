import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <>
      <input
        className={clsx(
          'form-input',
          {
            'border-red-300 focus:border-red-500 focus:ring-red-500': error,
          },
          className
        )}
        ref={ref}
        {...props}
      />
      {error && <p className="form-error">{error}</p>}
    </>
  )
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <>
      <textarea
        className={clsx(
          'form-textarea',
          {
            'border-red-300 focus:border-red-500 focus:ring-red-500': error,
          },
          className
        )}
        ref={ref}
        {...props}
      />
      {error && <p className="form-error">{error}</p>}
    </>
  )
);

Textarea.displayName = 'Textarea';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  children: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => (
    <>
      <select
        className={clsx(
          'form-select',
          {
            'border-red-300 focus:border-red-500 focus:ring-red-500': error,
          },
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
      {error && <p className="form-error">{error}</p>}
    </>
  )
);

Select.displayName = 'Select';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  // Permite extensões futuras
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={clsx('form-label', className)}
      {...props}
    />
  )
);

Label.displayName = 'Label';
