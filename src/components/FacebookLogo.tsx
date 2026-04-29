"use client";

/**
 * FacebookLogo — Logo Facebook officiel
 * Reproduit exactement le logo Facebook avec la typographie correcte
 */
export default function FacebookLogo() {
  return (
    <div className="mb-4 lg:mb-0">
      <h1 
        className="text-[64px] font-bold leading-none text-[#1877f2] dark:text-[#2d88ff]"
        style={{ 
          fontFamily: 'Klavika, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          letterSpacing: '-0.05em'
        }}
      >
        facebook
      </h1>
    </div>
  );
}
