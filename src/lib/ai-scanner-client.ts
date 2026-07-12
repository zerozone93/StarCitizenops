export type LogisticsAiContext = 'offer' | 'request' | 'inventory';

export type LogisticsAiLineItem = {
  category: string;
  subcategory: string;
  name: string;
  quantity: string;
  unit: string;
};

export type LogisticsAiPayload = {
  context: LogisticsAiContext;
  hasScreenshot: boolean;
  title?: string;
  materialName?: string;
  category?: string;
  lineItems?: LogisticsAiLineItem[];
  note?: string;
};

export const requestLogisticsAiVerdict = async (
  payload: LogisticsAiPayload,
  fallbackVerdict: string
): Promise<string> => {
  try {
    const response = await fetch('/api/logistics/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return fallbackVerdict;
    }

    const data = (await response.json()) as { verdict?: string };
    return data.verdict || fallbackVerdict;
  } catch {
    return fallbackVerdict;
  }
};
