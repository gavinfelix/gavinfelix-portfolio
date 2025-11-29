"use client";

// Compact template selector component for use in the input toolbar
import { Trigger } from "@radix-ui/react-select";
import { memo, type Dispatch, type SetStateAction } from "react";
import { SelectItem } from "@/components/ui/select";
import {
  PromptInputModelSelect,
  PromptInputModelSelectContent,
} from "@/components/elements/prompt-input";
import { ChevronDownIcon } from "@/components/icons";
import type { PromptTemplate } from "../types";

type TemplateSelectorCompactProps = {
  templates: PromptTemplate[];
  selectedTemplate?: PromptTemplate | null;
  onTemplateSelect?: (template: PromptTemplate | null) => void;
  setInput: Dispatch<SetStateAction<string>>;
};

function PureTemplateSelectorCompact({
  templates,
  selectedTemplate,
  onTemplateSelect,
  setInput,
}: TemplateSelectorCompactProps) {
  const handleValueChange = (value: string) => {
    if (value === "none") {
      onTemplateSelect?.(null);
    } else {
      const template = templates.find((t) => t.id === value);
      if (template) {
        onTemplateSelect?.(template);
        setInput(template.content);
      }
    }
  };

  return (
    <PromptInputModelSelect
      onValueChange={handleValueChange}
      value={selectedTemplate?.id || "none"}
    >
      <Trigger
        className="flex h-8 items-center gap-2 rounded-lg border-0 !bg-background !opacity-100 bg-white dark:bg-zinc-900 px-2 text-foreground shadow-none transition-colors hover:bg-accent focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        type="button"
      >
        <span className="hidden font-medium text-xs sm:block">
          {selectedTemplate?.name || "Template"}
        </span>
        <ChevronDownIcon size={16} />
      </Trigger>
      <PromptInputModelSelectContent className="min-w-[260px] p-0">
        <div className="flex flex-col gap-px">
          <SelectItem value="none">
            <div className="truncate font-medium text-xs">No template</div>
          </SelectItem>
          {templates.map((template) => (
            <SelectItem key={template.id} value={template.id}>
              <div className="truncate font-medium text-xs">
                {template.name}
              </div>
              <div className="mt-px truncate text-[10px] text-muted-foreground leading-tight">
                {template.description}
              </div>
            </SelectItem>
          ))}
        </div>
      </PromptInputModelSelectContent>
    </PromptInputModelSelect>
  );
}

export const TemplateSelectorCompact = memo(PureTemplateSelectorCompact);
