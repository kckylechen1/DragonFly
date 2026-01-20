import React, { useState } from "react";

export const ErrorThrower: React.FC<{ label: string }> = ({ label }) => {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new Error(`测试错误 from ${label}`);
  }

  return (
    <button
      onClick={() => setShouldError(true)}
      className="px-3 py-2 bg-red-500/20 text-red-400 rounded text-sm"
    >
      点击触发 {label} 错误
    </button>
  );
};
