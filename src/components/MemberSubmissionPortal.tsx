'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AdminTabs, type AdminTab } from './logistics/AdminTabs';
import { StockPanel } from './logistics/StockPanel';
import { RefineryPanel } from './logistics/RefineryPanel';
import { TicketsPanel } from './logistics/TicketsPanel';
import { getOrgAccessState } from '../lib/access';
import { requestLogisticsAiVerdict } from '../lib/ai-scanner-client';
import { requestLogisticsCatalogSync } from '../lib/catalog-sync-client';
import {
  categorySubcategories,
  getDefaultUnitForCategory,
  getMaterialQualityScore,
  incomingMaterialsRequireRefining,
  logisticsCatalog,
  oreQualityOptions,
  refineryOutputQualityOptions,
  submissionCategories,
  type CatalogEntry,
  type SubmissionCategory,
  type SubmissionLineItem,
} from '../data/logistics-catalog';

type ReviewStatus = 'Pending review' | 'Approved' | 'Rejected';
type RequestKind = 'offer' | 'request';
type InventoryCategory = 'Weapons' | 'Ship Components' | 'Medical' | 'Mining';
type RefineryMethod =
  | 'Cormack Method'
  | 'Dinyx Solventation'
  | 'Electrostarolysis'
  | 'Ferron Exchange'
  | 'Gaskin Process'
  | 'Kazen Winnowing'
  | 'Pyrometric Chromalysis'
  | 'Thermonatic Deposition'
  | 'XCR Reaction';

type ReviewItem = {
  id: number;
  kind: RequestKind;
  member: string;
  title: string;
  material: string;
  quantity: string;
  note: string;
  screenshot: string;
  aiVerdict: string;
  status: ReviewStatus;
  lineItems: SubmissionLineItem[];
};

type InventoryItem = {
  id: number;
  name: string;
  category: InventoryCategory;
  subcategory: string;
  quantity: string;
  reservedQuantity: string;
  location: string;
  owner: string;
  screenshot: string;
  aiVerdict: string;
  quality?: string;
};

type StockMovement = {
  id: number;
  timestamp: string;
  action: 'added' | 'edited' | 'removed';
  item: string;
  quantity: string;
  actor: string;
  notes: string;
};

type FulfillmentTicket = {
  id: number;
  reviewItemId: number;
  member: string;
  requestTitle: string;
  material: string;
  quantity: string;
  createdDate: string;
  expectedDelivery: string;
  stockItemName: string;
  lineItems: SubmissionLineItem[];
  reservations: {
    stockItemId: number | null;
    stockItemName: string;
    quantity: string;
  }[];
  status: 'pending' | 'completed';
};

type ReceivingTicket = {
  id: number;
  reviewItemId: number;
  member: string;
  offerTitle: string;
  material: string;
  quantity: string;
  createdDate: string;
  completedDate?: string;
  lineItems: SubmissionLineItem[];
  status: 'pending' | 'completed';
};

type RefineryJob = {
  id: number;
  reviewItemId: number;
  member: string;
  materialName: string;
  quantity: string;
  unit: string;
  inputQuality: string;
  outputQuality: string;
  method: RefineryMethod;
  createdDate: string;
  expectedCompletion: string;
  status: 'queued' | 'completed';
};

type InsightTransaction = {
  id: string;
  member: string;
  title: string;
  quantity: number;
  status: string;
  createdDate: string;
  reference: string;
  lineItems: SubmissionLineItem[];
};

const refineryMethodYieldMultiplier: Record<RefineryMethod, number> = {
  'Cormack Method': 0.68,
  'Dinyx Solventation': 0.86,
  Electrostarolysis: 0.77,
  'Ferron Exchange': 0.84,
  'Gaskin Process': 0.72,
  'Kazen Winnowing': 0.66,
  'Pyrometric Chromalysis': 0.88,
  'Thermonatic Deposition': 0.74,
  'XCR Reaction': 0.69,
};

const refineryMethods = Object.keys(refineryMethodYieldMultiplier) as RefineryMethod[];

const createLineItem = (
  category: SubmissionCategory = 'Items',
  overrides: Partial<Omit<SubmissionLineItem, 'id'>> = {}
): SubmissionLineItem => ({
  id: Date.now() + Math.floor(Math.random() * 100000),
  category,
  subcategory: categorySubcategories[category][0] ?? '',
  name: '',
  quantity: '',
  unit: getDefaultUnitForCategory(category),
  quality: '',
  details: '',
  entryMethod: 'catalog',
  ...overrides,
});

const summarizeLineItems = (lineItems: SubmissionLineItem[]) => {
  if (lineItems.length === 0) {
    return 'No items';
  }

  if (lineItems.length === 1) {
    const lineItem = lineItems[0];
    return `${lineItem.name || lineItem.subcategory} • ${lineItem.quantity || '0'} ${lineItem.unit}`;
  }

  return `${lineItems.length} line items`;
};

const formatLineItemSummary = (lineItem: SubmissionLineItem) => {
  const qualityLabel = lineItem.quality ? ` • ${lineItem.quality}` : '';
  const detailsLabel = lineItem.details ? ` • ${lineItem.details}` : '';
  return `${lineItem.category} > ${lineItem.subcategory} > ${lineItem.name} • ${lineItem.quantity} ${lineItem.unit}${qualityLabel}${detailsLabel}`;
};

const getLineItemQuantityLabel = (lineItem: SubmissionLineItem) =>
  lineItem.category === 'Materials' ? 'SCU quantity' : 'Quantity';

const getLineItemUnitLabel = (lineItem: SubmissionLineItem) =>
  lineItem.category === 'Materials' ? 'Unit (usually SCU)' : 'Unit';

const getLineItemUnitPlaceholder = (lineItem: SubmissionLineItem) =>
  lineItem.category === 'Materials' ? 'SCU' : '';

const getLineItemQualityLabel = (lineItem: SubmissionLineItem) =>
  lineItem.category === 'Materials' ? 'Ore quality (intake)' : 'Condition / quality';

const mapLineItemToInventoryCategory = (lineItem: SubmissionLineItem): InventoryCategory => {
  if (lineItem.category === 'Materials') {
    return 'Mining';
  }

  const normalizedSubcategory = lineItem.subcategory.toLowerCase();
  const normalizedName = lineItem.name.toLowerCase();

  if (normalizedSubcategory.includes('medical') || normalizedName.includes('med')) {
    return 'Medical';
  }

  if (
    normalizedSubcategory.includes('component') ||
    normalizedSubcategory.includes('engine') ||
    normalizedSubcategory.includes('cooler') ||
    normalizedSubcategory.includes('shield') ||
    normalizedSubcategory.includes('electronics')
  ) {
    return 'Ship Components';
  }

  return 'Weapons';
};

const normalizeText = (value: string) => value.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

const levenshteinDistance = (a: string, b: string) => {
  if (a === b) {
    return 0;
  }

  if (a.length === 0) {
    return b.length;
  }

  if (b.length === 0) {
    return a.length;
  }

  const matrix: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i += 1) {
    matrix[i][0] = i;
  }

  for (let j = 0; j <= b.length; j += 1) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
};

const getCatalogMatchScore = (
  entry: CatalogEntry,
  query: string,
  preferredCategory: SubmissionCategory,
  preferredSubcategory: string
) => {
  const normalizedQuery = normalizeText(query);
  const normalizedName = normalizeText(entry.name);

  if (!normalizedQuery || !normalizedName) {
    return 0;
  }

  let score = 0;

  if (normalizedName === normalizedQuery) {
    score = 1;
  } else if (normalizedName.startsWith(normalizedQuery)) {
    score = 0.93;
  } else if (normalizedName.includes(normalizedQuery)) {
    score = 0.82;
  } else {
    const distance = levenshteinDistance(normalizedQuery, normalizedName);
    const maxLength = Math.max(normalizedQuery.length, normalizedName.length);
    const similarity = maxLength > 0 ? 1 - distance / maxLength : 0;
    score = similarity * 0.78;
  }

  if (entry.category === preferredCategory) {
    score += 0.05;
  }

  if (entry.subcategory === preferredSubcategory) {
    score += 0.04;
  }

  return score;
};

const findBestCatalogMatch = (
  catalog: CatalogEntry[],
  query: string,
  preferredCategory: SubmissionCategory,
  preferredSubcategory: string
) => {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return null;
  }

  const scoredMatches = catalog
    .map((entry) => ({
      entry,
      score: getCatalogMatchScore(entry, normalizedQuery, preferredCategory, preferredSubcategory),
    }))
    .sort((a, b) => b.score - a.score);

  const bestMatch = scoredMatches[0];
  const secondBestMatch = scoredMatches[1];

  if (!bestMatch) {
    return null;
  }

  const scoreDelta = secondBestMatch ? bestMatch.score - secondBestMatch.score : bestMatch.score;
  if (bestMatch.score >= 0.9 || (bestMatch.score >= 0.7 && scoreDelta >= 0.08)) {
    return bestMatch.entry;
  }

  return null;
};

