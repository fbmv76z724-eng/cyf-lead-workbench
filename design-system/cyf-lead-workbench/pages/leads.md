# Leads Page Overrides

This file overrides `MASTER.md` for lead list and lead detail screens.

## Purpose

Find a lead quickly, inspect its current state, and save a call or follow-up record.

## Layout

- Desktop: page header, compact filter bar, data table, sticky pagination.
- Mobile: page header, filter sheet trigger, lead cards, sticky bottom navigation.
- Put the sync state beside each lead's latest activity rather than in a separate decorative badge cluster.

## Table and Cards

- Desktop table columns: lead identity, city and area, stage, latest call, intent, latest follow-up, sync state, actions.
- Mobile card lines: driver ID and masked phone, city and area, latest call and intent, sync state, follow-up action.
- Never rely on hover to reveal the only action.

## Detail Drawer

- Header: driver identity, source, current sync state, close button.
- Sections: base information, latest state, call history, remote flow history, conflict notice.
- The call form uses visible labels, inline validation, a loading submit state, and an explicit success or failure result.
- Full phone number remains masked until the user activates the view action.

## Accessibility

- Filters use native selects and buttons with accessible names.
- Table headers use proper `th` semantics.
- Drawer focus moves to its heading on open, is trapped while open, and returns to the trigger on close.
- Icon-only controls have text alternatives.

