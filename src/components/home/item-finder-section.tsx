"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"

import itemFinderDataset from "@/data/star-ops-master-data.json"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type FinderCategory = "all" | "resources" | "armor" | "weapons" | "blueprints" | "locations"

type FinderDataset = {
  meta: {
    appName: string
    generatedOn: string
    gameVersionTarget: string
  }
  locations: Array<{
    id: string
    name: string
    systemId: string
    locationType: string
    parent?: string | null
    liveSummary?: string
  }>
  stores: Array<{
    id: string
    name: string
    locationId: string
  }>
  resources: Array<{
    id: string
    name: string
    category: string
    miningMethods?: string[]
    knownLocations?: string[]
    locationNotes?: string
    liveSummary?: string
    verificationStatus?: string
  }>
  armor: Array<{
    id: string
    name: string
    class: string
    manufacturer?: string
    recommendedFor?: string[]
    verificationStatus?: string
    liveSummary?: string
  }>
  weapons: Array<{
    id: string
    name: string
    class: string
    damageType: string
    liveSummary?: string
    verificationStatus?: string
    obtainMethods?: Array<{
      storeIds?: string[]
    }>
  }>
  crafting: {
    blueprints: Array<{
      id: string
      name: string
      craftsCategory: string
      acquisitionHints: string[]
      fabricatorType: string
      verificationStatus?: string
    }>
  }
}

type FinderItem = {
  id: string
  name: string
  category: FinderCategory
  categoryLabel: string
  summary: string
  tags: string[]
  verificationStatus: string
}

const dataset = itemFinderDataset as FinderDataset

const filterLabels: Array<{ value: FinderCategory; label: string }> = [
  { value: "all", label: "All" },
  { value: "resources", label: "Resources" },
  { value: "armor", label: "Armor" },
  { value: "weapons", label: "Weapons" },
  { value: "blueprints", label: "Blueprints" },
  { value: "locations", label: "Locations" },
]

const formatLabel = (value: string) =>
  value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase())

const limitTags = (values: Array<string | undefined>, limit = 3) =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value && value.trim())))).slice(0, limit)

const locationNameById = new Map(dataset.locations.map((location) => [location.id, location.name]))
const storeNameById = new Map(dataset.stores.map((store) => [store.id, store.name]))

const finderItems: FinderItem[] = Array.from(new Map([
  ...dataset.resources.map((resource) => ({
    id: resource.id,
    name: resource.name,
    category: "resources" as const,
    categoryLabel: formatLabel(resource.category),
    summary:
      resource.liveSummary ??
      resource.locationNotes ??
      `${resource.name} is indexed in the Star Ops item finder resource catalog.`,
    tags: limitTags([
      ...(resource.miningMethods ?? []).map(formatLabel),
      ...(resource.knownLocations ?? []).map((locationId) => locationNameById.get(locationId)),
    ]), 
    verificationStatus: resource.verificationStatus ?? "unknown",
  })),
  ...dataset.armor.map((armor) => ({
    id: armor.id,
    name: armor.name,
    category: "armor" as const,
    categoryLabel: formatLabel(armor.class),
    summary:
      armor.liveSummary ??
      `Built by ${armor.manufacturer ?? "an unknown manufacturer"} for ${armor.recommendedFor?.map(formatLabel).join(", ") || "field operations"}.`,
    tags: limitTags([formatLabel(armor.class), ...(armor.recommendedFor ?? []).map(formatLabel)]),
    verificationStatus: armor.verificationStatus ?? "unknown",
  })),
  ...dataset.weapons.map((weapon) => ({
    id: weapon.id,
    name: weapon.name,
    category: "weapons" as const,
    categoryLabel: formatLabel(weapon.class),
    summary:
      weapon.liveSummary ??
      `${formatLabel(weapon.damageType)} ${formatLabel(weapon.class)} indexed for combat loadout planning.`,
    tags: limitTags([
      formatLabel(weapon.damageType),
      ...((weapon.obtainMethods ?? []).flatMap((method) => method.storeIds ?? []).map((storeId) => storeNameById.get(storeId))),
    ]),
    verificationStatus: weapon.verificationStatus ?? "unknown",
  })),
  ...dataset.crafting.blueprints.map((blueprint) => ({
    id: blueprint.id,
    name: blueprint.name,
    category: "blueprints" as const,
    categoryLabel: formatLabel(blueprint.craftsCategory),
    summary: `${formatLabel(blueprint.fabricatorType)} blueprint tracked for ${formatLabel(blueprint.craftsCategory)} production.`,
    tags: limitTags(blueprint.acquisitionHints.map(formatLabel)),
    verificationStatus: blueprint.verificationStatus ?? "unknown",
  })),
  ...dataset.locations.map((location) => ({
    id: location.id,
    name: location.name,
    category: "locations" as const,
    categoryLabel: formatLabel(location.locationType),
    summary:
      location.liveSummary ??
      `${formatLabel(location.locationType)} in ${formatLabel(location.systemId)}${location.parent ? ` near ${location.parent}` : ""}.`,
    tags: limitTags([formatLabel(location.systemId), location.parent ?? undefined]),
    verificationStatus: "verified",
  })),
].map((item) => [`${item.category}:${item.id}`, item] as const)).values())

