"use client";

import * as React from "react";
import { Badge } from "./badge";
import { Input } from "./input";
import { cn } from "~/lib/utils";

export interface TagInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange"
  > {
  value: string[];
  onChange?: (value: string[]) => void;
  onBlur?: () => void;
}

export function TagInput({
  value = [],
  onChange,
  onBlur,
  className,
  ...props
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;

    const newTags = [...value];
    if (!newTags.includes(trimmedTag)) {
      newTags.push(trimmedTag);
      onChange?.(newTags);
    }
    setInputValue("");
  };

  const removeTag = (index: number) => {
    const newTags = [...value];
    newTags.splice(index, 1);
    onChange?.(newTags);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["Enter", ","].includes(e.key)) {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (inputValue) {
      addTag(inputValue);
    }
    onBlur?.();
  };

  return (
    <div
      className={cn(
        "flex min-h-[2.5rem] w-full flex-wrap items-center gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring",
        className,
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag, index) => (
        <Badge
          key={index}
          variant="secondary"
          onRemove={() => removeTag(index)}
        >
          {tag}
        </Badge>
      ))}
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="flex-1 border-0 p-0 shadow-none focus-visible:ring-0"
        {...props}
        placeholder={value.length === 0 ? props?.placeholder : ""}
      />
    </div>
  );
}
