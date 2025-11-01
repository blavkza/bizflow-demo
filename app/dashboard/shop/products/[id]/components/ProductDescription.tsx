import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProductDescriptionProps {
  description: string;
}

export function ProductDescription({ description }: ProductDescriptionProps) {
  const hasHTMLTags = (text: string): boolean => {
    return (
      /<[a-z][\s\S]*>/i.test(text) ||
      /\*\*.*\*\*|\*.*\*|\[.*\]\(.*\)/.test(text)
    );
  };

  const renderFormattedText = (text: string): string => {
    if (!text) return "";

    let formattedText = text;
    formattedText = formattedText
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/<u>(.*?)<\/u>/g, "<u>$1</u>")
      .replace(/\n/g, "<br>");

    return formattedText;
  };

  const getDescriptionHTML = (description: string): string => {
    if (!description) return "";

    if (hasHTMLTags(description)) {
      return renderFormattedText(description);
    }

    return description.replace(/\n/g, "<br>");
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Description</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="prose prose-sm max-w-none text-muted-foreground"
          dangerouslySetInnerHTML={{
            __html: getDescriptionHTML(description),
          }}
        />
      </CardContent>
    </Card>
  );
}
