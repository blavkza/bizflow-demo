"use client";

import { useState, useEffect, useRef } from "react";
import { Package, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProductImagesProps {
  images: string[] | null;
  name: string;
}

export function ProductImages({ images, name }: ProductImagesProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isAtEnd, setIsAtEnd] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -256, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 256, behavior: "smooth" });
    }
  };

  const scrollToIndex = (index: number) => {
    if (scrollContainerRef.current) {
      const scrollWidth = 256;
      scrollContainerRef.current.scrollTo({
        left: index * scrollWidth,
        behavior: "smooth",
      });
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setScrollPosition(scrollLeft);
      setIsAtEnd(scrollLeft + clientWidth >= scrollWidth - 10);
    }
  };

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
      handleScroll();
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }
  }, [images]);

  // Handle null or empty images array
  const displayImages = images || [];

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Product Images</CardTitle>
      </CardHeader>
      <CardContent>
        {displayImages.length > 0 ? (
          <div className="relative">
            <div
              className="flex space-x-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
              ref={scrollContainerRef}
            >
              {displayImages.map((image, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-80 h-80 snap-center"
                >
                  <img
                    src={image}
                    alt={`${name} ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                  />
                </div>
              ))}
            </div>

            {displayImages.length > 3 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute rounded-full left-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white shadow-md border"
                  onClick={scrollLeft}
                  disabled={scrollPosition === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute rounded-full right-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white shadow-md border"
                  onClick={scrollRight}
                  disabled={isAtEnd}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {displayImages.length > 1 && (
              <div className="flex justify-center mt-3">
                <div className="flex space-x-1">
                  {displayImages.map((_, index) => (
                    <button
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        Math.floor(scrollPosition / 256) === index
                          ? "bg-blue-600"
                          : "bg-gray-300"
                      }`}
                      onClick={() => scrollToIndex(index)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mb-4" />
            <p>No images available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
