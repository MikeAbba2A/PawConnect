import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input: React.FC<InputProps> = ({ error, className = '', ...props }) => {
  const baseStyles = "w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors";
  
  const stateStyles = error
    ? "border-red-300 focus:border-red-300 focus:ring-red-200 bg-red-50"
    : "border-gray-300 focus:border-salmon-300 focus:ring-salmon-200";
  
  const disabledStyles = props.disabled
    ? "bg-gray-100 cursor-not-allowed text-gray-500"
    : "bg-white";
  
  const combinedClassName = `${baseStyles} ${stateStyles} ${disabledStyles} ${className}`;
  
  return (
    <div className="w-full">
      <input className={combinedClassName} {...props} />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Input;