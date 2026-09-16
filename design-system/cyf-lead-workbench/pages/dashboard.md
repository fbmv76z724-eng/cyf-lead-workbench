# Dashboard Page Overrides

This file overrides `MASTER.md` for the workbench dashboard.

## Purpose

Show the daily operating picture and route the user to the leads that need action.

## Layout

- Desktop: fixed left navigation, page header, six KPI cards, funnel chart, seven-day trend chart, sync-health panel, recent leads table.
- Mobile: top title, horizontally scrollable KPI strip with stable card widths, stacked charts, compact recent-lead cards, fixed bottom navigation.
- Keep the first screen focused on operational data. Do not add a hero, illustration, or explanatory marketing section.

## KPI Cards

- Today inflow
- Waiting for call
- Called today
- Connected today
- Offline leads waiting
- Sync issues

Each card must show:

- Label
- Primary value
- Short comparison or context line
- Optional click target that applies the corresponding lead filter

## Charts

- Use a funnel or stage bar chart for the call funnel.
- Use a line or area chart for the seven-day inflow and call trend.
- Include a visible text summary and data table fallback.
- Do not use gradients as the only way to distinguish stages.

## Empty and Error States

- Loading: stable skeletons matching final card and chart dimensions.
- Empty: one concise message and the relevant primary action.
- Sync error: show error summary, last successful sync, and a retry action.

