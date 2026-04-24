import { Rocket, Car, Users, Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Asset {
  id: string
  name: string
  assetType: string
  category: string
  quantity: number
  assignedTo?: string | null
  notes?: string | null
}

interface AssetListProps {
  assets: Asset[]
}

const categoryIcons: Record<string, React.ReactNode> = {
  CAPITAL_SHIP: <Rocket className="h-4 w-4 text-cyan-400" />,
  FIGHTER: <Rocket className="h-4 w-4 text-blue-400" />,
  BOMBER: <Rocket className="h-4 w-4 text-orange-400" />,
  TRANSPORT: <Package className="h-4 w-4 text-green-400" />,
  GROUND_VEHICLE: <Car className="h-4 w-4 text-yellow-400" />,
  INFANTRY: <Users className="h-4 w-4 text-slate-400" />,
}

export function AssetList({ assets }: AssetListProps) {
  if (assets.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No assets assigned</p>
  }

  return (
    <div className="space-y-2">
      {assets.map((asset) => (
        <div
          key={asset.id}
          className="flex items-center gap-3 p-3 rounded-md bg-slate-800 border border-border"
        >
          <div className="shrink-0">
            {categoryIcons[asset.category] ?? <Package className="h-4 w-4 text-muted-foreground" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{asset.name}</span>
              <Badge variant="outline" className="text-xs">x{asset.quantity}</Badge>
            </div>
            <div className="flex gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">{asset.assetType}</span>
              {asset.assignedTo && (
                <span className="text-xs text-cyan-400">→ {asset.assignedTo}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
