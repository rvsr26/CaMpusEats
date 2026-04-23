import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  fullPage?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = "md", fullPage = false }) => {
  const sizeMap = {
    sm: "24px",
    md: "40px",
    lg: "64px",
  };

  const spinner = (
    <div className="spinner-wrapper">
      <div className="spinner"></div>
      <style jsx>{`
        .spinner-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .spinner {
          width: ${sizeMap[size]};
          height: ${sizeMap[size]};
          border: 3px solid rgba(255, 255, 255, 0.05);
          border-top: 3px solid var(--color-primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );

  if (fullPage) {
    return (
      <div className="full-page-spinner">
        {spinner}
        <style jsx>{`
          .full-page-spinner {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: var(--color-bg);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
          }
        `}</style>
      </div>
    );
  }

  return spinner;
};
