"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";

interface CreateOperationFromTemplateButtonProps {
  templateId: string;
  templateName?: string;
}

export function CreateOperationFromTemplateButton({
  templateId,
}: CreateOperationFromTemplateButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/operations/new?template=${templateId}`);
  };

  return (
    <Button onClick={handleClick} className="gap-2 bg-blue-600 hover:bg-blue-700">
      <Rocket className="w-4 h-4" />
      Create Operation from Template
    </Button>
  );
}
