import { useState, useRef, useEffect } from "react";
 
export default function LazyImage({ src, alt, className, fallback = "🛍️", style }) {
  const [loaded,  setLoaded]  = useState(false);
  const [error,   setError]   = useState(false);
  const [visible, setVisible] = useState(false);
  const imgRef = useRef(null);
 
  useEffect(() => {
    if (!src) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { rootMargin: "100px" }
    );
    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [src]);
 
  if (!src || error) {
    return (
      <div ref={imgRef} className={className} style={style}>
        <span style={{ fontSize: "2rem" }}>{fallback}</span>
      </div>
    );
  }
 
  return (
    <div ref={imgRef} className={className} style={style}>
      {/* Shimmer placeholder while not loaded */}
      {!loaded && <div className="w-full h-full shimmer" />}
      {visible && (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
}