export function MemberSubmissionPortal() {
  const access = getOrgAccessState();
  const isAdmin = access.isOrgAdmin;
  const [catalogEntries, setCatalogEntries] = useState<CatalogEntry[]>(logisticsCatalog);
  const [catalogSyncedAt, setCatalogSyncedAt] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const syncCatalog = async () => {
      const response = await requestLogisticsCatalogSync();

      if (!isMounted || response.entries.length === 0) {
        return;
      }

      setCatalogEntries(response.entries);
      setCatalogSyncedAt(response.syncedAt ?? null);
    };

    syncCatalog();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeCatalogEntries = catalogEntries.length > 0 ? catalogEntries : logisticsCatalog;

  const [offerTitle, setOfferTitle] = useState('');
  const [offerLineItems, setOfferLineItems] = useState<SubmissionLineItem[]>([createLineItem('Items')]);
  const [offerNote, setOfferNote] = useState('');
  const [offerScreenshotName, setOfferScreenshotName] = useState('No screenshot selected');

  const [requestTitle, setRequestTitle] = useState('');
  const [requestLineItems, setRequestLineItems] = useState<SubmissionLineItem[]>([createLineItem('Items')]);
  const [requestNote, setRequestNote] = useState('');

  const [offerMessage, setOfferMessage] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [items, setItems] = useState<ReviewItem[]>([
    {
      id: 1,
      kind: 'offer',
      member: 'Kai Voss',
      title: 'I want to give the org medical and mining supplies for the next deployment.',
      material: 'MedPen',
      quantity: '12 units',
      note: 'I can bring these in person at the next drop point.',
      screenshot: 'drop-1.png',
      aiVerdict: 'AI scan matched the stock offer to medical supplies.',
      status: 'Pending review',
      lineItems: [
        createLineItem('Items', {
          subcategory: 'Medical',
          name: 'MedPen',
          quantity: '12',
          unit: 'units',
        }),
      ],
    },
    {
      id: 2,
      kind: 'request',
      member: 'Iria Sol',
      title: 'I need additional ammo and repair parts for the upcoming operation.',
      material: 'Rail Gun Cartridges',
      quantity: '20 units',
      note: 'Please approve this request for the next deployment.',
      screenshot: 'No screenshot provided',
      aiVerdict: 'AI scan flagged this as a stock request for logistics review.',
      status: 'Pending review',
      lineItems: [
        createLineItem('Items', {
          subcategory: 'Ammunition',
          name: 'Rail Gun Cartridges',
          quantity: '20',
          unit: 'units',
        }),
      ],
    },
  ]);

  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('dashboard');
  const [openInsightPanel, setOpenInsightPanel] = useState<'contributors' | 'withdrawers' | null>(null);
  const [expandedInsightMember, setExpandedInsightMember] = useState<string | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([
    {
      id: 1,
      name: 'Rail Gun Cartridges',
      category: 'Weapons',
      subcategory: 'Ammunition',
      quantity: '120',
      reservedQuantity: '0',
      location: 'Hangar Bay 3',
      owner: 'Tessa Quinn',
      screenshot: 'ammo-1.png',
      aiVerdict: 'AI scan matched the weapon stock to the depot log.',
    },
    {
      id: 2,
      name: 'Fusion Thruster Core',
      category: 'Ship Components',
      subcategory: 'Engines',
      quantity: '4',
      reservedQuantity: '0',
      location: 'Dock 7',
      owner: 'Marek Voss',
      screenshot: 'thruster-1.png',
      aiVerdict: 'AI scan matched ship component stock to the manifest.',
    },
    {
      id: 3,
      name: 'MedPens',
      category: 'Medical',
      subcategory: 'Field Supplies',
      quantity: '60',
      reservedQuantity: '0',
      location: 'Med Bay',
      owner: 'Selene Hart',
      screenshot: 'med-1.png',
      aiVerdict: 'AI scan matched medical stock to the intake record.',
    },
  ]);
  const [inventoryName, setInventoryName] = useState('');
  const [inventoryCategory, setInventoryCategory] = useState<InventoryCategory>('Weapons');
  const [inventorySubcategory, setInventorySubcategory] = useState('Ammunition');
  const [inventoryQuantity, setInventoryQuantity] = useState('');
  const [inventoryQuality, setInventoryQuality] = useState('');
  const [inventoryLocation, setInventoryLocation] = useState('');
  const [inventoryOwner, setInventoryOwner] = useState('');
  const [inventoryScreenshotName, setInventoryScreenshotName] = useState('No screenshot selected');
  const [inventoryMessage, setInventoryMessage] = useState('');
  const [editingInventoryId, setEditingInventoryId] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<InventoryCategory | 'All'>('All');
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([
    {
      id: 1,
      timestamp: '2026-07-11 14:32',
      action: 'added',
      item: 'Rail Gun Cartridges',
      quantity: '120',
      actor: 'Admin',
      notes: 'Initial stock intake from Tessa Quinn',
    },
    {
      id: 2,
      timestamp: '2026-07-11 13:15',
      action: 'added',
      item: 'Fusion Thruster Core',
      quantity: '4',
      actor: 'Admin',
      notes: 'Ship components from Marek Voss',
    },
  ]);

  const [fulfillmentTickets, setFulfillmentTickets] = useState<FulfillmentTicket[]>([]);
  const [archivedTickets, setArchivedTickets] = useState<FulfillmentTicket[]>([]);
  const [receivingTickets, setReceivingTickets] = useState<ReceivingTicket[]>([]);
  const [archivedReceivingTickets, setArchivedReceivingTickets] = useState<ReceivingTicket[]>([]);
  const [refineryQueue, setRefineryQueue] = useState<RefineryJob[]>([]);
  const [completedRefineryJobs, setCompletedRefineryJobs] = useState<RefineryJob[]>([]);
  const [offerInventoryReceipts, setOfferInventoryReceipts] = useState<Record<number, SubmissionLineItem[]>>({});

  const updateLineItems = (
    kind: RequestKind,
    updater: (current: SubmissionLineItem[]) => SubmissionLineItem[]
  ) => {
    if (kind === 'offer') {
      setOfferLineItems((current) => updater(current));
      return;
    }

    setRequestLineItems((current) => updater(current));
  };

  const addLineItem = (kind: RequestKind) => {
    updateLineItems(kind, (current) => [...current, createLineItem()]);
  };

  const removeLineItem = (kind: RequestKind, lineItemId: number) => {
    updateLineItems(kind, (current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter((lineItem) => lineItem.id !== lineItemId);
    });
  };

  const updateLineItemField = (
    kind: RequestKind,
    lineItemId: number,
    field: keyof Omit<SubmissionLineItem, 'id'>,
    value: string
  ) => {
    updateLineItems(kind, (current) =>
      current.map((lineItem) => {
        if (lineItem.id !== lineItemId) {
          return lineItem;
        }

        if (field === 'category') {
          const nextCategory = value as SubmissionCategory;
          const nextSubcategory = categorySubcategories[nextCategory][0] ?? '';
          const defaultUnit = getDefaultUnitForCategory(nextCategory);

          return {
            ...lineItem,
            category: nextCategory,
            subcategory: nextSubcategory,
            unit: defaultUnit,
            quality: nextCategory === 'Materials' ? lineItem.quality : '',
          };
        }

        if (field === 'entryMethod') {
          const nextEntryMethod = value as SubmissionLineItem['entryMethod'];
          return {
            ...lineItem,
            entryMethod: nextEntryMethod,
          };
        }

        if (field === 'name') {
          if (lineItem.entryMethod === 'manual') {
            return {
              ...lineItem,
              name: value,
            };
          }

          const trimmedValue = value.trim();
          const exactCatalogMatch = activeCatalogEntries.find(
            (entry) => entry.name.toLowerCase() === trimmedValue.toLowerCase()
          );
          const fuzzyCatalogMatch =
            trimmedValue.length >= 3
              ? findBestCatalogMatch(activeCatalogEntries, trimmedValue, lineItem.category, lineItem.subcategory)
              : null;
          const matchedCatalogEntry = exactCatalogMatch ?? fuzzyCatalogMatch;

          if (!matchedCatalogEntry) {
            return {
              ...lineItem,
              name: value,
            };
          }

          return {
            ...lineItem,
            category: matchedCatalogEntry.category,
            subcategory: matchedCatalogEntry.subcategory,
            name: matchedCatalogEntry.name,
            unit: lineItem.unit || matchedCatalogEntry.defaultUnit,
          };
        }

        return {
          ...lineItem,
          [field]: value,
        };
      })
    );
  };

  const lineItemsAreValid = (lineItems: SubmissionLineItem[]) =>
    lineItems.length > 0 &&
    lineItems.every((lineItem) => {
      const quantity = Number(lineItem.quantity);
      const materialQualityIsValid =
        lineItem.category !== 'Materials' ||
        Boolean(lineItem.quality.trim());

      return Boolean(
        lineItem.category &&
        lineItem.subcategory.trim() &&
        lineItem.name.trim() &&
        lineItem.unit.trim() &&
        materialQualityIsValid &&
        !Number.isNaN(quantity) &&
        quantity > 0
      );
    });

  const receiveApprovedOfferIntoInventory = (reviewItem: ReviewItem) => {
    const nonMaterialItems = reviewItem.lineItems.filter((lineItem) => lineItem.category !== 'Materials');

    if (nonMaterialItems.length === 0) {
      return;
    }

    const receivedAt = new Date().toLocaleString();

    setInventoryItems((currentInventory) => {
      const nextInventory = [...currentInventory];

      nonMaterialItems.forEach((lineItem) => {
        const incomingQuantity = Number(lineItem.quantity) || 0;
        if (incomingQuantity <= 0) {
          return;
        }

        const index = nextInventory.findIndex((item) => item.name.toLowerCase() === lineItem.name.toLowerCase());

        if (index >= 0) {
          const existingItem = nextInventory[index];
          const currentQuantity = Number(existingItem.quantity) || 0;
          nextInventory[index] = {
            ...existingItem,
            quantity: String(currentQuantity + incomingQuantity),
            quality: lineItem.quality || existingItem.quality,
          };
          return;
        }

        nextInventory.unshift({
          id: Date.now() + Math.floor(Math.random() * 100000),
          name: lineItem.name,
          category: mapLineItemToInventoryCategory(lineItem),
          subcategory: lineItem.subcategory,
          quantity: String(incomingQuantity),
          reservedQuantity: '0',
          location: 'Receiving Dock',
          owner: reviewItem.member,
          screenshot: reviewItem.screenshot,
          aiVerdict: `Accepted from offer approval on ${receivedAt}`,
          quality: lineItem.quality,
        });
      });

      return nextInventory;
    });

    setStockMovements((currentMovements) => [
      ...nonMaterialItems.map((lineItem) => ({
        id: Date.now() + Math.floor(Math.random() * 100000),
        timestamp: receivedAt,
        action: 'added' as const,
        item: lineItem.name,
        quantity: lineItem.quantity,
        actor: 'Approval queue',
        notes: `Accepted offer from ${reviewItem.member}`,
      })),
      ...currentMovements,
    ]);

    setOfferInventoryReceipts((currentReceipts) => ({
      ...currentReceipts,
      [reviewItem.id]: nonMaterialItems,
    }));
  };

  const rollbackApprovedOfferInventory = (reviewItemId: number) => {
    const receipt = offerInventoryReceipts[reviewItemId];

    if (!receipt || receipt.length === 0) {
      return;
    }

    setInventoryItems((currentInventory) =>
      currentInventory
        .map((item) => {
          const matchingReceiptLines = receipt.filter(
            (lineItem) => lineItem.name.toLowerCase() === item.name.toLowerCase()
          );

          if (matchingReceiptLines.length === 0) {
            return item;
          }

          const rollbackQuantity = matchingReceiptLines.reduce(
            (total, lineItem) => total + (Number(lineItem.quantity) || 0),
            0
          );
          const currentQuantity = Number(item.quantity) || 0;
          const nextQuantity = Math.max(0, currentQuantity - rollbackQuantity);

          return {
            ...item,
            quantity: String(nextQuantity),
          };
        })
        .filter((item) => (Number(item.quantity) || 0) > 0)
    );

    setOfferInventoryReceipts((currentReceipts) => {
      const nextReceipts = { ...currentReceipts };
      delete nextReceipts[reviewItemId];
      return nextReceipts;
    });
  };

  const reserveInventoryForLineItem = (material: string, quantity: string) => {
    const requestAmount = Number(quantity);
    const normalizedMaterial = material.toLowerCase();

    if (Number.isNaN(requestAmount) || requestAmount <= 0) {
      return { stockItemId: null, stockItemName: material };
    }

    const matchingItem = inventoryItems.find((item) => {
      return (
        item.name.toLowerCase() === normalizedMaterial ||
        item.subcategory.toLowerCase() === normalizedMaterial ||
        item.name.toLowerCase().includes(normalizedMaterial) ||
        item.subcategory.toLowerCase().includes(normalizedMaterial)
      );
    });

    if (!matchingItem) {
      return { stockItemId: null, stockItemName: material };
    }

    setInventoryItems((current) =>
      current.map((item) => {
        if (item.id !== matchingItem.id) {
          return item;
        }

        const totalQuantity = Number(item.quantity) || 0;
        const reservedQuantity = Number(item.reservedQuantity) || 0;
        const nextReservedQuantity = Math.min(totalQuantity, reservedQuantity + requestAmount);

        return {
          ...item,
          reservedQuantity: String(nextReservedQuantity),
        };
      })
    );

    return { stockItemId: matchingItem.id, stockItemName: matchingItem.name };
  };

  const reserveInventoryForTicket = (lineItems: SubmissionLineItem[]) => {
    return lineItems.map((lineItem) => ({
      ...reserveInventoryForLineItem(lineItem.name, lineItem.quantity),
      quantity: lineItem.quantity,
    }));
  };

  const releaseInventoryReservation = (stockItemId: number | null, quantity: string) => {
    const releaseAmount = Number(quantity);

    if (stockItemId === null || Number.isNaN(releaseAmount) || releaseAmount <= 0) {
      return;
    }

    setInventoryItems((current) =>
      current.map((item) => {
        if (item.id !== stockItemId) {
          return item;
        }

        const reservedQuantity = Number(item.reservedQuantity) || 0;
        const nextReservedQuantity = Math.max(0, reservedQuantity - releaseAmount);

        return {
          ...item,
          reservedQuantity: String(nextReservedQuantity),
        };
      })
    );
  };

  const releaseInventoryReservations = (
    reservations: {
      stockItemId: number | null;
      stockItemName: string;
      quantity: string;
    }[]
  ) => {
    reservations.forEach((reservation) => {
      releaseInventoryReservation(reservation.stockItemId, reservation.quantity);
    });
  };

  const archiveReviewItemById = (reviewItemId: number) => {
    setItems((current) => current.filter((item) => item.id !== reviewItemId));
  };

  const completeReceivingTicket = (ticket: ReceivingTicket) => {
    const completedDate = new Date().toLocaleDateString();

    setReceivingTickets((current) => current.filter((currentTicket) => currentTicket.id !== ticket.id));
    setArchivedReceivingTickets((current) => [
      ...current,
      {
        ...ticket,
        status: 'completed',
        completedDate,
      },
    ]);

    archiveReviewItemById(ticket.reviewItemId);
  };

  const completeFulfillmentTicket = (ticket: FulfillmentTicket) => {
    if (ticket.reservations.length === 0) {
      setFulfillmentTickets((current) => current.filter((currentTicket) => currentTicket.id !== ticket.id));
      setArchivedTickets((current) => [...current, { ...ticket, status: 'completed' }]);
      archiveReviewItemById(ticket.reviewItemId);
      return;
    }

    const completedByStockItemId = ticket.reservations.reduce<Record<number, number>>((acc, reservation) => {
      if (reservation.stockItemId === null) {
        return acc;
      }

      const completedQuantity = Number(reservation.quantity) || 0;
      acc[reservation.stockItemId] = (acc[reservation.stockItemId] ?? 0) + completedQuantity;
      return acc;
    }, {});

    setInventoryItems((current) =>
      current.map((item) => {
        const completedQuantity = completedByStockItemId[item.id] ?? 0;
        if (completedQuantity <= 0) {
          return item;
        }

        const totalQuantity = Number(item.quantity) || 0;
        const reservedQuantity = Number(item.reservedQuantity) || 0;
        const nextTotalQuantity = Math.max(0, totalQuantity - completedQuantity);
        const nextReservedQuantity = Math.max(0, reservedQuantity - completedQuantity);

        return {
          ...item,
          quantity: String(nextTotalQuantity),
          reservedQuantity: String(nextReservedQuantity),
        };
      })
    );

    setFulfillmentTickets((current) => current.filter((currentTicket) => currentTicket.id !== ticket.id));
    setArchivedTickets((current) => [...current, { ...ticket, status: 'completed' }]);
    archiveReviewItemById(ticket.reviewItemId);
  };

  const submitOffer = async (event: React.FormEvent) => {
    event.preventDefault();
    const includesMaterials = offerLineItems.some((lineItem) => lineItem.category === 'Materials');
    const fallbackOfferVerdict = offerScreenshotName !== 'No screenshot selected'
      ? `AI scan matched ${offerLineItems.length} delivered item line${offerLineItems.length > 1 ? 's' : ''}.${includesMaterials && incomingMaterialsRequireRefining ? ' Material intake is auto-routed to refinery queue.' : ''}`
      : `AI scan needs a screenshot before it can confirm the stock offer.${includesMaterials && incomingMaterialsRequireRefining ? ' Material intake is auto-routed to refinery queue.' : ''}`;

    if (!lineItemsAreValid(offerLineItems)) {
      setOfferMessage('Each delivered line needs category, subcategory, item, quantity, unit, and ore quality for material lines.');
      return;
    }

    const normalizedOfferLineItems = offerLineItems.map((lineItem) => ({ ...lineItem }));
    const aiVerdict = await requestLogisticsAiVerdict(
      {
        context: 'offer',
        hasScreenshot: offerScreenshotName !== 'No screenshot selected',
        title: offerTitle,
        lineItems: normalizedOfferLineItems,
        note: offerNote,
      },
      fallbackOfferVerdict
    );

    const newItem: ReviewItem = {
      id: Date.now(),
      kind: 'offer',
      member: 'Current member',
      title: offerTitle,
      material: summarizeLineItems(normalizedOfferLineItems),
      quantity: `${normalizedOfferLineItems.length}`,
      note: offerNote,
      screenshot: offerScreenshotName,
      aiVerdict,
      status: 'Pending review',
      lineItems: normalizedOfferLineItems,
    };

    setItems((current) => [newItem, ...current]);
    setOfferMessage('Your stock offer has been submitted for admin review.');
    setRequestMessage('');
    setOfferTitle('');
    setOfferLineItems([createLineItem('Items')]);
    setOfferNote('');
    setOfferScreenshotName('No screenshot selected');
  };

  const submitRequest = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!lineItemsAreValid(requestLineItems)) {
      setRequestMessage('Each requested line needs category, subcategory, item, quantity, unit, and ore quality for material lines.');
      return;
    }

    const normalizedRequestLineItems = requestLineItems.map((lineItem) => ({ ...lineItem }));
    const fallbackRequestVerdict = `AI scan marked this as a stock request for admin handling (${normalizedRequestLineItems.length} line${normalizedRequestLineItems.length === 1 ? '' : 's'}).`;
    const aiVerdict = await requestLogisticsAiVerdict(
      {
        context: 'request',
        hasScreenshot: false,
        title: requestTitle,
        lineItems: normalizedRequestLineItems,
        note: requestNote,
      },
      fallbackRequestVerdict
    );

    const newItem: ReviewItem = {
      id: Date.now() + 1,
      kind: 'request',
      member: 'Current member',
      title: requestTitle,
      material: summarizeLineItems(normalizedRequestLineItems),
      quantity: `${normalizedRequestLineItems.length}`,
      note: requestNote,
      screenshot: 'No screenshot required',
      aiVerdict,
      status: 'Pending review',
      lineItems: normalizedRequestLineItems,
    };

    setItems((current) => [newItem, ...current]);
    setRequestMessage('Your stock request has been submitted for admin review.');
    setOfferMessage('');
    setRequestTitle('');
    setRequestLineItems([createLineItem('Items')]);
    setRequestNote('');
  };

  const getRefinedMaterialName = (materialName: string) => {
    if (materialName.toLowerCase().startsWith('refined ')) {
      return materialName;
    }

    return `Refined ${materialName}`;
  };

  const queueRefineryJobsForOffer = (reviewItem: ReviewItem) => {
    const materialLineItems = reviewItem.lineItems.filter((lineItem) => lineItem.category === 'Materials');

    if (materialLineItems.length === 0 || !incomingMaterialsRequireRefining) {
      return;
    }

    const now = new Date();
    const expectedCompletion = new Date(now.getTime() + 8 * 60 * 60 * 1000);

    const jobs: RefineryJob[] = materialLineItems.map((lineItem, index) => ({
      id: Date.now() + index,
      reviewItemId: reviewItem.id,
      member: reviewItem.member,
      materialName: lineItem.name,
      quantity: lineItem.quantity,
      unit: lineItem.unit,
      inputQuality: lineItem.quality || 'Unrated / mixed load',
      outputQuality: 'Commercial grade (balanced yield)',
      method: 'Electrostarolysis',
      createdDate: now.toLocaleString(),
      expectedCompletion: expectedCompletion.toLocaleString(),
      status: 'queued',
    }));

    setRefineryQueue((currentQueue) => {
      const existingByReview = currentQueue.filter((job) => job.reviewItemId === reviewItem.id);
      if (existingByReview.length > 0) {
        return currentQueue;
      }

      return [...jobs, ...currentQueue];
    });

    setStockMovements((currentMovements) => [
      ...jobs.map((job) => ({
        id: Date.now() + Math.floor(Math.random() * 1000),
        timestamp: new Date().toLocaleString(),
        action: 'added' as const,
        item: job.materialName,
        quantity: job.quantity,
        actor: 'Current admin',
        notes: `Incoming material routed to separate refinery queue (${job.method})`,
      })),
      ...currentMovements,
    ]);
  };

  const updateRefineryJobMethod = (jobId: number, method: RefineryMethod) => {
    setRefineryQueue((currentQueue) =>
      currentQueue.map((job) =>
        job.id === jobId
          ? {
              ...job,
              method,
            }
          : job
      )
    );
  };

  const updateRefineryJobOutputQuality = (jobId: number, outputQuality: string) => {
    setRefineryQueue((currentQueue) =>
      currentQueue.map((job) =>
        job.id === jobId
          ? {
              ...job,
              outputQuality,
            }
          : job
      )
    );
  };

  const completeRefineryJob = (job: RefineryJob) => {
    const inputQuantity = Number(job.quantity) || 0;
    const yieldMultiplier = refineryMethodYieldMultiplier[job.method] ?? 0.75;
    const refinedQuantity = Math.max(0, inputQuantity * yieldMultiplier);

    const refinedInventoryItem: InventoryItem = {
      id: Date.now(),
      name: getRefinedMaterialName(job.materialName),
      category: 'Mining',
      subcategory: `Refined Material • ${job.outputQuality}`,
      quantity: refinedQuantity.toFixed(2),
      reservedQuantity: '0',
      location: 'Refinery Storage',
      owner: 'Organisation',
      screenshot: 'System generated',
      aiVerdict: `Refinery job completed via ${job.method}. Input: ${job.inputQuality}. Output: ${job.outputQuality}.`,
      quality: job.outputQuality,
    };

    setRefineryQueue((currentQueue) => currentQueue.filter((queueJob) => queueJob.id !== job.id));
    setCompletedRefineryJobs((currentCompleted) => [...currentCompleted, { ...job, status: 'completed' }]);
    setInventoryItems((currentInventory) => [refinedInventoryItem, ...currentInventory]);
    setStockMovements((currentMovements) => [
      {
        id: Date.now() + Math.floor(Math.random() * 1000),
        timestamp: new Date().toLocaleString(),
        action: 'added',
        item: refinedInventoryItem.name,
        quantity: refinedInventoryItem.quantity,
        actor: 'Refinery system',
        notes: `Refinery completion added to inventory from ${job.materialName}`,
      },
      ...currentMovements,
    ]);
  };

  const updateStatus = (id: number, status: ReviewStatus) => {
    setItems((current) => {
      const targetItem = current.find((item) => item.id === id);

      if (!targetItem) {
        return current;
      }

      if (targetItem.status === status) {
        return current;
      }

      const updatedItems = current.map((item) => (item.id === id ? { ...item, status } : item));

      if (targetItem.kind === 'request') {
        if (targetItem.status !== 'Approved' && status === 'Approved') {
          const now = new Date();
          const expectedDelivery = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          const reservations = reserveInventoryForTicket(targetItem.lineItems);
          const ticket: FulfillmentTicket = {
            id: Date.now(),
            reviewItemId: targetItem.id,
            member: targetItem.member,
            requestTitle: targetItem.title,
            material: summarizeLineItems(targetItem.lineItems),
            quantity: String(targetItem.lineItems.length),
            createdDate: now.toLocaleDateString(),
            expectedDelivery: expectedDelivery.toLocaleDateString(),
            stockItemName: reservations.length === 1 ? reservations[0].stockItemName : 'Multiple stock items',
            lineItems: targetItem.lineItems,
            reservations,
            status: 'pending',
          };

          setFulfillmentTickets((currentTickets) => {
            const existingTicket = currentTickets.find((currentTicket) => currentTicket.reviewItemId === targetItem.id);
            if (existingTicket) {
              return currentTickets;
            }

            return [ticket, ...currentTickets];
          });
        }

        if (targetItem.status === 'Approved' && status !== 'Approved') {
          setFulfillmentTickets((currentTickets) => {
            const ticketToRemove = currentTickets.find((currentTicket) => currentTicket.reviewItemId === targetItem.id);

            if (!ticketToRemove) {
              return currentTickets;
            }

              releaseInventoryReservations(ticketToRemove.reservations);
            return currentTickets.filter((currentTicket) => currentTicket.reviewItemId !== targetItem.id);
          });
        }
      }

      if (targetItem.kind === 'offer' && targetItem.status !== 'Approved' && status === 'Approved') {
        const now = new Date();
        const receivingTicket: ReceivingTicket = {
          id: Date.now() + 500,
          reviewItemId: targetItem.id,
          member: targetItem.member,
          offerTitle: targetItem.title,
          material: summarizeLineItems(targetItem.lineItems),
          quantity: String(targetItem.lineItems.length),
          createdDate: now.toLocaleDateString(),
          lineItems: targetItem.lineItems,
          status: 'pending',
        };

        setReceivingTickets((currentTickets) => {
          const existingTicket = currentTickets.find((ticket) => ticket.reviewItemId === targetItem.id);
          if (existingTicket) {
            return currentTickets;
          }

          return [receivingTicket, ...currentTickets];
        });

        receiveApprovedOfferIntoInventory(targetItem);
        queueRefineryJobsForOffer(targetItem);
      }

      if (targetItem.kind === 'offer' && targetItem.status === 'Approved' && status !== 'Approved') {
        rollbackApprovedOfferInventory(targetItem.id);
        setReceivingTickets((currentTickets) =>
          currentTickets.filter((ticket) => ticket.reviewItemId !== targetItem.id)
        );
        setRefineryQueue((currentQueue) =>
          currentQueue.filter((job) => job.reviewItemId !== targetItem.id)
        );
      }

      return updatedItems;
    });
  };

  const handleInventorySubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const isManualCreate = editingInventoryId === null;
    const normalizedInventoryName = inventoryName.trim().toLowerCase();
    const isKnownMaterialName = activeCatalogEntries.some(
      (entry) => entry.category === 'Materials' && entry.name.toLowerCase() === normalizedInventoryName
    );
    const isMaterialLikeEntry =
      inventoryCategory === 'Mining' ||
      isKnownMaterialName ||
      inventorySubcategory.toLowerCase().includes('ore') ||
      inventorySubcategory.toLowerCase().includes('material') ||
      inventorySubcategory.toLowerCase().includes('refined');

    if (isManualCreate && isMaterialLikeEntry && incomingMaterialsRequireRefining) {
      setInventoryMessage('Material intake is locked to Refinery Queue. Approve incoming materials, then complete refinery jobs to add output to inventory.');
      return;
    }

    const fallbackInventoryVerdict = inventoryScreenshotName !== 'No screenshot selected'
      ? `AI scan matched ${inventoryName || 'the stock item'} to the ${inventoryCategory} record.`
      : 'AI scan needs a screenshot before it can place the stock item.';
    const aiVerdict = await requestLogisticsAiVerdict(
      {
        context: 'inventory',
        hasScreenshot: inventoryScreenshotName !== 'No screenshot selected',
        materialName: inventoryName,
        category: inventoryCategory,
        note: `subcategory:${inventorySubcategory}`,
      },
      fallbackInventoryVerdict
    );

    const payload: InventoryItem = {
      id: editingInventoryId ?? Date.now(),
      name: inventoryName,
      category: inventoryCategory,
      subcategory: inventorySubcategory,
      quantity: inventoryQuantity,
      reservedQuantity: editingInventoryId ? (inventoryItems.find((item) => item.id === editingInventoryId)?.reservedQuantity ?? '0') : '0',
      location: inventoryLocation,
      owner: inventoryOwner,
      screenshot: inventoryScreenshotName,
      aiVerdict,
      quality: inventoryQuality,
    };

    if (editingInventoryId) {
      setInventoryItems((current) => current.map((item) => (item.id === editingInventoryId ? payload : item)));
      setInventoryMessage('Stock entry updated and placed in the correct inventory category.');
      setStockMovements((current) => [
        {
          id: Date.now(),
          timestamp: new Date().toLocaleString(),
          action: 'edited',
          item: inventoryName,
          quantity: inventoryQuantity,
          actor: 'Current admin',
          notes: `Updated in ${inventoryCategory} > ${inventorySubcategory}`,
        },
        ...current,
      ]);
    } else {
      setInventoryItems((current) => [payload, ...current]);
      setInventoryMessage('Stock entry added and routed to the correct category.');
      setStockMovements((current) => [
        {
          id: Date.now(),
          timestamp: new Date().toLocaleString(),
          action: 'added',
          item: inventoryName,
          quantity: inventoryQuantity,
          actor: 'Current admin',
          notes: `Added to ${inventoryCategory} > ${inventorySubcategory} at ${inventoryLocation}`,
        },
        ...current,
      ]);
    }

    setInventoryName('');
    setInventoryCategory('Weapons');
    setInventorySubcategory('Ammunition');
    setInventoryQuantity('');
    setInventoryQuality('');
    setInventoryLocation('');
    setInventoryOwner('');
    setInventoryScreenshotName('No screenshot selected');
    setEditingInventoryId(null);
  };

  const startInventoryEdit = (item: InventoryItem) => {
    setEditingInventoryId(item.id);
    setInventoryName(item.name);
    setInventoryCategory(item.category);
    setInventorySubcategory(item.subcategory);
    setInventoryQuantity(item.quantity);
    setInventoryQuality(item.quality ?? '');
    setInventoryLocation(item.location);
    setInventoryOwner(item.owner);
    setInventoryScreenshotName(item.screenshot);
    setInventoryMessage('');
  };

  const pendingCount = items.filter((item) => item.status === 'Pending review').length;
  const approvedCount = items.filter((item) => item.status === 'Approved').length;
  const rejectedCount = items.filter((item) => item.status === 'Rejected').length;

  const sumLineItemsQuantity = (lineItems: SubmissionLineItem[]) =>
    lineItems.reduce((acc, lineItem) => acc + (Number(lineItem.quantity) || 0), 0);

  const receivingDistributingMetrics = useMemo(() => {
    const receivingQueue = items.filter((item) => item.kind === 'offer' && item.status === 'Pending review');
    const receivingApproved = items.filter((item) => item.kind === 'offer' && item.status === 'Approved');
    const receivingCompleted = archivedReceivingTickets;
    const distributingApproved = items.filter((item) => item.kind === 'request' && item.status === 'Approved');

    const receivingQueueQuantity = receivingQueue.reduce((acc, item) => acc + sumLineItemsQuantity(item.lineItems), 0);
    const receivingApprovedQuantity =
      receivingApproved.reduce((acc, item) => acc + sumLineItemsQuantity(item.lineItems), 0) +
      receivingCompleted.reduce((acc, ticket) => acc + sumLineItemsQuantity(ticket.lineItems), 0);
    const distributingOpenQuantity = fulfillmentTickets.reduce((acc, ticket) => acc + sumLineItemsQuantity(ticket.lineItems), 0);
    const distributingCompletedQuantity = archivedTickets.reduce((acc, ticket) => acc + sumLineItemsQuantity(ticket.lineItems), 0);

    return {
      receivingQueueLines: receivingQueue.reduce((acc, item) => acc + item.lineItems.length, 0),
      receivingQueueQuantity,
      receivingApprovedLines:
        receivingApproved.reduce((acc, item) => acc + item.lineItems.length, 0) +
        receivingCompleted.reduce((acc, ticket) => acc + ticket.lineItems.length, 0),
      receivingApprovedQuantity,
      distributingOpenLines: fulfillmentTickets.reduce((acc, ticket) => acc + ticket.lineItems.length, 0),
      distributingOpenQuantity,
      distributingCompletedLines: archivedTickets.reduce((acc, ticket) => acc + ticket.lineItems.length, 0),
      distributingCompletedQuantity,
      distributingApprovedRequests: distributingApproved.length + archivedTickets.length,
    };
  }, [items, fulfillmentTickets, archivedTickets, archivedReceivingTickets]);

  const storedMaterialTiles = useMemo(() => {
    const materialPattern = /(ore|refined|metal|material|gas|mineral|med)/i;
    const source = inventoryItems.filter(
      (item) =>
        item.category === 'Mining' ||
        item.category === 'Medical' ||
        materialPattern.test(item.name) ||
        materialPattern.test(item.subcategory)
    );

    const candidates = source.length > 0 ? source : inventoryItems;

    return candidates.map((item) => {
      const total = Number(item.quantity) || 0;
      const reserved = Number(item.reservedQuantity) || 0;
      const available = Math.max(total - reserved, 0);
      const ratio = total > 0 ? available / total : 0;
      const reservedRatio = total > 0 ? reserved / total : 0;
      const qualityRating = getMaterialQualityScore(item.name, ratio, reservedRatio);

      return {
        id: item.id,
        name: item.name,
        quantity: total,
        quality: qualityRating.quality,
        qualityColor: qualityRating.color,
        qualityScore: qualityRating.score,
        qualityReason: qualityRating.reason,
        category: item.category,
        location: item.location,
      };
    });
  }, [inventoryItems]);

  const groupedInventory = useMemo(() => {
    return inventoryItems.reduce<Record<InventoryCategory, InventoryItem[]>>((acc, item) => {
      acc[item.category] = acc[item.category] ?? [];
      acc[item.category].push(item);
      return acc;
    }, {
      Weapons: [],
      'Ship Components': [],
      Medical: [],
      Mining: [],
    });
  }, [inventoryItems]);

  const memberInsights = useMemo(() => {
    const contributorTotals: Record<string, number> = {};
    const withdrawTotals: Record<string, number> = {};

    items
      .filter((item) => item.kind === 'offer' && item.status === 'Approved')
      .forEach((item) => {
        contributorTotals[item.member] = (contributorTotals[item.member] ?? 0) + sumLineItemsQuantity(item.lineItems);
      });

    archivedReceivingTickets.forEach((ticket) => {
      contributorTotals[ticket.member] = (contributorTotals[ticket.member] ?? 0) + sumLineItemsQuantity(ticket.lineItems);
    });

    [...fulfillmentTickets, ...archivedTickets].forEach((ticket) => {
      withdrawTotals[ticket.member] = (withdrawTotals[ticket.member] ?? 0) + sumLineItemsQuantity(ticket.lineItems);
    });

    const topContributors = Object.entries(contributorTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topWithdrawers = Object.entries(withdrawTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      topContributors,
      topWithdrawers,
    };
  }, [items, fulfillmentTickets, archivedTickets, archivedReceivingTickets]);

  const contributorTransactions = useMemo(() => {
    const transactions: InsightTransaction[] = [];

    items
      .filter((item) => item.kind === 'offer' && item.status === 'Approved')
      .forEach((item) => {
        transactions.push({
          id: `offer-${item.id}`,
          member: item.member,
          title: item.title,
          quantity: sumLineItemsQuantity(item.lineItems),
          status: 'Approved',
          createdDate: 'Active intake',
          reference: `Offer #${item.id}`,
          lineItems: item.lineItems,
        });
      });

    archivedReceivingTickets.forEach((ticket) => {
      transactions.push({
        id: `receiving-${ticket.id}`,
        member: ticket.member,
        title: ticket.offerTitle,
        quantity: sumLineItemsQuantity(ticket.lineItems),
        status: 'Completed intake',
        createdDate: ticket.completedDate ?? ticket.createdDate,
        reference: `Receiving #${ticket.id}`,
        lineItems: ticket.lineItems,
      });
    });

    return transactions;
  }, [items, archivedReceivingTickets]);

  const withdrawTransactions = useMemo(() => {
    const transactions: InsightTransaction[] = [];

    fulfillmentTickets.forEach((ticket) => {
      transactions.push({
        id: `fulfillment-open-${ticket.id}`,
        member: ticket.member,
        title: ticket.requestTitle,
        quantity: sumLineItemsQuantity(ticket.lineItems),
        status: 'Pending fulfillment',
        createdDate: ticket.createdDate,
        reference: `Fulfillment #${ticket.id}`,
        lineItems: ticket.lineItems,
      });
    });

    archivedTickets.forEach((ticket) => {
      transactions.push({
        id: `fulfillment-archived-${ticket.id}`,
        member: ticket.member,
        title: ticket.requestTitle,
        quantity: sumLineItemsQuantity(ticket.lineItems),
        status: 'Completed withdrawal',
        createdDate: ticket.expectedDelivery,
        reference: `Archive #${ticket.id}`,
        lineItems: ticket.lineItems,
      });
    });

    return transactions;
  }, [fulfillmentTickets, archivedTickets]);

  const contributorReceiptsByMember = useMemo(() => {
    return contributorTransactions.reduce<Record<string, InsightTransaction[]>>((acc, transaction) => {
      acc[transaction.member] = [...(acc[transaction.member] ?? []), transaction];
      return acc;
    }, {});
  }, [contributorTransactions]);

  const withdrawReceiptsByMember = useMemo(() => {
    return withdrawTransactions.reduce<Record<string, InsightTransaction[]>>((acc, transaction) => {
      acc[transaction.member] = [...(acc[transaction.member] ?? []), transaction];
      return acc;
    }, {});
  }, [withdrawTransactions]);

  const activeInsightReceipts = openInsightPanel === 'contributors' ? contributorReceiptsByMember : withdrawReceiptsByMember;
  const activeInsightMembers = Object.entries(activeInsightReceipts)
    .map(([member, receipts]) => ({
      member,
      receipts,
      total: receipts.reduce((acc, receipt) => acc + receipt.quantity, 0),
    }))
    .sort((a, b) => b.total - a.total);

  if (isAdmin) {
    // ADMIN DASHBOARD
    return (
      <section style={{ display: 'grid', gap: '1.25rem', marginTop: '1.25rem' }}>
        <section className="card" style={{ padding: '1.25rem', display: 'grid', gap: '0.9rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <p style={{ textTransform: 'uppercase', letterSpacing: '0.24em', color: '#c9832f', fontSize: '0.78rem', marginBottom: '0.35rem' }}>Logistics command</p>
              <h2 style={{ margin: 0 }}>Operations control center</h2>
            </div>
            <p style={{ margin: 0, color: '#d7c5a1', fontSize: '0.95rem' }}>Dashboard for form intake and insights, with dedicated stock, refinery, and ticket tabs.</p>
          </div>

          <AdminTabs activeAdminTab={activeAdminTab} onTabChange={setActiveAdminTab} />
        </section>

        {activeAdminTab === 'dashboard' ? (
          <>
        <section className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <p style={{ textTransform: 'uppercase', letterSpacing: '0.24em', color: '#c9832f', fontSize: '0.78rem', marginBottom: '0.35rem' }}>Member portal</p>
              <h2 style={{ margin: 0 }}>Contribute stock or request items</h2>
            </div>
            <div style={{ color: '#d7c5a1', fontSize: '0.95rem' }}>
              Your submissions will be reviewed by org admins
            </div>
          </div>

          <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
            {offerMessage ? (
              <div style={{ padding: '0.85rem 1rem', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.14)', color: '#f2c175' }}>
                {offerMessage}
              </div>
            ) : null}

            {requestMessage ? (
              <div style={{ padding: '0.85rem 1rem', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.14)', color: '#f3d19a' }}>
                {requestMessage}
              </div>
            ) : null}

            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))' }}>
              <form onSubmit={submitOffer} style={{ display: 'grid', gap: '0.75rem', padding: '1rem', borderRadius: '16px', background: 'rgba(255,255,255,0.04)' }}>
                <h3 style={{ margin: 0 }}>Give stock to the org</h3>
                <label style={{ display: 'grid', gap: '0.3rem' }}>
                  <span style={{ color: '#d7c5a1' }}>What are you giving?</span>
                  <textarea value={offerTitle} onChange={(event) => setOfferTitle((event.target as HTMLTextAreaElement).value)} rows={3} style={{ padding: '0.7rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }} />
                </label>
                <div style={{ display: 'grid', gap: '0.6rem' }}>
                  {offerLineItems.map((lineItem, index) => (
                    <div key={lineItem.id} style={{ padding: '0.7rem', borderRadius: '10px', background: 'rgba(20,18,15,0.68)', display: 'grid', gap: '0.55rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.92rem' }}>Delivery line {index + 1}</strong>
                        <button className="button button-secondary" type="button" onClick={() => removeLineItem('offer', lineItem.id)} style={{ padding: '0.25rem 0.55rem' }} disabled={offerLineItems.length === 1}>Remove</button>
                      </div>
                      <div style={{ display: 'grid', gap: '0.55rem', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                        <label style={{ display: 'grid', gap: '0.28rem' }}>
                          <span style={{ color: '#d7c5a1' }}>Category</span>
                          <select value={lineItem.category} onChange={(event) => updateLineItemField('offer', lineItem.id, 'category', (event.target as HTMLSelectElement).value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }}>
                            {submissionCategories.map((category) => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                        </label>
                        <label style={{ display: 'grid', gap: '0.28rem' }}>
                          <span style={{ color: '#d7c5a1' }}>Subcategory</span>
                          <select value={lineItem.subcategory} onChange={(event) => updateLineItemField('offer', lineItem.id, 'subcategory', (event.target as HTMLSelectElement).value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }}>
                            {categorySubcategories[lineItem.category].map((subcategory) => (
                              <option key={subcategory} value={subcategory}>{subcategory}</option>
                            ))}
                          </select>
                        </label>
                        <label style={{ display: 'grid', gap: '0.28rem' }}>
                          <span style={{ color: '#d7c5a1' }}>Item / material</span>
                          <input
                            list="submission-item-options"
                            value={lineItem.name}
                            onChange={(event) => updateLineItemField('offer', lineItem.id, 'name', (event.target as HTMLInputElement).value)}
                            placeholder={lineItem.entryMethod === 'catalog' ? 'Start typing for matches' : 'Enter item name manually'}
                            style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }}
                          />
                        </label>
                        <label style={{ display: 'grid', gap: '0.28rem' }}>
                          <span style={{ color: '#d7c5a1' }}>Entry method</span>
                          <select value={lineItem.entryMethod} onChange={(event) => updateLineItemField('offer', lineItem.id, 'entryMethod', (event.target as HTMLSelectElement).value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }}>
                            <option value="catalog">Catalog match</option>
                            <option value="manual">Manual free entry</option>
                          </select>
                        </label>
                        <label style={{ display: 'grid', gap: '0.28rem' }}>
                          <span style={{ color: '#d7c5a1' }}>{getLineItemQuantityLabel(lineItem)}</span>
                          <input type="number" min="0.01" step="0.01" value={lineItem.quantity} onChange={(event) => updateLineItemField('offer', lineItem.id, 'quantity', (event.target as HTMLInputElement).value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }} />
                        </label>
                        <label style={{ display: 'grid', gap: '0.28rem' }}>
                          <span style={{ color: '#d7c5a1' }}>{getLineItemUnitLabel(lineItem)}</span>
                          <input value={lineItem.unit} placeholder={getLineItemUnitPlaceholder(lineItem)} onChange={(event) => updateLineItemField('offer', lineItem.id, 'unit', (event.target as HTMLInputElement).value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }} />
                        </label>
                        <label style={{ display: 'grid', gap: '0.28rem' }}>
                          <span style={{ color: '#d7c5a1' }}>{getLineItemQualityLabel(lineItem)}</span>
                          {lineItem.category === 'Materials' ? (
                            <select value={lineItem.quality} onChange={(event) => updateLineItemField('offer', lineItem.id, 'quality', (event.target as HTMLSelectElement).value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }}>
                              <option value="">Select ore quality</option>
                              {oreQualityOptions.map((quality) => (
                                <option key={quality} value={quality}>{quality}</option>
                              ))}
                            </select>
                          ) : (
                            <input value={lineItem.quality} placeholder="Factory new / used / damaged" onChange={(event) => updateLineItemField('offer', lineItem.id, 'quality', (event.target as HTMLInputElement).value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }} />
                          )}
                        </label>
                        <label style={{ display: 'grid', gap: '0.28rem', gridColumn: '1 / -1' }}>
                          <span style={{ color: '#d7c5a1' }}>Details (variant / manufacturer / notes)</span>
                          <input value={lineItem.details} onChange={(event) => updateLineItemField('offer', lineItem.id, 'details', (event.target as HTMLInputElement).value)} placeholder="Example: Behring P4-AR, Size 2, Grade A" style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }} />
                        </label>
                      </div>
                    </div>
                  ))}
                  <button className="button button-secondary" type="button" onClick={() => addLineItem('offer')} style={{ justifySelf: 'start', padding: '0.35rem 0.7rem' }}>Add delivered line item</button>
                </div>
                <label style={{ display: 'grid', gap: '0.3rem' }}>
                  <span style={{ color: '#d7c5a1' }}>Notes</span>
                  <textarea value={offerNote} onChange={(event) => setOfferNote((event.target as HTMLTextAreaElement).value)} rows={2} style={{ padding: '0.7rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }} />
                </label>
                <label style={{ display: 'grid', gap: '0.3rem' }}>
                  <span style={{ color: '#d7c5a1' }}>Upload screenshot</span>
                  <input type="file" accept="image/*" onChange={(event) => setOfferScreenshotName(event.target.files?.[0]?.name ?? 'No screenshot selected')} style={{ padding: '0.4rem 0', color: 'white' }} />
                  <span style={{ color: '#9f8d68', fontSize: '0.9rem' }}>Selected: {offerScreenshotName}</span>
                </label>
                <button className="button button-primary" type="submit" style={{ justifySelf: 'start' }}>Submit stock offer</button>
              </form>

              <form onSubmit={submitRequest} style={{ display: 'grid', gap: '0.75rem', padding: '1rem', borderRadius: '16px', background: 'rgba(255,255,255,0.04)' }}>
                <h3 style={{ margin: 0 }}>Request stock from the org</h3>
                <label style={{ display: 'grid', gap: '0.3rem' }}>
                  <span style={{ color: '#d7c5a1' }}>What do you need?</span>
                  <textarea value={requestTitle} onChange={(event) => setRequestTitle((event.target as HTMLTextAreaElement).value)} rows={3} style={{ padding: '0.7rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }} />
                </label>
                <div style={{ display: 'grid', gap: '0.6rem' }}>
                  {requestLineItems.map((lineItem, index) => (
                    <div key={lineItem.id} style={{ padding: '0.7rem', borderRadius: '10px', background: 'rgba(20,18,15,0.68)', display: 'grid', gap: '0.55rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.92rem' }}>Request line {index + 1}</strong>
                        <button className="button button-secondary" type="button" onClick={() => removeLineItem('request', lineItem.id)} style={{ padding: '0.25rem 0.55rem' }} disabled={requestLineItems.length === 1}>Remove</button>
                      </div>
                      <div style={{ display: 'grid', gap: '0.55rem', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                        <label style={{ display: 'grid', gap: '0.28rem' }}>
                          <span style={{ color: '#d7c5a1' }}>Category</span>
                          <select value={lineItem.category} onChange={(event) => updateLineItemField('request', lineItem.id, 'category', (event.target as HTMLSelectElement).value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }}>
                            {submissionCategories.map((category) => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                        </label>
                        <label style={{ display: 'grid', gap: '0.28rem' }}>
                          <span style={{ color: '#d7c5a1' }}>Subcategory</span>
                          <select value={lineItem.subcategory} onChange={(event) => updateLineItemField('request', lineItem.id, 'subcategory', (event.target as HTMLSelectElement).value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }}>
                            {categorySubcategories[lineItem.category].map((subcategory) => (
                              <option key={subcategory} value={subcategory}>{subcategory}</option>
                            ))}
                          </select>
                        </label>
                        <label style={{ display: 'grid', gap: '0.28rem' }}>
                          <span style={{ color: '#d7c5a1' }}>Item / material</span>
                          <input
                            list="submission-item-options"
                            value={lineItem.name}
                            onChange={(event) => updateLineItemField('request', lineItem.id, 'name', (event.target as HTMLInputElement).value)}
                            placeholder={lineItem.entryMethod === 'catalog' ? 'Start typing for matches' : 'Enter item name manually'}
                            style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }}
                          />
                        </label>
                        <label style={{ display: 'grid', gap: '0.28rem' }}>
                          <span style={{ color: '#d7c5a1' }}>Entry method</span>
                          <select value={lineItem.entryMethod} onChange={(event) => updateLineItemField('request', lineItem.id, 'entryMethod', (event.target as HTMLSelectElement).value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }}>
                            <option value="catalog">Catalog match</option>
                            <option value="manual">Manual free entry</option>
                          </select>
                        </label>
                        <label style={{ display: 'grid', gap: '0.28rem' }}>
                          <span style={{ color: '#d7c5a1' }}>{getLineItemQuantityLabel(lineItem)}</span>
                          <input type="number" min="0.01" step="0.01" value={lineItem.quantity} onChange={(event) => updateLineItemField('request', lineItem.id, 'quantity', (event.target as HTMLInputElement).value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }} />
                        </label>
                        <label style={{ display: 'grid', gap: '0.28rem' }}>
                          <span style={{ color: '#d7c5a1' }}>{getLineItemUnitLabel(lineItem)}</span>
                          <input value={lineItem.unit} placeholder={getLineItemUnitPlaceholder(lineItem)} onChange={(event) => updateLineItemField('request', lineItem.id, 'unit', (event.target as HTMLInputElement).value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }} />
                        </label>
                        <label style={{ display: 'grid', gap: '0.28rem' }}>
                          <span style={{ color: '#d7c5a1' }}>{getLineItemQualityLabel(lineItem)}</span>
                          {lineItem.category === 'Materials' ? (
                            <select value={lineItem.quality} onChange={(event) => updateLineItemField('request', lineItem.id, 'quality', (event.target as HTMLSelectElement).value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }}>
                              <option value="">Select ore quality</option>
                              {oreQualityOptions.map((quality) => (
                                <option key={quality} value={quality}>{quality}</option>
                              ))}
                            </select>
                          ) : (
                            <input value={lineItem.quality} placeholder="Factory new / used / damaged" onChange={(event) => updateLineItemField('request', lineItem.id, 'quality', (event.target as HTMLInputElement).value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }} />
                          )}
                        </label>
                        <label style={{ display: 'grid', gap: '0.28rem', gridColumn: '1 / -1' }}>
                          <span style={{ color: '#d7c5a1' }}>Details (variant / manufacturer / notes)</span>
                          <input value={lineItem.details} onChange={(event) => updateLineItemField('request', lineItem.id, 'details', (event.target as HTMLInputElement).value)} placeholder="Example: Behring P4-AR, Size 2, Grade A" style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }} />
                        </label>
                      </div>
                    </div>
                  ))}
                  <button className="button button-secondary" type="button" onClick={() => addLineItem('request')} style={{ justifySelf: 'start', padding: '0.35rem 0.7rem' }}>Add requested line item</button>
                </div>
                <label style={{ display: 'grid', gap: '0.3rem' }}>
                  <span style={{ color: '#d7c5a1' }}>Why do you need it?</span>
                  <textarea value={requestNote} onChange={(event) => setRequestNote((event.target as HTMLTextAreaElement).value)} rows={2} style={{ padding: '0.7rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }} />
                </label>
                <button className="button button-secondary" type="submit" style={{ justifySelf: 'start' }}>Submit stock request</button>
              </form>
            </div>

            <datalist id="submission-item-options">
              {activeCatalogEntries.map((entry) => (
                <option key={`${entry.category}-${entry.subcategory}-${entry.name}`} value={entry.name} label={`${entry.category} > ${entry.subcategory}`} />
              ))}
            </datalist>
          </div>
        </section>
          </>
        ) : null}

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <p style={{ textTransform: 'uppercase', letterSpacing: '0.24em', color: '#c9832f', fontSize: '0.78rem', marginBottom: '0.35rem' }}>Admin tools</p>
              <h2 style={{ margin: 0 }}>Logistics & inventory management</h2>
            </div>
            <div style={{ color: '#d7c5a1', fontSize: '0.95rem' }}>
              Full control over stock, approvals, and member submissions
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {activeAdminTab === 'dashboard' ? (
          <div className="card" style={{ padding: '1rem', display: 'grid', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0 }}>Receiving vs Distributing</h3>
              <span style={{ color: '#9f8d68', fontSize: '0.9rem' }}>
                Live totals from multi-line requests and deliveries
              </span>
            </div>
            <div style={{ display: 'grid', gap: '0.7rem', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
              <div style={{ padding: '0.8rem', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.12)' }}>
                <p style={{ margin: 0, color: '#d9a45a', fontSize: '0.82rem' }}>Receiving Queue</p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '1.1rem', fontWeight: 700 }}>
                  {receivingDistributingMetrics.receivingQueueLines} lines
                </p>
                <p style={{ margin: '0.2rem 0 0', color: '#d7c5a1', fontSize: '0.85rem' }}>
                  Qty {receivingDistributingMetrics.receivingQueueQuantity.toFixed(2)}
                </p>
              </div>
              <div style={{ padding: '0.8rem', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.12)' }}>
                <p style={{ margin: 0, color: '#c9832f', fontSize: '0.82rem' }}>Received Approved</p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '1.1rem', fontWeight: 700 }}>
                  {receivingDistributingMetrics.receivingApprovedLines} lines
                </p>
                <p style={{ margin: '0.2rem 0 0', color: '#d7c5a1', fontSize: '0.85rem' }}>
                  Qty {receivingDistributingMetrics.receivingApprovedQuantity.toFixed(2)}
                </p>
              </div>
              <div style={{ padding: '0.8rem', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.12)' }}>
                <p style={{ margin: 0, color: '#e09a36', fontSize: '0.82rem' }}>Distributing Open</p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '1.1rem', fontWeight: 700 }}>
                  {receivingDistributingMetrics.distributingOpenLines} lines
                </p>
                <p style={{ margin: '0.2rem 0 0', color: '#d7c5a1', fontSize: '0.85rem' }}>
                  Qty {receivingDistributingMetrics.distributingOpenQuantity.toFixed(2)} • {receivingDistributingMetrics.distributingApprovedRequests} requests
                </p>
              </div>
              <div style={{ padding: '0.8rem', borderRadius: '10px', background: 'rgba(148, 163, 184, 0.16)' }}>
                <p style={{ margin: 0, color: '#d7c5a1', fontSize: '0.82rem' }}>Distributed Completed</p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '1.1rem', fontWeight: 700 }}>
                  {receivingDistributingMetrics.distributingCompletedLines} lines
                </p>
                <p style={{ margin: '0.2rem 0 0', color: '#d7c5a1', fontSize: '0.85rem' }}>
                  Qty {receivingDistributingMetrics.distributingCompletedQuantity.toFixed(2)}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              <button
                type="button"
                onClick={() => {
                  setOpenInsightPanel((current) => (current === 'contributors' ? null : 'contributors'));
                  setExpandedInsightMember(null);
                }}
                style={{
                  padding: '0.9rem',
                  borderRadius: '12px',
                  background: 'rgba(64, 44, 22, 0.62)',
                  border: openInsightPanel === 'contributors' ? '1px solid rgba(201, 131, 47, 0.42)' : '1px solid rgba(255,255,255,0.08)',
                  textAlign: 'left',
                  color: 'inherit',
                  cursor: 'pointer',
                }}
              >
                <h4 style={{ margin: '0 0 0.5rem', color: '#c9832f' }}>Top contributors (click to inspect)</h4>
                {memberInsights.topContributors.length === 0 ? (
                  <p style={{ margin: 0, color: '#9f8d68', fontSize: '0.9rem' }}>No approved contributions yet.</p>
                ) : (
                  memberInsights.topContributors.map(([member, total]) => (
                    <p key={member} style={{ margin: '0.2rem 0', color: '#d7c5a1', fontSize: '0.9rem' }}>
                      {member} • {total.toFixed(2)} units
                    </p>
                  ))
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setOpenInsightPanel((current) => (current === 'withdrawers' ? null : 'withdrawers'));
                  setExpandedInsightMember(null);
                }}
                style={{
                  padding: '0.9rem',
                  borderRadius: '12px',
                  background: 'rgba(89, 52, 24, 0.55)',
                  border: openInsightPanel === 'withdrawers' ? '1px solid rgba(224, 154, 54, 0.42)' : '1px solid rgba(255,255,255,0.08)',
                  textAlign: 'left',
                  color: 'inherit',
                  cursor: 'pointer',
                }}
              >
                <h4 style={{ margin: '0 0 0.5rem', color: '#e09a36' }}>Top intakers (click to inspect)</h4>
                {memberInsights.topWithdrawers.length === 0 ? (
                  <p style={{ margin: 0, color: '#9f8d68', fontSize: '0.9rem' }}>No withdrawals tracked yet.</p>
                ) : (
                  memberInsights.topWithdrawers.map(([member, total]) => (
                    <p key={member} style={{ margin: '0.2rem 0', color: '#d7c5a1', fontSize: '0.9rem' }}>
                      {member} • {total.toFixed(2)} units
                    </p>
                  ))
                )}
              </button>
            </div>

            {openInsightPanel ? (
              <div style={{ padding: '0.95rem', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h4 style={{ margin: '0 0 0.6rem', color: '#c9832f' }}>
                  {openInsightPanel === 'contributors' ? 'Contributor transaction receipts' : 'Intake/withdraw transaction receipts'}
                </h4>
                {activeInsightMembers.length === 0 ? (
                  <p style={{ margin: 0, color: '#9f8d68' }}>No member receipts available yet.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '0.6rem' }}>
                    {activeInsightMembers.map((entry) => (
                      <div key={entry.member} style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(20,18,15,0.65)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <button
                          type="button"
                          onClick={() => setExpandedInsightMember((current) => (current === entry.member ? null : entry.member))}
                          style={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '0.6rem',
                            background: 'transparent',
                            border: 'none',
                            color: '#d7c5a1',
                            cursor: 'pointer',
                            padding: 0,
                            textAlign: 'left',
                          }}
                        >
                          <strong>{entry.member}</strong>
                          <span style={{ color: '#9f8d68', fontSize: '0.85rem' }}>
                            {entry.total.toFixed(2)} units • {entry.receipts.length} receipt{entry.receipts.length === 1 ? '' : 's'}
                          </span>
                        </button>

                        {expandedInsightMember === entry.member ? (
                          <div style={{ display: 'grid', gap: '0.45rem', marginTop: '0.55rem' }}>
                            {entry.receipts.map((receipt) => (
                              <div key={receipt.id} style={{ padding: '0.6rem', borderRadius: '8px', background: 'rgba(255,255,255,0.04)' }}>
                                <p style={{ margin: 0, color: '#d7c5a1', fontSize: '0.9rem' }}><strong>{receipt.title}</strong></p>
                                <p style={{ margin: '0.2rem 0 0', color: '#9f8d68', fontSize: '0.82rem' }}>{receipt.status} • {receipt.createdDate} • Qty {receipt.quantity.toFixed(2)}</p>
                                <p style={{ margin: '0.2rem 0 0', color: '#9f8d68', fontSize: '0.82rem' }}>Ref: {receipt.reference}</p>
                                <div style={{ display: 'grid', gap: '0.15rem', marginTop: '0.25rem' }}>
                                  {receipt.lineItems.map((lineItem) => (
                                    <p key={`${receipt.id}-${lineItem.id}`} style={{ margin: 0, color: '#d7c5a1', fontSize: '0.8rem' }}>
                                      {lineItem.name} • {lineItem.quantity} {lineItem.unit} {lineItem.quality ? `• ${lineItem.quality}` : ''}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            <p style={{ margin: 0, color: '#c9832f', fontSize: '0.9rem' }}>Pending {pendingCount} • Approved {approvedCount} • Rejected {rejectedCount}</p>
          </div>
          ) : null}

          {activeAdminTab === 'approval' ? (
            <div className="card" style={{ padding: '1.25rem', display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Approval queue</h3>
                <span style={{ color: '#c9832f', fontSize: '0.9rem' }}>Pending {pendingCount} • Approved {approvedCount} • Rejected {rejectedCount}</span>
              </div>
              {items.map((item) => (
                <div key={item.id} style={{ padding: '0.95rem', borderRadius: '12px', background: 'rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <strong>{item.kind === 'offer' ? 'Stock offer' : 'Stock request'} • {item.material}</strong>
                    <span style={{ color: item.status === 'Approved' ? '#d9a45a' : item.status === 'Rejected' ? '#fda4af' : '#c9832f' }}>{item.status}</span>
                  </div>
                  <p style={{ margin: '0.4rem 0 0.35rem', color: '#d7c5a1' }}>Member: <strong>{item.member}</strong></p>
                  <p style={{ margin: '0.35rem 0 0.25rem', color: '#d7c5a1' }}>{item.title}</p>
                  <p style={{ margin: '0 0 0.35rem', color: '#9f8d68' }}>{item.note}</p>
                  <div style={{ display: 'grid', gap: '0.25rem', marginBottom: '0.35rem' }}>
                    {item.lineItems.map((lineItem) => (
                      <p key={lineItem.id} style={{ margin: 0, color: '#d7c5a1', fontSize: '0.9rem' }}>
                        {formatLineItemSummary(lineItem)}
                      </p>
                    ))}
                  </div>
                  <p style={{ margin: 0, color: '#d7c5a1' }}>Screenshot: {item.screenshot}</p>
                  <p style={{ margin: '0.35rem 0 0', color: '#c9832f' }}>{item.aiVerdict}</p>
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.7rem' }}>
                    <button className="button button-primary" type="button" onClick={() => updateStatus(item.id, 'Approved')}>Approve</button>
                    <button className="button button-secondary" type="button" onClick={() => updateStatus(item.id, 'Rejected')}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          ) : activeAdminTab === 'inventory' ? (
            <StockPanel catalogSyncedAt={catalogSyncedAt} inventoryMessage={inventoryMessage}>
              <form onSubmit={handleInventorySubmit} style={{ display: 'grid', gap: '0.75rem', padding: '1rem', borderRadius: '16px', background: 'rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                  <label style={{ display: 'grid', gap: '0.3rem' }}>
                    <span style={{ color: '#d7c5a1' }}>Item name</span>
                    <input value={inventoryName} onChange={(event) => setInventoryName((event.target as HTMLInputElement).value)} style={{ padding: '0.7rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }} />
                  </label>
                  <label style={{ display: 'grid', gap: '0.3rem' }}>
                    <span style={{ color: '#d7c5a1' }}>Category</span>
                    <select value={inventoryCategory} onChange={(event) => setInventoryCategory((event.target as HTMLSelectElement).value as InventoryCategory)} style={{ padding: '0.7rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }}>
                      <option value="Weapons">Weapons</option>
                      <option value="Ship Components">Ship Components</option>
                      <option value="Medical">Medical</option>
                      {editingInventoryId ? <option value="Mining">Mining</option> : null}
                    </select>
                  </label>
                  <label style={{ display: 'grid', gap: '0.3rem' }}>
                    <span style={{ color: '#d7c5a1' }}>Subcategory</span>
                    <input value={inventorySubcategory} onChange={(event) => setInventorySubcategory((event.target as HTMLInputElement).value)} style={{ padding: '0.7rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }} />
                  </label>
                  <label style={{ display: 'grid', gap: '0.3rem' }}>
                    <span style={{ color: '#d7c5a1' }}>Quantity</span>
                    <input value={inventoryQuantity} onChange={(event) => setInventoryQuantity((event.target as HTMLInputElement).value)} style={{ padding: '0.7rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }} />
                  </label>
                  <label style={{ display: 'grid', gap: '0.3rem' }}>
                    <span style={{ color: '#d7c5a1' }}>Quality / grade</span>
                    {inventoryCategory === 'Mining' ? (
                      <select value={inventoryQuality} onChange={(event) => setInventoryQuality((event.target as HTMLSelectElement).value)} style={{ padding: '0.7rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }}>
                        <option value="">Select quality</option>
                        {oreQualityOptions.map((quality) => (
                          <option key={quality} value={quality}>{quality}</option>
                        ))}
                        {refineryOutputQualityOptions.map((quality) => (
                          <option key={quality} value={quality}>{quality}</option>
                        ))}
                      </select>
                    ) : (
                      <input value={inventoryQuality} onChange={(event) => setInventoryQuality((event.target as HTMLInputElement).value)} placeholder="Factory new / used / damaged" style={{ padding: '0.7rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }} />
                    )}
                  </label>
                  <label style={{ display: 'grid', gap: '0.3rem' }}>
                    <span style={{ color: '#d7c5a1' }}>Stored at</span>
                    <input value={inventoryLocation} onChange={(event) => setInventoryLocation((event.target as HTMLInputElement).value)} style={{ padding: '0.7rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }} />
                  </label>
                  <label style={{ display: 'grid', gap: '0.3rem' }}>
                    <span style={{ color: '#d7c5a1' }}>Owner</span>
                    <input value={inventoryOwner} onChange={(event) => setInventoryOwner((event.target as HTMLInputElement).value)} style={{ padding: '0.7rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }} />
                  </label>
                </div>
                <label style={{ display: 'grid', gap: '0.3rem' }}>
                  <span style={{ color: '#d7c5a1' }}>Upload screenshot for AI scan</span>
                  <input type="file" accept="image/*" onChange={(event) => setInventoryScreenshotName(event.target.files?.[0]?.name ?? 'No screenshot selected')} style={{ padding: '0.4rem 0', color: 'white' }} />
                  <span style={{ color: '#9f8d68', fontSize: '0.9rem' }}>Selected: {inventoryScreenshotName}</span>
                </label>
                <button className="button button-primary" type="submit" style={{ justifySelf: 'start' }}>{editingInventoryId ? 'Update stock entry' : 'Add stock entry'}</button>
              </form>

              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ padding: '0.95rem', borderRadius: '12px', background: 'rgba(255,255,255,0.04)' }}>
                  <h4 style={{ margin: '0 0 0.6rem', color: '#c9832f' }}>Stored materials tiles</h4>
                  <div style={{ display: 'grid', gap: '0.65rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                    {storedMaterialTiles.map((tile) => (
                      <div key={tile.id} style={{ padding: '0.8rem', borderRadius: '10px', background: 'rgba(20,18,15,0.74)' }}>
                        <p style={{ margin: 0, color: '#9f8d68', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          {tile.category}
                        </p>
                        <h5 style={{ margin: '0.25rem 0 0.2rem', fontSize: '1rem' }}>{tile.name}</h5>
                        <p style={{ margin: 0, color: '#d7c5a1', fontSize: '0.9rem' }}>Quantity: {tile.quantity}</p>
                        <p style={{ margin: '0.15rem 0 0', color: tile.qualityColor, fontSize: '0.9rem' }}>
                          Quality: {tile.quality} ({tile.qualityScore})
                        </p>
                        <p style={{ margin: '0.15rem 0 0', color: '#9f8d68', fontSize: '0.8rem' }}>{tile.qualityReason}</p>
                        <p style={{ margin: '0.15rem 0 0', color: '#9f8d68', fontSize: '0.82rem' }}>{tile.location}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                  <label style={{ display: 'grid', gap: '0.3rem' }}>
                    <span style={{ color: '#d7c5a1' }}>Search inventory</span>
                    <input value={searchQuery} onChange={(event) => setSearchQuery((event.target as HTMLInputElement).value)} placeholder="Search by item name or owner..." style={{ padding: '0.7rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }} />
                  </label>
                  <label style={{ display: 'grid', gap: '0.3rem' }}>
                    <span style={{ color: '#d7c5a1' }}>Filter by category</span>
                    <select value={filterCategory} onChange={(event) => setFilterCategory((event.target as HTMLSelectElement).value as InventoryCategory | 'All')} style={{ padding: '0.7rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }}>
                      <option value="All">All categories</option>
                      <option value="Weapons">Weapons</option>
                      <option value="Ship Components">Ship Components</option>
                      <option value="Medical">Medical</option>
                      <option value="Mining">Mining</option>
                    </select>
                  </label>
                </div>

                <div style={{ display: 'grid', gap: '0.8rem' }}>
                  {Object.entries(groupedInventory)
                    .filter(([category]) => filterCategory === 'All' || category === filterCategory)
                    .filter(([, items]) => items.length > 0)
                    .map(([category, items]) => {
                      const filteredItems = items.filter(
                        (item) =>
                          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.owner.toLowerCase().includes(searchQuery.toLowerCase())
                      );
                      if (filteredItems.length === 0) return null;
                      return (
                        <div key={category} style={{ padding: '0.95rem', borderRadius: '12px', background: 'rgba(255,255,255,0.04)' }}>
                          <h4 style={{ margin: '0 0 0.6rem', color: '#c9832f' }}>{category}</h4>
                          <div style={{ display: 'grid', gap: '0.6rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                            {filteredItems.map((item) => (
                              <div key={item.id} style={{ padding: '0.9rem', borderRadius: '12px', background: 'linear-gradient(145deg, rgba(20,18,15,0.78), rgba(36,28,20,0.92))', border: '1px solid rgba(201,131,47,0.24)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                  <strong>{item.name}</strong>
                                  <button className="button button-secondary" type="button" onClick={() => startInventoryEdit(item)} style={{ padding: '0.35rem 0.7rem' }}>Edit</button>
                                </div>
                                <p style={{ margin: '0.35rem 0 0.25rem', color: '#d7c5a1' }}>Subcategory: {item.subcategory}</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', margin: '0.35rem 0 0.25rem' }}>
                                  <span style={{ background: 'rgba(8, 47, 73, 0.6)', color: '#c9832f', padding: '0.2rem 0.45rem', borderRadius: '999px', fontSize: '0.8rem' }}>Total {item.quantity}</span>
                                  <span style={{ background: 'rgba(120, 53, 15, 0.45)', color: '#e09a36', padding: '0.2rem 0.45rem', borderRadius: '999px', fontSize: '0.8rem' }}>Reserved {item.reservedQuantity}</span>
                                  <span style={{ background: 'rgba(20, 83, 45, 0.45)', color: '#d9a45a', padding: '0.2rem 0.45rem', borderRadius: '999px', fontSize: '0.8rem' }}>Available {Math.max((Number(item.quantity) || 0) - (Number(item.reservedQuantity) || 0), 0)}</span>
                                  {item.quality ? <span style={{ background: 'rgba(30, 41, 59, 0.7)', color: '#d7c5a1', padding: '0.2rem 0.45rem', borderRadius: '999px', fontSize: '0.8rem' }}>Quality {item.quality}</span> : null}
                                </div>
                                <p style={{ margin: '0.2rem 0 0', color: '#d7c5a1' }}>Stored: {item.location} • Owner: {item.owner}</p>
                                <p style={{ margin: '0.35rem 0 0', color: '#c9832f' }}>{item.aiVerdict}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>

                <div style={{ padding: '0.95rem', borderRadius: '12px', background: 'rgba(255,255,255,0.04)' }}>
                  <h4 style={{ margin: '0 0 0.6rem', color: '#c9832f' }}>Stock movement history</h4>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {stockMovements.slice(0, 10).map((movement) => (
                      <div key={movement.id} style={{ padding: '0.6rem', borderRadius: '8px', background: 'rgba(20,18,15,0.74)', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <strong style={{ color: movement.action === 'added' ? '#d9a45a' : movement.action === 'edited' ? '#c9832f' : '#fda4af' }}>
                            {movement.action.charAt(0).toUpperCase() + movement.action.slice(1)}
                          </strong>
                          <span style={{ color: '#9f8d68' }}>{movement.timestamp}</span>
                        </div>
                        <p style={{ margin: '0.2rem 0 0', color: '#d7c5a1' }}>
                          {movement.item} (Qty: {movement.quantity})
                        </p>
                        <p style={{ margin: '0.1rem 0 0', color: '#9f8d68', fontSize: '0.85rem' }}>
                          {movement.actor} • {movement.notes}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </StockPanel>
          ) : activeAdminTab === 'refinery' ? (
            <RefineryPanel>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'grid', gap: '0.8rem' }}>
                  <h4 style={{ margin: 0, color: '#c9832f' }}>Queued jobs ({refineryQueue.length})</h4>
                  {refineryQueue.length === 0 ? (
                    <p style={{ margin: 0, color: '#9f8d68' }}>No material jobs in refinery queue.</p>
                  ) : (
                    refineryQueue.map((job) => {
                      const inputQuantity = Number(job.quantity) || 0;
                      const projectedOutput = (inputQuantity * (refineryMethodYieldMultiplier[job.method] ?? 0.75)).toFixed(2);

                      return (
                        <div key={job.id} style={{ padding: '0.95rem', borderRadius: '12px', background: 'rgba(255,255,255,0.04)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <strong>{job.materialName} • {job.quantity} {job.unit}</strong>
                            <span style={{ color: '#e09a36' }}>Queued</span>
                          </div>
                          <p style={{ margin: '0.35rem 0 0.25rem', color: '#d7c5a1' }}>Submitted by: <strong>{job.member}</strong></p>
                          <p style={{ margin: '0 0 0.35rem', color: '#d7c5a1' }}>Input quality: <strong>{job.inputQuality}</strong></p>
                          <p style={{ margin: '0 0 0.35rem', color: '#9f8d68' }}>Created: {job.createdDate} • ETA: {job.expectedCompletion}</p>
                          <label style={{ display: 'grid', gap: '0.3rem', maxWidth: '360px' }}>
                            <span style={{ color: '#d7c5a1', fontSize: '0.9rem' }}>Refinery method</span>
                            <select
                              value={job.method}
                              onChange={(event) => updateRefineryJobMethod(job.id, (event.target as HTMLSelectElement).value as RefineryMethod)}
                              style={{ padding: '0.6rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }}
                            >
                              {refineryMethods.map((method) => (
                                <option key={method} value={method}>{method}</option>
                              ))}
                            </select>
                          </label>
                          <label style={{ display: 'grid', gap: '0.3rem', maxWidth: '360px' }}>
                            <span style={{ color: '#d7c5a1', fontSize: '0.9rem' }}>Output quality</span>
                            <select
                              value={job.outputQuality}
                              onChange={(event) => updateRefineryJobOutputQuality(job.id, (event.target as HTMLSelectElement).value)}
                              style={{ padding: '0.6rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }}
                            >
                              {refineryOutputQualityOptions.map((quality) => (
                                <option key={quality} value={quality}>{quality}</option>
                              ))}
                            </select>
                          </label>
                          <p style={{ margin: '0.35rem 0 0', color: '#c9832f', fontSize: '0.9rem' }}>
                            Projected refined output: {projectedOutput} SCU
                          </p>
                          <button className="button button-primary" type="button" onClick={() => completeRefineryJob(job)} style={{ marginTop: '0.6rem', padding: '0.35rem 0.7rem' }}>
                            Complete refinery job
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                <div style={{ display: 'grid', gap: '0.8rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                  <h4 style={{ margin: 0, color: '#c9832f' }}>Completed refinery jobs ({completedRefineryJobs.length})</h4>
                  {completedRefineryJobs.length === 0 ? (
                    <p style={{ margin: 0, color: '#9f8d68' }}>No completed refinery jobs yet.</p>
                  ) : (
                    completedRefineryJobs.slice(-8).reverse().map((job) => (
                      <div key={job.id} style={{ padding: '0.95rem', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', opacity: 0.85 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <strong>{job.materialName} • {job.quantity} {job.unit}</strong>
                          <span style={{ color: '#d9a45a' }}>Completed</span>
                        </div>
                        <p style={{ margin: '0.3rem 0 0', color: '#9f8d68', fontSize: '0.88rem' }}>
                          Method: {job.method} • Input: {job.inputQuality} • Output: {job.outputQuality}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </RefineryPanel>
          ) : activeAdminTab === 'fulfillment' ? (
            <TicketsPanel>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'grid', gap: '0.8rem' }}>
                  <h4 style={{ margin: 0, color: '#c9832f' }}>Pending receiving ({receivingTickets.filter((t) => t.status === 'pending').length})</h4>
                  {receivingTickets.filter((t) => t.status === 'pending').length === 0 ? (
                    <p style={{ margin: 0, color: '#9f8d68' }}>No pending receiving tickets.</p>
                  ) : (
                    receivingTickets.filter((t) => t.status === 'pending').map((ticket) => (
                      <div key={ticket.id} style={{ padding: '0.95rem', borderRadius: '12px', background: 'rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <strong>{ticket.material}</strong>
                          <span style={{ color: '#e09a36' }}>Pending intake</span>
                        </div>
                        <p style={{ margin: '0.35rem 0 0.25rem', color: '#d7c5a1' }}>Member: <strong>{ticket.member}</strong></p>
                        <p style={{ margin: '0.35rem 0 0.25rem', color: '#d7c5a1' }}>{ticket.offerTitle}</p>
                        <div style={{ display: 'grid', gap: '0.2rem', marginBottom: '0.25rem' }}>
                          {ticket.lineItems.map((lineItem) => (
                            <p key={lineItem.id} style={{ margin: 0, color: '#d7c5a1', fontSize: '0.88rem' }}>
                              {formatLineItemSummary(lineItem)}
                            </p>
                          ))}
                        </div>
                        <p style={{ margin: 0, color: '#9f8d68', fontSize: '0.9rem' }}>Created: {ticket.createdDate}</p>
                        <button className="button button-primary" type="button" onClick={() => completeReceivingTicket(ticket)} style={{ marginTop: '0.6rem', padding: '0.35rem 0.7rem' }}>Mark intake complete</button>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ display: 'grid', gap: '0.8rem' }}>
                  <h4 style={{ margin: 0, color: '#c9832f' }}>Pending fulfillment ({fulfillmentTickets.filter((t) => t.status === 'pending').length})</h4>
                  {fulfillmentTickets.filter((t) => t.status === 'pending').length === 0 ? (
                    <p style={{ margin: 0, color: '#9f8d68' }}>No pending fulfillment tickets.</p>
                  ) : (
                    fulfillmentTickets.filter((t) => t.status === 'pending').map((ticket) => (
                      <div key={ticket.id} style={{ padding: '0.95rem', borderRadius: '12px', background: 'rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <strong>{ticket.material}</strong>
                          <span style={{ color: '#e09a36' }}>Pending</span>
                        </div>
                        <p style={{ margin: '0.35rem 0 0.25rem', color: '#d7c5a1' }}>Member: <strong>{ticket.member}</strong></p>
                        <p style={{ margin: '0.35rem 0 0.25rem', color: '#d7c5a1' }}>{ticket.requestTitle}</p>
                        <div style={{ display: 'grid', gap: '0.2rem', marginBottom: '0.25rem' }}>
                          {ticket.lineItems.map((lineItem) => (
                            <p key={lineItem.id} style={{ margin: 0, color: '#d7c5a1', fontSize: '0.88rem' }}>
                              {formatLineItemSummary(lineItem)}
                            </p>
                          ))}
                        </div>
                        <p style={{ margin: 0, color: '#9f8d68', fontSize: '0.9rem' }}>Created: {ticket.createdDate} • Expected delivery: {ticket.expectedDelivery}</p>
                        <p style={{ margin: '0.2rem 0 0', color: '#c9832f', fontSize: '0.88rem' }}>
                          Ticket coverage: {(() => {
                            const requested = sumLineItemsQuantity(ticket.lineItems);
                            const reserved = ticket.reservations.reduce((acc, reservation) => acc + (Number(reservation.quantity) || 0), 0);
                            const coverage = requested > 0 ? Math.min(100, (reserved / requested) * 100) : 0;
                            return `${coverage.toFixed(0)}% reserved`;
                          })()}
                        </p>
                        <div style={{ display: 'grid', gap: '0.15rem', marginTop: '0.3rem' }}>
                          {ticket.reservations.map((reservation, index) => (
                            <p key={`${ticket.id}-${index}`} style={{ margin: 0, color: '#d7c5a1', fontSize: '0.82rem' }}>
                              Reservation: {reservation.stockItemName} • Qty {reservation.quantity} • {reservation.stockItemId ? 'Linked' : 'Unmatched'}
                            </p>
                          ))}
                        </div>
                        <button className="button button-primary" type="button" onClick={() => completeFulfillmentTicket(ticket)} style={{ marginTop: '0.6rem', padding: '0.35rem 0.7rem' }}>Mark as complete</button>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ display: 'grid', gap: '0.8rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                  <h4 style={{ margin: 0, color: '#c9832f' }}>Archive ({archivedTickets.length + archivedReceivingTickets.length})</h4>
                  {archivedTickets.length === 0 && archivedReceivingTickets.length === 0 ? (
                    <p style={{ margin: 0, color: '#9f8d68' }}>No archived tickets yet.</p>
                  ) : (
                    [...archivedTickets, ...archivedReceivingTickets].map((ticket) => (
                      <div key={ticket.id} style={{ padding: '0.95rem', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', opacity: 0.8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <strong>{ticket.material}</strong>
                          <span style={{ color: '#d9a45a' }}>Completed</span>
                        </div>
                        <p style={{ margin: '0.35rem 0 0.25rem', color: '#d7c5a1' }}>Member: <strong>{ticket.member}</strong></p>
                        {'requestTitle' in ticket ? (
                          <p style={{ margin: 0, color: '#9f8d68', fontSize: '0.9rem' }}>Created: {ticket.createdDate} • Expected: {ticket.expectedDelivery}</p>
                        ) : (
                          <p style={{ margin: 0, color: '#9f8d68', fontSize: '0.9rem' }}>Created: {ticket.createdDate} • Completed: {ticket.completedDate}</p>
                        )}
                        <div style={{ display: 'grid', gap: '0.2rem', marginTop: '0.25rem' }}>
                          {ticket.lineItems.map((lineItem) => (
                            <p key={lineItem.id} style={{ margin: 0, color: '#9f8d68', fontSize: '0.84rem' }}>
                              {formatLineItemSummary(lineItem)}
                            </p>
                          ))}
                        </div>
                        {'stockItemName' in ticket ? (
                          <p style={{ margin: '0.25rem 0 0', color: '#9f8d68', fontSize: '0.85rem' }}>Stock item: {ticket.stockItemName}</p>
                        ) : (
                          <p style={{ margin: '0.25rem 0 0', color: '#9f8d68', fontSize: '0.85rem' }}>Flow: Receiving ticket</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TicketsPanel>
          ) : null}
        </div>
      </section>
    );
  }

  // MEMBER PORTAL
  return (
    <section className="card" style={{ padding: '1.25rem', marginTop: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <p style={{ textTransform: 'uppercase', letterSpacing: '0.24em', color: '#c9832f', fontSize: '0.78rem', marginBottom: '0.35rem' }}>Member portal</p>
          <h2 style={{ margin: 0 }}>Contribute stock or request items</h2>
        </div>
        <div style={{ color: '#d7c5a1', fontSize: '0.95rem' }}>
          Your submissions will be reviewed by org admins
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
        {requestMessage ? (
          <div style={{ padding: '0.85rem 1rem', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.14)', color: '#f3d19a' }}>
            {requestMessage}
          </div>
        ) : null}

        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))' }}>
          <form onSubmit={submitOffer} style={{ display: 'grid', gap: '0.75rem', padding: '1rem', borderRadius: '16px', background: 'rgba(255,255,255,0.04)' }}>
            <h3 style={{ margin: 0 }}>Give stock to the org</h3>
            <label style={{ display: 'grid', gap: '0.3rem' }}>
              <span style={{ color: '#d7c5a1' }}>What are you giving?</span>
              <textarea value={offerTitle} onChange={(event) => setOfferTitle((event.target as HTMLTextAreaElement).value)} rows={3} style={{ padding: '0.7rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }} />
            </label>
            <div style={{ display: 'grid', gap: '0.6rem' }}>
              {offerLineItems.map((lineItem, index) => (
                <div key={lineItem.id} style={{ padding: '0.7rem', borderRadius: '10px', background: 'rgba(20,18,15,0.68)', display: 'grid', gap: '0.55rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.92rem' }}>Delivery line {index + 1}</strong>
                    <button className="button button-secondary" type="button" onClick={() => removeLineItem('offer', lineItem.id)} style={{ padding: '0.25rem 0.55rem' }} disabled={offerLineItems.length === 1}>Remove</button>
                  </div>
                  <div style={{ display: 'grid', gap: '0.55rem', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                    <label style={{ display: 'grid', gap: '0.28rem' }}>
                      <span style={{ color: '#d7c5a1' }}>Category</span>
                      <select value={lineItem.category} onChange={(event) => updateLineItemField('offer', lineItem.id, 'category', (event.target as HTMLSelectElement).value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }}>
                        {submissionCategories.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </label>
                    <label style={{ display: 'grid', gap: '0.28rem' }}>
                      <span style={{ color: '#d7c5a1' }}>Subcategory</span>
                      <select value={lineItem.subcategory} onChange={(event) => updateLineItemField('offer', lineItem.id, 'subcategory', (event.target as HTMLSelectElement).value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }}>
                        {categorySubcategories[lineItem.category].map((subcategory) => (
                          <option key={subcategory} value={subcategory}>{subcategory}</option>
                        ))}
                      </select>
                    </label>
                    <label style={{ display: 'grid', gap: '0.28rem' }}>
                      <span style={{ color: '#d7c5a1' }}>Item / material</span>
                      <input
                        list="submission-item-options"
                        value={lineItem.name}
                        onChange={(event) => updateLineItemField('offer', lineItem.id, 'name', (event.target as HTMLInputElement).value)}
                        placeholder={lineItem.entryMethod === 'catalog' ? 'Start typing for matches' : 'Enter item name manually'}
                        style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }}
                      />
                    </label>
                    <label style={{ display: 'grid', gap: '0.28rem' }}>
                      <span style={{ color: '#d7c5a1' }}>Entry method</span>
                      <select value={lineItem.entryMethod} onChange={(event) => updateLineItemField('offer', lineItem.id, 'entryMethod', (event.target as HTMLSelectElement).value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }}>
                        <option value="catalog">Catalog match</option>
                        <option value="manual">Manual free entry</option>
                      </select>
                    </label>
                    <label style={{ display: 'grid', gap: '0.28rem' }}>
                      <span style={{ color: '#d7c5a1' }}>{getLineItemQuantityLabel(lineItem)}</span>
                      <input type="number" min="0.01" step="0.01" value={lineItem.quantity} onChange={(event) => updateLineItemField('offer', lineItem.id, 'quantity', (event.target as HTMLInputElement).value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }} />
                    </label>
                    <label style={{ display: 'grid', gap: '0.28rem' }}>
                      <span style={{ color: '#d7c5a1' }}>{getLineItemUnitLabel(lineItem)}</span>
                      <input value={lineItem.unit} placeholder={getLineItemUnitPlaceholder(lineItem)} onChange={(event) => updateLineItemField('offer', lineItem.id, 'unit', (event.target as HTMLInputElement).value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }} />
                    </label>
                    <label style={{ display: 'grid', gap: '0.28rem' }}>
                      <span style={{ color: '#d7c5a1' }}>{getLineItemQualityLabel(lineItem)}</span>
                      {lineItem.category === 'Materials' ? (
                        <select value={lineItem.quality} onChange={(event) => updateLineItemField('offer', lineItem.id, 'quality', (event.target as HTMLSelectElement).value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }}>
                          <option value="">Select ore quality</option>
                          {oreQualityOptions.map((quality) => (
                            <option key={quality} value={quality}>{quality}</option>
                          ))}
                        </select>
                      ) : (
                        <input value={lineItem.quality} placeholder="Factory new / used / damaged" onChange={(event) => updateLineItemField('offer', lineItem.id, 'quality', (event.target as HTMLInputElement).value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }} />
                      )}
                    </label>
                    <label style={{ display: 'grid', gap: '0.28rem', gridColumn: '1 / -1' }}>
                      <span style={{ color: '#d7c5a1' }}>Details (variant / manufacturer / notes)</span>
                      <input value={lineItem.details} onChange={(event) => updateLineItemField('offer', lineItem.id, 'details', (event.target as HTMLInputElement).value)} placeholder="Example: Behring P4-AR, Size 2, Grade A" style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }} />
                    </label>
                  </div>
                </div>
              ))}
              <button className="button button-secondary" type="button" onClick={() => addLineItem('offer')} style={{ justifySelf: 'start', padding: '0.35rem 0.7rem' }}>Add delivered line item</button>
            </div>
            <label style={{ display: 'grid', gap: '0.3rem' }}>
              <span style={{ color: '#d7c5a1' }}>Notes</span>
              <textarea value={offerNote} onChange={(event) => setOfferNote((event.target as HTMLTextAreaElement).value)} rows={2} style={{ padding: '0.7rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }} />
            </label>
            <label style={{ display: 'grid', gap: '0.3rem' }}>
              <span style={{ color: '#d7c5a1' }}>Upload screenshot</span>
              <input type="file" accept="image/*" onChange={(event) => setOfferScreenshotName(event.target.files?.[0]?.name ?? 'No screenshot selected')} style={{ padding: '0.4rem 0', color: 'white' }} />
              <span style={{ color: '#9f8d68', fontSize: '0.9rem' }}>Selected: {offerScreenshotName}</span>
            </label>
            <button className="button button-primary" type="submit" style={{ justifySelf: 'start' }}>Submit stock offer</button>
          </form>

          <form onSubmit={submitRequest} style={{ display: 'grid', gap: '0.75rem', padding: '1rem', borderRadius: '16px', background: 'rgba(255,255,255,0.04)' }}>
            <h3 style={{ margin: 0 }}>Request stock from the org</h3>
            <label style={{ display: 'grid', gap: '0.3rem' }}>
              <span style={{ color: '#d7c5a1' }}>What do you need?</span>
              <textarea value={requestTitle} onChange={(event) => setRequestTitle((event.target as HTMLTextAreaElement).value)} rows={3} style={{ padding: '0.7rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }} />
            </label>
            <div style={{ display: 'grid', gap: '0.6rem' }}>
              {requestLineItems.map((lineItem, index) => (
                <div key={lineItem.id} style={{ padding: '0.7rem', borderRadius: '10px', background: 'rgba(20,18,15,0.68)', display: 'grid', gap: '0.55rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.92rem' }}>Request line {index + 1}</strong>
                    <button className="button button-secondary" type="button" onClick={() => removeLineItem('request', lineItem.id)} style={{ padding: '0.25rem 0.55rem' }} disabled={requestLineItems.length === 1}>Remove</button>
                  </div>
                  <div style={{ display: 'grid', gap: '0.55rem', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                    <label style={{ display: 'grid', gap: '0.28rem' }}>
                      <span style={{ color: '#d7c5a1' }}>Category</span>
                      <select value={lineItem.category} onChange={(event) => updateLineItemField('request', lineItem.id, 'category', (event.target as HTMLSelectElement).value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }}>
                        {submissionCategories.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </label>
                    <label style={{ display: 'grid', gap: '0.28rem' }}>
                      <span style={{ color: '#d7c5a1' }}>Subcategory</span>
                      <select value={lineItem.subcategory} onChange={(event) => updateLineItemField('request', lineItem.id, 'subcategory', (event.target as HTMLSelectElement).value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }}>
                        {categorySubcategories[lineItem.category].map((subcategory) => (
                          <option key={subcategory} value={subcategory}>{subcategory}</option>
                        ))}
                      </select>
                    </label>
                    <label style={{ display: 'grid', gap: '0.28rem' }}>
                      <span style={{ color: '#d7c5a1' }}>Item / material</span>
                      <input
                        list="submission-item-options"
                        value={lineItem.name}
                        onChange={(event) => updateLineItemField('request', lineItem.id, 'name', (event.target as HTMLInputElement).value)}
                        placeholder={lineItem.entryMethod === 'catalog' ? 'Start typing for matches' : 'Enter item name manually'}
                        style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }}
                      />
                    </label>
                    <label style={{ display: 'grid', gap: '0.28rem' }}>
                      <span style={{ color: '#d7c5a1' }}>Entry method</span>
                      <select value={lineItem.entryMethod} onChange={(event) => updateLineItemField('request', lineItem.id, 'entryMethod', (event.target as HTMLSelectElement).value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }}>
                        <option value="catalog">Catalog match</option>
                        <option value="manual">Manual free entry</option>
                      </select>
                    </label>
                    <label style={{ display: 'grid', gap: '0.28rem' }}>
                      <span style={{ color: '#d7c5a1' }}>{getLineItemQuantityLabel(lineItem)}</span>
                      <input type="number" min="0.01" step="0.01" value={lineItem.quantity} onChange={(event) => updateLineItemField('request', lineItem.id, 'quantity', (event.target as HTMLInputElement).value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }} />
                    </label>
                    <label style={{ display: 'grid', gap: '0.28rem' }}>
                      <span style={{ color: '#d7c5a1' }}>{getLineItemUnitLabel(lineItem)}</span>
                      <input value={lineItem.unit} placeholder={getLineItemUnitPlaceholder(lineItem)} onChange={(event) => updateLineItemField('request', lineItem.id, 'unit', (event.target as HTMLInputElement).value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }} />
                    </label>
                    <label style={{ display: 'grid', gap: '0.28rem' }}>
                      <span style={{ color: '#d7c5a1' }}>{getLineItemQualityLabel(lineItem)}</span>
                      {lineItem.category === 'Materials' ? (
                        <select value={lineItem.quality} onChange={(event) => updateLineItemField('request', lineItem.id, 'quality', (event.target as HTMLSelectElement).value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }}>
                          <option value="">Select ore quality</option>
                          {oreQualityOptions.map((quality) => (
                            <option key={quality} value={quality}>{quality}</option>
                          ))}
                        </select>
                      ) : (
                        <input value={lineItem.quality} placeholder="Factory new / used / damaged" onChange={(event) => updateLineItemField('request', lineItem.id, 'quality', (event.target as HTMLInputElement).value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }} />
                      )}
                    </label>
                    <label style={{ display: 'grid', gap: '0.28rem', gridColumn: '1 / -1' }}>
                      <span style={{ color: '#d7c5a1' }}>Details (variant / manufacturer / notes)</span>
                      <input value={lineItem.details} onChange={(event) => updateLineItemField('request', lineItem.id, 'details', (event.target as HTMLInputElement).value)} placeholder="Example: Behring P4-AR, Size 2, Grade A" style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }} />
                    </label>
                  </div>
                </div>
              ))}
              <button className="button button-secondary" type="button" onClick={() => addLineItem('request')} style={{ justifySelf: 'start', padding: '0.35rem 0.7rem' }}>Add requested line item</button>
            </div>
            <label style={{ display: 'grid', gap: '0.3rem' }}>
              <span style={{ color: '#d7c5a1' }}>Why do you need it?</span>
              <textarea value={requestNote} onChange={(event) => setRequestNote((event.target as HTMLTextAreaElement).value)} rows={2} style={{ padding: '0.7rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }} />
            </label>
            <button className="button button-secondary" type="submit" style={{ justifySelf: 'start' }}>Submit stock request</button>
          </form>
        </div>

        <datalist id="submission-item-options">
          {activeCatalogEntries.map((entry) => (
            <option key={`${entry.category}-${entry.subcategory}-${entry.name}`} value={entry.name} label={`${entry.category} > ${entry.subcategory}`} />
          ))}
        </datalist>
      </div>
    </section>
  );
}
