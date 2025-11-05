import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench } from "lucide-react";
import Image from "next/image";
import { Tool } from "@/types/tool";
import { formatCount } from "../../utils";

interface ToolImageGalleryProps {
  tool: Tool;
  selectedImage: number;
  onSelectImage: (index: number) => void;
}

export function ToolImageGallery({
  tool,
  selectedImage,
  onSelectImage,
}: ToolImageGalleryProps) {
  const images = tool.images || [];
  const primaryImage =
    tool.primaryImage || (images.length > 0 ? images[0] : null);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Tool Images</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Image Display */}
        <div className="relative aspect-video bg-transparent rounded-lg overflow-hidden">
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt={tool.name || "Tool image"}
              width={800}
              height={450}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No images available</p>
              </div>
            </div>
          )}
        </div>

        {/* Image Thumbnails */}
        {images.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">
              All Images ({formatCount(images.length)})
            </p>
            <div className="grid grid-cols-4 gap-3">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => onSelectImage(index)}
                  className={`relative w-full aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === index
                      ? "border-blue-500 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Image
                    src={image}
                    alt={tool.name || "Tool image"}
                    width={800}
                    height={450}
                    className="w-full h-full object-contain"
                  />
                  {image === tool.primaryImage && (
                    <Badge className="absolute top-1 left-1 bg-blue-600 text-xs">
                      Primary
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
