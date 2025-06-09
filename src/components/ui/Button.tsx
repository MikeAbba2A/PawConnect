import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantStyles = {
    primary: "bg-salmon-600 text-white hover:bg-salmon-700 focus:ring-salmon-500",
    secondary: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
    outline: "bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-salmon-500",
    text: "bg-transparent text-salmon-600 hover:text-salmon-700 hover:bg-salmon-50",
  };
  
  const sizeStyles = {
    sm: "text-sm px-3 py-1.5",
    md: "text-sm px-4 py-2",
    lg: "text-base px-6 py-3",
  };
  
  const widthStyle = fullWidth ? "w-full" : "";
  
  const disabledStyles = props.disabled 
    ? "opacity-50 cursor-not-allowed" 
    : "cursor-pointer";
  
  const combinedClassName = `
    ${baseStyles} 
    ${variantStyles[variant]} 
    ${sizeStyles[size]} 
    ${widthStyle} 
    ${disabledStyles}
    ${className}
  `.trim();
  
  return (
    <button className={combinedClassName} {...props}>
      {children}
    </button>
  );
};

export default Button;