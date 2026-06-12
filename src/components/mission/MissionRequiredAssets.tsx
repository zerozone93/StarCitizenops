import { Badge } from "@/components/ui/badge";

interface MissionRequiredAssetsProps {
  asset: string;
}

export function MissionRequiredAssets({ asset }: MissionRequiredAssetsProps) {
  return (
    <Badge variant="outline" className="bg-purple-950 text-purple-100 border-purple-700 hover:bg-purple-900">
      {asset}
    </Badge>
  );
}

interface MissionRequiredAssetsListProps {
  assets: string[];
  optional?: boolean;
  title?: string;
}

export function MissionRequiredAssetsList({ assets, optional = false, title }: MissionRequiredAssetsListProps) {
  if (!assets || assets.length === 0) {
    return null;
  }

  const defaultTitle = optional ? "Optional Assets" : "Required Assets";

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-300">{title || defaultTitle}</h4>
      <div className="flex flex-wrap gap-2">
        {assets.map((asset, idx) => (
          <MissionRequiredAssets key={idx} asset={asset} />
        ))}
      </div>
    </div>
  );
}