const summaryStats = [
  { label: "Catalog entries", value: finderItems.length },
  { label: "Mining resources", value: dataset.resources.length },
  { label: "Blueprints", value: dataset.crafting.blueprints.length },
  { label: "Locations", value: new Set(dataset.locations.map((location) => location.id)).size },
]

export function ItemFinderSection() {
  const [query, setQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<FinderCategory>("all")

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return finderItems.filter((item) => {
      const matchesFilter = activeFilter === "all" || item.category === activeFilter
      if (!matchesFilter) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      const haystack = [item.name, item.categoryLabel, item.summary, item.tags.join(" "), item.verificationStatus]
        .join(" ")
        .toLowerCase()

      return haystack.includes(normalizedQuery)
    })
  }, [activeFilter, query])

  const visibleItems = filteredItems.slice(0, 6)

  return (
    <section className="max-w-6xl mx-auto px-4 py-16" id="item-finder">
      <div className="grid gap-6 lg:grid-cols-[0.95fr,1.35fr]">
        <Card className="cyber-border bg-slate-900/90">
          <CardHeader>
            <Badge variant="outline" className="w-fit border-cyan-500/30 text-cyan-400">
              Star Ops Item Finder
            </Badge>
            <CardTitle className="text-3xl">Search item intel without leaving StarCitizenOps</CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              The second section of the homepage now brings mining resources, blueprints, weapons, armor, and location data from {dataset.meta.appName} into the main operations hub.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              {summaryStats.map((stat) => (
                <div key={stat.label} className="rounded-lg border border-cyan-500/20 bg-slate-950/60 p-4">
                  <div className="text-2xl font-bold text-cyan-400">{stat.value}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2 rounded-lg border border-border bg-slate-950/50 p-4 text-sm text-muted-foreground">
              <p>
                Target build: <span className="font-medium text-foreground">{dataset.meta.gameVersionTarget}</span>
              </p>
              <p>
                Dataset snapshot: <span className="font-medium text-foreground">{dataset.meta.generatedOn}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="cyber-border bg-slate-900/90">
          <CardHeader className="space-y-4">
            <div>
              <CardTitle className="text-2xl">Finder preview</CardTitle>
              <CardDescription>Search the imported catalog and filter it by item type.</CardDescription>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search for hadanite, armor, area18, blueprint..."
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {filterLabels.map((filter) => (
                <Button
                  key={filter.value}
                  type="button"
                  size="sm"
                  variant={activeFilter === filter.value ? "default" : "outline"}
                  className={activeFilter === filter.value ? "bg-cyan-500 text-slate-900 hover:bg-cyan-400" : "border-cyan-500/20 bg-slate-950/40"}
                  onClick={() => setActiveFilter(filter.value)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{visibleItems.length}</span> of{" "}
              <span className="font-medium text-foreground">{filteredItems.length}</span> matching entries.
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {visibleItems.map((item) => (
                <div key={item.id} className="rounded-lg border border-cyan-500/20 bg-slate-950/60 p-4">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge className="bg-cyan-500 text-slate-900 hover:bg-cyan-400">{filterLabels.find((filter) => filter.value === item.category)?.label ?? item.category}</Badge>
                    <Badge variant="outline" className="border-border text-muted-foreground">
                      {item.categoryLabel}
                    </Badge>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{item.name}</h3>
                  <p className="mb-4 text-sm text-muted-foreground">{item.summary}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.length > 0 ? (
                      item.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="bg-slate-800 text-slate-100">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="secondary" className="bg-slate-800 text-slate-100">
                        {formatLabel(item.verificationStatus)}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredItems.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                No matching item finder records yet. Try a different search or change the filter.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
