"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Link,
  Undo,
  Redo,
  Plus,
  Minus,
  Smile,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import emojiData from "emoji.json";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Interface for emoji data
interface Emoji {
  name: string;
  category: string;
  char: string;
  codes: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing...",
}: RichTextEditorProps) {
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<string[]>([value]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [emojiPopoverOpen, setEmojiPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [emojis, setEmojis] = useState<Emoji[]>([]);
  const [emojiSearch, setEmojiSearch] = useState("");

  // Load emojis on component mount
  useEffect(() => {
    const filteredEmojis = (emojiData as Emoji[])
      .filter(
        (emoji) =>
          !emoji.name.includes("skin tone") &&
          !emoji.name.includes("hair style") &&
          !emoji.name.includes("flag:") &&
          emoji.category !== "Flags"
      )
      .slice(0, 1000);

    setEmojis(filteredEmojis);
  }, []);

  // Filter emojis based on search
  const filteredEmojis = emojis.filter((emoji) =>
    emoji.name.toLowerCase().includes(emojiSearch.toLowerCase())
  );

  // Update content when value changes from outside
  useEffect(() => {
    if (
      contentEditableRef.current &&
      contentEditableRef.current.innerHTML !== value
    ) {
      contentEditableRef.current.innerHTML = value || "";
    }
  }, [value]);

  const saveToHistory = (newValue: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newValue);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleInput = () => {
    if (contentEditableRef.current) {
      const newValue = contentEditableRef.current.innerHTML;
      onChange(newValue);
      saveToHistory(newValue);
    }
  };

  const execCommand = (command: string, value: string = "") => {
    // Ensure the editor is focused before executing commands
    contentEditableRef.current?.focus();

    // Save current selection
    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;

    // Execute the command
    document.execCommand(command, false, value);

    // Restore selection if it was lost
    if (selection && range) {
      selection.removeAllRanges();
      selection.addRange(range);
    }

    handleInput();
    contentEditableRef.current?.focus();
  };

  const formatText = (format: string) => {
    // Always ensure focus first
    contentEditableRef.current?.focus();

    switch (format) {
      case "bold":
        execCommand("bold");
        break;
      case "italic":
        execCommand("italic");
        break;
      case "underline":
        execCommand("underline");
        break;
      case "bulletList":
        execCommand("insertUnorderedList");
        // Force styles for bullet list
        setTimeout(() => {
          const uls = contentEditableRef.current?.querySelectorAll("ul");
          uls?.forEach((ul) => {
            ul.style.listStyleType = "disc";
            ul.style.paddingLeft = "1.5rem";
            ul.style.margin = "0.5rem 0";
          });
        }, 10);
        break;
      case "numberedList":
        execCommand("insertOrderedList");
        // Force styles for numbered list
        setTimeout(() => {
          const ols = contentEditableRef.current?.querySelectorAll("ol");
          ols?.forEach((ol) => {
            ol.style.listStyleType = "decimal";
            ol.style.paddingLeft = "1.5rem";
            ol.style.margin = "0.5rem 0";
          });
        }, 10);
        break;
      case "blockquote":
        // Create blockquote by wrapping selection
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          // Check if we're already in a blockquote
          let existingBlockquote = range.commonAncestorContainer as Element;
          while (
            existingBlockquote &&
            existingBlockquote.nodeName !== "BLOCKQUOTE"
          ) {
            existingBlockquote = existingBlockquote.parentElement as Element;
          }

          if (!existingBlockquote) {
            const blockquote = document.createElement("blockquote");
            blockquote.style.borderLeft = "4px solid #ddd";
            blockquote.style.paddingLeft = "1rem";
            blockquote.style.margin = "0.5rem 0";
            blockquote.style.color = "#666";
            blockquote.style.fontStyle = "italic";
            blockquote.appendChild(range.extractContents());
            range.insertNode(blockquote);
            handleInput();
          }
        }
        break;
      case "increaseSize":
        execCommand("fontSize", "7"); // Largest size
        break;
      case "decreaseSize":
        execCommand("fontSize", "1"); // Smallest size
        break;
    }

    // Maintain focus after formatting
    setTimeout(() => contentEditableRef.current?.focus(), 0);
  };

  // Alternative list implementation using manual DOM manipulation
  const createList = (type: "ul" | "ol") => {
    contentEditableRef.current?.focus();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    // Check if we're already in a list
    let listItem = range.commonAncestorContainer as Element;
    while (
      listItem &&
      listItem.nodeName !== "LI" &&
      listItem.nodeName !== "UL" &&
      listItem.nodeName !== "OL"
    ) {
      listItem = listItem.parentElement as Element;
    }

    if (
      listItem &&
      (listItem.nodeName === "UL" || listItem.nodeName === "OL")
    ) {
      // Toggle list type if already in a list
      if (listItem.nodeName !== type.toUpperCase()) {
        const newList = document.createElement(type);
        newList.innerHTML = listItem.innerHTML;
        listItem.parentNode?.replaceChild(newList, listItem);
      }
    } else if (listItem && listItem.nodeName === "LI") {
      // Already in a list item, toggle the parent list type
      const parentList = listItem.parentElement;
      if (parentList && parentList.nodeName !== type.toUpperCase()) {
        const newList = document.createElement(type);
        while (parentList?.firstChild) {
          newList.appendChild(parentList.firstChild);
        }
        parentList.parentNode?.replaceChild(newList, parentList);
      }
    } else {
      // Create new list
      const list = document.createElement(type);
      const listItem = document.createElement("li");

      // If there's selected text, use it
      if (!selection.isCollapsed) {
        listItem.appendChild(range.extractContents());
      } else {
        listItem.innerHTML = "<br>";
      }

      list.appendChild(listItem);
      range.insertNode(list);

      // Move cursor inside the list item
      range.setStart(listItem, 0);
      range.setEnd(listItem, 0);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    // Apply styles
    const lists = contentEditableRef.current?.querySelectorAll(type);
    lists?.forEach((list) => {
      list.style.listStyleType = type === "ul" ? "disc" : "decimal";
      list.style.paddingLeft = "1.5rem";
      list.style.margin = "0.5rem 0";
    });

    handleInput();
    contentEditableRef.current?.focus();
  };

  const insertLink = () => {
    if (linkUrl) {
      // Ensure focus before inserting link
      contentEditableRef.current?.focus();

      // If text is selected, use that as link text
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) {
        execCommand("createLink", linkUrl);
      } else {
        // Insert link with specified text
        const anchor = document.createElement("a");
        anchor.href = linkUrl;
        anchor.textContent = linkText || linkUrl;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";

        const range = selection?.getRangeAt(0);
        if (range) {
          range.insertNode(anchor);
          // Move cursor after the link
          range.setStartAfter(anchor);
          range.setEndAfter(anchor);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
        handleInput();
      }

      setLinkUrl("");
      setLinkText("");
      setLinkPopoverOpen(false);
    }
  };

  const insertEmoji = (emoji: string) => {
    contentEditableRef.current?.focus();
    execCommand("insertText", emoji);
    setEmojiPopoverOpen(false);
    setEmojiSearch("");
  };

  const undo = () => {
    contentEditableRef.current?.focus();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
      if (contentEditableRef.current) {
        contentEditableRef.current.innerHTML = history[newIndex];
      }
    }
  };

  const redo = () => {
    contentEditableRef.current?.focus();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
      if (contentEditableRef.current) {
        contentEditableRef.current.innerHTML = history[newIndex];
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "b":
          e.preventDefault();
          formatText("bold");
          break;
        case "i":
          e.preventDefault();
          formatText("italic");
          break;
        case "u":
          e.preventDefault();
          formatText("underline");
          break;
        case "z":
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
          break;
        case "y":
          e.preventDefault();
          redo();
          break;
      }
    }

    // Handle Enter key in lists to continue list formatting
    if (e.key === "Enter" && !e.shiftKey) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const node = selection.anchorNode;
        let parentElement = node?.parentElement;

        // Find the list item parent
        while (
          parentElement &&
          parentElement.nodeName !== "LI" &&
          parentElement !== contentEditableRef.current
        ) {
          parentElement = parentElement.parentElement;
        }

        // Check if we're in a list item
        if (parentElement && parentElement.nodeName === "LI") {
          // If the list item is empty, break out of the list
          if (
            parentElement.textContent === "" ||
            parentElement.textContent === "\u200B" ||
            parentElement.innerHTML === "<br>"
          ) {
            e.preventDefault();

            // Create a new paragraph after the list
            const list = parentElement.parentElement;
            const newParagraph = document.createElement("p");
            newParagraph.innerHTML = "<br>";

            if (list?.nextSibling) {
              list.parentNode?.insertBefore(newParagraph, list.nextSibling);
            } else {
              list?.parentNode?.appendChild(newParagraph);
            }

            // Move cursor to the new paragraph
            const range = document.createRange();
            range.setStart(newParagraph, 0);
            range.setEnd(newParagraph, 0);
            selection.removeAllRanges();
            selection.addRange(range);

            handleInput();
          }
        }
      }
    }

    // Handle Tab key in lists for indentation
    if (e.key === "Tab") {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const node = selection.anchorNode;
        let parentElement = node?.parentElement;

        while (
          parentElement &&
          parentElement.nodeName !== "LI" &&
          parentElement !== contentEditableRef.current
        ) {
          parentElement = parentElement.parentElement;
        }

        if (parentElement && parentElement.nodeName === "LI") {
          e.preventDefault();
          if (e.shiftKey) {
            execCommand("outdent");
          } else {
            execCommand("indent");
          }
        }
      }
    }
  };

  const formattingButtons = [
    { icon: Bold, format: "bold", tooltip: "Bold (Ctrl+B)" },
    { icon: Italic, format: "italic", tooltip: "Italic (Ctrl+I)" },
    { icon: Underline, format: "underline", tooltip: "Underline (Ctrl+U)" },
    { icon: Plus, format: "increaseSize", tooltip: "Increase Text Size" },
    { icon: Minus, format: "decreaseSize", tooltip: "Decrease Text Size" },
    { icon: List, format: "bulletList", tooltip: "Bullet List" },
    { icon: ListOrdered, format: "numberedList", tooltip: "Numbered List" },
    { icon: Quote, format: "blockquote", tooltip: "Block Quote" },
  ];

  return (
    <div className="space-y-3 border rounded-lg overflow-hidden">
      {/* Formatting Toolbar */}
      <div className="bg-muted/50 p-3 space-y-3">
        {/* History Controls */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={undo}
            disabled={historyIndex === 0}
            className="h-8 px-2"
          >
            <Undo className="h-4 w-4 mr-1" />
            Undo
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={redo}
            disabled={historyIndex === history.length - 1}
            className="h-8 px-2"
          >
            <Redo className="h-4 w-4 mr-1" />
            Redo
          </Button>
        </div>

        {/* Formatting Buttons */}
        <div className="flex items-center gap-1 flex-wrap">
          {formattingButtons.map((button, index) => (
            <Button
              key={index}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (button.format === "bulletList") {
                  createList("ul");
                } else if (button.format === "numberedList") {
                  createList("ol");
                } else {
                  formatText(button.format);
                }
              }}
              className="h-8 w-8 p-0"
              title={button.tooltip}
            >
              <button.icon className="h-4 w-4" />
            </Button>
          ))}

          {/* Link Popover */}
          <Popover open={linkPopoverOpen} onOpenChange={setLinkPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="Insert Link"
              >
                <Link className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">Insert Link</h4>
                <div className="space-y-2">
                  <Input
                    placeholder="Link text (optional)"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        insertLink();
                      }
                    }}
                  />
                  <Input
                    placeholder="URL"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        insertLink();
                      }
                    }}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLinkPopoverOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={insertLink} disabled={!linkUrl}>
                    Insert Link
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Emoji Popover */}
          <Popover open={emojiPopoverOpen} onOpenChange={setEmojiPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="Insert Emoji"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[600px]">
              <div className="space-y-4">
                <h4 className="font-medium">Insert Emoji</h4>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search emojis..."
                    value={emojiSearch}
                    onChange={(e) => setEmojiSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>

                {/* Emoji Grid */}
                <div className="grid grid-cols-8 gap-1 max-h-60 overflow-y-auto">
                  {filteredEmojis.length > 0 ? (
                    filteredEmojis.map((emoji, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-10 w-10 p-0 text-lg hover:bg-accent transition-all"
                        onClick={() => insertEmoji(emoji.char)}
                        title={emoji.name}
                      >
                        {emoji.char}
                      </Button>
                    ))
                  ) : (
                    <div className="col-span-8 text-center text-muted-foreground py-4">
                      No emojis found
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {filteredEmojis.length} emojis
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEmojiPopoverOpen(false);
                      setEmojiSearch("");
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Editor Content - WYSIWYG */}
      <div className="p-3 pt-0">
        <div
          ref={contentEditableRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          className="min-h-[200px] p-3 border rounded-md prose prose-sm max-w-none bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          style={{
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
          }}
          data-placeholder={placeholder}
        />
      </div>

      {/* Formatting Help */}
      <div className="bg-muted/30 p-3 border-t">
        <details className="text-sm">
          <summary className="cursor-pointer font-medium">
            Formatting Help
          </summary>
          <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <strong>Text Formatting</strong>
              <div>Select text and use buttons</div>
              <div>Or use keyboard shortcuts</div>
            </div>
            <div>
              <strong>Lists & Structure</strong>
              <div>Click list buttons to create</div>
              <div>Press Enter to add new items</div>
              <div>Press Enter twice to exit list</div>
              <div>Tab/Shift+Tab to indent/outdent</div>
            </div>
            <div>
              <strong>Keyboard Shortcuts</strong>
              <div>Ctrl+B - Bold</div>
              <div>Ctrl+I - Italic</div>
              <div>Ctrl+U - Underline</div>
              <div>Ctrl+Z - Undo</div>
              <div>Ctrl+Y - Redo</div>
            </div>
          </div>
        </details>
      </div>

      {/* Add CSS for list styling */}
      <style jsx>{`
        .prose ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .prose ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .prose li {
          margin: 0.25rem 0;
        }
      `}</style>
    </div>
  );
}
