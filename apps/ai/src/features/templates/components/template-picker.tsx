"use client";

// Template picker component for selecting prompt templates
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { PromptTemplate } from "../types";

type TemplatePickerProps = {
  templates: PromptTemplate[];
  onSelect: (template: PromptTemplate | null) => void;
  className?: string;
};

// Dropdown selector for choosing prompt templates with null option support
export function TemplatePicker({
  templates,
  onSelect,
  className,
}: TemplatePickerProps) {
  // Handle template selection from dropdown, supporting "none" option
  const handleValueChange = (value: string) => {
    if (value === "none") {
      onSelect(null);
    } else {
      const selectedTemplate = templates.find((t) => t.id === value);
      if (selectedTemplate) {
        onSelect(selectedTemplate);
      }
    }
  };

  return (
    <Select onValueChange={handleValueChange} defaultValue="none">
      <SelectTrigger
        className={cn(
          "!bg-background !opacity-100 bg-white dark:bg-zinc-900",
          className
        )}
      >
        <SelectValue placeholder="No template" />
      </SelectTrigger>
      <SelectContent className="!bg-popover !opacity-100 bg-white dark:bg-zinc-900">
        <SelectItem value="none">No template</SelectItem>
        {templates.map((template) => (
          <SelectItem key={template.id} value={template.id}>
            {template.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
