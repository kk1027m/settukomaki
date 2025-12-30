import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
}

export function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  const variants = {
    primary: 'btn btn-primary',
    secondary: 'btn btn-secondary',
    danger: 'btn btn-danger',
  };

  return (
    <button className={`${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
